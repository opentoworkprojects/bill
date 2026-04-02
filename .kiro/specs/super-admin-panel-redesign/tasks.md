# Implementation Plan: Super Admin Panel Redesign

## Overview

Incrementally decompose the 5846-line `SuperAdminPage.js` into a modular architecture.
Infrastructure (context, shared components, layout) is built first. Then each of the 12 tabs
is extracted one by one — the original file continues to work throughout. Finally,
`SuperAdminPage.js` is replaced with a thin entry point.

## Tasks

- [~] 1. Create AdminContext.js
  - Create `frontend/src/pages/superadmin/AdminContext.js`
  - Implement `AdminProvider` with `credentials`, `userType`, `teamUser`, `activeSection`, `setActiveSection`, and `hasPermission`
  - Export `useAdminContext` hook that throws if used outside provider
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 1.1 Write property test for hasPermission correctness
    - **Property 2: hasPermission correctness**
    - **Validates: Requirements 4.2, 8.5**

  - [ ]* 1.2 Write property test for AdminContext exposes all required values
    - **Property 7: AdminContext exposes all required values**
    - **Validates: Requirements 4.1**

  - [ ]* 1.3 Write unit test for useAdminContext throws outside provider
    - Test that `useAdminContext()` throws a descriptive error when called outside `AdminProvider`
    - _Requirements: 4.5_


- [~] 2. Create shared components
  - Create `frontend/src/pages/superadmin/shared/` directory with three files

  - [ ] 2.1 Create LoadingSkeleton.js
    - Implement `variant` prop supporting `'table-rows'`, `'kpi-grid'`, `'form'`, and `'chart'`
    - `table-rows` variant renders exactly `rows` skeleton row elements (default 5)
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.2 Write property test for LoadingSkeleton row count
    - **Property 9: LoadingSkeleton table-rows renders correct row count**
    - **Validates: Requirements 5.3**

  - [ ] 2.3 Create EmptyState.js
    - Implement `icon`, `title`, `description`, and optional `action` props
    - Render icon element, title text, description text, and action button when provided
    - _Requirements: 6.1, 6.2_

  - [ ]* 2.4 Write property test for EmptyState renders all required elements
    - **Property 10: EmptyState renders all required elements**
    - **Validates: Requirements 6.2**

  - [ ] 2.5 Create KPICard.js
    - Implement `title`, `value`, `change`, `icon`, and `color` props
    - Render green trend class when `change >= 0`, red when `change < 0`
    - Add `data-testid="trend"` to the trend element
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 2.6 Write property test for KPICard trend color
    - **Property 11: KPICard renders all data fields with correct trend color**
    - **Validates: Requirements 7.3, 7.4, 7.5**


- [~] 3. Create AdminSidebar.js
  - Create `frontend/src/pages/superadmin/AdminSidebar.js`
  - Implement `NAV_GROUPS` constant with all 7 groups and 13 items as defined in the design
  - Filter nav items using `hasPermission` from `useAdminContext`; hide entire group if no items pass
  - Apply active style (`bg-purple-600 text-white`) to the item matching `activeSection`
  - Render BillByteKOT logo/wordmark at top and logged-in user name + role at bottom
  - Accept `onNavigate` callback prop
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 3.1 Write property test for permission-based sidebar filtering
    - **Property 1: Permission-based sidebar filtering**
    - **Validates: Requirements 2.6, 8.1**

  - [ ]* 3.2 Write property test for active nav item styling
    - **Property 3: Active nav item styling**
    - **Validates: Requirements 2.5**

  - [ ]* 3.3 Write property test for sidebar user info rendering
    - **Property 4: Sidebar user info rendering**
    - **Validates: Requirements 2.8**

  - [ ]* 3.4 Write unit test for sidebar logo and user info
    - Verify logo element and user name/role are present in rendered output
    - _Requirements: 2.7, 2.8_


