import { ApprovalTypes, FormTypes, SubmissionTypes } from '@oneblink/types'

export type FormSubmissionApprovalsResponse = {
  forms: FormTypes.Form[]
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
  formApprovalFlowInstances: ApprovalTypes.FormApprovalFlowInstance[]
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta[]
}

export type FormApprovalFlowInstanceHistory = {
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
  formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
}

export type FormSubmissionApprovalResponse = {
  formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
  formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
  formSubmissionApproval: ApprovalTypes.FormSubmissionApproval
  form: FormTypes.Form
  history: FormApprovalFlowInstanceHistory[]
}

export type FormSubmissionsAdministrationApprovalsResponse = {
  approvals: Array<{
    formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
    formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
    formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
    history: Array<{
      formSubmissionMeta: SubmissionTypes.FormSubmissionMeta
      formApprovalFlowInstance: ApprovalTypes.FormApprovalFlowInstance
      formSubmissionApprovals: ApprovalTypes.FormSubmissionApproval[]
    }>
  }>
  meta: {
    limit: number
    offset: number
    nextOffset?: number
  }
}
