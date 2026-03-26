import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, X, Send, Calendar, Megaphone } from 'lucide-react';

const typeOptions = [
  { value: 'promotion', label: 'Promoção' },
  { value: 'holiday', label: 'Data Festiva' },
  { value: 'launch', label: 'Lançamento' },
  { value: 'newsletter', label: 'Newsletter' },
];

const holidayPresets = [
  'Dia das Mães', 'Dia dos Pais', 'Dia das Crianças', 'Dia da Mulher',
  'Natal', 'Black Friday', 'Ano Novo', 'Dia dos Namorados', 'Páscoa',
];

const statusLabels = { draft: 'Rascunho', scheduled: 'Agendada', sent: 'Enviada' };
const statusColors = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-50 text-blue-700', sent: 'bg-green-50 text-green-700' };

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'promotion', subject: '', body_html: '', status: 'draft', scheduled_at: '' });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] }),
  });

  const resetForm = () => { setForm({ name: '', type: 'promotion', subject: '', body_html: '', status: 'draft', scheduled_at: '' }); setShowForm(false); setEditingId(null); };

  const startEdit = (c) => {
    setForm({ name: c.name || '', type: c.type || 'promotion', subject: c.subject || '', body_html: c.body_html || '', status: c.status || 'draft', scheduled_at: c.scheduled_at ? c.scheduled_at.split('T')[0] : '', coupon_id: c.coupon_id || '' });
    setEditingId(c.id); setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null, coupon_id: form.coupon_id || null };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const sendCampaign = async (campaign) => {
    if (!confirm('Enviar esta campanha agora para toda a base?')) return;
    try {
      await fetch('/api/marketing/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    } catch (err) {
      alert('Erro ao enviar: ' + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie campanhas de e-mail, promoções e datas festivas</p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else { resetForm(); setShowForm(true); } }} className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nova Campanha'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-border p-6 mb-8 space-y-4">
          <h2 className="text-sm font-bold">{editingId ? 'Editar Campanha' : 'Criar Campanha'}</h2>

          {/* Holiday presets */}
          {form.type === 'holiday' && (
            <div>
              <label className="block text-xs font-medium mb-2">Atalho — Data Festiva:</label>
              <div className="flex flex-wrap gap-2">
                {holidayPresets.map(h => (
                  <button key={h} type="button" onClick={() => setForm(prev => ({ ...prev, name: h, subject: `${h} - Ofertas Especiais HOST Training` }))}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${form.name === h ? 'bg-foreground text-background' : 'border-border hover:border-foreground'}`}>{h}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Nome da Campanha</label>
              <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Black Friday 2026" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Tipo</label>
              <select value={form.type} onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none">
                {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Assunto do E-mail</label>
            <input value={form.subject} onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Assunto que aparecerá no e-mail" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Conteúdo do E-mail (HTML)</label>
            <textarea value={form.body_html} onChange={(e) => setForm(prev => ({ ...prev, body_html: e.target.value }))} rows={8} placeholder="<h1>Aproveite nossas ofertas!</h1><p>Descontos de até 50%...</p>" className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground resize-none font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Cupom Vinculado (opcional)</label>
              <select value={form.coupon_id || ''} onChange={(e) => setForm(prev => ({ ...prev, coupon_id: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none">
                <option value="">Nenhum</option>
                {coupons.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.code} — {c.type === 'percentage' ? `${c.value}%` : `R$${c.value}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Agendar Envio</label>
              <input type="date" value={form.scheduled_at} onChange={(e) => setForm(prev => ({ ...prev, scheduled_at: e.target.value }))} className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors">{editingId ? 'Salvar' : 'Criar Campanha'}</button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {campaigns.length === 0 ? (
          <div className="bg-white border border-border text-center py-16">
            <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada</p>
          </div>
        ) : campaigns.map(c => (
          <div key={c.id} className="bg-white border border-border p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold">{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded ${statusColors[c.status] || 'bg-gray-100'}`}>{statusLabels[c.status] || c.status}</span>
                {c.type === 'holiday' && <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 font-medium rounded">Festiva</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{c.subject || '(Sem assunto)'}</p>
              {c.sent_count > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">Enviado para {c.sent_count} contatos</p>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(c)} className="p-2 hover:bg-secondary transition-colors"><Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
              {c.status === 'draft' && (
                <button onClick={() => sendCampaign(c)} className="p-2 hover:bg-secondary transition-colors text-blue-600" title="Enviar agora"><Send className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
              )}
              <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(c.id); }} className="p-2 hover:bg-secondary text-destructive"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
