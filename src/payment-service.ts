import { paymentService } from '@oneblink/sdk-core'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  acknowledgeCPPayTransaction,
  verifyPaymentTransaction,
  generatePaymentConfiguration,
} from './services/api/payment'
import utilsService from './services/utils'
import replaceCustomValues from './services/replace-custom-values'
import { SubmissionEventTypes } from '@oneblink/types'
import { FormSubmission, FormSubmissionResult } from './types/submissions'
import { HandlePaymentResult } from './types/payments'

const KEY = 'PAYMENT_SUBMISSION_RESULT'

export { HandlePaymentResult }

async function verifyCPPayPayment(
  query: Record<string, unknown>,
  submissionResult: FormSubmissionResult,
  cpPaymentSubmissionEvent: SubmissionEventTypes.CPPaySubmissionEvent,
): Promise<HandlePaymentResult> {
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

  const transaction = await verifyPaymentTransaction<{
    resultCode: number
    errorMessage: string
    transactionId: string
    lastFour: string
    amount: number
  }>(`/forms/${submissionResult.definition.id}/cp-pay-verification`, {
    transactionToken,
    integrationGatewayId: cpPaymentSubmissionEvent.configuration.gatewayId,
  })
  // Asynchronously acknowledge receipt
  acknowledgeCPPayTransaction(submissionResult.definition.id, {
    transactionId: transaction.transactionId,
    integrationGatewayId: cpPaymentSubmissionEvent.configuration.gatewayId,
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
}

async function verifyBpointPayment(
  query: Record<string, unknown>,
  submissionResult: FormSubmissionResult,
  bpointSubmissionEvent: SubmissionEventTypes.BPOINTSubmissionEvent,
): Promise<HandlePaymentResult> {
  const { ResultKey: transactionToken } = query
  if (!transactionToken) {
    throw new OneBlinkAppsError(
      'Transactions can not be verified unless navigating here directly after a payment.',
    )
  }
  const transaction = await verifyPaymentTransaction<{
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
    integrationEnvironmentId: bpointSubmissionEvent.configuration.environmentId,
  })
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
}

async function verifyWestpacQuickWebPayment(
  query: Record<string, unknown>,
  submissionResult: FormSubmissionResult,
): Promise<HandlePaymentResult> {
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
}

/**
 * Pass in query string parameters after a redirect back to your app after a
 * payment is processed. This function will handle all payment submission events
 * supported by OneBlink. Will return a Transaction and the submission result
 * that was returned from `handlePaymentSubmissionEvent()` before redirecting to
 * `payment.hostedFormUrl`.
 *
 * #### Example
 *
 * ```js
 * import queryString from 'query-string'
 *
 * const query = queryString.parse(window.location.search)
 * const { transaction, submissionResult } =
 *   await paymentService.handlePaymentQuerystring(query)
 * ```
 *
 * @param query
 * @returns
 */
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
          return verifyCPPayPayment(
            query,
            submissionResult,
            submissionResult.payment.submissionEvent,
          )
        }
        case 'BPOINT': {
          return verifyBpointPayment(
            query,
            submissionResult,
            submissionResult.payment.submissionEvent,
          )
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
  const result = paymentService.checkForPaymentEvent(
    formSubmission.definition,
    formSubmission.submission,
  )
  if (result) {
    console.log('Form has a payment submission event with amount', result)
  }
  return result
}

/**
 * Handle a submission result with a payment submission event. Will throw an
 * error if a transaction has already been made using this submission result.
 * Will return `undefined` if the submission does not have an amount. Will
 * return the submission result passed in with a `payment` property if the
 * submission requires processing.
 *
 * #### Example
 *
 * ```js
 * const formSubmissionResult = {
 *   submissionId: '89c6e98e-f56f-45fc-84fe-c4fc62331d34',
 *   submissionTimestamp: '2020-07-29T01:03:26.573Z'
 *   formsAppId: 1,
 *   submission: {
 *     form: 'data',
 *     goes: 'here',
 *     amount: 1.50,
 *   }
 *   definition: OneBlinkForm,
 *   payment: null,
 * }
 * const paymentSubmissionEvent = {
 *   type: 'CP_PAY',
 *   configuration: {
 *     elementId: '12663efc-4c6a-4e72-8505-559edfe3e92e',
 *     gatewayId: '6658c5c4-e0db-483b-8af7-6a6464fe772c',
 *   },
 * }
 * const paymentReceiptUrl = `${window.location.origin}/payment-receipt`
 * const paymentSubmissionResult = await paymentService.handlePaymentSubmissionEvent({
 *   formSubmissionResult,
 *   paymentSubmissionEvent,
 *   paymentReceiptUrl,
 * })
 * if (paymentSubmissionResult) {
 *   window.location.href = paymentSubmissionResult.payment.hostedFormUrl
 * }
 * ```
 *
 * @param options
 * @returns
 */
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
    integrationEnvironmentId?: string
    integrationGatewayId?: string
  } = {
    amount,
    redirectUrl: paymentReceiptUrl,
    submissionId: formSubmissionResult.submissionId,
  }

  switch (paymentSubmissionEvent.type) {
    case 'BPOINT': {
      payload.integrationEnvironmentId =
        paymentSubmissionEvent.configuration.environmentId
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
      break
    }
    case 'WESTPAC_QUICK_WEB': {
      payload.integrationEnvironmentId =
        paymentSubmissionEvent.configuration.environmentId
      if (paymentSubmissionEvent.configuration.customerReferenceNumber) {
        payload.customerReferenceNumber = replaceCustomValues(
          paymentSubmissionEvent.configuration.customerReferenceNumber,
          formSubmissionResult,
        )
      }
      break
    }
    case 'CP_PAY': {
      payload.integrationGatewayId =
        paymentSubmissionEvent.configuration.gatewayId
      break
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
