/**
 * Core TypeScript interfaces for QR Order Workflow Fix
 * 
 * This module defines the fundamental data structures and interfaces
 * for the QR order processing system, ensuring type safety and
 * consistency across the application.
 */

// ============================================================================
// Core Order Types
// ============================================================================

/**
 * Represents the source of an order in the system
 */
export type OrderSource = 'QR' | 'STAFF' | 'PHONE';

/**
 * Represents the current status of an order in its lifecycle
 */
export type OrderStatusType = 'pending' | 'active' | 'preparing' | 'ready' | 'completed';

/**
 * Represents who triggered a status change
 */
export type StatusChangeTrigger = 'system' | 'staff' | 'customer';

/**
 * Represents the priority level of an order
 */
export type OrderPriority = 'normal' | 'high' | 'rush';

/**
 * Represents the validation status of an order
 */
export type ValidationStatus = 'valid' | 'invalid' | 'warning';

/**
 * Represents the routing destination for an order
 */
export type RoutingDestination = 'active_orders' | 'hold' | 'reject';

// ============================================================================
// Order Status and History
// ============================================================================

/**
 * Represents a single status change in an order's history
 */
export interface StatusChange {
  /** Previous status */
  from: OrderStatusType;
  /** New status */
  to: OrderStatusType;
  /** When the change occurred */
  timestamp: Date;
  /** Who or what triggered the change */
  triggeredBy: StatusChangeTrigger;
  /** ID of staff member if triggered by staff */
  staffId?: string;
}

/**
 * Represents the complete status information for an order
 */
export interface OrderStatus {
  /** Current status of the order */
  current: OrderStatusType;
  /** Complete history of status changes */
  history: StatusChange[];
}

// ============================================================================
// Order Items and Details
// ============================================================================

/**
 * Represents a single item in an order
 */
export interface OrderItem {
  /** Unique identifier for the item */
  id: string;
  /** Name of the item */
  name: string;
  /** Quantity ordered */
  quantity: number;
  /** Price per unit */
  unitPrice: number;
  /** Total price for this item (quantity * unitPrice) */
  totalPrice: number;
  /** Special instructions for this item */
  specialInstructions?: string;
  /** Category of the item */
  category?: string;
}

/**
 * Customer information associated with an order
 */
export interface CustomerInfo {
  /** Customer name */
  name?: string;
  /** Customer phone number */
  phone?: string;
  /** Customer email */
  email?: string;
  /** Any special customer notes */
  notes?: string;
}

/**
 * Timestamps tracking the order lifecycle
 */
export interface OrderTimestamps {
  /** When the order was placed by customer */
  placed: Date;
  /** When the order was received by the system */
  received: Date;
  /** When kitchen started preparing the order */
  started?: Date;
  /** When the order was ready for pickup/delivery */
  ready?: Date;
  /** When the order was completed/delivered */
  completed?: Date;
}

/**
 * Additional metadata for an order
 */
export interface OrderMetadata {
  /** Customer information */
  customerInfo?: CustomerInfo;
  /** Special instructions for the entire order */
  specialInstructions?: string;
  /** Estimated preparation time in minutes */
  estimatedPrepTime?: number;
  /** Priority level of the order */
  priority: OrderPriority;
}

// ============================================================================
// Core Order Interface
// ============================================================================

/**
 * Core order interface representing a customer order
 */
export interface Order {
  /** Unique identifier for the order */
  id: string;
  /** Table number where the order was placed */
  tableNumber: string;
  /** List of items in the order */
  items: OrderItem[];
  /** Source of the order (QR, STAFF, PHONE) */
  source: OrderSource;
  /** Current status and history */
  status: OrderStatus;
  /** Timestamps for order lifecycle events */
  timestamps: OrderTimestamps;
  /** Additional order metadata */
  metadata: OrderMetadata;
}

/**
 * Processed order with validation and routing information
 */
export interface ProcessedOrder extends Order {
  /** Result of order validation */
  validationStatus: ValidationStatus;
  /** Where the order should be routed */
  routingDestination: RoutingDestination;
  /** When the order was processed */
  processingTimestamp: Date;
}

// ============================================================================
// Validation Results
// ============================================================================

/**
 * Result of order validation
 */
