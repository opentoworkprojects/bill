# Requirements Document

## Introduction

The BillByteKOT Super Admin Panel currently exists as a single monolithic React component (`SuperAdminPage.js`) with 5846 lines, 12 tabs, 50+ useState hooks, and all fetch/render logic inlined. This redesign restructures the panel into a maintainable, scalable architecture with a proper sidebar navigation, grouped sections, responsive layout, loading/empty states, and a redesigned dashboard — while preserving 100% of existing functionality.

The redesign targets two user types: `super-admin` (full access to all sections) and `team` (limited access based on permissions). The tech stack remains Tailwind CSS, shadcn/ui, lucide-react, and axios.

---

## Glossary

- **SuperAdminPanel**: The top-level authenticated admin interface for BillByteKOT.
- **AdminLayout**: The shared layout component containing the sidebar, header, and content area.
- **Sidebar**: The collapsible vertical navigation component replacing the flat tab bar.
- **NavGroup**: A labeled group of navigation items within the Sidebar (e.g., "User Management").
- **TabComponent**: An isolated React component responsible for one section (e.g., UsersTab, LeadsTab).
- **AdminContext**: The shared React context providing global state, credentials, and fetch utilities to all TabComponents.
- **KPI Card**: A visual metric card on the Dashboard showing a key performance indicator with trend indicator.
- **LoadingSkeleton**: A placeholder UI shown while data is being fetched.
- **EmptyState**: A UI shown when a section has no data to display.
- **super-admin**: A user type with full access to all sections and actions.
- **team**: A user type with access limited to sections granted by their permissions array.
- **Permission**: A string token (e.g., `"users"`, `"leads"`, `"analytics"`, `"tickets"`) that grants a team member access to a specific section.

---

## Requirements

### Requirement 1: File Structure Decomposition

**User Story:** As a developer, I want the monolithic SuperAdminPage.js split into focused per-section components, so that each file is independently maintainable and under 300 lines.

#### Acceptance Criteria

1. THE SuperAdminPanel SHALL decompose into one TabComponent file per section under `frontend/src/pages/superadmin/`.
2. THE SuperAdminPanel SHALL contain the following TabComponent files: `DashboardTab.js`, `UsersTab.js`, `LeadsTab.js`, `TeamTab.js`, `TicketsTab.js`, `AnalyticsTab.js`, `AppVersionsTab.js`, `PromotionsTab.js`, `PricingTab.js`, `ReferralsTab.js`, `NotificationsTab.js`, `BlogTab.js`.
3. THE SuperAdminPanel SHALL contain a shared layout file at `frontend/src/pages/superadmin/AdminLayout.js`.
4. THE SuperAdminPanel SHALL contain a shared context file at `frontend/src/pages/superadmin/AdminContext.js`.
5. THE SuperAdminPanel SHALL retain `frontend/src/pages/SuperAdminPage.js` as the entry point that renders `AdminLayout` after authentication.
6. WHEN a TabComponent file is created, THE TabComponent SHALL contain only the state, fetch logic, and render logic specific to that section.

---

### Requirement 2: Sidebar Navigation

**User Story:** As an admin user, I want a sidebar with grouped navigation items, so that I can quickly find and switch between sections without scrolling through a flat tab bar.

#### Acceptance Criteria

1. THE AdminLayout SHALL render a vertical Sidebar on the left side of the content area.
2. THE Sidebar SHALL replace the existing horizontal scrollable tab bar.
3. THE Sidebar SHALL organize navigation items into the following NavGroups:
   - **Overview**: Dashboard
   - **User Management**: Users, Leads, Team
   - **Support**: Tickets
   - **Analytics**: Analytics
   - **Growth**: Promotions, Pricing, Referrals, Campaigns
   - **Content**: Blog
   - **System**: App Versions, Notifications
4. THE Sidebar SHALL display each NavGroup label as a non-clickable section header.
5. WHEN a navigation item is active, THE Sidebar SHALL highlight it with a distinct active style (background + text color change).
6. WHEN a user type is `team`, THE Sidebar SHALL render only the navigation items corresponding to that team member's permissions.
7. THE Sidebar SHALL display the BillByteKOT logo or wordmark at the top.
8. THE Sidebar SHALL display the logged-in user's name and role at the bottom.

