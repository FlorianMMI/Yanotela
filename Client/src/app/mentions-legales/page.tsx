'use client';

import React from 'react';
import Link from 'next/link';

import { ArrowIcon } from '@/libs/Icons';
export const noAuth = true;

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header avec retour */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
          >
            <ArrowIcon className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </Link>
          <h1 className="text-4xl font-bold text-clrprincipal mb-2">
            Mentions Légales
          </h1>
          <p className="text-sm text-element">
            Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique
          </p>
        </div>

        {/* Contenu des mentions légales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              1. Identification de l&apos;éditeur
            </h2>
            <div className="space-y-3 text-element">
              <p className="font-medium text-clrprincipal">
                Le site Yanotela est édité par :
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <p>
                  <strong>Projet :</strong> Yanotela
                </p>
                <p>
                  <strong>Nature du projet :</strong> Projet étudiant réalisé dans le cadre de la formation BUT MMI (Métiers du Multimédia et de l&apos;Internet)
                </p>
                <p>
                  <strong>Établissement :</strong> IUT du Limousin, Limoges
                </p>
                <p>
                  <strong>Adresse :</strong> Campus Maurois, 12 All. André Maurois, 87065 Limoges
                </p>
                <p className="text-sm italic text-gray-600">
                  Note : Ce projet est à but éducatif, sans activité commerciale. Aucune publicité ni vente n&apos;est réalisée sur ce site.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <p>
                  <strong>Directeur de la publication :</strong> Florian Bounissou
                </p>
                <p>
                  <strong>Email de contact :</strong>{' '}
                  <Link href="mailto:contact@florian-bounissou.fr" className="text-primary hover:underline">
                    contact@florian-bounissou.fr
                  </Link>
                </p>
              </div>

              {/* Équipe de développement */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-clrprincipal mb-3">
                  Équipe de développement
                </h3>
                <p className="text-sm text-element mb-3">
                  Ce projet a été réalisé par une équipe d&apos;étudiants en BUT MMI :
                </p>
                <ul className="space-y-2 text-element">
                  <li>
                    <strong>Chef de projet & Développeur :</strong> Florian Bounissou
                  </li>
                  <li>
                    <strong>Développeur :</strong> Julian Doutreligne
                  </li>
                  <li>
                    <strong>Développeur :</strong> Mael Valin
                  </li>
                  <li>
                    <strong>Développeur :</strong> François Donzaud
                  </li>
                  <li>
                    <strong>Développeur :</strong> Ethan Manchon
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              2. Hébergement
            </h2>
            <div className="space-y-3 text-element">
              <p className="font-medium text-clrprincipal">
                Le site Yanotela est hébergé par :
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <p>
                  <strong>Nom de l&apos;hébergeur :</strong> Amazon Web Services (AWS)
                </p>
                <p>
                  <strong>Raison sociale :</strong> Amazon Web Services EMEA SARL
                </p>
                <p>
                  <strong>Type d&apos;hébergement :</strong> Instance EC2 (Elastic Compute Cloud)
                </p>
                <p>
                  <strong>Adresse :</strong> 38 Avenue John F. Kennedy, L-1855 Luxembourg
                </p>
                <p>
                  <strong>Site web :</strong>{' '}
                  <Link href="https://aws.amazon.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    https://aws.amazon.com
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              3. Propriété intellectuelle
            </h2>
            <div className="space-y-3 text-element">
              <p>
                L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle.
              </p>
              <p>
                Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
              <p>
                La reproduction de tout ou partie de ce site sur un support électronique ou autre quel qu&apos;il soit 
                est formellement interdite sauf autorisation expresse du directeur de la publication.
              </p>
              <p>
                Les marques, logos, signes et tout autre contenu du site font l&apos;objet d&apos;une protection 
                par le Code de la propriété intellectuelle et plus particulièrement par le droit d&apos;auteur.
              </p>
              <p>
                Le nom &quot;Yanotela&quot;, le logo et la charte graphique sont la propriété de l&apos;équipe de développement du projet Yanotela (IUT du Limousin).
              </p>
              <p className="text-sm italic text-gray-600">
                Ce projet étant à vocation pédagogique, toute réutilisation à des fins commerciales est interdite sans autorisation préalable.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              4. Protection des données personnelles (RGPD)
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.1. Responsable du traitement
              </h3>
              <p>
                Le responsable du traitement des données personnelles est :<br />
                <strong>Florian Bounissou</strong><br />
                Contact : <a href="mailto:contact@florian-bounissou.fr" className="text-primary hover:underline">contact@florian-bounissou.fr</a>
              </p>
              <p className="text-sm italic text-gray-600 mt-2">
                Dans le cadre d&apos;un projet étudiant, les données sont traitées uniquement à des fins pédagogiques et de démonstration du service.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.2. Données collectées
              </h3>
              <p>
                Dans le cadre de l&apos;utilisation du service Yanotela, nous collectons les données suivantes :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Données d&apos;identification :</strong> pseudonyme, adresse email
                </li>
                <li>
                  <strong>Données de connexion :</strong> adresse IP, logs de connexion, cookies de session
                </li>
                <li>
                  <strong>Données de contenu :</strong> notes créées, dossiers, préférences utilisateur
                </li>
              </ul>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.3. Finalités du traitement
              </h3>
              <p>
                Vos données personnelles sont collectées et traitées pour les finalités suivantes :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Gestion de votre compte utilisateur</li>
                <li>Fourniture du service de prise de notes</li>
                <li>Vérification de votre identité et sécurisation de votre compte</li>
                <li>Communication avec vous concernant le service</li>
                <li>Amélioration du service et correction de bugs</li>
              </ul>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.4. Base légale du traitement
              </h3>
              <p>
                Le traitement de vos données personnelles repose sur les bases légales suivantes :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Exécution du contrat :</strong> pour la fourniture du service et la gestion de votre compte
                </li>
                <li>
                  <strong>Consentement :</strong> pour l&apos;envoi de communications facultatives
                </li>
                <li>
                  <strong>Intérêt légitime :</strong> pour la sécurité du service et la prévention de la fraude
                </li>
              </ul>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.5. Destinataires des données
              </h3>
              <p>
                Vos données personnelles sont destinées à :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>L&apos;équipe de Yanotela pour la gestion du service</li>
                <li>Notre hébergeur pour le stockage des données</li>
              </ul>
              <p>
                Vos données ne sont jamais vendues, louées ou partagées à des tiers à des fins commerciales.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.6. Transferts de données hors UE
              </h3>
              <p>
                Les données sont hébergées sur les serveurs d&apos;Amazon Web Services (AWS) situés dans la région Europe (Luxembourg/Irlande). 
                AWS est certifié conforme au RGPD et respecte les standards européens de protection des données.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Bien que AWS dispose de datacenters dans le monde entier, les données de Yanotela sont stockées et traitées exclusivement au sein de l&apos;Union Européenne.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.7. Durée de conservation
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Données de compte :</strong> conservées pendant toute la durée d&apos;utilisation du service 
                  et jusqu&apos;à 30 jours après suppression du compte
                </li>
                <li>
                  <strong>Logs de connexion :</strong> conservés pendant 12 mois maximum
                </li>
                <li>
                  <strong>Notes et contenus :</strong> supprimés définitivement lors de la suppression du compte
                </li>
              </ul>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                4.8. Vos droits
              </h3>
              <p>
                Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles
                </li>
                <li>
                  <strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes
                </li>
                <li>
                  <strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données
                </li>
                <li>
                  <strong>Droit à la limitation :</strong> limiter le traitement de vos données dans certains cas
                </li>
                <li>
                  <strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré
                </li>
                <li>
                  <strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes
                </li>
                <li>
                  <strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement
                </li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à l&apos;adresse :{' '}
                <a href="mailto:contact@florian-bounissou.fr" className="text-primary hover:underline">
                  contact@florian-bounissou.fr
                </a>
              </p>
              <p>
                Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL 
                (Commission Nationale de l&apos;Informatique et des Libertés) :{' '}
                <a 
                  href="https://www.cnil.fr" 
                  className="text-primary hover:underline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  www.cnil.fr
                </a>
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              5. Cookies
            </h2>
            <div className="space-y-3 text-element">
              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                5.1. Cookies utilisés
              </h3>
              <p>
                Yanotela utilise des cookies strictement nécessaires au fonctionnement du site :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>
                  <strong>Cookie de session :</strong> permet de maintenir votre connexion et d&apos;assurer 
                  la sécurité de votre compte (expire à la fermeture du navigateur ou après 7 jours)
                </li>
                <li>
                  <strong>Cookie de préférences :</strong> mémorise vos choix (thème sombre/clair)
                </li>
              </ul>
              <p>
                Ces cookies sont indispensables au bon fonctionnement du service et ne nécessitent pas 
                de consentement préalable conformément aux recommandations de la CNIL.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                5.2. Cookies tiers
              </h3>
              <p>
                Yanotela n&apos;utilise <strong>aucun cookie publicitaire ou de tracking tiers</strong>.
              </p>
              <p>
                Aucune donnée n&apos;est partagée avec des régies publicitaires ou des services d&apos;analyse tiers 
                comme Google Analytics.
              </p>

              <h3 className="text-lg font-medium text-clrprincipal mt-4 mb-2">
                5.3. Gestion des cookies
              </h3>
              <p>
                Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela empêchera 
                le bon fonctionnement de Yanotela et notamment l&apos;authentification.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              6. Sécurité
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées 
                pour assurer la sécurité et la confidentialité de vos données :
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Chiffrement des mots de passe (hachage bcrypt)</li>
                <li>Connexion HTTPS sécurisée</li>
                <li>Sessions sécurisées avec tokens</li>
                <li>Sauvegardes régulières des données</li>
                <li>Accès restreint aux données par l&apos;équipe technique</li>
              </ul>
              <p>
                Malgré ces mesures, aucune transmission de données sur Internet ne peut être garantie 
                comme totalement sécurisée. Nous ne pouvons donc pas garantir une sécurité absolue.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              7. Liens externes
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Le site Yanotela peut contenir des liens vers des sites externes.
              </p>
              <p>
                Nous ne pouvons être tenus responsables du contenu de ces sites tiers ni de leurs 
                pratiques en matière de protection des données personnelles.
              </p>
              <p>
                Nous vous invitons à consulter les politiques de confidentialité de ces sites avant 
                de leur transmettre vos données personnelles.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              8. Modifications
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Nous nous réservons le droit de modifier les présentes mentions légales à tout moment.
              </p>
              <p>
                Les modifications entrent en vigueur dès leur mise en ligne sur cette page.
              </p>
              <p>
                Date de dernière mise à jour : <strong>{new Date().toLocaleDateString('fr-FR')}</strong>
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-clrprincipal mb-4">
              9. Contact
            </h2>
            <div className="space-y-3 text-element">
              <p>
                Pour toute question concernant les présentes mentions légales ou la protection de vos données :
              </p>
              <ul className="list-none ml-4 space-y-2">
                <li>
                  <strong>Email :</strong>{' '}
                  <a href="mailto:contact@florian-bounissou.fr" className="text-primary hover:underline">
                    contact@florian-bounissou.fr
                  </a>
                </li>
                <li>
                  <strong>Adresse postale :</strong> IUT du Limousin, Campus Maurois, 12 All. André Maurois, 87065 Limoges
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4 italic">
                Ce projet étant réalisé dans un cadre pédagogique, les réponses aux demandes peuvent nécessiter un délai raisonnable.
              </p>
            </div>
          </section>

        </div>

        {/* Footer avec lien vers CGU */}
        <div className="mt-8 text-center text-sm text-element">
          <p>
            Consultez également nos{' '}
            <Link href="/cgu" className="text-primary hover:underline font-medium">
              Conditions Générales d&apos;Utilisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
