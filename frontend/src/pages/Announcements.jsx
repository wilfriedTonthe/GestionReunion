import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Megaphone, 
  Plus, 
  X, 
  Trash2,
  Info,
  AlertTriangle,
  Bell,
  PartyPopper,
  Send,
  Mail
} from 'lucide-react';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    type: 'info',
    envoyerEmail: false
  });
  const [submitting, setSubmitting] = useState(false);

  const canManage = ['president', 'censeur', 'tresorier'].includes(user?.role);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/announcements', formData);
      setShowModal(false);
      setFormData({ titre: '', contenu: '', type: 'info', envoyerEmail: false });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce communiqué ?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const typeConfig = {
    info: { icon: Info, color: 'blue', label: 'Information' },
    urgent: { icon: AlertTriangle, color: 'red', label: 'Urgent' },
    rappel: { icon: Bell, color: 'yellow', label: 'Rappel' },
    evenement: { icon: PartyPopper, color: 'green', label: 'Événement' }
  };

  const roleLabels = {
    president: 'Président',
    tresorier: 'Trésorier',
    censeur: 'Censeur',
    membre: 'Membre'
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Communiqués</h1>
          <p className="text-gray-500">Annonces et informations importantes</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Nouveau communiqué
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun communiqué pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const config = typeConfig[announcement.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <div
                key={announcement._id}
                className={`bg-white rounded-xl shadow-sm border-l-4 border-${config.color}-500 p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 bg-${config.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 text-${config.color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium bg-${config.color}-100 text-${config.color}-700 rounded-full`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(announcement.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.titre}</h3>
                      <p className="text-gray-600 mt-2 whitespace-pre-wrap">{announcement.contenu}</p>
                      <p className="text-sm text-gray-400 mt-3">
                        Par {announcement.creePar?.prenom} {announcement.creePar?.nom} ({roleLabels[announcement.creePar?.role]})
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Nouveau communiqué</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(typeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: key })}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                          formData.type === key
                            ? `border-${config.color}-500 bg-${config.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 text-${config.color}-600`} />
                        <span className="text-xs">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Titre du communiqué"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={5}
                  placeholder="Contenu du communiqué..."
                  required
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="envoyerEmail"
                  checked={formData.envoyerEmail}
                  onChange={(e) => setFormData({ ...formData, envoyerEmail: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="envoyerEmail" className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4" />
                  Envoyer par email à tous les membres
                </label>
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
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  {submitting ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
