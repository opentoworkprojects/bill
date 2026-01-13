# Implementation Plan: Restaurant Enhancements

## Overview

This implementation plan addresses table status synchronization, menu loading performance, inventory enhancements, expense management, and day book reporting. Tasks are ordered to build incrementally with early validation.

## Tasks

- [x] 1. Fix Table Status Immediate Sync
  - [x] 1.1 Create TableStatusManager in backend with direct DB updates
    - Add `set_table_occupied(org_id, table_id, order_id)` function
    - Add `set_table_available(org_id, table_id)` function
    - Bypass cache for writes, invalidate after update
    - Add retry logic with error handling
    - _Requirements: 1.1, 1.2, 1.4, 1.6_
  - [x] 1.2 Update order creation endpoint to use TableStatusManager
    - Call `set_table_occupied` immediately after order insert
    - Log success/failure for debugging
    - _Requirements: 1.1, 1.3_
  - [-] 1.3 Update bill completion endpoint to use TableStatusManager
    - Call `set_table_available` when payment is completed
    - Ensure cache invalidation happens
    - _Requirements: 1.2, 1.3_
  - [x] 1.4 Write property test for table status sync
    - **Property 1: Table Status Synchronization**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 2. Fix TablesPage to fetch fresh data
  - [x] 2.1 Update TablesPage fetchTables to always bypass cache
    - Add `?fresh=true` parameter to force DB read
    - Remove reliance on cached data for table status
    - _Requirements: 1.5_
  - [x] 2.2 Add auto-refresh after order/bill operations
    - Trigger table refresh when returning from BillingPage
    - Use event-based refresh mechanism
    - _Requirements: 1.5_

- [ ] 3. Checkpoint - Verify table sync works
  - Test: Create order → verify table shows occupied immediately
  - Test: Complete bill → verify table shows available immediately
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add Menu Loading States
  - [x] 4.1 Add loading state to BillingPage menu fetch
    - Show skeleton UI while menu is loading
    - Display loading spinner within 100ms of navigation
    - _Requirements: 2.1, 2.5_
  - [x] 4.2 Add error handling with retry for menu fetch
    - Display error message on fetch failure
    - Add retry button
    - _Requirements: 2.3_
  - [x] 4.3 Add localStorage caching for menu items
    - Cache menu items with timestamp
    - Use cached data for instant display, refresh in background
    - _Requirements: 2.4_

- [x] 5. Enhance Inventory - Supplier Management
  - [x] 5.1 Add Supplier model and CRUD endpoints in backend
    - Create Supplier Pydantic model with name, contact_person, phone, email, address, gstin, payment_terms, notes
    - Add POST /inventory/suppliers endpoint
    - Add PUT /inventory/suppliers/{id} endpoint
    - Add DELETE /inventory/suppliers/{id} endpoint
    - _Requirements: 3.2_
  - [x] 5.2 Add Supplier creation dialog in InventoryPage
    - Add "New Supplier" button in Suppliers tab
    - Create form with all supplier fields
    - Handle save with success/error feedback
    - _Requirements: 3.1, 3.2_
  - [ ] 5.3 Write property test for supplier data persistence
    - **Property 3: Supplier Data Persistence**
    - **Validates: Requirements 3.2**

- [x] 6. Enhance Inventory - Category Management
  - [x] 6.1 Add Category model and CRUD endpoints in backend
    - Create Category Pydantic model with name, description, color
    - Add POST /inventory/categories endpoint
    - Add PUT /inventory/categories/{id} endpoint
    - Add DELETE /inventory/categories/{id} endpoint
    - _Requirements: 3.3_
  - [x] 6.2 Add Category creation dialog in InventoryPage
    - Add "New Category" button in Categories tab
    - Create form with name, description, color picker
    - Handle save with success/error feedback
    - _Requirements: 3.1, 3.3_
  - [ ] 6.3 Write property test for category data persistence
    - **Property 4: Category Data Persistence**
    - **Validates: Requirements 3.3**

