import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Fraunces } from 'next/font/google'
import logoSigmaWhite from '@/public/logo_sigma_white.png'
import heroDashboard  from '@/public/hero-dashboard.png'
import {
  Users, FileText, FolderOpen, KeyRound,
  CreditCard, Stamp, ArrowRight, Check, ListChecks, Plus,
  HeartHandshake, CalendarCheck, MessageCircle, Layers,
} from 'lucide-react'
import { COOKIE_REFRESH } from '@/src/lib/auth-cookies'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
})

const CTA_HREF  = '/sigin'
const CTA_LABEL = 'Démarrer l\'essai gratuit · 14 jours'

const FEATURES = [
  {
    icon: <Users size={22} />,
    title: 'Gestion des membres',
    desc: "Profils, rôles, historique d'adhésion.",
  },
  {
    icon: <FileText size={22} />,
    title: 'Dossiers documentaires',
    desc: 'Statut en temps réel : validé, en attente, expiré.',
  },
  {
    icon: <ListChecks size={22} />,
    title: "Workflow d'adhésion",
    desc: "Une notification à chaque étape, personne ne reste sans réponse.",
  },
  {
    icon: <KeyRound size={22} />,
    title: 'Rôles & permissions',
    desc: "Chacun ne voit que ce qui le concerne.",
  },
  {
    icon: <FolderOpen size={22} />,
    title: 'Dossiers partagés',
    desc: 'Organisés par dossier, pas par email.',
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Cotisations Stripe',
    desc: "Paiement en ligne, facture automatique, relance incluse.",
  },
  {
    icon: <Stamp size={22} />,
    title: 'Filigrane automatique',
    desc: 'Nom et date apposés sur chaque pièce téléversée.',
  },
  {
    icon: <HeartHandshake size={22} />,
    title: 'Onboarding accompagné',
    desc: 'On configure votre association avec vous.',
  },
]

const ETAPES = [
  { n: '01', title: 'Créez votre association', desc: 'RNA, SIRET, informations du bureau. Cinq minutes.' },
  { n: '02', title: 'On configure avec vous', desc: "Un rendez-vous pour paramétrer rôles et accès selon votre structure. Pas un mode d'emploi à lire tout seul." },
  { n: '03', title: 'Invitez vos membres', desc: "Lien d'inscription, QR code, ou invitation directe depuis l'application mobile." },
  { n: '04', title: 'Gérez au jour le jour', desc: 'Dossiers, statuts, cotisations : un seul endroit, accessible depuis votre téléphone pendant l\'entraînement ou la répétition.' },
]

const ATOUTS = [
  {
    icon: <CalendarCheck size={20} />,
    title: 'Essai sans carte bancaire',
    desc: "14 jours d'accès complet. Rien à renseigner, rien à annuler si vous ne continuez pas.",
  },
  {
    icon: <MessageCircle size={20} />,
    title: 'Accompagnement humain',
    desc: 'Une vraie personne configure votre association avec vous, pas un chatbot.',
  },
  {
    icon: <Layers size={20} />,
    title: 'Multi-associations',
    desc: 'Plusieurs structures gérées depuis un seul et même compte.',
  },
]

const AVANT = [
  'Un fichier Excel partagé, jamais vraiment à jour',
  'Les pièces justificatives dans une pochette cartonnée',
  'Les inscriptions reçues par mail, à recopier à la main',
  'Les cotisations suivies sur un carnet ou un tableur',
]

const APRES = [
  'Une seule base de membres, toujours à jour',
  'Les documents classés, datés et filigranés automatiquement',
  "Un formulaire d'inscription en ligne qui crée le dossier tout seul",
  'Les cotisations payées en ligne, suivies sans ressaisie',
]

const FAQ = [
  {
    q: "Faut-il une carte bancaire pour l'essai ?",
    a: "Non. Les 14 jours d'essai donnent accès à toutes les fonctionnalités, sans carte bancaire à renseigner.",
  },
  {
    q: 'On peut annuler quand ?',
    a: "À tout moment, en mensuel comme en annuel. Pas de préavis, pas de frais de sortie.",
  },
  {
    q: 'Qui peut voir les documents sensibles (CNI, justificatifs) ?',
    a: "Uniquement les rôles que vous autorisez. Chaque pièce est filigranée au nom du membre concerné et à la date, pour qu'elle soit inutilisable si elle sort de l'application.",
  },
  {
    q: "Ça fonctionne sur mobile ?",
    a: "Oui. L'application iOS et Android est incluse dans toutes les formules, pas en option payante.",
  },
  {
    q: 'Et si on dépasse les 500 Go inclus ?',
    a: 'Vous ajoutez un palier de stockage supplémentaire (500 Go ou 1 To) sans changer de formule.',
  },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm text-muted-foreground tabular-nums">{children}</p>
  )
}

