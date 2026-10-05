import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/**
 * Returns the localStorage key scoped to the authenticated user ID.
 * Returns null if user is not authenticated.
 */
export const getCartStorageKey = (userId) => (userId ? `restaurant_cart_user_${userId}` : null);

/**
 * Loads the user's scoped cart from localStorage.
 */
export const loadSavedCart = (userId) => {
  if (!userId) return [];
  try {
    const key = getCartStorageKey(userId);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to load user cart:', err);
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const currentUserId = user?.id || null;
  const activeUserIdRef = useRef(currentUserId);

  const [cart, setCart] = useState(() => loadSavedCart(currentUserId));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Clean up legacy un-scoped localStorage keys if present
  useEffect(() => {
    try {
      localStorage.removeItem('restaurant_cart');
      localStorage.removeItem('restaurant_selected_user_id');
    } catch {
      // Ignore
    }
  }, []);

  // Synchronize cart whenever authenticated user changes (login, logout, or account switch)
  useEffect(() => {
    if (activeUserIdRef.current !== currentUserId) {
      activeUserIdRef.current = currentUserId;
      // Clear in-memory cart, notes, and cart UI state on logout or account change
      setIsCartOpen(false);
      setOrderNotes('');
      // Load current user's scoped cart (or empty if unauthenticated)
      setCart(loadSavedCart(currentUserId));
    }
  }, [currentUserId]);

  // Persist cart to localStorage scoped to the active authenticated user
  useEffect(() => {
    if (currentUserId && activeUserIdRef.current === currentUserId) {
      try {
        const key = getCartStorageKey(currentUserId);
        localStorage.setItem(key, JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to persist cart:', err);
      }
    }
  }, [cart, currentUserId]);

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

  // Clear entire cart for active user
  const clearCart = () => {
    setCart([]);
    setOrderNotes('');
    if (currentUserId) {
      try {
        const key = getCartStorageKey(currentUserId);
        localStorage.removeItem(key);
      } catch (err) {
        console.error('Failed to clear cart storage:', err);
      }
    }
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
