'use client'

import { useSyncExternalStore } from 'react'

// Store partagé pour l'état « nouveautés non lues », synchronisé entre le header
// (pastille) et les vues qui consultent les nouveautés (dropdown, page dédiée).
//
// On se base sur la DATE DE PUBLICATION la plus récente (et non sur un id) : cela
// couvre les nouvelles publications, les re-publications et la publication d'un
// brouillon créé antérieurement (dont l'id serait plus ancien). Le dernier instant
// consulté est persisté par utilisateur dans le localStorage.

let currentUserId: string | null = null
let latestAt = 0    // epoch ms de la nouveauté publiée la plus récente
let lastSeenAt = 0  // epoch ms de la dernière consultation
const listeners = new Set<() => void>()

function storageKey(userId: string) {
  return `sigma:news:lastSeenAt:${userId}`
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getSnapshot() {
  return latestAt > lastSeenAt
}

/** Associe le store à l'utilisateur courant et recharge son dernier instant consulté. */
export function setNewsUser(userId: string | null) {
  if (userId === currentUserId) return
  currentUserId = userId
  lastSeenAt = userId ? Number(localStorage.getItem(storageKey(userId))) || 0 : 0
  emit()
}

/** Déclare l'instant de la nouveauté publiée la plus récente (epoch ms). */
export function reportLatestNewsAt(timestampMs: number) {
  if (!Number.isFinite(timestampMs) || timestampMs <= latestAt) return
  latestAt = timestampMs
  emit()
}

/** Calcule et déclare le max des `publishedAt` d'une liste d'articles. */
export function reportLatestNewsFromEntries(entries: { publishedAt?: string | null }[]) {
  const max = entries.reduce((m, e) => {
    const t = e.publishedAt ? new Date(e.publishedAt).getTime() : 0
    return Number.isFinite(t) && t > m ? t : m
  }, 0)
  reportLatestNewsAt(max)
}

/** Marque toutes les nouveautés comme lues pour l'utilisateur courant. */
export function markNewsSeen() {
  if (!currentUserId || latestAt <= lastSeenAt) return
  lastSeenAt = latestAt
  localStorage.setItem(storageKey(currentUserId), String(latestAt))
  emit()
}

/** Renvoie true s'il existe au moins une nouveauté non lue. */
export function useHasUnreadNews() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
