import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/CartContext';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import MercadoPagoForm from '@/components/checkout/MercadoPagoForm';
import StripeForm from '@/components/checkout/StripeForm';

const steps = ['Informações', 'Entrega', 'Pagamento'];

// Máscaras
const maskCPF = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const maskCEP = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState(null);
  const [paymentPublicKey, setPaymentPublicKey] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '', customer_cpf: '',
    street: '', complement: '', city: '', state: '', zip: '', country: 'BR',
  });

  // Carregar provedor de pagamento ativo
  useEffect(() => {
    fetch('/api/payments/active-provider')
      .then(r => r.json())
      .then(data => {
        setPaymentProvider(data.provider);
        setPaymentPublicKey(data.publicKey || '');
      })
      .catch(() => {});
  }, []);

  const baseShipping = subtotal >= 300 ? 0 : 19.99;
  const shipping = appliedCoupon?.free_shipping ? 0 : baseShipping;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = subtotal * (appliedCoupon.value / 100);
    } else {
      discount = appliedCoupon.value;
    }
    discount = Math.min(discount, subtotal);
  }
  const total = subtotal - discount + shipping;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const results = await base44.entities.Coupon.filter({ code: couponCode.trim().toUpperCase(), active: true });
      const coupon = results[0];
      if (!coupon) {
        setCouponError('Cupom não encontrado');
      } else if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('Cupom expirado');
      } else if (coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses) {
        setCouponError('Cupom esgotado');
      } else if (coupon.min_order > 0 && subtotal < coupon.min_order) {
        setCouponError(`Pedido mínimo: R$${coupon.min_order.toFixed(2)}`);
      } else {
        setAppliedCoupon(coupon);
        setCouponError('');
      }
    } catch {
      setCouponError('Erro ao verificar cupom');
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCPFChange = (e) => {
    const masked = maskCPF(e.target.value);
    setForm(prev => ({ ...prev, customer_cpf: masked }));
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 11) {
      setCpfError(cpfValidator.isValid(digits) ? '' : 'CPF inválido');
    } else {
      setCpfError('');
    }
  };

  const handlePhoneChange = (e) => {
    setForm(prev => ({ ...prev, customer_phone: maskPhone(e.target.value) }));
  };

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleCEPChange = async (e) => {
    const masked = maskCEP(e.target.value);
    setForm(prev => ({ ...prev, zip: masked }));
    setCepError('');

    const digits = masked.replace(/\D/g, '');
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError('CEP não encontrado');
        } else {
          setForm(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            complement: data.complemento || prev.complement,
          }));
        }
      } catch {
        setCepError('Erro ao buscar CEP');
      }
      setCepLoading(false);
    }
  };

  const cpfDigits = form.customer_cpf.replace(/\D/g, '');
  const phoneDigits = form.customer_phone.replace(/\D/g, '');
  const isCpfComplete = cpfDigits.length === 11 && cpfValidator.isValid(cpfDigits);
  const isPhoneComplete = phoneDigits.length === 11;

  const requiredFields = ['customer_name', 'customer_email', 'street', 'city', 'state', 'zip'];
  const isFormValid = requiredFields.every(field => form[field]?.trim()) && isCpfComplete && isPhoneComplete;

  // Cria pedido pendente antes do pagamento
  const handleCreateOrder = async () => {
    const orderCode = `HT-${Date.now().toString(36).toUpperCase()}`;
    const order = await base44.entities.Order.create({
      order_number: orderCode,
      items,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      customer_cpf: form.customer_cpf,
      shipping_address: {
        street: form.street, complement: form.complement, city: form.city,
        state: form.state, zip: form.zip, country: form.country,
      },
      subtotal, shipping_cost: shipping, total,
      status: 'pending', payment_status: 'pending',
    });
    setCreatedOrder({ ...order, total, customer_email: form.customer_email, customer_cpf: form.customer_cpf });
    setOrderNumber(orderCode);
    setStep(2);
  };

  // Fallback: pedido sem gateway (quando nenhum provedor ativo)
  const handlePlaceOrderDirect = async () => {
    const orderCode = `HT-${Date.now().toString(36).toUpperCase()}`;
    await base44.entities.Order.create({
      order_number: orderCode,
      items,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      customer_cpf: form.customer_cpf,
      shipping_address: {
        street: form.street, complement: form.complement, city: form.city,
        state: form.state, zip: form.zip, country: form.country,
      },
      subtotal, shipping_cost: shipping, total,
      status: 'pending', payment_status: 'pending',
    });
    setOrderNumber(orderCode);
    clearCart();
    setOrderPlaced(true);
  };

  const handlePaymentSuccess = (data) => {
    setPaymentError('');
    clearCart();
    setOrderPlaced(true);
  };

  const handlePaymentError = (msg) => {
    setPaymentError(msg || 'Erro ao processar pagamento. Tente novamente.');
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-foreground text-background flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-8 h-8" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Pedido Confirmado</h1>
        <div className="bg-secondary px-6 py-4 inline-block mb-4">
          <p className="text-xs text-muted-foreground mb-1">Número do pedido</p>
          <p className="text-lg font-mono font-bold tracking-wider">{orderNumber}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Guarde este número para acompanhar seu pedido.</p>
        <p className="text-sm text-muted-foreground mb-8">Você receberá um e-mail de confirmação em breve.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={`/rastreio?pedido=${orderNumber}`} className="inline-block bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
            Acompanhar Pedido
          </Link>
          <Link to="/" className="inline-block border border-border px-8 py-4 text-sm font-medium hover:border-foreground transition-colors">
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Sua sacola está vazia</h1>
        <Link to="/products" className="inline-block mt-4 bg-foreground text-background px-8 py-4 text-sm font-medium">
          Comprar Agora
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
      {/* Steps */}
      <div className="flex items-center gap-4 mb-10 max-w-xl">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`text-sm font-medium ${i === step ? 'text-foreground' : i < step ? 'text-foreground underline' : 'text-muted-foreground'}`}
            >
              {s}
            </button>
            {i < steps.length - 1 && <span className="text-muted-foreground">/</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-lg font-bold mb-6">Informações de Contato</h2>
                <div className="space-y-4 mb-8">
                  <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="Nome Completo *" className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${!form.customer_name.trim() && form.customer_name !== '' ? 'border-destructive' : 'border-border'}`} />
                  <div>
                    <input name="customer_cpf" value={form.customer_cpf} onChange={handleCPFChange} placeholder="CPF *  000.000.000-00" inputMode="numeric" maxLength={14} className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${cpfError ? 'border-destructive' : 'border-border'}`} />
                    {cpfError && <p className="text-xs text-destructive mt-1">{cpfError}</p>}
                  </div>
                  <input name="customer_email" value={form.customer_email} onChange={handleChange} placeholder="E-mail *" type="email" className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${!form.customer_email.trim() && form.customer_email !== '' ? 'border-destructive' : 'border-border'}`} />
                  <input name="customer_phone" value={form.customer_phone} onChange={handlePhoneChange} placeholder="WhatsApp *  (11)99999-9999" inputMode="numeric" maxLength={14} className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${phoneDigits.length > 0 && !isPhoneComplete ? 'border-destructive' : 'border-border'}`} />
                </div>
                <h2 className="text-lg font-bold mb-6">Endereço de Entrega</h2>
                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <input name="zip" value={form.zip} onChange={handleCEPChange} placeholder="CEP *  00000-000" inputMode="numeric" maxLength={9} className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${cepError ? 'border-destructive' : 'border-border'}`} />
                      {cepLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-foreground border-t-transparent animate-spin rounded-full" />}
                    </div>
                    {cepError && <p className="text-xs text-destructive mt-1">{cepError}</p>}
                  </div>
                  <input name="street" value={form.street} onChange={handleChange} placeholder="Endereço *" className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${!form.street.trim() && form.street !== '' ? 'border-destructive' : 'border-border'}`} />
                  <input name="complement" value={form.complement} onChange={handleChange} placeholder="Complemento (apto, bloco, etc.)" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                  <div className="grid grid-cols-2 gap-4">
                    <input name="city" value={form.city} onChange={handleChange} placeholder="Cidade *" className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${!form.city.trim() && form.city !== '' ? 'border-destructive' : 'border-border'}`} />
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Estado *" className={`w-full border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors ${!form.state.trim() && form.state !== '' ? 'border-destructive' : 'border-border'}`} />
                  </div>
                </div>
                {!isFormValid && (
                  <p className="text-xs text-destructive mt-3">* Preencha todos os campos obrigatórios para continuar</p>
                )}
                <button onClick={() => setStep(1)} disabled={!isFormValid} className="mt-8 w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Continuar para Entrega
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="ship" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-lg font-bold mb-6">Método de Entrega</h2>
                <div className="border border-foreground p-4 flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">Entrega Padrão</p>
                    <p className="text-xs text-muted-foreground">5-7 dias úteis</p>
                  </div>
                  <p className="text-sm font-medium">{shipping === 0 ? 'Grátis' : `R$${shipping.toFixed(2)}`}</p>
                </div>
                <button
                  onClick={paymentProvider ? handleCreateOrder : handlePlaceOrderDirect}
                  className="mt-4 w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Continuar para Pagamento
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="pay" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-lg font-bold mb-6">Pagamento</h2>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 px-4 py-3 mb-6">
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}

                {paymentProvider === 'mercadopago' && createdOrder && (
                  <MercadoPagoForm
                    publicKey={paymentPublicKey}
                    order={createdOrder}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}

                {paymentProvider === 'stripe' && createdOrder && (
                  <StripeForm
                    publicKey={paymentPublicKey}
                    order={createdOrder}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}

                {!paymentProvider && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Nenhum provedor de pagamento configurado. O pedido será registrado como pendente.
                    </p>
                    <button
                      onClick={handlePlaceOrderDirect}
                      className="w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
                    >
                      Finalizar Pedido — R${total.toFixed(2)}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-nike-lightgray p-6">
            <h3 className="text-sm font-bold mb-4">Resumo do Pedido</h3>
            <div className="space-y-4 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-16 h-16 bg-white flex-shrink-0">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.size} / Qtd {item.quantity}</p>
                    <p className="text-xs font-medium mt-1">R${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Coupon */}
            <div className="border-t border-border pt-4 mb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-green-700">Cupom: {appliedCoupon.code}</p>
                    <p className="text-[10px] text-green-600">
                      {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% de desconto` : `R$${appliedCoupon.value?.toFixed(2)} de desconto`}
                      {appliedCoupon.free_shipping ? ' + Frete Grátis' : ''}
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-green-700 underline">Remover</button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      placeholder="Cupom de desconto"
                      className="flex-1 border border-border px-3 py-2 text-xs outline-none focus:border-foreground font-mono uppercase"
                    />
                    <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-3 py-2 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50">
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-destructive mt-1">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">R${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Desconto</span>
                  <span className="font-medium text-green-600">-R${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className={appliedCoupon?.free_shipping ? 'text-green-600' : ''}>Grátis</span>
                  ) : `R$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>R${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
