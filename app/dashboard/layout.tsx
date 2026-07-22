'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/auth-context';
import { ROLE_KEYS } from '@/src/lib/role-keys';
import BottomNav from "@/src/layouts/bottom-nav";
import Header from "@/src/layouts/header";
import Sidebar from "@/src/layouts/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, association } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }

    // Les super admins ont leur propre espace
    if (!!user?.isSuperAdmin) { router.replace('/superAdmin'); return; }

    const roleKey       = user?.associationRoleKey ?? '';
    const isGendarmerie = association?.type === 'gendarmerie';

    if (roleKey === ROLE_KEYS.CANDIDAT) {
      router.replace('/candidat/documents');
      return;
    }

    if (isGendarmerie && roleKey === ROLE_KEYS.MEMBER) {
      const cadetAllowed = pathname === '/dashboard' || pathname.startsWith('/dashboard/document');
      if (!cadetAllowed) router.replace('/dashboard');
      return;
    }

    const hasAccess = association?.isTrial || association?.hasValidSubscription;
    const isAdmin = roleKey === ROLE_KEYS.ADMIN;
    const onAccessPage = pathname === '/dashboard/plan' || pathname === '/dashboard/billing' || pathname === '/dashboard/acces-suspendu';

    if (!hasAccess && !onAccessPage) {
      router.replace(isAdmin ? '/dashboard/plan' : '/dashboard/acces-suspendu');
    }
  }, [isAuthenticated, isLoading, user, association, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !!user?.isSuperAdmin) return null;

  // Ne pas afficher le layout dashboard pour les candidats — ils sont redirigés
  const roleKey = user?.associationRoleKey ?? ''
  if (roleKey === ROLE_KEYS.CANDIDAT) return null;

  return (
    <>
      <Header />
      <Sidebar />
      <main className="dashboard-main">{children}</main>
      <BottomNav />
    </>
  );
}
