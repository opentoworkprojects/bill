/**
 * Menu Optimistic State Manager
 * Manages optimistic updates and rollback logic for menu operations
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 8.1
 */

/**
 * Pending operation structure
 * @typedef {Object} PendingOperation
 * @property {string} id - Unique operation ID
 * @property {'create'|'update'|'delete'|'toggle_availability'|'toggle_popularity'} type - Operation type
 * @property {string} itemId - Menu item ID (temporary for creates)
 * @property {number} timestamp - Operation timestamp
 * @property {Object} originalState - Original item state (for rollback)
 * @property {Object} optimisticState - Optimistic item state
 * @property {number} retryCount - Number of retry attempts
 * @property {number} maxRetries - Maximum retry attempts
 */

/**
 * Rollback action structure
 * @typedef {Object} RollbackAction
 * @property {string} operationId - Operation ID to rollback
 * @property {Function} rollbackFn - Function to execute rollback
 * @property {string} errorMessage - Error message to display
 */

class MenuOptimisticStateManager {
  constructor() {
    this.pendingOperations = new Map();
    this.rollbackQueue = [];
    this.optimisticItems = new Map();
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Log debug messages in development mode
   */
  log(message, data = null) {
    if (this.debugMode) {
      const timestamp = new Date().toISOString();
      console.log(`[MenuOptimisticState ${timestamp}] ${message}`, data || '');
    }
  }

  /**
   * Generate temporary ID for optimistic items
   * @returns {string} - Temporary ID with 'temp_' prefix
   */
  generateTemporaryId() {
    // Use crypto.randomUUID if available, fallback to timestamp-based ID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `temp_${crypto.randomUUID()}`;
    }
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Apply optimistic update immediately
   * @param {PendingOperation} operation - Operation to apply
   * @returns {Object} - Optimistic item state
   */
  applyOptimisticUpdate(operation) {
    const startTime = Date.now();
    
    if (!operation || !operation.id) {
      this.log('Invalid operation provided to applyOptimisticUpdate', operation);
      return null;
    }

    // Store pending operation
    this.pendingOperations.set(operation.id, {
      ...operation,
      timestamp: startTime,
      retryCount: operation.retryCount || 0,
      maxRetries: operation.maxRetries || 3
    });

    // Store optimistic item
    if (operation.optimisticState) {
      this.optimisticItems.set(operation.itemId, {
        ...operation.optimisticState,
        _optimistic: true,
        _pendingOperationId: operation.id,
        _originalState: operation.originalState
      });
    }

    this.log(`Optimistic update applied for ${operation.type}`, {
      operationId: operation.id,
      itemId: operation.itemId,
      duration: Date.now() - startTime
    });

    return this.optimisticItems.get(operation.itemId);
  }

  /**
   * Confirm successful operation
   * @param {string} operationId - Operation ID to confirm
   * @param {Object} serverData - Data from server response
   * @returns {boolean} - Success status
   */
  confirmOperation(operationId, serverData = null) {
    const operation = this.pendingOperations.get(operationId);
    
    if (!operation) {
      this.log(`Operation ${operationId} not found for confirmation`);
      return false;
    }

    // Remove from pending operations
    this.pendingOperations.delete(operationId);

    // Update optimistic item with server data
    if (serverData && operation.itemId) {
      this.optimisticItems.set(operation.itemId, {
        ...serverData,
        _optimistic: false,
        _pendingOperationId: null,
        _originalState: null
      });
    } else if (operation.type === 'delete') {
      // Remove deleted item
      this.optimisticItems.delete(operation.itemId);
    }

    this.log(`Operation ${operationId} confirmed`, {
      type: operation.type,
      itemId: operation.itemId,
      hasServerData: !!serverData
    });

    return true;
  }

  /**
   * Rollback failed operation
   * @param {string} operationId - Operation ID to rollback
   * @param {Error} error - Error that caused the failure
   * @returns {Object|null} - Rolled back item state or null
   */
  rollbackOperation(operationId, error) {
    const operation = this.pendingOperations.get(operationId);
    
    if (!operation) {
      this.log(`Operation ${operationId} not found for rollback`);
      return null;
    }

    let rolledBackState = null;

    // Perform rollback based on operation type
    switch (operation.type) {
      case 'create':
        // Remove optimistic item
        this.optimisticItems.delete(operation.itemId);
        this.log(`Rolled back create operation for item ${operation.itemId}`);
        break;

      case 'update':
      case 'toggle_availability':
      case 'toggle_popularity':
        // Restore original state
        if (operation.originalState) {
          this.optimisticItems.set(operation.itemId, {
            ...operation.originalState,
            _optimistic: false,
            _pendingOperationId: null,
            _originalState: null
          });
          rolledBackState = operation.originalState;
          this.log(`Rolled back ${operation.type} operation for item ${operation.itemId}`);
        }
        break;

      case 'delete':
        // Restore deleted item
        if (operation.originalState) {
          this.optimisticItems.set(operation.itemId, {
            ...operation.originalState,
            _optimistic: false,
            _pendingOperationId: null,
            _originalState: null
          });
          rolledBackState = operation.originalState;
          this.log(`Rolled back delete operation for item ${operation.itemId}`);
        }
        break;

      default:
        this.log(`Unknown operation type for rollback: ${operation.type}`);
    }

    // Remove from pending operations
    this.pendingOperations.delete(operationId);

    // Add to rollback queue for UI notification
    const errorMessage = this.generateErrorMessage(operation, error);
    this.rollbackQueue.push({
      operationId,
      operation,
      errorMessage,
      timestamp: Date.now()
    });

    // Limit rollback queue size
    if (this.rollbackQueue.length > 10) {
      this.rollbackQueue.shift();
    }

    this.log(`Operation ${operationId} rolled back`, {
      type: operation.type,
      itemId: operation.itemId,
      error: error?.message
    });

    return rolledBackState;
  }

  /**
   * Generate user-friendly error message
   * @param {PendingOperation} operation - Failed operation
   * @param {Error} error - Error object
   * @returns {string} - Error message
   */
  generateErrorMessage(operation, error) {
    const operationNames = {
      create: 'create menu item',
      update: 'update menu item',
      delete: 'delete menu item',
      toggle_availability: 'toggle item availability',
      toggle_popularity: 'toggle item popularity'
    };

    const operationName = operationNames[operation.type] || 'perform operation';
    const baseMessage = `Failed to ${operationName}`;

    if (error?.response?.status === 401) {
      return `${baseMessage}: Authentication required. Please log in again.`;
    } else if (error?.response?.status === 403) {
      return `${baseMessage}: You don't have permission to perform this action.`;
    } else if (error?.response?.status === 404) {
      return `${baseMessage}: Item not found.`;
    } else if (error?.response?.status === 409) {
      return `${baseMessage}: Conflict with existing data.`;
    } else if (error?.response?.status >= 500) {
      return `${baseMessage}: Server error. Please try again later.`;
    } else if (error?.message?.includes('Network Error')) {
      return `${baseMessage}: Network connection lost. Please check your internet connection.`;
    } else if (error?.message) {
      return `${baseMessage}: ${error.message}`;
    }

    return `${baseMessage}. Please try again.`;
  }

  /**
   * Get all pending operations
   * @returns {Array<PendingOperation>} - Array of pending operations
   */
  getPendingOperations() {
    return Array.from(this.pendingOperations.values());
  }

  /**
   * Get pending operation by ID
   * @param {string} operationId - Operation ID
   * @returns {PendingOperation|null} - Pending operation or null
   */
  getPendingOperation(operationId) {
    return this.pendingOperations.get(operationId) || null;
  }

  /**
   * Check if operation is pending
   * @param {string} operationId - Operation ID
   * @returns {boolean} - True if operation is pending
   */
  isOperationPending(operationId) {
    return this.pendingOperations.has(operationId);
  }

  /**
   * Get optimistic item by ID
   * @param {string} itemId - Item ID
   * @returns {Object|null} - Optimistic item or null
   */
  getOptimisticItem(itemId) {
    return this.optimisticItems.get(itemId) || null;
  }

  /**
   * Get all optimistic items
   * @returns {Array<Object>} - Array of optimistic items
   */
  getAllOptimisticItems() {
    return Array.from(this.optimisticItems.values());
  }

  /**
   * Get recent rollbacks
   * @param {number} limit - Maximum number of rollbacks to return
   * @returns {Array<RollbackAction>} - Array of recent rollbacks
   */
  getRecentRollbacks(limit = 5) {
    return this.rollbackQueue.slice(-limit);
  }

  /**
   * Clear rollback queue
   */
  clearRollbackQueue() {
    this.rollbackQueue = [];
    this.log('Rollback queue cleared');
  }

  /**
   * Check if item can be retried
   * @param {string} operationId - Operation ID
   * @returns {boolean} - True if operation can be retried
   */
  canRetry(operationId) {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) return false;
    
    return operation.retryCount < operation.maxRetries;
  }