- [~] 4. Create AdminHeader.js
  - Create `frontend/src/pages/superadmin/AdminHeader.js`
  - Implement `SECTION_TITLES` map for all 12 section ids to human-readable labels
  - Display current section title from `activeSection` via `useAdminContext`
  - Show global search only when `userType === 'super-admin'`
  - Show notification bell with unread count badge (badge hidden when count is 0)
  - Show logout button that calls `onLogout` prop
  - Show hamburger button (mobile only) that calls `onMenuToggle` prop
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 4.1 Write property test for header section title display
    - **Property 17: Header displays correct section title**
    - **Validates: Requirements 11.2**

  - [ ]* 4.2 Write property test for header search visibility by user type
    - **Property 18: Header search visibility by user type**
    - **Validates: Requirements 11.4**

  - [ ]* 4.3 Write property test for notification bell badge visibility
    - **Property 19: Notification bell badge visibility**
    - **Validates: Requirements 11.5**

  - [ ]* 4.4 Write unit test for header logout button
    - Verify logout button is present and calls `onLogout` when clicked
    - _Requirements: 11.3_


- [~] 5. Create AdminLayout.js
  - Create `frontend/src/pages/superadmin/AdminLayout.js`
  - Implement `renderTab()` switch for all 12 section ids (import all TabComponents as stubs initially — they will be filled in subsequent tasks)
  - Implement desktop sidebar (hidden on mobile via `hidden md:flex`)
  - Implement mobile sidebar overlay with backdrop dismiss
  - Implement hamburger toggle state (`sidebarOpen`)
  - Implement permission redirect: if `activeSection` is not permitted, fall back to first permitted section
  - Accept `onLogout` prop and pass to `AdminHeader`
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.1, 10.2, 10.3_

  - [ ]* 5.1 Write property test for hamburger toggle opens sidebar
    - **Property 5: Hamburger toggle opens sidebar**
    - **Validates: Requirements 3.3**

  - [ ]* 5.2 Write property test for mobile nav selection closes sidebar
    - **Property 6: Mobile nav selection closes sidebar**
    - **Validates: Requirements 3.4**

  - [ ]* 5.3 Write property test for AdminLayout renders correct tab for activeSection
    - **Property 15: AdminLayout renders correct tab for activeSection**
    - **Validates: Requirements 10.2, 10.3**

  - [ ]* 5.4 Write property test for permission redirect enforcement
    - **Property 14: Permission redirect enforcement**
    - **Validates: Requirements 8.2, 8.3**

- [ ] 6. Checkpoint — verify infrastructure compiles
  - Ensure all tests pass, ask the user if questions arise.


- [~] 7. Extract DashboardTab
  - Create `frontend/src/pages/superadmin/DashboardTab.js`
  - Copy dashboard section state, fetch logic, and render from `SuperAdminPage.js`
  - Replace inline loading/empty UI with `LoadingSkeleton variant="kpi-grid"` and `EmptyState`
  - Render exactly 6 `KPICard` components: Total Users, Active Subscriptions, Monthly Revenue, Open Tickets, New Leads (7d), App Installs
  - Render revenue/user growth chart below KPI grid
  - Render Recent Activity feed capped at 20 items
  - Render System Health row (API, DB, Uptime, Memory)
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 9.1_

  - [ ]* 7.1 Write property test for dashboard renders all 6 KPI cards
    - **Property 12: Dashboard renders all 6 KPI cards**
    - **Validates: Requirements 7.2**

  - [ ]* 7.2 Write property test for recent activity feed 20-item limit
    - **Property 13: Recent Activity feed respects 20-item limit**
    - **Validates: Requirements 7.7**

  - [ ]* 7.3 Write property test for tab loading/error/empty state transitions
    - **Property 8: Tab component loading/error/empty state transitions**
    - **Validates: Requirements 5.1, 5.4, 5.5, 6.1**

  - [ ]* 7.4 Write unit tests for dashboard chart and system health
    - Verify chart element and system health indicators render
    - _Requirements: 7.6, 7.8_


