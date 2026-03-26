import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Cake, Gift, ChevronLeft, ChevronRight, MessageCircle, Mail, Copy, Check } from 'lucide-react';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Birthdays() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [copiedCode, setCopiedCode] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders-birthdays'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date', 50),
  });

  // Extrair clientes únicos com data de aniversário
  const allCustomers = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!o.customer_birthday || !o.customer_cpf) return;
      const cpf = o.customer_cpf.replace(/\D/g, '');
      if (!map.has(cpf)) {
        map.set(cpf, {
          cpf: o.customer_cpf,
          name: o.customer_name || '',
          email: o.customer_email || '',
          phone: o.customer_phone || '',
          birthday: o.customer_birthday,
          orders: 0,
          totalSpent: 0,
        });
      }
      const c = map.get(cpf);
      c.orders += 1;
      c.totalSpent += o.total || 0;
      // Pega dados mais recentes
      if (o.customer_name) c.name = o.customer_name;
      if (o.customer_email) c.email = o.customer_email;
      if (o.customer_phone) c.phone = o.customer_phone;
    });
    return Array.from(map.values());
  }, [orders]);

  // Filtrar aniversariantes do mês selecionado
  const birthdayCustomers = useMemo(() => {
    return allCustomers
      .filter(c => {
        const d = new Date(c.birthday + 'T00:00:00');
        return d.getMonth() === selectedMonth;
      })
      .sort((a, b) => {
        const dayA = new Date(a.birthday + 'T00:00:00').getDate();
        const dayB = new Date(b.birthday + 'T00:00:00').getDate();
        return dayA - dayB;
      });
  }, [allCustomers, selectedMonth]);

  // Aniversariantes de hoje
  const todayBirthdays = allCustomers.filter(c => {
    const d = new Date(c.birthday + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });

  const prevMonth = () => setSelectedMonth(m => m === 0 ? 11 : m - 1);
  const nextMonth = () => setSelectedMonth(m => m === 11 ? 0 : m + 1);

  const formatBirthday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const getAge = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const age = now.getFullYear() - d.getFullYear();
    return age > 0 && age < 120 ? age : null;
  };

  const sendWhatsApp = (customer, couponCode) => {
    const firstName = customer.name.split(' ')[0];
    const phone = customer.phone.replace(/\D/g, '');
    const msg = couponCode
      ? `Parabéns, ${firstName}! 🎂🎉\n\nA HOST Training deseja um Feliz Aniversário!\n\nPresente especial pra você: use o cupom *${couponCode}* e ganhe desconto na sua próxima compra!\n\n🛒 hosttraining.com.br\n\nAproveite! 🎁`
      : `Parabéns, ${firstName}! 🎂🎉\n\nA HOST Training deseja um Feliz Aniversário!\n\nPasse na loja e confira nossas ofertas especiais!\n\n🛒 hosttraining.com.br`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const activeCoupons = coupons.filter(c => c.active);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-500" /> Aniversariantes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Envie parabéns e cupons para aniversariantes do mês</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-border px-2 py-1">
          <button onClick={prevMonth} className="p-1 hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium w-28 text-center">{monthNames[selectedMonth]}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Today */}
      {todayBirthdays.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-5 h-5 text-pink-500" />
            <h2 className="text-sm font-bold text-pink-800">Aniversariantes de Hoje! 🎉</h2>
          </div>
          <div className="space-y-2">
            {todayBirthdays.map(c => (
              <div key={c.cpf} className="flex items-center justify-between bg-white p-3 rounded border border-pink-100">
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone} · {c.email}</p>
                </div>
                <button onClick={() => sendWhatsApp(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> Enviar Parabéns
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border p-5">
          <Cake className="w-5 h-5 text-pink-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{birthdayCustomers.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Aniversariantes em {monthNames[selectedMonth]}</p>
        </div>
        <div className="bg-white border border-border p-5">
          <Gift className="w-5 h-5 text-purple-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{allCustomers.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Clientes com Aniversário Cadastrado</p>
        </div>
        <div className="bg-white border border-border p-5">
          <Cake className="w-5 h-5 text-amber-500 mb-3" strokeWidth={1.5} />
          <p className="text-xl font-bold">{todayBirthdays.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Aniversariantes Hoje</p>
        </div>
      </div>

      {/* Cupom selector */}
      {activeCoupons.length > 0 && (
        <div className="bg-white border border-border p-4 mb-6">
          <p className="text-xs font-bold mb-2">Cupons ativos para enviar junto com parabéns:</p>
          <div className="flex flex-wrap gap-2">
            {activeCoupons.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-xs font-mono">
                <span>{c.code}</span>
                <span className="text-muted-foreground">({c.type === 'percentage' ? `${c.value}%` : `R$${c.value}`})</span>
                <button onClick={() => copyCode(c.code)} className="ml-1">
                  {copiedCode === c.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold">Aniversariantes de {monthNames[selectedMonth]} ({birthdayCustomers.length})</h2>
        </div>
        {birthdayCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Cake className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum aniversariante em {monthNames[selectedMonth]}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {birthdayCustomers.map(customer => {
              const age = getAge(customer.birthday);
              const isToday = new Date(customer.birthday + 'T00:00:00').getDate() === now.getDate() && selectedMonth === now.getMonth();
              return (
                <div key={customer.cpf} className={`px-4 py-3 flex items-center justify-between ${isToday ? 'bg-pink-50' : 'hover:bg-secondary/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-pink-200 text-pink-700' : 'bg-secondary text-muted-foreground'}`}>
                      {formatBirthday(customer.birthday).split('/')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{customer.name}</p>
                        {isToday && <span className="text-[10px] px-1.5 py-0.5 bg-pink-200 text-pink-700 font-medium rounded">HOJE! 🎂</span>}
                        {age && <span className="text-[10px] text-muted-foreground">{age} anos</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {customer.phone} · {customer.orders} pedido{customer.orders !== 1 ? 's' : ''} · R${customer.totalSpent.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {customer.phone && (
                      <button
                        onClick={() => sendWhatsApp(customer, activeCoupons[0]?.code)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 border border-green-200 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </button>
                    )}
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}?subject=Feliz Aniversário! 🎂 - HOST Training&body=Parabéns ${customer.name.split(' ')[0]}! A HOST Training deseja um excelente aniversário!`}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors"
                        title="E-mail"
                      >
                        <Mail className="w-3 h-3" /> E-mail
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