const CARD = 'mx-auto w-full max-w-5xl rounded-2xl border border-border shadow-sm'

export default async function HomePage() {
  const cookieStore = await cookies()
  if (cookieStore.has(COOKIE_REFRESH)) redirect('/dashboard')

  return (
    <div className="min-h-dvh flex flex-col bg-slate-200 text-foreground">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-sidebar/90 px-4 shadow-sm backdrop-blur-sm sm:px-6">
          <Image src={logoSigmaWhite} alt="SIGMA" className="object-contain h-11 w-auto" />
          <nav className="hidden sm:flex items-center gap-6 text-base text-sidebar-foreground/60">
            <a href="#fonctionnalites" className="hover:text-sidebar-foreground transition-colors">Fonctionnalités</a>
            <a href="#tarifs"          className="hover:text-sidebar-foreground transition-colors">Tarifs</a>
            <a href="#faq"             className="hover:text-sidebar-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-base font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors px-3 py-1.5 hidden sm:block">
              Se connecter
            </Link>
            <Link
              href={CTA_HREF}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-gradient-to-r from-primary to-violet-500 shadow-md shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40'
              )}
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className={cn(CARD, 'relative overflow-hidden border-0 bg-sidebar')}>
          <div className="pointer-events-none absolute -right-24 top-1/2 z-0 hidden h-[32rem] w-[32rem] -translate-y-1/2 rounded-full bg-primary/25 blur-[100px] lg:block" />

          <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-base text-sidebar-foreground/60 mb-4">
                  Le logiciel de gestion pour toutes les associations loi 1901
                </p>

                <h1 className={cn(fraunces.className, "text-4xl font-medium tracking-tight sm:text-5xl text-sidebar-foreground text-balance leading-[1.1]")}>
                  SIGMA, au cœur de votre association
                </h1>

                <p className="mt-6 text-lg text-sidebar-foreground/70 sm:text-xl text-pretty">
                  SIGMA remplace vos fichiers Excel et vos pochettes cartonnées par un seul
                  endroit. Dossiers d’adhésion, justificatifs, cotisations, rôles du
                  bureau : tout y est, accessible à toute l’équipe.
                </p>


                <div className="mt-8 flex flex-col items-start gap-3">
                  <Link
                    href={CTA_HREF}
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'group relative bg-gradient-to-r from-primary to-violet-500 shadow-lg shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:translate-y-0'
                    )}
                  >
                    {CTA_LABEL}
                    <ArrowRight size={16} className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <p className="text-sm text-sidebar-foreground/50">
                    Sans carte bancaire · 14 jours, tout inclus
                  </p>
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
                <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
                  <Image
                    src={heroDashboard}
                    alt="Le tableau de bord SIGMA"
                    className="w-full h-auto"
                    priority
                    sizes="(min-width: 1024px) 480px, 100vw"
                  />
                </div>
                <p className="mt-3 text-center text-sm text-sidebar-foreground/40">
                  Le vrai tableau de bord SIGMA, pas une maquette.
                </p>
              </div>

            </div>

            <p className="relative z-10 mx-auto mt-16 max-w-3xl text-center text-sm text-sidebar-foreground/40">
              Hébergement en France · Conforme RGPD · Application mobile iOS &amp; Android ·
              Plusieurs associations sur un même compte
            </p>
          </div>
        </section>

        {/* ── Atouts ────────────────────────────────────────────── */}
        <section className={cn(CARD, 'overflow-hidden bg-card')}>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {ATOUTS.map((a) => (
              <div key={a.title} className="group p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {a.icon}
                </span>
                <h3 className="font-semibold mt-3 mb-1">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Avant / Après ─────────────────────────────────────── */}
        <section className={cn(CARD, 'bg-card p-8 sm:p-12')}>
          <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-4">Avant</p>
              <ul className="flex flex-col gap-3">
                {AVANT.map((t) => (
                  <li key={t} className="text-base leading-relaxed text-muted-foreground/70 line-through decoration-muted-foreground/40">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-primary mb-4">Avec SIGMA</p>
              <ul className="flex flex-col gap-3">
                {APRES.map((t) => (
                  <li key={t} className="text-base leading-relaxed font-medium text-foreground">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="fonctionnalites" className={cn(CARD, 'bg-primary/5 p-8 sm:p-12')}>
          <div className="mx-auto max-w-4xl text-center">
            <SectionLabel>01 · Fonctionnalités</SectionLabel>
            <h2 className={cn(fraunces.className, "text-3xl font-medium mb-2")}>Ce que SIGMA fait concrètement</h2>
            <p className="text-base text-muted-foreground mb-12 max-w-xl mx-auto">
              Huit choses que vous faites probablement encore à la main. Les mêmes
              pour toute association loi 1901, du club de judo à la troupe de théâtre.
            </p>

            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 text-left">
              {FEATURES.map((f) => (
                <div key={f.title} className="group">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {f.icon}
                  </span>
                  <h3 className="font-semibold text-lg mt-4 mb-1.5">{f.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Secteurs ──────────────────────────────────────────── */}
        <section className={cn(CARD, 'bg-card p-8 text-center sm:p-12')}>
          <div className="mx-auto max-w-2xl">
            <h2 className={cn(fraunces.className, "text-2xl font-medium mb-2")}>Conçu pour toutes les associations loi 1901</h2>
            <p className="text-base text-muted-foreground mb-8">
              Sport, culture, jeunesse : SIGMA s’adapte à votre structure, quelle qu’elle soit.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Clubs sportifs', 'Danse & musique', 'Théâtre', 'Culture & éducation',
                'Scouts & jeunesse', 'Cadets de la Gendarmerie',
              ].map((s) => (
                <span key={s} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105">
                  {s}
                </span>
              ))}
              <span className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105">
                + la vôtre
              </span>
            </div>
          </div>
        </section>

        {/* ── Positionnement ────────────────────────────────────── */}
        <section className={cn(CARD, 'border-0 bg-sidebar p-8 sm:p-12')}>
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-sm text-sidebar-foreground/50">Pourquoi on fait ça</p>
            <h2 className={cn(fraunces.className, "italic text-2xl sm:text-3xl font-medium text-sidebar-foreground leading-snug text-balance")}>
              On n’est pas un grand éditeur de logiciel avec un service commercial.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-sidebar-foreground/70 leading-relaxed max-w-xl">
              SIGMA est développé par OceDev, une petite structure française. Votre essai
              démarre avec une vraie personne, qui configure votre association avec vous.
              Pas de centre d’appel. Pas de chatbot.
            </p>
          </div>
        </section>

        {/* ── Comment ça marche ─────────────────────────────────── */}
        <section id="comment" className={cn(CARD, 'bg-card p-8 sm:p-12')}>
          <div className="mx-auto max-w-2xl">
            <SectionLabel>02 · Méthode</SectionLabel>
            <h2 className={cn(fraunces.className, "text-3xl font-medium mb-2")}>Comment ça marche, concrètement</h2>
            <p className="text-base text-muted-foreground mb-12">
              Quatre étapes, pas une migration de six mois.
            </p>
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {ETAPES.map((s) => (
                <div key={s.n} className="flex gap-6 py-6">
                  <span className={cn(fraunces.className, "italic shrink-0 text-4xl font-medium text-primary/25 tabular-nums")}>
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────── */}
        <section id="tarifs" className={cn(CARD, 'bg-primary/5 p-8 sm:p-12')}>
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <SectionLabel>03 · Tarifs</SectionLabel>
              <h2 className={cn(fraunces.className, "text-3xl font-medium mb-2")}>Tarifs</h2>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                14 jours gratuits, puis un tarif simple. Pas de palier caché, pas de prix « sur devis ».
              </p>
            </div>

            <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-card">
              <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">

                {/* Mensuel */}
                <div className="flex flex-col p-8">
                  <p className="font-semibold">Mensuel</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold">39 €</span>
                    <span className="mb-1 text-base text-muted-foreground">/ mois</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Sans engagement. Résiliable à tout moment.</p>
                  <ul className="mt-6 flex flex-col gap-2 flex-1">
                    {[
                      'Membres & gestion des candidatures',
                      'Gestion documentaire complète',
                      '500 Go de stockage inclus',
                      'Filigrane automatique',
                      'Rôles & permissions',
                      'App mobile iOS & Android',
                      'Notifications automatiques',
                      'Support email & chat',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-base text-muted-foreground">
                        <Check size={14} className="mt-0.5 shrink-0 text-primary" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={CTA_HREF} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-6 w-full justify-center')}>
                    Démarrer l’essai gratuit
                  </Link>
                </div>

                {/* Annuel */}
                <div className="flex flex-col bg-primary/5 p-8">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Annuel</p>
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
                      2 mois offerts
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold">390 €</span>
                    <span className="mb-1 text-base text-muted-foreground">/ an</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Soit 32,50 € / mois. 78 € d’économie sur l’année.</p>
                  <ul className="mt-6 flex flex-col gap-2 flex-1">
                    {[
                      'Tout le plan Mensuel inclus',
                      '500 Go de stockage inclus',
                      '2 mois offerts (10 payés, 12 utilisés)',
                      'Onboarding personnalisé offert',
                      'Priorité sur les nouvelles fonctionnalités',
                      'Facturation annuelle simplifiée',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-base text-muted-foreground">
                        <Check size={14} className="mt-0.5 shrink-0 text-primary" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={CTA_HREF} className={cn(buttonVariants({ size: 'sm' }), 'mt-6 w-full justify-center bg-gradient-to-r from-primary to-violet-500 shadow-md shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40')}>
                    Démarrer l’essai gratuit
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── Modules ───────────────────────────────────────────── */}
        <section className={cn(CARD, 'bg-card p-8 sm:p-12')}>
          <div className="mx-auto max-w-2xl">
            <h3 className="font-semibold mb-1">Modules complémentaires</h3>
            <p className="text-base text-muted-foreground mb-6">Activez uniquement ce dont vous avez besoin.</p>
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {[
                {
                  title: 'Stockage supplémentaire',
                  desc: 'Besoin de plus d\'espace pour vos documents ? Ajoutez du stockage additionnel à votre offre.',
                  tiers: ['500 Go : 130 € /an', '1 To : 260 € /an'],
                  soon: false,
                },
                {
                  title: 'Gestion des stocks avec IA',
                  desc: 'Inventaire du matériel, alertes de stock bas, suggestions de réapprovisionnement par IA.',
                  price: '10 € /mois ou 120 € /an',
                  soon: true,
                },
                {
                  title: 'Gestion des absences',
                  desc: 'Feuilles d\'émargement numériques, suivi des absences, alertes automatiques, exports bureau.',
                  price: '5 € /mois ou 60 € /an',
                  soon: true,
                },
              ].map((m) => (
                <div key={m.title} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-medium">{m.title}</p>
                      {m.soon && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground">Bientôt</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 max-w-sm">{m.desc}</p>
                  </div>
                  <div className="shrink-0 text-sm font-medium text-primary sm:text-right">
                    {m.tiers ? m.tiers.map((t) => <p key={t}>{t}</p>) : <p>{m.price}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section id="faq" className={cn(CARD, 'bg-card p-8 sm:p-12')}>
          <div className="mx-auto max-w-2xl">
            <SectionLabel>04 · Questions</SectionLabel>
            <h2 className={cn(fraunces.className, "text-3xl font-medium mb-10")}>Questions fréquentes</h2>
            <div className="flex flex-col divide-y divide-border border-t border-border">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium marker:content-none">
                    {f.q}
                    <Plus size={16} className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className={cn(CARD, 'border-0 bg-primary p-8 sm:p-12 text-center')}>
          <div className="mx-auto max-w-xl">
            <h2 className={cn(fraunces.className, "text-3xl font-medium mb-3 text-balance text-primary-foreground")}>
              La prochaine saison, sans le classeur ni le tableur.
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-sm mx-auto">
              14 jours d’essai complet, sans carte bancaire. Vous repartez avec une
              association opérationnelle, pas un logiciel de plus à apprendre.
            </p>
            <Link
              href={CTA_HREF}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'group shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 active:translate-y-0'
              )}
            >
              {CTA_LABEL}
              <ArrowRight size={16} className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/60">Sans engagement · Résiliable à tout moment</p>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className={cn(CARD, 'border-0 bg-sidebar p-8 sm:p-12')}>
          <div className="grid gap-8 sm:grid-cols-3 mb-8">
            <div>
              <Image src={logoSigmaWhite} alt="SIGMA" className="object-contain h-14 w-auto mb-3" />
              <p className="text-sm text-sidebar-foreground/50 leading-relaxed">
                Le logiciel de gestion pour les associations loi 1901 : sport, culture et jeunesse.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-3">Produit</p>
              <div className="flex flex-col gap-2">
                <a href="#fonctionnalites" className="text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Fonctionnalités</a>
                <a href="#tarifs"          className="text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Tarifs</a>
                <Link href={CTA_HREF}      className="text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Inscription</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-3">Légal</p>
              <div className="flex flex-col gap-2">
                <Link href="/legal/mentions-legales"   className="text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Mentions légales</Link>
                <Link href="/legal/confidentialite"    className="text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">Politique de confidentialité</Link>
                <Link href="/legal/cgu"                className="text-base text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">CGU</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-sidebar-foreground/40">
            <p>© {new Date().getFullYear()} SIGMA · Un produit <a href="https://ocedev.fr" target="_blank" rel="noopener noreferrer" className="hover:text-sidebar-foreground transition-colors">ocedev.fr</a></p>
            <p>Données hébergées en France 🇫🇷</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
