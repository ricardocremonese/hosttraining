import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product, size, color) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.product_id === product.id && i.size === size && i.color === color
      );
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id && i.size === size && i.color === color
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        size,
        color,
        quantity: 1,
        price: product.sale_price || product.price,
        image: product.images?.[0] || ''
      }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((product_id, size, color) => {
    setItems(prev => prev.filter(
      i => !(i.product_id === product_id && i.size === size && i.color === color)
    ));
  }, []);

  const updateQuantity = useCallback((product_id, size, color, quantity) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(i =>
      i.product_id === product_id && i.size === size && i.color === color
        ? { ...i, quantity }
        : i
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}