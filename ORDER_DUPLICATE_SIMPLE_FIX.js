// 🔧 Simple fix for duplicate orders in OrdersPage.js
// Add this code to prevent duplicate orders during polling

// Add this state variable near the top of the component
const [lastOrdersUpdate, setLastOrdersUpdate] = useState(0);
const [isUpdatingOrders, setIsUpdatingOrders] = useState(false);

// Replace the setOrders call in fetchOrders with this deduplication logic:
const updateOrdersWithDeduplication = (newOrders) => {
  const now = Date.now();
  
  // Prevent rapid successive updates (debounce)
  if (now - lastOrdersUpdate < 500) {
    console.log('⏸️ Skipping order update - too soon after last update');
    return;
  }
  
  // Prevent concurrent updates
  if (isUpdatingOrders) {
    console.log('⏸️ Skipping order update - update already in progress');
    return;
  }
  
  setIsUpdatingOrders(true);
  setLastOrdersUpdate(now);
  
  setOrders(prevOrders => {
    // Create a map of existing orders for fast lookup
    const existingOrdersMap = new Map();
    prevOrders.forEach(order => {
      if (order && order.id) {
        existingOrdersMap.set(order.id, order);
      }
    });
    
    // Create a map of new orders
    const newOrdersMap = new Map();
    newOrders.forEach(order => {
      if (order && order.id) {
        newOrdersMap.set(order.id, order);
      }
    });
    
    // If the orders are identical, don't update
    if (existingOrdersMap.size === newOrdersMap.size) {
      let identical = true;
      for (const [id, existingOrder] of existingOrdersMap) {
        const newOrder = newOrdersMap.get(id);
        if (!newOrder || 
            existingOrder.status !== newOrder.status ||
            existingOrder.updated_at !== newOrder.updated_at) {
          identical = false;
          break;
        }
      }
      
      if (identical) {
        console.log('📋 Orders unchanged - skipping update');
        setIsUpdatingOrders(false);
        return prevOrders;
      }
    }
    
    console.log('📋 Updating orders:', newOrders.length);
    setIsUpdatingOrders(false);
    return newOrders;
  });
};

// Usage in fetchOrders:
// Replace: setOrders(activeServerOrders);
// With: updateOrdersWithDeduplication(activeServerOrders);