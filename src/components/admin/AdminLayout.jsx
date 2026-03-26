import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Tag, Image, Newspaper, LayoutGrid } from 'lucide-react';
import Logo from '../store/NikeLogo';

const navItems = [
  { label: 'Painel', href: '/admin', icon: LayoutDashboard },
  { label: 'Banners', href: '/admin/banners', icon: Image },
  { label: 'Destaques', href: '/admin/editorials', icon: Newspaper },
  { label: 'Essenciais', href: '/admin/essentials', icon: LayoutGrid },
  { label: 'Produtos', href: '/admin/products', icon: Package },
  { label: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Categorias', href: '/admin/categories', icon: Tag },
];

export default function AdminLayout() {
  const location = useLocation();

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
        <nav className="flex-1 p-4 space-y-1">
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
