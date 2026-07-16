export type TransactionType   = 'income' | 'expense'
export type PaymentMethod     = 'cash' | 'check' | 'transfer' | 'card' | 'other'
export type TransactionStatus = 'validated' | 'pending'

export const INCOME_CATEGORIES = [
  { id: 'cotisations',      label: 'Cotisations' },
  { id: 'subventions',      label: 'Subventions' },
  { id: 'dons',             label: 'Dons & libéralités' },
  { id: 'recettes_activite',label: 'Recettes d\'activités' },
  { id: 'produits_financiers', label: 'Produits financiers' },
  { id: 'autres_produits',  label: 'Autres produits' },
] as const

export const EXPENSE_CATEGORIES = [
  { id: 'materiel',         label: 'Matériel & équipement' },
  { id: 'deplacements',     label: 'Déplacements' },
  { id: 'communication',    label: 'Communication' },
  { id: 'assurances',       label: 'Assurances' },
  { id: 'loyers',           label: 'Loyers & charges' },
  { id: 'administratif',    label: 'Frais administratifs' },
  { id: 'activites',        label: 'Frais d\'activités' },
  { id: 'personnel',        label: 'Personnel' },
  { id: 'affiliations',     label: 'Affiliations & cotisations versées' },
  { id: 'autres_charges',   label: 'Autres charges' },
] as const

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'transfer', label: 'Virement' },
  { id: 'check',    label: 'Chèque' },
  { id: 'cash',     label: 'Espèces' },
  { id: 'card',     label: 'Carte bancaire' },
  { id: 'other',    label: 'Autre' },
]

export interface Transaction {
  id:            string
  type:          TransactionType
  amount:        number        // en euros (décimal)
  category:      string
  label:         string
  date:          string        // ISO YYYY-MM-DD
  paymentMethod: PaymentMethod
  status:        TransactionStatus
  notes?:        string
  attachmentUrl?: string
  createdAt:     string
}

export interface BudgetLine {
  categoryId:     string
  categoryLabel:  string
  type:           TransactionType
  plannedAmount:  number
  actualAmount:   number
}

export interface TreasuryStats {
  balance:             number
  currentMonthIncome:  number
  currentMonthExpense: number
  yearIncome:          number
  yearExpense:         number
  monthlyData:         { month: number; income: number; expense: number }[]
}

export interface TransactionMeta {
  total:       number
  perPage:     number
  currentPage: number
  lastPage:    number
}
