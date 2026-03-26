import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, Clock, MessageCircle, Mail, CheckCircle2 } from 'lucide-react';

export default function FollowUp() {
  const { data: carts = [] } = useQuery({
    queryKey: ['admin-abandoned-carts'],
    queryFn: () => base44.entities.AbandonedCart.list('-created_date', 100),
  });

  const abandoned = carts.filter(c => !c.recovered);
  const recovered = carts.filter(c => c.recovered);
  const recoveryRate = carts.length > 0 ? ((recovered.length / carts.length) * 100).toFixed(1) : '0';

  const timeSince = (date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Follow-Up</h1>
        <p className="text-sm text-muted-foreground mt-1">Carrinhos abandonados e recuperação automática</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border p-5">
          <ShoppingCart className="w-5 h-5 text-orange-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{abandoned.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Carrinhos Abandonados</p>
        </div>
        <div className="bg-white border border-border p-5">
          <CheckCircle2 className="w-5 h-5 text-green-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold text-green-700">{recovered.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Recuperados</p>
        </div>
        <div className="bg-white border border-border p-5">
          <Clock className="w-5 h-5 text-blue-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{recoveryRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Taxa de Recuperação</p>
        </div>
      </div>

      {/* Follow-up Rules */}
      <div className="bg-white border border-border p-6 mb-8">
        <h2 className="text-sm font-bold mb-4">Regras de Follow-Up Automático</h2>
        <div className="space-y-3">
          {[
            { time: '20 minutos', icon: MessageCircle, channel: 'WhatsApp', desc: 'Mensagem lembrando do carrinho' },
            { time: '1 dia', icon: Mail, channel: 'E-mail', desc: 'E-mail com os itens do carrinho e link para finalizar' },
            { time: '3 dias', icon: Mail, channel: 'E-mail + WhatsApp', desc: 'Última tentativa com cupom de desconto' },
          ].map((rule, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-secondary/50 rounded">
              <div className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center flex-shrink-0">
                <rule.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Após {rule.time}</p>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
              <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 font-medium rounded">{rule.channel}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">O follow-up é executado automaticamente pelo servidor (requer backend rodando).</p>
      </div>

      {/* Abandoned List */}
      <div className="bg-white border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold">Carrinhos Abandonados Recentes</h2>
        </div>
        {abandoned.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Nenhum carrinho abandonado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {abandoned.slice(0, 20).map(cart => (
              <div key={cart.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cart.customer_name || cart.customer_email || 'Visitante'}</p>
                  <p className="text-xs text-muted-foreground">{cart.items?.length || 0} itens · R${cart.total?.toFixed(2)} · {timeSince(cart.created_date)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {cart.followup_20min && <span className="w-2 h-2 rounded-full bg-green-400" title="20min enviado" />}
                  {cart.followup_1day && <span className="w-2 h-2 rounded-full bg-blue-400" title="1 dia enviado" />}
                  {cart.followup_3days && <span className="w-2 h-2 rounded-full bg-purple-400" title="3 dias enviado" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
