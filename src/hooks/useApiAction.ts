'use client'

import { useState, useTransition } from 'react'
import { apiFetch } from '@/src/lib/api-client'

interface UseApiActionOptions<T> {
  onSuccess?: (json: T) => void
  onError?:   (message: string, json: unknown) => void
}

export function useApiAction<T = unknown>(options: UseApiActionOptions<T> = {}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function execute(path: string, init: RequestInit = {}) {
    setError(null)
    startTransition(async () => {
      const res  = await apiFetch(path, init)
      const json = await res.json().catch(() => ({})) as Record<string, unknown>
      if (!res.ok) {
        const msg = (json.message as string) ?? 'Une erreur est survenue.'
        setError(msg)
        options.onError?.(msg, json)
        return
      }
      options.onSuccess?.(json as T)
    })
  }

  return { isPending, error, setError, execute }
}
