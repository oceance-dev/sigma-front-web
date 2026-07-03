import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — SIGMA",
}

export default function CguPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Conditions générales d'utilisation</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : juillet 2026</p>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
          de la plateforme SIGMA, service de gestion associative en ligne édité par [NOM DE LA SOCIÉTÉ]
          (ci-après « l'Éditeur »). Toute utilisation du service implique l'acceptation pleine et
          entière des présentes CGU.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Accès au service</h2>
        <p>
          Le service SIGMA est accessible aux associations et à leurs membres disposant d'un compte
          valide. L'accès est conditionné à la création d'un compte administrateur par le responsable
          de l'association et, pour les membres, à la réception d'une invitation. L'Éditeur se réserve
          le droit de refuser ou de suspendre tout accès en cas de violation des présentes CGU.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Création de compte</h2>
        <p>
          L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de
          l'inscription. Il est seul responsable de la confidentialité de ses identifiants et de toute
          activité réalisée depuis son compte. Toute utilisation frauduleuse doit être signalée
          immédiatement à l'Éditeur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Utilisation acceptable</h2>
        <p>Il est strictement interdit de :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>utiliser le service à des fins illicites ou contraires aux présentes CGU ;</li>
          <li>tenter de porter atteinte à la sécurité ou à l'intégrité du service ;</li>
          <li>collecter des données d'autres utilisateurs sans leur consentement ;</li>
          <li>transmettre des contenus illicites, diffamatoires ou portant atteinte aux droits de tiers ;</li>
          <li>utiliser des moyens automatisés pour accéder au service sans autorisation préalable.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Abonnement et facturation</h2>
        <p>
          L'accès complet au service est soumis à un abonnement payant selon les tarifs en vigueur
          communiqués lors de l'inscription. Une période d'essai gratuite peut être proposée. Le
          paiement est traité par un prestataire tiers sécurisé (Stripe). En cas de non-paiement,
          l'accès au service peut être suspendu après un délai de préavis de 7 jours.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">6. Données et confidentialité</h2>
        <p>
          L'utilisation des données personnelles est régie par la{' '}
          <a href="/legal/confidentialite" className="text-primary underline underline-offset-4">
            Politique de confidentialité
          </a>{' '}
          de SIGMA, conforme au Règlement Général sur la Protection des Données (RGPD).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">7. Disponibilité du service</h2>
        <p>
          L'Éditeur s'efforce d'assurer la disponibilité du service 24h/24, 7j/7, mais ne peut
          garantir une continuité sans interruption. Des maintenances planifiées ou des incidents
          techniques peuvent temporairement rendre le service indisponible. L'Éditeur ne saurait
          être tenu responsable des préjudices résultant d'une telle indisponibilité.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibent mb-3">8. Résiliation</h2>
        <p>
          L'utilisateur peut résilier son compte à tout moment depuis les paramètres de son espace.
          L'Éditeur se réserve le droit de résilier tout compte en cas de violation des présentes CGU,
          sans préavis ni remboursement. En cas de résiliation, les données sont conservées selon les
          délais légaux en vigueur, puis supprimées.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">9. Modification des CGU</h2>
        <p>
          L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
          seront informés par email au moins 15 jours avant l'entrée en vigueur des nouvelles
          conditions. La poursuite de l'utilisation du service vaut acceptation des nouvelles CGU.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">10. Droit applicable et litiges</h2>
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront
          de trouver une solution amiable avant tout recours judiciaire. À défaut, le litige sera porté
          devant les tribunaux compétents du ressort du siège social de l'Éditeur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">11. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU :{' '}
          <a href="mailto:[EMAIL CONTACT]" className="text-primary underline underline-offset-4">
            [EMAIL CONTACT]
          </a>
        </p>
      </section>
    </>
  )
}
