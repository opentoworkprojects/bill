import { useElectron } from '../hooks/useElectron';

/**
 * Component to display desktop app info
 * Only visible when running in Electron
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
    <div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white/80 backdrop-blur px-2 py-1 rounded shadow-sm">
      RestoBill Desktop v{getVersion()} • {platformNames[platform] || platform}
    </div>
  );
};

export default DesktopInfo;
