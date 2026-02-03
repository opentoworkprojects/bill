/**
 * Order Fetcher - Simplified, atomic order fetching to prevent duplicates
 * 
 * This utility provides clean, atomic order fetching operations that prevent
 * the complex state merging that was causing duplicate orders.
 */

import { apiWithRetry } from './apiClient';
import { filterServerActiveOrders, normalizeStatus } from './orderWorkflowRules';

/**
 * Fetch orders with atomic state updates to prevent duplicates
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} options - Fetch options
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @param {string} options.source - Source of the request (for logging)
 * @param {Set} recentPaymentCompletions - Set of recently completed payment IDs
 * @returns {Promise<Object>} - Object containing active orders and completed orders
 */
export async function fetchOrdersAtomic(apiUrl, options = {}, recentPaymentCompletions = new Set()) {
  const { signal, source = 'unknown' } = options;
  
  console.log(`🚀 Fetching orders atomically from: ${source}`);
  
  try {
    // Always fetch fresh data from database with cache-busting
    const params = `?fresh=true&_t=${Date.now()}`;
    const response = await apiWithRetry({
      method: 'get',
      url: `${apiUrl}/orders${params}`,
      timeout: 10000,
      signal // Pass abort signal for cancellation
    });
    
    const ordersData = Array.isArray(response.data) ? response.data : [];
    console.log(`📦 Received ${ordersData.length} orders from server`);
    
    // Validate and clean order data
    const validOrders = ordersData.filter(order => {
      // Ensure order has required fields
      if (!order || !order.id || !order.created_at || !order.status || 
          typeof order.total !== 'number' || !Array.isArray(order.items)) {
        console.warn('⚠️ Invalid order data:', order?.id);
        return false;
      }
      return true;
    }).map(order => ({
      ...order,
      // Ensure all required fields have default values
      customer_name: order.customer_name || '',
      table_number: order.table_number || 0,
      payment_method: order.payment_method || 'cash',
      payment_received: order.payment_received || 0,
      balance_amount: order.balance_amount || 0,
      is_credit: order.is_credit || false,
      created_at: order.created_at || new Date().toISOString()
    }));
    
    // Sort orders by creation date (newest first)
    const sortedOrders = validOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // ATOMIC SEPARATION: Split orders into active and completed
    const activeOrders = [];
    const completedOrders = [];
    
    sortedOrders.forEach(order => {
      const status = normalizeStatus(order.status);
      
      // Check if order is completed or paid
      if (['completed', 'paid', 'cancelled', 'billed', 'settled'].includes(status)) {
        completedOrders.push(order);
      } else {
        // Additional checks for active orders
        if (!recentPaymentCompletions.has(order.id)) {
          // Only move to completed if status is explicitly completed/paid
          // Don't auto-complete based on payment amount alone
          activeOrders.push(order);
        } else {
          // Recently completed via payment, move to completed
          completedOrders.push({
            ...order,
            status: 'completed'
          });
        }
      }
    });
    
    console.log(`📊 Order separation complete:`, {
      total: sortedOrders.length,
      active: activeOrders.length,
      completed: completedOrders.length,
      source
    });
    
    // Log any orders that were moved from active to completed
    if (completedOrders.length > 0) {
      const recentlyCompleted = completedOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return orderDate >= today;
      });
      
      if (recentlyCompleted.length > 0) {
        console.log(`✅ Found ${recentlyCompleted.length} recently completed orders`);
      }
    }
    
    return {
      activeOrders,
      completedOrders,
      totalOrders: sortedOrders.length,
      source
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`🚫 Order fetch cancelled from: ${source}`);
      throw error;
    }
    
    console.error(`❌ Failed to fetch orders from: ${source}`, error);
    
    // Return empty results on error
    return {
      activeOrders: [],
      completedOrders: [],
      totalOrders: 0,
      source,
      error: error.message
    };
  }
}

/**
 * Fetch today's bills (completed orders) with atomic updates
 * 
 * @param {string} apiUrl - Base API URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - Array of today's completed orders
 */
export async function fetchTodaysBillsAtomic(apiUrl, options = {}) {
  const { signal, source = 'unknown' } = options;
  
  console.log(`📋 Fetching today's bills atomically from: ${source}`);
  
  try {
    // Get today's date range
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const params = `?start_date=${todayStart.toISOString()}&end_date=${todayEnd.toISOString()}&status=completed&fresh=true&_t=${Date.now()}`;
    const response = await apiWithRetry({
      method: 'get',
      url: `${apiUrl}/orders${params}`,
      timeout: 10000,
      signal
    });
    
    const billsData = Array.isArray(response.data) ? response.data : [];
    
    // Filter and sort completed orders
    const todaysBills = billsData
      .filter(order => {
        if (!order || !order.id) return false;
        const status = normalizeStatus(order.status);
        return ['completed', 'paid', 'billed', 'settled'].includes(status);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`📋 Found ${todaysBills.length} bills for today from: ${source}`);
    
    return todaysBills;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`🚫 Bills fetch cancelled from: ${source}`);
      throw error;
    }
    
    console.error(`❌ Failed to fetch today's bills from: ${source}`, error);
    return [];
  }
}

/**
 * Merge new orders with existing orders, preventing duplicates
 * 
 * @param {Array} existingOrders - Current orders in state
 * @param {Array} newOrders - New orders from server
 * @param {string} source - Source of the update (for logging)
 * @returns {Array} - Merged orders without duplicates
 */
export function mergeOrdersAtomic(existingOrders = [], newOrders = [], source = 'unknown') {
  console.log(`🔄 Merging orders atomically from: ${source}`, {
    existing: existingOrders.length,
    new: newOrders.length
  });
  
  // Create a map of new orders by ID for fast lookup
  const newOrdersMap = new Map();
  newOrders.forEach(order => {
    if (order && order.id) {
      newOrdersMap.set(order.id, order);
    }
  });
  
  // Start with new orders (they are the source of truth)
  const mergedOrders = [...newOrders];
  
  // Add any existing orders that are not in the new orders
  // (This handles edge cases where local state has orders not yet reflected on server)
  existingOrders.forEach(existingOrder => {
    if (existingOrder && existingOrder.id && !newOrdersMap.has(existingOrder.id)) {
      // Only add if it's not a recently completed order
      const status = normalizeStatus(existingOrder.status);
      if (!['completed', 'paid', 'cancelled', 'billed', 'settled'].includes(status)) {
        mergedOrders.push(existingOrder);
      }
    }
  });
  
  // Sort by creation date (newest first)
  const sortedMerged = mergedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  console.log(`✅ Orders merged successfully from: ${source}`, {
    result: sortedMerged.length,
    duplicatesRemoved: (existingOrders.length + newOrders.length) - sortedMerged.length
  });
  
  return sortedMerged;
}