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
          Le service SIGMA est édité par <strong>[NOM DE LA SOCIÉTÉ]</strong>,{' '}
          [forme juridique — ex. SAS au capital de X €],<br />
          immatriculée au RCS de [Ville] sous le numéro [SIREN],<br />
          dont le siège social est situé au [ADRESSE COMPLÈTE].<br />
          <br />
          Email : <a href="mailto:[EMAIL CONTACT]" className="text-primary underline underline-offset-4">[EMAIL CONTACT]</a><br />
          Numéro de TVA intracommunautaire : [FR + 11 chiffres]
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Directeur de la publication</h2>
        <p>[Prénom NOM], en qualité de [titre — ex. Président / Directeur général].</p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Hébergement</h2>
        <p>
          Le service est hébergé par <strong>[NOM HÉBERGEUR]</strong>,<br />
          [ADRESSE HÉBERGEUR]<br />
          Site web : <span className="text-muted-foreground">[URL HÉBERGEUR]</span>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur SIGMA (textes, graphiques, logotypes, icônes, images,
          logiciels) est la propriété exclusive de [NOM DE LA SOCIÉTÉ] ou de ses partenaires et est
          protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
          Toute reproduction, représentation, modification ou exploitation non autorisée est strictement
          interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Limitation de responsabilité</h2>
        <p>
          [NOM DE LA SOCIÉTÉ] s'efforce d'assurer la disponibilité et l'exactitude des informations
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
