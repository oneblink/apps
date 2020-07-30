////////////////////////////////////////
// Element Types
import type { NoU } from './misc'
import type {
  FormSubmissionEvent,
  PaymentSubmissionEvent,
} from './submissionEvents'
export type FormElementTypeGroup =
  | 'STATIC'
  | 'INPUT'
  | 'DATE'
  | 'OPTIONS'
  | 'ADVANCED'

export type FormElementType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkboxes'
  | 'radio'
  | 'draw'
  | 'camera'
  | 'date'
  | 'time'
  | 'datetime'
  | 'heading'
  | 'location'
  | 'repeatableSet'
  | 'page'
  | 'html'
  | 'barcodeScanner'
  | 'captcha'
  | 'image'
  | 'file'
  | 'files'
  | 'calculation'
  | 'telephone'
  | 'autocomplete'
  | 'form'
  | 'infoPage'
  | 'summary'

export interface ElementType {
  id: FormElementType
  display: string
  isInfoPageType: boolean
  group: FormElementTypeGroup
}

export interface ElementTypeGroup {
  id: FormElementTypeGroup
  isInfoPageType: boolean
  display: string
  elementTypes: ElementType[]
}

export type LookupFormElement = {
  isDataLookup: boolean
  dataLookupId?: number
  isElementLookup: boolean
  elementLookupId?: number
} & FormElementBase

export interface ConditionallyShowPredicateBase {
  elementId: string
}

export type ConditionallyShowPredicateNumeric = ConditionallyShowPredicateBase & {
  type: 'NUMERIC'
  operator: '===' | '!==' | '>' | '>=' | '<' | '<='
  value: number
}

export type ConditionallyShowPredicateOptions = ConditionallyShowPredicateBase & {
  type: 'OPTIONS'
  optionIds: string[]
}

export type ConditionallyShowPredicate =
  | ConditionallyShowPredicateNumeric
  | ConditionallyShowPredicateOptions

export interface _FormElementBase {
  isNew?: boolean
  id: string
  conditionallyShow: boolean
  requiresAllConditionallyShowPredicates: boolean
  conditionallyShowPredicates?: ConditionallyShowPredicate[]
}

export type FormElementBase = _FormElementBase & {
  name: string
  label: string
}

export type FormElementRequired = FormElementBase & {
  required: boolean
}

// Choice element types
export interface DynamicChoiceElementOption {
  label: string
  value: string
  colour?: string
}

export interface ChoiceElementOptionAttribute {
  label?: string
  value?: string
  elementId: string
  optionIds: string[]
}

export type ChoiceElementOption = {
  id: string
  attributes?: ChoiceElementOptionAttribute[]
} & DynamicChoiceElementOption

export interface DynamicOptionsSetAttributeMap {
  elementId: string
  attribute: string
}

export type FormElementWithOptionsBase = FormElementRequired & {
  options: ChoiceElementOption[]
  optionsType: 'CUSTOM' | 'DYNAMIC' | 'SEARCH'
  dynamicOptionSetId: number
  conditionallyShowOptions?: boolean
  conditionallyShowOptionsElementIds?: string[]
  attributesMapping?: DynamicOptionsSetAttributeMap[]
}

export type FormFormElement = _FormElementBase & {
  type: 'form'
  name: string
  formId: number
}

export type InfoPageElement = _FormElementBase & {
  type: 'infoPage'
  name: string
  formId: number
}

export type RadioButtonElement = FormElementWithOptionsBase & {
  type: 'radio'
  buttons: boolean
  readOnly: boolean
  defaultValue: string | NoU
} & LookupFormElement

export type CheckboxElement = FormElementWithOptionsBase & {
  type: 'checkboxes'
  buttons: boolean
  readOnly: boolean
  defaultValue: string[] | NoU
} & LookupFormElement

export type SelectElement = FormElementWithOptionsBase & {
  type: 'select'
  multi: boolean
  readOnly: boolean
  defaultValue: NoU | (string | string[])
} & LookupFormElement

