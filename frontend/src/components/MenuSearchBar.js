import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * MenuSearchBar Component
 * 
 * Provides a search input with debounced filtering and keyboard navigation
 * for quickly finding and adding menu items to an order.
 * 
 * Features:
 * - Debounced search (100ms delay)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Filtered dropdown with proper positioning
 * - Auto-focus after item selection
 * 
 * @param {Object} props
 * @param {Array} props.menuItems - Array of menu items to search through
 * @param {Function} props.onAddItem - Callback when an item is selected
 * @param {string} props.searchQuery - Current search query value
 * @param {Function} props.onSearchChange - Callback when search query changes
 */
const MenuSearchBar = ({ menuItems, onAddItem, searchQuery, onSearchChange }) => {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounce search query (100ms delay as per requirements)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter menu items based on debounced search query
  const filteredItems = debouncedQuery.trim()
    ? menuItems.filter(item => {
        const query = debouncedQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
        );
      })
    : [];

  // Show dropdown when there are filtered results and search query exists
  useEffect(() => {
    setShowDropdown(searchQuery.trim().length > 0 && filteredItems.length > 0);
    setSelectedIndex(0); // Reset selection when results change
  }, [searchQuery, filteredItems.length]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredItems.length === 0) {
      if (e.key === 'Escape') {
        handleClearSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        handleClearSearch();
        break;
      
      default:
        break;
    }
  };

  // Handle item selection
  const handleSelectItem = (item) => {
    onAddItem(item);
    handleClearSearch();
    // Refocus search input for continuous item entry
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Clear search and close dropdown
  const handleClearSearch = () => {
    onSearchChange('');
    setShowDropdown(false);
    setSelectedIndex(0);
    setShowCustomForm(false);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  // Handle custom item addition
  const handleAddCustomItem = () => {
    const price = parseFloat(customItemPrice);
    
    if (!customItemName.trim()) {
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      return;
    }

    // Create a custom item object
    const customItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      category: 'Custom',
      price: price,
      description: 'Custom item'
    };

    onAddItem(customItem);
    handleClearSearch();
    
    // Refocus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, showDropdown]);

  return (
    <div className="relative" data-testid="menu-search-bar">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search menu items by name, category, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-12 text-base"
          data-testid="menu-search-input"
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="clear-search-button"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <Card
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto shadow-xl border-2 border-violet-100 z-50"
          data-testid="search-dropdown"
        >
          <div className="p-2">
            {filteredItems.map((item, index) => (
              <button
                key={item.id}
                data-index={index}
                onClick={() => handleSelectItem(item)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === selectedIndex
                    ? 'bg-violet-100 border-2 border-violet-300'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
                data-testid={`search-result-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{item.category}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-lg font-semibold text-violet-600">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </span>
                    <Plus className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
                {!item.available && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      Currently Unavailable
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* No Results Message with Custom Item Form */}
      {searchQuery.trim() && filteredItems.length === 0 && debouncedQuery === searchQuery && (
        <Card
          className="absolute top-full left-0 right-0 mt-2 shadow-xl border-2 border-gray-100 z-50"
          data-testid="no-results-message"
        >
          <div className="p-6">
            {!showCustomForm ? (
              <div className="text-center text-gray-500">
                <p className="font-medium">No menu items found</p>
                <p className="text-sm mt-1 mb-4">Try a different search term or add a custom item</p>
                <Button
                  onClick={() => {
                    setShowCustomForm(true);
                    setCustomItemName(searchQuery);
                  }}
                  variant="outline"
                  className="w-full"
                  data-testid="show-custom-form-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Item
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Add Custom Item</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <Input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Enter item name"
                    className="w-full"
                    data-testid="custom-item-name-input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <Input
                    type="number"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    className="w-full"
                    data-testid="custom-item-price-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomItem();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCustomItem}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    disabled={!customItemName.trim() || !customItemPrice || parseFloat(customItemPrice) <= 0}
                    data-testid="add-custom-item-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomItemName('');
                      setCustomItemPrice('');
                    }}
                    variant="outline"
                    data-testid="cancel-custom-item-button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MenuSearchBar;
