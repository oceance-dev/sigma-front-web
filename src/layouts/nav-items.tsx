import { CreditCard, FileText, Home, Receipt, Users } from "lucide-react";

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  cadetOnly?: boolean
  staffOnly?: boolean
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
    label: "Abonnement",
    href: "/dashboard/plan",
    icon: <CreditCard size={18} />,
    staffOnly: true,
  },
  {
    label: "Facturation",
    href: "/dashboard/billing",
    icon: <Receipt size={18} />,
    staffOnly: true,
  },
];
