import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — SIGMA',
}

export default function MentionsLegalesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Mentions légales</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : juillet 2026</p>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Éditeur du site</h2>
        <p>
          Le service SIGMA est édité par <strong>OceDev</strong>,{' '}
          Entreprise Individuelle (EI),<br />
          immatriculée au RCS de Amiens sous le numéro 992 565 739,<br />
          dont le siège social est situé au 14 T rue colbert, bâtiment A, appartement 102.<br />
          <br />
          Email : <a href="mailto:contact.sigma.cloud@gmail.com" className="text-primary underline underline-offset-4">contact.sigma.cloud@gmail.com</a><br />
          Numéro de TVA intracommunautaire : FR56 992 565 739
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Directeur de la publication</h2>
        <p>Océance Fourdain, en qualité de CTO.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Hébergement</h2>
        <p>
          Le service est hébergé par <strong>Hostinger International Ltd.</strong>,<br />
          61 Lordou Vironos Street, 6023 Larnaca, Chypre<br />
          Site web : <span className="text-muted-foreground">https://www.hostinger.fr</span>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur SIGMA (textes, graphiques, logotypes, icônes, images,
          logiciels) est la propriété exclusive de OceDev ou de ses partenaires et est
          protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
          Toute reproduction, représentation, modification ou exploitation non autorisée est strictement
          interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Limitation de responsabilité</h2>
        <p>
          OceDev s'efforce d'assurer la disponibilité et l'exactitude des informations
          diffusées sur le service. Toutefois, elle ne saurait être tenue responsable des interruptions
          de service, d'erreurs ou d'omissions dans les contenus, ni des dommages résultant de
          l'utilisation du service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">6. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. Tout litige relatif à
          l'utilisation du service relève de la compétence exclusive des tribunaux français.
        </p>
      </section>
    </>
  )
}
