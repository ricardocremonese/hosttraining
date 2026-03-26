import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm({ order, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess({ status: 'approved', payment_id: paymentIntent.id });
    } else {
      onSuccess({ status: 'pending', pending: true });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-6 w-full bg-foreground text-background py-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processando...' : `Pagar R$${order.total?.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function StripeForm({ publicKey, order, onSuccess, onError }) {
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!publicKey) return;
    setStripePromise(loadStripe(publicKey));
  }, [publicKey]);

  useEffect(() => {
    if (!order?.id) return;

    fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        amount: order.total,
        customerEmail: order.customer_email,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(data.error || 'Erro ao iniciar pagamento');
      })
      .catch(err => setError(err.message));
  }, [order]);

  if (!publicKey) return <p className="text-sm text-muted-foreground">Stripe não configurado</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' } }}>
      <CheckoutForm order={order} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
