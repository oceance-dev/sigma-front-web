"use client";

import {
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CustomField } from "@/src/types/association";
import { useAuth } from "@/src/context/auth-context";
import { DynamicForm } from "@/components/DynamicForm";
import type { FormField } from "@/src/types/form";
import { SiginCadetSchema, SiginGenericSchema } from "@/src/schema/authSchema";
import { FR_PHONE_REGEX, EMAIL_REGEX } from "@/src/lib/validators";

const API = "/api/sigma";

// ── Types ──────────────────────────────────────────────────

interface AssociationInfo {
  id: string;
  name: string;
  slug: string;
  type: "gendarmerie" | "sport" | "culturelle" | "generale" | null;
  city: string;
  postalCode: string;
  country: string;
  email: string | null;
  customFields?: CustomField[];
  afterRegistrationRedirect?: "documents" | "login";
}

type Errors = Record<string, string>;

interface ParentData {
  type: string;
  typeOther: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const EMPTY_PARENT: ParentData = {
  type: "Mère",
  typeOther: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const PARENT_TYPES = ["Père", "Mère", "Tuteur légal", "Tutrice légale", "Autre"];


// ── Helper ─────────────────────────────────────────────────

function mapServerErrors(errs: { field: string; message: string }[]): Errors {
  const map: Record<string, string> = {
    "candidat.firstname": "firstname",
    "candidat.lastname": "lastname",
    "candidat.dateOfBirth": "dateOfBirth",
    "candidat.sexe": "sexe",
    "candidat.email": "email",
    "candidat.phone": "phone",
    "candidat.city_code": "city_code",
    "candidat.city": "city",
    "candidat.password": "password",
    "candidat.passwordConfirmation": "passwordConfirmation",
    "parent.emailParent": "parent0_email",
    "parent.phoneParent": "parent0_phone",
    "parent.firstNameParent": "parent0_firstName",
    "parent.lastNameParent": "parent0_lastName",
  };
  const out: Errors = {};
  for (const err of errs) out[map[err.field] ?? err.field] = err.message;
  return out;
}

function assocTypeLabel(type: AssociationInfo["type"]) {
  switch (type) {
    case "gendarmerie": return "Cadets de la Gendarmerie";
    case "sport": return "Association sportive";
    case "culturelle": return "Association culturelle";
    case "generale": return "Association générale";
    default: return "Association";
  }
}

// ── Page principale ────────────────────────────────────────

export default function InscriptionSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { login } = useAuth();

  const [assoc, setAssoc] = useState<AssociationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function handleSuccess(email: string, password: string) {
    const redirect = assoc?.afterRegistrationRedirect;
    if (redirect === "documents" || redirect === "login") {
      setRedirecting(true);
      const result = await login(email, password);
      if (!result.error) {
        window.location.href = "/candidat/documents";
        return;
      }
      setRedirecting(false);
    }
    setSuccess(true);
  }

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/associations/inscription/${slug}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setLoadError(json.message ?? "Association introuvable.");
          return;
        }
        const assocData = json.data?.association ?? json.data;
        setAssoc(assocData);
      })
      .catch(() => setLoadError("Impossible de joindre le serveur."))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError || !assoc) {
    return (
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Link
          href="/sigin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft size={15} /> Retour
        </Link>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">
              {loadError ?? "Association introuvable ou inactive."}
            </p>
            <Link
              href="/sigin"
              className="text-sm text-primary hover:underline underline-offset-4"
            >
              Retour
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connexion en cours…</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">
                {assoc.type === "gendarmerie"
                  ? "Candidature envoyée !"
                  : "Inscription envoyée !"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {assoc.type === "gendarmerie"
                  ? `Votre candidature auprès de ${assoc.name} a bien été reçue. L'équipe reviendra vers vous pour la valider.`
                  : `Votre demande d'adhésion à ${assoc.name} a bien été enregistrée.`}
              </p>
            </div>
            <Link
              href="/login"
              className="mt-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Aller à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGendarmerie = assoc.type?.toLowerCase() === "gendarmerie";

  return isGendarmerie ? (
    <CadetForm assoc={assoc} onSuccess={handleSuccess} />
  ) : (
    <GenericForm assoc={assoc} onSuccess={handleSuccess} />
  );
}

// ── Bannière association ───────────────────────────────────

function AssocBanner({ assoc }: { assoc: AssociationInfo }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Building2 size={18} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{assoc.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin size={11} />
          {assoc.city} · {assoc.postalCode} · {assocTypeLabel(assoc.type)}
        </p>
      </div>
    </div>
  );
}

// ── Formulaire générique ──────────────────────────────────

function GenericForm({
  assoc,
  onSuccess,
}: {
  assoc: AssociationInfo;
  onSuccess: (email: string, password: string) => Promise<void>;
}) {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});

  const customFieldsList = assoc.customFields ?? [];

  const formFields: FormField[] = [
    { name: "firstname",  type: "text",     label: "Prénom",            placeholder: "Prénom",             required: true,  value: "" },
    { name: "lastname",   type: "text",     label: "Nom",               placeholder: "Nom",                required: true,  value: "" },
    { name: "email",      type: "email",    label: "Email",             placeholder: "votre@email.com",    required: true,  value: "" },
    { name: "city_code",  type: "text",     label: "Code postal",       placeholder: "Ex: 80000",          required: true,  value: "" },
    { name: "city",       type: "text",     label: "Ville",             placeholder: "Ville",              required: false, value: "" },
    { name: "dateOfBirth",type: "date",     label: "Date de naissance",                                    required: false, value: "" },
    { name: "sexe",       type: "select",   label: "Sexe",                                                required: false, value: "",
      options: [{ value: "Homme", label: "Homme" }, { value: "Femme", label: "Femme" }] },
    { name: "phone",      type: "phone",    label: "Téléphone",         placeholder: "Ex: 06 12 34 56 78", required: false, value: "" },
    { name: "password",   type: "password", label: "Mot de passe",                                         required: true,  value: "",
      showStrengthCheck: true,
      hint: "Minimum 12 caractères (majuscule, minuscule, chiffre, caractère spécial)" },
    { name: "passwordConfirmation", type: "password", label: "Confirmer le mot de passe", required: true, value: "", matchField: "password" },
    ...customFieldsList.map((cf): FormField => ({
      name: `cf_${cf.id}`,
      type: cf.type === "tel" ? "phone" : cf.type === "checkbox" ? "checkbox" : cf.type,
      label: cf.label,
      placeholder: cf.placeholder,
      required: cf.required,
      value: "",
      ...(cf.options && { options: cf.options.map((o) => ({ value: o, label: o })) }),
    })),
  ];

  async function handleSubmit(data: Record<string, string | number>) {
    setGlobalError(null);
    setExternalErrors({});

    const phone = String(data.phone ?? "").replace(/\s/g, "");

    const customFieldsData: Record<string, string> = {};
    Object.entries(data).forEach(([key, val]) => {
      if (key.startsWith("cf_")) customFieldsData[key.slice(3)] = String(val);
    });

    try {
      const body: Record<string, unknown> = {
        candidat: {
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          password: data.password,
          passwordConfirmation: data.passwordConfirmation,
          city_code: data.city_code,
          ...(data.city && { city: data.city }),
          ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
          ...(data.sexe && { sexe: data.sexe }),
          ...(phone && { phone }),
          associationSlug: assoc.slug,
        },
        ...(Object.keys(customFieldsData).length > 0 && { customFields: customFieldsData }),
      };

      const res = await fetch(`${API}/register/candidat-association`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422 && Array.isArray(json.errors)) {
          const mapped = mapServerErrors(json.errors);
          setExternalErrors(mapped);
          if (Object.keys(mapped).length === 0) {
            setGlobalError("Des données invalides ont été envoyées. Vérifiez le formulaire.");
          }
        } else {
          setGlobalError(
            typeof json.message === "string"
              ? json.message
              : Array.isArray(json.message)
                ? (json.message as string[]).join(" — ")
                : "Une erreur est survenue.",
          );
        }
        return;
      }

      await onSuccess(String(data.email), String(data.password));
    } catch {
      setGlobalError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    }
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <Link
        href="/sigin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft size={15} /> Retour
      </Link>

      <AssocBanner assoc={assoc} />

      {globalError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Rejoindre {assoc.name}</CardTitle>
          <CardDescription>
            Créez votre compte pour rejoindre cette association
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            fields={formFields}
            onSubmit={handleSubmit}
            submitText="Rejoindre l'association"
            externalErrors={externalErrors}
            schema={SiginGenericSchema}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}

// ── Formulaire Cadet (Gendarmerie) ─────────────────────────
// Étend le formulaire générique avec le bloc responsables légaux

function CadetForm({
  assoc,
  onSuccess,
}: {
  assoc: AssociationInfo;
  onSuccess: (email: string, password: string) => Promise<void>;
}) {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [parents, setParents] = useState<ParentData[]>([{ ...EMPTY_PARENT }]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [parentErrors, setParentErrors] = useState<Errors>({});

  const customFieldsList = assoc.customFields ?? [];

  const formFields: FormField[] = [
    { name: "firstname",   type: "text",     label: "Prénom",            placeholder: "Prénom",             required: true,  value: "" },
    { name: "lastname",    type: "text",     label: "Nom",               placeholder: "Nom",                required: true,  value: "" },
    { name: "dateOfBirth", type: "date",     label: "Date de naissance",                                    required: true,  value: "" },
    { name: "sexe",        type: "select",   label: "Sexe",                                                required: true,  value: "",
      options: [{ value: "Homme", label: "Homme" }, { value: "Femme", label: "Femme" }] },
    { name: "email",       type: "email",    label: "Email",             placeholder: "votre@email.com",    required: true,  value: "" },
    { name: "phone",       type: "phone",    label: "Téléphone",         placeholder: "Ex: 06 12 34 56 78", required: false, value: "" },
    { name: "city_code",   type: "text",     label: "Code postal",       placeholder: "Ex: 80000",          required: true,  value: "" },
    { name: "city",        type: "text",     label: "Ville",             placeholder: "Ville",              required: false, value: "" },
    { name: "password",    type: "password", label: "Mot de passe",                                         required: true,  value: "",
      showStrengthCheck: true,
      hint: "Minimum 12 caractères (majuscule, minuscule, chiffre, caractère spécial)" },
    { name: "passwordConfirmation", type: "password", label: "Confirmer le mot de passe", required: true, value: "", matchField: "password" },
    ...customFieldsList.map((cf): FormField => ({
      name: `cf_${cf.id}`,
      type: cf.type === "tel" ? "phone" : cf.type === "checkbox" ? "checkbox" : cf.type,
      label: cf.label,
      placeholder: cf.placeholder,
      required: cf.required,
      value: "",
      ...(cf.options && { options: cf.options.map((o) => ({ value: o, label: o })) }),
    })),
  ];

  function validateParents(): Errors {
    const e: Errors = {};
    if (!consentChecked)
      e.consent = "Vous devez obtenir l'autorisation de votre responsable légal";
    parents.forEach((p, i) => {
      const pfx = `parent${i}`;
      if (p.type === "Autre" && !p.typeOther.trim())
        e[`${pfx}_typeOther`] = "Précisez le type de responsable";
      if (!p.firstName || p.firstName.length < 2) e[`${pfx}_firstName`] = "Prénom requis";
      if (!p.lastName || p.lastName.length < 2) e[`${pfx}_lastName`] = "Nom requis";
      if (!p.email || !EMAIL_REGEX.test(p.email)) e[`${pfx}_email`] = "Email valide requis";
      const pp = p.phone.replace(/\s/g, "");
      if (!pp || !FR_PHONE_REGEX.test(pp)) e[`${pfx}_phone`] = "Téléphone requis (ex. 0612345678)";
    });
    return e;
  }

  async function handleSubmit(data: Record<string, string | number>) {
    setGlobalError(null);
    setExternalErrors({});

    const pErrors = validateParents();
    setParentErrors(pErrors);
    if (Object.keys(pErrors).length > 0) return;

    const phone = String(data.phone ?? "").replace(/\s/g, "");
    const customFieldsData: Record<string, string> = {};
    Object.entries(data).forEach(([key, val]) => {
      if (key.startsWith("cf_")) customFieldsData[key.slice(3)] = String(val);
    });

    try {
      const body: Record<string, unknown> = {
        candidat: {
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          password: data.password,
          passwordConfirmation: data.passwordConfirmation,
          dateOfBirth: data.dateOfBirth,
          sexe: data.sexe,
          city_code: data.city_code,
          ...(data.city && { city: data.city }),
          ...(phone && { phone }),
          associationSlug: assoc.slug,
        },
        ...(Object.keys(customFieldsData).length > 0 && { customFields: customFieldsData }),
        parent: {
          typeParent: parents[0].type,
          ...(parents[0].type === "Autre" && { typeParentOther: parents[0].typeOther.trim() }),
          firstNameParent: parents[0].firstName,
          lastNameParent: parents[0].lastName,
          emailParent: parents[0].email,
          phoneParent: parents[0].phone.replace(/\s/g, ""),
        },
        ...(parents[1] && {
          parent2: {
            typeParent: parents[1].type,
            ...(parents[1].type === "Autre" && { typeParentOther: parents[1].typeOther.trim() }),
            firstNameParent: parents[1].firstName,
            lastNameParent: parents[1].lastName,
            emailParent: parents[1].email,
            phoneParent: parents[1].phone.replace(/\s/g, ""),
          },
        }),
      };

      const res = await fetch(`${API}/register/candidat-association`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422 && Array.isArray(json.errors)) {
          const allMapped = mapServerErrors(json.errors);
          const fieldErrors: Errors = {};
          const pErr: Errors = {};
          for (const [k, v] of Object.entries(allMapped)) {
            if (k.startsWith("parent")) pErr[k] = v;
            else fieldErrors[k] = v;
          }
          setExternalErrors(fieldErrors);
          setParentErrors(pErr);
          if (Object.keys(allMapped).length === 0)
            setGlobalError("Des données invalides ont été envoyées. Vérifiez le formulaire.");
        } else {
          setGlobalError(
            typeof json.message === "string"
              ? json.message
              : Array.isArray(json.message)
                ? (json.message as string[]).join(" — ")
                : "Une erreur est survenue.",
          );
        }
        return;
      }

      await onSuccess(String(data.email), String(data.password));
    } catch {
      setGlobalError("Impossible de joindre le serveur. Vérifiez votre connexion.");
    }
  }

  function updateParent(i: number, patch: Partial<ParentData>) {
    setParents((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
    setParentErrors((prev) => {
      const next = { ...prev };
      const pfx = `parent${i}`;
      delete next[`${pfx}_firstName`];
      delete next[`${pfx}_lastName`];
      delete next[`${pfx}_email`];
      delete next[`${pfx}_phone`];
      return next;
    });
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <Link
        href="/sigin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft size={15} /> Retour
      </Link>

      <AssocBanner assoc={assoc} />

      {globalError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Candidature {assoc.name}</CardTitle>
          <CardDescription>
            Renseignez vos informations pour candidater
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            fields={formFields}
            onSubmit={handleSubmit}
            submitText="Envoyer ma candidature"
            externalErrors={externalErrors}
            schema={SiginCadetSchema}
          >
            {/* ── Bloc responsables légaux ─── */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center gap-2">
                <User size={17} className="text-primary" />
                <p className="text-sm font-semibold text-primary">
                  Responsable(s) légal(aux)
                </p>
              </div>

              {parents.map((parent, i) => (
                <div
                  key={i}
                  className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Responsable légal {i + 1} {i === 0 ? "*" : ""}
                    </p>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setParents((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label
                      htmlFor={`parent${i}_type`}
                      className="text-sm font-medium"
                    >
                      Type de responsable{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <select
                      id={`parent${i}_type`}
                      value={parent.type}
                      onChange={(e) => updateParent(i, { type: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {PARENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    {parent.type === "Autre" && (
                      <div className="grid gap-1.5 mt-2">
                        <label
                          htmlFor={`parent${i}_typeOther`}
                          className="text-sm font-medium"
                        >
                          Préciser le type <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id={`parent${i}_typeOther`}
                          value={parent.typeOther}
                          onChange={(e) => updateParent(i, { typeOther: e.target.value })}
                          placeholder="Ex : Grand-parent, Oncle, Tante…"
                          className="bg-card"
                        />
                        {parentErrors[`parent${i}_typeOther`] && (
                          <p className="text-xs text-destructive">
                            {parentErrors[`parent${i}_typeOther`]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={`parent${i}_firstName`}
                        className="text-sm font-medium"
                      >
                        Prénom <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id={`parent${i}_firstName`}
                        value={parent.firstName}
                        onChange={(e) =>
                          updateParent(i, { firstName: e.target.value })
                        }
                        placeholder="Prénom"
                        className="bg-card"
                      />
                      {parentErrors[`parent${i}_firstName`] && (
                        <p className="text-xs text-destructive">
                          {parentErrors[`parent${i}_firstName`]}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <label
                        htmlFor={`parent${i}_lastName`}
                        className="text-sm font-medium"
                      >
                        Nom <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id={`parent${i}_lastName`}
                        value={parent.lastName}
                        onChange={(e) =>
                          updateParent(i, { lastName: e.target.value })
                        }
                        placeholder="Nom"
                        className="bg-card"
                      />
                      {parentErrors[`parent${i}_lastName`] && (
                        <p className="text-xs text-destructive">
                          {parentErrors[`parent${i}_lastName`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label
                      htmlFor={`parent${i}_email`}
                      className="text-sm font-medium"
                    >
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id={`parent${i}_email`}
                      type="email"
                      value={parent.email}
                      onChange={(e) => updateParent(i, { email: e.target.value })}
                      placeholder="parent@email.com"
                      className="bg-card"
                    />
                    {parentErrors[`parent${i}_email`] && (
                      <p className="text-xs text-destructive">
                        {parentErrors[`parent${i}_email`]}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label
                      htmlFor={`parent${i}_phone`}
                      className="text-sm font-medium"
                    >
                      Téléphone <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id={`parent${i}_phone`}
                      type="tel"
                      value={parent.phone}
                      onChange={(e) => updateParent(i, { phone: e.target.value })}
                      placeholder="Ex: 06 12 34 56 78"
                      maxLength={10}
                      className="bg-card"
                    />
                    {parentErrors[`parent${i}_phone`] && (
                      <p className="text-xs text-destructive">
                        {parentErrors[`parent${i}_phone`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {parents.length < 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setParents((prev) => [...prev, { ...EMPTY_PARENT }])
                  }
                  className="w-full rounded-xl border border-primary bg-primary/10 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={15} /> Ajouter un 2e responsable
                </button>
              )}

              {/* ── Consentement ─── */}
              <div className="flex flex-col gap-1 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => {
                      setConsentChecked(e.target.checked);
                      if (e.target.checked)
                        setParentErrors((prev) => {
                          const next = { ...prev };
                          delete next.consent;
                          return next;
                        });
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    J'ai l'autorisation de mon responsable légal pour m'inscrire{" "}
                    <span className="text-destructive">*</span>
                  </span>
                </label>
                {parentErrors.consent && (
                  <p className="text-xs text-destructive ml-7">
                    {parentErrors.consent}
                  </p>
                )}
              </div>
            </div>
          </DynamicForm>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
