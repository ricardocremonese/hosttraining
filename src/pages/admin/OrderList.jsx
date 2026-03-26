import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Search, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusLabels = { pending: 'Pendente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };
const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function OrderList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const filtered = useMemo(() => {
    let result = orders;
    if (filter !== 'all') result = result.filter(o => o.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(o =>
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_cpf || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (o.customer_email || '').toLowerCase().includes(q) ||
        (o.customer_phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      );
    }
    return result;
  }, [orders, filter, search]);

  const copyOrderNumber = (num, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
        <span className="text-sm text-muted-foreground">{orders.length} total</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número do pedido, nome, CPF, e-mail ou WhatsApp..."
          className="w-full border border-border pl-11 pr-4 py-3 text-sm outline-none focus:border-foreground transition-colors bg-white"
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', ...statusOptions].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-xs font-medium capitalize whitespace-nowrap transition-colors ${
              filter === s ? 'bg-foreground text-background' : 'bg-white border border-border hover:border-foreground'
            }`}
          >
            {s === 'all' ? 'Todos' : statusLabels[s]} {s !== 'all' && `(${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-nike-lightgray">
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Pedido</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Cliente</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Itens</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Total</th>
              <th className="px-6 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-border animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-8" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-16" /></td>
                  <td className="px-6 py-4" />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  {search ? 'Nenhum pedido encontrado para esta busca' : 'Nenhum pedido encontrado'}
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-border hover:bg-nike-lightgray transition-colors cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold">{order.order_number || `#${order.id?.slice(-6)}`}</span>
                        {order.order_number && (
                          <button
                            onClick={(e) => copyOrderNumber(order.order_number, e)}
                            className="p-0.5 hover:bg-secondary rounded transition-colors"
                            title="Copiar número"
                          >
                            {copiedId === order.order_number ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium">{order.customer_name || '—'}</p>
                      {order.customer_cpf && <p className="text-[10px] text-muted-foreground">CPF: {order.customer_cpf}</p>}
                    </td>
                    <td className="px-6 py-3 text-xs">{order.items?.length || 0}</td>
                    <td className="px-6 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => { e.stopPropagation(); updateMutation.mutate({ id: order.id, status: e.target.value }); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium border px-2 py-1 outline-none cursor-pointer ${statusColors[order.status] || 'border-border'}`}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-3 text-xs font-medium text-right">R${order.total?.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={6}>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-nike-lightgray"
                          >
                            <div className="p-6 grid md:grid-cols-4 gap-6">
                              <div>
                                <p className="text-xs font-bold mb-2">Cliente</p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>{order.customer_name}</p>
                                  {order.customer_cpf && <p>CPF: {order.customer_cpf}</p>}
                                  {order.customer_email && <p>{order.customer_email}</p>}
                                  {order.customer_phone && (
                                    <p>
                                      <a href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                        WhatsApp: {order.customer_phone}
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold mb-2">Itens</p>
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground mb-1">
                                    {item.product_name} — {item.size} × {item.quantity} — R${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-bold mb-2">Endereço de Entrega</p>
                                {order.shipping_address ? (
                                  <div className="text-xs text-muted-foreground">
                                    <p>{order.shipping_address.street}</p>
                                    {order.shipping_address.complement && <p>{order.shipping_address.complement}</p>}
                                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Sem endereço</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold mb-2">Pagamento</p>
                                <p className="text-xs text-muted-foreground capitalize">{order.payment_status === 'paid' ? 'Pago' : order.payment_status}</p>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
