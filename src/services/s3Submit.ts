import { Upload } from '@aws-sdk/lib-storage'
import { PutObjectCommandInput, S3 } from '@aws-sdk/client-s3'
import { fileUploadService } from '@oneblink/sdk-core'
import queryString from 'query-string'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import {
  AWSTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import Sentry from '../Sentry'

declare global {
  interface Window {
    cordova: unknown
    device: {
      cordova: boolean
      model: string
      platform: string
      uuid: string
      version: string
      manufacturer: string
      isVirtual: boolean
      serial: string
    }
  }
}

export type UploadAttachmentConfiguration = {
  fileName: string
  contentType?: string
  isPrivate: boolean
  data: Blob
}

export type ProgressListenerEvent = { progress: number; total: number }
export type ProgressListener = (progress: ProgressListenerEvent) => void

function getDeviceInformation(): SubmissionTypes.S3SubmissionDataDevice {
  if (window.cordova) {
    const deviceInformation: SubmissionTypes.S3SubmissionDataDevice = {
      type: 'CORDOVA',
    }
    if (!window.device) {
      return deviceInformation
    }
    return {
      type: deviceInformation.type,
      cordova: window.device.cordova,
      model: window.device.model,
      platform: window.device.platform,
      uuid: window.device.uuid,
      version: window.device.version,
      manufacturer: window.device.manufacturer,
      isVirtual: window.device.isVirtual,
      serial: window.device.serial,
    }
  }

  const isInstalledAsPWA = window.matchMedia(
    '(display-mode: standalone)',
  ).matches
  return {
    type: isInstalledAsPWA ? 'PWA' : 'BROWSER',
    appCodeName: window.navigator.appCodeName,
    appName: window.navigator.appName,
    appVersion: window.navigator.appVersion,
    cookieEnabled: window.navigator.cookieEnabled,
    hardwareConcurrency: window.navigator.hardwareConcurrency,
    language: window.navigator.language,
    maxTouchPoints: window.navigator.maxTouchPoints,
    platform: window.navigator.platform,
    userAgent: window.navigator.userAgent,
    vendor: window.navigator.vendor,
    vendorSub: window.navigator.vendorSub,
    webdriver: window.navigator.webdriver,
  }
}

const getS3Client = (s3ObjectCredentials: AWSTypes.S3ObjectCredentials) => {
  return new S3({
    region: s3ObjectCredentials.s3.region,
    credentials: {
      accessKeyId: s3ObjectCredentials.credentials.AccessKeyId,
      secretAccessKey: s3ObjectCredentials.credentials.SecretAccessKey,
      sessionToken: s3ObjectCredentials.credentials.SessionToken,
    },
  })
}
const getObjectMeta = (
  s3Meta: AWSTypes.S3ObjectCredentials['s3'],
): PutObjectCommandInput => ({
  ServerSideEncryption: 'AES256',
  Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Max 1 year
  CacheControl: 'max-age=31536000', // Max 1 year(365 days),
  Bucket: s3Meta.bucket,
  Key: s3Meta.key,
  ACL: 'private',
})

async function uploadToS3({
  s3Configuration,
  putObjectRequest,
  abortSignal,
  onProgress,
  retryAttempt,
}: {
  s3Configuration: AWSTypes.S3ObjectCredentials
  putObjectRequest: PutObjectCommandInput
  abortSignal?: AbortSignal
  onProgress?: ProgressListener
  retryAttempt?: number
}) {
  try {
    const s3Client = getS3Client(s3Configuration)
    let queueSize = 1 // default to 1 as the lowest common denominator
    if (
      window.navigator &&
      window.navigator.connection &&
      // @ts-expect-error effectiveType prop is still in draft
      window.navigator.connection.effectiveType
    ) {
      // @ts-expect-error effectiveType prop is still in draft
      switch (window.navigator.connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          queueSize = 1
          break
        case '3g':
          queueSize = 2
          break
        case '4g':
          queueSize = 10
          break
      }
    }
    console.log('Starting managedUpload with queueSize ', queueSize)
    const managedUpload = new Upload({
      client: s3Client,
      params: putObjectRequest,
      partSize: 5 * 1024 * 1024,
      queueSize,
      //Related github issue: https://github.com/aws/aws-sdk-js-v3/issues/2311
      //This is a variable that is set to false by default, setting it to true
      //means that it will force the upload to fail when one part fails on
      //an upload. The S3 client has built in retry logic to retry uploads by default
      leavePartsOnError: true,
    })

    managedUpload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.total) {
        const percent = ((progress.loaded || 0) / progress.total) * 100
        onProgress({ progress: Math.floor(percent), total: 100 })
      }
    })

    abortSignal?.addEventListener('abort', () => {
      managedUpload.abort()
    })

    await managedUpload.done()
  } catch (err) {
    if (abortSignal?.aborted) {
      return
    }

    console.error(`Upload failed for attempt ${retryAttempt} with error`, err)
    Sentry.captureException(err)
    // handle storing in s3 errors here
    if (!retryAttempt || retryAttempt < 3) {
      retryAttempt = retryAttempt ? retryAttempt + 1 : 1
      await uploadToS3({
        s3Configuration,
        putObjectRequest,
        abortSignal,
        onProgress,
        retryAttempt,
      })
      return
    }
    throw new OneBlinkAppsError(
      'We encountered a network related issue. Please ensure you are connected to the internet before trying again. If the problem persists, contact your administrator.',
      {
        title: 'Connectivity Issues',
        originalError: err as Error,
        isOffline: true,
      },
    )
  }
}