---

### Requirement 3: Responsive Layout

**User Story:** As an admin user on a mobile device, I want the sidebar to collapse into a hamburger menu, so that the content area is not obscured on small screens.

#### Acceptance Criteria

1. THE AdminLayout SHALL render a full-width content area on screens narrower than 768px.
2. WHEN the screen width is less than 768px, THE Sidebar SHALL be hidden by default and accessible via a hamburger toggle button.
3. WHEN the hamburger button is tapped, THE Sidebar SHALL slide in as an overlay from the left.
4. WHEN a navigation item is selected on mobile, THE Sidebar SHALL close automatically.
5. WHEN the screen width is 768px or wider, THE Sidebar SHALL be permanently visible and not require a toggle.
6. THE AdminLayout SHALL include a top header bar on mobile containing the hamburger button, current section title, and user avatar/initials.

---

### Requirement 4: Shared State Management via AdminContext

**User Story:** As a developer, I want shared state (credentials, user type, active section) managed in a React context, so that TabComponents do not require deep prop drilling.

#### Acceptance Criteria

1. THE AdminContext SHALL provide the following values to all consumers: `credentials`, `userType`, `teamUser`, `activeSection`, `setActiveSection`.
2. THE AdminContext SHALL provide a `hasPermission(permission)` utility function that returns `true` if the current user has the given permission.
3. WHEN a TabComponent needs to make an authenticated API call, THE TabComponent SHALL read `credentials` from AdminContext.
4. THE AdminContext SHALL be initialized at the SuperAdminPage level and wrap the AdminLayout.
5. IF the AdminContext is consumed outside of its Provider, THEN THE AdminContext SHALL throw a descriptive error.

---

### Requirement 5: Loading States

**User Story:** As an admin user, I want to see loading skeletons while data is being fetched, so that the UI does not appear broken or empty during network requests.

#### Acceptance Criteria

1. WHEN a TabComponent initiates a data fetch, THE TabComponent SHALL display a LoadingSkeleton appropriate to the section's layout.
2. THE LoadingSkeleton for the Dashboard SHALL show placeholder KPI cards and a placeholder chart area.
3. THE LoadingSkeleton for list-based tabs (Users, Leads, Team, Tickets, Referrals, Blog) SHALL show at least 5 skeleton rows.
4. WHEN data has loaded successfully, THE TabComponent SHALL replace the LoadingSkeleton with the actual content.
5. IF a fetch fails, THEN THE TabComponent SHALL display an error message with a retry button instead of the LoadingSkeleton.

---

### Requirement 6: Empty States

**User Story:** As an admin user, I want to see a helpful empty state when a section has no data, so that I understand the section is working but simply has no records yet.

#### Acceptance Criteria

1. WHEN a list-based TabComponent receives an empty data array, THE TabComponent SHALL display an EmptyState component.
2. THE EmptyState SHALL include an icon, a short descriptive message, and (where applicable) a primary action button (e.g., "Add First User", "Create Lead").
3. THE EmptyState for Tickets SHALL display the message "No tickets yet. All clear!" with a CheckCircle icon.
4. THE EmptyState for Blog SHALL display the message "No posts yet. Create your first article." with a create button.
5. THE EmptyState for Notifications SHALL display the message "No notifications sent yet." with a send button.

---

### Requirement 7: Dashboard Redesign with KPI Cards

**User Story:** As a super-admin, I want the Dashboard to show KPI cards with key metrics, trend indicators, a chart area, and a recent activity feed, so that I can assess platform health at a glance.

#### Acceptance Criteria

1. THE DashboardTab SHALL display a grid of KPI Cards at the top of the page.
2. THE DashboardTab SHALL include the following KPI Cards: Total Users, Active Subscriptions, Monthly Revenue, Open Tickets, New Leads (last 7 days), App Installs.
3. EACH KPI Card SHALL display: metric name, current value, percentage change vs previous period, and a trend arrow (up/down/neutral).
4. WHEN the percentage change is positive, THE KPI Card SHALL display the trend arrow in green.
5. WHEN the percentage change is negative, THE KPI Card SHALL display the trend arrow in red.
6. THE DashboardTab SHALL display a revenue/user growth chart below the KPI Cards.
7. THE DashboardTab SHALL display a Recent Activity feed showing the last 20 admin actions with timestamps.
8. THE DashboardTab SHALL display a System Health indicator showing API status, database status, and uptime.
9. WHEN the DashboardTab is mounted, THE DashboardTab SHALL fetch dashboard data and display a LoadingSkeleton until the data is ready.

