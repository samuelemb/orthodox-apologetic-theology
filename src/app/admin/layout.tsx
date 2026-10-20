import { AdminHeader } from '@/components/admin/admin-header';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Owner administration', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="admin-shell"><AdminHeader />{children}</div>; }
