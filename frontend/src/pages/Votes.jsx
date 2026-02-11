import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Vote as VoteIcon, 
  Plus, 
  X, 
  Users,
  CheckCircle,
  Clock,
  Lock
} from 'lucide-react';

const Votes = () => {
  const { user } = useAuth();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    sujet: '',
    description: '',
    options: ['', '']
  });

  const isPresident = user?.role === 'president';

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const response = await api.get('/votes');
      setVotes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/votes', {
        ...formData,
        options: formData.options.filter(o => o.trim() !== '')
      });
      setShowModal(false);
      setFormData({ sujet: '', description: '', options: ['', ''] });
      fetchVotes();
    } catch (error) {
      console.error('Error creating vote:', error);
    }
  };

  const handleOpenVote = async (voteId) => {
    try {
      await api.put(`/votes/${voteId}/open`);
      fetchVotes();
    } catch (error) {
      console.error('Error opening vote:', error);
    }
  };

  const handleCloseVote = async (voteId) => {
    try {
      await api.put(`/votes/${voteId}/close`);
      fetchVotes();
    } catch (error) {
      console.error('Error closing vote:', error);
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { style: 'bg-gray-100 text-gray-700', icon: Clock, label: 'En attente' },
      ouvert: { style: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ouvert' },
      ferme: { style: 'bg-red-100 text-red-700', icon: Lock, label: 'Fermé' }
    };
    const { style, icon: Icon, label } = config[statut] || config.en_attente;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${style}`}>
        <Icon className="h-3 w-3" />
        {label}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Votes</h1>
          <p className="text-gray-500">Participez aux scrutins de l'organisation</p>
        </div>
        {isPresident && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Nouveau vote
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {votes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <VoteIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun vote disponible</p>
          </div>
        ) : (
          votes.map((vote) => (
            <div
              key={vote._id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{vote.sujet}</h3>
                    {getStatusBadge(vote.statut)}
                  </div>
                  {vote.description && (
                    <p className="text-gray-500 mt-1">{vote.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <VoteIcon className="h-4 w-4" />
                      {vote.options?.length} options
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {vote.votants?.length || 0} vote(s)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isPresident && vote.statut === 'en_attente' && (
                    <button
                      onClick={() => handleOpenVote(vote._id)}
                      className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Ouvrir
                    </button>
                  )}
                  {isPresident && vote.statut === 'ouvert' && (
                    <button
                      onClick={() => handleCloseVote(vote._id)}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Fermer
                    </button>
                  )}
                  <Link
                    to={`/votes/${vote._id}`}
                    className="px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                  >
                    {vote.statut === 'ouvert' ? 'Voter' : 'Voir résultats'}
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Nouveau vote</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input
                  type="text"
                  value={formData.sujet}
                  onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  + Ajouter une option
                </button>
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

export default Votes;