export interface ValidationResult {
  /** Whether the order is valid */
  isValid: boolean;
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
  /** Additional validation metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Interface for order processing operations
 */
export interface OrderProcessor {
  /**
   * Process an order from a specific source
   * @param order The order to process
   * @param source The source of the order
   * @returns Promise resolving to processed order
   */
  processOrder(order: Order, source: OrderSource): Promise<ProcessedOrder>;

  /**
   * Validate an order's data integrity
   * @param order The order to validate
   * @returns Validation result
   */
  validateOrder(order: Order): ValidationResult;

  /**
   * Route a processed order to its destination
   * @param order The processed order to route
   * @returns Promise resolving when routing is complete
   */
  routeOrder(order: ProcessedOrder): Promise<void>;
}

/**
 * Callback function for status change notifications
 */
export type StatusChangeCallback = (orderId: string, oldStatus: OrderStatusType, newStatus: OrderStatusType) => void;

/**
 * Interface for order status management operations
 */
export interface StatusManager {
  /**
   * Update the status of an order
   * @param orderId The ID of the order to update
   * @param newStatus The new status to set
   * @returns Promise resolving when status is updated
   */
  updateOrderStatus(orderId: string, newStatus: OrderStatusType): Promise<void>;

  /**
   * Get the current status of an order
   * @param orderId The ID of the order
   * @returns Promise resolving to the order status
   */
  getOrderStatus(orderId: string): Promise<OrderStatus>;

  /**
   * Subscribe to status change notifications
   * @param callback Function to call when status changes occur
   */
  subscribeToStatusChanges(callback: StatusChangeCallback): void;
}

/**
 * Callback function for order update notifications
 */
export type UpdateCallback = (order: Order) => void;

/**
 * Interface for real-time synchronization operations
 */
export interface SyncService {
  /**
   * Broadcast an order update to all connected systems
   * @param order The updated order
   * @returns Promise resolving when broadcast is complete
   */
  broadcastOrderUpdate(order: Order): Promise<void>;

  /**
   * Subscribe to order updates for a specific system
   * @param systemId Identifier for the subscribing system
   * @param callback Function to call when updates are received
   */
  subscribeToUpdates(systemId: string, callback: UpdateCallback): void;

  /**
   * Handle connection loss gracefully
   */
  handleConnectionLoss(): void;

  /**
   * Resynchronize data when connection is restored
   * @returns Promise resolving when resync is complete
   */
  resyncOnReconnect(): Promise<void>;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event emitted when an order is created
 */
export interface OrderCreatedEvent {
  type: 'ORDER_CREATED';
  order: Order;
  timestamp: Date;
}

/**
 * Event emitted when an order status changes
 */
export interface OrderStatusChangedEvent {
  type: 'ORDER_STATUS_CHANGED';
  orderId: string;
  oldStatus: OrderStatusType;
  newStatus: OrderStatusType;
  timestamp: Date;
}

/**
 * Event emitted when an order is updated
 */
export interface OrderUpdatedEvent {
  type: 'ORDER_UPDATED';
  order: Order;
  changes: Partial<Order>;
  timestamp: Date;
}

/**
 * Union type for all order-related events
 */
export type OrderEvent = OrderCreatedEvent | OrderStatusChangedEvent | OrderUpdatedEvent;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for order processing errors
 */
export class OrderProcessingError extends Error {
  constructor(
    message: string,
    public orderId?: string,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'OrderProcessingError';
  }
}

/**
 * Error thrown when order validation fails
 */
export class OrderValidationError extends OrderProcessingError {
  constructor(
    message: string,
    public validationErrors: string[],
    orderId?: string
  ) {
    super(message, orderId, 'VALIDATION_ERROR');
    this.name = 'OrderValidationError';
  }
}

/**
 * Error thrown when order routing fails
 */
export class OrderRoutingError extends OrderProcessingError {
  constructor(
    message: string,
    orderId?: string
  ) {
    super(message, orderId, 'ROUTING_ERROR');
    this.name = 'OrderRoutingError';
  }
}

/**
 * Error thrown when synchronization fails
 */
export class SyncError extends Error {
  constructor(
    message: string,
    public systemId?: string,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'SyncError';
  }
}