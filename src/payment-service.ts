import {
  typeCastService,
  conditionalLogicService,
  formElementsService,
} from '@oneblink/sdk-core'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  acknowledgeCPPayTransaction,
  verifyPaymentTransaction,
  generatePaymentConfiguration,
} from './services/api/payment'
import utilsService from './services/utils'
import replaceCustomValues from './services/replace-custom-values'
import { getRootElementValue } from './services/prepareSubmissionData'
import { SubmissionEventTypes } from '@oneblink/types'
import { FormSubmission, FormSubmissionResult } from './types/submissions'
import { HandlePaymentResult } from './types/payments'

const KEY = 'PAYMENT_SUBMISSION_RESULT'

export { HandlePaymentResult }

function verifyCPPayPayment(
  query: Record<string, unknown>,
  submissionResult: FormSubmissionResult,
): Promise<HandlePaymentResult> {
  return Promise.resolve()
    .then(() => {
      const { transactionToken, orderNumber: submissionId } = query
      if (!transactionToken || !submissionId) {
        throw new OneBlinkAppsError(
          'Transactions can not be verified unless navigating here directly after a payment.',
        )
      }

      if (submissionResult.submissionId !== submissionId) {
        throw new OneBlinkAppsError(
          'It looks like you are attempting to view a receipt for the incorrect payment.',
        )
      }

      return verifyPaymentTransaction<{
        resultCode: number
        errorMessage: string
        transactionId: string
        lastFour: string
        amount: number
      }>(`/forms/${submissionResult.definition.id}/cp-pay-verification`, {
        transactionToken,
      })
    })
    .then((transaction) => {
      // Asynchronously acknowledge receipt
      acknowledgeCPPayTransaction(submissionResult.definition.id, {
        transactionId: transaction.transactionId,
      }).catch((error) => {
        console.warn(
          'Error while attempting to acknowledge CP Pay transaction',
          error,
        )
      })

      return {
        transaction: {
          isSuccess: transaction.resultCode === 1,
          errorMessage: transaction.errorMessage,
          id: transaction.transactionId,
          creditCardMask: transaction.lastFour
            ? `xxxx xxxx xxxx ${transaction.lastFour}`
            : null,
          amount: transaction.amount,
        },
        submissionResult,
      }
    })
}

function verifyBpointPayment(
  query: Record<string, unknown>,
  submissionResult: FormSubmissionResult,
): Promise<HandlePaymentResult> {
  return Promise.resolve()
    .then(() => {
      const { ResultKey: transactionToken } = query
      if (!transactionToken) {
        throw new OneBlinkAppsError(
          'Transactions can not be verified unless navigating here directly after a payment.',
        )
      }

      return verifyPaymentTransaction<{
        ResponseCode: string
        ResponseText: string
        ReceiptNumber: string
        CardDetails?: {
          MaskedCardNumber?: string
        }
        Amount: number
        Crn1: string | null
      }>(`/forms/${submissionResult.definition.id}/bpoint-verification`, {
        transactionToken,
      })
    })
    .then((transaction) => {
      if (submissionResult.submissionId !== transaction.Crn1) {
        throw new OneBlinkAppsError(
          'It looks like you are attempting to view a receipt for the incorrect payment.',
        )
      }

      return {
        transaction: {
          isSuccess: transaction.ResponseCode === '0',
          errorMessage: transaction.ResponseText,
          id: transaction.ReceiptNumber,
          creditCardMask: transaction.CardDetails?.MaskedCardNumber || null,
          amount: transaction.Amount / 100,
        },
        submissionResult,
      }
    })
}

function verifyWestpacQuickWebPayment(
  query: Record<string, unknown>,
  submissionResult: FormSubmissionResult,
): Promise<HandlePaymentResult> {
  return Promise.resolve().then(() => {
    const {
      paymentReference,
      receiptNumber,
      maskedCardNumber,
      summaryCode,
      responseDescription,
      paymentAmount,
    } = query as {
      paymentReference?: string
      receiptNumber?: string
      maskedCardNumber?: string
      summaryCode?: string
      responseDescription?: string
      paymentAmount?: string
    }
    if (
      !query ||
      !paymentReference ||
      !receiptNumber ||
      !summaryCode ||
      !responseDescription ||
      !paymentAmount
    ) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }

    if (submissionResult.submissionId !== paymentReference) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    return {
      transaction: {
        isSuccess: summaryCode === '0',
        errorMessage: responseDescription,
        id: receiptNumber,
        creditCardMask: maskedCardNumber || null,
        amount: parseFloat(paymentAmount),
      },
      submissionResult,
    }
  })
}

export async function handlePaymentQuerystring(
  query: Record<string, unknown>,
): Promise<HandlePaymentResult> {
  return utilsService
    .getLocalForageItem<FormSubmissionResult | null>(KEY)
    .then((submissionResult) => {
      // If the current transaction does not match the submission
      // we will display message to user indicating
      // they are looking for the wrong transaction receipt.
      if (!submissionResult) {
        throw new OneBlinkAppsError(
          'It looks like you are attempting to view a receipt for an unknown payment.',
        )
      }
      if (
        !submissionResult.payment ||
        !submissionResult.payment.submissionEvent
      ) {
        throw new OneBlinkAppsError(
          'It looks like you are attempting to view a receipt for a misconfigured payment.',
        )
      }

      switch (submissionResult.payment.submissionEvent.type) {
        case 'CP_PAY': {
          return verifyCPPayPayment(query, submissionResult)
        }
        case 'BPOINT': {
          return verifyBpointPayment(query, submissionResult)
        }
        case 'WESTPAC_QUICK_WEB': {
          return verifyWestpacQuickWebPayment(query, submissionResult)
        }
        default: {
          throw new OneBlinkAppsError(
            'It looks like you are attempting to view a receipt for an unsupported payment.',
          )
        }
      }
    })
    .then((result) =>
      utilsService.removeLocalForageItem(KEY).then(() => result),
    )
}

