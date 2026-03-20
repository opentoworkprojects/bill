import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const getItemEmoji = (item) => {
  const category = (item?.category || '').toLowerCase();
  if (category.includes('beverage')) return '🥤';
  if (category.includes('snack')) return '🍟';
  if (category.includes('pizza')) return '🍕';
  if (category.includes('burger')) return '🍔';
  if (category.includes('rice')) return '🍚';
  if (category.includes('noodle')) return '🍜';
  if (category.includes('soup')) return '🍲';
  if (category.includes('dessert')) return '🍰';
  if (category.includes('ice')) return '🍨';
  if (category.includes('coffee')) return '☕';
  if (category.includes('tea')) return '🍵';
  if (category.includes('juice')) return '🧃';
  if (category.includes('salad')) return '🥗';
  if (category.includes('sandwich')) return '🥪';
  if (category.includes('chicken')) return '🍗';
  if (category.includes('fish')) return '🐟';
  if (category.includes('egg')) return '🍳';
  if (category.includes('bread')) return '🍞';
  return '🍽️';
};

const MobileMenuSection = ({
  menuItems,
  selectedItems,
  menuSearch,
  activeCategory,
  onSearchChange,
  onCategoryChange,
  onAddItem,
  onAdjustQuantity,
  loading,
  currency = '₹'
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(menuSearch);
  const searchTimeoutRef = useRef(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const recentlyAddedTimeoutRef = useRef(null);

  // Debounce search input (150ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(menuSearch);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [menuSearch]);

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = new Set(menuItems.map((item) => item.category).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [menuItems]);

  // Filter menu items based on search and category
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, debouncedSearch, activeCategory]);

  // Get quantity for a menu item
  const getItemQuantity = useCallback((menuItemId) => {
    const cartItem = selectedItems.find((item) => item.menu_item_id === String(menuItemId));
    return cartItem ? cartItem.quantity : 0;
  }, [selectedItems]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  // Clear search
  const clearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  // Handle category selection
  const handleCategoryClick = useCallback((category) => {
    onCategoryChange(category);
  }, [onCategoryChange]);

  // Handle item tap (add to cart)
  const handleItemTap = useCallback((item) => {
    onAddItem(item);
    
    // Set recently added highlight
    setRecentlyAddedId(String(item.id));
    
    // Clear previous timeout
    if (recentlyAddedTimeoutRef.current) {
      clearTimeout(recentlyAddedTimeoutRef.current);
    }
    
    // Remove highlight after 1 second
    recentlyAddedTimeoutRef.current = setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1000);
  }, [onAddItem]);

  // Handle quantity adjustment
  const handleQuantityAdjust = useCallback((e, menuItemId, delta) => {
    e.stopPropagation(); // Prevent item tap event
    onAdjustQuantity(menuItemId, delta);
  }, [onAdjustQuantity]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (recentlyAddedTimeoutRef.current) {
        clearTimeout(recentlyAddedTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex gap-2 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full flex-shrink-0"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar - font-size 16px to prevent iOS zoom */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={menuSearch}
            onChange={handleSearchChange}
            placeholder="Search menu items..."
            className="w-full h-12 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            style={{ fontSize: '16px' }}
          />
          {menuSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter - Horizontal Scrolling Chips */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                activeCategory === category
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ minHeight: '36px', minWidth: '44px' }}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid - Responsive 2-3 columns */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items found</p>
            {menuSearch && (
              <button
                onClick={clearSearch}
                className="mt-2 text-violet-600 hover:text-violet-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              const hasQuantity = quantity > 0;
              const isRecentlyAdded = recentlyAddedId === String(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemTap(item)}
                  className={`bg-white rounded-lg border-2 p-3 cursor-pointer transition-all duration-200 ${
                    hasQuantity
                      ? 'border-violet-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    isRecentlyAdded
                      ? 'ring-4 ring-green-400 ring-opacity-50 animate-pulse-once'
                      : ''
                  } active:scale-95`}
                  style={{ minHeight: '44px' }}
                >
                  {/* Item Emoji Icon */}
                  <div className="text-4xl mb-2 text-center">
                    {getItemEmoji(item)}
                  </div>

                  {/* Item Name */}
                  <h3 className="text-sm font-semibold text-gray-800 text-center mb-1 line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Item Price */}
                  <p className="text-center text-violet-600 font-bold mb-2">
                    {currency}{parseFloat(item.price || 0).toFixed(2)}
                  </p>

                  {/* Quantity Controls - Show when item is in cart */}
                  {hasQuantity && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        onClick={(e) => handleQuantityAdjust(e, String(item.id), -1)}
                        className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-90 transition-transform"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        aria-label="Decrease quantity"
                      >
                        <span className="text-lg font-bold">−</span>
                      </button>
                      <span className="text-lg font-bold text-gray-800 min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={(e) => handleQuantityAdjust(e, String(item.id), 1)}
                        className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 active:scale-90 transition-transform"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        aria-label="Increase quantity"
                      >
                        <span className="text-lg font-bold">+</span>
                      </button>
                    </div>
                  )}

                  {/* Add to Cart Badge - Show when not in cart */}
                  {!hasQuantity && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-gray-500">Tap to add</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes pulse-once {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-once {
          animation: pulse-once 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default MobileMenuSection;
