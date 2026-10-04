import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';

const MenuControls = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onClearSearch,
  totalItemsCount,
  isAdmin,
  onOpenAddModal,
}) => {
  return (
    <div className="menu-controls-card">
      {/* Dynamic Category Dropdown & Pills */}
      <div className="category-filter-group">
        <div className="filter-dropdown-wrap">
          <Filter size={16} className="filter-icon" />
          <select
            className="category-select-dropdown"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            aria-label="Filter menu items by category"
          >
            <option value="">
              All Categories ({categories.reduce((acc, c) => acc + (c.itemCount || 0), 0) || totalItemsCount})
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {cat.itemCount !== undefined ? `(${cat.itemCount})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Select Category Pills */}
        <div className="category-pills">
          <button
            type="button"
            className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => onSelectCategory('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${selectedCategory === cat.id.toString() ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id.toString())}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Search bar & Add Dish button (Admin only) */}
      <div className="menu-search-add-group">
        <div className="search-bar-wrap">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search dishes, burgers, pasta..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={onClearSearch}
            >
              &times;
            </button>
          )}
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn-add-item"
            onClick={onOpenAddModal}
            title="Admin privilege: Add a new dish to the menu (Supports Multer file uploads)"
          >
            <Plus size={18} />
            <span>Add Dish</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuControls;
