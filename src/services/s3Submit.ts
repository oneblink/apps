import S3 from 'aws-sdk/clients/s3'
import bigJSON from 'big-json'
import s3UploadStream from 's3-upload-stream'
import { getContentDisposition } from '@oneblink/sdk-core'
import queryString from 'query-string'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { AWSTypes, SubmissionTypes } from '@oneblink/types'
import Sentry from '../Sentry'
import { S3UploadCredentials } from '../types/submissions'
import { HTTPError } from './fetch'

const apiVersion = '2006-03-01'

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

interface S3Configuration {
  credentials: S3UploadCredentials['credentials']
  s3: S3UploadCredentials['s3']
}
interface UploadFileConfiguration {
  fileName?: string
  contentType: string
  isPrivate: boolean
}

type UploadFileConfigurationWithTags = UploadFileConfiguration & {
  tags?: Record<string, string | undefined>
}

export type UploadAttachmentConfiguration =
  Required<UploadFileConfiguration> & {
    data: S3.PutObjectRequest['Body']
  }

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

const getS3Instance = ({ credentials, s3: s3Meta }: S3Configuration) => {
  return new S3({
    apiVersion,
    region: s3Meta.region,
    accessKeyId: credentials.AccessKeyId,
    secretAccessKey: credentials.SecretAccessKey,
    sessionToken: credentials.SessionToken,
    correctClockSkew: true,
  })
}
const getObjectMeta = (
  s3Meta: S3UploadCredentials['s3'],
  data: UploadFileConfigurationWithTags,
): S3.PutObjectRequest => ({
  ServerSideEncryption: 'AES256',
  Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Max 1 year
  CacheControl: 'max-age=31536000', // Max 1 year(365 days),
  Bucket: s3Meta.bucket,
  Key: s3Meta.key,
  ContentDisposition: data.fileName
    ? getContentDisposition(data.fileName)
    : undefined,
  ContentType: data.contentType,
  Tagging: data.tags
    ? queryString.stringify(data.tags, {
        skipEmptyString: true,
        skipNull: true,
      })
    : undefined,
  ACL: data.isPrivate ? 'private' : 'public-read',
})

const prepareFileAndUploadToS3 = async (
  { credentials, s3: s3Meta }: S3Configuration,
  fileConfiguration: UploadFileConfigurationWithTags,
  request: (s3: S3, objectMeta: S3.PutObjectRequest) => Promise<void>,
) => {
  if (!credentials) {
    throw new Error('Credentials are required')
  }

  if (!s3Meta) {
    throw new Error('s3 object details are required')
  }

  if (!fileConfiguration) {
    throw new Error('no file data provided')
  }

  const s3 = getS3Instance({ credentials, s3: s3Meta })
  const objectMeta = getObjectMeta(s3Meta, fileConfiguration)

  try {
    await request(s3, objectMeta)
  } catch (err) {
    if ((err as Error).name !== 'RequestAbortedError') {
      Sentry.captureException(err)
      // handle storing in s3 errors here
      if (/Network Failure/.test((err as Error).message)) {
        console.warn('Network error uploading to S3:', err)
        throw new OneBlinkAppsError(
          'There was an error saving the file. Please try again. If the problem persists, contact your administrator',
          {
            title: 'Connectivity Issues',
            originalError: err as Error,
          },
        )
      }
    }

    throw err
  }
}

const uploadFormSubmission = (
  s3Configuration: S3Configuration,
  formJson: SubmissionTypes.S3SubmissionData,
  tags: Record<string, string | undefined>,
) => {
  console.log('Uploading submission')

  const streamSubmissionUpload = async (
    s3: S3,
    objectMeta: S3.PutObjectRequest,
  ) => {
    const body: SubmissionTypes.S3SubmissionData = {
      ...formJson,
      device: getDeviceInformation(),
    }
    const readStream = bigJSON.createStringifyStream({
      body,
    })
    const s3StreamClient = s3UploadStream(s3)

    const upload = s3StreamClient.upload(objectMeta)
    upload.maxPartSize(5 * 1024 * 1024)
    upload.concurrentParts(10)

    const promise = new Promise((resolve, reject) => {
      upload.on('error', function (error) {
        reject(typeof error === 'string' ? new Error(error) : error)
      })

      upload.on('part', function (details) {
        console.log('Upload to S3 part:', details)
      })

      upload.on('uploaded', function (details) {
        resolve(details)
      })
    })
    readStream.pipe(upload)
    await promise
  }

  return prepareFileAndUploadToS3(
    s3Configuration,
    {
      contentType: 'application/json',
      isPrivate: true,
      tags,
    },
    streamSubmissionUpload,
  )
}

