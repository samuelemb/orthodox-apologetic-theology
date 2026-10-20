"use server";
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/supabase/owner';
import { safeAdminRedirect } from '@/lib/admin-redirect';
export type LoginState = { error: boolean };
export async function signIn(_previous: LoginState, form: FormData): Promise<LoginState> {
  const email = form.get('email'), password = form.get('password');
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 1024) return { error: true };
  try {
    const client = await createServerSupabaseClient();
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: true };
    try { await requireOwner(); }
    catch { await client.auth.signOut({ scope: 'local' }); return { error: true }; }
  } catch { return { error: true }; }
  redirect(safeAdminRedirect(form.get('next')));
}
export async function signOut(): Promise<void> {
  // Authorization is checked even for this protected action. A revoked session
  // is still cleared so the visitor can leave safely.
  try { await requireOwner(); } catch { /* No privileged operation follows. */ }
  const client = await createServerSupabaseClient();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw new Error('Sign-out unavailable. Please try again.');
  redirect('/admin/login');
}
