import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, X, Copy, Check, Ticket } from 'lucide-react';

const emptyForm = { code: '', type: 'percentage', value: '', free_shipping: false, min_order: '', max_uses: '', expires_at: '', active: true };

export default function Coupons() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [copiedCode, setCopiedCode] = useState(null);

  const { data: coupons = [] } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const resetForm = () => { setForm({ ...emptyForm }); setShowForm(false); setEditingId(null); };

  const startEdit = (c) => {
    setForm({ code: c.code, type: c.type || 'percentage', value: c.value?.toString() || '', free_shipping: c.free_shipping || false, min_order: c.min_order?.toString() || '', max_uses: c.max_uses?.toString() || '', expires_at: c.expires_at ? c.expires_at.split('T')[0] : '', active: c.active !== false });
    setEditingId(c.id);
    setShowForm(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = 'HOST' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(prev => ({ ...prev, code }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, code: form.code.toUpperCase(), value: parseFloat(form.value) || 0, min_order: parseFloat(form.min_order) || 0, max_uses: parseInt(form.max_uses) || 0, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const copyCode = (code) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cupons</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie cupons de desconto e frete grátis</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true); generateCode(); } }} className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Cupom'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-border p-6 mb-8 space-y-4">
          <h2 className="text-sm font-bold">{editingId ? 'Editar Cupom' : 'Criar Cupom'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Código do Cupom</label>
              <div className="flex gap-2">
                <input value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="HOSTDESC10" className="flex-1 border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground font-mono uppercase" required />
                <button type="button" onClick={generateCode} className="px-3 py-2.5 text-xs font-medium border border-border hover:border-foreground transition-colors">Gerar</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Tipo</label>
              <select value={form.type} onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none">
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">{form.type === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}</label>
              <input type="number" step="0.01" value={form.value} onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))} placeholder="10" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Pedido Mínimo (R$)</label>
              <input type="number" step="0.01" value={form.min_order} onChange={(e) => setForm(prev => ({ ...prev, min_order: e.target.value }))} placeholder="0" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Máximo de Usos (0 = ilimitado)</label>
              <input type="number" value={form.max_uses} onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))} placeholder="0" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Validade</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input type="checkbox" checked={form.free_shipping} onChange={(e) => setForm(prev => ({ ...prev, free_shipping: e.target.checked }))} className="accent-foreground w-4 h-4" />
                <span className="text-sm font-medium">Frete Grátis</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">{editingId ? 'Salvar' : 'Criar Cupom'}</button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {coupons.length === 0 ? (
          <div className="bg-white border border-border text-center py-16">
            <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhum cupom criado</p>
          </div>
        ) : coupons.map(c => (
          <div key={c.id} className={`bg-white border border-border p-4 flex items-center gap-4 ${!c.active ? 'opacity-50' : ''}`}>
            <div className="w-12 h-12 bg-secondary flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold">{c.code}</span>
                <button onClick={() => copyCode(c.code)} className="p-0.5">
                  {copiedCode === c.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
                {c.free_shipping && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-medium rounded">Frete Grátis</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.type === 'percentage' ? `${c.value}% de desconto` : `R$${c.value?.toFixed(2)} de desconto`}
                {c.min_order > 0 && ` · Mín. R$${c.min_order?.toFixed(2)}`}
                {c.max_uses > 0 && ` · ${c.used_count || 0}/${c.max_uses} usos`}
                {c.expires_at && ` · Até ${new Date(c.expires_at).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(c)} className="p-2 hover:bg-secondary transition-colors"><Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
              <button onClick={() => updateMutation.mutate({ id: c.id, data: { active: !c.active } })} className={`p-2 text-xs font-medium border ${c.active ? 'border-green-200 text-green-700' : 'border-border text-muted-foreground'}`}>{c.active ? 'Ativo' : 'Off'}</button>
              <button onClick={() => { if (confirm('Excluir cupom?')) deleteMutation.mutate(c.id); }} className="p-2 hover:bg-secondary text-destructive"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
