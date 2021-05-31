import bigJSON from 'big-json'
// import { Upload } from '@aws-sdk/lib-storage'
import {
  S3Client,
  PutObjectCommandInput,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { AbortController } from '@aws-sdk/abort-controller'
import queryString from 'query-string'
import { getUserProfile } from '../auth-service'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { AWSTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
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
  contentType: string
  isPrivate: boolean
  data: PutObjectCommandInput['Body']
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
  return new S3Client({
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

async function uploadToS3(
  s3Configuration: AWSTypes.S3ObjectCredentials,
  putObjectCommandInput: PutObjectCommandInput,
  abortSignal?: AbortSignal,
) {
  try {
    const s3Client = getS3Client(s3Configuration)

    // const parallelUpload = new Upload({
    //   client: s3Client,
    //   params: putObjectCommandInput,
    // })

    // parallelUpload.on('httpUploadProgress', (progress) => {
    //   console.log('Upload to S3 part:', progress)
    // })

    // await parallelUpload.done()

    const abortController = new AbortController()
    abortSignal?.addEventListener('abort', () => {
      // parallelUpload.abort()
      abortController.abort()
    })

    await s3Client.send(new PutObjectCommand(putObjectCommandInput), {
      abortSignal: abortController.signal,
    })
  } catch (error) {
    if (error.name !== 'AbortError') {
      Sentry.captureException(error)
      // handle storing in s3 errors here
      if (/Network Failure/.test(error.message)) {
        console.warn('Network error uploading to S3:', error)
        throw new OneBlinkAppsError(
          'There was an error saving the file. Please try again. If the problem persists, contact your administrator',
          {
            title: 'Connectivity Issues',
            originalError: error,
          },
        )
      }
    }

    throw error
  }
}

async function uploadFormSubmission(
  s3Configuration: AWSTypes.S3ObjectCredentials,
  formJson: {
    definition: FormTypes.Form
    submission: SubmissionTypes.FormSubmission['submission']
    submissionTimestamp: string
    keyId?: string
    formsAppId: number
  },
  tags: Record<string, string | undefined>,
) {
  console.log('Uploading submission')

  const readStream = bigJSON.createStringifyStream({
    body: {
      ...formJson,
      user: getUserProfile(),
      device: getDeviceInformation(),
    },
  })

  const putObjectCommandInput: PutObjectCommandInput = getObjectMeta(
    s3Configuration.s3,
  )
  putObjectCommandInput.Body = readStream
  putObjectCommandInput.Tagging = queryString.stringify(tags)
  putObjectCommandInput.ContentType = 'application/json'

  await uploadToS3(s3Configuration, putObjectCommandInput, undefined)
}

const uploadAttachment = async (
  s3Configuration: AWSTypes.S3ObjectCredentials,
  fileConfiguration: UploadAttachmentConfiguration,
  abortSignal: AbortSignal | undefined,
) => {
  const putObjectCommandInput: PutObjectCommandInput = getObjectMeta(
    s3Configuration.s3,
  )
  putObjectCommandInput.Body = fileConfiguration.data
  putObjectCommandInput.ContentType = fileConfiguration.contentType
  putObjectCommandInput.ContentDisposition = `attachment; filename="${fileConfiguration.fileName}"`
  if (!fileConfiguration.isPrivate) {
    putObjectCommandInput.ACL = 'public-read'
  }

  await uploadToS3(s3Configuration, putObjectCommandInput, abortSignal)
}

async function downloadPreFillData<T>(
  s3ObjectCredentials: AWSTypes.S3ObjectCredentials,
): Promise<T> {
  try {
    const s3Client = getS3Client(s3ObjectCredentials)

    const s3Data = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3ObjectCredentials.s3.bucket,
        Key: s3ObjectCredentials.s3.key,
      }),
    )

    const body = s3Data.Body

    if (body instanceof ReadableStream) {
      const parseStream = bigJSON.createParseStream()

      const promise = new Promise<T>((resolve, reject) => {
        parseStream.on('data', resolve)
        parseStream.on('error', reject)
      })
      await body.pipeTo(parseStream)

      return await promise
    }

    if (body instanceof Blob) {
      return new Promise<T>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onload = function (event) {
          bigJSON.parse(
            {
              body: event.target?.result,
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

        fileReader.readAsText(body)
      })
    }

    throw new Error('Unsupported body response from S3')
  } catch (error) {
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
  }
}

export { uploadFormSubmission, downloadPreFillData, uploadAttachment }
