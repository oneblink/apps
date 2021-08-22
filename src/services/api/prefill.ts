import { AWSTypes } from '@oneblink/types'
import { postRequest } from '../fetch'
import { downloadPreFillS3Data } from '../s3Submit'
import tenants from '../../tenants'

export async function downloadPreFillFormData<T>(
  formId: number,
  preFillFormDataId: string,
): Promise<T> {
  const url = `${tenants.current.apiOrigin}/forms/${formId}/pre-fill-retrieval-credentials/${preFillFormDataId}`
  console.log(
    'Attempting to get Credentials to download pre fill form data',
    url,
  )

  const data = await postRequest<AWSTypes.FormS3Credentials>(url)
  console.log('Attempting to download pre fill form data:', data)
  return downloadPreFillS3Data(data)
}
