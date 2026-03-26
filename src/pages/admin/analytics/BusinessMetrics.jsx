import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, TrendingUp, Users, ShoppingCart, Percent, RotateCcw, XCircle, Eye, CreditCard, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const channelOptions = ['Google Ads', 'Meta Ads', 'Instagram', 'TikTok', 'Influencer', 'E-mail', 'WhatsApp', 'Orgânico', 'Outro'];

const fmt = (v) => `R$${v.toFixed(2).replace('.', ',')}`;

export default function BusinessMetrics() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [spendForm, setSpendForm] = useState({ channel: 'Google Ads', amount: '', notes: '' });

  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: () => base44.entities.Order.list('-created_date', 2000) });
  const { data: products = [] } = useQuery({ queryKey: ['admin-products'], queryFn: () => base44.entities.Product.list('-created_date', 500) });
  const { data: views = [] } = useQuery({ queryKey: ['admin-product-views'], queryFn: () => base44.entities.ProductView.list('-created_date', 10000) });
  const { data: abandonedCarts = [] } = useQuery({ queryKey: ['admin-abandoned-carts'], queryFn: () => base44.entities.AbandonedCart.list('-created_date', 500) });
  const { data: spends = [] } = useQuery({ queryKey: ['admin-marketing-spend'], queryFn: () => base44.entities.MarketingSpend.list('-created_date', 200) });

  const createSpend = useMutation({
    mutationFn: (data) => base44.entities.MarketingSpend.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-marketing-spend'] }); setShowSpendForm(false); setSpendForm({ channel: 'Google Ads', amount: '', notes: '' }); },
  });
  const deleteSpend = useMutation({
    mutationFn: (id) => base44.entities.MarketingSpend.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-marketing-spend'] }),
  });

  const paid = ['confirmed', 'shipped', 'delivered'];
  const productMap = useMemo(() => { const m = {}; products.forEach(p => { m[p.id] = p; }); return m; }, [products]);

  // Filtrar por mês
  const mOrders = useMemo(() => orders.filter(o => { const d = new Date(o.created_date); return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear; }), [orders, selectedMonth, selectedYear]);
  const mViews = useMemo(() => views.filter(v => { const d = new Date(v.created_date); return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear; }), [views, selectedMonth, selectedYear]);
  const mAbandoned = useMemo(() => abandonedCarts.filter(c => { const d = new Date(c.created_date); return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear; }), [abandonedCarts, selectedMonth, selectedYear]);
  const mSpends = useMemo(() => spends.filter(s => { const d = new Date(s.period_start); return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear; }), [spends, selectedMonth, selectedYear]);

  const mPaid = mOrders.filter(o => paid.includes(o.status));
  const mCancelled = mOrders.filter(o => o.status === 'cancelled');

  // ========== MÉTRICAS ==========

  // 1. Faturamento Bruto e Líquido
  const grossRevenue = mPaid.reduce((s, o) => s + (o.total || 0), 0);
  const totalCost = mPaid.reduce((s, o) => {
    return s + (o.items || []).reduce((is, item) => {
      const p = productMap[item.product_id];
      return is + ((p?.cost_price || 0) * (item.quantity || 1));
    }, 0);
  }, 0);
  const netRevenue = grossRevenue - totalCost;
  const margin = grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100).toFixed(1) : '0';

  // 2. Conversão
  const uniqueVisitors = new Set(mViews.map(v => v.session_id).filter(Boolean)).size;
  const conversionRate = uniqueVisitors > 0 ? ((mPaid.length / uniqueVisitors) * 100).toFixed(2) : '0';

  // 3. Ticket Médio
  const avgTicket = mPaid.length > 0 ? grossRevenue / mPaid.length : 0;

  // 4. CAC
  const totalSpend = mSpends.reduce((s, sp) => s + (sp.amount || 0), 0);
  const newCustomers = (() => {
    const cpfs = new Set();
    mPaid.forEach(o => { const c = o.customer_cpf?.replace(/\D/g, ''); if (c) cpfs.add(c); });
    return cpfs.size;
  })();
  const cac = newCustomers > 0 ? totalSpend / newCustomers : 0;

  // 5. ROAS
  const roas = totalSpend > 0 ? (grossRevenue / totalSpend).toFixed(2) : '∞';

  // 6. Recompra
  const repeatCustomers = (() => {
    const cpfOrders = {};
    orders.filter(o => paid.includes(o.status)).forEach(o => {
      const c = o.customer_cpf?.replace(/\D/g, '');
      if (c) cpfOrders[c] = (cpfOrders[c] || 0) + 1;
    });
    const total = Object.keys(cpfOrders).length;
    const repeat = Object.values(cpfOrders).filter(n => n >= 2).length;
    return { total, repeat, rate: total > 0 ? ((repeat / total) * 100).toFixed(1) : '0' };
  })();

  // 7. Devolução / Cancelamento
  const cancelRate = mOrders.length > 0 ? ((mCancelled.length / mOrders.length) * 100).toFixed(1) : '0';
  const cancelledValue = mCancelled.reduce((s, o) => s + (o.total || 0), 0);

  // 8. Abandono de Checkout
  const abandonRate = (mOrders.length + mAbandoned.length) > 0
    ? ((mAbandoned.length / (mOrders.length + mAbandoned.length)) * 100).toFixed(1) : '0';

  // 9. Profit per Visitor
  const profitPerVisitor = uniqueVisitors > 0 ? netRevenue / uniqueVisitors : 0;

  // 10. Lucro por Canal
  const channelData = useMemo(() => {
    const map = {};
    mSpends.forEach(s => {
      if (!map[s.channel]) map[s.channel] = { channel: s.channel, spend: 0 };
      map[s.channel].spend += s.amount || 0;
    });
    return Object.values(map).map(c => ({
      ...c,
      revenue: grossRevenue > 0 && totalSpend > 0 ? (grossRevenue * (c.spend / totalSpend)) : 0,
      roas: c.spend > 0 && grossRevenue > 0 ? ((grossRevenue * (c.spend / totalSpend)) / c.spend).toFixed(2) : '0',
      profit: grossRevenue > 0 && totalSpend > 0 ? ((grossRevenue * (c.spend / totalSpend)) - c.spend) : -c.spend,
    })).sort((a, b) => b.profit - a.profit);
  }, [mSpends, grossRevenue, totalSpend]);

  // Evolução mensal (últimos 6 meses)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      if (m < 0) { m += 12; y--; }
      const mo = orders.filter(o => { const d = new Date(o.created_date); return d.getMonth() === m && d.getFullYear() === y && paid.includes(o.status); });
      const rev = mo.reduce((s, o) => s + (o.total || 0), 0);
      const cost = mo.reduce((s, o) => s + (o.items || []).reduce((is, item) => is + ((productMap[item.product_id]?.cost_price || 0) * (item.quantity || 1)), 0), 0);
      months.push({ name: `${monthNames[m]}/${y.toString().slice(2)}`, receita: rev, lucro: rev - cost, pedidos: mo.length });
    }
    return months;
  }, [orders, selectedMonth, selectedYear, productMap]);

  const prevMonth = () => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); };
  const nextMonth = () => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); };

  const handleAddSpend = (e) => {
    e.preventDefault();
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    createSpend.mutate({ ...spendForm, amount: parseFloat(spendForm.amount) || 0, period_start: start.toISOString().split('T')[0], period_end: end.toISOString().split('T')[0] });
  };

  const MetricCard = ({ icon: Icon, iconColor, value, label, sub, highlight }) => (
    <div className={`bg-white border border-border p-4 ${highlight ? 'ring-1 ring-green-200' : ''}`}>
      <Icon className={`w-4 h-4 ${iconColor} mb-2`} strokeWidth={1.5} />
      <p className={`text-lg font-bold ${highlight ? 'text-green-700' : ''}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas de Negócio</h1>
          <p className="text-sm text-muted-foreground mt-1">Indicadores financeiros e de performance completos</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-border px-2 py-1">
          <button onClick={prevMonth} className="p-1 hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium w-28 text-center">{monthNames[selectedMonth]}/{selectedYear}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* ===== OBRIGATÓRIAS ===== */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Obrigatórias</h2>
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <MetricCard icon={DollarSign} iconColor="text-green-500" value={fmt(grossRevenue)} label="Faturamento Bruto" sub={`${mPaid.length} pedidos pagos`} />
        <MetricCard icon={DollarSign} iconColor="text-emerald-600" value={fmt(netRevenue)} label="Faturamento Líquido" sub={`Custo: ${fmt(totalCost)}`} highlight />
        <MetricCard icon={Percent} iconColor="text-blue-500" value={`${conversionRate}%`} label="Taxa de Conversão" sub={`${uniqueVisitors} visitantes → ${mPaid.length} compras`} />
        <MetricCard icon={ShoppingCart} iconColor="text-purple-500" value={fmt(avgTicket)} label="Ticket Médio" />
        <MetricCard icon={Users} iconColor="text-indigo-500" value={fmt(cac)} label="CAC" sub={`${newCustomers} novos clientes`} />
        <MetricCard icon={TrendingUp} iconColor="text-amber-500" value={`${roas}x`} label="ROAS" sub={`Investido: ${fmt(totalSpend)}`} />
        <MetricCard icon={Percent} iconColor="text-green-600" value={`${margin}%`} label="Margem" />
        <MetricCard icon={RotateCcw} iconColor="text-cyan-500" value={`${repeatCustomers.rate}%`} label="Recompra" sub={`${repeatCustomers.repeat} de ${repeatCustomers.total}`} />
        <MetricCard icon={XCircle} iconColor="text-red-500" value={`${cancelRate}%`} label="Devolução/Cancel." sub={`${mCancelled.length} pedidos (${fmt(cancelledValue)})`} />
        <MetricCard icon={ShoppingCart} iconColor="text-orange-500" value={`${abandonRate}%`} label="Abandono Checkout" sub={`${mAbandoned.length} carrinhos`} />
      </div>

      {/* ===== EVOLUÍDAS ===== */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Evoluídas</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <MetricCard icon={Eye} iconColor="text-emerald-500" value={fmt(profitPerVisitor)} label="Lucro por Visitante" sub="Net Revenue / Visitantes Únicos" highlight />
        <div className="bg-white border border-border p-4 col-span-2">
          <p className="text-xs font-bold mb-2">Lucro por Canal</p>
          {channelData.length === 0 ? (
            <p className="text-xs text-muted-foreground">Cadastre investimentos abaixo</p>
          ) : (
            <div className="space-y-1.5">
              {channelData.map(c => (
                <div key={c.channel} className="flex items-center gap-2 text-xs">
                  <span className="w-20 font-medium truncate">{c.channel}</span>
                  <div className="flex-1 h-4 bg-secondary rounded overflow-hidden relative">
                    <div className={`h-full rounded ${c.profit >= 0 ? 'bg-green-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, Math.abs(c.profit) / (Math.max(...channelData.map(x => Math.abs(x.profit))) || 1) * 100)}%` }} />
                  </div>
                  <span className={`w-20 text-right font-medium ${c.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(c.profit)}</span>
                  <span className="w-14 text-right text-muted-foreground">{c.roas}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evolução 6 meses */}
      <div className="bg-white border border-border p-6 mb-8">
        <h2 className="text-sm font-bold mb-4">Evolução — Últimos 6 Meses</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Line type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investimento em Marketing */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Investimento em Marketing — {monthNames[selectedMonth]}/{selectedYear}</h2>
          <button onClick={() => setShowSpendForm(!showSpendForm)} className="flex items-center gap-1 text-xs font-medium bg-foreground text-background px-3 py-1.5 hover:bg-foreground/90">
            {showSpendForm ? <XCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showSpendForm ? 'Fechar' : 'Adicionar'}
          </button>
        </div>

        {showSpendForm && (
          <form onSubmit={handleAddSpend} className="flex gap-3 mb-4 p-3 bg-secondary/50">
            <select value={spendForm.channel} onChange={e => setSpendForm(p => ({ ...p, channel: e.target.value }))} className="border border-border px-3 py-2 text-xs outline-none">
              {channelOptions.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" step="0.01" value={spendForm.amount} onChange={e => setSpendForm(p => ({ ...p, amount: e.target.value }))} placeholder="Valor R$" className="w-32 border border-border px-3 py-2 text-xs outline-none" required />
            <input value={spendForm.notes} onChange={e => setSpendForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observação" className="flex-1 border border-border px-3 py-2 text-xs outline-none" />
            <button type="submit" className="bg-foreground text-background px-4 py-2 text-xs font-medium">Salvar</button>
          </form>
        )}

        <div className="flex items-center justify-between p-3 bg-secondary/50 mb-3">
          <span className="text-xs font-bold">Total Investido</span>
          <span className="text-sm font-bold">{fmt(totalSpend)}</span>
        </div>

        {mSpends.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum investimento cadastrado neste mês</p>
        ) : (
          <div className="divide-y divide-border">
            {mSpends.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium">{s.channel}</p>
                  {s.notes && <p className="text-[10px] text-muted-foreground">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{fmt(s.amount)}</span>
                  <button onClick={() => deleteSpend.mutate(s.id)} className="p-1 hover:bg-secondary text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela resumo */}
      <div className="bg-white border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold">Resumo Completo de Métricas</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-2 uppercase">Métrica</th>
              <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-2 uppercase">Valor</th>
              <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-2 uppercase">Fórmula</th>
              <th className="text-left text-[10px] font-bold text-muted-foreground px-4 py-2 uppercase">Objetivo</th>
              <th className="text-center text-[10px] font-bold text-muted-foreground px-4 py-2 uppercase">Prioridade</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {[
              { name: 'Faturamento Bruto', value: fmt(grossRevenue), formula: 'Soma dos pedidos pagos', obj: 'Crescimento mensal', pri: '🔴' },
              { name: 'Faturamento Líquido', value: fmt(netRevenue), formula: 'Bruto - Custo dos produtos', obj: 'Margem positiva', pri: '🔴' },
              { name: 'Margem', value: `${margin}%`, formula: '(Líquido / Bruto) × 100', obj: 'Acima de 30%', pri: '🔴' },
              { name: 'Taxa de Conversão', value: `${conversionRate}%`, formula: 'Compras / Visitantes', obj: 'Acima de 2%', pri: '🔴' },
              { name: 'Ticket Médio', value: fmt(avgTicket), formula: 'Receita / Nº Pedidos', obj: 'Crescimento constante', pri: '🔴' },
              { name: 'CAC', value: fmt(cac), formula: 'Investimento / Novos Clientes', obj: 'Menor que ticket médio', pri: '🔴' },
              { name: 'ROAS', value: `${roas}x`, formula: 'Receita / Investimento', obj: 'Acima de 3x', pri: '🔴' },
              { name: 'Recompra', value: `${repeatCustomers.rate}%`, formula: 'Clientes 2+ compras / Total', obj: 'Acima de 20%', pri: '🟡' },
              { name: 'Cancelamento', value: `${cancelRate}%`, formula: 'Cancelados / Total Pedidos', obj: 'Abaixo de 5%', pri: '🟡' },
              { name: 'Abandono Checkout', value: `${abandonRate}%`, formula: 'Carrinhos / (Carrinhos + Pedidos)', obj: 'Abaixo de 60%', pri: '🟡' },
              { name: 'Lucro por Visitante', value: fmt(profitPerVisitor), formula: 'Lucro Líquido / Visitantes', obj: 'Crescimento MoM', pri: '🟢' },
              { name: 'LTV (geral)', value: fmt(repeatCustomers.total > 0 ? grossRevenue / repeatCustomers.total : 0), formula: 'Receita Total / Clientes Únicos', obj: 'Crescimento', pri: '🟢' },
            ].map(row => (
              <tr key={row.name} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                <td className="px-4 py-2.5 font-bold">{row.value}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.formula}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.obj}</td>
                <td className="px-4 py-2.5 text-center">{row.pri}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
