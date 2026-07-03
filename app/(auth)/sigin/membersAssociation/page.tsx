import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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

export default function MemberInscription() {
  return (
    <div className="w-full max-w-xl flex flex-col gap-4">

      <Link
        href="/sigin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Retour
      </Link>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Rejoindre une association</CardTitle>
          <CardDescription>Renseignez les codes transmis par votre association</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="codeAssociation">Code de l'association</Label>
              <Input id="codeAssociation" type="text" placeholder="ASSOC-XXXX" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="invitationCode">Code d'invitation</Label>
              <Input id="invitationCode" type="text" placeholder="INV-XXXX" required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Informations du membre</CardTitle>
          <CardDescription>Vos informations personnelles</CardDescription>
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
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" placeholder="+33 6 00 00 00 00" required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Informations de connexion</CardTitle>
          <CardDescription>Ces identifiants vous permettront de vous connecter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
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
