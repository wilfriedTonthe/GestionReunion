import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Users,
  X,
  Search,
  Loader2
} from 'lucide-react';

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [formData, setFormData] = useState({
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

  const geocodeAddress = async (address) => {
    if (!address || address.length < 5) return;
    
    setGeocoding(true);
    setGeocodeError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'fr'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setFormData(prev => ({
          ...prev,
          lieu: {
            ...prev.lieu,
            nom: prev.lieu.nom || display_name.split(',')[0],
            coordinates: {
              latitude: lat,
              longitude: lon
            }
          }
        }));
      } else {
        setGeocodeError('Adresse non trouvée. Vérifiez l\'orthographe.');
      }
    } catch (error) {
      setGeocodeError('Erreur lors de la recherche de l\'adresse');
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dateWithTime = `${formData.date}T12:00:00`;
      await api.post('/meetings', {
        ...formData,
        date: dateWithTime,
        lieu: {
          ...formData.lieu,
          coordinates: {
            latitude: parseFloat(formData.lieu.coordinates.latitude),
            longitude: parseFloat(formData.lieu.coordinates.longitude)
          }
        }
      });
      setShowModal(false);
      setFormData({
        titre: '',
        description: '',
        date: '',
        heureDebut: '',
        heureFin: '',
        lieu: { nom: '', adresse: '', coordinates: { latitude: '', longitude: '' } }
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  const filteredMeetings = meetings.filter(m => 
    m.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.lieu?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Réunions</h1>
          <p className="text-gray-500">Gérez les réunions de l'organisation</p>
        </div>
        {user?.role === 'president' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvelle réunion
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une réunion..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      <div className="grid gap-4">
        {filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune réunion trouvée</p>
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <Link
              key={meeting._id}
              to={`/meetings/${meeting._id}`}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.titre}</h3>
                    {getStatusBadge(meeting.statut)}
                  </div>
                  {meeting.description && (
                    <p className="text-gray-500 mt-1 line-clamp-2">{meeting.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(meeting.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} à {meeting.heureDebut}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {meeting.lieu?.nom}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {meeting.presences?.length || 0} présent(s)
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Nouvelle réunion</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={formData.heureDebut}
                    onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lieu</label>
                <input
                  type="text"
                  value={formData.lieu.nom}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    lieu: { ...formData.lieu, nom: e.target.value } 
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Salle des Fêtes"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.lieu.adresse}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      lieu: { ...formData.lieu, adresse: e.target.value } 
                    })}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Ex: 123 Rue Principale, Douala, Cameroun"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => geocodeAddress(formData.lieu.adresse)}
                    disabled={geocoding || !formData.lieu.adresse}
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
                    value={formData.lieu.coordinates.latitude}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      lieu: { 
                        ...formData.lieu, 
                        coordinates: { ...formData.lieu.coordinates, latitude: e.target.value } 
                      } 
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50"
                    placeholder="Rempli automatiquement"
                    required
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lieu.coordinates.longitude}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      lieu: { 
                        ...formData.lieu, 
                        coordinates: { ...formData.lieu.coordinates, longitude: e.target.value } 
                      } 
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50"
                    placeholder="Rempli automatiquement"
                    required
                    readOnly
                  />
                </div>
              </div>
              {formData.lieu.coordinates.latitude && formData.lieu.coordinates.longitude && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ Coordonnées trouvées : {formData.lieu.coordinates.latitude}, {formData.lieu.coordinates.longitude}
                </div>
              )}
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

export default Meetings;
