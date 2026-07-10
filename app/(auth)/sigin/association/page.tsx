'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Mail, MapPin } from 'lucide-react';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE = '/api/sigma';
const FR_PHONE = /^0[1-9]\d{8}$/;
const NAME_RE = /^[a-zA-ZÀ-ÿ\s\-]+$/;

// ── Validation ─────────────────────────────────────────────

type Errors = Record<string, string>;

function validateForm(fd: FormData, sexe: string): Errors {
  const e: Errors = {};
  const get = (k: string) => (fd.get(k) as string ?? '').trim();

  // — Association
  const name = get('assoc_name');
  if (!name || name.length < 3 || name.length > 255)
    e.assoc_name = 'Nom requis (3–255 caractères)';

  const rna = get('rna');
  if (rna && !/^W\d{9}$/.test(rna))
    e.rna = 'Format : W + 9 chiffres (ex. W801234567)';

  const siret = get('siret');
  if (siret && !/^\d{14}$/.test(siret))
    e.siret = 'Exactement 14 chiffres';

  const assocEmail = get('assoc_email');
  if (assocEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assocEmail))
    e.assoc_email = 'Email invalide';

  const assocPhone = get('assoc_phone').replace(/\s/g, '');
  if (assocPhone && !FR_PHONE.test(assocPhone))
    e.assoc_phone = 'Format invalide (ex. 0612345678)';

  const address = get('address');
  if (address && (address.length < 5 || address.length > 255))
    e.address = '5–255 caractères';

  const city = get('city');
  if (!city || city.length < 2 || city.length > 100)
    e.city = 'Ville requise (2–100 caractères)';

  const postalCode = get('postalCode');
  if (!/^\d{5}$/.test(postalCode))
    e.postalCode = '5 chiffres requis';

  const country = get('country');
  if (!country || country.length < 2 || country.length > 100)
    e.country = 'Pays requis';

  // — Responsable
  const firstName = get('firstName');
  if (!firstName || firstName.length < 2 || firstName.length > 100 || !NAME_RE.test(firstName))
    e.firstName = 'Prénom requis (2–100 car., lettres/espaces/tirets)';

  const lastName = get('lastName');
  if (!lastName || lastName.length < 2 || lastName.length > 100 || !NAME_RE.test(lastName))
    e.lastName = 'Nom requis (2–100 car., lettres/espaces/tirets)';

  const respEmail = get('resp_email');
  if (!respEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respEmail))
    e.resp_email = 'Email valide requis';

  const pw = fd.get('password') as string ?? '';
  const checks = pwChecks(pw);
  if (!Object.values(checks).every(Boolean))
    e.password = 'Le mot de passe ne respecte pas les critères';

  const confirm = fd.get('passwordConfirmation') as string ?? '';
  if (pw !== confirm)
    e.passwordConfirmation = 'Les mots de passe ne correspondent pas';

  const respPhone = get('resp_phone').replace(/\s/g, '');
  if (!respPhone || !FR_PHONE.test(respPhone))
    e.resp_phone = 'Téléphone requis (ex. 0612345678)';

  const cityCode = get('city_code');
  if (!/^\d{5}$/.test(cityCode))
    e.city_code = '5 chiffres requis';

  const dob = get('dateOfBirth');
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob))
    e.dateOfBirth = 'Format YYYY-MM-DD attendu';

  return e;
}

function pwChecks(pw: string) {
  return {
    length: pw.length >= 12 && pw.length <= 128,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^a-zA-Z0-9]/.test(pw),
  };
}

// ── Types ──────────────────────────────────────────────────

type DeptInfo = { code: string; nom: string };
type SuccessData = {
  message: string;
  data: {
    association: { id: string; name: string; status: string };
    responsable: { firstName: string; lastName: string; email: string };
  };
};

// ── Component ──────────────────────────────────────────────

