import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusLabels = { pending: 'Pendente', confirmed: 'Confirmado', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };

export default function OrderList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-8">Pedidos</h1>

      {/* Filters */}
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
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-20" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-24" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-8" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-16" /></td>
                  <td className="px-6 py-4"><div className="h-4 bg-secondary w-16" /></td>
                  <td className="px-6 py-4" />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-sm text-muted-foreground py-12">Nenhum pedido encontrado</td>
              </tr>
            ) : (
              filtered.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-border hover:bg-nike-lightgray transition-colors cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <td className="px-6 py-3 text-xs font-mono">#{order.id?.slice(-6)}</td>
                    <td className="px-6 py-3 text-xs">{order.customer_name || '—'}</td>
                    <td className="px-6 py-3 text-xs">{order.items?.length || 0}</td>
                    <td className="px-6 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => { e.stopPropagation(); updateMutation.mutate({ id: order.id, status: e.target.value }); }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-transparent border border-border px-2 py-1 outline-none cursor-pointer"
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
                            <div className="p-6 grid md:grid-cols-3 gap-6">
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
