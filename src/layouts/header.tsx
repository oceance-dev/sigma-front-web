"use client";

import { useAuth } from "@/src/context/auth-context";
import { apiFetch } from "@/src/lib/api-client";
import {
  reportLatestNewsFromEntries,
  setNewsUser,
  useHasUnreadNews,
} from "@/src/lib/news-notifications";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountModal } from "@/components/AccountModal";
import logoSigma from "@/public/logo_sigma.png";
import logoSigmaWhite from "@/public/logo_sigma_white.png";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const hasUnreadNews = useHasUnreadNews();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  // Ferme le panneau de notifications au clic extérieur ou sur Échap
  useEffect(() => {
    if (!notifOpen) return;
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  // Associe le suivi des nouveautés à l'utilisateur courant
  useEffect(() => {
    setNewsUser(user?.id ?? null);
  }, [user?.id]);

  // Récupère la dernière nouveauté publiée pour décider d'afficher la pastille
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    apiFetch("/news")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        const entries = json.data?.entries ?? json.data ?? [];
        reportLatestNewsFromEntries(entries);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link href="/dashboard" aria-label="Accueil Sigma" className="flex items-center">
            <Image
              src={logoSigma}
              alt="Sigma"
              priority
              placeholder="blur"
              className="h-16 w-auto dark:hidden"
            />
            <Image
              src={logoSigmaWhite}
              alt="Sigma"
              priority
              placeholder="blur"
              className="hidden h-16 w-auto dark:block"
            />
          </Link>

          <div className="flex items-center gap-1">
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={hasUnreadNews ? "Notifications — nouveautés disponibles" : "Notifications"}
                aria-haspopup="menu"
                aria-expanded={notifOpen}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Bell size={18} />
                {hasUnreadNews && (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                )}
              </button>
              <NotificationsDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* Bouton avatar → ouvre la popup Mon compte */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-accent transition-colors select-none ml-1"
              aria-label="Ouvrir mon compte"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex shrink-0 items-center justify-center text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-foreground">
                  {user ? `${user.firstName} ${user.lastName}` : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {!!user?.isSuperAdmin ? 'Super Administrateur' : user?.isAdmin ? 'Administrateur' : ''}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <AccountModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
