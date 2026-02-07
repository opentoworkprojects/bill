# Design Document: QR Order Promotions and Animated Marketing Features

## Overview

This design implements animated promotional features for QR-based ordering across two key interfaces: the Tables page (for restaurant owners) and the Landing page (for potential customers). The solution leverages React's component architecture, CSS animations with GPU acceleration, and intersection observers for scroll-triggered effects. The design prioritizes performance, accessibility, and seamless integration with the existing restaurant management system.

The implementation will create reusable animation utilities, promotional components, and QR statistics displays that can be extended to other areas of the application. All animations will respect user preferences (prefers-reduced-motion) and device capabilities to ensure an optimal experience across all platforms.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Tables Page     │         │  Landing Page    │          │
│  │                  │         │                  │          │
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │          │
│  │ │ QR Promo     │ │         │ │ Hero Section │ │          │
│  │ │ Banner       │ │         │ │ (Animated)   │ │          │
│  │ └──────────────┘ │         │ └──────────────┘ │          │
│  │                  │         │                  │          │
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │          │
│  │ │ QR Stats     │ │         │ │ Feature Cards│ │          │
│  │ │ Display      │ │         │ │ (Animated)   │ │          │
│  │ └──────────────┘ │         │ └──────────────┘ │          │
│  │                  │         │                  │          │
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │          │
│  │ │ Table        │ │         │ │ Stats Counter│ │          │
│  │ │ Indicators   │ │         │ │ (Animated)   │ │          │
│  │ └──────────────┘ │         │ └──────────────┘ │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│              ┌─────────▼─────────┐                          │
│              │  Animation Engine │                          │
│              │                   │                          │
│              │ • useAnimation    │                          │
│              │ • useScrollTrigger│                          │
│              │ • AnimationUtils  │                          │
│              └─────────┬─────────┘                          │
│                        │                                     │
│              ┌─────────▼─────────┐                          │
│              │  Performance      │                          │
│              │  Monitor          │                          │
│              └───────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

**Tables Page Components:**
- `QRPromotionalBanner` - Main promotional banner with animations
- `QRStatisticsCard` - Displays QR usage metrics with animated counters
- `QRCallToAction` - Button/card prompting QR setup
- `TableQRIndicator` - Visual badge showing QR code status on tables
- `QRBenefitsTooltip` - Hover tooltip explaining benefits

**Landing Page Components:**
- `AnimatedHeroSection` - Hero section with fade-in and slide animations
- `QRFeatureCard` - Individual feature card with hover and scroll animations
- `AnimatedStatsCounter` - Statistics display with count-up animations
- `QRDemoPreview` - Interactive demo of QR ordering flow
- `ScrollTriggeredSection` - Wrapper for scroll-based animation triggers

**Shared Animation Utilities:**
- `useAnimation` - Custom hook for managing animation states
- `useScrollTrigger` - Hook for intersection observer-based animations
- `useReducedMotion` - Hook to detect and respect motion preferences
- `AnimationConfig` - Centralized animation timing and easing configurations
- `PerformanceMonitor` - FPS tracking and performance optimization

## Components and Interfaces

### Animation Engine

#### useAnimation Hook

```typescript
interface AnimationConfig {
  duration?: number;        // Animation duration in ms (default: 300)
  delay?: number;          // Delay before animation starts (default: 0)
  easing?: string;         // CSS easing function (default: 'ease-out')
  type?: 'fade' | 'slide' | 'scale' | 'bounce';
  direction?: 'up' | 'down' | 'left' | 'right';
}

interface AnimationState {
  isAnimating: boolean;
  hasAnimated: boolean;
  trigger: () => void;
  reset: () => void;
  style: React.CSSProperties;
}

function useAnimation(config: AnimationConfig): AnimationState
```

**Purpose:** Manages animation lifecycle and generates CSS styles for smooth transitions.

**Behavior:**
- Returns animation state and trigger function
- Generates appropriate CSS transform and opacity values
- Respects prefers-reduced-motion setting
- Cleans up animation styles after completion

#### useScrollTrigger Hook

