import { useEffect } from 'react';

/**
 * Google AdSense Component
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
  useEffect(() => {
    try {
      // Push ad to AdSense
      if (window.adsbygoogle && process.env.NODE_ENV === 'production') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Only show ads in production
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 font-medium">AdSense Ad Placeholder</p>
        <p className="text-sm text-gray-400 mt-2">Ads will appear here in production</p>
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