export type AutoCompleteElement = FormElementWithOptionsBase & {
  type: 'autocomplete'
  readOnly: boolean
  defaultValue: string | NoU
  searchUrl?: string
  placeholderValue?: string
} & LookupFormElement

export type FormElementWithOptions =
  | RadioButtonElement
  | CheckboxElement
  | SelectElement
  | AutoCompleteElement

// date element types
export type DateElementBase = FormElementRequired & {
  readOnly: boolean
  fromDate?: Date | NoU
  toDate?: Date | NoU
  defaultValue: NoU | (Date | 'NOW')
} & LookupFormElement

export type DateElement = DateElementBase & {
  type: 'date'
  placeholderValue?: string
} & LookupFormElement

export type DateTimeElement = DateElementBase & {
  type: 'datetime'
  placeholderValue?: string
} & LookupFormElement

export type TimeElement = FormElementRequired & {
  type: 'time'
  readOnly: boolean
  defaultValue: NoU | (Date | 'NOW')
  placeholderValue?: string
} & LookupFormElement

export type NumberElement = FormElementRequired & {
  type: 'number'
  readOnly: boolean
  minNumber?: NoU | number
  maxNumber?: NoU | number
  defaultValue: NoU | number
  isSlider: boolean
  sliderIncrement?: NoU | number
  placeholderValue?: string
} & LookupFormElement

export type TextElement = FormElementRequired & {
  type: 'text'
  readOnly: boolean
  defaultValue: NoU | string
  placeholderValue?: string
} & LookupFormElement

export type TextareaElement = FormElementRequired & {
  type: 'textarea'
  readOnly: boolean
  defaultValue: NoU | string
  placeholderValue?: string
} & LookupFormElement

export type EmailElement = FormElementRequired & {
  type: 'email'
  readOnly: boolean
  defaultValue: NoU | string
  placeholderValue?: string
} & LookupFormElement

export type ImageElement = FormElementBase & {
  type: 'image'
  defaultValue: string
}

export type DrawElement = FormElementRequired & {
  type: 'draw'
  readOnly: boolean
}

export type CameraElement = FormElementRequired & {
  type: 'camera'
  readOnly: boolean
}

export type HeadingElement = FormElementBase & {
  type: 'heading'
  headingType: number
}

export type LocationElement = FormElementRequired & {
  type: 'location'
  readOnly: boolean
} & LookupFormElement

export interface _NestedElementsElement {
  elements: FormElement[]
}

export type RepeatableSetElement = FormElementBase & {
  type: 'repeatableSet'
  readOnly: boolean
  minSetEntries: undefined | number
  maxSetEntries: undefined | number
  addSetEntryLabel?: string
  removeSetEntryLabel?: string
} & _NestedElementsElement

export type PageElement = _FormElementBase & {
  type: 'page'
  label: string
} & _NestedElementsElement

export type NestedElementsElement = PageElement | RepeatableSetElement

export type HtmlElement = FormElementBase & {
  type: 'html'
  defaultValue: string
}

export type BarcodeScannerElement = FormElementRequired & {
  type: 'barcodeScanner'
  readOnly: boolean
  defaultValue: NoU | string
  restrictBarcodeTypes: boolean
  restrictedBarcodeTypes?: string[]
  placeholderValue?: string
} & LookupFormElement

export type CaptchaElement = FormElementRequired & {
  type: 'captcha'
}

export type FilesElement = FormElementBase & {
  type: 'files'
  readOnly: boolean
  minEntries: number | undefined
  maxEntries: number | undefined
  restrictFileTypes: boolean
  restrictedFileTypes?: string[]
}

export type FileElement = FormElementRequired & {
  type: 'file'
  readOnly: boolean
  restrictFileTypes: boolean
  restrictedFileTypes?: string[]
}

export type CalculationElement = FormElementBase & {
  type: 'calculation'
  defaultValue: string
  calculation: NoU | string
  preCalculationDisplay: NoU | string
}

export type TelephoneElement = FormElementRequired & {
  type: 'telephone'
  readOnly: boolean
  defaultValue: NoU | string
  placeholderValue?: string
} & LookupFormElement

