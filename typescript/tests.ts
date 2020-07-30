import {
  offlineService,
  authService,
  OneBlinkAppsError,
  draftService,
  paymentService,
  prefillService,
  jobService,
  submissionService,
  autoSaveService,
  notificationService,
  FormTypes,
  useTenantCivicPlus,
  useTenantOneBlink,
} from '../index'

// OFFLINE SERVICE
const isOffline: boolean = offlineService.isOffline()

// AUTH SERVICE
const testAuthService = async () => {
  const formsAppId = 4
  authService.init({
    oAuthClientId: 'oAuthId',
    useSAML: true,
  })
  const userName = authService.getUserFriendlyName()

  if (!!userName) {
    const stringUserName: string = userName
    const iss = authService.getIssuerFromJWT(stringUserName)
  }
  const isAuthorised: boolean = await authService.isAuthorised(formsAppId)
  await authService.requestAccess(formsAppId)
  const route: string = await authService.login()
  const otherRoute: string = await authService.handleAuthentication()

  const amILoggedIn: boolean = authService.isLoggedIn()
  const idToken = await authService.getIdToken()
  if (!!idToken) {
    const stringIdToken: string = idToken
  }

  // USER PROFILE
  const user = authService.getUserProfile()

  if (!!user) {
    const { email, supervisor } = user
    if (!!email) {
      const emailString: string = email
    }
    if (!!supervisor) {
      const { fullName } = supervisor
      if (!!fullName) {
        const fullNameString: string = fullName
      }
    }
  }
  await authService.logout()
}

// ONEBLINK APPS ERROR
const testOneBlinkAppsError = () => {
  // With no options
  const errWithNoOptions = new OneBlinkAppsError('My New OneBlink Error')

  // With options
  const errWithOptions = new OneBlinkAppsError('My New OneBlink Error', {
    title: 'Something',
    isOffline: true,
    requiresAccessRequest: true,
    requiresLogin: true,
    httpStatusCode: 401,
    originalError: errWithNoOptions,
  })

  const {
    title,
    httpStatusCode,
    isOffline,
    requiresAccessRequest,
    requiresLogin,
    originalError,
    message,
  } = errWithOptions
  const titleString: string = title
  const httpStatusCodeNum: number = httpStatusCode || 400
  const isOfflineBool: boolean = isOffline
  const requiresAccessRequestBool: boolean = requiresAccessRequest
  const requiresLoginBool: boolean = requiresLogin
  const thirdError = new OneBlinkAppsError('third', {
    originalError,
  })
  const messageString: string = message
}

// DRAFT SERVICE
const form = {
  description: 'desc',
  elements: [],
  formsAppEnvironmentId: 4,
  formsAppIds: [4, 2],
  id: 2,
  isAuthenticated: true,
  isInfoPage: true,
  isMultiPage: true,
  name: 'name',
  organisationId: 'orgid',
  postSubmissionAction: 'URL' as const,
  submissionEvents: [],
  tags: ['tag'],
  publishEndDate: null,
  publishStartDate: null,
}
const newFormsAppDraft = {
  title: 'draftTitle',
  formId: 4,
  externalId: null,
  jobId: undefined,
}
const formSubmissionResult = {
  draftId: '4',
  externalId: 's',
  formsAppId: 3,
  jobId: 'sd',
  payment: {
    hostedFormUrl: 'sasds',
    submissionEvent: {
      isDraft: false,
      type: 'CP_PAY' as const,
      configuration: {
        elementId: 'elementid',
        gatewayId: 'sasds',
      },
    },
  },
  submissionTimestamp: 'date',
  preFillFormDataId: 'sasds',
  submission: {
    key: {},
    otherKey: 'sasd',
  },
  submissionId: '23',
  definition: form,
}

const testDraftService = async () => {
  const formsAppDrafts: FormTypes.FormsAppDraft[] = [
    {
      draftId: '2',
      externalId: 's',
      formId: 4,
      jobId: 'sasd',
      title: 'title',
      updatedAt: 'date',
      draftDataId: 'draftDataId',
    },
  ]
  const cancelListener = draftService.registerDraftsListener(
    (formsAppDrafts) => {
      return null
    }
  )
  cancelListener()

  const accessKey = 'accessKey'
  await draftService.addDraft(newFormsAppDraft, formSubmissionResult, accessKey)

  await draftService.updateDraft(
    {
      ...newFormsAppDraft,
      draftId: 'id1',
      draftDataId: 'id2',
      updatedAt: 'date',
    },
    formSubmissionResult,
    accessKey
  )

  const drafts = await draftService.getDrafts()
  for (const draft of drafts) {
    const {
      draftDataId,
      draftId,
      externalId,
      formId,
      jobId,
      title,
      updatedAt,
    } = draft
    let str: string = draftId
    const num: number = formId
    str = title
    str = updatedAt
    if (draftDataId && externalId && jobId) {
      str = draftDataId
      str = externalId
      str = jobId
    }
  }

  const result = await draftService.getDraftAndData('34')
  const draftId: string | undefined = result?.draft.draftId
  if (result) {
    const {
      draftId,
      externalId,
      jobId,
      formId,
      title,
      updatedAt,
      draftDataId,
    } = result.draft
    let str: string = draftId
    const num: number = formId
    str = title
    str = updatedAt
    if (draftDataId && externalId && jobId) {
      str = draftDataId
      str = externalId
      str = jobId
    }
  }
  await draftService.deleteDraft('id', 5)
  await draftService.syncDrafts({
    formsAppId: 4,
    throwError: true,
  })
}

