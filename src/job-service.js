// @flow
'use strict'

import _orderBy from 'lodash.orderby'

import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import recentlySubmittedJobsService from './services/recently-submitted-jobs'
import { searchRequest } from './services/fetch'
import { getPendingQueueSubmissions } from './services/pending-queue'
import { ensurePrefillFormDataExists } from './services/job-prefill'
import { isOffline } from './offline-service'
import { isLoggedIn } from './auth-service'
import { getDrafts } from './draft-service'

async function removePendingSubmissions(jobList) {
  // Get list of pending submissions, remove jobs that are in the pending queue
  return getPendingQueueSubmissions().then((submissions) => {
    const unprocessedJobs = jobList.filter(
      (job) => !submissions.some((sub) => sub.jobId === job.id)
    )
    return unprocessedJobs
  })
}

async function tagDrafts(jobList) {
  return getDrafts().then((drafts) =>
    jobList.map((job) => {
      job.draft = drafts.find((draft) => draft.jobId === job.id)
      return job
    })
  )
}

export async function getJobs(
  formsAppId /* : number */,
  jobsLabel /* : string */
) /* : Promise<FormsAppJob[]> */ {
  if (!isLoggedIn()) {
    return []
  }

  return searchRequest(`/forms-apps/${formsAppId}/jobs`, {
    isSubmitted: false,
  })
    .then((data) => {
      const recentlySubmittedJobIds = recentlySubmittedJobsService.get()
      // Remove recently submitted jobs ids that have not been returned from the server
      const updateJobIds = recentlySubmittedJobIds.filter(
        (recentlySubmittedJobId) => {
          return data.jobs.some((job) => job.id === recentlySubmittedJobId)
        }
      )
      if (updateJobIds.length !== recentlySubmittedJobIds) {
        recentlySubmittedJobsService.set(updateJobIds)
      }
      // Filter out jobs that have been recently submitted but are still being returned
      // from the server. This will happen if the S3 Submission Events have not finished yet.
      return data.jobs.filter((job) => {
        return !recentlySubmittedJobIds.some(
          (recentlySubmittedJobId) => recentlySubmittedJobId === job.id
        )
      })
    })
    .then((jobs) => removePendingSubmissions(jobs))
    .then((jobs) => tagDrafts(jobs))
    .then((jobList) =>
      _orderBy(
        jobList,
        ['details.priority', (job) => Date.parse(job.createdAt)],
        ['asc', 'asc']
      )
    )
    .catch((error) => {
      console.warn('Error retrieving Jobs for forms app', error)

      if (isOffline()) {
        throw new OneBlinkAppsError(
          'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
          {
            originalError: error,
            isOffline: true,
          }
        )
      }

      switch (error.status) {
        case 401: {
          throw new OneBlinkAppsError(
            `You need to log in to see your ${jobsLabel}. Please contact your administrator to gain credentials for access.`,
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.status,
            }
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            `You have not been granted access to ${jobsLabel}. Please contact your administrator to gain the correct level of access.`,
            {
              originalError: error,
              requiresAccessRequest: true,
              httpStatusCode: error.status,
            }
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the application you are looking for. Please contact your administrator to ensure your application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              httpStatusCode: error.status,
            }
          )
        }
        default: {
          throw new OneBlinkAppsError(
            'An unknown error has occurred. Please contact support if the problem persists.',
            {
              originalError: error,
            }
          )
        }
      }
    })
}

export { ensurePrefillFormDataExists }
