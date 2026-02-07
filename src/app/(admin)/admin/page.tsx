import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getDashboardData(faccaoId: string) {
  const supabase = await createClient();
  const now = new Date();
  const inicioMes = startOfMonth(now);
  const fimMes = endOfMonth(now);

  const { data: funcionarios } = await supabase
    .from('usuarios')
    .select('id')
    .eq('faccao_id', faccaoId)
    .eq('tipo', 'funcionario')
    .eq('ativo', true);

  const { data: marcacoes } = await supabase
    .from('marcacoes')
    .select(`
      usuario_id,
      data_hora,
      tipo
    `)
    .in('usuario_id', funcionarios?.map((f) => f.id) ?? [])
    .gte('data_hora', inicioMes.toISOString())
    .lte('data_hora', fimMes.toISOString())
    .order('data_hora', { ascending: true });

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome, valor_hora')
    .eq('faccao_id', faccaoId)
    .eq('tipo', 'funcionario')
    .eq('ativo', true);

  const usuariosMap = new Map(usuarios?.map((u) => [u.id, u]) ?? []);
  const horasPorUsuario = new Map<string, number>();

  if (marcacoes) {
    const sorted = [...marcacoes].sort(
      (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i] as { usuario_id: string; data_hora: string; tipo: string };
      const next = sorted[i + 1] as { usuario_id: string; data_hora: string; tipo: string };
      if (curr.tipo === 'entrada' && next.tipo === 'saida' && curr.usuario_id === next.usuario_id) {
        const h = (new Date(next.data_hora).getTime() - new Date(curr.data_hora).getTime()) / (1000 * 60 * 60);
        horasPorUsuario.set(curr.usuario_id, (horasPorUsuario.get(curr.usuario_id) ?? 0) + h);
      }
    }
  }

  let custoTotal = 0;
  horasPorUsuario.forEach((horas, usuarioId) => {
    const u = usuariosMap.get(usuarioId);
    if (u?.valor_hora) custoTotal += horas * Number(u.valor_hora);
  });

  const totalHorasMes = Array.from(horasPorUsuario.values()).reduce((a, b) => a + b, 0);

  return {
    funcionariosAtivos: funcionarios?.length ?? 0,
    totalHorasMes,
    custoTotal,
    mesAtual: format(now, 'MMMM yyyy', { locale: ptBR }),
  };
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('faccao_id')
    .eq('auth_user_id', user.id)
    .single();

  if (!usuario?.faccao_id) return null;

  const data = await getDashboardData(usuario.faccao_id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-shadow">
          <p className="text-sm text-slate-600">Funcionários ativos</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{data.funcionariosAtivos}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-shadow">
          <p className="text-sm text-slate-600">Horas em {data.mesAtual}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">
            {data.totalHorasMes.toFixed(1)}h
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-6 hover:shadow-xl transition-shadow">
          <p className="text-sm text-slate-600">Custo estimado (mês)</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">
            R$ {data.custoTotal.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
    </div>
  );
}