async function uploadFormSubmission({
  s3Configuration,
  formJson,
  tags,
  onProgress,
}: {
  s3Configuration: AWSTypes.S3ObjectCredentials
  formJson: SubmissionTypes.S3SubmissionData
  tags: SubmissionEventTypes.S3SubmissionTags
  onProgress?: ProgressListener
}) {
  console.log('Uploading submission')

  const putObjectRequest = getObjectMeta(s3Configuration.s3)
  putObjectRequest.Body = JSON.stringify({
    ...formJson,
    device: getDeviceInformation(),
  })
  putObjectRequest.Tagging =
    queryString.stringify(tags, {
      skipEmptyString: true,
      skipNull: true,
    }) || undefined
  putObjectRequest.ContentType = 'application/json'

  await uploadToS3({ s3Configuration, putObjectRequest, onProgress })
}

async function uploadAttachment({
  s3Configuration,
  fileConfiguration,
  abortSignal,
  onProgress,
}: {
  s3Configuration: AWSTypes.S3ObjectCredentials
  fileConfiguration: UploadAttachmentConfiguration
  abortSignal: AbortSignal | undefined
  onProgress?: ProgressListener
}) {
  const putObjectRequest = getObjectMeta(s3Configuration.s3)
  putObjectRequest.Body = fileConfiguration.data
  putObjectRequest.ContentType = fileConfiguration.contentType
  putObjectRequest.ContentDisposition = fileUploadService.getContentDisposition(
    fileConfiguration.fileName,
  )
  if (!fileConfiguration.isPrivate) {
    putObjectRequest.ACL = 'public-read'
  }

  await uploadToS3({
    s3Configuration,
    putObjectRequest,
    abortSignal,
    onProgress,
  })
}

async function downloadS3Data<T>(
  s3ObjectCredentials: AWSTypes.S3ObjectCredentials,
): Promise<T> {
  const s3 = getS3Client(s3ObjectCredentials)

  const s3Data = await s3.getObject({
    Bucket: s3ObjectCredentials.s3.bucket,
    Key: s3ObjectCredentials.s3.key,
  })

  const s3DataString = await s3Data.Body?.transformToString()
  if (!s3DataString) {
    throw new Error('Unable to read data from S3')
  }
  return JSON.parse(s3DataString)
}

async function downloadPreFillS3Data<T>(
  options: AWSTypes.FormS3Credentials,
): Promise<T> {
  try {
    return await downloadS3Data<T>(options)
  } catch (error) {
    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      throw new OneBlinkAppsError(
        "Data has been removed based on your administrator's prefill data retention policy.",
        {
          title: 'Prefill Data Unavailable',
        },
      )
    }
    Sentry.captureException(error)
    throw error
  }
}

async function downloadDraftS3Data<T>(
  options: AWSTypes.FormS3Credentials,
): Promise<T> {
  try {
    return await downloadS3Data<T>(options)
  } catch (error) {
    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      throw new OneBlinkAppsError(
        "Data has been removed based on your administrator's draft data retention policy.",
        {
          title: 'Draft Data Unavailable',
        },
      )
    }
    Sentry.captureException(error)
    throw error
  }
}

async function downloadSubmissionS3Data<T>(
  options: AWSTypes.FormS3Credentials,
): Promise<T> {
  try {
    return await downloadS3Data<T>(options)
  } catch (error) {
    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      throw new OneBlinkAppsError(
        "This submission has been removed based on your administrator's retention policy.",
        {
          title: 'Submission Data Unavailable',
        },
      )
    }
    Sentry.captureException(error)
    throw error
  }
}

export {
  uploadFormSubmission,
  downloadPreFillS3Data,
  downloadDraftS3Data,
  downloadSubmissionS3Data,
  uploadAttachment,
}
