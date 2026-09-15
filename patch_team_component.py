import re

with open('src/pages/Team.tsx', 'r') as f:
    content = f.read()

imports = """import { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';
import { Users, Shield, User, Mail, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useTeamUsersQuery } from '../hooks/useQueries';"""

content = re.sub(r'import \{ useEffect, useState \} from \'react\';\nimport \{ useUserStore \} from \'../store/userStore\';\nimport \{ useAuthStore \} from \'../store/authStore\';\nimport \{ Role \} from \'../types\';\nimport \{ Users, Shield, User, Mail, Search \} from \'lucide-react\';\nimport \{ format \} from \'date-fns\';', imports, content)

new_body = """export default function Team() {
  const { profile } = useAuthStore();
  const { updateUserRole } = useUserStore();
  const { data: users = [], isLoading: loadingUsers, refetch } = useTeamUsersQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  const handleRoleChange = async (uid: string, newRole: Role) => {
    if (!isAdmin) return;
    try {
      setUpdatingUserId(uid);
      await updateUserRole(uid, newRole);
      refetch();
    } catch (error) {
"""

content = re.sub(r'export default function Team\(\) \{\n  const \{ profile \} = useAuthStore\(\);\n  const \{ users, loadingUsers, fetchUsers, updateUserRole \} = useUserStore\(\);\n  const \[searchTerm, setSearchTerm\] = useState\(\'\'\);\n  const \[updatingUserId, setUpdatingUserId\] = useState<string \| null>\(null\);\n\n  useEffect\(\(\) => \{\n    fetchUsers\(\);\n  \}, \[fetchUsers\]\);\n\n  const isAdmin = profile\?\.role === \'admin\';\n\n  const handleRoleChange = async \(uid: string, newRole: Role\) => \{\n    if \(\!isAdmin\) return;\n    try \{\n      setUpdatingUserId\(uid\);\n      await updateUserRole\(uid, newRole\);\n    \} catch \(error\) \{', new_body, content)

with open('src/pages/Team.tsx', 'w') as f:
    f.write(content)
