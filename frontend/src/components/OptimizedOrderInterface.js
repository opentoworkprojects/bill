/**
 * Optimized Order Interface Components
 * High-performance React components with memoization for fast order creation
 * Requirements: 1.1, 1.2, 1.3, 1.4 - UI response times <50-200ms
 */

import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { performanceMonitor, trackUIClick, trackUINavigation, trackCartUpdate } from '../utils/performanceMonitor';
import { EnhancedButton } from './ui/enhanced-button';
import { useOptimizedAction } from '../hooks/useOptimizedAction';

// Optimized Menu Item Component with React.memo
const OptimizedMenuItem = memo(({ 
  item, 
  onAddToCart, 
  onViewDetails, 
  isInCart = false,
  cartQuantity = 0 
}) => {
  const { execute: addToCart, loading: addingToCart } = useOptimizedAction(
    useCallback(() => onAddToCart(item), [item, onAddToCart]),
    {
      debounceMs: 200,
      successMessage: `${item.name} added to cart`,
      showSuccessToast: false // Prevent toast spam
    }
  );

  const { execute: viewDetails } = useOptimizedAction(
    useCallback(() => onViewDetails(item), [item, onViewDetails]),
    {
      debounceMs: 100,
      showSuccessToast: false
    }
  );

  // Memoize image loading optimization
  const optimizedImageProps = useMemo(() => ({
    src: item.imageUrl,
    alt: item.name,
    loading: 'lazy',
    decoding: 'async',
    onLoad: () => {
      // Track image load performance
      performanceMonitor.recordMetric('image_load', performance.now(), {
        itemId: item.id,
        imageUrl: item.imageUrl
      });
    }
  }), [item.id, item.imageUrl, item.name]);

  // Memoize price formatting
  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.price),
    [item.price]
  );

  return (
    <div className="menu-item-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="relative">
        <img 
          {...optimizedImageProps}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-t-lg">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 line-clamp-2">{item.name}</h3>
          <span className="text-lg font-bold text-green-600 ml-2">{formattedPrice}</span>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}
        
        <div className="flex gap-2">
          <EnhancedButton
            variant="outline"
            size="sm"
            onClick={viewDetails}
            className="flex-1"
            debounceMs={100}
          >
            View Details
          </EnhancedButton>
          
          <EnhancedButton
            variant="default"
            size="sm"
            onClick={addToCart}
            loading={addingToCart}
            disabled={!item.available}
            className="flex-1"
            debounceMs={200}
            hapticFeedback={true}
          >
            {isInCart ? `In Cart (${cartQuantity})` : 'Add to Cart'}
          </EnhancedButton>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.available === nextProps.item.available &&
    prevProps.isInCart === nextProps.isInCart &&
    prevProps.cartQuantity === nextProps.cartQuantity
  );
});

OptimizedMenuItem.displayName = 'OptimizedMenuItem';

// Optimized Menu Category Component
const OptimizedMenuCategory = memo(({ 
  category, 
  items, 
  onItemSelect, 
  onItemAddToCart,
  cartItems = new Map(),
  isActive = false 
}) => {
  const categoryItems = useMemo(() => 
    items.filter(item => item.categoryId === category.id),
    [items, category.id]
  );

  const handleItemAddToCart = useCallback((item) => {
    const tracker = trackCartUpdate(`add_item_${item.id}`, async () => {
      await onItemAddToCart(item);
    });
    return tracker();
  }, [onItemAddToCart]);

  const handleItemSelect = useCallback((item) => {
    const tracker = trackUIClick(`item_details_${item.id}`, async () => {
      await onItemSelect(item);
    });
    return tracker();
  }, [onItemSelect]);

  if (!isActive) {
    return null; // Don't render inactive categories for performance
  }

  return (
    <div className="menu-category">
      <div className="sticky top-0 bg-white z-10 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
        {categoryItems.map(item => (
          <OptimizedMenuItem
            key={item.id}
            item={item}
            onAddToCart={handleItemAddToCart}
            onViewDetails={handleItemSelect}
            isInCart={cartItems.has(item.id)}
            cartQuantity={cartItems.get(item.id)?.quantity || 0}
          />
        ))}
      </div>
    </div>
  );
});

OptimizedMenuCategory.displayName = 'OptimizedMenuCategory';

