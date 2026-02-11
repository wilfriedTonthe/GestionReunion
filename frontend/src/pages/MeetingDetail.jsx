import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Play, 
  Square,
  MapPinned,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Edit,
  X,
  Loader2,
  Mail
} from 'lucide-react';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [editForm, setEditForm] = useState({
    titre: '',
    description: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    lieu: {
      nom: '',
      adresse: '',
      coordinates: { latitude: '', longitude: '' }
    }
  });

  useEffect(() => {
    fetchMeeting();
    fetchAttendanceStatus();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const response = await api.get(`/meetings/${id}`);
      setMeeting(response.data.data);
    } catch (error) {
      console.error('Error fetching meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const response = await api.get(`/attendance/${id}/status`);
      setAttendanceStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const openEditModal = () => {
    if (meeting) {
      setEditForm({
        titre: meeting.titre || '',
        description: meeting.description || '',
        date: meeting.date ? meeting.date.split('T')[0] : '',
        heureDebut: meeting.heureDebut || '',
        heureFin: meeting.heureFin || '',
        lieu: {
          nom: meeting.lieu?.nom || '',
          adresse: meeting.lieu?.adresse || '',
          coordinates: {
            latitude: meeting.lieu?.coordinates?.latitude || '',
            longitude: meeting.lieu?.coordinates?.longitude || ''
          }
        }
      });
      setShowEditModal(true);
      setGeocodeError('');
    }
  };

  const geocodeAddress = async (address) => {
    if (!address || address.length < 5) return;
    
    setGeocoding(true);
    setGeocodeError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setEditForm(prev => ({
          ...prev,
          lieu: {
            ...prev.lieu,
            nom: prev.lieu.nom || display_name.split(',')[0],
            coordinates: { latitude: lat, longitude: lon }
          }
        }));
      } else {
        setGeocodeError('Adresse non trouvée');
      }
    } catch (error) {
      setGeocodeError('Erreur de géocodage');
    } finally {
      setGeocoding(false);
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    try {
      const dateWithTime = `${editForm.date}T12:00:00`;
      await api.put(`/meetings/${id}`, {
        ...editForm,
        date: dateWithTime,
        lieu: {
          ...editForm.lieu,
          coordinates: {
            latitude: parseFloat(editForm.lieu.coordinates.latitude),
            longitude: parseFloat(editForm.lieu.coordinates.longitude)
          }
        }
      });
      setShowEditModal(false);
      setMessage({ type: 'success', text: 'Réunion modifiée avec succès' });
      fetchMeeting();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur de modification' });
    }
  };

  const handleSendReminder = async () => {
    try {
      const response = await api.post(`/meetings/${id}/send-reminder`);
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'envoi du rappel' });
    }
  };

  const handleStartMeeting = async () => {
    try {
      await api.put(`/meetings/${id}/start`);
      setMessage({ type: 'success', text: 'Réunion démarrée avec succès' });
      fetchMeeting();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' });
    }
  };

  const handleEndMeeting = async () => {
    try {
      const response = await api.put(`/meetings/${id}/end`);
      setMessage({ type: 'success', text: response.data.message });
      fetchMeeting();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur' });
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setMessage({ type: '', text: '' });

    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'La géolocalisation n\'est pas supportée' });
      setCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await api.post(`/attendance/${id}/checkin`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setMessage({ 
            type: response.data.enRetard ? 'warning' : 'success', 
            text: response.data.message 
          });
          fetchAttendanceStatus();
          fetchMeeting();
        } catch (error) {
          setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur de pointage' });
        } finally {
          setCheckingIn(false);
        }
      },
      (error) => {
        setMessage({ type: 'error', text: 'Impossible d\'obtenir votre position GPS' });
        setCheckingIn(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const getStatusBadge = (statut) => {
    const styles = {
      planifiee: 'bg-blue-100 text-blue-700',
      en_cours: 'bg-green-100 text-green-700',
      terminee: 'bg-gray-100 text-gray-700',
      annulee: 'bg-red-100 text-red-700'
    };
    const labels = {
      planifiee: 'Planifiée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée'
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Réunion non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/meetings')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour aux réunions
      </button>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{meeting.titre}</h1>
                {getStatusBadge(meeting.statut)}
              </div>
              {meeting.description && (
                <p className="text-gray-500 mt-2">{meeting.description}</p>
              )}
            </div>
            {user?.role === 'president' && meeting.statut === 'planifiee' && (
              <div className="flex gap-2">
                <button
                  onClick={handleSendReminder}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  <Mail className="h-5 w-5" />
                  Envoyer rappel
                </button>
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Edit className="h-5 w-5" />
                  Modifier
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(meeting.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Heure</p>
              <p className="font-medium">{meeting.heureDebut} {meeting.heureFin && `- ${meeting.heureFin}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lieu</p>
              <p className="font-medium">{meeting.lieu?.nom}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex flex-wrap gap-3">
          {['president', 'censeur'].includes(user?.role) && meeting.statut === 'planifiee' && (
            <button
              onClick={handleStartMeeting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="h-5 w-5" />
              Démarrer la réunion
            </button>
          )}

          {['president', 'censeur'].includes(user?.role) && meeting.statut === 'en_cours' && (
            <button
              onClick={handleEndMeeting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Square className="h-5 w-5" />
              Terminer la réunion
            </button>
          )}

          {meeting.statut === 'en_cours' && !attendanceStatus?.aPointe && (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <MapPinned className="h-5 w-5" />
              {checkingIn ? 'Pointage en cours...' : 'Pointer ma présence'}
            </button>
          )}

          {attendanceStatus?.aPointe && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              Présence enregistrée
              {attendanceStatus.presence?.enRetard && ' (en retard)'}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste de présence ({meeting.presences?.length || 0})
          </h2>
        </div>
        <div className="p-6">
          {meeting.presences?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune présence enregistrée</p>
          ) : (
            <div className="space-y-3">
              {meeting.presences?.map((presence) => (
                <div
                  key={presence._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {presence.membre?.prenom?.[0]}{presence.membre?.nom?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {presence.membre?.prenom} {presence.membre?.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        Pointé à {new Date(presence.heurePointage).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {presence.enRetard && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                      En retard
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Modifier la réunion</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleUpdateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={editForm.titre}
                  onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={editForm.heureDebut}
                    onChange={(e) => setEditForm({ ...editForm, heureDebut: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                <input
                  type="time"
                  value={editForm.heureFin}
                  onChange={(e) => setEditForm({ ...editForm, heureFin: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lieu</label>
                <input
                  type="text"
                  value={editForm.lieu.nom}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    lieu: { ...editForm.lieu, nom: e.target.value } 
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editForm.lieu.adresse}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      lieu: { ...editForm.lieu, adresse: e.target.value } 
                    })}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Ex: 123 Rue Principale, Douala, Cameroun"
                  />
                  <button
                    type="button"
                    onClick={() => geocodeAddress(editForm.lieu.adresse)}
                    disabled={geocoding || !editForm.lieu.adresse}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {geocoding ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                    Localiser
                  </button>
                </div>
                {geocodeError && (
                  <p className="text-red-500 text-sm mt-1">{geocodeError}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.lieu.coordinates.latitude}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.lieu.coordinates.longitude}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                    readOnly
                  />
                </div>
              </div>
              {editForm.lieu.coordinates.latitude && editForm.lieu.coordinates.longitude && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ Coordonnées : {editForm.lieu.coordinates.latitude}, {editForm.lieu.coordinates.longitude}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;
