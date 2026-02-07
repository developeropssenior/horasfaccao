"use client";

import { useState } from "react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navContent = (
    <>
      <div className="p-5 border-b border-border">
        <h1 className="font-bold text-lg text-foreground tracking-tight">
          Horas Facção
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Painel Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]",
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto min-h-[44px] text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDrawerOpen(false);
            handleSignOut();
          }}
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col flex-shrink-0">
        {navContent}
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 py-3 pt-safe">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </Button>
          <h1 className="font-bold text-foreground truncate">Horas Facção</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground"
          >
            Sair
          </Button>
        </header>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card border-r border-border shadow-xl z-50 flex flex-col">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <span className="font-bold text-foreground">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </Button>
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
