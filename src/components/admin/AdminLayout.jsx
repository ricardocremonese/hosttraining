import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Tag, Image, Newspaper, LayoutGrid, Plug, Megaphone, Ticket, Mail, ShoppingBag, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import Logo from '../store/NikeLogo';

const navItems = [
  { label: 'Painel', href: '/admin', icon: LayoutDashboard },
  { label: 'Banners', href: '/admin/banners', icon: Image },
  { label: 'Destaques', href: '/admin/editorials', icon: Newspaper },
  { label: 'Essenciais', href: '/admin/essentials', icon: LayoutGrid },
  { label: 'Produtos', href: '/admin/products', icon: Package },
  { label: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Categorias', href: '/admin/categories', icon: Tag },
  { label: 'Integrações', href: '/admin/integrations', icon: Plug },
];

const marketingItems = [
  { label: 'Campanhas', href: '/admin/marketing/campaigns', icon: Megaphone },
  { label: 'Cupons', href: '/admin/marketing/coupons', icon: Ticket },
  { label: 'Follow-Up', href: '/admin/marketing/followup', icon: ShoppingBag },
  { label: 'IA Conteúdo', href: '/admin/marketing/ai', icon: Sparkles },
];

export default function AdminLayout() {
  const location = useLocation();
  const isMarketingActive = location.pathname.startsWith('/admin/marketing');
  const [marketingOpen, setMarketingOpen] = useState(isMarketingActive);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-foreground text-primary-foreground flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-neutral-800">
          <Link to="/admin" className="flex items-center gap-2">
            <Logo className="h-6" variant="white" />
            <span className="text-xs font-bold tracking-wider text-neutral-400">ADMIN</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  active ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}

          {/* Marketing Submenu */}
          <div className="pt-2">
            <button
              onClick={() => setMarketingOpen(!marketingOpen)}
              className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${
                isMarketingActive ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <Mail className="w-4 h-4" strokeWidth={1.5} />
                Marketing
              </span>
              {marketingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {marketingOpen && (
              <div className="ml-4 border-l border-neutral-700 pl-3 mt-1 space-y-0.5">
                {marketingItems.map(item => {
                  const active = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
                        active ? 'bg-white/10 text-white font-medium' : 'text-neutral-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <Link to="/" className="text-xs text-neutral-400 hover:text-white transition-colors">
            ← Voltar para a Loja
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-nike-lightgray min-h-screen overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
