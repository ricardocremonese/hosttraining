import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Package, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600 bg-yellow-50', step: 1 },
  confirmed: { label: 'Confirmado', icon: CheckCircle2, color: 'text-blue-600 bg-blue-50', step: 2 },
  shipped: { label: 'Enviado', icon: Truck, color: 'text-purple-600 bg-purple-50', step: 3 },
  delivered: { label: 'Entregue', icon: CheckCircle2, color: 'text-green-600 bg-green-50', step: 4 },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600 bg-red-50', step: 0 },
};

const steps = [
  { key: 'pending', label: 'Pedido Recebido' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'shipped', label: 'Enviado' },
  { key: 'delivered', label: 'Entregue' },
];

export default function OrderTracking() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get('pedido') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);

    try {
      const results = await base44.entities.Order.filter({ order_number: query.trim().toUpperCase() });
      if (results.length > 0) {
        setOrder(results[0]);
      } else {
        setError('Pedido não encontrado. Verifique o número e tente novamente.');
      }
    } catch {
      setError('Erro ao buscar pedido. Tente novamente.');
    }
    setLoading(false);
  };

  // Auto-search if URL has pedido param
  React.useEffect(() => {
    if (params.get('pedido')) handleSearch();
  }, []);

  const status = order ? statusConfig[order.status] || statusConfig.pending : null;
  const currentStep = status?.step || 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <Package className="w-10 h-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold tracking-tight mb-2">Acompanhe seu Pedido</h1>
        <p className="text-sm text-muted-foreground">Digite o número do pedido para ver o status</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Número do pedido (ex: HT-XXXXXX)"
            className="w-full border border-border pl-11 pr-4 py-3.5 text-sm outline-none focus:border-foreground transition-colors uppercase font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-foreground text-background px-6 py-3.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Order Found */}
      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-white border border-border p-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pedido</p>
              <p className="text-lg font-mono font-bold">{order.order_number || `#${order.id?.slice(-6)}`}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${status.color}`}>
              <status.icon className="w-4 h-4" />
              {status.label}
            </div>
          </div>

          {/* Progress Steps */}
          {order.status !== 'cancelled' && (
            <div className="bg-white border border-border p-6">
              <div className="flex items-center justify-between">
                {steps.map((s, idx) => {
                  const isActive = currentStep >= idx + 1;
                  const isCurrent = currentStep === idx + 1;
                  return (
                    <React.Fragment key={s.key}>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isActive ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
                        } ${isCurrent ? 'ring-2 ring-foreground ring-offset-2' : ''}`}>
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] font-medium text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${currentStep > idx + 1 ? 'bg-foreground' : 'bg-secondary'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="bg-white border border-border p-6 space-y-4">
            <h3 className="text-sm font-bold">Detalhes do Pedido</h3>
            <div className="divide-y divide-border">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-3">
                  <div className="w-12 h-12 bg-secondary flex-shrink-0 overflow-hidden">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.size} / Qtd {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">R${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R${order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Frete</span>
                <span>{order.shipping_cost === 0 ? 'Grátis' : `R$${order.shipping_cost?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span>Total</span>
                <span>R${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white border border-border p-6">
              <h3 className="text-sm font-bold mb-2">Endereço de Entrega</h3>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{order.shipping_address.street}{order.shipping_address.number ? `, ${order.shipping_address.number}` : ''}</p>
                {order.shipping_address.complement && <p>{order.shipping_address.complement}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zip}</p>
                {order.shipping_address.observation && (
                  <p className="mt-1 text-amber-700 bg-amber-50 px-2 py-1 rounded">OBS: {order.shipping_address.observation}</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
