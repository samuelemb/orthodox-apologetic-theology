import { LoginForm } from '@/components/admin/login-form';
import { safeAdminRedirect } from '@/lib/admin-redirect';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const query = await searchParams; return <LoginForm next={safeAdminRedirect(query.next)} />; }
