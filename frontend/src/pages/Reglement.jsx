import { useState } from 'react';
import { 
  Book, 
  Users, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  UserMinus, 
  PiggyBank, 
  Vote, 
  Shield, 
  Heart, 
  Gift, 
  UserPlus, 
  Scale, 
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Reglement = () => {
  const [openSections, setOpenSections] = useState(['preambule']);

  const toggleSection = (id) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const sections = [
    {
      id: 'preambule',
      title: 'Préambule',
      icon: Book,
      content: (
        <p className="text-gray-600">
          Considérant la volonté des membres de se réunir dans un esprit de solidarité, d'entraide et d'épargne, 
          il est établi le présent règlement qui régit le fonctionnement de notre cotisation. 
          <strong> Nul n'est censé ignorer la loi.</strong>
        </p>
      )
    },
    {
      id: 'titre1',
      title: 'Titre I : Adhésion et Organisation',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 1 : Constitution</h4>
            <p className="text-gray-600">Il est formé entre les adhérents aux présents statuts une association de tontine régie par la confiance mutuelle.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 2 : Conditions d'adhésion</h4>
            <p className="text-gray-600 mb-2">Pour devenir membre, le postulant doit :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Être majeur et jouir de ses droits civiques.</li>
              <li className="text-orange-600 font-medium">⚠️ Restriction : Aucun nouveau membre ne peut « bouffer » les 03 premiers mois.</li>
              <li>Être parrainé par un membre actif de l'association (le Parrain) excepté les membres fondateurs.</li>
              <li>S'acquitter des frais d'adhésion (<strong>100 $</strong>) non remboursables.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 3 : Le Parrainage (Garantie Morale)</h4>
            <p className="text-gray-600">Le Parrain est responsable de la moralité de son "filleul". En cas de fuite ou de défaillance financière du nouveau membre durant les 6 premiers mois, le Parrain est solidairement responsable des dettes de celui-ci.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 4 : Le Bureau Exécutif</h4>
            <p className="text-gray-600 mb-2">L'association est dirigée par un bureau élu pour un an (ou le temps d'un cycle), comprenant :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Le Président</strong> : Dirige les débats et représente l'association.</li>
              <li><strong>Le Censeur</strong> : Tient les PV et fait l'appel.</li>
              <li><strong>Le Trésorier</strong> : Garde les fonds et tient le cahier de comptes.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre2',
      title: 'Titre II : Fonctionnement des Séances',
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 5 : Fréquence et Lieu</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Les réunions ont lieu une fois par mois (le dernier Samedi du mois).</li>
              <li>Le lieu est rotatif (chez le bénéficiaire) ou fixe, selon décision de l'Assemblée Générale.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 6 : Déroulement et Horaires</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Heure de convocation</strong> : 19h30 précises.</li>
              <li><strong>Mise en place</strong> : 19h30 - 20h.</li>
              <li><strong>Début des travaux (Fermeture des portes)</strong> : 21h.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 7 : Définition du Retard et de l'Absence</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-700">Statut</th>
                    <th className="text-left py-2 text-gray-700">Définition</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-2 font-medium text-green-600">À l'heure</td>
                    <td className="py-2">Présence physique avant 19h30</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium text-yellow-600">Retard Simple</td>
                    <td className="py-2">Arrivée entre 19h31 et 20h00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium text-orange-600">Grand Retard</td>
                    <td className="py-2">Arrivée entre 20h01 et 20h59</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-red-600">Absence</td>
                    <td className="py-2">Arrivée après 21h ou non-venue</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'titre3',
      title: 'Titre III : Dispositions Financières',
      icon: DollarSign,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 8 : La Cotisation Tontine</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Le montant de la cotisation est fixé à <strong>200 $</strong> par membre.</li>
              <li>Ce montant est obligatoire et doit être versé en espèces (ou virement Paypal) séance tenante.</li>
              <li>Deux membres perçoivent la cotisation chaque mois.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 9 : L'Ordre de Bénéfice</h4>
            <p className="text-gray-600">L'ordre de passage pour la tontine est établi par décision/tirage au sort en début de cycle. Ce calendrier est immuable sauf cas de force majeure validé par le bureau.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 9 bis : Absence du Bénéficiaire</h4>
            <p className="text-gray-600 mb-2">La présence physique du bénéficiaire est obligatoire. Si absent sans raison grave validée :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Son tour est automatiquement reporté à la fin du cycle.</li>
              <li>Le membre suivant sur la liste prend sa place immédiatement.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 10 : Les Avals (Garantie Financière)</h4>
            <p className="text-gray-600">Pour "bouffer", le bénéficiaire doit présenter un (1) aval (garant) membre de l'association qui ne "bouffe" pas le même mois. En cas de non-paiement futur, les avals seront prélevés à sa place.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 11 : Le Fonds "Nourriture"</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Une cotisation de <strong>25 $</strong> est exigée par membre à chaque séance.</li>
              <li>Ce montant est remis à l'hôte pour assurer le repas et les boissons.</li>
              <li className="text-orange-600">En cas de nourriture insuffisante ou avariée : amende de <strong>50 $</strong> pour "Sabotage culinaire".</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre4',
      title: 'Titre IV : Discipline et Amendes',
      icon: AlertTriangle,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 12 : Barème des Amendes</h4>
            <p className="text-gray-600 mb-4">Les amendes s'appliquent sans négociation. Tout refus de payer une amende sur le champ entraîne son doublement à la séance suivante.</p>
            
            <h5 className="font-medium text-gray-800 mb-2">A. Retards et Absences</h5>
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-red-200">
                    <th className="text-left py-2 text-gray-700">Infraction</th>
                    <th className="text-right py-2 text-gray-700">Amende</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-red-100">
                    <td className="py-2">Retard Simple (après 19h30)</td>
                    <td className="py-2 text-right font-semibold">10 $</td>
                  </tr>
                  <tr className="border-b border-red-100">
                    <td className="py-2">Grand Retard (plus de 30 min)</td>
                    <td className="py-2 text-right font-semibold">20 $</td>
                  </tr>
                  <tr className="border-b border-red-100">
                    <td className="py-2">Absence justifiée (prévenu 24h avant)</td>
                    <td className="py-2 text-right font-semibold">10 $</td>
                  </tr>
                  <tr className="border-b border-red-100">
                    <td className="py-2">Absence non justifiée (après 20h59)</td>
                    <td className="py-2 text-right font-semibold">50 $</td>
                  </tr>
                  <tr>
                    <td className="py-2">Retard de l'Hôte</td>
                    <td className="py-2 text-right font-semibold">20 $</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 className="font-medium text-gray-800 mb-2">B. Manquements Financiers</h5>
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-200">
                    <th className="text-left py-2 text-gray-700">Infraction</th>
                    <th className="text-right py-2 text-gray-700">Amende</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-orange-100">
                    <td className="py-2">Échec de cotisation le jour J</td>
                    <td className="py-2 text-right font-semibold">50 $ + 48h pour payer</td>
                  </tr>
                  <tr className="border-b border-orange-100">
                    <td className="py-2">Défaillance de cotisation</td>
                    <td className="py-2 text-right font-semibold">100 $</td>
                  </tr>
                  <tr className="border-b border-orange-100">
                    <td className="py-2">Retard envoi argent nourriture</td>
                    <td className="py-2 text-right font-semibold">15 $</td>
                  </tr>
                  <tr className="border-b border-orange-100">
                    <td className="py-2">Sabotage culinaire</td>
                    <td className="py-2 text-right font-semibold">50 $</td>
                  </tr>
                  <tr className="border-b border-orange-100">
                    <td className="py-2">Retard remboursement prêt</td>
                    <td className="py-2 text-right font-semibold">10 $ / 7 jours</td>
                  </tr>
                  <tr>
                    <td className="py-2">Violation de confidentialité</td>
                    <td className="py-2 text-right font-semibold">90 $</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-red-800 font-medium">⚠️ Refus de payer une amende :</p>
              <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                <li>Amende doublée à la séance suivante (et chaque mois)</li>
                <li>Après 2 mois : Prélèvement automatique sur la tontine</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'titre5',
      title: 'Titre V : Défaillance et Démission',
      icon: UserMinus,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 13 : Démission</h4>
            <p className="text-gray-600 mb-2">Tout membre désirant quitter l'association doit adresser une lettre au Président un mois avant son départ.</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Si pas encore "bouffé"</strong> : Restitution des cotisations à la fin du cycle moins une pénalité de 30%.</li>
              <li><strong>Si déjà "bouffé"</strong> : Remboursement intégral du reste du cycle immédiatement. Sinon, ses avals sont saisis.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 14 : Décès d'un membre</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>La tontine s'arrête pour le membre.</li>
              <li>Si créditeur : L'association verse ses cotisations cumulées aux ayants droit immédiatement.</li>
              <li>Cotisation exceptionnelle de <strong>100 $</strong> par tête pour assister la famille (Fonds de deuil).</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre6',
      title: 'Titre VI : La Trésorerie de Secours',
      icon: PiggyBank,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 15 : Fonds de Caisse</h4>
            <p className="text-gray-600 mb-2">Les amendes perçues constituent le "Fonds de Caisse" ou "Fonds de Secours". Ce fonds sert à :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Aider un membre en difficulté (prêt à faible taux).</li>
              <li>Financer la fête de fin d'année ("Le cassage de la tontine").</li>
              <li>Acheter du matériel ou les commodités.</li>
              <li>Faire des activités.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre7',
      title: 'Titre VII : Le Fonds de Prêt Interne',
      icon: DollarSign,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 16 : Principe du Prêt</h4>
            <p className="text-gray-600">Le Fonds de Caisse peut être prêté aux membres actifs à court terme pour générer des intérêts au profit de l'association.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 17 : Conditions d'Éligibilité</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Être à jour de toutes ses cotisations.</li>
              <li>Ne pas avoir de dette antérieure envers l'association.</li>
              <li>Présenter une demande en début de séance.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 18 : Modalités du Prêt</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Plafond</strong> : Maximum 50% du fonds disponible.</li>
              <li><strong>Taux d'intérêt</strong> : 5% forfaitaire.</li>
              <li><strong>Durée</strong> : Un mois seulement. Remboursement à la séance suivante.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 19 : Sanction pour non-remboursement</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Pénalité de <strong>10 $</strong> tous les 7 jours de retard.</li>
              <li>Prélèvement direct sur la prochaine tontine ou réclamation aux Avals.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre8',
      title: 'Titre VIII : Gestion de la Défaillance',
      icon: AlertTriangle,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 20 : Constat de Défaillance</h4>
            <p className="text-gray-600">Si un membre ne peut pas verser ses 200 $, il est déclaré "défaillant" et doit s'acquitter immédiatement de l'amende d'échec de cotisation (<strong>100 $</strong>).</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 21 : Mécanisme de Comblement (Le Vote)</h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-700 mb-2">L'Assemblée vote pour choisir la solution :</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Option A (Recours à la Caisse)</strong> : L'association puise dans le Fonds de Caisse.</li>
                <li><strong>Option B (Solidarité Immédiate)</strong> : Le montant est divisé entre les membres présents.</li>
              </ul>
              <p className="text-blue-700 mt-2 text-sm">⚠️ L'Option A est prioritaire tant qu'il y a de l'argent.</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 22 : Remboursement</h4>
            <p className="text-gray-600">Le membre défaillant dispose de <strong>72 heures</strong> pour rembourser sa dette.</p>
          </div>
        </div>
      )
    },
    {
      id: 'titre9',
      title: 'Titre IX : Le Processus de Décision',
      icon: Vote,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 23 : Le Vote Anonyme</h4>
            <p className="text-gray-600 mb-2">Le vote à bulletin secret est obligatoire pour :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>L'élection ou la destitution d'un membre du Bureau.</li>
              <li>L'exclusion définitive d'un membre.</li>
              <li>L'attribution de l'ordre des tours de tontine (si contestation).</li>
              <li>Toute décision impliquant une dépense exceptionnelle supérieure à 200 $.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 24 : Procédure de vote</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Le Secrétaire distribue des petits papiers identiques.</li>
              <li>Chaque membre inscrit son choix (OUI/NON ou Nom).</li>
              <li>Le Censeur collecte et dépouille à haute voix.</li>
              <li>Aucun membre du bureau ne peut participer au vote.</li>
              <li>En cas d'égalité, le vote est refait.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre10',
      title: 'Titre X : Les Fondateurs et le Bureau',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 25 : Les Membres Fondateurs</h4>
            <p className="text-gray-600 mb-2">Privilèges et Devoirs des Fondateurs :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Ils sont les gardiens de l'esprit de la tontine.</li>
              <li>Pas de droit de veto, mais consultation obligatoire en cas de crise majeure.</li>
              <li>Doivent montrer l'exemple par une assiduité irréprochable.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 26 : Nomination et Élection du Bureau</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Éligibilité</strong> : Membre actif depuis au moins un cycle, à jour des cotisations.</li>
              <li><strong>Mode de scrutin</strong> : Vote secret à la majorité simple.</li>
              <li><strong>Durée du mandat</strong> : Un an, renouvelable.</li>
              <li><strong>Destitution</strong> : Vote des 2/3 de l'Assemblée en cas de faute lourde.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre11',
      title: 'Titre XI : Éthique et Intégrité',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 27 : Charte de l'Intégrité</h4>
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <p className="text-purple-800 font-medium mb-2">🔒 Confidentialité</p>
              <p className="text-gray-600">"Ce qui se dit en réunion reste en réunion." Tout manquement : amende de <strong>90 $</strong>.</p>
            </div>
            <p className="text-gray-600"><strong>Transparence financière</strong> : Tout membre s'engage sur l'honneur à n'adhérer que s'il a la capacité financière réelle.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 28 : Charte contre les Clans</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Interdiction des sous-groupes</strong> : Pas de réunions secrètes ou cabales.</li>
              <li><strong>Concurrence Loyale</strong> : Pas de prosélytisme pour une autre tontine.</li>
              <li><strong>Sanction</strong> : Exclusion définitive sans remboursement.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre12',
      title: 'Titre XII : La Charte Sociale',
      icon: Heart,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 29 : La Caisse de Solidarité</h4>
            <p className="text-gray-600">L'association assiste ses membres lors des événements marquants. Les montants sont prélevés sur le "Fonds de Caisse".</p>
          </div>
        </div>
      )
    },
    {
      id: 'titre13',
      title: 'Titre XIII : La Fin de Cycle',
      icon: Gift,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 31 : Le Partage des Bénéfices (Dividendes)</h4>
            <p className="text-gray-600 mb-2">À la fin du cycle ("Le Cassage") :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>On additionne tout l'argent restant (intérêts + amendes).</li>
              <li>On soustrait les frais de la fête de fin d'année.</li>
              <li>Le reste est divisé équitablement entre tous les membres.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre14',
      title: 'Titre XIV : Les Invités',
      icon: UserPlus,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 34 : Gestion des Invités</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Prévenir l'hôte 24h à l'avance.</li>
              <li>L'invité ne paye pas la nourriture la première fois.</li>
              <li>À partir de la 3ème participation : cotisation de <strong>25 $</strong> pour manger.</li>
              <li>Pas de droit à la parole sauf invitation du Président.</li>
              <li>Doit sortir lors des votes secrets.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre15',
      title: 'Titre XV : Couples et Conflits d\'Intérêts',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 35 (A) : Dispositions relatives aux Couples</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li><strong>Entités distinctes</strong> : Deux cotisations, deux lots distincts.</li>
              <li><strong>Interdiction de l'Aval Mutuel</strong> : Un conjoint ne peut pas se porter garant pour l'autre.</li>
              <li><strong>Ordre espacé</strong> : Intervalle d'au moins 2 mois entre leurs tours.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'titre16',
      title: 'Titre XVI : Vie de l\'Association',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 37 : Modification du Règlement</h4>
            <p className="text-gray-600">Le règlement ne peut être modifié qu'en Assemblée Générale de fin de cycle. Vote à la majorité qualifiée des 2/3.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 38 : Dissolution</h4>
            <p className="text-gray-600">Décidée par les 3/4 des membres. L'actif net sera partagé équitablement.</p>
          </div>
        </div>
      )
    },
    {
      id: 'titre17',
      title: 'Titre XVII : Protection Juridique',
      icon: Scale,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Article 35 (B) : Résolution des litiges</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700">En adhérant, le membre s'engage à renoncer à toute poursuite judiciaire tant que les voies de recours internes (Bureau, Conseil des anciens) n'ont pas été épuisées.</p>
              <p className="text-yellow-800 font-medium mt-2">⚠️ Tout litige doit être réglé "en famille". Le recours à la police est un motif d'exclusion immédiate.</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Cas de Force Majeure</h4>
            <p className="text-gray-600">Chacun a droit à une absence excusée en cas de force majeure.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Règlement Intérieur</h1>
          <p className="text-gray-500">Règles et statuts de l'association</p>
        </div>
        <button
          onClick={() => setOpenSections(openSections.length === sections.length ? [] : sections.map(s => s.id))}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          {openSections.length === sections.length ? 'Tout réduire' : 'Tout développer'}
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections.includes(section.id);
          
          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="font-semibold text-gray-900">{section.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reglement;
