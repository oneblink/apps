// @flow
'use strict'

import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import {
  acknowledgeCPPayTransaction,
  verifyPaymentTransaction,
  generatePaymentConfiguration,
} from './services/api/payment'
import { findFormElement } from './form-service'
import utilsService from './services/utils'

/* ::
import { type QueryParameters } from 'query-string'
*/

const KEY = 'PAYMENT_SUBMISSION_RESULT'

function verifyCPPayPayment(query, submissionResult) {
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

      return verifyPaymentTransaction(
        `/forms/${submissionResult.definition.id}/cp-pay-verification`,
        {
          transactionToken,
        },
      )
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

function verifyBpointPayment(query, submissionResult) {
  return Promise.resolve()
    .then(() => {
      const { ResultKey: transactionToken } = query
      if (!transactionToken) {
        throw new OneBlinkAppsError(
          'Transactions can not be verified unless navigating here directly after a payment.',
        )
      }

      return verifyPaymentTransaction(
        `/forms/${submissionResult.definition.id}/bpoint-verification`,
        {
          transactionToken,
        },
      )
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
          creditCardMask:
            (transaction.CardDetails &&
              transaction.CardDetails.MaskedCardNumber) ||
            null,
          amount: transaction.Amount / 100,
        },
        submissionResult,
      }
    })
}

export function handlePaymentQuerystring(
  query /* : QueryParameters */,
) /*: Promise<{
  transaction: {
    isSuccess: boolean,
    errorMessage: ?string,
    id: ?string,
    creditCardMask: ?string,
    amount: ?number,
  },
  submissionResult: FormSubmissionResult,
}> */ {
  return utilsService
    .getLocalForageItem(KEY)
    .then((submissionResult /* : FormSubmissionResult | null */) => {
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

export async function handlePaymentSubmissionEvent(
  {
    formSubmission,
    paymentSubmissionEvent,
    paymentReceiptUrl,
    submissionId,
  } /* : {
  formSubmission: FormSubmission,
  paymentSubmissionEvent: PaymentSubmissionEvent,
  paymentReceiptUrl: string,
  submissionId?: string,
} */,
) /* : Promise<FormSubmissionResult | void> */ {
  console.log('Attempting to handle submission with payment submission event')
  const { definition: form, submission } = formSubmission

  const amountElement = findFormElement(
    form.elements,
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

  const amount = submission[amountElement.name]
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

  const paymentConfiguration = await generatePaymentConfiguration(
    form,
    paymentSubmissionEvent,
    {
      amount,
      redirectUrl: paymentReceiptUrl,
      submissionId,
    },
  )
  console.log('Created Payment configuration to start transaction')
  const submissionResult = Object.assign({}, formSubmission, {
    submissionTimestamp: null,
    submissionId: paymentConfiguration.submissionId,
    payment: {
      submissionEvent: paymentSubmissionEvent,
      hostedFormUrl: paymentConfiguration.hostedFormUrl,
    },
    isInPendingQueue: false,
    isOffline: false,
  })
  await utilsService.setLocalForageItem(KEY, submissionResult)

  return submissionResult
}
