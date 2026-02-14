import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Banknote, 
  Plus, 
  X, 
  Check,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react';

const TAUX_INTERET = 5;
const PENALITE_RETARD = 10;

const Loans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [stats, setStats] = useState(null);
  const [fondsCaisse, setFondsCaisse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTraiterModal, setShowTraiterModal] = useState(false);
  const [showRemboursementModal, setShowRemboursementModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    montant: '',
    motif: ''
  });
  const [traiterData, setTraiterData] = useState({
    statut: 'approuve',
    commentaire: ''
  });
  const [remboursementData, setRemboursementData] = useState({
    montant: '',
    commentaire: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const canViewAll = ['president', 'tresorier', 'censeur'].includes(user?.role);
  const canManage = user?.role === 'tresorier';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [myLoansRes, fondsRes] = await Promise.all([
        api.get('/loans/my'),
        api.get('/loans/fonds-caisse')
      ]);
      setMyLoans(myLoansRes.data.data || []);
      setFondsCaisse(fondsRes.data.data);

      if (canViewAll) {
        const [loansRes, statsRes] = await Promise.all([
          api.get('/loans'),
          api.get('/loans/stats')
        ]);
        setLoans(loansRes.data.data || []);
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/loans', formData);
      setShowRequestModal(false);
      setFormData({ montant: '', motif: '', dateRemboursementPrevue: '' });
      setMessage({ type: 'success', text: 'Demande de prêt soumise avec succès' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTraiter = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/loans/${selectedLoan._id}/traiter`, traiterData);
      setShowTraiterModal(false);
      setSelectedLoan(null);
      setTraiterData({ statut: 'approuve', commentaire: '' });
      setMessage({ type: 'success', text: traiterData.statut === 'approuve' ? 'Prêt approuvé' : 'Prêt refusé' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemboursement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/loans/${selectedLoan._id}/remboursement`, remboursementData);
      setShowRemboursementModal(false);
      setSelectedLoan(null);
      setRemboursementData({ montant: '', commentaire: '' });
      setMessage({ type: 'success', text: 'Remboursement enregistré' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  };

  const openTraiterModal = (loan) => {
    setSelectedLoan(loan);
    setShowTraiterModal(true);
  };

  const openRemboursementModal = (loan) => {
    setSelectedLoan(loan);
    setRemboursementData({ montant: '', commentaire: '' });
    setShowRemboursementModal(true);
  };

  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { color: 'yellow', icon: Clock, label: 'En attente' },
      approuve: { color: 'blue', icon: Check, label: 'Approuvé' },
      en_cours: { color: 'blue', icon: DollarSign, label: 'En cours' },
      refuse: { color: 'red', icon: XCircle, label: 'Refusé' },
      rembourse: { color: 'green', icon: CheckCircle, label: 'Remboursé' }
    };
    const { color, icon: Icon, label } = config[statut] || config.en_attente;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-700 rounded-full`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const displayLoans = activeTab === 'my' ? myLoans : loans;

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
          <h1 className="text-2xl font-bold text-gray-900">Prêts</h1>
          <p className="text-gray-500">Gestion des demandes de prêt</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5" />
          Demander un prêt
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Fonds de caisse - visible par tous */}
      {fondsCaisse && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-primary-100 text-sm">Fonds de Caisse Total</p>
              <p className="text-4xl font-bold">{fondsCaisse.total}$</p>
              <p className="text-primary-200 text-sm mt-1">
                Amendes payées: {fondsCaisse.amendes}$ | Intérêts: {fondsCaisse.interets}$
              </p>
            </div>
            <div className="text-center">
              <p className="text-primary-100 text-sm">Prêts en cours</p>
              <p className="text-2xl font-bold">{fondsCaisse.pretsEnCours}$</p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm">Disponible</p>
              <p className="text-2xl font-bold">{fondsCaisse.disponible}$</p>
              <p className="text-green-300 text-sm mt-1 font-medium">
                💰 Max empruntable: {fondsCaisse.plafondPret}$
              </p>
            </div>
          </div>
        </div>
      )}

      {canViewAll && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
                <p className="text-sm text-gray-500">En attente</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.montantEnCours}$</p>
                <p className="text-sm text-gray-500">En cours</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.rembourses}</p>
                <p className="text-sm text-gray-500">Remboursés</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Banknote className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.montantTotal}$</p>
                <p className="text-sm text-gray-500">Total prêté</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {canViewAll && (
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          >
            Tous les prêts ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 font-medium ${activeTab === 'my' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          >
            Mes prêts ({myLoans.length})
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {displayLoans.length === 0 ? (
          <div className="p-12 text-center">
            <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun prêt pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayLoans.map((loan) => (
              <div key={loan._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {activeTab === 'all' && loan.demandeur && (
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {loan.demandeur.photo ? (
                          <img src={loan.demandeur.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-primary-700 font-semibold">
                            {loan.demandeur.prenom?.[0]}{loan.demandeur.nom?.[0]}
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {activeTab === 'all' && (
                          <span className="font-medium text-gray-900">
                            {loan.demandeur?.prenom} {loan.demandeur?.nom}
                          </span>
                        )}
                        {getStatusBadge(loan.statut)}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-gray-900">{loan.montant}$</p>
                        {loan.interet > 0 && (
                          <span className="text-sm text-gray-500">
                            + {loan.interet}$ intérêts ({loan.tauxInteret}%) = <span className="font-semibold text-primary-600">{loan.montantTotal}$</span>
                          </span>
                        )}
                        {loan.penalites > 0 && (
                          <span className="text-sm text-red-600 font-medium">
                            + {loan.penalites}$ pénalités
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{loan.motif}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(loan.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        {loan.dateRemboursementPrevue && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Échéance: {new Date(loan.dateRemboursementPrevue).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {loan.statut === 'en_cours' && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Remboursé:</span>
                            <span className="font-medium">{loan.montantRembourse}$ / {loan.montantTotal || loan.montant}$</span>
                          </div>
                          <div className="w-48 h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{ width: `${(loan.montantRembourse / (loan.montantTotal || loan.montant)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {loan.commentaireTraitement && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          "{loan.commentaireTraitement}" - {loan.traitePar?.prenom} {loan.traitePar?.nom}
                        </p>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      {loan.statut === 'en_attente' && (
                        <button
                          onClick={() => openTraiterModal(loan)}
                          className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 text-sm font-medium"
                        >
                          Traiter
                        </button>
                      )}
                      {loan.statut === 'en_cours' && (
                        <button
                          onClick={() => openRemboursementModal(loan)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                        >
                          + Remboursement
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal demande de prêt */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Demander un prêt</h2>
              <button onClick={() => setShowRequestModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              {fondsCaisse && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <p className="text-lg font-bold text-green-700">
                    💰 Montant maximum empruntable: {fondsCaisse.plafondPret}$
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    (50% du fonds disponible de {fondsCaisse.disponible}$)
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant demandé ($)</label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
                    formData.montant && fondsCaisse && Number(formData.montant) > fondsCaisse.plafondPret
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder={`Max: ${fondsCaisse?.plafondPret || 0}$`}
                  min="1"
                  required
                />
                {formData.montant && fondsCaisse && Number(formData.montant) > fondsCaisse.plafondPret && (
                  <p className="text-red-600 text-sm mt-1 font-medium">
                    ⚠️ Le montant dépasse le plafond autorisé de {fondsCaisse.plafondPret}$
                  </p>
                )}
              </div>
              
              {formData.montant > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Récapitulatif du prêt</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant emprunté:</span>
                      <span className="font-medium">{formData.montant}$</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Intérêts ({TAUX_INTERET}%):</span>
                      <span className="font-medium">{Math.ceil(formData.montant * TAUX_INTERET / 100)}$</span>
                    </div>
                    <div className="flex justify-between text-lg border-t pt-2 mt-2">
                      <span className="font-semibold text-gray-900">Total à rembourser:</span>
                      <span className="font-bold text-primary-600">
                        {Number(formData.montant) + Math.ceil(formData.montant * TAUX_INTERET / 100)}$
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Échéance:</span>
                      <span>Prochaine réunion (1 mois)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <p className="font-medium">⚠️ Pénalités de retard</p>
                <p>En cas de non-remboursement à l'échéance: <strong>{PENALITE_RETARD}$</strong> tous les 7 jours de retard.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la demande</label>
                <textarea
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3}
                  placeholder="Expliquez la raison de votre demande..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || (fondsCaisse && Number(formData.montant) > fondsCaisse.plafondPret)}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Soumettre la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal traiter prêt */}
      {showTraiterModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Traiter la demande</h2>
              <button onClick={() => setShowTraiterModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleTraiter} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedLoan.demandeur?.prenom} {selectedLoan.demandeur?.nom}</p>
                <p className="text-2xl font-bold text-gray-900">{selectedLoan.montant}$</p>
                <p className="text-gray-600">{selectedLoan.motif}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Décision</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTraiterData({ ...traiterData, statut: 'approuve' })}
                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                      traiterData.statut === 'approuve' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200'
                    }`}
                  >
                    <Check className="h-5 w-5" />
                    Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => setTraiterData({ ...traiterData, statut: 'refuse' })}
                    className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                      traiterData.statut === 'refuse' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200'
                    }`}
                  >
                    <XCircle className="h-5 w-5" />
                    Refuser
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  value={traiterData.commentaire}
                  onChange={(e) => setTraiterData({ ...traiterData, commentaire: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={2}
                  placeholder="Commentaire optionnel..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTraiterModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg disabled:opacity-50 ${
                    traiterData.statut === 'approuve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal remboursement */}
      {showRemboursementModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Enregistrer un remboursement</h2>
              <button onClick={() => setShowRemboursementModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleRemboursement} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedLoan.demandeur?.prenom} {selectedLoan.demandeur?.nom}</p>
                <p className="text-gray-600">
                  Reste à payer: <span className="font-bold text-gray-900">{selectedLoan.montant - selectedLoan.montantRembourse}$</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant remboursé ($)</label>
                <input
                  type="number"
                  value={remboursementData.montant}
                  onChange={(e) => setRemboursementData({ ...remboursementData, montant: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  max={selectedLoan.montant - selectedLoan.montantRembourse}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <input
                  type="text"
                  value={remboursementData.commentaire}
                  onChange={(e) => setRemboursementData({ ...remboursementData, commentaire: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Paiement en espèces"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRemboursementModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
