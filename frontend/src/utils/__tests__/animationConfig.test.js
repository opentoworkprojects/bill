/**
 * Animation Configuration Test Suite
 * Comprehensive tests for animation utilities and presets
 * Requirements: 3.1, 3.3, 7.2
 */

import {
  DURATION,
  STAGGER_DELAY,
  MIN_STAGGER_DELAY,
  MAX_CONCURRENT_ANIMATIONS,
  EASING,
  ANIMATION_PRESETS,
  fadeIn,
  fadeOut,
  slideInUp,
  slideInDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  scaleOut,
  bounceIn,
  zoomIn,
  zoomOut,
  rotateIn,
  pulse,
  lift,
  getAnimationPreset,
  createAnimationConfig,
  calculateStaggerDelay,
  generateTransitionString,
  createReducedMotionConfig,
} from '../animationConfig';

describe('Animation Configuration Constants', () => {
  describe('DURATION constants', () => {
    test('should define all duration constants', () => {
      expect(DURATION.INSTANT).toBe(0);
      expect(DURATION.FAST).toBe(200);
      expect(DURATION.NORMAL).toBe(300);
      expect(DURATION.MEDIUM).toBe(400);
      expect(DURATION.SLOW).toBe(600);
      expect(DURATION.VERY_SLOW).toBe(800);
    });

    test('should have durations in ascending order', () => {
      expect(DURATION.INSTANT).toBeLessThan(DURATION.FAST);
      expect(DURATION.FAST).toBeLessThan(DURATION.NORMAL);
      expect(DURATION.NORMAL).toBeLessThan(DURATION.MEDIUM);
      expect(DURATION.MEDIUM).toBeLessThan(DURATION.SLOW);
      expect(DURATION.SLOW).toBeLessThan(DURATION.VERY_SLOW);
    });
  });

  describe('STAGGER_DELAY constants', () => {
    test('should define all stagger delay constants', () => {
      expect(STAGGER_DELAY.MINIMAL).toBe(50);
      expect(STAGGER_DELAY.SMALL).toBe(100);
      expect(STAGGER_DELAY.MEDIUM).toBe(150);
      expect(STAGGER_DELAY.LARGE).toBe(200);
    });

    test('should meet minimum stagger requirement (Requirement 3.3)', () => {
      expect(MIN_STAGGER_DELAY).toBe(50);
      expect(STAGGER_DELAY.MINIMAL).toBeGreaterThanOrEqual(MIN_STAGGER_DELAY);
      expect(STAGGER_DELAY.SMALL).toBeGreaterThanOrEqual(MIN_STAGGER_DELAY);
      expect(STAGGER_DELAY.MEDIUM).toBeGreaterThanOrEqual(MIN_STAGGER_DELAY);
      expect(STAGGER_DELAY.LARGE).toBeGreaterThanOrEqual(MIN_STAGGER_DELAY);
    });
  });

  describe('MAX_CONCURRENT_ANIMATIONS constant', () => {
    test('should define maximum concurrent animations', () => {
      expect(MAX_CONCURRENT_ANIMATIONS).toBe(10);
      expect(MAX_CONCURRENT_ANIMATIONS).toBeGreaterThan(0);
    });
  });

  describe('EASING constants', () => {
    test('should define standard easing functions', () => {
      expect(EASING.LINEAR).toBe('linear');
      expect(EASING.EASE).toBe('ease');
      expect(EASING.EASE_IN).toBe('ease-in');
      expect(EASING.EASE_OUT).toBe('ease-out');
      expect(EASING.EASE_IN_OUT).toBe('ease-in-out');
    });

    test('should define custom cubic-bezier easings', () => {
      expect(EASING.EASE_OUT_EXPO).toContain('cubic-bezier');
      expect(EASING.EASE_IN_CUBIC).toContain('cubic-bezier');
      expect(EASING.BOUNCE).toContain('cubic-bezier');
      expect(EASING.SPRING).toContain('cubic-bezier');
    });

    test('should have valid cubic-bezier format', () => {
      const cubicBezierPattern = /^cubic-bezier\([-\d.]+,\s*[-\d.]+,\s*[-\d.]+,\s*[-\d.]+\)$/;
      expect(EASING.EASE_OUT_QUAD).toMatch(cubicBezierPattern);
      expect(EASING.EASE_IN_OUT_CUBIC).toMatch(cubicBezierPattern);
      expect(EASING.BOUNCE).toMatch(cubicBezierPattern);
    });
  });
});