export type SummaryElement = FormElementBase & {
  type: 'summary'
  elementIds: string[]
}

export type FormElementWithoutForm =
  | TextElement
  | EmailElement
  | TextareaElement
  | NumberElement
  | SelectElement
  | RadioButtonElement
  | CheckboxElement
  | DrawElement
  | CameraElement
  | DateElement
  | TimeElement
  | DateTimeElement
  | HeadingElement
  | LocationElement
  | RepeatableSetElement
  | PageElement
  | HtmlElement
  | BarcodeScannerElement
  | CaptchaElement
  | ImageElement
  | FileElement
  | FilesElement
  | CalculationElement
  | TelephoneElement
  | AutoCompleteElement
  | SummaryElement

export type FormElementWithForm = FormFormElement | InfoPageElement

export type FormElement = FormElementWithoutForm | FormElementWithForm

export type CalculationInsertionElement =
  | NumberElement
  | CalculationElement
  | SelectElement
  | RadioButtonElement
  | AutoCompleteElement

export type ConditionalPredicateElement =
  | NumberElement
  | CalculationElement
  | SelectElement
  | RadioButtonElement
  | CheckboxElement
  | AutoCompleteElement

///////////////////////////////////////////////////////////////

export interface TrimUriOption {
  label: string
  uri: number
}

export type FormPostSubmissionAction = 'URL' | 'CLOSE' | 'FORMS_LIBRARY'

export interface Form {
  id: number
  name: string
  description: string
  organisationId: string
  formsAppEnvironmentId: number
  formsAppIds: number[]
  elements: FormElement[]
  isAuthenticated: boolean
  isMultiPage: boolean
  publishStartDate: NoU | string
  publishEndDate: NoU | string
  isInfoPage: boolean
  postSubmissionAction: FormPostSubmissionAction
  redirectUrl?: NoU | string
  submissionEvents: FormSubmissionEvent[]
  tags: string[]
}

export type ApiForm = Form

export interface FormElementOptionsValidationOption {
  [optionId: string]: {
    label?: string
    value?: string
    colour?: string
    attributes?: string
  }
}

export type FormElementOptionsValidation = FormElementOptionsValidationOption & {
  allOptions?: string
}

export interface FormElementValidationProperty {
  [propertyName: string]: string | undefined
}
export type FormElementValidation = FormElementValidationProperty & {
  conditionallyShowPredicates?: {
    [index: string]: {
      elementId?: string
      optionIds?: string
      operator?: string
      value?: string
    }
  }
  options?: FormElementOptionsValidation
  attributesMapping?: {
    [label: string]: string | undefined
  }
}

export interface FormElementsValidation {
  [elementId: string]: FormElementValidation
}

export interface FormState {
  forms: NoU | Form[]
  isFetching: boolean
  selectedId: number | null
  isSaving: boolean
  isSaveable: boolean
  isUploading: boolean
  error?: string
  fetchError: NoU | Error
  isShowingPreview: boolean
  isShowingUnsavedChangesPrompt: boolean
  formToDelete?: Form
  isDeleting: boolean
  isShowingElementInUsePrompt: boolean
  selectedElementId: NoU | string
  selectedPageElementId: NoU | string
  elementsValidation: FormElementsValidation
  conditionallyShownOptionsToClearAttributes?: Array<{
    element: FormElementWithOptions
    options: ChoiceElementOption[]
  }>
  conditionalLogicPredicatesToDelete?: ConditionalLogicPredicatesToDelete
  optionIdToDelete?: string
  isExporting: boolean
  isImporting: boolean
  formToConvert: NoU | Form
  formToFetchJSONSchema: NoU | Form
  isFetchingJSONSchema: boolean
  fetchJSONSchemaError: NoU | Error
  formJSONSchema: NoU | object
  confirmationType?: string
}

export type ConditionalLogicPredicatesToDelete = Array<{
  elementId: string
  elementLabel: string
  predicateIndex: number
  optionId?: string
}>

