// @flow
'use strict'

import { postRequest } from '../fetch'
import { downloadPreFillData, uploadPreFillData } from '../s3Submit'

async function uploadPreFillFormData /* :: <T> */(
  formId /* : number */,
  preFillData /* : T */
) /* : Promise<string> */ {
  const url = `/forms/${formId}/pre-fill-credentials`
  console.log('Attempting to get Credentials to upload pre fill form data', url)

  const data = await postRequest(url)
  console.log('Attempting to upload pre fill form data:', data)
  await uploadPreFillData(data, preFillData)
  return data.preFillFormDataId
}

async function downloadPreFillFormData /* :: <T> */(
  formId /* : number */,
  preFillFormDataId /* : string */
) /* : Promise<T> */ {
  const url = `/forms/${formId}/pre-fill-retrieval-credentials/${preFillFormDataId}`
  console.log(
    'Attempting to get Credentials to download pre fill form data',
    url
  )

  const data = await postRequest(url)
  console.log('Attempting to download pre fill form data:', data)
  return downloadPreFillData(data)
}

export { uploadPreFillFormData, downloadPreFillFormData }