// Optimized Cart Component with optimistic updates
const OptimizedCart = memo(({ 
  items = [], 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  isVisible = true 
}) => {
  const [optimisticItems, setOptimisticItems] = useState(items);
  const [pendingUpdates, setPendingUpdates] = useState(new Set());

  // Sync optimistic state with actual state
  useEffect(() => {
    setOptimisticItems(items);
  }, [items]);

  // Memoize total calculation
  const { subtotal, tax, total, itemCount } = useMemo(() => {
    const subtotal = optimisticItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    const itemCount = optimisticItems.reduce((sum, item) => sum + item.quantity, 0);
    
    return { subtotal, tax, total, itemCount };
  }, [optimisticItems]);

  // Optimistic quantity update
  const handleQuantityUpdate = useCallback(async (itemId, newQuantity) => {
    const updateId = `${itemId}_${Date.now()}`;
    setPendingUpdates(prev => new Set(prev).add(updateId));

    // Optimistic update
    setOptimisticItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: Math.max(0, newQuantity) }
          : item
      ).filter(item => item.quantity > 0)
    );

    try {
      const tracker = trackCartUpdate(`update_quantity_${itemId}`, async () => {
        await onUpdateQuantity(itemId, newQuantity);
      });
      await tracker();
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticItems(items);
      console.error('Failed to update quantity:', error);
    } finally {
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateId);
        return newSet;
      });
    }
  }, [items, onUpdateQuantity]);

  // Optimistic item removal
  const handleRemoveItem = useCallback(async (itemId) => {
    const updateId = `remove_${itemId}_${Date.now()}`;
    setPendingUpdates(prev => new Set(prev).add(updateId));

    // Optimistic update
    const itemToRemove = optimisticItems.find(item => item.id === itemId);
    setOptimisticItems(prev => prev.filter(item => item.id !== itemId));

    try {
      const tracker = trackCartUpdate(`remove_item_${itemId}`, async () => {
        await onRemoveItem(itemId);
      });
      await tracker();
    } catch (error) {
      // Revert optimistic update on error
      if (itemToRemove) {
        setOptimisticItems(prev => [...prev, itemToRemove]);
      }
      console.error('Failed to remove item:', error);
    } finally {
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateId);
        return newSet;
      });
    }
  }, [optimisticItems, onRemoveItem]);

  const { execute: checkout, loading: checkingOut } = useOptimizedAction(
    onCheckout,
    {
      debounceMs: 500,
      successMessage: 'Proceeding to checkout...',
      showSuccessToast: false
    }
  );

  if (!isVisible || optimisticItems.length === 0) {
    return (
      <div className="cart-empty text-center py-8">
        <div className="text-gray-400 text-lg mb-2">🛒</div>
        <p className="text-gray-600">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="optimized-cart bg-white rounded-lg shadow-lg border">
      <div className="cart-header p-4 border-b">
        <h3 className="text-lg font-semibold">Cart ({itemCount} items)</h3>
      </div>
      
      <div className="cart-items max-h-96 overflow-y-auto">
        {optimisticItems.map(item => (
          <OptimizedCartItem
            key={item.id}
            item={item}
            onUpdateQuantity={handleQuantityUpdate}
            onRemove={handleRemoveItem}
            isPending={Array.from(pendingUpdates).some(id => id.includes(item.id))}
          />
        ))}
      </div>
      
      <div className="cart-summary p-4 border-t bg-gray-50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        <EnhancedButton
          className="w-full mt-4"
          size="lg"
          onClick={checkout}
          loading={checkingOut}
          disabled={optimisticItems.length === 0 || pendingUpdates.size > 0}
          debounceMs={500}
          hapticFeedback={true}
        >
          Proceed to Checkout
        </EnhancedButton>
      </div>
    </div>
  );
});

OptimizedCart.displayName = 'OptimizedCart';

