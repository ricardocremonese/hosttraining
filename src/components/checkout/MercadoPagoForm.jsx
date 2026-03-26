import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, QrCode } from 'lucide-react';

export default function MercadoPagoForm({ publicKey, order, onSuccess, onError }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [pixData, setPixData] = useState(null);
  const cardFormRef = useRef(null);
  const mpInstanceRef = useRef(null);

  // Carregar SDK do MercadoPago
  useEffect(() => {
    if (!publicKey) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      mpInstanceRef.current = mp;
      setMpReady(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [publicKey]);

  // Montar card form quando SDK estiver pronto
  useEffect(() => {
    if (!mpReady || paymentMethod !== 'card' || !cardFormRef.current) return;

    const mp = mpInstanceRef.current;
    const cardForm = mp.cardForm({
      amount: String(order.total),
      iframe: true,
      form: {
        id: 'mp-card-form',
        cardNumber: { id: 'mp-card-number', placeholder: 'Número do cartão' },
        expirationDate: { id: 'mp-expiration', placeholder: 'MM/AA' },
        securityCode: { id: 'mp-cvv', placeholder: 'CVV' },
        cardholderName: { id: 'mp-cardholder', placeholder: 'Nome no cartão' },
        installments: { id: 'mp-installments' },
        identificationNumber: { id: 'mp-doc-number', placeholder: 'CPF' },
      },
      callbacks: {
        onFormMounted: (error) => {
          if (error) console.error('MP form mount error:', error);
        },
        onSubmit: async (event) => {
          event.preventDefault();
          setLoading(true);

          const {
            paymentMethodId,
            issuerId,
            cardholderEmail: email,
            amount,
            token,
            installments,
            identificationNumber,
          } = cardForm.getCardFormData();

          try {
            const res = await fetch('/api/payments/mercadopago/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                orderNumber: order.order_number,
                token,
                installments: Number(installments),
                paymentMethodId,
                payer: { email: order.customer_email, cpf: order.customer_cpf },
                transactionAmount: order.total,
              }),
            });
            const data = await res.json();

            if (data.status === 'approved') {
              onSuccess(data);
            } else if (data.status === 'pending' || data.status === 'in_process') {
              onSuccess({ ...data, pending: true });
            } else {
              onError(data.status_detail || 'Pagamento recusado');
            }
          } catch (err) {
            onError(err.message || 'Erro ao processar pagamento');
          }
          setLoading(false);
        },
      },
    });

    return () => {
      try { cardForm.unmount(); } catch {}
    };
  }, [mpReady, paymentMethod]);

  // Pix
  const handlePix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/mercadopago/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          payer: { email: order.customer_email, cpf: order.customer_cpf },
          transactionAmount: order.total,
        }),
      });
      const data = await res.json();

      if (data.qr_code) {
        setPixData(data);
      } else {
        onError('Erro ao gerar Pix');
      }
    } catch (err) {
      onError(err.message);
    }
    setLoading(false);
  };

  if (!publicKey) return <p className="text-sm text-muted-foreground">MercadoPago não configurado</p>;

  return (
    <div>
      {/* Payment Method Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setPaymentMethod('card'); setPixData(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border transition-colors ${
            paymentMethod === 'card' ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4" strokeWidth={1.5} /> Cartão
        </button>
        <button
          onClick={() => setPaymentMethod('pix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border transition-colors ${
            paymentMethod === 'pix' ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
          }`}
        >
          <QrCode className="w-4 h-4" strokeWidth={1.5} /> Pix
        </button>
      </div>

      {/* Card Form */}
      {paymentMethod === 'card' && (
        <form id="mp-card-form" ref={cardFormRef}>
          <div className="space-y-3">
            <div id="mp-card-number" className="h-12 border border-border px-1" />
            <div className="grid grid-cols-2 gap-3">
              <div id="mp-expiration" className="h-12 border border-border px-1" />
              <div id="mp-cvv" className="h-12 border border-border px-1" />
            </div>
            <input id="mp-cardholder" className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground" />
            <div className="grid grid-cols-2 gap-3">
              <select id="mp-installments" className="w-full border border-border px-4 py-3 text-sm outline-none" />
              <input id="mp-doc-number" value={order.customer_cpf?.replace(/\D/g, '') || ''} readOnly className="w-full border border-border px-4 py-3 text-sm outline-none bg-secondary" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !mpReady}
            className="mt-6 w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processando...' : `Pagar R$${order.total?.toFixed(2)}`}
          </button>
        </form>
      )}

      {/* Pix */}
      {paymentMethod === 'pix' && !pixData && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Clique para gerar o QR Code Pix</p>
          <button
            onClick={handlePix}
            disabled={loading}
            className="w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Gerando Pix...' : `Gerar Pix — R$${order.total?.toFixed(2)}`}
          </button>
        </div>
      )}

      {paymentMethod === 'pix' && pixData && (
        <div className="text-center space-y-4">
          <p className="text-sm font-medium">Escaneie o QR Code ou copie o código</p>
          {pixData.qr_code_base64 && (
            <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="w-48 h-48 mx-auto border border-border" />
          )}
          {pixData.qr_code && (
            <div className="relative">
              <input value={pixData.qr_code} readOnly className="w-full border border-border px-3 py-2.5 text-[10px] font-mono outline-none" />
              <button
                onClick={() => { navigator.clipboard.writeText(pixData.qr_code); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground underline"
              >
                Copiar
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Após o pagamento, o pedido será confirmado automaticamente.</p>
        </div>
      )}
    </div>
  );
}
