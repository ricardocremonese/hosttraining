import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, AlertTriangle, Target, TrendingUp, Users, ShoppingCart, CreditCard, Eye, MessageCircle, ArrowRight, Shield, Star, DollarSign, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

export default function Metrics() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: views = [] } = useQuery({
    queryKey: ['admin-product-views'],
    queryFn: () => base44.entities.ProductView.list('-created_date', 5000),
  });

  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ['admin-abandoned-carts'],
    queryFn: () => base44.entities.AbandonedCart.list('-created_date', 500),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 200),
  });

  const paidStatuses = ['confirmed', 'shipped', 'delivered'];
  const paidOrders = orders.filter(o => paidStatuses.includes(o.status));

  // =============================================
  // 1. TEMPO ATÉ A PRIMEIRA COMPRA
  // =============================================
  const timeToFirstPurchase = useMemo(() => {
    // Agrupar por CPF/email, pegar primeira visita e primeira compra
    const customerMap = {};

    // Primeira visita por session -> mapear sessions para ordens
    views.forEach(v => {
      if (!v.session_id) return;
      if (!customerMap[v.session_id]) {
        customerMap[v.session_id] = { firstView: new Date(v.created_date), purchased: false, purchaseDate: null };
      }
      const d = new Date(v.created_date);
      if (d < customerMap[v.session_id].firstView) {
        customerMap[v.session_id].firstView = d;
      }
    });

    // Mapear compras por CPF
    const cpfFirstPurchase = {};
    paidOrders.forEach(o => {
      const key = o.customer_cpf || o.customer_email;
      if (!key) return;
      const d = new Date(o.created_date);
      if (!cpfFirstPurchase[key] || d < cpfFirstPurchase[key]) {
        cpfFirstPurchase[key] = d;
      }
    });

    // Calcular tempo médio entre primeira visita e primeira compra
    // Usando as views com session_id que eventualmente compraram
    const times = [];
    const cpfFirstView = {};

    views.forEach(v => {
      if (!v.session_id) return;
      // Tentar associar session a compras pelo tempo próximo
    });

    // Abordagem simplificada: tempo entre criação da conta (primeiro pedido) e padrão de compra
    const cpfData = {};
    orders.forEach(o => {
      const key = o.customer_cpf?.replace(/\D/g, '') || o.customer_email;
      if (!key) return;
      if (!cpfData[key]) cpfData[key] = { orders: [], firstOrder: new Date(o.created_date) };
      cpfData[key].orders.push(o);
      const d = new Date(o.created_date);
      if (d < cpfData[key].firstOrder) cpfData[key].firstOrder = d;
    });

    // Distribuição por faixa de tempo (primeiro pedido desde primeira visita no site)
    const brackets = { 'Mesmo dia': 0, '1-3 dias': 0, '4-7 dias': 0, '8-15 dias': 0, '16-30 dias': 0, '30+ dias': 0 };
    let totalDays = 0;
    let count = 0;

    // Usar data do primeiro pedido vs data mais antiga de views do mesmo produto
    Object.values(cpfData).forEach(c => {
      if (c.orders.length === 0) return;
      // Estimar: se tem views antes do pedido, calcular diferença
      const firstPurchaseDate = c.firstOrder;
      const relatedViews = views.filter(v => {
        const vDate = new Date(v.created_date);
        return vDate <= firstPurchaseDate && (firstPurchaseDate - vDate) < 30 * 24 * 60 * 60 * 1000;
      });

      if (relatedViews.length > 0) {
        const firstViewDate = new Date(Math.min(...relatedViews.map(v => new Date(v.created_date).getTime())));
        const diffDays = Math.floor((firstPurchaseDate - firstViewDate) / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        count++;

        if (diffDays === 0) brackets['Mesmo dia']++;
        else if (diffDays <= 3) brackets['1-3 dias']++;
        else if (diffDays <= 7) brackets['4-7 dias']++;
        else if (diffDays <= 15) brackets['8-15 dias']++;
        else if (diffDays <= 30) brackets['16-30 dias']++;
        else brackets['30+ dias']++;
      } else {
        brackets['Mesmo dia']++;
        count++;
      }
    });

    const avgDays = count > 0 ? (totalDays / count).toFixed(1) : '0';
    const chartData = Object.entries(brackets).map(([name, value]) => ({ name, value }));

    return { avgDays, totalCustomers: Object.keys(cpfData).length, chartData };
  }, [orders, views]);

  // =============================================
  // 2. ÍNDICE DE FRICÇÃO DO CHECKOUT
  // =============================================
  const frictionIndex = useMemo(() => {
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const pendingPayment = orders.filter(o => o.payment_status === 'pending' && o.status !== 'cancelled').length;
    const totalAbandoned = abandonedCarts.length;
    const recovered = abandonedCarts.filter(c => c.recovered).length;

    // Métricas de fricção
    const abandonRate = totalOrders + totalAbandoned > 0
      ? ((totalAbandoned / (totalOrders + totalAbandoned)) * 100).toFixed(1)
      : '0';

    const paymentFailRate = totalOrders > 0
      ? ((pendingPayment / totalOrders) * 100).toFixed(1)
      : '0';

    const cancelRate = totalOrders > 0
      ? ((cancelledOrders / totalOrders) * 100).toFixed(1)
      : '0';

    // Índice composto (0-100, menor = melhor)
    const index = Math.min(100, Math.round(
      (parseFloat(abandonRate) * 0.4) +
      (parseFloat(paymentFailRate) * 0.3) +
      (parseFloat(cancelRate) * 0.3)
    ));

    const level = index <= 20 ? { label: 'Excelente', color: 'text-green-700 bg-green-50' }
      : index <= 40 ? { label: 'Bom', color: 'text-blue-700 bg-blue-50' }
      : index <= 60 ? { label: 'Atenção', color: 'text-yellow-700 bg-yellow-50' }
      : { label: 'Crítico', color: 'text-red-700 bg-red-50' };

    return {
      index, level, abandonRate, paymentFailRate, cancelRate,
      totalOrders, totalAbandoned, cancelledOrders, pendingPayment, recovered,
    };
  }, [orders, abandonedCarts]);

  // =============================================
  // 3. INTENÇÃO FORTE SEM COMPRA
  // =============================================
  const strongIntent = useMemo(() => {
    const purchasedProductIds = new Set();
    paidOrders.forEach(o => {
      (o.items || []).forEach(item => { if (item.product_id) purchasedProductIds.add(item.product_id); });
    });

    // Agrupar views por produto + session
    const productSessions = {};
    views.forEach(v => {
      const key = `${v.product_id}`;
      if (!productSessions[key]) {
        productSessions[key] = {
          product_id: v.product_id,
          product_name: v.product_name,
          sessions: new Set(),
          totalViews: 0,
          purchased: purchasedProductIds.has(v.product_id),
        };
      }
      productSessions[key].totalViews++;
      if (v.session_id) productSessions[key].sessions.add(v.session_id);
    });

    // Filtrar: muitas visitas (3+) mas sem compra
    const highIntent = Object.values(productSessions)
      .filter(p => !p.purchased && (p.totalViews >= 3 || p.sessions.size >= 2))
      .map(p => {
        const product = products.find(pr => pr.id === p.product_id);
        return {
          ...p,
          uniqueVisitors: p.sessions.size,
          image: product?.images?.[0] || '',
          price: product?.price || 0,
          category: product?.category || '',
          intentScore: Math.min(100, Math.round((p.totalViews * 10) + (p.sessions.size * 15))),
        };
      })
      .sort((a, b) => b.intentScore - a.intentScore);

    // Clientes com carrinho abandonado que visitaram múltiplas vezes
    const cartAbandoners = abandonedCarts.filter(c => !c.recovered && c.customer_phone);

    return { highIntent, cartAbandoners, total: highIntent.length };
  }, [views, products, paidOrders, abandonedCarts]);

  // =============================================
  // 4. LTV PREDITIVO
  // =============================================
  const ltvPredictive = useMemo(() => {
    const customerMap = {};
    orders.forEach(o => {
      const key = o.customer_cpf?.replace(/\D/g, '') || o.customer_email;
      if (!key) return;
      if (!customerMap[key]) {
        customerMap[key] = {
          name: o.customer_name || '',
          email: o.customer_email || '',
          phone: o.customer_phone || '',
          cpf: o.customer_cpf || '',
          orders: [],
          totalSpent: 0,
          firstOrderDate: new Date(o.created_date),
          lastOrderDate: new Date(o.created_date),
          categories: new Set(),
          usedCoupon: false,
        };
      }
      const c = customerMap[key];
      if (paidStatuses.includes(o.status)) {
        c.totalSpent += o.total || 0;
        c.orders.push(o);
        const d = new Date(o.created_date);
        if (d < c.firstOrderDate) c.firstOrderDate = d;
        if (d > c.lastOrderDate) c.lastOrderDate = d;
        (o.items || []).forEach(item => { if (item.product_name) c.categories.add(item.product_name); });
      }
      if (o.customer_name) c.name = o.customer_name;
    });

    const customers = Object.values(customerMap)
      .filter(c => c.orders.length > 0)
      .map(c => {
        const daysSinceFirst = Math.max(1, Math.floor((Date.now() - c.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)));
        const avgOrderValue = c.totalSpent / c.orders.length;
        const orderFrequency = c.orders.length / Math.max(1, daysSinceFirst / 30); // pedidos por mês
        const daysBetweenOrders = c.orders.length > 1
          ? Math.floor((c.lastOrderDate - c.firstOrderDate) / (1000 * 60 * 60 * 24) / (c.orders.length - 1))
          : null;

        // Score LTV preditivo (0-100)
        let score = 0;
        score += Math.min(30, avgOrderValue / 10); // valor médio alto = bom
        score += Math.min(25, c.orders.length * 8); // recorrência
        score += Math.min(20, c.categories.size * 5); // variedade de categorias
        score += Math.min(15, orderFrequency * 10); // frequência
        score += daysBetweenOrders !== null && daysBetweenOrders < 30 ? 10 : 0; // volta rápido

        const predictedLTV12m = avgOrderValue * orderFrequency * 12;

        const tier = score >= 70 ? { label: 'VIP', color: 'bg-amber-100 text-amber-800 border-amber-300' }
          : score >= 40 ? { label: 'Regular', color: 'bg-blue-50 text-blue-700 border-blue-200' }
          : { label: 'Novo', color: 'bg-gray-100 text-gray-600 border-gray-200' };

        return {
          ...c,
          avgOrderValue,
          orderFrequency,
          daysBetweenOrders,
          score: Math.round(score),
          predictedLTV12m,
          tier,
          categoriesCount: c.categories.size,
        };
      })
      .sort((a, b) => b.score - a.score);

    const avgLTV = customers.length > 0
      ? customers.reduce((sum, c) => sum + c.predictedLTV12m, 0) / customers.length
      : 0;

    const tierDistribution = [
      { name: 'VIP', value: customers.filter(c => c.score >= 70).length },
      { name: 'Regular', value: customers.filter(c => c.score >= 40 && c.score < 70).length },
      { name: 'Novo', value: customers.filter(c => c.score < 40).length },
    ];

    return { customers, avgLTV, tierDistribution };
  }, [orders]);

  // =============================================
  // 5. ÍNDICE DE QUALIDADE DA RECEITA
  // =============================================
  const revenueQuality = useMemo(() => {
    if (paidOrders.length === 0) return { score: 0, level: { label: 'Sem dados', color: 'bg-gray-100 text-gray-500' }, details: [], orders: [] };

    const analyzed = paidOrders.map(o => {
      let score = 50; // base

      // Valor do pedido (maior = melhor)
      const total = o.total || 0;
      if (total >= 500) score += 15;
      else if (total >= 200) score += 10;
      else if (total >= 100) score += 5;

      // Múltiplos itens (cross-sell = bom)
      const itemCount = o.items?.length || 1;
      if (itemCount >= 3) score += 10;
      else if (itemCount >= 2) score += 5;

      // Sem cupom = margem cheia
      const hasCoupon = o.items?.some(i => i.coupon) || false;
      if (!hasCoupon) score += 10;

      // Cliente recorrente
      const cpf = o.customer_cpf?.replace(/\D/g, '');
      const customerOrders = cpf ? paidOrders.filter(po => po.customer_cpf?.replace(/\D/g, '') === cpf).length : 1;
      if (customerOrders >= 3) score += 15;
      else if (customerOrders >= 2) score += 8;

      return { ...o, qualityScore: Math.min(100, score), customerOrders };
    });

    const avgScore = Math.round(analyzed.reduce((sum, o) => sum + o.qualityScore, 0) / analyzed.length);

    const level = avgScore >= 70 ? { label: 'Saudável', color: 'text-green-700 bg-green-50' }
      : avgScore >= 50 ? { label: 'Regular', color: 'text-blue-700 bg-blue-50' }
      : avgScore >= 30 ? { label: 'Atenção', color: 'text-yellow-700 bg-yellow-50' }
      : { label: 'Fraco', color: 'text-red-700 bg-red-50' };

    // Distribuição por faixa
    const distribution = [
      { name: 'Excelente (80+)', value: analyzed.filter(o => o.qualityScore >= 80).length },
      { name: 'Bom (60-79)', value: analyzed.filter(o => o.qualityScore >= 60 && o.qualityScore < 80).length },
      { name: 'Regular (40-59)', value: analyzed.filter(o => o.qualityScore >= 40 && o.qualityScore < 60).length },
      { name: 'Fraco (<40)', value: analyzed.filter(o => o.qualityScore < 40).length },
    ];

    return { score: avgScore, level, distribution, orders: analyzed.sort((a, b) => b.qualityScore - a.qualityScore) };
  }, [paidOrders]);

  // =============================================
  // 6. ÍNDICE DE CONFIANÇA DO PRODUTO
  // =============================================
  const productConfidence = useMemo(() => {
    const productMap = {};

    // Views por produto
    views.forEach(v => {
      if (!productMap[v.product_id]) {
        const product = products.find(p => p.id === v.product_id);
        productMap[v.product_id] = {
          id: v.product_id,
          name: v.product_name || product?.name || 'Produto',
          image: product?.images?.[0] || '',
          price: product?.price || 0,
          category: product?.category || '',
          views: 0,
          purchases: 0,
          cancelledPurchases: 0,
          repeatBuyers: new Set(),
          allBuyers: new Set(),
          revenue: 0,
        };
      }
      productMap[v.product_id].views++;
    });

    // Compras e cancelamentos por produto
    orders.forEach(o => {
      const cpf = o.customer_cpf?.replace(/\D/g, '') || o.customer_email;
      (o.items || []).forEach(item => {
        if (!item.product_id) return;
        if (!productMap[item.product_id]) {
          const product = products.find(p => p.id === item.product_id);
          productMap[item.product_id] = {
            id: item.product_id, name: item.product_name || product?.name || 'Produto',
            image: product?.images?.[0] || '', price: product?.price || 0,
            category: product?.category || '', views: 0, purchases: 0,
            cancelledPurchases: 0, repeatBuyers: new Set(), allBuyers: new Set(), revenue: 0,
          };
        }
        const p = productMap[item.product_id];
        if (paidStatuses.includes(o.status)) {
          p.purchases += item.quantity || 1;
          p.revenue += (item.price || 0) * (item.quantity || 1);
          if (cpf) {
            if (p.allBuyers.has(cpf)) p.repeatBuyers.add(cpf);
            p.allBuyers.add(cpf);
          }
        }
        if (o.status === 'cancelled') p.cancelledPurchases += item.quantity || 1;
      });
    });

    const scored = Object.values(productMap)
      .filter(p => p.views > 0 || p.purchases > 0)
      .map(p => {
        const conversionRate = p.views > 0 ? (p.purchases / p.views) * 100 : 0;
        const cancelRate = (p.purchases + p.cancelledPurchases) > 0
          ? (p.cancelledPurchases / (p.purchases + p.cancelledPurchases)) * 100 : 0;
        const repeatRate = p.allBuyers.size > 0 ? (p.repeatBuyers.size / p.allBuyers.size) * 100 : 0;

        // Score 0-100
        let score = 50;
        score += Math.min(20, conversionRate * 2); // conversão
        score -= Math.min(20, cancelRate * 2); // penaliza cancelamento
        score += Math.min(15, repeatRate * 0.5); // recompra
        score += Math.min(15, p.purchases * 2); // volume

        const radarData = [
          { metric: 'Conversão', value: Math.min(100, conversionRate * 5) },
          { metric: 'Sem Cancel.', value: Math.max(0, 100 - cancelRate * 5) },
          { metric: 'Recompra', value: Math.min(100, repeatRate * 2) },
          { metric: 'Volume', value: Math.min(100, p.purchases * 10) },
          { metric: 'Receita', value: Math.min(100, p.revenue / 50) },
        ];

        return {
          ...p, conversionRate, cancelRate, repeatRate,
          score: Math.max(0, Math.min(100, Math.round(score))),
          buyersCount: p.allBuyers.size,
          repeatCount: p.repeatBuyers.size,
          radarData,
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored;
  }, [views, orders, products]);

  // =============================================
  // 7. LUCRO LÍQUIDO POR SESSÃO QUALIFICADA
  // =============================================
  const profitPerSession = useMemo(() => {
    const totalSessions = new Set(views.map(v => v.session_id).filter(Boolean)).size;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Sessões qualificadas = visitaram 2+ produtos ou ficaram em 1 produto 2+ vezes
    const sessionActivity = {};
    views.forEach(v => {
      if (!v.session_id) return;
      if (!sessionActivity[v.session_id]) sessionActivity[v.session_id] = { products: new Set(), totalViews: 0 };
      sessionActivity[v.session_id].products.add(v.product_id);
      sessionActivity[v.session_id].totalViews++;
    });

    const qualifiedSessions = Object.values(sessionActivity).filter(s => s.products.size >= 2 || s.totalViews >= 3).length;
    const casualSessions = totalSessions - qualifiedSessions;

    const revenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
    const revenuePerQualified = qualifiedSessions > 0 ? totalRevenue / qualifiedSessions : 0;

    // Por categoria
    const categoryRevenue = {};
    paidOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const cat = item.category || products.find(p => p.id === item.product_id)?.category || 'Outros';
        if (!categoryRevenue[cat]) categoryRevenue[cat] = { revenue: 0, orders: 0 };
        categoryRevenue[cat].revenue += (item.price || 0) * (item.quantity || 1);
        categoryRevenue[cat].orders++;
      });
    });

    const categoryData = Object.entries(categoryRevenue)
      .map(([name, data]) => ({ name, revenue: data.revenue, orders: data.orders }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalSessions, qualifiedSessions, casualSessions,
      revenuePerSession, revenuePerQualified, totalRevenue,
      qualificationRate: totalSessions > 0 ? ((qualifiedSessions / totalSessions) * 100).toFixed(1) : '0',
      categoryData,
    };
  }, [views, paidOrders, products]);

  const formatCurrency = (v) => `R$${v.toFixed(2).replace('.', ',')}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Métricas Avançadas</h1>
        <p className="text-sm text-muted-foreground mt-1">Indicadores estratégicos para otimizar vendas e retenção</p>
      </div>

      {/* ==================== 1. TEMPO ATÉ PRIMEIRA COMPRA ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
          <h2 className="text-sm font-bold">1. Tempo até a Primeira Compra</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{timeToFirstPurchase.avgDays} dias</p>
            <p className="text-[10px] text-blue-600 mt-1">Tempo Médio</p>
          </div>
          <div className="bg-secondary p-4 text-center">
            <p className="text-2xl font-bold">{timeToFirstPurchase.totalCustomers}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Clientes Únicos</p>
          </div>
          <div className="bg-secondary p-4 text-center">
            <p className="text-2xl font-bold">{views.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Visitas Rastreadas</p>
          </div>
        </div>
        {timeToFirstPurchase.chartData.some(d => d.value > 0) && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeToFirstPurchase.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">Quanto menor o tempo, melhor a qualidade do tráfego e das campanhas.</p>
      </div>

      {/* ==================== 2. ÍNDICE DE FRICÇÃO ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
          <h2 className="text-sm font-bold">2. Índice de Fricção do Checkout</h2>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
              frictionIndex.index <= 20 ? 'border-green-400' : frictionIndex.index <= 40 ? 'border-blue-400' : frictionIndex.index <= 60 ? 'border-yellow-400' : 'border-red-400'
            }`}>
              <div>
                <p className="text-2xl font-bold">{frictionIndex.index}</p>
                <p className="text-[8px] text-muted-foreground">/100</p>
              </div>
            </div>
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 ${frictionIndex.level.color}`}>{frictionIndex.level.label}</span>
          </div>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-secondary p-3">
              <p className="text-lg font-bold">{frictionIndex.abandonRate}%</p>
              <p className="text-[10px] text-muted-foreground">Taxa de Abandono</p>
              <p className="text-[9px] text-muted-foreground">{frictionIndex.totalAbandoned} carrinhos</p>
            </div>
            <div className="bg-secondary p-3">
              <p className="text-lg font-bold">{frictionIndex.paymentFailRate}%</p>
              <p className="text-[10px] text-muted-foreground">Pagamento Pendente</p>
              <p className="text-[9px] text-muted-foreground">{frictionIndex.pendingPayment} pedidos</p>
            </div>
            <div className="bg-secondary p-3">
              <p className="text-lg font-bold">{frictionIndex.cancelRate}%</p>
              <p className="text-[10px] text-muted-foreground">Taxa de Cancelamento</p>
              <p className="text-[9px] text-muted-foreground">{frictionIndex.cancelledOrders} pedidos</p>
            </div>
            <div className="bg-secondary p-3">
              <p className="text-lg font-bold">{frictionIndex.recovered}</p>
              <p className="text-[10px] text-muted-foreground">Carrinhos Recuperados</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Índice 0-100: quanto menor, menos fricção. Acima de 60 é crítico e precisa de ação imediata.</p>
      </div>

      {/* ==================== 3. INTENÇÃO FORTE SEM COMPRA ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
            <h2 className="text-sm font-bold">3. Intenção Forte sem Compra</h2>
          </div>
          <span className="text-xs text-muted-foreground">{strongIntent.total} produto{strongIntent.total !== 1 ? 's' : ''} com alta intenção</span>
        </div>

        {strongIntent.highIntent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto com intenção forte detectada ainda. Continue rastreando visitas.</p>
        ) : (
          <div className="space-y-2">
            {strongIntent.highIntent.slice(0, 10).map(p => (
              <div key={p.product_id} className="flex items-center gap-4 p-3 border border-border hover:bg-secondary/50 transition-colors">
                <div className="w-12 h-12 bg-secondary flex-shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.product_name}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · R${p.price?.toFixed(2)}</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-sm font-bold text-blue-600">{p.totalViews}</p>
                  <p className="text-[9px] text-muted-foreground">visitas</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-sm font-bold">{p.uniqueVisitors}</p>
                  <p className="text-[9px] text-muted-foreground">visitantes</p>
                </div>
                <div className="w-16">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.intentScore}%` }} />
                    </div>
                    <span className="text-[10px] font-bold">{p.intentScore}</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground text-center">score</p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-red-50 text-red-600 font-medium flex-shrink-0">Sem compra</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 text-xs text-purple-700">
          <strong>Ação recomendada:</strong> Envie remarketing (WhatsApp/e-mail), crie cupom exclusivo ou configure Downsell para estes produtos.
        </div>
      </div>

      {/* ==================== 4. LTV PREDITIVO ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-green-500" strokeWidth={1.5} />
          <h2 className="text-sm font-bold">4. LTV Preditivo (Lifetime Value)</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{formatCurrency(ltvPredictive.avgLTV)}</p>
            <p className="text-[10px] text-green-600 mt-1">LTV Médio Projetado (12 meses)</p>
          </div>
          <div className="bg-secondary p-4 text-center">
            <p className="text-2xl font-bold">{ltvPredictive.customers.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Clientes Analisados</p>
          </div>
          <div className="bg-secondary p-4 flex items-center justify-center">
            {ltvPredictive.tierDistribution.some(t => t.value > 0) ? (
              <PieChart width={120} height={80}>
                <Pie data={ltvPredictive.tierDistribution.filter(t => t.value > 0)} cx={60} cy={40} outerRadius={35} dataKey="value">
                  {ltvPredictive.tierDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
            <div className="text-[9px] space-y-0.5">
              {ltvPredictive.tierDistribution.map((t, i) => (
                <div key={t.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span>{t.name}: {t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer ranking */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary/50">
            <p className="text-xs font-bold">Ranking de Clientes por Score LTV</p>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {ltvPredictive.customers.slice(0, 20).map((c, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 font-medium border ${c.tier.color}`}>{c.tier.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {c.orders.length} pedido{c.orders.length !== 1 ? 's' : ''} · Ticket médio: {formatCurrency(c.avgOrderValue)}
                    {c.daysBetweenOrders !== null ? ` · Recompra: ${c.daysBetweenOrders}d` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-700">{formatCurrency(c.predictedLTV12m)}</p>
                  <p className="text-[9px] text-muted-foreground">LTV 12m</p>
                </div>
                <div className="w-14 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                  <p className="text-[9px] text-center font-bold">{c.score}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {c.phone && (
                    <a href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 hover:bg-green-50 text-green-600 border border-green-200 transition-colors" title="WhatsApp">
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Score baseado em: valor médio, recorrência, variedade de categorias e frequência. Clientes VIP merecem atenção especial.
        </p>
      </div>

      {/* ==================== 5. QUALIDADE DA RECEITA ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          <h2 className="text-sm font-bold">5. Índice de Qualidade da Receita</h2>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
              revenueQuality.score >= 70 ? 'border-green-400' : revenueQuality.score >= 50 ? 'border-blue-400' : revenueQuality.score >= 30 ? 'border-yellow-400' : 'border-red-400'
            }`}>
              <div>
                <p className="text-2xl font-bold">{revenueQuality.score}</p>
                <p className="text-[8px] text-muted-foreground">/100</p>
              </div>
            </div>
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 ${revenueQuality.level.color}`}>{revenueQuality.level.label}</span>
          </div>

          <div className="flex-1">
            {revenueQuality.distribution.some(d => d.value > 0) && (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueQuality.distribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" name="Pedidos" radius={[0, 4, 4, 0]}>
                      {revenueQuality.distribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Analisa cada venda por: valor do pedido, cross-sell, uso de cupom e recorrência do cliente. Quanto maior o score, mais saudável a receita.
        </p>
      </div>

      {/* ==================== 6. CONFIANÇA DO PRODUTO ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
          <h2 className="text-sm font-bold">6. Índice de Confiança do Produto</h2>
        </div>

        {productConfidence.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes ainda.</p>
        ) : (
          <div className="space-y-3">
            {productConfidence.slice(0, 10).map((p, idx) => (
              <div key={p.id} className="border border-border p-4 flex items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                <div className="w-12 h-12 bg-secondary flex-shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category} · R${p.price?.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center flex-shrink-0">
                  <div>
                    <p className="text-xs font-bold">{p.conversionRate.toFixed(1)}%</p>
                    <p className="text-[8px] text-muted-foreground">Conversão</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-600">{p.cancelRate.toFixed(1)}%</p>
                    <p className="text-[8px] text-muted-foreground">Cancelam.</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-600">{p.repeatCount}</p>
                    <p className="text-[8px] text-muted-foreground">Recompra</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-600">{formatCurrency(p.revenue)}</p>
                    <p className="text-[8px] text-muted-foreground">Receita</p>
                  </div>
                </div>
                <div className="w-16 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        p.score >= 70 ? 'bg-green-500' : p.score >= 50 ? 'bg-blue-500' : p.score >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} style={{ width: `${p.score}%` }} />
                    </div>
                  </div>
                  <p className="text-[9px] text-center font-bold mt-0.5">{p.score}/100</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Identifica produtos que parecem bons mas destroem experiência. Score baixo + vendas altas = risco para a marca.
        </p>
      </div>

      {/* ==================== 7. LUCRO POR SESSÃO QUALIFICADA ==================== */}
      <div className="bg-white border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
          <h2 className="text-sm font-bold">7. Lucro Líquido por Sessão Qualificada</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-secondary p-4 text-center">
            <p className="text-2xl font-bold">{profitPerSession.totalSessions}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Sessões Totais</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{profitPerSession.qualifiedSessions}</p>
            <p className="text-[10px] text-amber-600 mt-1">Sessões Qualificadas</p>
            <p className="text-[9px] text-amber-500">{profitPerSession.qualificationRate}% do total</p>
          </div>
          <div className="bg-secondary p-4 text-center">
            <p className="text-2xl font-bold">{formatCurrency(profitPerSession.revenuePerSession)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Receita / Sessão</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{formatCurrency(profitPerSession.revenuePerQualified)}</p>
            <p className="text-[10px] text-green-600 mt-1">Receita / Sessão Qualificada</p>
          </div>
        </div>

        {/* Revenue by category */}
        {profitPerSession.categoryData.length > 0 && (
          <div>
            <h3 className="text-xs font-bold mb-3">Receita por Categoria</h3>
            <div className="space-y-2">
              {profitPerSession.categoryData.map(cat => {
                const maxRevenue = profitPerSession.categoryData[0]?.revenue || 1;
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-24 capitalize truncate">{cat.name}</span>
                    <div className="flex-1 h-6 bg-secondary rounded overflow-hidden relative">
                      <div className="h-full bg-amber-400 rounded" style={{ width: `${(cat.revenue / maxRevenue) * 100}%` }} />
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium">
                        {formatCurrency(cat.revenue)} · {cat.orders} pedido{cat.orders !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <strong>Sessão qualificada:</strong> visitante que viu 2+ produtos ou retornou ao mesmo produto 3+ vezes. Mostra intenção real de compra, eliminando tráfego de vaidade.
        </div>
      </div>
    </div>
  );
}
