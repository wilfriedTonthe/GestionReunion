import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users as UsersIcon, 
  Search,
  X,
  Shield,
  UserX,
  UserPlus,
  Eye,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'membre',
    telephone: '',
    password: ''
  });
  const [selectedRole, setSelectedRole] = useState('membre');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const handleOpenRoleModal = (member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setShowRoleModal(true);
  };

  const handleChangeRole = async () => {
    try {
      await api.put(`/users/${selectedMember._id}`, { role: selectedRole });
      setShowRoleModal(false);
      setSelectedMember(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de rôle');
    }
  };

  const handleToggleBlock = async (member) => {
    const action = member.actif ? 'bloquer' : 'débloquer';
    if (window.confirm(`Êtes-vous sûr de vouloir ${action} ${member.prenom} ${member.nom} ?`)) {
      try {
        await api.put(`/users/${member._id}`, { actif: !member.actif });
        fetchUsers();
      } catch (error) {
        console.error('Error toggling user status:', error);
      }
    }
  };

  const handleDeleteMember = async (member) => {
    if (window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER définitivement ${member.prenom} ${member.nom} ? Cette action est irréversible.`)) {
      try {
        await api.delete(`/users/${member._id}/permanent`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', formData);
      setShowModal(false);
      setFormData({ nom: '', prenom: '', email: '', role: 'membre', telephone: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  const handleAddMember = () => {
    setFormData({ nom: '', prenom: '', email: '', role: 'membre', telephone: '', password: '' });
    setError('');
    setShowModal(true);
  };

  const handleDeactivate = async (userId, userName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le compte de ${userName} ?`)) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deactivating user:', error);
      }
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      president: 'bg-purple-100 text-purple-700',
      tresorier: 'bg-green-100 text-green-700',
      censeur: 'bg-orange-100 text-orange-700',
      membre: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      president: 'Président',
      tresorier: 'Trésorier',
      censeur: 'Censeur',
      membre: 'Membre'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const filteredUsers = users.filter(u =>
    `${u.prenom} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-gray-500">Gérez les membres de l'organisation</p>
        </div>
        {user?.role === 'president' && (
          <button
            onClick={handleAddMember}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <UserPlus className="h-5 w-5" />
            Ajouter un membre
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un membre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Membre</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  {user?.role === 'president' && (
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {member.prenom?.[0]}{member.nom?.[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {member.prenom} {member.nom}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{member.email}</td>
                    <td className="px-6 py-4 text-gray-500">{member.telephone || '-'}</td>
                    <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                    {user?.role === 'president' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Voir les informations"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {member._id !== user._id && (
                            <>
                              <button
                                onClick={() => handleOpenRoleModal(member)}
                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Changer le rôle"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleBlock(member)}
                                className={`p-2 rounded-lg ${member.actif ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'}`}
                                title={member.actif ? 'Bloquer' : 'Débloquer'}
                              >
                                {member.actif ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ajouter un membre */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Ajouter un membre</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="membre">Membre</option>
                  <option value="censeur">Censeur</option>
                  <option value="tresorier">Trésorier</option>
                  <option value="president">Président</option>
                </select>
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
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Voir les informations */}
      {showViewModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Informations du membre</h2>
              <button onClick={() => setShowViewModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-xl">
                    {selectedMember.prenom?.[0]}{selectedMember.nom?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedMember.prenom} {selectedMember.nom}
                  </h3>
                  {getRoleBadge(selectedMember.role)}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{selectedMember.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Téléphone</span>
                  <span className="font-medium">{selectedMember.telephone || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Statut</span>
                  <span className={`font-medium ${selectedMember.actif ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMember.actif ? 'Actif' : 'Bloqué'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Inscrit le</span>
                  <span className="font-medium">
                    {new Date(selectedMember.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changer le rôle */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Changer le rôle</h2>
              <button onClick={() => setShowRoleModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Modifier le rôle de <strong>{selectedMember.prenom} {selectedMember.nom}</strong>
              </p>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="membre">Membre</option>
                <option value="censeur">Censeur</option>
                <option value="tresorier">Trésorier</option>
                <option value="president">Président</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleChangeRole}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