// PAYMENT SERVICE
const testPaymentService = async () => {
  let bool: boolean
  let num: number
  let str: string
  const {
    transaction,
    submissionResult,
  } = await paymentService.handlePaymentQuerystring({
    val1: 'string',
    val2: [2, 3, 4],
    val3: ['1', '2'],
  })

  const isSuccess: boolean = transaction.isSuccess
  const { amount, creditCardMask, id, errorMessage } = transaction
  num = amount || 4

  if (creditCardMask && id && errorMessage) {
    str = creditCardMask
    str = id
    str = errorMessage
  }

  const result = await paymentService.handlePaymentSubmissionEvent(
    {
      ...formSubmissionResult,
      captchaTokens: ['sasds'],
    },
    {
      isDraft: false,
      type: 'CP_PAY',
      configuration: {
        elementId: 'elementid',
        gatewayId: 'sasds',
      },
    }
  )
  if (result) {
    const {
      draftId,
      externalId,
      jobId,
      definition,
      formsAppId,
      payment,
      submissionId,
      submission,
      preFillFormDataId,
      submissionTimestamp,
      isOffline,
      captchaTokens,
      isInPendingQueue,
      keyId,
    } = result
    const formDef: FormTypes.Form = definition
    num = formsAppId
    if (payment) {
      str = payment.hostedFormUrl
      bool = payment.submissionEvent.isDraft
      str = payment.submissionEvent.type
      if (payment.submissionEvent.type === 'CP_PAY') {
        const { elementId, gatewayId } = payment.submissionEvent.configuration
        str = elementId
        str = gatewayId
      } else {
        const {
          elementId,
          environmentId,
        } = payment.submissionEvent.configuration
        str = elementId
        str = environmentId
      }
    }
    const val = submission.someKey
    bool = isOffline || false
    if (captchaTokens) {
      for (const token of captchaTokens) {
        str = token
      }
    }
    bool = isInPendingQueue || false
    if (
      draftId &&
      externalId &&
      jobId &&
      submissionId &&
      preFillFormDataId &&
      submissionTimestamp &&
      keyId
    ) {
      str = draftId
      str = externalId
      str = jobId
      str = submissionId
      str = preFillFormDataId
      str = submissionTimestamp
      str = keyId
    }
  }
}

// PREFILL SERVICE
const testPrefillService = async () => {
  let str: string
  let num: number
  const result = await prefillService.getPrefillFormData<{
    name: string
    details: {
      age: number
    }
  }>(24, 'prefillId')
  if (result) {
    str = result.name
    num = result.details.age
    await prefillService.removePrefillFormData(str)
  }
}

// TENANTS
const testTenants = () => {
  useTenantOneBlink()
  useTenantCivicPlus()
}

// JOB SERVICE
const testJobService = async () => {
  let str: string
  let num: number

  const result = await jobService.getJobs(4, 'id')
  for (const job of result) {
    const {
      createdAt,
      formId,
      details,
      id,
      draft,
      externalId,
      preFillFormDataId,
    } = job
    str = createdAt
    str = id
    num = formId
    if (externalId && preFillFormDataId && draft) {
      str = externalId
      str = preFillFormDataId

      str = draft.draftId
      str = draft.title
      str = draft.updatedAt
      num = draft.formId
      if (draft.draftDataId && draft.externalId && draft.jobId) {
        str = draft.draftDataId
        str = draft.externalId
        str = draft.jobId
      }
    }

    const { description, title, type, key, priority } = details
    str = title
    if (description && type && key && priority) {
      str = description
      str = type
      str = key
      str = priority
    }
  }

  await jobService.ensurePrefillFormDataExists(result)
}

// SUBMISSION SERVICE
const testSubmissionService = async () => {
  await submissionService.cancelForm()
  await submissionService.deletePendingQueueSubmission('timeStamp')
  await submissionService.executePostSubmissionAction(
    formSubmissionResult,
    (myString) => {}
  )

  const results = await submissionService.getPendingQueueSubmissions()
  for (const row of results) {
    const pendingFormSubmissionResult: FormTypes.PendingFormSubmissionResult = row
  }

  await submissionService.processPendingQueue()

  const cancelPendingQueueListener = await submissionService.registerPendingQueueListener(
    (results) => {
      return 'unknown-this-could-be-anything'
    }
  )

  const formSubResult = await submissionService.submit({
    accessKey: 'sasds',
    paymentReceiptUrl: 'my-url.com',
    submissionId: 'subId',
    formSubmission: {
      ...formSubmissionResult,
      captchaTokens: ['sasds'],
    },
  })
}

// AUTO SAVE SERVICE
const testAutoSaveService = async () => {
  let str: string
  let num: number
  const getResult = await autoSaveService.getAutoSaveData<
    Array<{
      name: string
      age: number
    }>
  >(24, 'key')
  if (getResult) {
    for (const row of getResult) {
      str = row.name
      num = row.age
    }
  }

  await autoSaveService.deleteAutoSaveData(24, 'key')

  const upsertResult = await autoSaveService.upsertAutoSaveData<{
    name: string
    age: number
  }>(24, 'key', {
    name: 'Zac',
    age: 25,
  })
  str = upsertResult.name
  num = upsertResult.age
}

// NOTIFICATION SERVICE
const testNotificationService = async () => {
  let bool: boolean
  bool = await notificationService.isSubscribed()
  const didSubscribe: boolean = await notificationService.subscribe(24)
  await notificationService.unsubscribe(24)
}
