import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — SIGMA',
}

export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : juillet 2026</p>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données personnelles collectées via SIGMA est{' '}
          <strong>OceDev</strong>, Entreprise Individuelle (EI), dont le siège est situé au 14 T rue colbert, bâtiment A, appartement 102.
          <br />
          Contact : <a href="mailto:contact.sigma.cloud@gmail.com" className="text-primary underline underline-offset-4">contact.sigma.cloud@gmail.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">2. Données collectées</h2>
        <p>Dans le cadre de l'utilisation du service, nous collectons les données suivantes :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Données d'identification</strong> : nom, prénom, adresse email, numéro de téléphone ;</li>
          <li><strong>Données de l'association</strong> : nom, adresse, RNA, SIRET, type d'association ;</li>
          <li><strong>Données de connexion</strong> : adresse IP, horodatage des connexions, logs d'activité ;</li>
          <li><strong>Données de facturation</strong> : informations de paiement traitées par Stripe (SIGMA n'accède pas aux données bancaires brutes) ;</li>
          <li><strong>Documents transmis</strong> : fichiers déposés par les membres dans le cadre des procédures d'adhésion.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">3. Finalités et bases légales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-medium">Finalité</th>
                <th className="text-left py-2 font-medium">Base légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 pr-4">Création et gestion de votre compte</td>
                <td className="py-2">Exécution du contrat</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Gestion des membres et des dossiers</td>
                <td className="py-2">Exécution du contrat</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Facturation et suivi des abonnements</td>
                <td className="py-2">Obligation légale / Exécution du contrat</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Envoi de notifications liées au service</td>
                <td className="py-2">Intérêt légitime</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Sécurité et prévention des fraudes</td>
                <td className="py-2">Intérêt légitime</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Communications marketing (avec opt-in)</td>
                <td className="py-2">Consentement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">4. Durée de conservation</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Données de compte actif : durée de la relation contractuelle ;</li>
          <li>Données de compte résilié : 3 ans à compter de la résiliation (prescription civile) ;</li>
          <li>Données de facturation : 10 ans (obligation comptable légale) ;</li>
          <li>Logs de connexion : 12 mois ;</li>
          <li>Documents membres : durée de l'adhésion + 1 an sauf obligation légale contraire.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">5. Destinataires des données</h2>
        <p>
          Vos données sont traitées par notre équipe et partagées uniquement avec les sous-traitants
          strictement nécessaires au fonctionnement du service :
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Hébergement</strong> : Hostinger International Ltd., infrastructure sécurisée en UE ;</li>
          <li><strong>Paiement</strong> : Stripe, Inc. — certifié PCI-DSS ;</li>
          <li><strong>Emails transactionnels</strong> : Resend (resend.com).</li>
        </ul>
        <p className="mt-2">
          Nous ne vendons, ne louons et ne cédons jamais vos données à des tiers à des fins commerciales.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">6. Transferts hors UE</h2>
        <p>
          Certains sous-traitants (Stripe) peuvent traiter des données hors de l'Union européenne.
          Ces transferts sont encadrés par des Clauses Contractuelles Types (CCT) approuvées par la
          Commission européenne, garantissant un niveau de protection adéquat.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">7. Vos droits</h2>
        <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données ;</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes ;</li>
          <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données ;</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré ;</li>
          <li><strong>Droit d'opposition</strong> : vous opposer à un traitement fondé sur l'intérêt légitime ;</li>
          <li><strong>Droit à la limitation</strong> : restreindre un traitement en cours de contestation.</li>
        </ul>
        <p className="mt-3">
          Pour exercer ces droits, contactez-nous à{' '}
          <a href="mailto:contact.sigma.cloud@gmail.com" className="text-primary underline underline-offset-4">
            contact.sigma.cloud@gmail.com
          </a>
          . Nous répondons dans un délai d'un mois (RGPD Art. 12).
          <br />
          Vous pouvez également introduire une réclamation auprès de la{' '}
          <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :{' '}
          <span className="text-muted-foreground">www.cnil.fr</span>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">8. Cookies</h2>
        <p>
          SIGMA utilise uniquement des cookies techniques strictement nécessaires au fonctionnement
          du service (maintien de la session, sécurité). Aucun cookie de tracking publicitaire ou
          analytique tiers n'est déposé sans votre consentement explicite.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>sigma_refresh</strong> : cookie HttpOnly de session, durée 30 jours, nécessaire à l'authentification.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">9. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
          vos données : chiffrement en transit (TLS), hachage des mots de passe (bcrypt/argon2),
          accès aux données restreint aux seules personnes habilitées, journalisation des accès.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">10. Modifications</h2>
        <p>
          Nous pouvons mettre à jour cette politique pour refléter des évolutions légales ou
          fonctionnelles. Toute modification substantielle vous sera notifiée par email au moins
          15 jours avant son entrée en vigueur.
        </p>
      </section>
    </>
  )
}