// Optimized Cart Item Component
const OptimizedCartItem = memo(({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isPending = false 
}) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const debounceRef = useRef(null);

  // Sync local quantity with prop
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  // Debounced quantity update
  const handleQuantityChange = useCallback((newQuantity) => {
    setLocalQuantity(newQuantity);
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the actual update
    debounceRef.current = setTimeout(() => {
      onUpdateQuantity(item.id, newQuantity);
    }, 300);
  }, [item.id, onUpdateQuantity]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(item.price),
    [item.price]
  );

  const itemTotal = useMemo(() => 
    (item.price * localQuantity).toFixed(2),
    [item.price, localQuantity]
  );

  return (
    <div className={`cart-item p-4 border-b flex items-center gap-3 ${isPending ? 'opacity-60' : ''}`}>
      <img 
        src={item.imageUrl} 
        alt={item.name}
        className="w-12 h-12 object-cover rounded"
        loading="lazy"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>
        <p className="text-xs text-gray-600">{formattedPrice} each</p>
      </div>
      
      <div className="flex items-center gap-2">
        <EnhancedButton
          variant="outline"
          size="icon-sm"
          onClick={() => handleQuantityChange(Math.max(0, localQuantity - 1))}
          disabled={isPending || localQuantity <= 1}
          debounceMs={100}
        >
          -
        </EnhancedButton>
        
        <span className="w-8 text-center text-sm font-medium">{localQuantity}</span>
        
        <EnhancedButton
          variant="outline"
          size="icon-sm"
          onClick={() => handleQuantityChange(localQuantity + 1)}
          disabled={isPending}
          debounceMs={100}
        >
          +
        </EnhancedButton>
        
        <EnhancedButton
          variant="destructive"
          size="icon-sm"
          onClick={() => onRemove(item.id)}
          disabled={isPending}
          debounceMs={200}
          className="ml-2"
        >
          ×
        </EnhancedButton>
      </div>
      
      <div className="text-sm font-medium w-16 text-right">
        ${itemTotal}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.isPending === nextProps.isPending
  );
});

OptimizedCartItem.displayName = 'OptimizedCartItem';

// Main Optimized Order Interface
const OptimizedOrderInterface = memo(({ 
  categories = [], 
  menuItems = [], 
  cartItems = [], 
  onCategorySelect,
  onItemAddToCart,
  onItemSelect,
  onCartUpdate,
  onCartRemove,
  onCheckout,
  activeCategory = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(menuItems);
  const searchInputRef = useRef(null);

  // Memoize cart items map for performance
  const cartItemsMap = useMemo(() => 
    new Map(cartItems.map(item => [item.id, item])),
    [cartItems]
  );

  // Optimized search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        const filtered = menuItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredItems(filtered);
      } else {
        setFilteredItems(menuItems);
      }
    }, 200); // 200ms debounce for search

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, menuItems]);

  // Optimized category selection
  const handleCategorySelect = useCallback((category) => {
    const tracker = trackUINavigation(`category_${category.id}`, async () => {
      await onCategorySelect(category);
    });
    return tracker();
  }, [onCategorySelect]);

  // Optimized search input handling
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Track search performance
    performanceMonitor.recordMetric('menu_search', performance.now(), {
      query: value,
      resultCount: filteredItems.length
    });
  }, [filteredItems.length]);

  return (
    <div className="optimized-order-interface flex flex-col lg:flex-row gap-6 p-4">
      {/* Menu Section */}
      <div className="menu-section flex-1">
        {/* Search Bar */}
        <div className="search-bar mb-6">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Category Navigation */}
        <div className="category-nav mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map(category => (
              <EnhancedButton
                key={category.id}
                variant={activeCategory?.id === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategorySelect(category)}
                className="whitespace-nowrap"
                debounceMs={100}
              >
                {category.name}
              </EnhancedButton>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="menu-content">
          {searchQuery ? (
            // Search Results
            <div className="search-results">
              <h2 className="text-xl font-bold mb-4">
                Search Results ({filteredItems.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <OptimizedMenuItem
                    key={item.id}
                    item={item}
                    onAddToCart={onItemAddToCart}
                    onViewDetails={onItemSelect}
                    isInCart={cartItemsMap.has(item.id)}
                    cartQuantity={cartItemsMap.get(item.id)?.quantity || 0}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Category View
            categories.map(category => (
              <OptimizedMenuCategory
                key={category.id}
                category={category}
                items={menuItems}
                onItemSelect={onItemSelect}
                onItemAddToCart={onItemAddToCart}
                cartItems={cartItemsMap}
                isActive={!activeCategory || activeCategory.id === category.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="cart-section w-full lg:w-96">
        <OptimizedCart
          items={cartItems}
          onUpdateQuantity={onCartUpdate}
          onRemoveItem={onCartRemove}
          onCheckout={onCheckout}
        />
      </div>
    </div>
  );
});

OptimizedOrderInterface.displayName = 'OptimizedOrderInterface';

export {
  OptimizedOrderInterface,
  OptimizedMenuItem,
  OptimizedMenuCategory,
  OptimizedCart,
  OptimizedCartItem
};

export default OptimizedOrderInterface;