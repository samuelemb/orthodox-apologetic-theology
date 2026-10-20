import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/supabase/owner';
import { AdminWorkspace } from '@/components/admin/admin-workspace';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
 try { await requireOwner(); } catch { redirect('/admin/login'); }
 return <AdminWorkspace>{children}</AdminWorkspace>;
}
