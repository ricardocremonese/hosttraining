import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) < 5);

  const stats = [
    { label: 'Total de Produtos', value: products.length, icon: Package },
    { label: 'Total de Pedidos', value: orders.length, icon: ShoppingCart },
    { label: 'Receita', value: `R$${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Estoque Baixo', value: lowStockProducts.length, icon: AlertTriangle },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-8">Painel</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-bold">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Pedido</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-muted-foreground py-8">Nenhum pedido ainda</td>
                </tr>
              ) : (
                orders.slice(0, 10).map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-xs font-mono">#{order.id?.slice(-6)}</td>
                    <td className="px-6 py-3 text-xs">{order.customer_name || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 font-medium ${
                        order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs font-medium text-right">R${order.total?.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock */}
      {lowStockProducts.length > 0 && (
        <div className="mt-8 bg-white border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-nike-orange" /> Alertas de Estoque Baixo
            </h2>
          </div>
          <div className="divide-y divide-border">
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-medium">{p.name}</span>
                <span className="text-xs text-destructive font-medium">{p.stock || 0} restantes</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