  /**
   * Increment retry count for operation
   * @param {string} operationId - Operation ID
   * @returns {boolean} - Success status
   */
  incrementRetryCount(operationId) {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) return false;

    operation.retryCount = (operation.retryCount || 0) + 1;
    this.pendingOperations.set(operationId, operation);

    this.log(`Retry count incremented for operation ${operationId}`, {
      retryCount: operation.retryCount,
      maxRetries: operation.maxRetries
    });

    return true;
  }

  /**
   * Clear all pending operations and optimistic items
   */
  clear() {
    this.pendingOperations.clear();
    this.optimisticItems.clear();
    this.rollbackQueue = [];
    this.log('All optimistic state cleared');
  }

  /**
   * Get statistics about optimistic state
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      pendingOperationsCount: this.pendingOperations.size,
      optimisticItemsCount: this.optimisticItems.size,
      rollbackQueueLength: this.rollbackQueue.length,
      pendingOperations: this.getPendingOperations().map(op => ({
        id: op.id,
        type: op.type,
        itemId: op.itemId,
        retryCount: op.retryCount,
        age: Date.now() - op.timestamp
      }))
    };
  }
}

// Create singleton instance
const menuOptimisticState = new MenuOptimisticStateManager();

// Export individual methods for convenience
export const applyOptimisticUpdate = (type, item, originalState) => 
  menuOptimisticState.applyOptimisticUpdate(type, item, originalState);
export const confirmOperation = (operationId, serverData) => 
  menuOptimisticState.confirmOperation(operationId, serverData);
export const rollbackOperation = (operationId, errorMessage) => 
  menuOptimisticState.rollbackOperation(operationId, errorMessage);
export const generateTemporaryId = () => 
  menuOptimisticState.generateTemporaryId();
export const getPendingOperations = () => 
  menuOptimisticState.getPendingOperations();
export const getOptimisticItems = () => 
  menuOptimisticState.getOptimisticItems();
export const getRollbackQueue = () => 
  menuOptimisticState.getRollbackQueue();
export const clearRollbackQueue = () => 
  menuOptimisticState.clearRollbackQueue();
export const getStats = () => 
  menuOptimisticState.getStats();

// Export both class and singleton
export { MenuOptimisticStateManager };
export default menuOptimisticState;
