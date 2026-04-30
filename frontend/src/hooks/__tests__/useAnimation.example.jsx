import React, { useEffect } from 'react';
import { useAnimation } from '../useAnimation';

/**
 * Example component demonstrating useAnimation hook usage
 * 
 * This file provides working examples that can be copied into your application
 * to test the useAnimation hook functionality.
 */

// Example 1: Basic Fade Animation
export function FadeExample() {
  const animation = useAnimation({ type: 'fade', duration: 300 });
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Fade Animation Example</h3>
      <div style={animation.style}>
        <p>This text will fade in when you click the button</p>
      </div>
      <button onClick={animation.trigger}>Trigger Fade</button>
      <button onClick={animation.reset}>Reset</button>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <div>Is Animating: {animation.isAnimating ? 'Yes' : 'No'}</div>
        <div>Has Animated: {animation.hasAnimated ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
}

// Example 2: Slide Up Animation
export function SlideUpExample() {
  const animation = useAnimation({ 
    type: 'slide', 
    direction: 'up', 
    duration: 400 
  });
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Slide Up Animation Example</h3>
      <div style={animation.style}>
        <div style={{ 
          padding: '20px', 
          background: '#f0f0f0', 
          borderRadius: '8px' 
        }}>
          <p>This card will slide up from below</p>
        </div>
      </div>
      <button onClick={animation.trigger}>Trigger Slide</button>
      <button onClick={animation.reset}>Reset</button>
    </div>
  );
}

// Example 3: Using Preset Name
export function PresetExample() {
  const animation = useAnimation('bounceIn');
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Preset Animation Example (bounceIn)</h3>
      <div style={animation.style}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          background: '#4CAF50', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Bounce!
        </div>
      </div>
      <button onClick={animation.trigger}>Trigger Bounce</button>
      <button onClick={animation.reset}>Reset</button>
    </div>
  );
}

// Example 4: Auto-trigger on Mount
export function AutoTriggerExample() {
  const animation = useAnimation({ 
    type: 'slide', 
    direction: 'left', 
    duration: 600 
  });
  
  useEffect(() => {
    // Trigger animation when component mounts
    animation.trigger();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Auto-trigger on Mount Example</h3>
      <div style={animation.style}>
        <p>This text animated automatically when the component mounted</p>
      </div>
      <button onClick={animation.trigger}>Replay</button>
    </div>
  );
}

// Example 5: Custom Animation Configuration
export function CustomAnimationExample() {
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
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Custom Animation Example</h3>
      <div style={animation.style}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: '#2196F3', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px'
        }}>
          ⭐
        </div>
      </div>
      <button onClick={animation.trigger}>Trigger Custom</button>
      <button onClick={animation.reset}>Reset</button>
      <p style={{ fontSize: '12px', color: '#666' }}>
        Scales from 0.5 to 1, rotates -180° to 0°, with 200ms delay
      </p>
    </div>
  );
}

// Example 6: Multiple Elements with Staggered Animations
export function StaggeredExample() {
  const items = [
    { id: 1, text: 'First Item', delay: 0 },
    { id: 2, text: 'Second Item', delay: 100 },
    { id: 3, text: 'Third Item', delay: 200 },
    { id: 4, text: 'Fourth Item', delay: 300 },
  ];
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Staggered Animation Example</h3>
      <div>
        {items.map((item) => (
          <StaggeredItem key={item.id} text={item.text} delay={item.delay} />
        ))}
      </div>
    </div>
  );
}

function StaggeredItem({ text, delay }) {
  const animation = useAnimation({ 
    type: 'slide', 
    direction: 'right', 
    duration: 400,
    delay 
  });
  
  useEffect(() => {
    animation.trigger();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <div style={animation.style}>
      <div style={{ 
        padding: '15px', 
        margin: '10px 0',
        background: '#f5f5f5', 
        borderRadius: '4px',
        border: '1px solid #ddd'
      }}>
        {text}
      </div>
    </div>
  );
}

// Example 7: All Examples Combined
export function AllExamples() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>useAnimation Hook Examples</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        These examples demonstrate various ways to use the useAnimation hook.
        Open your browser's DevTools to inspect the CSS properties and verify
        GPU acceleration (look for transform and will-change properties).
      </p>
      
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <FadeExample />
      </div>
      
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <SlideUpExample />
      </div>
      
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <PresetExample />
      </div>
      
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <AutoTriggerExample />
      </div>
      
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <CustomAnimationExample />
      </div>
      
      <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <StaggeredExample />
      </div>
      
      <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h4>Testing Reduced Motion</h4>
        <p style={{ fontSize: '14px', margin: '10px 0' }}>
          To test reduced motion support:
        </p>
        <ol style={{ fontSize: '14px', paddingLeft: '20px' }}>
          <li>macOS: System Preferences → Accessibility → Display → Reduce motion</li>
          <li>Windows: Settings → Ease of Access → Display → Show animations</li>
          <li>Chrome DevTools: Rendering → Emulate CSS media feature prefers-reduced-motion</li>
        </ol>
        <p style={{ fontSize: '14px', margin: '10px 0' }}>
          When enabled, animations will use only opacity transitions with no transforms.
        </p>
      </div>
    </div>
  );
}

export default AllExamples;
