'use client';

import { useState } from 'react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const navContent = (
    <>
      <div className="p-4 border-b border-slate-200">
        <h1 className="font-bold text-slate-800">Controle de Ponto</h1>
        <p className="text-xs text-slate-500">Painel Admin</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setDrawerOpen(false)}
            className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] flex items-center ${
              pathname === link.href
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => {
            setDrawerOpen(false);
            handleSignOut();
          }}
          className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px] flex items-center"
        >
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white shadow-sm flex-col flex-shrink-0">
        {navContent}
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-white shadow-sm flex items-center justify-between px-4 py-3 pt-safe">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-bold text-slate-800 truncate">Controle de Ponto</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg min-h-[44px]"
          >
            Sair
          </button>
        </header>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl z-50 flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">Menu</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Fechar menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {navContent}
            </aside>
          </>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-safe max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
