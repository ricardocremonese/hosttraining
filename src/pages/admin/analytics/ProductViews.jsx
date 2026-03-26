import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, ShoppingCart, TrendingDown, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ProductViews() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: views = [] } = useQuery({
    queryKey: ['admin-product-views'],
    queryFn: () => base44.entities.ProductView.list('-created_date', 5000),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
  });

  // Filtrar views do mês
  const monthViews = useMemo(() => {
    return views.filter(v => {
      const d = new Date(v.created_date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [views, selectedMonth, selectedYear]);

  // IDs de produtos comprados
  const purchasedProductIds = useMemo(() => {
    const ids = new Set();
    orders.forEach(o => {
      if (['confirmed', 'shipped', 'delivered'].includes(o.status)) {
        (o.items || []).forEach(item => { if (item.product_id) ids.add(item.product_id); });
      }
    });
    return ids;
  }, [orders]);

  // Ranking: mais visitados
  const viewRanking = useMemo(() => {
    const map = {};
    monthViews.forEach(v => {
      if (!map[v.product_id]) {
        const product = products.find(p => p.id === v.product_id);
        map[v.product_id] = {
          product_id: v.product_id,
          name: v.product_name || product?.name || 'Produto removido',
          image: product?.images?.[0] || '',
          price: product?.price || 0,
          category: product?.category || '',
          views: 0,
          uniqueSessions: new Set(),
          purchased: purchasedProductIds.has(v.product_id),
        };
      }
      map[v.product_id].views += 1;
      if (v.session_id) map[v.product_id].uniqueSessions.add(v.session_id);
    });

    return Object.values(map)
      .map(p => ({ ...p, uniqueVisitors: p.uniqueSessions.size }))
      .sort((a, b) => b.views - a.views);
  }, [monthViews, products, purchasedProductIds]);

  // Produtos mais visitados que NÃO foram comprados
  const viewedNotBought = viewRanking.filter(p => !p.purchased);

  // Dados para gráfico top 10
  const chartData = viewRanking.slice(0, 10).map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
    visitas: p.views,
    visitantes: p.uniqueVisitors,
  }));

  const totalViews = monthViews.length;
  const uniqueSessions = new Set(monthViews.map(v => v.session_id).filter(Boolean)).size;

  const prevMonth = () => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); };
  const nextMonth = () => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics — Visitas de Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Rastreamento de produtos visitados e taxa de conversão</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-border px-2 py-1">
          <button onClick={prevMonth} className="p-1 hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium w-32 text-center">{monthNames[selectedMonth]} {selectedYear}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-border p-5">
          <Eye className="w-5 h-5 text-blue-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{totalViews}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Visitas no Mês</p>
        </div>
        <div className="bg-white border border-border p-5">
          <Eye className="w-5 h-5 text-purple-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{uniqueSessions}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Visitantes Únicos</p>
        </div>
        <div className="bg-white border border-border p-5">
          <ShoppingCart className="w-5 h-5 text-green-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{viewRanking.filter(p => p.purchased).length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Produtos Visitados e Comprados</p>
        </div>
        <div className="bg-white border border-border p-5">
          <TrendingDown className="w-5 h-5 text-red-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold text-red-600">{viewedNotBought.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Visitados mas NÃO Comprados</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-border p-6 mb-8">
          <h2 className="text-sm font-bold mb-4">Top 10 — Produtos Mais Visitados</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#999" angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} stroke="#999" />
                <Tooltip />
                <Bar dataKey="visitas" name="Visitas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visitantes" name="Visitantes Únicos" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Viewed but NOT bought */}
      <div className="bg-white border border-border mb-8">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold">Produtos Visitados mas NÃO Comprados</h2>
          <span className="text-[10px] text-muted-foreground ml-1">— Oportunidade de ação (cupom, downsell, remarketing)</span>
        </div>
        {viewedNotBought.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Todos os produtos visitados foram comprados!</div>
        ) : (
          <div className="divide-y divide-border">
            {viewedNotBought.slice(0, 20).map(p => (
              <div key={p.product_id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary flex-shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · R${p.price?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{p.views}</p>
                  <p className="text-[10px] text-muted-foreground">{p.uniqueVisitors} visitante{p.uniqueVisitors !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-red-50 text-red-600 font-medium">Sem compra</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All products ranking */}
      <div className="bg-white border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-bold">Ranking Completo de Visitas</h2>
        </div>
        <div className="divide-y divide-border">
          {viewRanking.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Nenhuma visita registrada neste mês</div>
          ) : viewRanking.map((p, idx) => (
            <div key={p.product_id} className="px-5 py-3 flex items-center gap-4">
              <span className="text-xs font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
              <div className="w-10 h-10 bg-secondary flex-shrink-0 overflow-hidden">
                {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
              <div className="text-right mr-2">
                <p className="text-sm font-bold">{p.views}</p>
                <p className="text-[10px] text-muted-foreground">{p.uniqueVisitors} único{p.uniqueVisitors !== 1 ? 's' : ''}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 font-medium ${p.purchased ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {p.purchased ? 'Comprado' : 'Sem compra'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