export default function AssociationInscription() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [isPending, startTransition] = useTransition();

  // Controlled fields
  const [postalCode, setPostalCode] = useState('');
  const [dept, setDept] = useState<DeptInfo | null>(null);
  const [loadingDept, setLoadingDept] = useState(false);
  const [password, setPassword] = useState('');
  const [sexe, setSexe] = useState<'Homme' | 'Femme' | ''>('');
  const [assocType, setAssocType] = useState('gendarmerie');

  const checks = pwChecks(password);
  const disabled = isPending;

  async function onPostalChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 5);
    setPostalCode(digits);
    if (digits.length !== 5) { setDept(null); return; }
    setLoadingDept(true);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${digits}&fields=codeDepartement,departement&limit=1`,
      );
      const data = await res.json();
      setDept(data[0] ? { code: data[0].codeDepartement, nom: data[0].departement.nom } : null);
    } catch {
      setDept(null);
    } finally {
      setLoadingDept(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError(null);

    const fd = new FormData(e.currentTarget);
    const fieldErrors = validateForm(fd, sexe);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        const get = (k: string) => (fd.get(k) as string ?? '').trim();

        const body = {
          association: {
            name: get('assoc_name'),
            type: assocType,
            ...(get('rna') && { rna: get('rna') }),
            ...(get('siret') && { siret: get('siret') }),
            ...(get('assoc_email') && { email: get('assoc_email') }),
            ...(get('assoc_phone') && { phone: get('assoc_phone').replace(/\s/g, '') }),
            ...(get('address') && { address: get('address') }),
            city: get('city'),
            postalCode: get('postalCode'),
            country: get('country'),
          },
          responsable: {
            firstName: get('firstName'),
            lastName: get('lastName'),
            email: get('resp_email'),
            password: fd.get('password') as string,
            passwordConfirmation: fd.get('passwordConfirmation') as string,
            phone: get('resp_phone').replace(/\s/g, ''),
            city_code: get('city_code'),
            ...(get('dateOfBirth') && { dateOfBirth: get('dateOfBirth') }),
            ...(sexe && { sexe }),
          },
        };

        const res = await fetch(`${API_BASE}/register/association`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 422 && Array.isArray(json.errors)) {
            const map: Record<string, string> = {
              'association.name': 'assoc_name',
              'association.rna': 'rna',
              'association.siret': 'siret',
              'association.email': 'assoc_email',
              'association.phone': 'assoc_phone',
              'association.city': 'city',
              'association.postalCode': 'postalCode',
              'responsable.firstName': 'firstName',
              'responsable.lastName': 'lastName',
              'responsable.email': 'resp_email',
              'responsable.password': 'password',
              'responsable.phone': 'resp_phone',
              'responsable.city_code': 'city_code',
            };
            const serverErrors: Errors = {};
            for (const err of json.errors) {
              serverErrors[map[err.field] ?? err.field] = err.message;
            }
            setErrors(serverErrors);
          } else {
            setGlobalError(json.message ?? 'Une erreur est survenue. Veuillez réessayer.');
          }
          return;
        }

        setSuccess(json);
        const email = encodeURIComponent(body.responsable.email);
        router.push(`/verify-email?email=${email}`);
      } catch {
        setGlobalError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
    });
  }

  // ── Success state ──────────────────────────────────────────

  if (success) {
    return (
      <div className="w-full max-w-xl flex flex-col gap-4">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">{success.data.association.name}</p>
              <p className="text-sm text-muted-foreground max-w-xs">{success.message}</p>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-4 py-3 text-left max-w-xs">
              <Mail size={15} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Un email de confirmation a été envoyé à{' '}
                <span className="font-medium text-foreground">{success.data.responsable.email}</span>.
                Consultez votre boîte mail pour suivre l'activation de votre compte.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Retour à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <Link
        href="/sigin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Retour
      </Link>

      {globalError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        {/* ── Association ─────────────────────────────────── */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Informations de l'association</CardTitle>
            <CardDescription>Les informations officielles de votre association</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">

              <Field id="assoc_name" label="Nom de l'association" required error={errors.assoc_name}>
                <Input
                  id="assoc_name"
                  name="assoc_name"
                  placeholder="Cadets de la Somme"
                  required
                  disabled={disabled}
                  aria-invalid={!!errors.assoc_name}
                />
              </Field>

              <div className="grid gap-1.5">
                <Label htmlFor="assoc_type">Type d'association *</Label>
                <select
                  id="assoc_type"
                  value={assocType}
                  onChange={(e) => setAssocType(e.target.value)}
                  disabled={disabled}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="gendarmerie">Gendarmerie</option>
                  <option value="sport">Sportive</option>
                  <option value="culturelle">Culturelle</option>
                  <option value="generale">Générale</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field id="rna" label="RNA" error={errors.rna}>
                  <Input
                    id="rna"
                    name="rna"
                    placeholder="W801234567"
                    disabled={disabled}
                    maxLength={10}
                    aria-invalid={!!errors.rna}
                  />
                </Field>
                <Field id="siret" label="SIRET" error={errors.siret}>
                  <Input
                    id="siret"
                    name="siret"
                    inputMode="numeric"
                    placeholder="12345678901234"
                    disabled={disabled}
                    maxLength={14}
                    aria-invalid={!!errors.siret}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field id="assoc_email" label="Email" error={errors.assoc_email}>
                  <Input
                    id="assoc_email"
                    name="assoc_email"
                    type="email"
                    placeholder="contact@asso.fr"
                    disabled={disabled}
                    aria-invalid={!!errors.assoc_email}
                  />
                </Field>
                <Field id="assoc_phone" label="Téléphone" error={errors.assoc_phone}>
                  <Input
                    id="assoc_phone"
                    name="assoc_phone"
                    type="tel"
                    placeholder="0612345678"
                    disabled={disabled}
                    maxLength={10}
                    aria-invalid={!!errors.assoc_phone}
                  />
                </Field>
              </div>

              <Field id="address" label="Adresse" error={errors.address}>
                <Input
                  id="address"
                  name="address"
                  placeholder="12 rue de la Paix"
                  disabled={disabled}
                  aria-invalid={!!errors.address}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field id="postalCode" label="Code postal" required error={errors.postalCode}>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    inputMode="numeric"
                    placeholder="80000"
                    value={postalCode}
                    onChange={(e) => onPostalChange(e.target.value)}
                    disabled={disabled}
                    maxLength={5}
                    aria-invalid={!!errors.postalCode}
                  />
                  {loadingDept && (
                    <p className="mt-1 text-xs text-muted-foreground">Recherche…</p>
                  )}
                  {dept && !loadingDept && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                      <MapPin size={11} />
                      Dép. {dept.code} — {dept.nom}
                    </p>
                  )}
                </Field>
                <Field id="city" label="Ville" required error={errors.city}>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Amiens"
                    required
                    disabled={disabled}
                    aria-invalid={!!errors.city}
                  />
                </Field>
              </div>

              <Field id="country" label="Pays" required error={errors.country}>
                <Input
                  id="country"
                  name="country"
                  defaultValue="France"
                  disabled={disabled}
                  aria-invalid={!!errors.country}
                />
              </Field>

            </div>
          </CardContent>
        </Card>

        {/* ── Responsable ─────────────────────────────────── */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Compte administrateur</CardTitle>
            <CardDescription>La personne responsable du compte Sigma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">

              <div className="grid grid-cols-2 gap-3">
                <Field id="firstName" label="Prénom" required error={errors.firstName}>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Jean"
                    required
                    disabled={disabled}
                    autoComplete="given-name"
                    aria-invalid={!!errors.firstName}
                  />
                </Field>
                <Field id="lastName" label="Nom" required error={errors.lastName}>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Dupont"
                    required
                    disabled={disabled}
                    autoComplete="family-name"
                    aria-invalid={!!errors.lastName}
                  />
                </Field>
              </div>

              <Field id="resp_email" label="Email" required error={errors.resp_email}>
                <Input
                  id="resp_email"
                  name="resp_email"
                  type="email"
                  placeholder="jean.dupont@mail.com"
                  required
                  disabled={disabled}
                  autoComplete="email"
                  aria-invalid={!!errors.resp_email}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field id="resp_phone" label="Téléphone" required error={errors.resp_phone}>
                  <Input
                    id="resp_phone"
                    name="resp_phone"
                    type="tel"
                    placeholder="0612345678"
                    required
                    disabled={disabled}
                    maxLength={10}
                    autoComplete="tel"
                    aria-invalid={!!errors.resp_phone}
                  />
                </Field>
                <Field id="city_code" label="Code postal" required error={errors.city_code}>
                  <Input
                    id="city_code"
                    name="city_code"
                    inputMode="numeric"
                    placeholder="80000"
                    required
                    disabled={disabled}
                    maxLength={5}
                    aria-invalid={!!errors.city_code}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field id="dateOfBirth" label="Date de naissance" error={errors.dateOfBirth}>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    disabled={disabled}
                    autoComplete="bday"
                    aria-invalid={!!errors.dateOfBirth}
                  />
                </Field>
                <div className="grid gap-1.5">
                  <Label>
                    Genre
                    <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>
                  </Label>
                  <div className="flex items-center gap-4 h-9">
                    {(['Homme', 'Femme'] as const).map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-sm select-none">
                        <input
                          type="radio"
                          name="sexe"
                          value={g}
                          checked={sexe === g}
                          onChange={() => setSexe(g)}
                          disabled={disabled}
                          className="h-4 w-4 accent-primary"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Field id="password" label="Mot de passe" required error={errors.password}>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  disabled={disabled}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                {password.length > 0 && (
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <PwCheck ok={checks.length}>12–128 caractères</PwCheck>
                    <PwCheck ok={checks.lower}>1 minuscule</PwCheck>
                    <PwCheck ok={checks.upper}>1 majuscule</PwCheck>
                    <PwCheck ok={checks.digit}>1 chiffre</PwCheck>
                    <PwCheck ok={checks.special}>1 caractère spécial</PwCheck>
                  </ul>
                )}
              </Field>

              <Field
                id="passwordConfirmation"
                label="Confirmer le mot de passe"
                required
                error={errors.passwordConfirmation}
              >
                <PasswordInput
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  required
                  disabled={disabled}
                  autoComplete="new-password"
                  aria-invalid={!!errors.passwordConfirmation}
                />
              </Field>

            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={disabled}>
              {isPending ? 'Envoi en cours…' : "Créer mon compte"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Vous avez déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>

      </form>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {!required && (
          <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function PwCheck({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`flex items-center gap-1.5 text-xs transition-colors ${
        ok ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <span className="text-[10px] font-bold">{ok ? '✓' : '○'}</span>
      {children}
    </li>
  );
}
