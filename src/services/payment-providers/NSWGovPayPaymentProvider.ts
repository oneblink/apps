import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import {
  BasePaymentConfigurationPayload,
  PaymentProvider,
} from '../../types/payments'
import { FormSubmissionResult } from '../../types/submissions'
import replaceInjectablesWithSubmissionValues from '../replaceInjectablesWithSubmissionValues'
import OneBlinkAppsError from '../errors/oneBlinkAppsError'
import {
  generateAmountReceiptItem,
  generateCreditCardMaskReceiptItem,
  generateReceiptItem,
  generateSubmissionIdReceiptItem,
  prepareReceiptItems,
} from './receipt-items'
import { localisationService } from '../..'

class NSWGovPayPaymentProvider
  implements PaymentProvider<SubmissionEventTypes.NSWGovPaySubmissionEvent>
{
  constructor(
    paymentSubmissionEvent: SubmissionEventTypes.NSWGovPaySubmissionEvent,
  ) {
    this.paymentSubmissionEvent = paymentSubmissionEvent
  }

  paymentSubmissionEvent: SubmissionEventTypes.NSWGovPaySubmissionEvent

  preparePaymentConfiguration(
    basePayload: BasePaymentConfigurationPayload,
    formSubmissionResult: FormSubmissionResult,
  ) {
    return {
      path: `/forms/${formSubmissionResult.definition.id}/nsw-gov-pay-payment`,
      payload: {
        ...basePayload,
        integrationPrimaryAgencyId:
          this.paymentSubmissionEvent.configuration.primaryAgencyId,
        productDescription: replaceInjectablesWithSubmissionValues(
          this.paymentSubmissionEvent.configuration.productDescription,
          formSubmissionResult,
        ),
        customerReference:
          this.paymentSubmissionEvent.configuration.customerReference &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.customerReference,
            formSubmissionResult,
          ),
        subAgencyCode:
          this.paymentSubmissionEvent.configuration.subAgencyCode &&
          replaceInjectablesWithSubmissionValues(
            this.paymentSubmissionEvent.configuration.subAgencyCode,
            formSubmissionResult,
          ),
      },
    }
  }

  async verifyPaymentTransaction(
    query: Record<string, unknown>,
    submissionResult: FormSubmissionResult,
  ) {
    const {
      submissionId,
      isSuccess,
      errorMessage,
      paymentReference,
      completionReference,
      bankReference,
      paymentMethod,
      cardLast4Digits,
      amount,
      surcharge,
      surchargeGst,
    } = query as {
      submissionId?: string
      isSuccess?: string
      errorMessage?: string
      paymentReference?: string
      completionReference?: string
      bankReference?: string
      paymentMethod?: string
      cardLast4Digits?: string
      amount?: string
      surcharge?: string
      surchargeGst?: string
    }

    if (!submissionId || !isSuccess || !paymentReference) {
      throw new OneBlinkAppsError(
        'Transactions can not be verified unless navigating here directly after a payment.',
      )
    }

    if (submissionResult.submissionId !== submissionId) {
      throw new OneBlinkAppsError(
        'It looks like you are attempting to view a receipt for the incorrect payment.',
      )
    }

    return {
      receiptItems: prepareReceiptItems([
        generateSubmissionIdReceiptItem(submissionResult.submissionId),
        generateReceiptItem({
          className: 'ob-payment-receipt__completion-reference',
          valueClassName: 'cypress-payment-receipt-completion-reference',
          icon: 'check_circle',
          label: 'Completion Reference',
          value: completionReference,
          allowCopyToClipboard: true,
        }),
        {
          className: 'ob-payment-receipt__payment-reference',
          valueClassName: 'cypress-payment-receipt-payment-reference',
          icon: 'shopping_cart',
          label: 'Payment Reference',
          value: paymentReference,
          allowCopyToClipboard: true,
        },
        generateReceiptItem({
          className: 'ob-payment-receipt__bank-reference',
          valueClassName: 'cypress-payment-receipt-bank-reference',
          icon: 'account_balance',
          label: 'Bank Reference',
          value: bankReference,
          allowCopyToClipboard: true,
        }),
        generateReceiptItem({
          className: 'ob-payment-payment-method',
          valueClassName: 'cypress-payment-receipt-payment-method',
          icon: 'account_balance_wallet',
          label: 'Payment Method',
          value: getPaymentMethodLabel(paymentMethod),
          allowCopyToClipboard: false,
        }),
        generateCreditCardMaskReceiptItem(
          cardLast4Digits ? `xxxx xxxx xxxx ${cardLast4Digits}` : null,
        ),
        generateAmountReceiptItem(
          typeof amount === 'string' ? parseFloat(amount) : undefined,
        ),
        generateReceiptItem({
          className: 'ob-payment-receipt__surcharge',
          valueClassName: 'cypress-payment-receipt-surcharge',
          icon: 'price_check',
          label: 'Surcharge Amount',
          value:
            typeof surcharge === 'string'
              ? localisationService.formatCurrency(parseFloat(surcharge))
              : undefined,
          allowCopyToClipboard: false,
        }),
        generateReceiptItem({
          className: 'ob-payment-receipt__surcharge-gst',
          valueClassName: 'cypress-payment-receipt-surcharge-gst',
          icon: 'price_check',
          label: 'Surcharge GST',
          value:
            typeof surchargeGst === 'string'
              ? localisationService.formatCurrency(parseFloat(surchargeGst))
              : undefined,
          allowCopyToClipboard: false,
        }),
      ]),
      transaction: {
        isSuccess: isSuccess === 'true',
        errorMessage,
      },
      submissionResult,
    }
  }
}

function getPaymentMethodLabel(paymentMethod: string | undefined) {
  switch (
    paymentMethod as NonNullable<
      NonNullable<
        SubmissionTypes.NSWGovPayPayment['paymentTransaction']['transaction']
      >['agencyCompletionPayment']
    >['paymentMethod']
  ) {
    case 'PAYID': {
      return 'PayID'
    }
    case 'CARD': {
      return 'Credit Card'
    }
    case 'PAYPAL': {
      return 'PayPal'
    }
    case 'BPAY':
    default: {
      return paymentMethod
    }
  }
}

export default NSWGovPayPaymentProvider
