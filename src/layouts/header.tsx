"use client";

import { useAuth } from "@/src/context/auth-context";
import { Bell } from "lucide-react";
import { useState } from "react";
import { AccountModal } from "@/components/AccountModal";

export default function Header() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  return (
    <>
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