export interface FormElementDynamicOptionSetEnvironment {
  url: string
  formsAppEnvironmentId: number
}

export interface FormElementDynamicOptionSet {
  id?: number
  apiId?: string
  name: string
  organisationId: string
  environments: FormElementDynamicOptionSetEnvironment[]
  createdAt?: string
  updatedAt?: string
}

export type FormElementLookup = FormElementDynamicOptionSet & {
  type: 'ELEMENT' | 'DATA'
  builtInId?: number
}

export interface DynamicOptionSetData {
  options: DynamicChoiceElementOption[]
  isFetching: boolean
  fetchError: boolean
}

export interface DynamicOptionSetDataById {
  [formsAppEnvironmentId: number]: {
    [dynamicOptionSetId: number]: DynamicOptionSetData
  }
}

export interface FormElementDynamicOptionSetsState {
  formElementDynamicOptionSets: NoU | FormElementDynamicOptionSet[]
  isFetching: boolean
  fetchError: NoU | string
  formElementDynamicOptionsSetToEdit: NoU | FormElementDynamicOptionSet
  isSaving: boolean
  saveError: NoU | Error
  formElementDynamicOptionsSetToDelete: NoU | FormElementDynamicOptionSet
  isDeleting: boolean
  deleteError: NoU | Error
  dynamicOptionSetData: DynamicOptionSetDataById
}

export interface FormElementLookupsState {
  formElementLookups: FormElementLookup[]
  isFetching: boolean
  fetchError: NoU | Error
  formElementLookupToEdit: NoU | FormElementLookup
  isSaving: boolean
  saveError: NoU | Error
  formElementLookupToDelete: NoU | FormElementLookup
  isDeleting: boolean
  deleteError: NoU | Error
}

export interface BaseSearchResult {
  meta: {
    limit: null
    offset: null
    nextOffset: null
  }
}

export type FormElementLookupSearchResponse = {
  formElementLookups: FormElementLookup[]
} & BaseSearchResult

export type FormElementDynamicOptionSetSearchResponse = {
  formElementDynamicOptionSets: FormElementDynamicOptionSet[]
} & BaseSearchResult

export interface FormElementCalculationPath {
  label: string
  path: string
  elements: FormElementCalculationPath[]
}

export type FormElementsCalculationPath = FormElementCalculationPath[]

//////////// NEW

export interface FormSubmissionResult {
  submission: {
    [key: string]: unknown
  }
  definition: Form
  formsAppId: number
  submissionId: string | null
  submissionTimestamp: string | null
  payment:
    | NoU
    | {
        hostedFormUrl: string
        submissionEvent: PaymentSubmissionEvent
      }
  keyId?: string
  captchaTokens?: string[]
  draftId: NoU | string
  jobId: NoU | string
  externalId: NoU | string
  preFillFormDataId: NoU | string
  isInPendingQueue?: boolean
  isOffline?: boolean
}

export type PendingFormSubmissionResult = FormSubmissionResult & {
  pendingTimestamp: string
  isSubmitting?: boolean
  error?: string
}

export interface NewFormsAppDraft {
  title: string
  formId: number
  externalId: NoU | string
  jobId: NoU | string
}

export type FormsAppDraft = NewFormsAppDraft & {
  draftId: string
  draftDataId?: string
  updatedAt: string
}

export interface FormsAppDrafts {
  drafts: FormsAppDraft[]
  createdAt?: string
  updatedAt?: string
}

export interface FormsAppJob {
  id: string
  formId: number
  draft?: FormsAppDraft
  externalId?: string
  preFillFormDataId?: string
  createdAt: string
  details: {
    title: string
    key: NoU | string
    priority: NoU | string
    description: NoU | string
    type: NoU | string
  }
}

export interface S3UploadCredentials {
  submissionId: string
  submissionTimestamp: string
  credentials: {
    AccessKeyId: string
    SecretAccessKey: string
    SessionToken: string
  }
  s3: {
    region: string
    bucket: string
    key: string
  }
}
