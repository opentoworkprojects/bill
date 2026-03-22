import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ADSENSE_CLIENT = 'ca-pub-3519568544880293';
const ADSENSE_SCRIPT_ID = 'google-adsense-script';

function loadAdSenseScript() {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return; // already loaded
  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
}

const AdSense = ({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = ''
}) => {
  const location = useLocation();
  const isBlogPage = location.pathname.startsWith('/blog');

  useEffect(() => {
    if (!isBlogPage || process.env.NODE_ENV !== 'production') return;

    // Lazy-load the AdSense script only when a blog page mounts an ad
    loadAdSenseScript();

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore
    }
  }, [isBlogPage]);

  if (!isBlogPage) return null;

  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500 font-medium">Ad placeholder (blog only)</p>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
};

export default AdSense;
