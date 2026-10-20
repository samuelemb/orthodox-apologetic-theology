import { FeedbackInbox } from '@/components/admin/feedback-inbox';
import { requireOwner } from '@/lib/supabase/owner';
import { redirect } from 'next/navigation';
export default async function Page() { try { await requireOwner(); } catch { redirect('/admin/login'); } return <FeedbackInbox />; }
