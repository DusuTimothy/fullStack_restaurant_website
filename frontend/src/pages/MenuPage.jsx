import React from 'react';
import { Loader2, Utensils, AlertCircle } from 'lucide-react';
import MenuItemCard from '../components/MenuItemCard';
import AddMenuItemModal from '../components/AddMenuItemModal';
import MenuHero from '../components/MenuHero';
import MenuControls from '../components/MenuControls';
import { useCart } from '../context/CartContext';
import useMenu from '../hooks/useMenu';

const MenuPage = () => {
  const { isAdmin } = useCart();
  const {
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
  } = useMenu();

  return (
    <div className="page-container">
      {/* Hero Header */}
      <MenuHero />

      {/* Control Bar: Filters, Search, and Add Action */}
      <MenuControls
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        totalItemsCount={filteredItems.length}
        isAdmin={isAdmin}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Grid Content */}
      {loading ? (
        <div className="page-loading-state">
          <Loader2 size={44} className="animate-spin text-amber-600" />
          <p>Loading delectable dishes...</p>
        </div>
      ) : error ? (
        <div className="page-error-state">
          <AlertCircle size={40} className="text-rose-600" />
          <h3>Unable to Load Menu</h3>
          <p>{error}</p>
          <button type="button" className="btn-primary mt-3" onClick={fetchMenuItems}>
            Try Again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="page-empty-state">
          <Utensils size={48} className="text-gray-400" />
          <h3>No Menu Items Found</h3>
          <p>
            {searchQuery
              ? `No dishes matched "${searchQuery}". Try a different keyword.`
              : 'There are currently no items in this category.'}
          </p>
          {selectedCategory && (
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={() => setSelectedCategory('')}
            >
              View All Categories
            </button>
          )}
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onDelete={handleItemDeleted} />
          ))}
        </div>
      )}

      {/* Add Dish Modal */}
      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default MenuPage;
