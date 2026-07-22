import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import logoSigma    from '@/public/logo_sigma.png'
import heroDashboard from '@/public/hero-dashboard.png'
import {
  Users, FileText, FolderOpen, ShieldCheck, Layers,
  CreditCard, Stamp, ArrowRight, Check, MapPin, Smartphone,
  Dumbbell, Music, Mic2, BookOpen, Trophy, HeartHandshake,
} from 'lucide-react'
import { COOKIE_REFRESH } from '@/src/lib/auth-cookies'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CTA_HREF  = '/sigin'
const CTA_LABEL = 'Démarrer l\'essai gratuit — 14 jours'

export default async function HomePage() {
  const cookieStore = await cookies()
  if (cookieStore.has(COOKIE_REFRESH)) redirect('/dashboard')

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Image src={logoSigma} alt="SIGMA" className="object-contain h-8 w-auto" />
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#secteurs"       className="hover:text-foreground transition-colors">Secteurs</a>
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#tarifs"          className="hover:text-foreground transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 hidden sm:block">
              Se connecter
            </Link>
            <Link href={CTA_HREF} className={cn(buttonVariants({ size: 'sm' }))}>
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">

        {/* Image de fond — screenshot du dashboard */}
        <div className="pointer-events-none absolute inset-0 z-0 select-none">
          <Image
            src={heroDashboard}
            alt="Exemple de l'application"
            fill
            priority
            sizes="100vw"
            className="object-contain object-top opacity-40"
          />
          {/* Dégradé : efface uniquement les bords haut et bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-transparent to-background/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
            Essai gratuit 14 jours · Sans carte bancaire
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Le logiciel de gestion pensé pour{' '}
            <span className="text-primary">toutes les associations françaises</span>
          </h1>

          <p className="mt-5 text-base text-muted-foreground sm:text-lg max-w-xl mx-auto">
            Sport, danse, musique, théâtre, culture — gérez membres, dossiers et
            cotisations sans Excel, sans papier, depuis n'importe quel appareil.
          </p>

          {/* Secteurs inline */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Judo', 'Danse', 'Musique', 'Théâtre', 'Scouts', 'Pompiers', 'Gendarmerie', 'Culture'].map((s) => (
              <span key={s} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <Link href={CTA_HREF} className={cn(buttonVariants({ size: 'lg' }))}>
              {CTA_LABEL}
              <ArrowRight size={16} className="ml-2" />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Sans carte bancaire · On configure votre association avec vous
            </p>
          </div>

          {/* App mockup */}
          <div className="mt-14 mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-lg overflow-hidden text-left">
            <div className="flex">
              <div className="hidden sm:flex w-44 shrink-0 flex-col bg-sidebar p-3 gap-0.5">
                <p className="px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-widest mb-1">SIGMA</p>
                {['Tableau de bord', 'Membres', 'Candidats', 'Documents', 'Dossiers', 'Rôles'].map((item, i) => (
                  <div key={item} className={cn('px-3 py-2 rounded-md text-xs font-medium', i === 1 ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/60')}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-5">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Membres actifs (24)</p>
                <div className="flex flex-col divide-y divide-border">
                  {[
                    { initials: 'TM', name: 'Thomas Mercier',  role: 'Licencié',  status: 'Validé',            color: 'bg-blue-500'   },
                    { initials: 'AL', name: 'Amélie Laurent',  role: 'Candidat',  status: 'En attente',        color: 'bg-violet-500' },
                    { initials: 'JB', name: 'Jules Bonnet',    role: 'Encadrant', status: 'Staff',             color: 'bg-emerald-500'},
                    { initials: 'SR', name: 'Sophie Renard',   role: 'Candidat',  status: 'Dossier incomplet', color: 'bg-amber-500'  },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3 py-2.5">
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0', m.color)}>
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              { icon: <MapPin size={12} />,      label: 'Données hébergées en France' },
              { icon: <ShieldCheck size={12} />, label: 'Conforme RGPD' },
              { icon: <Smartphone size={12} />,  label: 'Web & mobile' },
              { icon: <Layers size={12} />,      label: 'Multi-associations' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-primary">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Secteurs ──────────────────────────────────────────── */}
      <section id="secteurs" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-2">Fait pour votre secteur</h2>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
            Chaque association a ses contraintes. SIGMA s'adapte — pas l'inverse.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Dumbbell size={18} />,
                sector: 'Clubs sportifs',
                examples: 'Judo · Gym · Football · Natation',
                pain: 'Fini le fichier Excel pour les licences. Inscriptions, renouvellements et certificats médicaux gérés en un clic.',
              },
              {
                icon: <Music size={18} />,
                sector: 'Musique & danse',
                examples: 'Conservatoires · Écoles de danse',
                pain: 'Adhésions, cotisations et planning centralisés. Vos équipes artistiques se concentrent sur la scène, pas l\'administratif.',
              },
              {
                icon: <Mic2 size={18} />,
                sector: 'Théâtre & arts vivants',
                examples: 'Compagnies · Troupes amateurs',
                pain: 'Suivi des membres, gestion des dossiers d\'admission et des pièces justificatives sans paperasse.',
              },
              {
                icon: <BookOpen size={18} />,
                sector: 'Culture & éducation',
                examples: 'Bibliothèques · MJC · Ateliers',
                pain: 'Oubliez les tableaux partagés. Un répertoire unique, des rôles définis, des accès maîtrisés.',
              },
              {
                icon: <Trophy size={18} />,
                sector: 'Scouts & jeunesse',
                examples: 'Scouts · Pompiers juniors · MFR',
                pain: 'Workflow complet de A à Z : candidature, dossier, rendez-vous d\'accueil, validation — chaque étape tracée.',
              },
              {
                icon: <ShieldCheck size={18} />,
                sector: 'Cadets de la Gendarmerie',
                examples: 'Cadets · Unités jeunesse',
                pain: 'Procédures strictes, documents réglementaires, filigrane automatique sur chaque pièce. Conforme et sécurisé.',
              },
            ].map((s) => (
              <div key={s.sector} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.sector}</p>
                    <p className="text-[10px] text-muted-foreground">{s.examples}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="fonctionnalites" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-2">Tout ce dont votre association a besoin</h2>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
            Une plateforme complète pour toute structure loi 1901, quelle que soit sa taille.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Users size={18} />,
                title: 'Gestion des membres',
                desc: 'Profils complets, rôles hiérarchiques, historique d\'adhésion. Chaque statut est suivi et mis à jour automatiquement.',
              },
              {
                icon: <FileText size={18} />,
                title: 'Dossiers documentaires',
                desc: 'Collecte automatique des pièces obligatoires. Statut en temps réel : validé, en attente, expiré.',
              },
              {
                icon: <ArrowRight size={18} />,
                title: "Workflow d'adhésion",
                desc: "De l'inscription à la validation : soumission du dossier, approbation, notification. Chaque étape est tracée.",
              },
              {
                icon: <ShieldCheck size={18} />,
                title: 'Rôles & permissions',
                desc: 'Rôles personnalisables avec permissions granulaires. Chacun accède uniquement à ce dont il a besoin.',
              },
              {
                icon: <FolderOpen size={18} />,
                title: 'Dossiers partagés',
                desc: 'Organisation hiérarchique avec contrôle d\'accès. Documents système, partagés ou privés selon vos besoins.',
              },
              {
                icon: <CreditCard size={18} />,
                title: 'Cotisations Stripe',
                desc: 'Paiements sécurisés, factures automatiques, relances en cas d\'impayé. Zéro saisie comptable.',
              },
              {
                icon: <Stamp size={18} />,
                title: 'Filigrane automatique',
                desc: "Chaque document est filigrané avec le nom du membre et la date. CNI, certificat médical — inutilisables si volés.",
              },
              {
                icon: <HeartHandshake size={18} />,
                title: 'Onboarding accompagné',
                desc: "On configure votre première association avec vous. Pas de formation requise, opérationnel en moins d'une heure.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk reversal ─────────────────────────────────────── */}
      <section className="border-t border-border bg-primary/5 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Zéro risque</p>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            14 jours gratuits, sans carte bancaire.<br />
            On configure votre association avec vous.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Pas de client de référence encore ? Raison de plus pour tester sans contrainte.
            Un accès complet à toutes les fonctionnalités, un accompagnement personnalisé à
            l'onboarding, et la liberté d'arrêter à tout moment.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-8 text-left max-w-xl mx-auto">
            {[
              { n: '30', unit: 'jours',     label: "d'essai complet"       },
              { n: '0',  unit: '€',         label: 'de carte bancaire'      },
              { n: '1h', unit: '',           label: 'pour être opérationnel' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col">
                <p className="text-2xl font-bold text-primary">{s.n}<span className="text-base ml-0.5">{s.unit}</span></p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <Link href={CTA_HREF} className={cn(buttonVariants({ size: 'lg' }))}>
            {CTA_LABEL}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="comment" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-2">Comment ça marche</h2>
          <p className="text-center text-sm text-muted-foreground mb-14">Opérationnel en moins d'une heure</p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', title: 'Créez votre association', desc: 'RNA, SIRET, informations du bureau. 5 minutes chrono.' },
              { n: '02', title: 'On vous accompagne',      desc: 'Un onboarding personnalisé pour configurer rôles et accès selon votre structure.' },
              { n: '03', title: 'Invitez vos membres',     desc: 'Lien d\'inscription, QR code ou invitation directe depuis l\'app mobile.' },
              { n: '04', title: 'Gérez en temps réel',     desc: 'Dossiers, statuts, cotisations — tout centralisé, partout.' },
            ].map((s) => (
              <div key={s.n} className="flex flex-col gap-3">
                <span className="text-3xl font-bold text-primary/20">{s.n}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="tarifs" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-2">Tarifs</h2>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-lg mx-auto">
            14 jours gratuits, puis choisissez la formule qui vous convient. Sans engagement.
          </p>

          <div className="grid gap-5 lg:grid-cols-2 max-w-2xl mx-auto">

            {/* Mensuel */}
            <div className="flex flex-col rounded-xl border border-border bg-card p-6">
              <p className="font-semibold">Mensuel</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold">39 €</span>
                <span className="mb-1 text-sm text-muted-foreground">/ mois</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Sans engagement. Résiliable à tout moment.</p>
              <ul className="mt-6 flex flex-col gap-2 flex-1">
                {[
                  'Membres & gestion des candidatures',
                  'Gestion documentaire complète',
                  'Filigrane automatique',
                  'Rôles & permissions',
                  'App mobile iOS & Android',
                  'Notifications automatiques',
                  'Support email & chat',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="mt-0.5 shrink-0 text-primary" />{f}
                  </li>
                ))}
              </ul>
              <Link href={CTA_HREF} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-6 w-full justify-center')}>
                Démarrer l'essai gratuit
              </Link>
            </div>

            {/* Annuel */}
            <div className="relative flex flex-col rounded-xl border border-primary bg-card p-6 shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                2 mois offerts
              </span>
              <p className="font-semibold">Annuel</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold">390 €</span>
                <span className="mb-1 text-sm text-muted-foreground">/ an</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Soit 32,50 € / mois — économisez 78 €.</p>
              <ul className="mt-6 flex flex-col gap-2 flex-1">
                {[
                  'Tout le plan Mensuel inclus',
                  '2 mois offerts (10 payés, 12 utilisés)',
                  'Onboarding personnalisé offert',
                  'Priorité sur les nouvelles fonctionnalités',
                  'Facturation annuelle simplifiée',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="mt-0.5 shrink-0 text-primary" />{f}
                  </li>
                ))}
              </ul>
              <Link href={CTA_HREF} className={cn(buttonVariants({ size: 'sm' }), 'mt-6 w-full justify-center')}>
                Démarrer l'essai gratuit
              </Link>
            </div>

          </div>

          {/* Modules */}
          <div className="mt-12">
            <h3 className="font-semibold text-center mb-1">Modules complémentaires</h3>
            <p className="text-center text-sm text-muted-foreground mb-6">Activez uniquement ce dont vous avez besoin.</p>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
              {[
                {
                  title: 'Gestion des stocks avec IA',
                  desc: 'Inventaire du matériel, alertes de stock bas, suggestions de réapprovisionnement par IA.',
                  price: '10 € /mois ou 120 € /an',
                },
                {
                  title: 'Gestion des absences',
                  desc: 'Feuilles d\'émargement numériques, suivi des absences, alertes automatiques, exports bureau.',
                  price: '5 € /mois ou 60 € /an',
                },
              ].map((m) => (
                <div key={m.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm">{m.title}</p>
                    <span className="shrink-0 rounded px-2 py-0.5 text-xs bg-muted text-muted-foreground">Bientôt</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{m.desc}</p>
                  <p className="text-xs font-medium text-primary">{m.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold mb-3">Prêt à digitaliser votre association ?</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Accès complet pendant 14 jours, sans carte bancaire.
            On s'occupe de la configuration avec vous.
          </p>
          <Link href={CTA_HREF} className={cn(buttonVariants({ size: 'lg' }))}>
            {CTA_LABEL}
            <ArrowRight size={16} className="ml-2" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">Sans engagement · Résiliable à tout moment</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3 mb-8">
            <div>
              <Image src={logoSigma} alt="SIGMA" className="object-contain h-10 w-auto mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Logiciel de gestion associative pour toutes les associations françaises — sport, culture, jeunesse et plus.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Produit</p>
              <div className="flex flex-col gap-2">
                <a href="#fonctionnalites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
                <a href="#tarifs"          className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
                <Link href={CTA_HREF}      className="text-sm text-muted-foreground hover:text-foreground transition-colors">Inscription</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Légal</p>
              <div className="flex flex-col gap-2">
                <Link href="/legal/mentions-legales"   className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link>
                <Link href="/legal/confidentialite"    className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</Link>
                <Link href="/legal/cgu"                className="text-sm text-muted-foreground hover:text-foreground transition-colors">CGU</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} SIGMA · Un produit <a href="https://ocedev.fr" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">ocedev.fr</a></p>
            <p>Données hébergées en France 🇫🇷</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
