import { FormTypes } from '@oneblink/types'
import { customAlphabet } from 'nanoid/non-secure'
import { format } from 'date-fns'

export const dateFormatMap: Record<FormTypes.ReceiptDateFormat, string> = {
  dayOfMonth: 'dd',
  monthNumber: 'MM',
  yearShort: 'yy',
  year: 'yyyy',
}

export function buildAlphabet(
  alphabetConfig: FormTypes.ReceiptRandomComponent,
) {
  let alphabet = ''
  // all letters except i o and l
  const allowedLetters = 'abcdefghjkmnpqrstuvwxyz'
  if (alphabetConfig.lowercase) {
    alphabet += allowedLetters
  }
  if (alphabetConfig.uppercase) {
    alphabet += allowedLetters.toUpperCase()
  }
  if (alphabetConfig.numbers) {
    // all numbers except 0
    alphabet += '123456789'
  }
  return alphabet
}

export function generateExternalId(
  receiptComponents: FormTypes.ReceiptComponent[],
) {
  const date = new Date()
  return receiptComponents.reduce((id: string, component) => {
    switch (component.type) {
      case 'text':
        return id + component.value
      case 'date': {
        const dateFormat = dateFormatMap[component.format]
        if (dateFormat) {
          return id + format(date, dateFormat)
        }
        break
      }
      case 'random': {
        const alphabet = buildAlphabet(component)
        if (alphabet) {
          const randomFunc = customAlphabet(alphabet, component.length)
          return id + randomFunc()
        }
        break
      }
    }
    return id
  }, '')
}
