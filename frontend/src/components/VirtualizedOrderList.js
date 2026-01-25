/**
 * Ultra-Performance Virtualized Order List
 * Renders only visible items for lightning-fast scrolling
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './VirtualizedOrderList.css';

const VirtualizedOrderList = ({ 
  orders = [], 
  itemHeight = 120, 
  containerHeight = 600,
  onOrderClick,
  onOrderUpdate,
  renderOrder
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
      orders.length
    );
    
    return {
      start: Math.max(0, visibleStart - 2), // Buffer items
      end: Math.min(orders.length, visibleEnd + 2)
    };
  }, [scrollTop, itemHeight, containerHeight, orders.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return orders.slice(visibleRange.start, visibleRange.end).map((order, index) => ({
      ...order,
      index: visibleRange.start + index
    }));
  }, [orders, visibleRange]);

  // Handle scroll with throttling
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // Throttled scroll handler
  const throttledScrollHandler = useMemo(() => {
    let ticking = false;
    return (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll(e);
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Scroll to specific order
  const scrollToOrder = useCallback((orderIndex) => {
    if (scrollElementRef.current) {
      const scrollTop = orderIndex * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // Default order renderer
  const defaultRenderOrder = useCallback((order, index) => (
    <div 
      key={order.id}
      className="virtualized-order-item"
      onClick={() => onOrderClick?.(order)}
      style={{
        height: itemHeight,
        transform: `translateY(${index * itemHeight}px)`,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%'
      }}
    >
      <div className="order-header">
        <span className="order-id">#{order.invoice_number || order.id?.slice(-6)}</span>
        <span className={`order-status status-${order.status}`}>
          {order.status?.toUpperCase()}
        </span>
        <span className="order-time">
          {new Date(order.created_at).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="order-details">
        <div className="table-info">
          Table {order.table_number} • {order.customer_name || 'Walk-in'}
        </div>
        <div className="order-items">
          {order.items?.slice(0, 2).map(item => item.name).join(', ')}
          {order.items?.length > 2 && ` +${order.items.length - 2} more`}
        </div>
      </div>
      
      <div className="order-footer">
        <span className="order-total">₹{order.total?.toFixed(2)}</span>
        <span className="waiter-name">{order.waiter_name}</span>
      </div>
    </div>
  ), [itemHeight, onOrderClick]);

  // Performance metrics
  const metrics = useMemo(() => ({
    totalOrders: orders.length,
    visibleOrders: visibleItems.length,
    renderRatio: `${((visibleItems.length / orders.length) * 100).toFixed(1)}%`,
    scrollPosition: `${((scrollTop / ((orders.length * itemHeight) - containerHeight)) * 100).toFixed(1)}%`
  }), [orders.length, visibleItems.length, scrollTop, itemHeight, containerHeight]);

  return (
    <div 
      ref={containerRef}
      className="virtualized-order-list"
      style={{ height: containerHeight }}
    >
      {/* Performance indicator */}
      <div className="performance-indicator">
        Rendering {visibleItems.length}/{orders.length} orders ({metrics.renderRatio})
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollElementRef}
        className="scroll-container"
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={throttledScrollHandler}
      >
        {/* Virtual spacer for total height */}
        <div 
          className="virtual-spacer"
          style={{ height: orders.length * itemHeight, position: 'relative' }}
        >
          {/* Render visible items */}
          {visibleItems.map((order) => 
            renderOrder ? 
              renderOrder(order, order.index) : 
              defaultRenderOrder(order, order.index)
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div 
          className="scroll-thumb"
          style={{
            height: `${(containerHeight / (orders.length * itemHeight)) * 100}%`,
            top: `${(scrollTop / (orders.length * itemHeight)) * 100}%`
          }}
        />
      </div>

      {/* Quick navigation */}
      <div className="quick-nav">
        <button 
          onClick={() => scrollToOrder(0)}
          disabled={orders.length === 0}
        >
          ⬆️ Top
        </button>
        <button 
          onClick={() => scrollToOrder(orders.length - 1)}
          disabled={orders.length === 0}
        >
          ⬇️ Bottom
        </button>
      </div>
    </div>
  );
};

// Higher-order component for enhanced performance
export const withVirtualization = (WrappedComponent) => {
  return React.memo((props) => {
    const [isVisible, setIsVisible] = useState(true);
    const observerRef = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      if (observerRef.current) {
        observer.observe(observerRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={observerRef}>
        {isVisible && <WrappedComponent {...props} />}
      </div>
    );
  });
};

// Hook for virtualized list management
export const useVirtualizedList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return { start: Math.max(0, start - 1), end: end + 1 };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  return {
    visibleItems,
    visibleRange,
    scrollTop,
    setScrollTop,
    totalHeight: items.length * itemHeight
  };
};

export default React.memo(VirtualizedOrderList);