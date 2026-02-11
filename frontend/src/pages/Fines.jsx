import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  DollarSign, 
  Plus, 
  X, 
  Search,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const TYPES_AMENDES = {
  retard_simple: { label: 'Retard simple (après 19h30)', montant: 10, categorie: 'retards' },
  grand_retard: { label: 'Grand retard (plus de 30 min)', montant: 20, categorie: 'retards' },
  absence_justifiee: { label: 'Absence justifiée 24h avant', montant: 10, categorie: 'retards' },
  absence_non_justifiee: { label: 'Absence ou arrivée après 20h59', montant: 50, categorie: 'retards' },
  retard_hote: { label: 'Retard de l\'hôte', montant: 20, categorie: 'retards' },
  echec_cotisation: { label: 'Échec de cotisation le jour J', montant: 50, categorie: 'financier' },
  defaillance_cotisation: { label: 'Défaillance de cotisation', montant: 100, categorie: 'financier' },
  retard_argent_nourriture: { label: 'Retard sur l\'envoi d\'argent nourriture', montant: 15, categorie: 'financier' },
  argent_non_especes: { label: 'Argent non remis en espèces', montant: 5, categorie: 'financier' },
  sabotage_culinaire: { label: 'Sabotage culinaire', montant: 50, categorie: 'organisation' },
  retard_remboursement_pret: { label: 'Retard remboursement prêt (par 7 jours)', montant: 10, categorie: 'prets' },
  violation_confidentialite: { label: 'Violation de confidentialité', montant: 90, categorie: 'discipline' },
  autre: { label: 'Autre infraction', montant: 0, categorie: 'autre' }
};

