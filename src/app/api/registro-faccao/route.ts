import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API para cadastro de facção - usa service role para bypass do RLS.
 * Evita problemas de timing de sessão após signUp no cliente.
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const body = await request.json();
  const { nomeFaccao, nomeAdmin, email, password } = body;
  if (!nomeFaccao || !nomeAdmin || !email || !password) {
    return NextResponse.json(
      { error: 'Nome da facção, nome do admin, email e senha são obrigatórios' },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'A senha deve ter pelo menos 6 caracteres' },
      { status: 400 }
    );
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }

    const { data: faccao, error: faccaoError } = await supabaseAdmin
      .from('faccoes')
      .insert({ nome: nomeFaccao })
      .select('id')
      .single();
    if (faccaoError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: faccaoError.message },
        { status: 400 }
      );
    }
    if (!faccao) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Erro ao criar facção' }, { status: 500 });
    }

    const { error: usuarioError } = await supabaseAdmin.from('usuarios').insert({
      faccao_id: faccao.id,
      auth_user_id: authData.user.id,
      nome: nomeAdmin,
      email,
      tipo: 'admin',
      valor_hora: 0,
      ativo: true,
    });
    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('faccoes').delete().eq('id', faccao.id);
      return NextResponse.json(
        { error: usuarioError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao cadastrar' },
      { status: 500 }
    );
  }
}
