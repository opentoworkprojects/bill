# useScrollTrigger Hook

A React hook for detecting when elements enter the viewport using the Intersection Observer API. Triggers animations when elements scroll into view with support for staggered animations and accessibility.

## Features

- ✅ Detects when elements enter viewport using Intersection Observer
- ✅ Supports staggered animations for multiple elements
- ✅ Respects `prefers-reduced-motion` for accessibility
- ✅ Configurable threshold and root margin
- ✅ Optional trigger-once mode
- ✅ Automatic cleanup on unmount
- ✅ Fallback for browsers without Intersection Observer support

## Basic Usage

```jsx
import { useScrollTrigger } from './hooks/useScrollTrigger';
import { useAnimation } from './hooks/useAnimation';

function ScrollAnimatedComponent() {
  const scrollTrigger = useScrollTrigger({
    threshold: 0.2,
    triggerOnce: true,
  });
  
  const animation = useAnimation({
    type: 'slideInUp',
    duration: 400,
  });
  
  // Trigger animation when element becomes visible
  useEffect(() => {
    if (scrollTrigger.isVisible) {
      animation.trigger();
    }
  }, [scrollTrigger.isVisible]);
  
  return (
    <div ref={scrollTrigger.ref} style={animation.style}>
      <h2>This content animates when scrolled into view</h2>
    </div>
  );
}
```

## Configuration Options

### threshold
- **Type:** `number`
- **Default:** `0.1`
- **Range:** `0` to `1`
- **Description:** How much of the element must be visible before triggering (0 = any pixel, 1 = entire element)

```jsx
// Trigger when 50% of element is visible
const trigger = useScrollTrigger({ threshold: 0.5 });
```

### rootMargin
- **Type:** `string`
- **Default:** `'0px'`
- **Description:** Margin around the viewport for early/late triggering (CSS margin syntax)

```jsx
// Trigger 100px before element enters viewport
const trigger = useScrollTrigger({ rootMargin: '100px' });

// Different margins for each side
const trigger = useScrollTrigger({ rootMargin: '100px 0px -100px 0px' });
```

### triggerOnce
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to trigger only once or every time element enters viewport

```jsx
// Trigger every time element enters viewport
const trigger = useScrollTrigger({ triggerOnce: false });
```

### staggerDelay
- **Type:** `number`
- **Default:** `100`
- **Description:** Delay in milliseconds between staggered items

```jsx
// 150ms delay between each item
const trigger = useScrollTrigger({ staggerDelay: 150 });
```

### staggerIndex
- **Type:** `number`
- **Default:** `0`
- **Description:** Index for staggered animations (usually set automatically)

## Return Values

### isVisible
- **Type:** `boolean`
- **Description:** Whether the element is currently visible in the viewport

### ref
- **Type:** `React.RefObject`
- **Description:** Ref to attach to the target element

### hasTriggered
- **Type:** `boolean`
- **Description:** Whether the trigger has fired at least once

## Advanced Examples

### Staggered List Animation

