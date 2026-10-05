import React from 'react';
import { Loader2, Utensils, AlertCircle } from 'lucide-react';
import MenuItemCard from '../components/MenuItemCard';
import AddMenuItemModal from '../components/AddMenuItemModal';
import EditMenuItemModal from '../components/EditMenuItemModal';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
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
    isCategoryModalOpen,
    openCategoryModal,
    closeCategoryModal,
    initialEditingCategoryId,
    editingItem,
    setEditingItem,
    filteredItems,
    fetchMenuItems,
    handleItemAdded,
    handleItemUpdated,
    handleItemDeleted,
    handleCategoryAdded,
    handleCategoryUpdated,
    handleCategoryDeleted,
  } = useMenu();

  return (
    <div className="page-container">
      {/* Hero Header */}
      <MenuHero />

      {/* Control Bar: Filters, Search, Add Action & Category Management */}
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
        onOpenCategoryModal={() => openCategoryModal(null)}
        onEditCategory={(cat) => openCategoryModal(cat)}
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
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={(dish) => setEditingItem(dish)}
              onDelete={handleItemDeleted}
            />
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

      {/* Edit Dish Modal */}
      <EditMenuItemModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        categories={categories}
        onItemUpdated={handleItemUpdated}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        categories={categories}
        onCategoryAdded={handleCategoryAdded}
        onCategoryUpdated={handleCategoryUpdated}
        onCategoryDeleted={handleCategoryDeleted}
        initialEditingCategoryId={initialEditingCategoryId}
      />
    </div>
  );
};

export default MenuPage;
