import React from 'react';
import { Button } from './ui/button';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

/**
 * OrderItemsList Component
 * 
 * Displays the list of selected items in an order with quantity controls
 * and removal options.
 * 
 * Features:
 * - Display item name, quantity, price, and line total
 * - Quantity controls (+/- buttons)
 * - Remove button for each item
 * - Empty state message when no items
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of order items
 * @param {Function} props.onQuantityChange - Callback when quantity changes (index, delta)
 * @param {Function} props.onRemove - Callback when item is removed (index)
 */
const OrderItemsList = ({ items, onQuantityChange, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" data-testid="empty-order-state">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No items added yet</p>
        <p className="text-sm mt-1">Search and add items to start building the order</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="order-items-list">
      {items.map((item, index) => {
        const lineTotal = item.price * item.quantity;
        
        return (
          <div 
            key={index} 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            data-testid={`order-item-${index}`}
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900" data-testid={`item-name-${index}`}>
                {item.name}
              </p>
              <p className="text-sm text-gray-600" data-testid={`item-price-${index}`}>
                ₹{parseFloat(item.price).toFixed(2)} each
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onQuantityChange(index, -1)}
                  data-testid={`decrease-quantity-${index}`}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <span 
                  className="w-8 text-center font-medium"
                  data-testid={`item-quantity-${index}`}
                >
                  {item.quantity}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onQuantityChange(index, 1)}
                  data-testid={`increase-quantity-${index}`}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Line Total */}
              <div className="min-w-[80px] text-right">
                <p className="font-semibold text-gray-900" data-testid={`line-total-${index}`}>
                  ₹{lineTotal.toFixed(2)}
                </p>
              </div>
              
              {/* Remove Button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onRemove(index)}
                data-testid={`remove-item-${index}`}
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderItemsList;