const Fines = () => {
  const { user } = useAuth();
  const [fines, setFines] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    membre: '',
    typeAmende: '',
    montant: '',
    motif: 'autre',
    description: ''
  });

  const canManageFines = true; // Tous les membres peuvent voir toutes les amendes
  const canCreateFines = user?.role === 'censeur';
  const canPayFines = user?.role === 'censeur';
  const canCancelFines = user?.role === 'censeur';

  useEffect(() => {
    fetchFines();
    if (canManageFines) {
      fetchMembers();
    }
  }, []);

  const fetchFines = async () => {
    try {
      const endpoint = canManageFines ? '/fines' : '/fines/my';
      console.log('Fetching fines from:', endpoint, 'User role:', user?.role);
      const response = await api.get(endpoint);
      console.log('Fines response:', response.data);
      setFines(response.data.data || []);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/users');
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fines', {
        ...formData,
        montant: Number(formData.montant)
      });
      setShowModal(false);
      setFormData({ membre: '', typeAmende: '', montant: '', motif: 'autre', description: '' });
      fetchFines();
    } catch (error) {
      console.error('Error creating fine:', error);
    }
  };

  const handlePayFine = async (fineId) => {
    try {
      await api.put(`/fines/${fineId}/pay`);
      fetchFines();
    } catch (error) {
      console.error('Error paying fine:', error);
    }
  };

  const handleCancelFine = async (fineId) => {
    try {
      await api.put(`/fines/${fineId}/cancel`);
      fetchFines();
    } catch (error) {
      console.error('Error canceling fine:', error);
    }
  };

  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { style: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En attente' },
      payee: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Payée' },
      annulee: { style: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Annulée' }
    };
    const { style, icon: Icon, label } = config[statut] || config.en_attente;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const getMotifLabel = (motif) => {
    const labels = { 
      retard: 'Retard', 
      absence: 'Absence', 
      financier: 'Financier',
      organisation: 'Organisation',
      discipline: 'Discipline',
      autre: 'Autre' 
    };
    return labels[motif] || motif;
  };

  const handleTypeChange = (typeKey) => {
    const type = TYPES_AMENDES[typeKey];
    if (type) {
      setFormData({
        ...formData,
        typeAmende: typeKey,
        montant: type.montant,
        motif: type.categorie === 'retards' ? 'retard' : 
               type.categorie === 'financier' ? 'financier' :
               type.categorie === 'organisation' ? 'organisation' :
               type.categorie === 'discipline' ? 'discipline' : 'autre'
      });
    }
  };

  const filteredFines = fines.filter(f => {
    if (filter === 'all') return true;
    return f.statut === filter;
  });

  const totalEnAttente = fines
    .filter(f => f.statut === 'en_attente')
    .reduce((sum, f) => sum + f.montant, 0);

  const totalPaye = fines
    .filter(f => f.statut === 'payee')
    .reduce((sum, f) => sum + f.montant, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amendes</h1>
          <p className="text-gray-500">
            {canManageFines ? 'Gérez les amendes des membres' : 'Consultez vos amendes'}
          </p>
        </div>
        {canCreateFines && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Nouvelle amende
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total non payé</p>
              <p className="text-3xl font-bold text-red-600">{totalEnAttente.toLocaleString()} $</p>
            </div>
            <div className="h-14 w-14 bg-red-100 rounded-xl flex items-center justify-center">
              <Clock className="h-7 w-7 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total payé</p>
              <p className="text-3xl font-bold text-green-600">{totalPaye.toLocaleString()} $</p>
            </div>
            <div className="h-14 w-14 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'en_attente', 'payee', 'annulee'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Toutes' : 
             status === 'en_attente' ? 'En attente' :
             status === 'payee' ? 'Payées' : 'Annulées'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredFines.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune amende trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {canManageFines && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Membre</th>}
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Motif</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  {canPayFines && <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFines.map((fine) => (
                  <tr key={fine._id} className="hover:bg-gray-50">
                    {canManageFines && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 text-sm font-medium">
                              {fine.membre?.prenom?.[0]}{fine.membre?.nom?.[0]}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {fine.membre?.prenom} {fine.membre?.nom}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {fine.montant.toLocaleString()} $
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {getMotifLabel(fine.motif)}
                      {fine.description && (
                        <p className="text-xs text-gray-400 mt-1">{fine.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(fine.statut)}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(fine.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    {canPayFines && (
                      <td className="px-6 py-4 text-right">
                        {fine.statut === 'en_attente' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handlePayFine(fine._id)}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              Valider paiement
                            </button>
                            <button
                              onClick={() => handleCancelFine(fine._id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            >
                              Annuler
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Nouvelle amende</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membre</label>
                <select
                  value={formData.membre}
                  onChange={(e) => setFormData({ ...formData, membre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                >
                  <option value="">Sélectionner un membre</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.prenom} {member.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'infraction</label>
                <select
                  value={formData.typeAmende}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                >
                  <option value="">Sélectionner une infraction</option>
                  <optgroup label="Retards et absences">
                    <option value="retard_simple">Retard simple (après 19h30) - 10$</option>
                    <option value="grand_retard">Grand retard (plus de 30 min) - 20$</option>
                    <option value="absence_justifiee">Absence justifiée 24h avant - 10$</option>
                    <option value="absence_non_justifiee">Absence ou arrivée après 20h59 - 50$</option>
                    <option value="retard_hote">Retard de l'hôte - 20$</option>
                  </optgroup>
                  <optgroup label="Manquements financiers">
                    <option value="echec_cotisation">Échec de cotisation le jour J - 50$</option>
                    <option value="defaillance_cotisation">Défaillance de cotisation - 100$</option>
                    <option value="retard_argent_nourriture">Retard envoi argent nourriture - 15$</option>
                    <option value="argent_non_especes">Argent non remis en espèces - 5$</option>
                  </optgroup>
                  <optgroup label="Organisation">
                    <option value="sabotage_culinaire">Sabotage culinaire - 50$</option>
                  </optgroup>
                  <optgroup label="Prêts">
                    <option value="retard_remboursement_pret">Retard remboursement prêt (par 7 jours) - 10$</option>
                  </optgroup>
                  <optgroup label="Discipline">
                    <option value="violation_confidentialite">Violation de confidentialité - 90$</option>
                  </optgroup>
                  <optgroup label="Autre">
                    <option value="autre">Autre infraction (montant personnalisé)</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant ($)</label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  min="0"
                  readOnly={formData.typeAmende !== 'autre' && formData.typeAmende !== ''}
                />
                {formData.typeAmende && formData.typeAmende !== 'autre' && (
                  <p className="text-xs text-gray-500 mt-1">Montant fixé selon le barème officiel</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={2}
                  placeholder="Détails supplémentaires..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;
