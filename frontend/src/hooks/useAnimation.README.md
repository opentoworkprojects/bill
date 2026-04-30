# useAnimation Hook

A powerful React hook for managing animations with built-in accessibility support and performance optimization.

## Features

- ✅ **GPU-Accelerated**: Uses CSS transforms for optimal performance (Requirement 3.1)
- ✅ **Accessibility**: Respects `prefers-reduced-motion` setting (Requirement 4.1)
- ✅ **Auto Cleanup**: Removes animation styles after completion (Requirement 3.5)
- ✅ **Flexible Configuration**: Supports presets and custom animations
- ✅ **TypeScript-Ready**: Full type definitions available
- ✅ **Zero Dependencies**: Only requires React

## Installation

The hook is already available in your project at `src/hooks/useAnimation.js`.

```javascript
import { useAnimation } from './hooks/useAnimation';
```

## Basic Usage

### Simple Fade Animation

```jsx
import { useAnimation } from './hooks/useAnimation';

function MyComponent() {
  const animation = useAnimation({ type: 'fade', duration: 300 });
  
  return (
    <div style={animation.style}>
      <button onClick={animation.trigger}>Fade In</button>
    </div>
  );
}
```

### Using Animation Presets

```jsx
// Use a preset by name
const animation = useAnimation('slideInUp');

// Or specify type and direction
const animation = useAnimation({ 
  type: 'slide', 
  direction: 'left',
  duration: 400 
});
```

### Auto-trigger on Mount

```jsx
function MyComponent() {
  const animation = useAnimation('fadeIn');
  
  useEffect(() => {
    animation.trigger();
  }, []);
  
  return <div style={animation.style}>Content</div>;
}
```

## API Reference

### useAnimation(config)

**Parameters:**

- `config` (Object | String): Animation configuration or preset name

**Config Object Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | String | - | Animation type: 'fade', 'slide', 'scale', 'bounce' |
| `direction` | String | - | Direction for slide: 'up', 'down', 'left', 'right' |
| `duration` | Number | 300 | Animation duration in milliseconds |
| `delay` | Number | 0 | Delay before animation starts (ms) |
| `easing` | String | 'ease-out' | CSS easing function |
| `transform` | Object | - | Custom transform: `{ from: '...', to: '...' }` |
| `opacity` | Object | - | Custom opacity: `{ from: 0, to: 1 }` |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `isAnimating` | Boolean | Whether animation is currently running |
| `hasAnimated` | Boolean | Whether animation has completed at least once |
| `trigger` | Function | Function to start the animation |
| `reset` | Function | Function to reset to initial state |
| `style` | Object | CSS styles to apply to the element |

## Available Presets

### Fade Animations
- `fadeIn` - Simple fade in
- `fadeOut` - Simple fade out

### Slide Animations
- `slideInUp` - Slide up from below
- `slideInDown` - Slide down from above
- `slideInLeft` - Slide in from left
- `slideInRight` - Slide in from right

### Scale Animations
- `scaleIn` - Scale up from smaller
- `scaleOut` - Scale down to smaller
- `bounceIn` - Bounce in with spring effect
- `zoomIn` - Zoom in from very small
- `zoomOut` - Zoom out to very small

### Special Animations
- `rotateIn` - Rotate and scale in
- `pulse` - Subtle pulse effect
- `lift` - Lift up with shadow

## Examples

### Custom Animation

```jsx
const animation = useAnimation({
  duration: 800,
  delay: 200,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  transform: {
    from: 'scale(0.5) rotate(-180deg)',
    to: 'scale(1) rotate(0deg)'
  },
  opacity: {
    from: 0,
    to: 1
  }
});
```

### Staggered Animations

```jsx
function StaggeredList({ items }) {
  return (
    <div>
      {items.map((item, index) => (
        <StaggeredItem 
          key={item.id} 
          item={item} 
          delay={index * 100} 
        />
      ))}
    </div>
  );
}

function StaggeredItem({ item, delay }) {
  const animation = useAnimation({ 
    type: 'slide', 
    direction: 'right',
    duration: 400,
    delay 
  });
  
  useEffect(() => {
    animation.trigger();
  }, []);
  
  return (
    <div style={animation.style}>
      {item.content}
    </div>
  );
}
```

