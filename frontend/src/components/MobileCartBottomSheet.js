import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ShoppingCart, ChevronUp, ChevronDown, X, Trash2 } from 'lucide-react';

const MobileCartBottomSheet = ({
  selectedItems,
  subtotal,
  discountAmount,
  tax,
  total,
  expanded,
  onToggle,
  onAdjustQuantity,
  onCheckout,
  currency = '₹'
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sheetRef = useRef(null);

  // Calculate total item count
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  }, []);

  // Handle touch end (swipe gesture)
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && !expanded) {
      onToggle();
    } else if (isSwipeDown && expanded) {
      onToggle();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, expanded, onToggle]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (expanded && sheetRef.current && !sheetRef.current.contains(e.target)) {
        onToggle();
      }
    };

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expanded, onToggle]);

  // Handle quantity adjustment
  const handleQuantityChange = useCallback((menuItemId, delta) => {
    onAdjustQuantity(menuItemId, delta);
  }, [onAdjustQuantity]);

  // Handle remove item (swipe to delete)
  const handleRemoveItem = useCallback((menuItemId) => {
    const item = selectedItems.find((i) => i.menu_item_id === menuItemId);
    if (item) {
      onAdjustQuantity(menuItemId, -item.quantity);
    }
  }, [selectedItems, onAdjustQuantity]);

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300"
          style={{ top: 0 }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-all duration-300 ease-out ${
          expanded ? 'h-[60vh]' : 'h-20'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Collapsed State - Summary */}
        {!expanded && (
          <div
            onClick={onToggle}
            className="flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-violet-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {currency}{total.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-violet-700 active:scale-95 transition-transform"
              style={{ minHeight: '44px' }}
            >
              View Cart
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Expanded State - Full Cart */}
        {expanded && (
          <div className="flex flex-col h-full pb-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
              <button
                onClick={onToggle}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                aria-label="Close cart"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mt-2">Add items from the menu to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.menu_item_id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-violet-600 font-medium">
                          {currency}{parseFloat(item.price || 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.menu_item_id, -1)}
                          className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-90 transition-transform"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          aria-label="Decrease quantity"
                        >
                          <span className="text-lg font-bold">−</span>
                        </button>
                        <span className="text-lg font-bold text-gray-800 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.menu_item_id, 1)}
                          className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600 active:scale-90 transition-transform"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          aria-label="Increase quantity"
                        >
                          <span className="text-lg font-bold">+</span>
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.menu_item_id)}
                          className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full active:scale-90 transition-transform ml-2"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {selectedItems.length > 0 && (
              <div className="border-t px-4 py-3 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{currency}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{currency}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                  <span>Total</span>
                  <span>{currency}{total.toFixed(2)}</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={onCheckout}
                  className="w-full bg-violet-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-violet-700 active:scale-98 transition-transform mt-3"
                  style={{ minHeight: '56px' }}
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MobileCartBottomSheet;