- [~] 8. Extract UsersTab
  - Create `frontend/src/pages/superadmin/UsersTab.js`
  - Copy all users section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: view, search, filter, sort, bulk actions, subscription management, invoice preview, data export, data import, user navigation (previous/next)
  - Replace inline loading UI with `LoadingSkeleton variant="table-rows" rows={5}`
  - Replace inline empty UI with `EmptyState`
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 5.3, 6.1, 9.1_

  - [ ]* 8.1 Write property test for UsersTab loading/error/empty state transitions
    - **Property 8: Tab component loading/error/empty state transitions (UsersTab)**
    - **Validates: Requirements 5.1, 5.4, 5.5, 6.1**

  - [ ]* 8.2 Write property test for UsersTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation**
    - **Validates: Requirements 10.5**


- [~] 9. Extract LeadsTab
  - Create `frontend/src/pages/superadmin/LeadsTab.js`
  - Copy all leads section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: create lead, view leads, update lead status, send promotional emails with all existing templates
  - Replace inline loading/empty UI with shared components
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 5.3, 6.1, 9.2_

  - [ ]* 9.1 Write property test for LeadsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (LeadsTab)**
    - **Validates: Requirements 10.5**

- [~] 10. Extract TeamTab
  - Create `frontend/src/pages/superadmin/TeamTab.js`
  - Copy all team section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: create team member, edit team member, delete team member, manage permissions
  - Replace inline loading/empty UI with shared components
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 5.3, 6.1, 9.3_

  - [ ]* 10.1 Write property test for TeamTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (TeamTab)**
    - **Validates: Requirements 10.5**


- [~] 11. Extract TicketsTab
  - Create `frontend/src/pages/superadmin/TicketsTab.js`
  - Copy all tickets section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: view tickets, filter by status, update ticket status
  - Show `EmptyState` with message "No tickets yet. All clear!" and `CheckCircle` icon when empty
  - Replace inline loading UI with `LoadingSkeleton variant="table-rows" rows={5}`
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 5.3, 6.1, 6.3, 9.4_

  - [ ]* 11.1 Write property test for TicketsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (TicketsTab)**
    - **Validates: Requirements 10.5**

- [~] 12. Extract AnalyticsTab
  - Create `frontend/src/pages/superadmin/AnalyticsTab.js`
  - Copy all analytics section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve all existing analytics views and data
  - Replace inline loading UI with `LoadingSkeleton variant="chart"`
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 9.5_

  - [ ]* 12.1 Write property test for AnalyticsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (AnalyticsTab)**
    - **Validates: Requirements 10.5**


- [~] 13. Extract AppVersionsTab
  - Create `frontend/src/pages/superadmin/AppVersionsTab.js`
  - Copy all app versions section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: create, edit, delete, file upload with progress indicator
  - Replace inline loading/empty UI with shared components
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 6.1, 9.6_

  - [ ]* 13.1 Write property test for AppVersionsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (AppVersionsTab)**
    - **Validates: Requirements 10.5**

- [~] 14. Extract PromotionsTab
  - Create `frontend/src/pages/superadmin/PromotionsTab.js`
  - Copy all promotions section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve all sale/offer day configuration including all theme options and banner designs
  - Replace inline loading/empty UI with shared components
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 6.1, 9.7_

  - [ ]* 14.1 Write property test for PromotionsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (PromotionsTab)**
    - **Validates: Requirements 10.5**


- [~] 15. Extract PricingTab
  - Create `frontend/src/pages/superadmin/PricingTab.js`
  - Copy all pricing section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: campaign pricing, trial settings, referral discount configuration
  - Replace inline loading/empty UI with shared components
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 6.1, 9.8_

  - [ ]* 15.1 Write property test for PricingTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (PricingTab)**
    - **Validates: Requirements 10.5**

