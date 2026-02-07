"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/funcionarios", label: "Funcionários", icon: Users },
  { href: "/admin/marcacoes", label: "Marcações", icon: Clock },
  { href: "/admin/periodos", label: "Períodos", icon: CalendarDays },
  { href: "/admin/folha-pagamento", label: "Folha de Pagamento", icon: FileText },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fechar menu ao trocar de rota (ex.: após clicar em um link)
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navLink = (link: (typeof links)[0]) => {
    const Icon = link.icon;
    const isActive = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]",
          isActive
            ? "bg-primary/12 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
        {link.label}
      </Link>
    );
  };

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Desktop: sidebar fixa */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h1 className="font-bold text-lg text-foreground tracking-tight">
            Horas Facção
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Painel Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(navLink)}
        </nav>
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 h-auto min-h-[44px] text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            Sair
          </Button>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile: header fixo com menu escondido atrás do ícone */}
        <header className="md:hidden sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between gap-2 px-4 py-3 min-h-[56px] pt-safe">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 -ml-1"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </Button>
          <h1 className="font-bold text-foreground truncate text-base flex-1 text-center">
            Horas Facção
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground flex-shrink-0 min-h-[44px]"
            onClick={handleSignOut}
          >
            Sair
          </Button>
        </header>

        {/* Mobile: bottom sheet do menu (sobe de baixo, melhor para celular) */}
        {menuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-2xl flex flex-col max-h-[85dvh] sheet-slide-up pb-safe"
              role="dialog"
              aria-label="Menu de navegação"
            >
              {/* Alça + título + fechar */}
              <div className="flex justify-center pt-3 pb-1 relative">
                <span className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1 h-9 w-9 text-muted-foreground"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </Button>
              </div>
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground">Painel Admin</p>
                <h2 className="font-bold text-lg text-foreground">Menu</h2>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 overscroll-contain">
                {links.map(navLink)}
              </nav>
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-3 py-2.5 h-auto min-h-[48px] text-muted-foreground hover:text-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                  Sair
                </Button>
              </div>
              <div className="h-2 shrink-0" />
            </div>
          </>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-safe max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
