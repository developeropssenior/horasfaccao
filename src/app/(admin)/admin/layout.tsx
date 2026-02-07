import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('auth_user_id', user.id)
    .single();

  if (usuario?.tipo !== 'admin') redirect('/funcionario');

  return <AdminLayout>{children}</AdminLayout>;
}
