import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Upload, X, Pencil, ChevronUp, ChevronDown, Play, Image as ImageIcon } from 'lucide-react';

const emptyForm = {
  title: '',
  subtitle: '',
  description: '',
  button_text: 'Compre Agora',
  button_link: '/products',
  media_type: 'image',
  media_url: '',
  display_order: 0,
  active: true,
};

export default function BannerManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => base44.entities.Banner.list('display_order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Banner.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Banner.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Banner.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({ ...emptyForm, display_order: banners.length });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (banner) => {
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '/products',
      media_type: banner.media_type || 'image',
      media_url: banner.media_url || '',
      display_order: banner.display_order || 0,
      active: banner.active !== false,
    });
    setEditingId(banner.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({
      ...prev,
      media_url: file_url,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate({ ...form, display_order: banners.length });
    }
  };

  const moveOrder = async (banner, direction) => {
    const currentIdx = banners.findIndex(b => b.id === banner.id);
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const target = banners[targetIdx];
    await base44.entities.Banner.update(banner.id, { display_order: target.display_order });
    await base44.entities.Banner.update(target.id, { display_order: banner.display_order });
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
  };

  const toggleActive = (banner) => {
    updateMutation.mutate({ id: banner.id, data: { active: !banner.active } });
  };

  const isEditing = !!editingId;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners da Home</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie o carrossel de imagens e vídeos da página inicial</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else { setEditingId(null); setForm({ ...emptyForm, display_order: banners.length }); setShowForm(true); } }}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Banner'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-border p-6 mb-8 space-y-4">
          <h2 className="text-sm font-bold mb-2">{isEditing ? 'Editar Banner' : 'Adicionar Banner'}</h2>

          {/* Media Upload */}
          <div>
            <label className="block text-xs font-medium mb-1.5">Mídia (Imagem ou Vídeo)</label>
            {form.media_url ? (
              <div className="relative w-full max-w-md aspect-video bg-secondary overflow-hidden rounded">
                {form.media_type === 'video' ? (
                  <video src={form.media_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={form.media_url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, media_url: '', media_type: 'image' }))}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-md aspect-video border-2 border-dashed border-border rounded cursor-pointer hover:border-foreground transition-colors">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground">Clique para enviar imagem ou vídeo</span>
                    <span className="text-[10px] text-muted-foreground mt-1">JPG, PNG, MP4, WebM</span>
                  </>
                )}
                <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Ou cole uma URL diretamente:
            <div className="flex gap-2 mt-1">
              <input
                value={form.media_url}
                onChange={(e) => setForm(prev => ({ ...prev, media_url: e.target.value }))}
                placeholder="https://..."
                className="flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <select
                value={form.media_type}
                onChange={(e) => setForm(prev => ({ ...prev, media_type: e.target.value }))}
                className="border border-border px-3 py-2 text-sm outline-none"
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Subtítulo (topo)</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ex: Supere Seus Limites"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Título Principal</label>
              <input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Nova Coleção"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Texto descritivo do banner"
              rows={2}
              className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Texto do Botão</label>
              <input
                value={form.button_text}
                onChange={(e) => setForm(prev => ({ ...prev, button_text: e.target.value }))}
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Link do Botão</label>
              <input
                value={form.button_link}
                onChange={(e) => setForm(prev => ({ ...prev, button_link: e.target.value }))}
                placeholder="/products"
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!form.media_url || isSaving}
              className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Banner'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Banner List */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="bg-white border border-border text-center py-16">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhum banner cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione banners para exibir no carrossel da página inicial</p>
          </div>
        ) : (
          banners.map((banner, idx) => (
            <div key={banner.id} className={`bg-white border transition-colors ${editingId === banner.id ? 'border-foreground' : 'border-border'} flex items-center gap-4 p-4 ${!banner.active ? 'opacity-50' : ''}`}>
              {/* Thumbnail */}
              <div className="w-32 h-20 bg-secondary flex-shrink-0 overflow-hidden rounded relative">
                {banner.media_type === 'video' ? (
                  <>
                    <video src={banner.media_url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white drop-shadow" fill="white" />
                    </div>
                  </>
                ) : (
                  <img src={banner.media_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded ${banner.media_type === 'video' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                    {banner.media_type === 'video' ? 'Vídeo' : 'Imagem'}
                  </span>
                  {!banner.active && (
                    <span className="text-[10px] px-1.5 py-0.5 font-medium bg-gray-100 text-gray-500 rounded">Inativo</span>
                  )}
                </div>
                <p className="text-sm font-medium truncate mt-1">{banner.title || '(Sem título)'}</p>
                {banner.subtitle && <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>}
                {banner.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{banner.description}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => startEdit(banner)}
                  className="p-2 hover:bg-secondary transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => moveOrder(banner, 'up')}
                  disabled={idx === 0}
                  className="p-2 hover:bg-secondary transition-colors disabled:opacity-30"
                  title="Mover para cima"
                >
                  <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => moveOrder(banner, 'down')}
                  disabled={idx === banners.length - 1}
                  className="p-2 hover:bg-secondary transition-colors disabled:opacity-30"
                  title="Mover para baixo"
                >
                  <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => toggleActive(banner)}
                  className={`p-2 text-xs font-medium border transition-colors ${banner.active ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                  title={banner.active ? 'Desativar' : 'Ativar'}
                >
                  {banner.active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  onClick={() => { if (confirm('Excluir este banner?')) deleteMutation.mutate(banner.id); }}
                  className="p-2 hover:bg-secondary transition-colors text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
