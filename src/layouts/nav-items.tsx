import { ClipboardList, FileText, GraduationCap, HeartPulse, Home, Users, Wallet } from "lucide-react";

export interface NavItem {
  id?: string
  label: string
  href: string
  icon: React.ReactNode
  cadetOnly?: boolean
  staffOnly?: boolean
  gendarmerieOnly?: boolean
  requiresSanitaire?: boolean
  permission?: string
  hidden?: boolean
}

export const navItems: NavItem[] = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: <Home size={18} />,
  },
  {
    label: "Documents",
    href: "/dashboard/document",
    icon: <FileText size={18} />,
  },
  {
    label: "Association",
    href: "/dashboard/association",
    icon: <Users size={18} />,
    staffOnly: true,
  },
  {
    id: "cadets",
    label: "Cadets",
    href: "/dashboard/cadets",
    icon: <GraduationCap size={18} />,
    staffOnly: true,
    permission: "cadets.read",
  },
  {
    label: "Candidatures",
    href: "/dashboard/candidatures",
    icon: <ClipboardList size={18} />,
    staffOnly: true,
    gendarmerieOnly: true,
  },
  {
    label: "Sanitaire",
    href: "/dashboard/sanitaire",
    icon: <HeartPulse size={18} />,
    staffOnly: true,
    gendarmerieOnly: true,
    requiresSanitaire: true,
  },
  {
    label: "Trésorerie",
    href: "/dashboard/tresorerie",
    icon: <Wallet size={18} />,
    staffOnly: true,
    hidden: true,
  },
]
