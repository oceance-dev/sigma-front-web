import { LegalFooter } from '@/components/legal-footer'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="auth-layout">
      {children}
      <LegalFooter className="justify-center pt-6 pb-3" />
    </main>
  )
}
