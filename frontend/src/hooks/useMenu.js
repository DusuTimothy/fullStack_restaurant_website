import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook managing category and menu item fetching, filtering, and local mutation.
 */
export const useMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/categories');
        if (isMounted && res.data?.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch menu items when category filter changes
  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedCategory ? `/menu-items?category_id=${selectedCategory}` : '/menu-items';
      const res = await axiosClient.get(url);
      if (res.data?.data) {
        setMenuItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError('Could not load menu items. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Client-side search filtering
  const filteredItems = menuItems.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchName = item.name.toLowerCase().includes(query);
    const matchDesc = item.description?.toLowerCase().includes(query);
    return matchName || matchDesc;
  });

  const handleItemAdded = (newItem) => {
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const handleItemDeleted = (deletedId) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== deletedId));
  };

  return {
    menuItems,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    isAddModalOpen,
    setIsAddModalOpen,
    filteredItems,
    fetchMenuItems,
    handleItemAdded,
    handleItemDeleted,
  };
};

export default useMenu;
