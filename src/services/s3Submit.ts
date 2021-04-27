import S3 from 'aws-sdk/clients/s3'
import bigJSON from 'big-json'
import s3UploadStream from 's3-upload-stream'
import queryString from 'query-string'
import { Readable } from 'stream'
import { getUserProfile } from '../auth-service'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { AWSTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
import Sentry from '../Sentry'

const apiVersion = '2006-03-01'

interface S3Configuration {
  credentials: SubmissionTypes.S3UploadCredentials['credentials']
  s3: SubmissionTypes.S3UploadCredentials['s3']
}
export interface UploadFileConfiguration {
  stream: Readable
  name?: string
  type: string
  isPrivate: boolean
}

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

const getDeviceInformation = () => {
  if (window.cordova) {
    const deviceInformation = {
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

  const isInstalledAsPWA = window.matchMedia('(display-mode: standalone)')
    .matches
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

export const uploadFileStreamToS3 = (
  { credentials, s3: s3Meta }: S3Configuration,
  data: UploadFileConfiguration,
  tags?: Record<string, string | undefined>,
) => {
  if (!credentials) {
    return Promise.reject(new Error('Credentials are required'))
  }

  if (!s3Meta) {
    return Promise.reject(new Error('s3 object details are required'))
  }

  if (!data) {
    return Promise.reject(new Error('no file data provided'))
  }

  const s3StreamClient = s3UploadStream(
    new S3({
      apiVersion,
      region: s3Meta.region,
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    }),
  )
  const objectMeta: S3.PutObjectRequest = {
    ServerSideEncryption: 'AES256',
    Expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Max 1 year
    CacheControl: 'max-age=31536000', // Max 1 year(365 days),
    Bucket: s3Meta.bucket,
    Key: s3Meta.key,
    ContentDisposition: data.name
      ? `attachment; filename="${data.name}"`
      : undefined,
    ContentType: data.type,
    Tagging: tags ? queryString.stringify(tags) : undefined,
    ACL: data.isPrivate ? 'private' : 'public-read',
  }
  const upload = s3StreamClient.upload(objectMeta)
  upload.maxPartSize(5 * 1024 * 1024)
  upload.concurrentParts(10)

  const promise = new Promise((resolve, reject) => {
    upload.on('error', function (error) {
      reject(error)
    })

    upload.on('part', function (details) {
      console.log('Upload to S3 part:', details)
    })

    upload.on('uploaded', function (details) {
      resolve(details)
    })
  })
  data.stream.pipe(upload)

  return promise.catch((err) => {
    Sentry.captureException(err)
    // handle storing in s3 errors here
    if (/Network Failure/.test(err.message)) {
      console.warn('Network error uploading to S3:', err)
      throw new OneBlinkAppsError(
        'There was an error saving your form. Please try again. If the problem persists, contact your administrator',
        {
          title: 'Connectivity Issues',
          originalError: err,
        },
      )
    }

    throw err
  })
}

const uploadFormSubmission = (
  s3Configuration: S3Configuration,
  formJson: {
    definition: FormTypes.Form
    submission: SubmissionTypes.FormSubmission['submission']
    submissionTimestamp: string
    keyId?: string
    formsAppId: number
  },
  tags: Record<string, string | undefined>,
) => {
  console.log('Uploading submission')

  const readStream = bigJSON.createStringifyStream({
    body: {
      ...formJson,
      user: getUserProfile(),
      device: getDeviceInformation(),
    },
  })
  return uploadFileStreamToS3(
    s3Configuration,
    {
      stream: readStream,
      type: 'application/json',
      isPrivate: true,
    },
    tags,
  )
}

const downloadPreFillData = <T>({
  credentials,
  s3: s3Meta,
}: AWSTypes.FormS3Credentials): Promise<T> => {
  if (!credentials) {
    return Promise.reject(new Error('Credentials are required'))
  }

  if (!s3Meta) {
    return Promise.reject(new Error('s3 object details are required'))
  }

  const s3 = new S3({
    apiVersion,
    region: s3Meta.region,
    accessKeyId: credentials.AccessKeyId,
    secretAccessKey: credentials.SecretAccessKey,
    sessionToken: credentials.SessionToken,
  })

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
    .catch((error) => {
      Sentry.captureException(error)
      // AWS will return an "Access Denied" error for objects that have been
      // deleted. As we should only be getting these if objects are not there
      // (because our API should always return valid credentials) we can tell
      // the user that their data has been removed from OneBlink's stores.
      if (error.name === 'AccessDenied') {
        throw new OneBlinkAppsError(
          "Data has been removed based on your administrator's prefill data retention policy.",
          {
            originalError: error,
            httpStatusCode: error.status,
          },
        )
      }
      throw error
    })
}

export { uploadFormSubmission, downloadPreFillData }
