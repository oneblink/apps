import { Task } from '@oneblink/types/typescript/scheduledTasks'
import tenants from './tenants'
import Sentry from './Sentry'
import { HTTPError, getRequest } from './services/fetch'
import { isOffline } from './offline-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'

/**
 * Obtain all of the related Tasks for a specific Forms App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const Tasks = await getTasksForFormsApp(formsAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */

export async function getTasksForFormsApp(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<{ overdueTasks: Task[]; tasks: Task[] }> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/scheduled-tasks`
  try {
    return await getRequest<{ overdueTasks: Task[]; tasks: Task[] }>(
      url,
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local version of these scheduled tasks, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the forms app you are looking for. Please contact support if the problem persists.',
          {
            originalError: error,
            title: 'Unknown Forms App',
            httpStatusCode: error.status,
          },
        )
      }
      default: {
        throw new OneBlinkAppsError(
          'An unknown error has occurred. Please contact support if the problem persists.',
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
    }
  }
}