---

### Requirement 8: Permission-Based Access Control

**User Story:** As a team member, I want to see only the sections I have been granted access to, so that I am not confused by sections I cannot use.

#### Acceptance Criteria

1. WHEN a `team` user logs in, THE SuperAdminPanel SHALL display only the NavGroups and navigation items corresponding to that user's permissions.
2. WHEN a `team` user attempts to navigate directly to a section they do not have permission for, THE SuperAdminPanel SHALL redirect them to their first permitted section.
3. THE SuperAdminPanel SHALL map the following permissions to sections: `analytics` → Dashboard, `users` → Users, `leads` → Leads, `tickets` → Tickets.
4. IF a `team` user has no permissions, THEN THE SuperAdminPanel SHALL display only the Tickets section as a fallback.
5. WHEN a `super-admin` logs in, THE SuperAdminPanel SHALL display all NavGroups and navigation items.

---

### Requirement 9: Preserve All Existing Functionality

**User Story:** As a super-admin, I want all existing features to work identically after the restructure, so that no operational capability is lost during the redesign.

#### Acceptance Criteria

1. THE UsersTab SHALL preserve all existing user management actions: view, search, filter, sort, bulk actions, subscription management, invoice preview, data export, data import, and user navigation (previous/next).
2. THE LeadsTab SHALL preserve all existing lead actions: create lead, view leads, update lead status, and send promotional emails with all existing templates.
3. THE TeamTab SHALL preserve all existing team actions: create team member, edit team member, delete team member, and manage permissions.
4. THE TicketsTab SHALL preserve all existing ticket actions: view tickets, filter by status, and update ticket status.
5. THE AnalyticsTab SHALL preserve all existing analytics views and data.
6. THE AppVersionsTab SHALL preserve all existing app version actions: create, edit, delete, and file upload with progress indicator.
7. THE PromotionsTab SHALL preserve all existing sale/offer day configuration including all theme options and banner designs.
8. THE PricingTab SHALL preserve all existing pricing management including campaign pricing, trial settings, and referral discount configuration.
9. THE ReferralsTab SHALL preserve all existing referral views, analytics, status filtering, pagination, and CSV export.
10. THE NotificationsTab SHALL preserve all existing notification creation, template management, and push stats.
11. THE BlogTab SHALL preserve all existing blog post creation, editing, and publishing with all form fields.
12. WHEN the SuperAdminPanel is restructured, THE SuperAdminPanel SHALL pass all existing API calls through without modification to endpoints or parameters.

---

### Requirement 10: Component Hierarchy

**User Story:** As a developer, I want a clear component hierarchy from SuperAdminPage down to individual TabComponents, so that the codebase is easy to navigate and extend.

#### Acceptance Criteria

1. THE component hierarchy SHALL follow this structure: `SuperAdminPage` → `AdminContext.Provider` → `AdminLayout` → `[Sidebar, Header, TabComponent]`.
2. THE AdminLayout SHALL accept an `activeSection` prop and render the corresponding TabComponent.
3. WHEN `activeSection` changes, THE AdminLayout SHALL unmount the previous TabComponent and mount the new one.
4. THE Sidebar SHALL accept `navGroups`, `activeSection`, and `onNavigate` as props.
5. EACH TabComponent SHALL be independently importable and renderable in isolation for testing purposes.

---

### Requirement 11: Header Bar

**User Story:** As an admin user, I want a persistent header bar showing the current section name and quick actions, so that I always know where I am in the panel.

#### Acceptance Criteria

1. THE AdminLayout SHALL render a top header bar above the content area.
2. THE Header SHALL display the name of the currently active section.
3. THE Header SHALL display a logout button that clears authentication state.
4. WHEN the user type is `super-admin`, THE Header SHALL display a global search input.
5. THE Header SHALL display a notification bell icon with an unread count badge when there are unread notifications.
6. WHILE data is auto-refreshing, THE Header SHALL display a subtle refresh indicator.