describe('Animation Presets', () => {
  describe('Fade animations', () => {
    test('fadeIn should have correct configuration', () => {
      expect(fadeIn.name).toBe('fadeIn');
      expect(fadeIn.transform.from).toBe('none');
      expect(fadeIn.transform.to).toBe('none');
      expect(fadeIn.opacity.from).toBe(0);
      expect(fadeIn.opacity.to).toBe(1);
      expect(fadeIn.duration).toBeGreaterThan(0);
    });

    test('fadeOut should have correct configuration', () => {
      expect(fadeOut.name).toBe('fadeOut');
      expect(fadeOut.transform.from).toBe('none');
      expect(fadeOut.transform.to).toBe('none');
      expect(fadeOut.opacity.from).toBe(1);
      expect(fadeOut.opacity.to).toBe(0);
    });

    test('fade animations should not use transforms (Requirement 3.1)', () => {
      expect(fadeIn.transform.from).toBe('none');
      expect(fadeIn.transform.to).toBe('none');
      expect(fadeOut.transform.from).toBe('none');
      expect(fadeOut.transform.to).toBe('none');
    });
  });

  describe('Slide animations', () => {
    test('slideInUp should use translateY transform (Requirement 3.1)', () => {
      expect(slideInUp.name).toBe('slideInUp');
      expect(slideInUp.transform.from).toContain('translateY');
      expect(slideInUp.transform.to).toContain('translateY');
      expect(slideInUp.opacity.from).toBe(0);
      expect(slideInUp.opacity.to).toBe(1);
    });

    test('slideInDown should use translateY transform (Requirement 3.1)', () => {
      expect(slideInDown.name).toBe('slideInDown');
      expect(slideInDown.transform.from).toContain('translateY');
      expect(slideInDown.transform.to).toContain('translateY');
    });

    test('slideInLeft should use translateX transform (Requirement 3.1)', () => {
      expect(slideInLeft.name).toBe('slideInLeft');
      expect(slideInLeft.transform.from).toContain('translateX');
      expect(slideInLeft.transform.to).toContain('translateX');
    });

    test('slideInRight should use translateX transform (Requirement 3.1)', () => {
      expect(slideInRight.name).toBe('slideInRight');
      expect(slideInRight.transform.from).toContain('translateX');
      expect(slideInRight.transform.to).toContain('translateX');
    });

    test('all slide animations should fade in', () => {
      [slideInUp, slideInDown, slideInLeft, slideInRight].forEach(preset => {
        expect(preset.opacity.from).toBe(0);
        expect(preset.opacity.to).toBe(1);
      });
    });
  });

  describe('Scale animations', () => {
    test('scaleIn should use scale transform (Requirement 3.1)', () => {
      expect(scaleIn.name).toBe('scaleIn');
      expect(scaleIn.transform.from).toContain('scale');
      expect(scaleIn.transform.to).toContain('scale');
      expect(scaleIn.opacity.from).toBe(0);
      expect(scaleIn.opacity.to).toBe(1);
    });

    test('scaleOut should use scale transform (Requirement 3.1)', () => {
      expect(scaleOut.name).toBe('scaleOut');
      expect(scaleOut.transform.from).toContain('scale');
      expect(scaleOut.transform.to).toContain('scale');
      expect(scaleOut.opacity.from).toBe(1);
      expect(scaleOut.opacity.to).toBe(0);
    });

    test('bounceIn should use scale with bounce easing', () => {
      expect(bounceIn.name).toBe('bounceIn');
      expect(bounceIn.transform.from).toContain('scale');
      expect(bounceIn.easing).toBe(EASING.BOUNCE);
    });

    test('zoomIn and zoomOut should use scale transform', () => {
      expect(zoomIn.transform.from).toContain('scale');
      expect(zoomIn.transform.to).toContain('scale');
      expect(zoomOut.transform.from).toContain('scale');
      expect(zoomOut.transform.to).toContain('scale');
    });
  });

  describe('Rotate animations', () => {
    test('rotateIn should use rotate and scale transforms (Requirement 3.1)', () => {
      expect(rotateIn.name).toBe('rotateIn');
      expect(rotateIn.transform.from).toContain('rotate');
      expect(rotateIn.transform.from).toContain('scale');
      expect(rotateIn.transform.to).toContain('rotate');
      expect(rotateIn.transform.to).toContain('scale');
    });
  });

  describe('Special animations', () => {
    test('pulse should maintain opacity', () => {
      expect(pulse.name).toBe('pulse');
      expect(pulse.opacity.from).toBe(1);
      expect(pulse.opacity.to).toBe(1);
      expect(pulse.transform.from).toContain('scale');
      expect(pulse.transform.to).toContain('scale');
    });

    test('lift should use translateY transform', () => {
      expect(lift.name).toBe('lift');
      expect(lift.transform.from).toContain('translateY');
      expect(lift.transform.to).toContain('translateY');
      expect(lift.opacity.from).toBe(1);
      expect(lift.opacity.to).toBe(1);
    });
  });

  describe('ANIMATION_PRESETS collection', () => {
    test('should contain all animation presets', () => {
      expect(ANIMATION_PRESETS.fadeIn).toBe(fadeIn);
      expect(ANIMATION_PRESETS.fadeOut).toBe(fadeOut);
      expect(ANIMATION_PRESETS.slideInUp).toBe(slideInUp);
      expect(ANIMATION_PRESETS.slideInDown).toBe(slideInDown);
      expect(ANIMATION_PRESETS.slideInLeft).toBe(slideInLeft);
      expect(ANIMATION_PRESETS.slideInRight).toBe(slideInRight);
      expect(ANIMATION_PRESETS.scaleIn).toBe(scaleIn);
      expect(ANIMATION_PRESETS.scaleOut).toBe(scaleOut);
      expect(ANIMATION_PRESETS.bounceIn).toBe(bounceIn);
      expect(ANIMATION_PRESETS.zoomIn).toBe(zoomIn);
      expect(ANIMATION_PRESETS.zoomOut).toBe(zoomOut);
      expect(ANIMATION_PRESETS.rotateIn).toBe(rotateIn);
      expect(ANIMATION_PRESETS.pulse).toBe(pulse);
      expect(ANIMATION_PRESETS.lift).toBe(lift);
    });

    test('should have at least 10 presets', () => {
      const presetCount = Object.keys(ANIMATION_PRESETS).length;
      expect(presetCount).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('Utility Functions', () => {
  describe('getAnimationPreset', () => {
    test('should return preset by name', () => {
      const preset = getAnimationPreset('fadeIn');
      expect(preset).toBe(fadeIn);
      expect(preset.name).toBe('fadeIn');
    });

    test('should return null for non-existent preset', () => {
      const preset = getAnimationPreset('nonExistent');
      expect(preset).toBeNull();
    });

    test('should handle undefined input', () => {
      const preset = getAnimationPreset(undefined);
      expect(preset).toBeNull();
    });

    test('should handle null input', () => {
      const preset = getAnimationPreset(null);
      expect(preset).toBeNull();
    });
  });

  describe('createAnimationConfig', () => {
    test('should create config with defaults', () => {
      const config = createAnimationConfig();
      expect(config.name).toBe('custom');
      expect(config.duration).toBe(DURATION.NORMAL);
      expect(config.delay).toBe(0);
      expect(config.easing).toBe(EASING.EASE_OUT);
      expect(config.transform.from).toBe('none');
      expect(config.transform.to).toBe('none');
      expect(config.opacity.from).toBe(1);
      expect(config.opacity.to).toBe(1);
    });

    test('should merge custom config with defaults', () => {
      const config = createAnimationConfig({
        name: 'myAnimation',
        duration: 500,
        delay: 100,
      });
      expect(config.name).toBe('myAnimation');
      expect(config.duration).toBe(500);
      expect(config.delay).toBe(100);
      expect(config.easing).toBe(EASING.EASE_OUT); // default
    });

    test('should handle custom transform values', () => {
      const config = createAnimationConfig({
        transform: {
          from: 'translateX(-50px)',
          to: 'translateX(0)',
        },
      });
      expect(config.transform.from).toBe('translateX(-50px)');
      expect(config.transform.to).toBe('translateX(0)');
    });

    test('should handle custom opacity values', () => {
      const config = createAnimationConfig({
        opacity: {
          from: 0.5,
          to: 1,
        },
      });
      expect(config.opacity.from).toBe(0.5);
      expect(config.opacity.to).toBe(1);
    });

    test('should handle zero opacity values', () => {
      const config = createAnimationConfig({
        opacity: {
          from: 0,
          to: 0,
        },
      });
      expect(config.opacity.from).toBe(0);
      expect(config.opacity.to).toBe(0);
    });

    test('should handle empty config object', () => {
      const config = createAnimationConfig({});
      expect(config).toBeDefined();
      expect(config.name).toBe('custom');
    });
  });

  describe('calculateStaggerDelay', () => {
    test('should calculate stagger delay correctly', () => {
      expect(calculateStaggerDelay(0)).toBe(0);
      expect(calculateStaggerDelay(1)).toBe(50);
      expect(calculateStaggerDelay(2)).toBe(100);
      expect(calculateStaggerDelay(3)).toBe(150);
    });

    test('should respect base delay', () => {
      expect(calculateStaggerDelay(0, 100)).toBe(100);
      expect(calculateStaggerDelay(1, 100)).toBe(150);
      expect(calculateStaggerDelay(2, 100)).toBe(200);
    });

    test('should use custom stagger amount', () => {
      expect(calculateStaggerDelay(0, 0, 200)).toBe(0);
      expect(calculateStaggerDelay(1, 0, 200)).toBe(200);
      expect(calculateStaggerDelay(2, 0, 200)).toBe(400);
    });

    test('should enforce minimum stagger delay (Requirement 3.3)', () => {
      // Even if we try to use a smaller stagger, it should enforce minimum
      expect(calculateStaggerDelay(1, 0, 10)).toBe(MIN_STAGGER_DELAY);
      expect(calculateStaggerDelay(2, 0, 25)).toBe(MIN_STAGGER_DELAY * 2);
    });

    test('should handle large index values', () => {
      const result = calculateStaggerDelay(100, 0, 50);
      expect(result).toBe(5000);
    });

    test('should handle negative base delay gracefully', () => {
      const result = calculateStaggerDelay(1, -100, 50);
      expect(result).toBe(-50); // -100 + 50
    });
  });

  describe('generateTransitionString', () => {
    test('should generate transition for transform only', () => {
      const config = {
        duration: 300,
        easing: EASING.EASE_OUT,
        delay: 0,
        transform: {
          from: 'translateY(20px)',
          to: 'translateY(0)',
        },
        opacity: {
          from: 1,
          to: 1,
        },
      };
      const transition = generateTransitionString(config);
      expect(transition).toContain('transform');
      expect(transition).toContain('300ms');
      expect(transition).toContain(EASING.EASE_OUT);
      expect(transition).not.toContain('opacity');
    });

    test('should generate transition for opacity only', () => {
      const config = {
        duration: 300,
        easing: EASING.EASE_OUT,
        delay: 0,
        transform: {
          from: 'none',
          to: 'none',
        },
        opacity: {
          from: 0,
          to: 1,
        },
      };
      const transition = generateTransitionString(config);
      expect(transition).toContain('opacity');
      expect(transition).not.toContain('transform');
    });

    test('should generate transition for both transform and opacity', () => {
      const config = {
        duration: 300,
        easing: EASING.EASE_OUT,
        delay: 0,
        transform: {
          from: 'scale(0.9)',
          to: 'scale(1)',
        },
        opacity: {
          from: 0,
          to: 1,
        },
      };
      const transition = generateTransitionString(config);
      expect(transition).toContain('transform');
      expect(transition).toContain('opacity');
      expect(transition).toContain(',');
    });

    test('should include delay in transition string', () => {
      const config = {
        duration: 300,
        easing: EASING.EASE_OUT,
        delay: 100,
        transform: {
          from: 'scale(0.9)',
          to: 'scale(1)',
        },
        opacity: {
          from: 0,
          to: 1,
        },
      };
      const transition = generateTransitionString(config);
      expect(transition).toContain('100ms');
    });

    test('should handle zero delay', () => {
      const config = {
        duration: 300,
        easing: EASING.EASE_OUT,
        delay: 0,
        transform: {
          from: 'scale(0.9)',
          to: 'scale(1)',
        },
        opacity: {
          from: 0,
          to: 1,
        },
      };
      const transition = generateTransitionString(config);
      expect(transition).toContain('0ms');
    });
  });

  describe('createReducedMotionConfig', () => {
    test('should remove transforms for reduced motion', () => {
      const original = slideInUp;
      const reduced = createReducedMotionConfig(original);
      
      expect(reduced.transform.from).toBe('none');
      expect(reduced.transform.to).toBe('none');
    });

    test('should preserve opacity transitions', () => {
      const original = fadeIn;
      const reduced = createReducedMotionConfig(original);
      
      expect(reduced.opacity.from).toBe(original.opacity.from);
      expect(reduced.opacity.to).toBe(original.opacity.to);
    });

    test('should reduce duration to FAST or less', () => {
      const original = {
        ...slideInUp,
        duration: 800,
      };
      const reduced = createReducedMotionConfig(original);
      
      expect(reduced.duration).toBeLessThanOrEqual(DURATION.FAST);
    });

    test('should not increase duration if already fast', () => {
      const original = {
        ...fadeIn,
        duration: 100,
      };
      const reduced = createReducedMotionConfig(original);
      
      expect(reduced.duration).toBe(100);
    });

    test('should preserve other config properties', () => {
      const original = {
        ...scaleIn,
        name: 'testAnimation',
        easing: EASING.BOUNCE,
      };
      const reduced = createReducedMotionConfig(original);
      
      expect(reduced.name).toBe('testAnimation');
      expect(reduced.easing).toBe(EASING.BOUNCE);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  describe('Null and undefined handling', () => {
    test('getAnimationPreset should handle null', () => {
      expect(getAnimationPreset(null)).toBeNull();
    });

    test('getAnimationPreset should handle undefined', () => {
      expect(getAnimationPreset(undefined)).toBeNull();
    });

    test('createAnimationConfig should handle null', () => {
      const config = createAnimationConfig(null);
      expect(config).toBeDefined();
      expect(config.name).toBe('custom');
    });

    test('createAnimationConfig should handle undefined', () => {
      const config = createAnimationConfig(undefined);
      expect(config).toBeDefined();
      expect(config.name).toBe('custom');
    });
  });

  describe('Extreme values', () => {
    test('calculateStaggerDelay should handle zero index', () => {
      expect(calculateStaggerDelay(0, 0, 100)).toBe(0);
    });

    test('calculateStaggerDelay should handle very large index', () => {
      const result = calculateStaggerDelay(1000, 0, 50);
      expect(result).toBe(50000);
      expect(typeof result).toBe('number');
    });

    test('createAnimationConfig should handle very large duration', () => {
      const config = createAnimationConfig({ duration: 999999 });
      expect(config.duration).toBe(999999);
    });

    test('createAnimationConfig should handle zero duration', () => {
      const config = createAnimationConfig({ duration: 0 });
      expect(config.duration).toBe(0);
    });
  });

  describe('Invalid inputs', () => {
    test('getAnimationPreset should handle empty string', () => {
      expect(getAnimationPreset('')).toBeNull();
    });

    test('getAnimationPreset should handle non-string input', () => {
      expect(getAnimationPreset(123)).toBeNull();
      expect(getAnimationPreset({})).toBeNull();
      expect(getAnimationPreset([])).toBeNull();
    });

    test('createAnimationConfig should handle partial transform config', () => {
      const config = createAnimationConfig({
        transform: { from: 'scale(0.5)' },
      });
      expect(config.transform.from).toBe('scale(0.5)');
      expect(config.transform.to).toBe('none');
    });

    test('createAnimationConfig should handle partial opacity config', () => {
      const config = createAnimationConfig({
        opacity: { from: 0.5 },
      });
      expect(config.opacity.from).toBe(0.5);
      expect(config.opacity.to).toBe(1);
    });
  });
});

describe('Integration Tests', () => {
  test('should create and use custom animation config', () => {
    const custom = createAnimationConfig({
      name: 'customSlide',
      duration: DURATION.MEDIUM,
      delay: STAGGER_DELAY.SMALL,
      easing: EASING.EASE_OUT_CUBIC,
      transform: {
        from: 'translateX(-100px)',
        to: 'translateX(0)',
      },
      opacity: {
        from: 0,
        to: 1,
      },
    });

    const transition = generateTransitionString(custom);
    
    expect(transition).toContain('transform');
    expect(transition).toContain('opacity');
    expect(transition).toContain('400ms');
    expect(transition).toContain('100ms');
  });

  test('should calculate staggered delays for multiple elements', () => {
    const elements = [0, 1, 2, 3, 4];
    const delays = elements.map(index => 
      calculateStaggerDelay(index, 0, STAGGER_DELAY.SMALL)
    );

    expect(delays).toEqual([0, 100, 200, 300, 400]);
    
    // Verify minimum stagger requirement
    for (let i = 1; i < delays.length; i++) {
      const diff = delays[i] - delays[i - 1];
      expect(diff).toBeGreaterThanOrEqual(MIN_STAGGER_DELAY);
    }
  });

  test('should create reduced motion version of any preset', () => {
    const presets = [fadeIn, slideInUp, scaleIn, bounceIn, rotateIn];
    
    presets.forEach(preset => {
      const reduced = createReducedMotionConfig(preset);
      
      expect(reduced.transform.from).toBe('none');
      expect(reduced.transform.to).toBe('none');
      expect(reduced.duration).toBeLessThanOrEqual(DURATION.FAST);
    });
  });
});
