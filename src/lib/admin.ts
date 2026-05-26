/**
 * Personal-use admin shim.
 *
 * The SaaS version had an admin tier with credit-refund powers. Personal
 * version is single-user-admin by definition; isAdminEmail is always true.
 * Kept as a function for caller compatibility.
 */
export function isAdminEmail(_email: string | null | undefined): boolean {
  return true;
}
