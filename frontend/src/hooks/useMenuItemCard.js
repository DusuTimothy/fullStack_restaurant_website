import { useState } from 'react';
import axiosClient, { resolveImageUrl } from '../api/axiosClient';
import { useCart } from '../context/CartContext';

const DEFAULT_FOOD_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="%23f1f5f9"/><circle cx="200" cy="110" r="50" fill="%23e2e8f0"/><text x="200" y="125" font-size="36" text-anchor="middle" fill="%2394a3b8">🍽️</text><text x="200" y="190" font-family="sans-serif" font-size="16" font-weight="600" text-anchor="middle" fill="%2364748b">Chef Specialty</text></svg>`;

/**
 * Custom hook handling menu card cart interaction, feedback animation, and deletion.
 */
export const useMenuItemCard = ({ item, onDelete }) => {
  const { addToCart, cart, isAdmin } = useCart();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cartItem = cart.find((ci) => ci.menuItem.id === item.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;

  const resolvedImage = !imageError && item.imageUrl ? resolveImageUrl(item.imageUrl) : DEFAULT_FOOD_SVG;

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    addToCart(item, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.name}" from the menu?`);
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await axiosClient.delete(`/menu-items/${item.id}`);
      if (onDelete) {
        onDelete(item.id);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      const msg = err.response?.data?.error || 'Failed to delete menu item';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  return {
    isAdmin,
    currentQuantityInCart,
    resolvedImage,
    justAdded,
    deleting,
    setImageError,
    handleAddToCart,
    handleDelete,
  };
};

export default useMenuItemCard;
