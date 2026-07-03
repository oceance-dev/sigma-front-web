export interface BillingPlan {
  priceId: string
  slug: string
  amount: number
  currency: string
  interval: 'month' | 'year'
  label: string
  features: string[]
}

export interface Invoice {
  id: string
  stripeInvoiceId: string
  amountPaid: number
  amountPaidFormatted: string
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  invoicePdf: string
  paidAt: string
  createdAt: string
}
