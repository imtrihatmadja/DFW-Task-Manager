import re
with open('src/hooks/useQueries.ts', 'r') as f:
    content = f.read()

new_query = """
export function useTeamUsersQuery() {
  const { profile } = useAuthStore();
  
  return useQuery({
    queryKey: ['teamUsers'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const users: any[] = [];
      snapshot.forEach(doc => {
        users.push({ uid: doc.id, ...doc.data() });
      });
      return users;
    },
    enabled: !!profile?.uid,
    staleTime: 5 * 60 * 1000,
  });
}
"""

with open('src/hooks/useQueries.ts', 'w') as f:
    f.write(content + new_query)

