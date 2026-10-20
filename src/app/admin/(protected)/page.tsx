import { AdminOverview } from '@/components/admin/admin-workspace';
import { requireOwner } from '@/lib/supabase/owner';
import { redirect } from 'next/navigation';
export default async function Page() { try { await requireOwner(); } catch { redirect('/admin/login'); } return <AdminOverview  />; }
