/**
 * Request Batcher - Combines multiple API calls into single batch requests
 * Dramatically reduces server load while maintaining responsiveness
 */

import axios from 'axios';
import { API } from '../App';

class RequestBatcher {
  constructor() {
    this.batches = new Map();
    this.batchDelay = 50; // Wait 50ms to collect requests
    this.maxBatchSize = 10; // Max requests per batch
  }

  /**
   * Batch multiple GET requests into a single call
   */
  async batchGet(endpoint, params = {}) {
    const batchKey = `GET:${endpoint}`;
    
    return new Promise((resolve, reject) => {
      // Get or create batch for this endpoint
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, {
          requests: [],
          timer: null
        });
      }

      const batch = this.batches.get(batchKey);
      
      // Add request to batch
      batch.requests.push({ params, resolve, reject });

      // Clear existing timer
      if (batch.timer) {
        clearTimeout(batch.timer);
      }

      // Execute batch after delay or when max size reached
      if (batch.requests.length >= this.maxBatchSize) {
        this.executeBatch(batchKey, endpoint);
      } else {
        batch.timer = setTimeout(() => {
          this.executeBatch(batchKey, endpoint);
        }, this.batchDelay);
      }
    });
  }

  /**
   * Execute a batch of requests
   */
  async executeBatch(batchKey, endpoint) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;

    // Remove batch from map
    this.batches.delete(batchKey);

    const requests = batch.requests;
    console.log(`📦 Executing batch of ${requests.length} requests to ${endpoint}`);

    try {
      // For now, execute requests in parallel (can be optimized to single API call)
      const results = await Promise.allSettled(
        requests.map(req => 
          axios.get(`${API}${endpoint}`, { params: req.params })
        )
      );

      // Resolve individual promises
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          requests[index].resolve(result.value);
        } else {
          requests[index].reject(result.reason);
        }
      });

    } catch (error) {
      // Reject all requests on batch failure
      requests.forEach(req => req.reject(error));
    }
  }

  /**
   * Batch multiple order fetches into single call
   */
  async batchFetchOrders(orderIds) {
    if (!orderIds || orderIds.length === 0) return [];

    try {
      // Single API call to fetch multiple orders
      const response = await axios.post(`${API}/orders/batch`, {
        order_ids: orderIds
      });

      return response.data;
    } catch (error) {
      console.error('Batch fetch orders failed:', error);
      throw error;
    }
  }

  /**
   * Batch multiple status updates into single call
   */
  async batchUpdateStatus(updates) {
    if (!updates || updates.length === 0) return [];

    try {
      // Single API call to update multiple order statuses
      const response = await axios.post(`${API}/orders/batch-status`, {
        updates: updates.map(u => ({
          order_id: u.orderId,
          status: u.status
        }))
      });

      return response.data;
    } catch (error) {
      console.error('Batch status update failed:', error);
      throw error;
    }
  }

  /**
   * Prefetch multiple resources in a single batch
   */
  async prefetchBatch(resources) {
    if (!resources || resources.length === 0) return {};

    try {
      // Single API call to fetch multiple resources
      const response = await axios.post(`${API}/batch/prefetch`, {
        resources: resources.map(r => ({
          type: r.type, // 'order', 'menu', 'table', 'settings'
          id: r.id
        }))
      });

      return response.data;
    } catch (error) {
      console.error('Batch prefetch failed:', error);
      throw error;
    }
  }

  /**
   * Clear all pending batches
   */
  clearAll() {
    this.batches.forEach(batch => {
      if (batch.timer) {
        clearTimeout(batch.timer);
      }
      batch.requests.forEach(req => {
        req.reject(new Error('Batch cleared'));
      });
    });
    this.batches.clear();
  }
}

// Singleton instance
const requestBatcher = new RequestBatcher();

export default requestBatcher;
