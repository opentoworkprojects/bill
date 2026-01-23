import React, { useRef, useEffect, useState } from 'react'
import { VirtualScroller } from '../utils/apiClient'

/**
 * VirtualOrdersList Component
 * Renders large lists of orders efficiently using virtual scrolling
 * Only renders visible items + buffer, dramatically reducing DOM nodes
 * 
 * Performance: 1000+ orders at 60fps
 */
export function VirtualOrdersList({ 
  orders = [], 
  onOrderClick = null,
  itemHeight = 70,
  bufferSize = 5
}) {
  const containerRef = useRef(null)
  const virtualizerRef = useRef(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 })

  useEffect(() => {
    if (!containerRef.current || orders.length === 0) return

    // Only use virtual scrolling for large lists (100+ items)
    if (orders.length < 100) {
      setVisibleRange({ start: 0, end: orders.length })
      return
    }

    // Create virtual scroller
    const handleScroll = () => {
      if (!containerRef.current) return

      const scrollTop = containerRef.current.scrollTop
      const containerHeight = containerRef.current.clientHeight
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
      const end = Math.min(
        orders.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
      )

      setVisibleRange({ start, end })
    }

    const scrollContainer = containerRef.current
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial render
    handleScroll()

    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [orders.length, itemHeight, bufferSize])

  // Render only visible items
  const visibleItems = orders.slice(visibleRange.start, visibleRange.end)
  const offsetY = visibleRange.start * itemHeight
  const totalHeight = orders.length * itemHeight

  const renderOrderItem = (order, index) => (
    <div
      key={order._id || index}
      className="order-row border-b hover:bg-blue-50 cursor-pointer transition-colors"
      onClick={() => onOrderClick && onOrderClick(order)}
      style={{ height: itemHeight, display: 'flex', alignItems: 'center' }}
    >
      <div className="flex-1 px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Order Number */}
          <div className="font-bold text-blue-600 text-lg">
            #{order.number || order._id?.slice(-4)}
          </div>

          {/* Customer Name */}
          <div className="text-gray-700 font-medium">
            {order.customer_name || 'Walk-in'}
          </div>

          {/* Table Number */}
          <div className="text-sm text-gray-600">
            Table {order.table_number || '-'}
          </div>

          {/* Total Amount */}
          <div className="font-bold text-green-600">
            ₹{(order.total || 0).toFixed(2)}
          </div>

          {/* Status Badge */}
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'}
          `}>
            {order.status || 'Unknown'}
          </div>

          {/* Items Count */}
          <div className="text-sm text-gray-600">
            {order.items?.length || 0} items
          </div>

          {/* Time */}
          <div className="text-xs text-gray-500 w-16 text-right">
            {order.created_at ? new Date(order.created_at).toLocaleTimeString() : '-'}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex justify-between items-center text-sm font-medium text-gray-600">
          <div className="flex-1">Order</div>
          <div>Customer</div>
          <div>Table</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Items</div>
          <div className="w-16 text-right">Time</div>
        </div>
      </div>

      {/* Virtual Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{
          contain: 'strict', // CSS containment for performance
          contentVisibility: 'auto', // Only render visible content
          contentVisibilityAutoEntryAnimation: 'auto'
        }}
      >
        {/* Top Spacer */}
        <div style={{ height: offsetY, pointerEvents: 'none' }} />

        {/* Visible Items */}
        <div>
          {visibleItems.map((order, idx) => 
            renderOrderItem(order, visibleRange.start + idx)
          )}
        </div>

        {/* Bottom Spacer */}
        <div style={{ height: Math.max(0, totalHeight - (visibleRange.end * itemHeight)), pointerEvents: 'none' }} />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t px-4 py-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Showing {visibleRange.start + 1} - {Math.min(visibleRange.end, orders.length)} of {orders.length}</span>
          <span className="text-xs">Scroll for more</span>
        </div>
      </div>
    </div>
  )
}

export default VirtualOrdersList