```typescript
interface ScrollTriggerConfig {
  threshold?: number;      // Intersection threshold (default: 0.1)
  rootMargin?: string;     // Root margin for intersection (default: '0px')
  triggerOnce?: boolean;   // Only trigger once (default: true)
  staggerDelay?: number;   // Delay between staggered items (default: 100)
}

interface ScrollTriggerState {
  isVisible: boolean;
  ref: React.RefObject<HTMLElement>;
  hasTriggered: boolean;
}

function useScrollTrigger(config: ScrollTriggerConfig): ScrollTriggerState
```

**Purpose:** Detects when elements enter viewport and triggers animations.

**Behavior:**
- Uses Intersection Observer API for efficient scroll detection
- Supports staggered animations for multiple elements
- Automatically cleans up observers on unmount
- Provides ref to attach to target element

#### useReducedMotion Hook

```typescript
function useReducedMotion(): boolean
```

**Purpose:** Detects user's motion preference from system settings.

**Behavior:**
- Queries `prefers-reduced-motion` media query
- Updates when system preference changes
- Returns boolean indicating if animations should be reduced

### Tables Page Components

#### QRPromotionalBanner Component

```typescript
interface QRPromotionalBannerProps {
  isQREnabled: boolean;
  onEnableClick: () => void;
  variant?: 'compact' | 'full';
}

function QRPromotionalBanner(props: QRPromotionalBannerProps): JSX.Element
```

**Purpose:** Displays animated banner promoting QR ordering system.

**Features:**
- Animated entrance (slide-in from top)
- Rotating benefit highlights
- Prominent CTA button when QR not enabled
- Dismissible with local storage persistence
- Responsive layout for mobile/desktop

**Visual Design:**
- Gradient background with brand colors
- Icon animations (pulse effect on QR icon)
- Smooth transitions between benefit messages
- Shadow and elevation for prominence

#### QRStatisticsCard Component

```typescript
interface QRStatistics {
  totalOrders: number;
  qrOrders: number;
  accuracyImprovement: number;  // Percentage
  timeReduction: number;         // Percentage
  customerSatisfaction: number;  // Rating out of 5
}

interface QRStatisticsCardProps {
  statistics: QRStatistics;
  animated?: boolean;
}

function QRStatisticsCard(props: QRStatisticsCardProps): JSX.Element
```

**Purpose:** Displays QR ordering metrics with animated counters.

**Features:**
- Count-up animation for numbers
- Progress bars for percentages
- Comparison with non-QR orders
- Tooltip explanations for each metric
- Auto-refresh capability

#### TableQRIndicator Component

```typescript
interface TableQRIndicatorProps {
  tableId: string;
  hasQRCode: boolean;
  qrCodeUrl?: string;
  onViewQR?: () => void;
}

function TableQRIndicator(props: TableQRIndicatorProps): JSX.Element
```

**Purpose:** Visual indicator showing QR code status on table elements.

**Features:**
- Badge overlay on table component
- Animated pulse when newly generated
- Click to view/download QR code
- Color-coded status (active/inactive)
- Hover tooltip with QR preview

### Landing Page Components

#### AnimatedHeroSection Component

```typescript
interface AnimatedHeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onCtaClick: () => void;
  backgroundImage?: string;
}

function AnimatedHeroSection(props: AnimatedHeroSectionProps): JSX.Element
```

**Purpose:** Hero section with staggered entrance animations.

**Animation Sequence:**
1. Background fade-in (0ms)
2. Title slide-in from left (200ms delay)
3. Subtitle fade-in (400ms delay)
4. CTA button scale-in (600ms delay)
5. Background image parallax on scroll

**Features:**
- Responsive typography scaling
- Mobile-optimized animations
- Parallax scrolling effect
- Gradient overlay for text readability

#### QRFeatureCard Component

```typescript
interface QRFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

interface QRFeatureCardProps {
  feature: QRFeature;
  index: number;
  onLearnMore?: () => void;
}

function QRFeatureCard(props: QRFeatureCardProps): JSX.Element
```

**Purpose:** Individual feature card with hover and scroll animations.

