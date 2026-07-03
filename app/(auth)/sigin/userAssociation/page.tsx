import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UserInscription() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-4">

      <Link
        href="/sigin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Retour
      </Link>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Votre compte personnel Sigma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" type="text" placeholder="Jean" required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" type="text" placeholder="Dupont" required />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jean@example.fr" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input id="confirmPassword" type="password" required />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full">Créer mon compte</Button>
          <p className="text-sm text-muted-foreground text-center">
            Vous avez déjà un compte ?{" "}
            <a href="/login" className="text-primary font-medium hover:underline underline-offset-4">
              Se connecter
            </a>
          </p>
        </CardFooter>
      </Card>

    </div>
  );
}
