# useAnimation Hook - Manual Test Guide

This guide provides manual testing steps to verify the useAnimation hook implementation.

## Test 1: Basic Animation Trigger

**Setup:**
```jsx
import { useAnimation } from '../useAnimation';

function TestComponent() {
  const animation = useAnimation({ type: 'fade', duration: 300 });
  
  return (
    <div style={animation.style}>
      <button onClick={animation.trigger}>Trigger Animation</button>
      <p>Is Animating: {animation.isAnimating ? 'Yes' : 'No'}</p>
      <p>Has Animated: {animation.hasAnimated ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

**Expected Behavior:**
1. Initially: isAnimating = false, hasAnimated = false, opacity = 0
2. After clicking "Trigger Animation": isAnimating = true, opacity transitions to 1
3. After 300ms: isAnimating = false, hasAnimated = true, opacity = 1

## Test 2: Slide Animation with Direction

**Setup:**
```jsx
const animation = useAnimation({ 
  type: 'slide', 
  direction: 'up', 
  duration: 400 
});
```

**Expected Behavior:**
1. Initially: transform = 'translateY(30px)', opacity = 0
2. After trigger: transform transitions to 'translateY(0)', opacity to 1
3. Animation completes in 400ms

## Test 3: Preset Animation

**Setup:**
```jsx
const animation = useAnimation('slideInLeft');
```

**Expected Behavior:**
1. Uses slideInLeft preset configuration
2. Animates from left with translateX(-30px) to translateX(0)
3. Fades in from opacity 0 to 1

## Test 4: Custom Animation Config

**Setup:**
```jsx
const animation = useAnimation({
  duration: 500,
  delay: 100,
  easing: 'ease-in-out',
  transform: {
    from: 'scale(0.5) rotate(0deg)',
    to: 'scale(1) rotate(360deg)'
  },
  opacity: {
    from: 0,
    to: 1
  }
});
```

**Expected Behavior:**
1. Animation starts after 100ms delay
2. Scales from 0.5 to 1 while rotating 360 degrees
3. Fades in from 0 to 1
4. Total duration: 600ms (500ms + 100ms delay)

## Test 5: Reset Functionality

**Setup:**
```jsx
function TestComponent() {
  const animation = useAnimation({ type: 'fade', duration: 300 });
  
  return (
    <div style={animation.style}>
      <button onClick={animation.trigger}>Trigger</button>
      <button onClick={animation.reset}>Reset</button>
      <p>Has Animated: {animation.hasAnimated ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

**Expected Behavior:**
1. Click "Trigger" - animation runs, hasAnimated becomes true
2. Click "Reset" - hasAnimated becomes false, element returns to initial state
3. Can trigger animation again after reset

## Test 6: Reduced Motion Preference

**Setup:**
1. Enable "Reduce motion" in system preferences (macOS: System Preferences > Accessibility > Display > Reduce motion)
2. Use any animation configuration

**Expected Behavior:**
1. Transforms are removed (transform = 'none')
2. Only opacity transitions remain
3. Duration is reduced to maximum 200ms
4. Animation still triggers and completes

## Test 7: Multiple Rapid Triggers

**Setup:**
```jsx
function TestComponent() {
  const animation = useAnimation({ type: 'fade', duration: 1000 });
  
  return (
    <div style={animation.style}>
      <button onClick={() => {
        animation.trigger();
        setTimeout(() => animation.trigger(), 100);
        setTimeout(() => animation.trigger(), 200);
      }}>
        Rapid Trigger
      </button>
    </div>
  );
}
```

**Expected Behavior:**
1. Previous animation is cancelled when new trigger is called
2. Only the last trigger completes
3. No memory leaks or orphaned timeouts
4. Animation state is consistent

## Test 8: Cleanup on Unmount

**Setup:**
```jsx
function ParentComponent() {
  const [show, setShow] = useState(true);
  
  return (
    <>
      <button onClick={() => setShow(!show)}>Toggle</button>
      {show && <AnimatedComponent />}
    </>
  );
}

function AnimatedComponent() {
  const animation = useAnimation({ type: 'fade', duration: 5000 });
  
  useEffect(() => {
    animation.trigger();
  }, []);
  
  return <div style={animation.style}>Long animation</div>;
}
```

**Expected Behavior:**
1. Start animation (5 seconds)
2. Unmount component before animation completes
3. No console errors
4. No memory leaks
5. Timeouts are properly cleaned up

## Test 9: GPU Acceleration Verification

**Setup:**
Use Chrome DevTools to verify GPU acceleration:
1. Open DevTools > More tools > Rendering
2. Enable "Paint flashing" and "Layer borders"
3. Trigger animations

**Expected Behavior:**
1. Animated elements should have their own compositing layer (green border)
2. Only the animated element should repaint, not surrounding elements
3. will-change property should be set during animation
4. will-change should be removed after animation completes

## Test 10: Style Cleanup After Animation

**Setup:**
```jsx
function TestComponent() {
  const animation = useAnimation({ type: 'fade', duration: 300 });
  
  return (
    <div style={animation.style}>
      <button onClick={animation.trigger}>Animate</button>
      <pre>{JSON.stringify(animation.style, null, 2)}</pre>
    </div>
  );
}
```

**Expected Behavior:**
1. Before animation: style includes transform, opacity, transition: 'none'
2. During animation: style includes transform, opacity, transition string, will-change
3. After animation: style includes only final transform and opacity (transition and will-change removed)

## Verification Checklist

- [ ] Basic fade animation works
- [ ] Slide animations work in all directions (up, down, left, right)
- [ ] Scale and bounce animations work
- [ ] Custom animation configs work
- [ ] Preset names work (string input)
- [ ] Reset functionality works
- [ ] Reduced motion preference is respected
- [ ] Multiple rapid triggers don't cause issues
- [ ] Component unmount during animation doesn't cause errors
- [ ] GPU acceleration is used (transforms, not position/dimensions)
- [ ] will-change is added during animation and removed after
- [ ] No memory leaks from timeouts
- [ ] Animation state (isAnimating, hasAnimated) is accurate

## Notes

- The user requested to skip writing tests for now and focus on implementation
- This manual test guide can be used to verify the hook works correctly
- Automated tests can be added later as per tasks 1.5 and 1.6
