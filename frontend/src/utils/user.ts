export function getUserDisplayLabel(user: {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
} | null): string {
  if (!user) return '';
  return user.displayName || user.email || user.phone || '';
}
