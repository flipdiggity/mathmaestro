import { isSaas } from './mode';

/**
 * Admin check. In personal mode there is exactly one user (the parent), who
 * is admin by definition. In saas mode, admins are the comma-separated
 * ADMIN_EMAILS env var — they bypass billing and see the admin panel.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!isSaas) return true;
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? '';
  if (!raw) return false;
  const adminEmails = raw.split(',').map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
