import { FileText, Home, Users, Wallet } from "lucide-react";

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  cadetOnly?: boolean
  staffOnly?: boolean
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
    label: "Trésorerie",
    href: "/dashboard/tresorerie",
    icon: <Wallet size={18} />,
    staffOnly: true,
    hidden: true,
  },
]
