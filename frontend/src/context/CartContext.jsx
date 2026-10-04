import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('restaurant_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('restaurant_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to persist cart:', err);
    }
  }, [cart]);

  // Clean up legacy localStorage key if present
  useEffect(() => {
    try {
      localStorage.removeItem('restaurant_selected_user_id');
    } catch {
      // Ignore
    }
  }, []);

  // Add item to cart
  const addToCart = (menuItem, qty = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.menuItem.id === menuItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + qty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: Math.round(newQty * menuItem.price * 100) / 100,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          menuItem,
          quantity: qty,
          unitPrice: menuItem.price,
          subtotal: Math.round(qty * menuItem.price * 100) / 100,
        },
      ];
    });
  };

  // Update item quantity
  const updateQuantity = (menuItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.menuItem.id === menuItemId) {
          return {
            ...item,
            quantity: newQty,
            subtotal: Math.round(newQty * item.menuItem.price * 100) / 100,
          };
        }
        return item;
      })
    );
  };

  // Remove single item from cart
  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    setOrderNotes('');
  };

  // Calculate totals
  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    const sum = cart.reduce((acc, item) => acc + item.subtotal, 0);
    return Math.round(sum * 100) / 100;
  }, [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const value = {
    cart,
    user,
    isAdmin,
    isAuthenticated,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    orderNotes,
    setOrderNotes,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