**Features:**
- Scroll-triggered entrance animation
- Staggered delay based on index
- Hover lift effect (translateY + shadow)
- Icon animation on hover
- Expandable details section

**Animation Details:**
- Entrance: fade + slide up
- Hover: lift 8px + increase shadow
- Icon: rotate or scale on hover
- Stagger delay: 100ms * index

#### AnimatedStatsCounter Component

```typescript
interface StatItem {
  label: string;
  value: number;
  suffix?: string;  // e.g., '%', 'ms', 'orders'
  prefix?: string;  // e.g., '$', '+'
}

interface AnimatedStatsCounterProps {
  stats: StatItem[];
  duration?: number;  // Count-up duration (default: 2000ms)
}

function AnimatedStatsCounter(props: AnimatedStatsCounterProps): JSX.Element
```

**Purpose:** Animated statistics display with count-up effect.

**Features:**
- Smooth count-up animation using easing
- Triggers when scrolled into view
- Supports decimals and formatting
- Synchronized timing across multiple stats
- Accessible (announces final value to screen readers)

**Count-up Algorithm:**
- Uses requestAnimationFrame for smooth animation
- Easing function: easeOutExpo for natural deceleration
- Updates value incrementally over duration
- Formats numbers with appropriate separators

## Data Models

### QR Statistics Model

```typescript
interface QRStatistics {
  restaurantId: string;
  periodStart: Date;
  periodEnd: Date;
  metrics: {
    totalOrders: number;
    qrOrders: number;
    qrOrderPercentage: number;
    averageOrderTime: number;        // seconds
    averageQROrderTime: number;      // seconds
    timeReductionPercentage: number;
    orderAccuracy: number;           // percentage
    qrOrderAccuracy: number;         // percentage
    accuracyImprovement: number;     // percentage
    customerSatisfaction: number;    // 1-5 rating
    qrCustomerSatisfaction: number;  // 1-5 rating
  };
  tableMetrics: {
    totalTables: number;
    tablesWithQR: number;
    qrAdoptionRate: number;          // percentage
    averageScansPerTable: number;
  };
}
```

### Animation Configuration Model

```typescript
interface AnimationPreset {
  name: string;
  duration: number;
  delay: number;
  easing: string;
  transform: {
    from: string;
    to: string;
  };
  opacity: {
    from: number;
    to: number;
  };
}

interface AnimationPresets {
  fadeIn: AnimationPreset;
  slideInUp: AnimationPreset;
  slideInDown: AnimationPreset;
  slideInLeft: AnimationPreset;
  slideInRight: AnimationPreset;
  scaleIn: AnimationPreset;
  bounceIn: AnimationPreset;
}
```

### QR Feature Model

