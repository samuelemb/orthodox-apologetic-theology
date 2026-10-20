import "server-only";
import { createServerSupabaseClient } from "./server";
export class OwnerAuthorizationError extends Error {
  constructor(public readonly status: 401 | 403 | 503) { super("Owner authorization required."); this.name = "OwnerAuthorizationError"; }
}
/** Use at every future owner action/handler. Do not rely solely on a Proxy check. */
export async function requireOwner() {
  const client = await createServerSupabaseClient(); // Missing config throws; never authorizes.
  const { data, error } = await client.auth.getUser(); // Auth-server verification, not getSession or metadata.
  if (error || !data.user) throw new OwnerAuthorizationError(401);
  const { data: allowed, error: membershipError } = await client.rpc("is_owner");
  if (membershipError) throw new OwnerAuthorizationError(503);
  if (allowed !== true) throw new OwnerAuthorizationError(403);
  return { client, user: data.user }; // Request-scoped client uses the user's JWT and RLS.
}
