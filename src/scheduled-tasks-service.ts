import { ScheduledTasksTypes, FormsAppsTypes } from '@oneblink/types'
import tenants from './tenants'
import Sentry from './Sentry'
import { HTTPError, getRequest, postRequest } from './services/fetch'
import { isOffline } from './offline-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'

export type TaskResponse = {
  task: ScheduledTasksTypes.Task
  actions: ScheduledTasksTypes.TaskAction[]
  daysAvailable: number
}

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
): Promise<{
  tasks: TaskResponse[]
}> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/scheduled-tasks`
  try {
    return await getRequest<{
      tasks: TaskResponse[]
    }>(url, abortSignal)
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
export async function getTaskGroupInstancesForFormsApp(
  formsAppId: number,
  abortSignal?: AbortSignal,
): Promise<{
  instances: Array<TaskResponse & FormsAppsTypes.TaskGroupInstance>
}> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/scheduled-task-group-instances`
  try {
    return await getRequest<{
      instances: Array<TaskResponse & FormsAppsTypes.TaskGroupInstance>
    }>(url, abortSignal)
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

/**
 * Complete the related Task for a specific Forms App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const taskId = 2
 * const completedTask = await scheduledTasksService.completeTask({
 *   formsAppId,
 *   taskId,
 * })
 * ```
 *
 * @param options
 * @returns
 */
export async function completeTask({
  formsAppId,
  taskId,
  abortSignal,
}: {
  formsAppId: number
  taskId: number
  abortSignal?: AbortSignal
}): Promise<ScheduledTasksTypes.CompletedTask> {
  const url = `${tenants.current.apiOrigin}/completed-tasks`
  try {
    return await postRequest<ScheduledTasksTypes.CompletedTask>(
      url,
      { formsAppId, taskId },
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to complete this task. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
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
