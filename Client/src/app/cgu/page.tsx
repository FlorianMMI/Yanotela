import React from 'react';
import Link from 'next/link';

export const noAuth = true;

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header avec retour */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-clrprincipal mb-2">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-sm text-element">
            Dernière mise à jour : 15/11/2025
          </p>
        </div>

        {/* Contenu des CGU */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              1. Présentation du service
            </h2>
            <div className="space-y-3 text-element">
              <p>
                <strong>Yanotela</strong> est une application web collaborative de prise de notes, accessible à l&apos;adresse{' '}
                <Link href="https://yanotela.fr" className="text-primary hover:underline">
                  https://yanotela.fr
                </Link>
              </p>
              <p>
                Le service permet aux utilisateurs de :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Créer, modifier et organiser des notes textuelles</li>
                <li>Organiser les notes en dossiers</li>
                <li>Créer des Flash Notes pour une prise de note rapide</li>
                <li>Accéder à leurs notes depuis n&apos;importe quel appareil connecté</li>
                <li>Gérer leur profil utilisateur</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              2. Acceptation des CGU
            </h2>
            <div className="space-y-3 text-element">
              <p>
                L&apos;utilisation de Yanotela implique l&apos;acceptation pleine et entière des présentes Conditions Générales d&apos;Utilisation.
              </p>
              <p>
                En créant un compte et en utilisant nos services, vous acceptez sans réserve les présentes CGU.
                Si vous n&apos;acceptez pas ces conditions, nous vous invitons à ne pas utiliser le service.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              3. Création et gestion du compte utilisateur
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                3.1. Inscription
              </h3>
              <p>
                Pour utiliser Yanotela, vous devez créer un compte en fournissant :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Un pseudonyme unique</li>
                <li>Une adresse email valide</li>
                <li>Un mot de passe sécurisé</li>
              </ul>
              <p>
                Vous vous engagez à fournir des informations exactes et à les maintenir à jour.
                Une vérification par email est obligatoire avant de pouvoir accéder au service.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                3.2. Sécurité du compte
              </h3>
              <p>
                Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                Toute activité effectuée depuis votre compte est présumée avoir été effectuée par vous.
              </p>
              <p>
                Vous vous engagez à :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Ne pas partager vos identifiants avec des tiers</li>
                <li>Utiliser un mot de passe robuste et unique</li>
                <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              4. Utilisation du service
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.1. Bon usage
              </h3>
              <p>
                Vous vous engagez à utiliser Yanotela conformément à sa destination, c&apos;est-à-dire pour la prise et l&apos;organisation de notes personnelles.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.2. Interdictions
              </h3>
              <p>
                Il est strictement interdit de :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Tenter de nuire au bon fonctionnement du service</li>
                <li>Tenter d&apos;accéder aux données d&apos;autres utilisateurs</li>
                <li>Utiliser le service pour stocker du contenu illégal, diffamatoire, offensant ou contraire aux bonnes mœurs</li>
                <li>Utiliser le service pour des activités de spam ou de phishing</li>
                <li>Procéder à du reverse engineering, décompiler ou tenter d&apos;extraire le code source</li>
                <li>Surcharger intentionnellement les serveurs ou tenter des attaques par déni de service</li>
                <li>Contourner les mesures de sécurité mises en place</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              5. Propriété intellectuelle
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                5.1. Propriété du service
              </h3>
              <p>
                L&apos;ensemble des éléments constituant Yanotela (design, logo, code source, interface, etc.) 
                sont protégés par le droit de la propriété intellectuelle et appartiennent à l&apos;équipe de développement de Yanotela (IUT du Limousin).
              </p>
              <p>
                Toute reproduction, représentation, modification ou exploitation, totale ou partielle, 
                du site ou de l&apos;un de ses éléments sans autorisation préalable et écrite est interdite 
                et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
              </p>
              <p className="text-sm italic text-gray-600 mt-2">
                Ce projet étant réalisé dans un cadre pédagogique, toute utilisation commerciale est interdite sans autorisation.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                5.2. Propriété de vos contenus
              </h3>
              <p>
                Vous conservez l&apos;intégralité des droits de propriété intellectuelle sur les notes et contenus que vous créez sur Yanotela.
              </p>
              <p>
                En utilisant notre service, vous nous accordez une licence limitée, non-exclusive et révocable 
                pour héberger, stocker et afficher vos contenus, uniquement dans le but de vous fournir le service.
              </p>
              <p>
                Nous ne revendiquons aucun droit sur vos contenus et ne les utilisons pas à d&apos;autres fins que la fourniture du service.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              6. Limitation de responsabilité
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                6.1. Disponibilité du service
              </h3>
              <p>
                Nous mettons tout en œuvre pour assurer l&apos;accès et le bon fonctionnement de Yanotela 24h/24 et 7j/7.
              </p>
              <p>
                Toutefois, le service peut être temporairement interrompu pour des raisons de maintenance, 
                de mise à jour, de défaillance technique ou de force majeure. Nous ne pouvons être tenus responsables 
                de ces interruptions et de leurs éventuelles conséquences.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                6.2. Sécurité et perte de données
              </h3>
              <p>
                Bien que nous mettions en place des mesures de sécurité pour protéger vos données, 
                nous ne pouvons garantir une sécurité absolue. Il est recommandé de conserver des copies 
                de sauvegarde de vos notes importantes.
              </p>
              <p>
                Yanotela ne saurait être tenu responsable de la perte de données, quelle qu&apos;en soit la cause.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                6.3. Contenu utilisateur
              </h3>
              <p>
                Vous êtes seul responsable du contenu que vous créez et stockez sur Yanotela. 
                Nous déclinons toute responsabilité quant à la légalité, l&apos;exactitude ou la qualité de vos contenus.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              7. Protection des données personnelles
            </h2>
            <div className="space-y-3 text-element">
              <p>
                La collecte et le traitement de vos données personnelles sont effectués conformément au 
                Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
              <p>
                Pour plus d&apos;informations sur la gestion de vos données personnelles, veuillez consulter notre{' '}
                <Link href="/mentions-legales" className="text-primary hover:underline">
                  page Mentions Légales
                </Link>
                .
              </p>
              <p>
                Vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données. 
                Pour exercer ces droits, contactez-nous à l&apos;adresse : <strong>
                  <Link href="mailto:contact@florian-bounissou.fr" className="text-primary hover:underline">
                    contact@florian-bounissou.fr
                  </Link>
                </strong>
              </p>
              <p className="text-sm italic text-gray-600 mt-2">
                Dans le cadre d&apos;un projet étudiant, vos données sont traitées uniquement à des fins pédagogiques et de démonstration du service.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              8. Cookies
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Yanotela utilise des cookies nécessaires au fonctionnement du service, notamment pour :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>La gestion de votre session utilisateur (authentification)</li>
                <li>La mémorisation de vos préférences (thème sombre/clair)</li>
              </ul>
              <p>
                Ces cookies sont strictement nécessaires au bon fonctionnement du site et ne nécessitent pas 
                de consentement préalable conformément à la réglementation en vigueur.
              </p>
              <p>
                Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé sur Yanotela.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              9. Modifications des CGU
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Nous nous réservons le droit de modifier les présentes CGU à tout moment.
              </p>
              <p>
                Les modifications entrent en vigueur dès leur mise en ligne. 
                Votre utilisation continue du service après la publication de modifications vaut acceptation de ces modifications.
              </p>
              <p>
                Il vous appartient de consulter régulièrement cette page pour prendre connaissance des éventuelles modifications.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              10. Résiliation
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                10.1. Résiliation par l&apos;utilisateur
              </h3>
              <p>
                Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.
              </p>
              <p>
                La suppression de votre compte entraîne la suppression définitive de toutes vos données 
                (notes, dossiers, informations de profil). Cette action est irréversible.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                10.2. Résiliation par Yanotela
              </h3>
              <p>
                Nous nous réservons le droit de suspendre ou supprimer votre compte en cas de :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Non-respect des présentes CGU</li>
                <li>Utilisation frauduleuse ou abusive du service</li>
                <li>Activité nuisible au service ou aux autres utilisateurs</li>
              </ul>
              <p>
                Cette résiliation peut être effectuée sans préavis ni indemnité.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              11. Droit applicable et juridiction compétente
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Les présentes CGU sont régies par le droit français.
              </p>
              <p>
                En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes, 
                une solution amiable sera recherchée avant toute action judiciaire.
              </p>
              <p>
                À défaut de résolution amiable, tout litige sera porté devant les tribunaux français compétents 
                conformément aux règles de droit commun.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              12. Contact
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
              </p>
              <ul className="list-none ml-4 space-y-2">
                <li>
                  <strong>Email :</strong> <a href="mailto:contact@florian-bounissou.fr" className="text-primary hover:underline">contact@florian-bounissou.fr</a>
                </li>
                <li>
                  <strong>Adresse :</strong> IUT du Limousin, Campus Maurois, 12 All. André Maurois, 87065 Limoges
                </li>
                <li>
                  <strong>Responsable :</strong> Florian Bounissou
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4 italic">
                Ce projet est réalisé dans un cadre pédagogique par des étudiants en BUT MMI.
              </p>
            </div>
          </section>

        </div>

        {/* Footer avec lien vers mentions légales */}
        <div className="mt-8 text-center text-sm text-element">
          <p>
            Consultez également nos{' '}
            <Link href="/mentions-legales" className="text-primary hover:underline font-medium">
              Mentions Légales
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
