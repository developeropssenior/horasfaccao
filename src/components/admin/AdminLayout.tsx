'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/funcionarios', label: 'Funcionários' },
  { href: '/admin/marcacoes', label: 'Marcações' },
  { href: '/admin/periodos', label: 'Períodos' },
  { href: '/admin/folha-pagamento', label: 'Folha de Pagamento' },
  { href: '/admin/relatorios', label: 'Relatórios' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-slate-800">Controle de Ponto</h1>
          <p className="text-xs text-slate-500">Painel Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
