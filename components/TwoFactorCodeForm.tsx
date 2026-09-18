'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TwoFactorCodeFormProps {
  description: string
  error: string | null
  isPending: boolean
  submitLabel?: string
  submitVariant?: 'default' | 'destructive'
  onSubmit: (code: string) => void
  footer?: React.ReactNode
}

export function TwoFactorCodeForm({
  description,
  error,
  isPending,
  submitLabel = 'Vérifier',
  submitVariant,
  onSubmit,
  footer,
}: TwoFactorCodeFormProps) {
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    onSubmit(code)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="grid gap-1.5">
        <Label htmlFor="two-factor-code">Code de vérification</Label>
        <Input
          id="two-factor-code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={isPending}
          className="text-center text-lg tracking-[0.4em]"
        />
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
          {error}
        </p>
      )}
      <Button type="submit" variant={submitVariant} className="w-full" disabled={isPending || code.length !== 6}>
        {isPending ? 'Vérification…' : submitLabel}
      </Button>
      {footer}
    </form>
  )
}
