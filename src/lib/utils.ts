export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails in restricted sandbox
    }
  }
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};