const uploadAttachment = async (
  s3Configuration: S3Configuration,
  fileConfiguration: UploadAttachmentConfiguration,
  abortSignal: AbortSignal | undefined,
) => {
  return await prepareFileAndUploadToS3(
    s3Configuration,
    fileConfiguration,
    async (s3, objectMeta) => {
      const managedUpload = s3.upload({
        ...objectMeta,
        Body: fileConfiguration.data,
      })

      abortSignal?.addEventListener('abort', () => {
        managedUpload.abort()
      })

      await managedUpload.promise()
    },
  )
}

const downloadS3Data = <T>({
  credentials,
  s3: s3Meta,
}: AWSTypes.FormS3Credentials): Promise<T> => {
  if (!credentials) {
    return Promise.reject(new Error('Credentials are required'))
  }

  if (!s3Meta) {
    return Promise.reject(new Error('s3 object details are required'))
  }

  const s3 = getS3Instance({ credentials, s3: s3Meta })

  const params = {
    Bucket: s3Meta.bucket,
    Key: s3Meta.key,
  }
  return s3
    .getObject(params)
    .promise()
    .then((s3Data) => {
      // @ts-expect-error
      const blob = new Blob([s3Data.Body])
      const fileReader = new FileReader()
      return new Promise<T>((resolve, reject) => {
        fileReader.onload = function (event) {
          bigJSON.parse(
            {
              // @ts-expect-error
              body: event.target.result,
            },
            (error: Error, preFillData: T) => {
              if (error) {
                reject(error)
              } else {
                resolve(preFillData)
              }
            },
          )
        }

        fileReader.onerror = function () {
          fileReader.abort()
          reject(fileReader.error)
        }

        fileReader.readAsText(blob)
      })
    })
}

async function downloadPreFillS3Data<T>(
  options: AWSTypes.FormS3Credentials,
): Promise<T> {
  try {
    return await downloadS3Data<T>(options)
  } catch (error) {
    Sentry.captureException(error)
    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      throw new OneBlinkAppsError(
        "Data has been removed based on your administrator's prefill data retention policy.",
        {
          title: 'Prefill Data Unavailable',
          originalError: error as HTTPError,
          httpStatusCode: (error as HTTPError).status,
        },
      )
    }
    throw error
  }
}

async function downloadDraftS3Data<T>(
  options: AWSTypes.FormS3Credentials,
): Promise<T> {
  try {
    return await downloadS3Data<T>(options)
  } catch (error) {
    Sentry.captureException(error)
    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      throw new OneBlinkAppsError(
        "Data has been removed based on your administrator's draft data retention policy.",
        {
          title: 'Draft Data Unavailable',
          originalError: error as HTTPError,
          httpStatusCode: (error as HTTPError).status,
        },
      )
    }
    throw error
  }
}

async function downloadSubmissionS3Data<T>(
  options: AWSTypes.FormS3Credentials,
): Promise<T> {
  try {
    return await downloadS3Data<T>(options)
  } catch (error) {
    Sentry.captureException(error)
    // AWS will return an "Access Denied" error for objects that have been
    // deleted. As we should only be getting these if objects are not there
    // (because our API should always return valid credentials) we can tell
    // the user that their data has been removed from OneBlink's stores.
    if ((error as Error).name === 'AccessDenied') {
      throw new OneBlinkAppsError(
        "This submission has been removed based on your administrator's retention policy.",
        {
          title: 'Submission Data Unavailable',
          originalError: error as HTTPError,
          httpStatusCode: (error as HTTPError).status,
        },
      )
    }
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
