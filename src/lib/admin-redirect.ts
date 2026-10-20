/** Exact route allowlist: expand only when a protected destination exists. */
export function safeAdminRedirect(value: unknown): string {
  return typeof value === 'string' && ['/admin', '/admin/teachings', '/admin/feedback'].includes(value) ? value : '/admin';
}
