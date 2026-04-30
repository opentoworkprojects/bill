import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const ImageOptimizer = ({
  src,
  alt,
  width,
  height,
  className = '',
  lazyLoad = true,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHZpZXdCb3g9IjAgMCAxIDEiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjwvc3ZnPg==',
  srcSet,
  sizes,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazyLoad);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!lazyLoad) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Disconnect observer after the image is in view
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazyLoad]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    if (onError) onError(e);
  };

  // Generate responsive srcSet if not provided
  const generateSrcSet = () => {
    if (srcSet) return srcSet;
    
    // If no srcSet provided but width is specified, generate responsive sizes
    if (width) {
      const baseUrl = src.split('?')[0];
      const extension = baseUrl.split('.').pop();
      const baseName = baseUrl.replace(`.${extension}`, '');
      
      // Common responsive image widths
      const widths = [320, 480, 768, 1024, 1366, 1600, 1920];
      
      return widths
        .filter(w => w <= width)
        .map(w => `${baseName}-${w}w.${extension} ${w}w`)
        .join(', ');
    }
    
    return undefined;
  };

  // Generate sizes attribute if not provided
  const generateSizes = () => {
    if (sizes) return sizes;
    
    // Default responsive sizes if width is specified
    if (width) {
      return `(max-width: 768px) 100vw, ${width}px`;
    }
    
    return '100vw';
  };

  // Get the image source based on lazy loading and loaded state
  const getImageSource = () => {
    if (!lazyLoad || isInView) return src;
    return placeholder;
  };

  return (
    <div 
      ref={imgRef}
      className={`image-optimizer ${className}`}
      style={{
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
      }}
    >
      <img
        src={getImageSource()}
        alt={alt || ''}
        width={width}
        height={height}
        loading={lazyLoad ? 'lazy' : 'eager'}
        decoding="async"
        srcSet={isInView ? generateSrcSet() : undefined}
        sizes={isInView ? generateSizes() : undefined}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        {...props}
      />
      
      {/* Show placeholder until image is loaded */}
      {!isLoaded && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* You can add a loading spinner or placeholder here */}
        </div>
      )}
    </div>
  );
};

ImageOptimizer.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
  lazyLoad: PropTypes.bool,
  placeholder: PropTypes.string,
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default ImageOptimizer;