```jsx
import { useScrollTriggers } from './hooks/useScrollTrigger';

function StaggeredList({ items }) {
  const triggers = useScrollTriggers(items.length, {
    threshold: 0.2,
    staggerDelay: 100,
    triggerOnce: true,
  });
  
  return (
    <div>
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={triggers[index].ref}
          style={{
            opacity: triggers[index].isVisible ? 1 : 0,
            transform: triggers[index].isVisible 
              ? 'translateY(0)' 
              : 'translateY(20px)',
            transition: 'opacity 0.4s, transform 0.4s',
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

### Combined with useAnimation

```jsx
function FeatureCard({ feature, index }) {
  const scrollTrigger = useScrollTrigger({
    threshold: 0.3,
    staggerDelay: 100,
    staggerIndex: index,
  });
  
  const animation = useAnimation({
    type: 'slideInUp',
    duration: 500,
  });
  
  useEffect(() => {
    if (scrollTrigger.isVisible && !animation.hasAnimated) {
      animation.trigger();
    }
  }, [scrollTrigger.isVisible]);
  
  return (
    <div ref={scrollTrigger.ref} style={animation.style}>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  );
}
```

### Repeating Animation

```jsx
function RepeatingAnimation() {
  const scrollTrigger = useScrollTrigger({
    threshold: 0.5,
    triggerOnce: false, // Trigger every time
  });
  
  return (
    <div
      ref={scrollTrigger.ref}
      style={{
        opacity: scrollTrigger.isVisible ? 1 : 0,
        transform: scrollTrigger.isVisible 
          ? 'scale(1)' 
          : 'scale(0.9)',
        transition: 'opacity 0.3s, transform 0.3s',
      }}
    >
      <p>This animates every time you scroll past it</p>
    </div>
  );
}
```

### Early Trigger with Root Margin

```jsx
function EarlyTrigger() {
  const scrollTrigger = useScrollTrigger({
    threshold: 0.1,
    rootMargin: '200px', // Start animation 200px before entering viewport
  });
  
  return (
    <div ref={scrollTrigger.ref}>
      {scrollTrigger.isVisible && (
        <div className="animated-content">
          Content appears early!
        </div>
      )}
    </div>
  );
}
```

## Accessibility

The hook automatically respects the user's `prefers-reduced-motion` setting:

- When reduced motion is preferred, elements are immediately visible without scroll triggers
- This ensures content is accessible without requiring animations
- No additional configuration needed

## Browser Support

The hook uses the Intersection Observer API, which is supported in:
- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 15+

For older browsers, the hook automatically falls back to showing content immediately.

## Performance Considerations

1. **Efficient Observation:** Uses native Intersection Observer for optimal performance
2. **Automatic Cleanup:** Observers are disconnected when components unmount
3. **Trigger Once:** Default behavior disconnects observer after first trigger to save resources
4. **Stagger Delays:** Minimum 50ms delay enforced between staggered items (per requirements)

## Common Patterns

### Hero Section with Staggered Elements

```jsx
function HeroSection() {
  const titleTrigger = useScrollTrigger({ staggerIndex: 0, staggerDelay: 200 });
  const subtitleTrigger = useScrollTrigger({ staggerIndex: 1, staggerDelay: 200 });
  const ctaTrigger = useScrollTrigger({ staggerIndex: 2, staggerDelay: 200 });
  
  return (
    <section>
      <h1 ref={titleTrigger.ref} className={titleTrigger.isVisible ? 'visible' : ''}>
        Welcome
      </h1>
      <p ref={subtitleTrigger.ref} className={subtitleTrigger.isVisible ? 'visible' : ''}>
        Discover amazing features
      </p>
      <button ref={ctaTrigger.ref} className={ctaTrigger.isVisible ? 'visible' : ''}>
        Get Started
      </button>
    </section>
  );
}
```

### Grid of Cards

```jsx
function CardGrid({ cards }) {
  const triggers = useScrollTriggers(cards.length, {
    threshold: 0.2,
    staggerDelay: 80,
  });
  
  return (
    <div className="grid">
      {cards.map((card, index) => (
        <div
          key={card.id}
          ref={triggers[index].ref}
          className={triggers[index].isVisible ? 'card-visible' : 'card-hidden'}
        >
          <Card {...card} />
        </div>
      ))}
    </div>
  );
}
```

## Testing

The hook is designed to be testable:

```jsx
import { renderHook } from '@testing-library/react-hooks';
import { useScrollTrigger } from './useScrollTrigger';

test('returns ref and visibility state', () => {
  const { result } = renderHook(() => useScrollTrigger());
  
  expect(result.current.ref).toBeDefined();
  expect(result.current.isVisible).toBe(false);
  expect(result.current.hasTriggered).toBe(false);
});
```

## Related Hooks

- **useAnimation** - Manages animation states and CSS styles
- **useReducedMotion** - Detects user's motion preferences
- **useScrollTriggers** - Creates multiple scroll triggers with staggering

## Requirements

This hook implements:
- **Requirement 2.2:** Scroll-triggered animations for Landing page
- **Requirement 3.3:** Animation staggering with minimum 50ms delay
- **Requirement 4.1:** Respects prefers-reduced-motion setting