### Conditional Animation

```jsx
function ConditionalAnimation({ shouldAnimate }) {
  const animation = useAnimation('fadeIn');
  
  useEffect(() => {
    if (shouldAnimate) {
      animation.trigger();
    }
  }, [shouldAnimate]);
  
  return <div style={animation.style}>Content</div>;
}
```

### Reset and Replay

```jsx
function ReplayableAnimation() {
  const animation = useAnimation('bounceIn');
  
  return (
    <div>
      <div style={animation.style}>
        Animated Content
      </div>
      <button onClick={animation.trigger}>Play</button>
      <button onClick={animation.reset}>Reset</button>
    </div>
  );
}
```

## Accessibility

The hook automatically respects the user's `prefers-reduced-motion` setting:

- **When enabled**: Transforms are removed, only opacity transitions remain
- **Duration**: Automatically reduced to maximum 200ms
- **Behavior**: Animations still trigger but are much subtler

This ensures users with motion sensitivity or vestibular disorders have a comfortable experience.

## Performance

### GPU Acceleration

The hook uses CSS `transform` properties (translateX, translateY, scale, rotate) instead of position or dimension properties. This ensures animations run on the GPU for smooth 60fps performance.

### will-change Optimization

During animation, the `will-change` CSS property is automatically added to hint the browser about upcoming changes. After animation completes, it's removed to free resources.

### Cleanup

Animation styles are automatically cleaned up after completion to prevent memory leaks and ensure optimal performance.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ (with polyfills for React)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Testing

### Manual Testing

See `useAnimation.manual-test.md` for comprehensive manual testing guide.

### Example Components

See `useAnimation.example.jsx` for working examples you can use in your application.

### Automated Tests

Automated tests will be added in tasks 1.5 and 1.6:
- Property-based tests for universal correctness
- Unit tests for edge cases and error conditions

## Troubleshooting

### Animation doesn't trigger

**Problem**: Animation doesn't start when trigger() is called.

**Solution**: 
- Ensure the `style` object is applied to the element
- Check browser console for errors
- Verify the element is mounted in the DOM

### Animation is choppy

**Problem**: Animation stutters or has low frame rate.

**Solution**:
- Check if other heavy operations are running
- Reduce number of concurrent animations
- Simplify animation (use fade instead of complex transforms)
- Check browser DevTools Performance tab

### Reduced motion not working

**Problem**: Animations still show transforms with reduced motion enabled.

**Solution**:
- Verify system setting is enabled
- Check browser supports `prefers-reduced-motion` media query
- Test in Chrome DevTools with emulation enabled

### Memory leaks

**Problem**: Component unmounts but timeouts continue.

**Solution**:
- The hook automatically cleans up on unmount
- If issues persist, check for circular dependencies in useEffect
- Ensure you're not storing animation object in external state

## Advanced Usage

### Combining with Other Hooks

```jsx
function ScrollTriggeredAnimation() {
  const animation = useAnimation('slideInUp');
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animation.trigger();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref} style={animation.style}>
      Content appears when scrolled into view
    </div>
  );
}
```

### Chaining Animations

```jsx
function ChainedAnimations() {
  const first = useAnimation('fadeIn');
  const second = useAnimation('slideInUp');
  
  useEffect(() => {
    first.trigger();
  }, []);
  
  useEffect(() => {
    if (first.hasAnimated) {
      second.trigger();
    }
  }, [first.hasAnimated]);
  
  return (
    <>
      <div style={first.style}>First</div>
      <div style={second.style}>Second</div>
    </>
  );
}
```

## Related Hooks

- `useReducedMotion` - Detect user's motion preference
- `useScrollTrigger` - Trigger animations on scroll (Task 2.1)

## Requirements Satisfied

- ✅ **Requirement 3.1**: GPU-accelerated transforms
- ✅ **Requirement 3.5**: Animation cleanup after completion
- ✅ **Requirement 4.1**: Reduced motion support

## Contributing

When modifying this hook:

1. Maintain backward compatibility
2. Add tests for new features
3. Update this documentation
4. Verify accessibility features still work
5. Test performance on low-end devices

## License

Part of the QR Order Promotions feature implementation.
