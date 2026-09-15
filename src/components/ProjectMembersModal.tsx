import { useState, useEffect } from 'react';
import { Project } from '../types';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { X, Users, Check, Search } from 'lucide-react';

interface ProjectMembersModalProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectMembersModal({ project, onClose }: ProjectMembersModalProps) {
  const profile = useAuthStore(state => state.profile);
  const { updateProject } = useProjectStore();
  const { users, fetchUsers, loadingUsers } = useUserStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<string[]>(project.members || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMembers(project.members || []);
  }, [project.members]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const canManageMembers = profile?.role === 'admin' || profile?.role === 'project_coordinator';

  const isUserMember = (user: { uid: string; email?: string }) => {
    const userEmail = (user.email || '').trim().toLowerCase();
    return members.some(m => {
      const cleanM = String(m).trim().toLowerCase();
      return m === user.uid || (userEmail && cleanM === userEmail);
    });
  };

  const handleToggleMember = (userId: string, userEmail?: string) => {
    if (!canManageMembers) return;
    
    const emailClean = (userEmail || '').trim().toLowerCase();
    const isCurrentlyMember = members.some(m => {
      const cleanM = String(m).trim().toLowerCase();
      return m === userId || (emailClean && cleanM === emailClean);
    });

    if (isCurrentlyMember) {
      setMembers(members.filter(id => {
        const cleanId = String(id).trim().toLowerCase();
        return id !== userId && (!emailClean || cleanId !== emailClean);
      }));
    } else {
      setMembers([...members, userId]);
    }
  };

  const handleSave = async () => {
    if (!canManageMembers) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await updateProject(project.id, { members });
      onClose();
    } catch (error: any) {
      console.error("Failed to update members:", error);
      setErrorMsg(`Gagal memperbarui anggota: ${error.message || 'Periksa hak akses Anda'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && onClose()}></div>
      <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5 text-teal-600" />
              Project Members
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-6 py-4">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex justify-between items-center">
                <span>{errorMsg}</span>
                <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {canManageMembers && (
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users to add..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            )}
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
              {loadingUsers ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No users found</div>
              ) : (
                filteredUsers.map(user => {
                  const isMember = isUserMember(user);
                  return (
                    <div 
                      key={user.uid} 
                      className={`flex items-center justify-between p-3 transition-colors ${canManageMembers ? 'cursor-pointer hover:bg-teal-50/50' : ''} ${isMember ? 'bg-teal-50/30' : ''}`}
                      onClick={() => handleToggleMember(user.uid, user.email)}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors ${isMember ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'}`}>
                          {isMember && <Check className="w-3.5 h-3.5" />}
                        </div>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                            {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.displayName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div>
                        {isMember && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                            Terpilih
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
            
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            {canManageMembers && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Members'}
              </button>
            )}
          </div>
        </div>
      </div>
  );
}
