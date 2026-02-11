import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Vote, 
  Clock, 
  MapPin,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Cake,
  Gift
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingMeetings: [],
    myFines: { total: 0, pending: 0 },
    activeVotes: [],
    fineStats: null,
    upcomingBirthdays: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [meetingsRes, finesRes, votesRes, birthdaysRes] = await Promise.all([
        api.get('/meetings/upcoming'),
        api.get('/fines/my'),
        api.get('/votes/active'),
        api.get('/users/birthdays/upcoming')
      ]);

      let fineStats = null;
      if (['president', 'tresorier'].includes(user?.role)) {
        const statsRes = await api.get('/fines/stats');
        fineStats = statsRes.data.data;
      }

      setStats({
        upcomingMeetings: meetingsRes.data.data || [],
        myFines: {
          total: finesRes.data.count || 0,
          pending: finesRes.data.totalEnAttente || 0
        },
        activeVotes: votesRes.data.data || [],
        fineStats,
        upcomingBirthdays: birthdaysRes.data.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    president: 'Président',
    tresorier: 'Trésorier',
    censeur: 'Censeur',
    membre: 'Membre'
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.prenom} !
          </h1>
          <p className="text-gray-500">{roleLabels[user?.role]} • Tableau de bord</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Réunions à venir</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingMeetings.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mes amendes en attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myFines.pending.toLocaleString()} $</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Votes actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeVotes.length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Vote className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total amendes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myFines.total}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Prochaines réunions</h2>
          </div>
          <div className="p-6">
            {stats.upcomingMeetings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune réunion planifiée</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingMeetings.slice(0, 3).map((meeting) => (
                  <Link
                    key={meeting._id}
                    to={`/meetings/${meeting._id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{meeting.titre}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(meeting.date).toLocaleDateString('fr-FR')} à {meeting.heureDebut}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {meeting.lieu?.nom}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        meeting.statut === 'en_cours' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {meeting.statut === 'en_cours' ? 'En cours' : 'Planifiée'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Votes en cours</h2>
          </div>
          <div className="p-6">
            {stats.activeVotes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun vote actif</p>
            ) : (
              <div className="space-y-4">
                {stats.activeVotes.slice(0, 3).map((vote) => (
                  <Link
                    key={vote._id}
                    to={`/votes/${vote._id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{vote.sujet}</h3>
                    <p className="text-sm text-gray-500 mt-1">{vote.options?.length} options • {vote.votants?.length} votes</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Cake className="h-5 w-5 text-pink-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Anniversaires à venir</h2>
        </div>
        <div className="p-6">
          {stats.upcomingBirthdays.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun anniversaire dans les 30 prochains jours</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.upcomingBirthdays.map((birthday) => (
                <div
                  key={birthday._id}
                  className={`p-4 rounded-lg border-2 ${
                    birthday.daysUntil === 0 
                      ? 'bg-pink-50 border-pink-300' 
                      : birthday.daysUntil <= 7 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {birthday.photo ? (
                      <img src={birthday.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-semibold">
                          {birthday.prenom?.[0]}{birthday.nom?.[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {birthday.prenom} {birthday.nom}
                        {birthday.isCurrentUser && <span className="ml-2 text-xs text-pink-600">(Vous)</span>}
                      </p>
                      <p className="text-sm text-gray-500">
                        {birthday.jour}/{birthday.mois}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Gift className={`h-4 w-4 ${
                      birthday.daysUntil === 0 ? 'text-pink-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      birthday.daysUntil === 0 
                        ? 'text-pink-600' 
                        : birthday.daysUntil <= 7 
                          ? 'text-orange-600' 
                          : 'text-gray-500'
                    }`}>
                      {birthday.daysUntil === 0 
                        ? "🎉 C'est aujourd'hui !" 
                        : birthday.daysUntil === 1 
                          ? 'Demain' 
                          : `Dans ${birthday.daysUntil} jours`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.fineStats && ['president', 'tresorier'].includes(user?.role) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amendes par statut</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.fineStats.parStatut?.map(s => ({
                      name: s._id === 'en_attente' ? 'En attente' : s._id === 'payee' ? 'Payée' : 'Annulée',
                      value: s.total
                    })) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.fineStats.parStatut?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString()} $`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amendes par motif</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.fineStats.parMotif?.map(m => ({
                  name: m._id === 'retard' ? 'Retard' : m._id === 'absence' ? 'Absence' : 'Autre',
                  montant: m.total
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} $`} />
                  <Bar dataKey="montant" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
