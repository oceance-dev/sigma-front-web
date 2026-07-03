import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, ChevronRight, User, Users } from "lucide-react";
import Link from "next/link";

const types = [
  {
    label: "Association",
    description: "Inscrivez votre association et gérez vos membres",
    icon: <Building2 size={22} />,
    href: "/sigin/association",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Membre",
    description: "Rejoignez une association avec un code d'invitation",
    icon: <Users size={22} />,
    href: "/sigin/membersAssociation",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export default function SigninPage() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Créer un compte
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quel type de compte souhaitez-vous créer ?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {types.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all">
              <CardContent className="flex items-center gap-4 py-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    t.bg,
                    t.color,
                  )}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Vous avez déjà un compte ?{" "}
        <a
          href="/login"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          Se connecter
        </a>
      </p>
    </div>
  );
}
