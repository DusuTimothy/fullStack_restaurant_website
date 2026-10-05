import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Custom hook managing category and menu item fetching, filtering, and mutations.
 */
export const useMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [initialEditingCategoryId, setInitialEditingCategoryId] = useState(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosClient.get('/categories');
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    setMenuItems((prev) => {
      if (selectedCategory && String(newItem.categoryId) !== String(selectedCategory)) {
        return prev;
      }
      return [newItem, ...prev];
    });
    fetchCategories();
  };

  const handleItemUpdated = (updatedItem) => {
    setMenuItems((prev) => {
      if (selectedCategory && String(updatedItem.categoryId) !== String(selectedCategory)) {
        return prev.filter((item) => item.id !== updatedItem.id);
      }
      return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    });
    fetchCategories();
  };

  const handleItemDeleted = (deletedId) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== deletedId));
    fetchCategories();
  };

  const handleCategoryAdded = (newCategory) => {
    setCategories((prev) => [...prev, { ...newCategory, itemCount: 0 }]);
    fetchCategories();
  };

  const handleCategoryUpdated = (updatedCategory) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat))
    );
    // Update category badge on existing dishes
    setMenuItems((prev) =>
      prev.map((item) => {
        if (
          String(item.categoryId) === String(updatedCategory.id) ||
          String(item.category?.id) === String(updatedCategory.id)
        ) {
          return {
            ...item,
            category: {
              ...(item.category || {}),
              id: updatedCategory.id,
              name: updatedCategory.name,
            },
          };
        }
        return item;
      })
    );
    fetchCategories();
  };

  const handleCategoryDeleted = (deletedId) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== deletedId));
    if (String(selectedCategory) === String(deletedId)) {
      setSelectedCategory('');
    }
    fetchCategories();
  };

  const openCategoryModal = (catToEdit = null) => {
    setInitialEditingCategoryId(catToEdit ? catToEdit.id : null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setInitialEditingCategoryId(null);
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
    isCategoryModalOpen,
    openCategoryModal,
    closeCategoryModal,
    initialEditingCategoryId,
    editingItem,
    setEditingItem,
    filteredItems,
    fetchMenuItems,
    fetchCategories,
    handleItemAdded,
    handleItemUpdated,
    handleItemDeleted,
    handleCategoryAdded,
    handleCategoryUpdated,
    handleCategoryDeleted,
  };
};

export default useMenu;