```typescript
interface QRFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  detailedInfo?: string;
  caseStudy?: {
    restaurantName: string;
    improvement: string;
    testimonial: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Conditional QR System State Rendering

*For any* restaurant configuration state (QR enabled or disabled), the Tables page should render the appropriate UI elements: Call-To-Action when disabled, or Statistics display when enabled.

**Validates: Requirements 1.2, 1.3**

### Property 2: Table QR Status Indicators

*For any* table with an active QR code, the Tables page should display a visual badge or indicator on that table element.

**Validates: Requirements 1.4, 6.1**

### Property 3: Interactive Element Tooltips

*For any* promotional element on the Tables page, user interaction (hover or focus) should trigger the display of tooltips or info cards explaining QR benefits.

**Validates: Requirements 1.5**

### Property 4: Scroll-Triggered Animations

*For any* promotional content on the Landing page, scrolling that content into the viewport should trigger its entrance animation.

**Validates: Requirements 2.2**

### Property 5: Statistics Animation Application

*For any* statistics display component, the rendering should include count-up animations or visual transitions applied to the numeric values.

**Validates: Requirements 2.4**

### Property 6: Conditional Demo Display

*For any* Landing page configuration where interactive demos are available, those demos should include animated previews of the QR ordering flow.

**Validates: Requirements 2.5**

### Property 7: GPU-Accelerated Transforms

*For any* animation generated by the Animation Engine, the CSS styles should use transform properties (translateX, translateY, scale, rotate) rather than position or dimension properties.

**Validates: Requirements 3.1**

### Property 8: Animation Staggering

*For any* set of multiple elements animating simultaneously, the animation delays should be staggered with at least 50ms increments between consecutive elements.

**Validates: Requirements 3.3**

### Property 9: Concurrent Animation Limiting

*For any* state where multiple animations are triggered, the Animation Engine should enforce a maximum limit on concurrent animations to prevent performance degradation.

**Validates: Requirements 3.4**

### Property 10: Animation Cleanup

*For any* animation that completes, the Animation Engine should remove animation-related CSS classes and inline styles from the element to free resources.

**Validates: Requirements 3.5**

### Property 11: Reduced Motion Respect

*For any* animation when the user has enabled "prefers-reduced-motion", the Animation Engine should either disable the animation entirely or reduce it to a simple fade with no transforms.

**Validates: Requirements 4.1**

### Property 12: Device-Adaptive Animations

*For any* device context (mobile, low-powered, or desktop), the Animation Engine should adjust animation complexity appropriately, using simplified animations on constrained devices.

**Validates: Requirements 4.2, 8.4**

### Property 13: Animation Accessibility Preservation

*For any* animated element, the animation should not remove or interfere with keyboard accessibility (tab order, focus indicators) or screen reader announcements (ARIA attributes, semantic HTML).

**Validates: Requirements 4.3**

### Property 14: Graceful Animation Degradation

*For any* content with animations disabled (via reduced motion or configuration), the content should be immediately visible in its final state without requiring animation completion.

**Validates: Requirements 4.4**

### Property 15: Non-Blocking Animations

*For any* interactive element (buttons, table selections, form inputs), animations should not prevent or delay user interactions with those elements.

**Validates: Requirements 4.5**

### Property 16: Feature Card Icon Presence

*For any* feature card component rendered on the Landing page, the card should include a visual icon or illustration element representing the feature.

**Validates: Requirements 5.3**

### Property 17: Benefit Detail Expansion

*For any* benefit description element, clicking or activating it should reveal or navigate to detailed information about that specific benefit.

**Validates: Requirements 5.4**

### Property 18: CTA Navigation Behavior

*For any* Call-To-Action button click on the Tables page, the system should navigate to the QR ordering configuration interface or modal.

**Validates: Requirements 6.2**

### Property 19: QR Code Gap Display

*For any* restaurant configuration where some tables lack QR codes, the Tables page should display an accurate count of tables without QR codes.

**Validates: Requirements 6.3**

### Property 20: Setup Progress Indication

*For any* QR ordering configuration that is partially complete, the Tables page should display progress indicators showing the completion percentage or remaining steps.

**Validates: Requirements 6.4**

### Property 21: Performance Monitoring and Logging

*For any* active animation, the Animation Engine should track performance metrics (frame rates, render times) and log warnings when performance issues are detected (layout thrashing, excessive repaints, low FPS).

**Validates: Requirements 8.1, 8.3**

### Property 22: Adaptive Performance Response

*For any* situation where frame rates drop below 30 FPS during animations, the Animation Engine should automatically reduce animation complexity or disable non-essential animations.

**Validates: Requirements 8.2**

## Error Handling

### Animation Failures

**Scenario:** Animation fails to initialize or complete due to browser incompatibility or resource constraints.

**Handling:**
- Gracefully degrade to non-animated state
- Log error with browser and device information
- Display content in final state immediately
- Set flag to disable animations for remainder of session

**Implementation:**
```typescript
try {
  triggerAnimation(element, config);
} catch (error) {
  logger.warn('Animation failed', { error, element, config });
  element.classList.add('animation-disabled');
  showFinalState(element);
  disableAnimationsForSession();
}
```

### Intersection Observer Unavailable

**Scenario:** Browser doesn't support Intersection Observer API (older browsers).

**Handling:**
- Detect API availability on initialization
- Fall back to immediate display without scroll triggers
- Optionally use polyfill for broader support
- Log warning for monitoring

**Implementation:**
```typescript
const hasIntersectionObserver = 'IntersectionObserver' in window;

