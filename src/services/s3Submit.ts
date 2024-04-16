import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { AWSTypes, SubmissionTypes } from '@oneblink/types'
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

export function getDeviceInformation(): SubmissionTypes.S3SubmissionDataDevice {
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

async function downloadS3Data<T>(
  s3ObjectCredentials: AWSTypes.S3ObjectCredentials,
): Promise<T> {
  const s3 = new S3Client({
    region: s3ObjectCredentials.s3.region,
    credentials: {
      accessKeyId: s3ObjectCredentials.credentials.AccessKeyId,
      secretAccessKey: s3ObjectCredentials.credentials.SecretAccessKey,
      sessionToken: s3ObjectCredentials.credentials.SessionToken,
    },
  })

  const s3Data = await s3.send(
    new GetObjectCommand({
      Bucket: s3ObjectCredentials.s3.bucket,
      Key: s3ObjectCredentials.s3.key,
    }),
  )

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

export { downloadPreFillS3Data, downloadDraftS3Data, downloadSubmissionS3Data }
