import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export default function CategoryManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [newCat, setNewCat] = useState('');
  const [editName, setEditName] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list('display_order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.Category.create({ name, slug: name.toLowerCase().replace(/\s+/g, '-'), display_order: categories.length }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); setNewCat(''); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.Category.update(id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-8">Categorias</h1>

      {/* Add */}
      <div className="flex gap-3 mb-6">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nome da nova categoria"
          className="border border-border px-4 py-2.5 text-sm outline-none focus:border-foreground flex-1 max-w-sm"
          onKeyDown={(e) => e.key === 'Enter' && newCat.trim() && createMutation.mutate(newCat.trim())}
        />
        <button
          onClick={() => newCat.trim() && createMutation.mutate(newCat.trim())}
          className="bg-foreground text-background px-5 py-2.5 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-border">
        {categories.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">Nenhuma categoria ainda</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-6 py-3 border-b border-border last:border-0">
              {editing === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border border-border px-3 py-1.5 text-sm outline-none focus:border-foreground flex-1"
                    autoFocus
                  />
                  <button onClick={() => updateMutation.mutate({ id: cat.id, name: editName })} className="p-1.5 hover:bg-secondary">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-secondary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(cat.id); setEditName(cat.name); }} className="p-2 hover:bg-secondary">
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(cat.id); }} className="p-2 hover:bg-secondary text-destructive">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
