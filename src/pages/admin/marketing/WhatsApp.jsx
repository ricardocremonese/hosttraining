import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, Users, Copy, Check, ExternalLink } from 'lucide-react';

export default function WhatsAppMarketing() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedPhones, setSelectedPhones] = useState(new Set());

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders-all'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  // Extrair contatos únicos com WhatsApp
  const contacts = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      const phone = o.customer_phone?.replace(/\D/g, '');
      if (phone && phone.length >= 10 && !map.has(phone)) {
        map.set(phone, {
          phone,
          phoneFormatted: o.customer_phone,
          name: o.customer_name || '',
          email: o.customer_email || '',
          orders: 0,
        });
      }
      if (phone && map.has(phone)) {
        map.get(phone).orders += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.orders - a.orders);
  }, [orders]);

  const templates = [
    { label: 'Promoção', text: 'Olá {nome}! 🔥\n\nTemos ofertas incríveis na HOST Training!\n\nAcesse: hosttraining.com.br\n\nAproveite antes que acabe! 🎯' },
    { label: 'Novidade', text: 'Oi {nome}! 👋\n\nNovos produtos acabaram de chegar na HOST Training!\n\nConfira: hosttraining.com.br\n\nQualquer dúvida, estamos à disposição! 💪' },
    { label: 'Cupom', text: 'Olá {nome}! 🎁\n\nPresente especial para você:\n\nUse o cupom *HOSTDESC10* e ganhe 10% OFF em toda a loja!\n\n🛒 hosttraining.com.br\n\nVálido por tempo limitado! ⏰' },
    { label: 'Recompra', text: 'Ei {nome}! 😊\n\nSentimos sua falta na HOST Training!\n\nQue tal dar uma olhada nas novidades?\n\n👉 hosttraining.com.br\n\nTe esperamos! 🎯' },
  ];

  const openWhatsApp = (contact) => {
    const text = message.replace(/\{nome\}/g, contact.name.split(' ')[0] || 'cliente');
    window.open(`https://wa.me/55${contact.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const selectedContacts = contacts.filter(c => selectedPhones.has(c.phone));
  const sendCount = selectedPhones.size > 0 ? selectedPhones.size : contacts.length;
  const contactsToSend = selectedPhones.size > 0 ? selectedContacts : contacts;

  const toggleSelect = (phone) => {
    setSelectedPhones(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhones.size === contacts.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(contacts.map(c => c.phone)));
    }
  };

  const openSelectedSequential = () => {
    if (!message.trim() || contactsToSend.length === 0) return;
    setSending(true);
    contactsToSend.forEach((contact, idx) => {
      setTimeout(() => {
        openWhatsApp(contact);
        if (idx === contactsToSend.length - 1) {
          setSending(false);
          setSent(true);
          setTimeout(() => setSent(false), 3000);
        }
      }, idx * 800);
    });
  };

  const copySelectedNumbers = () => {
    const numbers = contactsToSend.map(c => `55${c.phone}`).join('\n');
    navigator.clipboard.writeText(numbers);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-green-500" /> WhatsApp Marketing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Envie mensagens para sua base de clientes via WhatsApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-border p-5">
          <Users className="w-5 h-5 text-green-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{contacts.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Contatos com WhatsApp</p>
        </div>
        <div className="bg-white border border-border p-5">
          <MessageCircle className="w-5 h-5 text-muted-foreground mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{orders.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Pedidos na Base</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Message Editor */}
        <div>
          <div className="bg-white border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold">Mensagem</h2>

            <div>
              <label className="block text-xs font-medium mb-2">Templates prontos:</label>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button key={t.label} onClick={() => setMessage(t.text)}
                    className="px-3 py-1.5 text-xs font-medium border border-border hover:border-foreground transition-colors">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">
                Texto da mensagem <span className="text-muted-foreground">(use {'{nome}'} para personalizar)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Olá {nome}! ..."
                className="w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openSelectedSequential}
                disabled={!message.trim() || contactsToSend.length === 0 || sending}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Abrindo...' : sent ? 'Enviado!' : `Enviar para ${sendCount} contato${sendCount !== 1 ? 's' : ''}`}
              </button>
              <button onClick={copySelectedNumbers} className="px-4 py-3 text-sm font-medium border border-border hover:border-foreground transition-colors">
                {copiedAll ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {selectedPhones.size > 0 && (
              <p className="text-[10px] text-green-700 font-medium">{selectedPhones.size} contato{selectedPhones.size !== 1 ? 's' : ''} selecionado{selectedPhones.size !== 1 ? 's' : ''}</p>
            )}

            <p className="text-[10px] text-muted-foreground">
              Cada contato abre em uma nova aba do WhatsApp Web com a mensagem preenchida.
            </p>
          </div>
        </div>

        {/* Contacts List */}
        <div>
          <div className="bg-white border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPhones.size === contacts.length && contacts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-bold">Contatos ({contacts.length})</span>
                </label>
              </div>
              {selectedPhones.size > 0 && (
                <span className="text-xs text-green-700 font-medium">{selectedPhones.size} selecionado{selectedPhones.size !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">Nenhum contato com WhatsApp</div>
              ) : contacts.map(contact => (
                <div key={contact.phone} className={`px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors ${selectedPhones.has(contact.phone) ? 'bg-green-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedPhones.has(contact.phone)}
                    onChange={() => toggleSelect(contact.phone)}
                    className="w-4 h-4 accent-green-600 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{contact.name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{contact.phoneFormatted} · {contact.orders} pedido{contact.orders !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => openWhatsApp(contact)}
                    disabled={!message.trim()}
                    className="p-2 hover:bg-green-50 text-green-600 transition-colors disabled:opacity-30"
                    title="Enviar individual"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
