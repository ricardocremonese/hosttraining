import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, ShoppingCart, DollarSign, AlertTriangle, XCircle, TrendingUp, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const statusLabels = { pending: 'Pendente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };
const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getWeekOfMonth(date) {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  return Math.ceil((d.getDate() + firstDay) / 7);
}

export default function Dashboard() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  // Pedidos do mês selecionado
  const monthOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.created_date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [allOrders, selectedMonth, selectedYear]);

  // Receita = apenas pedidos confirmados, enviados ou entregues (NÃO pendente, NÃO cancelado)
  const paidStatuses = ['confirmed', 'shipped', 'delivered'];
  const paidOrders = monthOrders.filter(o => paidStatuses.includes(o.status));
  const cancelledOrders = monthOrders.filter(o => o.status === 'cancelled');

  const monthRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cancelledTotal = cancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersMonth = monthOrders.length;
  const lowStockProducts = products.filter(p => (p.stock || 0) < 5);

  // Vendas do dia selecionado
  const dayOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.created_date).toISOString().split('T')[0];
      return d === selectedDate;
    });
  }, [allOrders, selectedDate]);

  const dayPaid = dayOrders.filter(o => paidStatuses.includes(o.status));
  const dayRevenue = dayPaid.reduce((sum, o) => sum + (o.total || 0), 0);
  const dayCancelled = dayOrders.filter(o => o.status === 'cancelled').length;

  // Receita total geral (todos os meses, apenas pagos)
  const totalRevenueAll = allOrders
    .filter(o => paidStatuses.includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Mês anterior
  const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYearIdx = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevMonthName = `${monthNames[prevMonthIdx].slice(0, 3)}/${prevYearIdx}`;

  const prevMonthOrders = useMemo(() => {
    return allOrders.filter(o => {
      const d = new Date(o.created_date);
      return d.getMonth() === prevMonthIdx && d.getFullYear() === prevYearIdx;
    });
  }, [allOrders, prevMonthIdx, prevYearIdx]);

  // Dados do gráfico por semana
  const chartData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const totalWeeks = Math.ceil(daysInMonth / 7);

    const weeks = [];
    for (let w = 1; w <= totalWeeks; w++) {
      const startDay = (w - 1) * 7 + 1;
      const endDay = Math.min(w * 7, daysInMonth);
      weeks.push({
        name: `Sem ${w}`,
        label: `${startDay}-${endDay} ${monthNames[selectedMonth].slice(0, 3)}`,
        vendas: 0,
        cancelados: 0,
        pedidos: 0,
        vendasAnterior: 0,
      });
    }

    monthOrders.forEach(order => {
      const d = new Date(order.created_date);
      const weekIdx = Math.min(Math.ceil(d.getDate() / 7) - 1, weeks.length - 1);
      weeks[weekIdx].pedidos += 1;
      if (paidStatuses.includes(order.status)) {
        weeks[weekIdx].vendas += order.total || 0;
      }
      if (order.status === 'cancelled') {
        weeks[weekIdx].cancelados += order.total || 0;
      }
    });

    // Dados do mês anterior distribuídos por semana
    if (compareEnabled) {
      const daysInPrevMonth = new Date(prevYearIdx, prevMonthIdx + 1, 0).getDate();
      prevMonthOrders.forEach(order => {
        const d = new Date(order.created_date);
        const weekIdx = Math.min(Math.ceil(d.getDate() / 7) - 1, weeks.length - 1);
        if (paidStatuses.includes(order.status)) {
          weeks[weekIdx].vendasAnterior += order.total || 0;
        }
      });
    }

    return weeks;
  }, [monthOrders, prevMonthOrders, selectedMonth, selectedYear, compareEnabled]);

  // Ranking dos produtos mais vendidos (apenas pedidos pagos)
  const topProducts = useMemo(() => {
    const productMap = {};
    const paidAll = allOrders.filter(o => paidStatuses.includes(o.status));

    paidAll.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.product_id || item.product_name;
        if (!productMap[key]) {
          productMap[key] = {
            name: item.product_name,
            image: item.image || '',
            product_id: item.product_id,
            quantity: 0,
            revenue: 0,
          };
        }
        productMap[key].quantity += item.quantity || 1;
        productMap[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
  }, [allOrders]);

  const trophyColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const trophyLabels = ['Ouro', 'Prata', 'Bronze'];
  const trophyBg = ['bg-amber-50 border-amber-200', 'bg-slate-50 border-slate-200', 'bg-orange-50 border-orange-200'];

  // Navegação de mês
  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const formatCurrency = (v) => `R$${v.toFixed(2).replace('.', ',')}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border p-3 shadow-lg min-w-[160px]">
        <p className="text-xs font-bold mb-2">{payload[0]?.payload?.label || label}</p>
        {payload.map((p, i) => {
          if (p.dataKey === 'vendasAnterior' && !compareEnabled) return null;
          return (
            <div key={i} className="flex items-center justify-between gap-4 text-xs mb-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
              <span className="font-medium">{formatCurrency(p.value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white border border-border px-2 py-1">
          <button onClick={prevMonth} className="p-1 hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium w-36 text-center">
            {monthNames[selectedMonth]} {selectedYear}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1 hover:bg-secondary transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 border border-border">
          <DollarSign className="w-5 h-5 text-green-600 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold text-green-700">{formatCurrency(monthRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Faturamento do Mês</p>
        </div>
        <div className="bg-white p-5 border border-border">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{formatCurrency(totalRevenueAll)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Receita Total (Geral)</p>
        </div>
        <div className="bg-white p-5 border border-border">
          <ShoppingCart className="w-5 h-5 text-muted-foreground mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{totalOrdersMonth}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Pedidos no Mês</p>
        </div>
        <div className="bg-white p-5 border border-border">
          <XCircle className="w-5 h-5 text-red-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold text-red-600">{formatCurrency(cancelledTotal)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Cancelados: {cancelledOrders.length} pedido{cancelledOrders.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white p-5 border border-border">
          <AlertTriangle className="w-5 h-5 text-orange-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{lowStockProducts.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Estoque Baixo</p>
        </div>
      </div>

      {/* Daily Filter */}
      <div className="bg-white border border-border p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Filtro Diário</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={now.toISOString().split('T')[0]}
                className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xl font-bold text-green-700">{formatCurrency(dayRevenue)}</p>
              <p className="text-[10px] text-muted-foreground">Vendas do dia</p>
            </div>
            <div>
              <p className="text-xl font-bold">{dayOrders.length}</p>
              <p className="text-[10px] text-muted-foreground">Pedidos</p>
            </div>
            <div>
              <p className="text-xl font-bold">{dayPaid.length}</p>
              <p className="text-[10px] text-muted-foreground">Pagos</p>
            </div>
            {dayCancelled > 0 && (
              <div>
                <p className="text-xl font-bold text-red-600">{dayCancelled}</p>
                <p className="text-[10px] text-muted-foreground">Cancelados</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedDate(now.toISOString().split('T')[0])}
            className="text-xs font-medium text-muted-foreground hover:text-foreground underline"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold">Evolução Semanal — {monthNames[selectedMonth]} {selectedYear}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCompareEnabled(!compareEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border transition-colors ${
                compareEnabled
                  ? 'bg-pink-50 border-pink-300 text-pink-700'
                  : 'border-border text-muted-foreground hover:border-foreground'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${compareEnabled ? 'bg-pink-400' : 'bg-muted-foreground/30'}`} />
              {compareEnabled ? `Comparando: ${prevMonthName}` : 'Comparar mês anterior'}
            </button>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Vendas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Cancelados</span>
              {compareEnabled && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-pink-400 inline-block" /> {prevMonthName}</span>}
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCancelados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#999" />
              <YAxis tick={{ fontSize: 11 }} stroke="#999" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomTooltip />} />
              {compareEnabled && (
                <Area type="monotone" dataKey="vendasAnterior" name={`Vendas ${prevMonthName}`} stroke="#ec4899" strokeWidth={2} strokeDasharray="6 3" fill="url(#gradAnterior)" dot={{ r: 3, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} />
              )}
              <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradVendas)" dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="cancelados" name="Cancelados" stroke="#ef4444" strokeWidth={2} fill="url(#gradCancelados)" dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Weekly Summary Below Chart */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-border">
          {chartData.map(week => (
            <div key={week.name} className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{week.label}</p>
              <p className="text-xs font-bold text-green-700">{formatCurrency(week.vendas)}</p>
              <p className="text-[10px] text-muted-foreground">{week.pedidos} pedido{week.pedidos !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 Products */}
      {topProducts.length > 0 && (
        <div className="bg-white border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <h2 className="text-sm font-bold">Produtos Mais Vendidos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topProducts.map((product, idx) => (
              <a
                key={idx}
                href={product.product_id ? `/products/${product.product_id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative border p-5 flex items-center gap-4 transition-all hover:shadow-md group ${trophyBg[idx]}`}
              >
                {/* Position Badge */}
                <div className="absolute -top-3 -left-2 flex items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: trophyColors[idx] }}
                  >
                    <Trophy className="w-3.5 h-3.5 text-white" fill="white" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: trophyColors[idx] }}>
                    {idx + 1}º
                  </span>
                </div>

                {/* Product Image */}
                <div className="w-16 h-16 bg-white flex-shrink-0 overflow-hidden border border-border">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" strokeWidth={1} />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:underline">{product.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div>
                      <p className="text-lg font-bold">{product.quantity}</p>
                      <p className="text-[10px] text-muted-foreground -mt-0.5">vendidos</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="text-sm font-bold text-green-700">{formatCurrency(product.revenue)}</p>
                      <p className="text-[10px] text-muted-foreground -mt-0.5">faturado</p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white border border-border mb-8">
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
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-sm text-muted-foreground py-8">Nenhum pedido ainda</td>
                </tr>
              ) : (
                allOrders.slice(0, 10).map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-xs font-mono font-bold">{order.order_number || `#${order.id?.slice(-6)}`}</td>
                    <td className="px-6 py-3 text-xs">{order.customer_name || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 font-medium ${statusColors[order.status] || 'bg-gray-50 text-gray-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs font-medium text-right">{formatCurrency(order.total || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Alertas de Estoque Baixo
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
