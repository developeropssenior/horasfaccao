import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (usuario?.tipo === 'admin') {
    redirect('/admin');
  }

  redirect('/funcionario');
}