if (!hasIntersectionObserver) {
  logger.warn('IntersectionObserver not supported, disabling scroll animations');
  return { isVisible: true, ref, hasTriggered: true };
}
```

### Performance Degradation

**Scenario:** Animations cause frame rate drops or janky scrolling.

**Handling:**
- Monitor FPS using requestAnimationFrame
- Automatically reduce animation complexity when FPS < 30
- Disable animations if performance doesn't improve
- Provide user setting to manually disable animations

**Thresholds:**
- FPS < 30: Reduce complexity (remove transforms, use fade only)
- FPS < 20: Disable all animations
- Consecutive drops: Disable for session

### Missing Statistics Data

**Scenario:** QR statistics are unavailable or incomplete.

**Handling:**
- Display placeholder values or "N/A"
- Show message explaining data is being collected
- Disable count-up animations for missing data
- Provide fallback content highlighting potential benefits

### Component Mount/Unmount During Animation

**Scenario:** Component unmounts while animation is in progress.

**Handling:**
- Cancel ongoing animations in cleanup function
- Remove event listeners and observers
- Clear animation timers and RAF callbacks
- Prevent memory leaks from orphaned animations

**Implementation:**
```typescript
useEffect(() => {
  const animationId = startAnimation();
  
  return () => {
    cancelAnimation(animationId);
    cleanupObservers();
    clearTimers();
  };
}, []);
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of animation configurations
- Edge cases (empty data, missing props, extreme values)
- Error conditions (API unavailable, performance issues)
- Integration points between components
- Specific user interactions (clicks, hovers, scrolls)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Animation behavior across random configurations
- Performance characteristics across device types
- Accessibility compliance across all components
- State management across random user actions

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Library:** We will use `@fast-check` for TypeScript/JavaScript property-based testing, which integrates well with Jest and provides excellent React component testing support.

**Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: qr-order-promotions, Property {number}: {property_text}`

**Example Property Test Structure:**
```typescript
// Feature: qr-order-promotions, Property 11: Reduced Motion Respect
test('animations respect prefers-reduced-motion', () => {
  fc.assert(
    fc.property(
      fc.record({
        type: fc.constantFrom('fade', 'slide', 'scale', 'bounce'),
        duration: fc.integer({ min: 100, max: 1000 }),
        prefersReducedMotion: fc.boolean()
      }),
      (config) => {
        const result = generateAnimationStyles(config);
        
        if (config.prefersReducedMotion) {
          // Should have no transforms or minimal animation
          expect(result.transform).toBeUndefined();
          expect(result.transition).toMatch(/opacity/);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Component Tests:**
- Render tests for all components
- Snapshot tests for visual regression
- Interaction tests (clicks, hovers, keyboard navigation)
- Conditional rendering based on props
- Error boundary behavior

**Hook Tests:**
- `useAnimation`: Test all animation types and configurations
- `useScrollTrigger`: Test intersection observer behavior
- `useReducedMotion`: Test media query detection
- Cleanup and unmount behavior

**Integration Tests:**
- Tables page with QR promotional components
- Landing page with animated sections
- Animation engine with performance monitor
- Statistics display with real data

**Edge Cases:**
- Empty or null data
- Extremely large numbers in statistics
- Rapid component mount/unmount
- Simultaneous animation triggers
- Browser API unavailability

### Performance Testing

While not part of automated unit tests, performance should be validated through:

**Manual Testing:**
- Visual inspection on various devices
- Frame rate monitoring in Chrome DevTools
- Lighthouse performance audits
- Real device testing (iOS, Android)

**Automated Performance Checks:**
- Bundle size monitoring
- Render time benchmarks
- Animation frame budget analysis
- Memory leak detection

### Accessibility Testing

**Automated:**
- jest-axe for accessibility violations
- Keyboard navigation tests
- Screen reader announcement tests
- Focus management tests

**Manual:**
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- High contrast mode compatibility
- Reduced motion preference testing

### Test Coverage Goals

- Line coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 85%
- Property test coverage: All 22 properties implemented
- Critical paths: 100% coverage (animation engine, performance monitor)
