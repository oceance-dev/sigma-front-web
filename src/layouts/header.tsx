"use client";

import { useAuth } from "@/src/context/auth-context";
import { Bell, HelpCircle, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.replace("/login");
    });
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-inner">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Sigma
        </span>

        <div className="flex items-center gap-1">
          <button
            aria-label="Notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Bell size={18} />
          </button>

          {/* Avatar + dropdown */}
          <div ref={ref} className="relative ml-1">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-accent transition-colors select-none"
              aria-label="Menu utilisateur"
              aria-expanded={open}
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

            {open && (
              <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-card shadow-lg">
                {/* Infos utilisateur */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>

                {/* Navigation */}
                <div className="p-1">
                  <Link href="/dashboard/profil" onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                    <User size={15} className="text-muted-foreground" />
                    Mon profil
                  </Link>
                  <Link href="/dashboard/parametres" onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">
                    <Settings size={15} className="text-muted-foreground" />
                    Paramètres
                  </Link>
                </div>

                {/* Support */}
                <div className="p-1 border-t border-border">
                  <a
                    href="mailto:support@sigma-app.fr"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    <HelpCircle size={15} className="text-muted-foreground" />
                    Contacter le support
                  </a>
                </div>

                {/* Actions */}
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {isPending ? "Déconnexion…" : "Se déconnecter"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
