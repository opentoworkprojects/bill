import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Google AdSense Component
 * 
 * IMPORTANT: This component should ONLY be used on blog pages
 * Do NOT use on landing pages, app pages, or dashboard
 * 
 * Usage:
 * <AdSense 
 *   slot="1234567890"
 *   format="auto"
 *   responsive="true"
 * />
 */
const AdSense = ({ 
  slot, 
  format = 'auto', 
  responsive = 'true',
  style = { display: 'block' },
  className = ''
}) => {
  const location = useLocation();
  
  // SAFETY CHECK: Only allow ads on blog pages
  const isBlogPage = location.pathname.startsWith('/blog');
  
  useEffect(() => {
    // Only load ads on blog pages in production
    if (!isBlogPage) {
      console.warn('AdSense component should only be used on blog pages');
      return;
    }
    
    try {
      // Push ad to AdSense
      if (window.adsbygoogle && process.env.NODE_ENV === 'production') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [isBlogPage]);

  // SAFETY CHECK: Don't render if not on blog page
  if (!isBlogPage) {
    console.warn('AdSense blocked: Not on a blog page');
    return null;
  }

  // Only show ads in production
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 font-medium">AdSense Ad Placeholder (Blog Only)</p>
        <p className="text-sm text-gray-400 mt-2">Ads will appear here in production on blog pages</p>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-3519568544880293"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    ></ins>
  );
};

export default AdSense;
