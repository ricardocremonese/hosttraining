import React, { useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const steps = ['Informações', 'Entrega', 'Pagamento'];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '',
    street: '', city: '', state: '', zip: '', country: 'BR',
  });

  const shipping = subtotal >= 300 ? 0 : 19.99;
  const total = subtotal + shipping;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePlaceOrder = async () => {
    await base44.entities.Order.create({
      items,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      shipping_address: {
        street: form.street, city: form.city,
        state: form.state, zip: form.zip, country: form.country,
      },
      subtotal, shipping_cost: shipping, total,
      status: 'pending', payment_status: 'paid',
    });
    clearCart();
    setOrderPlaced(true);
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
        <p className="text-sm text-muted-foreground mb-8">Obrigado pela sua compra. Você receberá um e-mail de confirmação em breve.</p>
        <Link to="/" className="inline-block bg-foreground text-background px-8 py-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
          Continuar Comprando
        </Link>
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
                  <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="Nome Completo" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                  <input name="customer_email" value={form.customer_email} onChange={handleChange} placeholder="E-mail" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                </div>
                <h2 className="text-lg font-bold mb-6">Endereço de Entrega</h2>
                <div className="space-y-4">
                  <input name="street" value={form.street} onChange={handleChange} placeholder="Endereço" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                  <div className="grid grid-cols-2 gap-4">
                    <input name="city" value={form.city} onChange={handleChange} placeholder="Cidade" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Estado" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                  </div>
                  <input name="zip" value={form.zip} onChange={handleChange} placeholder="CEP" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                </div>
                <button onClick={() => setStep(1)} className="mt-8 w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
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
                <button onClick={() => setStep(2)} className="mt-4 w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
                  Continuar para Pagamento
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="pay" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-lg font-bold mb-6">Pagamento</h2>
                <div className="space-y-4 mb-8">
                  <input placeholder="Número do Cartão" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="MM / AA" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                    <input placeholder="CVV" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors" />
                  </div>
                </div>
                <button onClick={handlePlaceOrder} className="w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
                  Finalizar Pedido — R${total.toFixed(2)}
                </button>
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
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">R${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">{shipping === 0 ? 'Grátis' : `R$${shipping.toFixed(2)}`}</span>
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
