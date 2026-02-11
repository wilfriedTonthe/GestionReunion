import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Vote as VoteIcon, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';

const VoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vote, setVote] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchVote();
    fetchResults();
  }, [id]);

  const fetchVote = async () => {
    try {
      const response = await api.get(`/votes/${id}`);
      setVote(response.data.data);
      setHasVoted(response.data.aVote);
    } catch (error) {
      console.error('Error fetching vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await api.get(`/votes/${id}/results`);
      setResults(response.data.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null) return;
    
    setVoting(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post(`/votes/${id}/cast`, { optionIndex: selectedOption });
      setMessage({ type: 'success', text: 'Vote enregistré avec succès !' });
      setHasVoted(true);
      fetchVote();
      fetchResults();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors du vote' });
    } finally {
      setVoting(false);
    }
  };

  const getStatusLabel = (statut) => {
    const labels = {
      en_attente: 'En attente',
      ouvert: 'Ouvert',
      ferme: 'Fermé'
    };
    return labels[statut] || statut;
  };

  const getStatusStyle = (statut) => {
    const styles = {
      en_attente: 'bg-gray-100 text-gray-700',
      ouvert: 'bg-green-100 text-green-700',
      ferme: 'bg-red-100 text-red-700'
    };
    return styles[statut] || styles.en_attente;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!vote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vote non trouvé</p>
      </div>
    );
  }

  const canVote = vote.statut === 'ouvert' && !hasVoted;
  const showResults = vote.statut === 'ferme' || hasVoted;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/votes')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour aux votes
      </button>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
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
                <h1 className="text-2xl font-bold text-gray-900">{vote.sujet}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusStyle(vote.statut)}`}>
                  {getStatusLabel(vote.statut)}
                </span>
              </div>
              {vote.description && (
                <p className="text-gray-500 mt-2">{vote.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {results?.totalVotants || 0} participant(s)
            </span>
          </div>
        </div>

        <div className="p-6">
          {canVote ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Faites votre choix</h2>
              <div className="space-y-3">
                {vote.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      selectedOption === index
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selectedOption === index
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedOption === index && (
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{option.texte}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleVote}
                disabled={selectedOption === null || voting}
                className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voting ? 'Envoi en cours...' : 'Confirmer mon vote'}
              </button>
            </div>
          ) : showResults ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Résultats</h2>
              {hasVoted && vote.statut === 'ouvert' && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Vous avez déjà voté
                </p>
              )}
              <div className="space-y-4">
                {results?.resultats?.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{result.option}</span>
                      <span className="text-sm text-gray-500">
                        {result.votes} vote(s) ({result.pourcentage}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${result.pourcentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <VoteIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Le vote n'est pas encore ouvert</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoteDetail;
