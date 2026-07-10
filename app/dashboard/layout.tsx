'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/auth-context';
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

    if (roleKey === '4') {
      router.replace('/candidat/documents');
      return;
    }

    if (isGendarmerie && roleKey === '5') {
      const cadetAllowed = pathname === '/dashboard' || pathname.startsWith('/dashboard/document');
      if (!cadetAllowed) router.replace('/dashboard');
      return;
    }

    const hasAccess = association?.isTrial || association?.hasValidSubscription;
    const onBillingPage = pathname === '/dashboard/plan' || pathname === '/dashboard/billing';

    if (!hasAccess && !onBillingPage) {
      router.replace('/dashboard/plan');
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

  return (
    <>
      <Header />
      <Sidebar />
      <main className="dashboard-main">{children}</main>
      <BottomNav />
    </>
  );
}
