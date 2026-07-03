import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, FileText, FolderOpen, ShieldCheck, Layers,
  CreditCard, Stamp, ArrowRight, Check, MapPin, Smartphone,
} from 'lucide-react'
import { COOKIE_REFRESH } from '@/src/lib/auth-cookies'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const cookieStore = await cookies()
  if (cookieStore.has(COOKIE_REFRESH)) redirect('/dashboard')

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-base font-bold tracking-tight">SIGMA</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#comment" className="hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 hidden sm:block">
              Se connecter
            </Link>
            <Link href="/sigin" className={cn(buttonVariants({ size: 'sm' }))}>
              Accès bêta gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
            Bêta ouverte — accès gratuit pendant 1 mois
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            La gestion de votre association,{' '}
            <span className="text-primary">enfin centralisée</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg max-w-xl mx-auto">
            Membres, dossiers, documents, rôles — tout au même endroit.
            Conçu pour les associations jeunesse françaises.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/sigin" className={cn(buttonVariants({ size: 'lg' }))}>
              Demander l'accès bêta
              <ArrowRight size={16} className="ml-2" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              Se connecter
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Accès bêta gratuit · Aucune CB requise · Associations jeunesse uniquement
          </p>

          {/* App mockup */}
          <div className="mt-14 mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-lg overflow-hidden text-left">
            {/* Sidebar + content */}
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
                    { initials: 'TM', name: 'Thomas Mercier', role: 'Cadet breveté', status: 'Validé', color: 'bg-blue-500' },
                    { initials: 'AL', name: 'Amélie Laurent', role: 'Candidat', status: 'En attente', color: 'bg-violet-500' },
                    { initials: 'JB', name: 'Jules Bonnet', role: 'Encadrant', status: 'Staff', color: 'bg-emerald-500' },
                    { initials: 'SR', name: 'Sophie Renard', role: 'Candidat', status: 'Dossier incomplet', color: 'bg-amber-500' },
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
              { icon: <MapPin size={12} />, label: 'Données hébergées en France' },
              { icon: <ShieldCheck size={12} />, label: 'Conforme RGPD' },
              { icon: <Smartphone size={12} />, label: 'Web & mobile' },
              { icon: <Layers size={12} />, label: 'Multi-associations' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-primary">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="fonctionnalites" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-2">Tout ce dont votre association a besoin</h2>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
            Conçu pour les associations jeunesse : cadets, scouts, pompiers juniors, clubs sportifs
            et toute structure loi 1901.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Users size={18} />,
                title: 'Gestion des membres',
                desc: 'Profils complets, rôles hiérarchiques, historique d\'adhésion. De Candidat à Cadet Breveté, chaque statut est suivi automatiquement.',
              },
              {
                icon: <FileText size={18} />,
                title: 'Dossiers documentaires',
                desc: 'Collecte automatique des pièces obligatoires. Statut en temps réel : validé, en attente, expiré. Relances automatiques aux familles.',
              },
              {
                icon: <ArrowRight size={18} />,
                title: 'Workflow candidat',
                desc: 'De l\'inscription à la validation : soumission du dossier, rendez-vous d\'accueil, approbation finale. Chaque étape est tracée et notifiée.',
              },
              {
                icon: <ShieldCheck size={18} />,
                title: 'Rôles & permissions',
                desc: '11 rôles prédéfinis avec permissions granulaires. Bureau, Encadrant, Cadet — chacun accède uniquement à ce dont il a besoin.',
              },
              {
                icon: <FolderOpen size={18} />,
                title: 'Dossiers partagés',
                desc: 'Organisation hiérarchique avec contrôle d\'accès par dossier. Documents système, partagés ou privés selon vos besoins.',
              },
              {
                icon: <CreditCard size={18} />,
                title: 'Cotisations Stripe',
                desc: 'Suivi des cotisations intégré. Paiements sécurisés, factures automatiques, relances en cas d\'impayé.',
              },
              {
                icon: <Stamp size={18} />,
                title: 'Filigrane automatique',
                desc: 'Chaque document uploadé est automatiquement filigrané avec le nom du membre et la date. En cas de vol de données, les pièces (CNI, carnet de santé…) sont inutilisables par un tiers.',
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

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="comment" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-2">Comment ça marche</h2>
          <p className="text-center text-sm text-muted-foreground mb-14">Opérationnel en moins d'une heure</p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', title: 'Créez votre association', desc: 'RNA, SIRET, informations du bureau. 5 minutes chrono.' },
              { n: '02', title: 'Configurez les rôles', desc: 'Invitez votre bureau et encadrants avec les bons accès.' },
              { n: '03', title: 'Importez vos membres', desc: 'CSV ou invitation directe depuis l\'app mobile.' },
              { n: '04', title: 'Gérez en temps réel', desc: 'Dossiers, statuts, documents — tout centralisé.' },
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
          <p className="text-center text-sm text-muted-foreground mb-3">Simple et transparent</p>
          <p className="text-center text-sm text-muted-foreground mb-12 max-w-lg mx-auto">
            Pendant la bêta, toutes les associations partenaires bénéficient d'un accès gratuit complet pendant 1 mois.
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
                  'Inscription et gestion des candidatures',
                  'Gestion documentaire complète',
                  'Filigrane automatique sur les documents',
                  'Rôles & permissions granulaires',
                  'App mobile iOS & Android',
                  'Notifications automatiques',
                  'Support email & chat',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="mt-0.5 shrink-0 text-primary" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/sigin" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-6 w-full justify-center')}>
                Rejoindre la liste d'attente
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
              <p className="mt-1 text-xs text-muted-foreground">Soit 32,50 € / mois — économisez 78 € par rapport au mensuel.</p>
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
              <Link href="/sigin" className={cn(buttonVariants({ size: 'sm' }), 'mt-6 w-full justify-center')}>
                Rejoindre la liste d'attente
              </Link>
            </div>

          </div>

          {/* Modules */}
          <div className="mt-12">
            <h3 className="font-semibold text-center mb-1">Modules complémentaires</h3>
            <p className="text-center text-sm text-muted-foreground mb-6">Ajoutez uniquement ce dont vous avez besoin, à tout moment.</p>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
              {[
                {
                  title: 'Gestion des stocks avec IA',
                  desc: 'Suivi intelligent du matériel de l\'association. Inventaire, alertes de stock bas, suggestions de réapprovisionnement par IA.',
                  price: '10 € /mois ou 120 € /an',
                },
                {
                  title: 'Gestion des absences',
                  desc: 'Feuilles d\'émargement numériques, suivi des absences, alertes automatiques, exports pour le bureau.',
                  price: '5 € /mois ou 60 € /an',
                },
              ].map((m) => (
                <div key={m.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm">{m.title}</p>
                    <span className="shrink-0 rounded px-2 py-0.5 text-xs bg-muted text-muted-foreground">Bientôt disponible</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{m.desc}</p>
                  <p className="text-xs font-medium text-primary">{m.price}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Les modules s'activent depuis votre espace administration · Sans engagement pour les options mensuelles
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold mb-3">Prêt à digitaliser votre association ?</h2>
          <p className="text-muted-foreground mb-2">
            Rejoignez les premières associations à tester SIGMA gratuitement.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Accès complet, sans engagement, avec un accompagnement personnalisé.
          </p>
          <Link href="/sigin" className={cn(buttonVariants({ size: 'lg' }))}>
            Accès bêta gratuit
            <ArrowRight size={16} className="ml-2" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">Aucune carte bancaire requise · Réponse sous 48h</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3 mb-8">
            <div>
              <p className="font-bold mb-2">SIGMA</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Système Intégré de Gestion des Membres et Associations — plateforme SaaS pour associations jeunesse françaises.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Produit</p>
              <div className="flex flex-col gap-2">
                <a href="#fonctionnalites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
                <a href="#tarifs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
                <Link href="/sigin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Accès bêta</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Légal</p>
              <div className="flex flex-col gap-2">
                <Link href="/legal/mentions-legales" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link>
                <Link href="/legal/confidentialite" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</Link>
                <Link href="/legal/cgu" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CGU</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© 2025 SIGMA · Un produit <a href="https://ocedev.fr" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">ocedev.fr</a></p>
            <p>Données hébergées en France 🇫🇷</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
