import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';
import { 
  Users, 
  Shield, 
  User, 
  Mail, 
  Search, 
  X, 
  UserPlus, 
  RefreshCw, 
  CheckCircle2, 
  Briefcase,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { useTeamUsersQuery } from '../hooks/useQueries';

export default function Team() {
  const { profile } = useAuthStore();
  const { updateUserRole, addUser, fetchUsers } = useUserStore();
  const { data: users = [], isLoading: loadingUsers, refetch, isFetching } = useTeamUsersQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('field_officer');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const handleManualRefresh = async () => {
    setErrorMsg(null);
    try {
      await fetchUsers();
      await refetch();
      setSuccessMsg("Direktori tim berhasil disinkronkan.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg("Gagal menyinkronkan data tim.");
    }
  };

  const handleRoleChange = async (uid: string, newRole: Role) => {
    if (!isAdmin) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setUpdatingUserId(uid);
      await updateUserRole(uid, newRole);
      refetch();
      setSuccessMsg("Peran pengguna berhasil diperbarui.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (error: any) {
      console.error("Failed to update role", error);
      setErrorMsg(`Gagal memperbarui peran: ${error?.message || 'Silakan coba lagi'}.`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setErrorMsg("Alamat email wajib diisi.");
      return;
    }

    setIsSubmittingNewUser(true);
    setErrorMsg(null);

    try {
      await addUser({
        email: newEmail.trim(),
        displayName: newDisplayName.trim() || newEmail.trim().split('@')[0],
        role: newRole
      });
      await refetch();
      setIsAddModalOpen(false);
      setNewDisplayName('');
      setNewEmail('');
      setNewRole('field_officer');
      setSuccessMsg(`Anggota tim ${newEmail.trim()} berhasil ditambahkan!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(`Gagal menambahkan anggota: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Stats calculation
  const totalCount = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const coordinatorCount = users.filter(u => u.role === 'project_coordinator').length;
  const officerCount = users.filter(u => u.role === 'field_officer').length;

  return (
    <div className="flex-1 bg-gray-50 flex flex-col min-h-full">
      {/* Top Page Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 mr-3.5 shrink-0 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Direktori Tim & Hak Akses
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola daftar anggota tim Monev DFW, staf lapangan, dan penetapan peran (role).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isFetching}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              title="Sinkronkan data dari Firestore"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin text-teal-600' : 'text-gray-500'}`} />
              {isFetching ? 'Menyinkronkan...' : 'Sinkronkan'}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Anggota
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Role Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-xs flex items-start">
            <div className="p-3 rounded-lg bg-teal-50 text-teal-600 mr-3.5 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Anggota</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Staf & mitra aktif</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-xs flex items-start">
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 mr-3.5 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Administrator</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{adminCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Akses penuh sistem</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-xs flex items-start">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-3.5 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Coordinator</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{coordinatorCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Monev & program</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-xs flex items-start">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 mr-3.5 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Field Officer</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{officerCount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Pelaksana lapangan</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between items-center shadow-xs">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 text-teal-800 text-sm rounded-lg flex justify-between items-center shadow-xs">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-teal-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-teal-600 hover:text-teal-800 font-bold ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Team Directory Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs leading-5 bg-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Cari anggota berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">
            Menampilkan {filteredUsers.length} dari {users.length} akun
          </span>
        </div>

        {loadingUsers ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-700 text-sm">Tidak ada anggota yang cocok dengan pencarian.</p>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau gunakan tombol "Tambah Anggota".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Anggota / Nama
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Peran (Role)
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Terdaftar Sejak
                  </th>
                  {isAdmin && (
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Ubah Hak Akses
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const isCurrent = user.uid === profile?.uid || user.email === profile?.email;
                  return (
                    <tr key={user.uid} className={`hover:bg-gray-50/80 transition-colors ${isCurrent ? 'bg-teal-50/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold overflow-hidden text-sm">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" />
                            ) : (
                              user.displayName?.charAt(0).toUpperCase() || <User className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-3.5">
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{user.displayName || 'Pengguna DFW'}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-1.5 py-0.2 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          user.role === 'project_coordinator' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <Briefcase className="w-3 h-3 mr-1" />}
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {!isCurrent ? (
                            <select
                              disabled={updatingUserId === user.uid}
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.uid, e.target.value as Role)}
                              aria-label={`Ubah peran untuk ${user.displayName || user.email}`}
                              className="block w-44 pl-2.5 pr-8 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-700 disabled:opacity-50"
                            >
                              <option value="field_officer">Field Officer</option>
                              <option value="project_coordinator">Project Coordinator</option>
                              <option value="admin">Administrator</option>
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Akun aktif Anda</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 to-white">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-gray-900">Tambah Anggota Tim Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Imam Trihatmadja"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alamat Email (Akun Google / Resmi)
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: imam.trihatmadja@dfw.or.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Pastikan email sesuai dengan akun Google yang digunakan saat login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Peran / Hak Akses (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="field_officer">Field Officer (Petugas Lapangan & Pelaksana Tugas)</option>
                  <option value="project_coordinator">Project Coordinator (Koordinator & Pengelola Program)</option>
                  <option value="admin">Administrator (Hak Akses Penuh Sistem & Tim)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewUser}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmittingNewUser ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