- [ ] 16. Extract ReferralsTab
  - Create `frontend/src/pages/superadmin/ReferralsTab.js`
  - Copy all referrals section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: referral views, analytics, status filtering, pagination, CSV export
  - Replace inline loading UI with `LoadingSkeleton variant="table-rows" rows={5}`
  - Replace inline empty UI with `EmptyState`
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 5.3, 6.1, 9.9_

  - [ ]* 16.1 Write property test for ReferralsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (ReferralsTab)**
    - **Validates: Requirements 10.5**


- [ ] 17. Extract NotificationsTab
  - Create `frontend/src/pages/superadmin/NotificationsTab.js`
  - Copy all notifications section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: notification creation, template management, push stats
  - Show `EmptyState` with message "No notifications sent yet." and a send button when empty
  - Replace inline loading UI with shared `LoadingSkeleton`
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 6.1, 6.5, 9.10_

  - [ ]* 17.1 Write property test for NotificationsTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (NotificationsTab)**
    - **Validates: Requirements 10.5**

- [ ] 18. Extract BlogTab
  - Create `frontend/src/pages/superadmin/BlogTab.js`
  - Copy all blog section state, fetch logic, and render from `SuperAdminPage.js`
  - Preserve: blog post creation, editing, publishing with all form fields
  - Show `EmptyState` with message "No posts yet. Create your first article." and a create button when empty
  - Replace inline loading UI with `LoadingSkeleton variant="table-rows" rows={5}`
  - Read `credentials` from `useAdminContext`
  - Do NOT modify `SuperAdminPage.js` yet
  - _Requirements: 1.1, 1.2, 1.6, 5.1, 5.3, 6.1, 6.4, 9.11_

  - [ ]* 18.1 Write property test for BlogTab renders in isolation
    - **Property 16: Each TabComponent renders in isolation (BlogTab)**
    - **Validates: Requirements 10.5**

- [ ] 19. Checkpoint — all 12 tab files exist and pass diagnostics
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 20. Update SuperAdminPage.js to thin entry point
  - Replace the body of `SuperAdminPage.js` with auth-only state and logic
  - Retain only: `authenticated`, `credentials`, `userType`, `teamUser`, `teamToken` state
  - Retain login form and authentication logic unchanged
  - After successful auth, render `<AdminProvider ...><AdminLayout onLogout={handleLogout} /></AdminProvider>`
  - Remove all 50+ tab-specific state variables and inline tab render logic
  - Import `AdminProvider` from `./superadmin/AdminContext`
  - Import `AdminLayout` from `./superadmin/AdminLayout`
  - Verify all existing API call endpoints and parameters are unchanged
  - _Requirements: 1.3, 1.4, 1.5, 9.12, 10.1_

  - [ ]* 20.1 Write integration test for full login flow
    - Test: login → `AdminLayout` renders with correct initial section
    - Test: team user login → only permitted sections visible in sidebar
    - Test: tab switching → correct component mounts, previous unmounts
    - Test: API error → error state shown with retry button
    - _Requirements: 8.1, 8.2, 10.2, 10.3_

- [ ] 21. Run diagnostics and fix any errors
  - Run `getDiagnostics` on all new files under `frontend/src/pages/superadmin/`
  - Run `getDiagnostics` on updated `frontend/src/pages/SuperAdminPage.js`
  - Fix any import errors, missing props, or type issues surfaced
  - _Requirements: 1.1–1.6, 9.12_

- [ ] 22. Final checkpoint — full panel works end to end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each tab extraction (tasks 7–18) must leave `SuperAdminPage.js` untouched — the original file stays working until task 20
- Property tests use `@fast-check/jest`; each test is tagged with `// Feature: super-admin-panel-redesign, Property N: <text>`
- All API endpoints and parameters must remain identical to the originals (requirement 9.12)