- [x] 7. Fix Inventory Item Save Issues
  - [x] 7.1 Add proper validation to inventory item save
    - Validate required fields: name, quantity, unit, min_quantity, price_per_unit
    - Display specific field-level error messages
    - _Requirements: 3.7, 3.6_
  - [x] 7.2 Fix inventory item form to properly link supplier and category
    - Ensure supplier_id and category_id are saved correctly
    - Fix any type conversion issues
    - _Requirements: 3.4, 3.5_
  - [ ] 7.3 Write property test for inventory validation
    - **Property 5: Inventory Item Validation**
    - **Validates: Requirements 3.7**

- [ ] 8. Checkpoint - Verify inventory enhancements
  - Test: Create supplier → verify it appears in list
  - Test: Create category → verify it appears in list
  - Test: Save inventory item with supplier/category → verify persistence
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Expense Management Backend
  - [x] 9.1 Create Expense model and collection in MongoDB
    - Define Expense Pydantic model with all fields
    - Add expense categories constant list
    - _Requirements: 4.2, 4.3_
  - [x] 9.2 Add Expense CRUD endpoints
    - GET /expenses with date range and category filters
    - POST /expenses for creating new expense
    - PUT /expenses/{id} for updating expense
    - DELETE /expenses/{id} for removing expense
    - _Requirements: 4.1, 4.2, 4.4, 4.6, 4.7_
  - [ ] 9.3 Write property test for expense data persistence
    - **Property 6: Expense Data Persistence**
    - **Validates: Requirements 4.2**

- [x] 10. Implement Expense Management Frontend
  - [x] 10.1 Create ExpensePage component
    - Add to routes and navigation
    - Display expense list with filters
    - Show total for selected period
    - _Requirements: 4.1, 4.4, 4.5_
  - [x] 10.2 Add expense creation/edit dialog
    - Form with date, amount, category dropdown, description, payment method
    - Validation for required fields
    - _Requirements: 4.2, 4.3_
  - [x] 10.3 Add expense delete functionality
    - Confirmation dialog before delete
    - Recalculate totals after delete
    - _Requirements: 4.7_
  - [ ] 10.4 Write property test for expense total consistency
    - **Property 7: Expense Total Consistency**
    - **Validates: Requirements 4.5, 4.6, 4.7**

- [x] 11. Implement Day Book / Cash Flow Report Backend
  - [x] 11.1 Create DayBook aggregation queries
    - Aggregate orders by payment method for inflows
    - Aggregate expenses for outflows
    - Calculate opening/closing balance
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 11.2 Add Day Book API endpoints
    - GET /reports/daybook with date parameter
    - Support date range aggregation
    - _Requirements: 5.1, 5.5_
  - [x] 11.3 Add Day Book export functionality
    - Export to PDF format
    - Export to Excel format
    - _Requirements: 5.6_
  - [x] 11.4 Write property test for cash flow balance invariant
    - **Property 9: Cash Flow Balance Invariant**
    - **Validates: Requirements 5.4**

- [x] 12. Implement Day Book / Cash Flow Report Frontend
  - [x] 12.1 Add Day Book tab to ReportsPage
    - Date picker for single day or range
    - Display opening balance, inflows, outflows, closing balance
    - _Requirements: 5.1, 5.4_
  - [x] 12.2 Display transaction breakdown
    - Show inflow categories (Sales-Cash, Sales-Card, Sales-UPI, Other)
    - Show outflow categories (Expenses, Supplier Payments, Refunds, Other)
    - Display running balance
    - _Requirements: 5.2, 5.3, 5.7_
  - [x] 12.3 Add export buttons for PDF and Excel
    - Download functionality for both formats
    - _Requirements: 5.6_
  - [x] 12.4 Write property test for transaction categorization
    - **Property 10: Transaction Categorization**
    - **Validates: Requirements 5.2, 5.3**

- [x] 13. Final Checkpoint - Full Integration Test
  - Test complete flow: Create order → Complete bill → Check table status
  - Test expense creation and day book reflection
  - Test day book balance calculation accuracy
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use Python's Hypothesis library for backend
- Frontend tests use Jest with property-based testing where applicable
