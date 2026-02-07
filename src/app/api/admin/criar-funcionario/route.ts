import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { data: adminUsuario } = await supabaseAdmin
    .from('usuarios')
    .select('faccao_id')
    .eq('auth_user_id', user.id)
    .eq('tipo', 'admin')
    .single();

  if (!adminUsuario?.faccao_id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const body = await request.json();
  const { nome, email, senha, valor_hora } = body;
  if (!nome || !email || !senha) {
    return NextResponse.json(
      { error: 'Nome, email e senha são obrigatórios' },
      { status: 400 }
    );
  }

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (createError) {
    return NextResponse.json(
      { error: createError.message },
      { status: 400 }
    );
  }

  if (!newUser.user) {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }

  const { error: usuarioError } = await supabaseAdmin.from('usuarios').insert({
    faccao_id: adminUsuario.faccao_id,
    auth_user_id: newUser.user.id,
    nome,
    email,
    tipo: 'funcionario',
    valor_hora: Number(valor_hora) || 0,
    ativo: true,
  });

  if (usuarioError) {
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json(
      { error: usuarioError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
