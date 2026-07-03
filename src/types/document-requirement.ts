export interface DocumentType {
  id: number
  name: string
  description: string | null
  validityDays: number | null
}

export interface TemplateDocument {
  id: string
  name: string
  fileName: string
  fileUrl: string
  mimeType: string
}

export interface DocumentRequirement {
  id: number
  associationId: string
  documentTypeId: number
  isEnabled: boolean
  isRequired: boolean
  requiredFor: string
  requiredForLabel: string
  requiredAt: string
  requiredAtLabel: string
  customInstructions: string | null
  customName: string | null
  sortOrder: number
  customValidityDays: number | null
  templateDocumentId: string | null
  effectiveName: string
  effectiveInstructions: string | null
  effectiveValidityDays: number | null
  documentType: DocumentType
  templateDocument: TemplateDocument | null
  createdAt: string
  updatedAt: string
}

export interface DocumentRequirementFormData {
  documentTypeId: number
  isRequired: boolean
  requiredFor: string
  requiredAt: string
  customName: string
  customInstructions: string
  customValidityDays: string
  sortOrder: number
}