export function checkForPaymentSubmissionEvent(formSubmission: FormSubmission):
  | {
      paymentSubmissionEvent: SubmissionEventTypes.PaymentSubmissionEvent
      amount: number
    }
  | undefined {
  const submissionEvents = formSubmission.definition.submissionEvents || []
  const paymentSubmissionEvent = submissionEvents.reduce(
    (
      p: SubmissionEventTypes.PaymentSubmissionEvent | null,
      submissionEvent,
    ) => {
      if (p) {
        return p
      }
      const paymentSubmissionEvent =
        typeCastService.submissionEvents.toPaymentSubmissionEvent(
          submissionEvent,
        )
      if (
        paymentSubmissionEvent &&
        conditionalLogicService.evaluateConditionalPredicates({
          isConditional: !!paymentSubmissionEvent.conditionallyExecute,
          requiresAllConditionalPredicates:
            !!paymentSubmissionEvent.requiresAllConditionallyExecutePredicates,
          conditionalPredicates:
            paymentSubmissionEvent.conditionallyExecutePredicates || [],
          submission: formSubmission.submission,
          formElements: formSubmission.definition.elements,
        })
      ) {
        return paymentSubmissionEvent
      }
      return p
    },
    null,
  )

  if (!paymentSubmissionEvent) {
    return
  }

  console.log(
    'Checking if submission with payment submission event needs processing',
  )

  const amountElement = formElementsService.findFormElement(
    formSubmission.definition.elements,
    (element) => element.id === paymentSubmissionEvent.configuration.elementId,
  )
  if (!amountElement || amountElement.type === 'page') {
    console.log(
      'Form has a payment submission event but the amount element does not exist, throwing error',
    )
    throw new OneBlinkAppsError(
      'We could not find the configuration required to make a payment. Please contact your administrator to ensure your application configuration has been completed successfully.',
    )
  }

  console.log('Found form element for payment submission event', amountElement)

  const amount = getRootElementValue(
    amountElement.id,
    formSubmission.definition.elements,
    formSubmission.submission,
  )

  if (!amount) {
    console.log(
      'Form has a payment submission event but the amount has been entered as 0 or not at all, finishing as normal submission',
    )
    return
  }

  if (typeof amount !== 'number') {
    console.log(
      'Form has a payment submission event but the amount is not a number, throwing error',
    )
    throw new OneBlinkAppsError(
      'The configuration required to make a payment is incorrect. Please contact your administrator to ensure your application configuration has been completed successfully.',
    )
  }

  const result = {
    paymentSubmissionEvent,
    amount,
  }
  console.log('Form has a payment submission event with amount', result)
  return result
}

export async function handlePaymentSubmissionEvent({
  amount,
  formSubmissionResult,
  paymentSubmissionEvent,
  paymentReceiptUrl,
}: {
  amount: number
  formSubmissionResult: FormSubmissionResult
  paymentSubmissionEvent: SubmissionEventTypes.PaymentSubmissionEvent
  paymentReceiptUrl: string
}): Promise<FormSubmissionResult['payment']> {
  const payload: {
    amount: number
    redirectUrl: string
    submissionId: string | null
    crn2?: string
    crn3?: string
    customerReferenceNumber?: string
  } = {
    amount,
    redirectUrl: paymentReceiptUrl,
    submissionId: formSubmissionResult.submissionId,
  }

  if (paymentSubmissionEvent.type === 'BPOINT') {
    if (paymentSubmissionEvent.configuration.crn2) {
      payload.crn2 = replaceCustomValues(
        paymentSubmissionEvent.configuration.crn2,
        formSubmissionResult,
      )
    }
    if (paymentSubmissionEvent.configuration.crn3) {
      payload.crn3 = replaceCustomValues(
        paymentSubmissionEvent.configuration.crn3,
        formSubmissionResult,
      )
    }
  }
  if (paymentSubmissionEvent.type === 'WESTPAC_QUICK_WEB') {
    if (paymentSubmissionEvent.configuration.customerReferenceNumber) {
      payload.customerReferenceNumber = replaceCustomValues(
        paymentSubmissionEvent.configuration.customerReferenceNumber,
        formSubmissionResult,
      )
    }
  }

  const paymentConfiguration = await generatePaymentConfiguration(
    formSubmissionResult.definition,
    paymentSubmissionEvent,
    payload,
  )

  const payment = {
    submissionEvent: paymentSubmissionEvent,
    hostedFormUrl: paymentConfiguration.hostedFormUrl,
    amount,
  }
  console.log('Created Payment configuration to start transaction', payment)

  await utilsService.setLocalForageItem(KEY, {
    ...formSubmissionResult,
    scheduling: null,
    payment,
  })

  return payment
}
