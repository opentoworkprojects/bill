import { useElectron } from '../hooks/useElectron';
import { Mail } from 'lucide-react';

/**
 * Component to display desktop app info at the top
 * Only visible when running in Electron
 * Integrates seamlessly with page layout
 */
const DesktopInfo = () => {
  const { isElectron, platform, getVersion } = useElectron();
  
  if (!isElectron) return null;
  
  const platformNames = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
  };
  
  return (
    <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-1.5 px-4">
      <div className="container mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="font-medium">Support:</span>
            <a href="mailto:support@billbytekot.in" className="hover:underline">
              support@billbytekot.in
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="font-medium">Contact:</span>
            <a href="mailto:contact@billbytekot.in" className="hover:underline">
              contact@billbytekot.in
            </a>
          </div>
        </div>
        <div className="opacity-90">
          BillByteKOT Desktop v{getVersion()} • {platformNames[platform] || platform}
        </div>
      </div>
    </div>
  );
};

export default DesktopInfo;
