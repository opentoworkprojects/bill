const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build files for Chrome compatibility...');

// Read the built index.html
const indexPath = path.join(__dirname, '../build/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add Chrome-specific fixes
const chromeFixedContent = `<!doctype html>
<html lang="en-IN" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover,user-scalable=yes"/>
    <meta name="theme-color" content="#7c3aed"/>
    
    <!-- Chrome-specific fixes -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    
    <!-- Chrome DevTools Console Debug -->
    <script>
        console.log('🔧 Chrome Fix Applied - BillByteKOT Loading...');
        console.log('📍 URL:', window.location.href);
        console.log('🌐 User Agent:', navigator.userAgent);
        
        // Chrome-specific resource loading fix
        window.chromeResourceFix = function() {
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            if (isChrome) {
                console.log('🔍 Chrome detected - applying fixes...');
                
                // Force reload resources if they fail
                window.addEventListener('error', function(e) {
                    if (e.target.tagName === 'SCRIPT' && e.target.src) {
                        console.warn('🔄 Script failed, retrying:', e.target.src);
                        setTimeout(() => {
                            const newScript = document.createElement('script');
                            newScript.src = e.target.src + '?t=' + Date.now();
                            newScript.defer = true;
                            document.head.appendChild(newScript);
                        }, 1000);
                    }
                }, true);
            }
        };
        
        window.chromeResourceFix();
    </script>
    
    <!-- Extract and preserve existing head content -->
    ${indexContent.match(/<head[^>]*>(.*?)<\/head>/s)?.[1]?.replace(/<script[^>]*>.*?<\/script>/gs, '').replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '') || ''}
    
    <!-- Loading indicator styles -->
    <style>
        .loading-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .loading-subtext {
            font-size: 14px;
            opacity: 0.8;
            text-align: center;
            max-width: 300px;
        }
        
        .error-container {
            background: #dc2626;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            max-width: 400px;
            text-align: center;
        }
        
        .retry-button {
            background: white;
            color: #dc2626;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .chrome-warning {
            background: #fbbf24;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <noscript>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>JavaScript Required</h1>
            <p>You need to enable JavaScript to run BillByteKOT.</p>
            <p>Please enable JavaScript in your browser settings and refresh the page.</p>
        </div>
    </noscript>
    
    <!-- Loading Screen -->
    <div id="loading-screen" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading BillByteKOT...</div>
        <div class="loading-subtext">Restaurant Billing & KOT Management System</div>
        <div id="chrome-warning" class="chrome-warning" style="display: none;">
            <strong>Chrome Browser Detected</strong><br>
            If you see a white screen, try:<br>
            • Hard refresh (Ctrl+Shift+R)<br>
            • Clear cache and cookies<br>
            • Disable extensions temporarily
        </div>
        <div id="error-message" class="error-container" style="display: none;">
            <div>⚠️ Loading Error</div>
            <div style="font-size: 12px; margin-top: 10px;">
                Failed to load application resources. This appears to be a Chrome-specific issue.
            </div>
            <button class="retry-button" onclick="window.location.reload(true)">Hard Refresh</button>
            <button class="retry-button" onclick="clearChromeCache()">Clear Cache & Retry</button>
        </div>
    </div>
    
    <!-- React App Root -->
    <div id="root"></div>
    
    <!-- Chrome-specific Resource Loading Script -->
    <script>
        console.log('🔧 Chrome-specific fixes loading...');
        
        // Detect Chrome
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        if (isChrome) {
            console.log('🌐 Chrome browser detected - applying Chrome-specific fixes');
            document.getElementById('chrome-warning').style.display = 'block';
        }
        
        let loadedResources = 0;
        const totalResources = 2; // 2 JS files
        let loadTimeout;
        let retryCount = 0;
        const maxRetries = 3;
        
        function hideLoadingScreen() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }
        
        function showError() {
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
        }
        
        function clearChromeCache() {
            console.log('🧹 Clearing Chrome cache...');
            
            // Clear service worker cache
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                        console.log('🗑️ Deleted cache:', name);
                    });
                });
            }
            
            // Clear localStorage
            try {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🗑️ Cleared storage');
            } catch (e) {
                console.warn('Could not clear storage:', e);
            }
            
            // Force reload from server
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }
        
        function onResourceLoad() {
            loadedResources++;
            console.log(\`✅ Resource loaded (\${loadedResources}/\${totalResources})\`);
            
            if (loadedResources >= totalResources) {
                clearTimeout(loadTimeout);
                setTimeout(hideLoadingScreen, 1000);
            }
        }
        
        function onResourceError(resource) {
            console.error('❌ Failed to load:', resource);
            
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(\`🔄 Retrying (\${retryCount}/\${maxRetries})...\`);
                
                // Retry with cache-busting
                setTimeout(() => {
                    const script = document.createElement('script');
                    script.src = resource + '?v=' + Date.now() + '&retry=' + retryCount;
                    script.defer = true;
                    script.crossOrigin = 'anonymous';
                    script.onload = onResourceLoad;
                    script.onerror = () => onResourceError(resource);
                    document.head.appendChild(script);
                }, 1000 * retryCount);
            } else {
                clearTimeout(loadTimeout);
                showError();
            }
        }
        
        // Set timeout for loading
        loadTimeout = setTimeout(() => {
            console.warn('⏰ Loading timeout - showing error');
            showError();
        }, 20000); // 20 second timeout for Chrome
        
        // Hide loading screen when React renders
        const observer = new MutationObserver((mutations) => {
            const root = document.getElementById('root');
            if (root && root.children.length > 0) {
                console.log('✅ React app rendered');
                clearTimeout(loadTimeout);
                hideLoadingScreen();
                observer.disconnect();
            }
        });
        
        observer.observe(document.getElementById('root'), {
            childList: true,
            subtree: true
        });
        
        // Chrome-specific error handling
        window.addEventListener('error', function(e) {
            console.error('🚨 Global error:', e);
            if (e.filename && e.filename.includes('static/js/')) {
                console.error('❌ JavaScript loading error in Chrome');
                if (isChrome) {
                    showError();
                }
            }
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', function(e) {
            console.error('🚨 Unhandled promise rejection:', e.reason);
        });
    </script>
    
    ${indexContent.match(/<script[^>]*src="[^"]*static\/css\/[^"]*"[^>]*>/g)?.[0]?.replace('src="/', 'href="./').replace('<script', '<link rel="stylesheet"').replace('></script>', ' crossorigin="anonymous">') || ''}
    ${indexContent.match(/<script[^>]*src="[^"]*static\/js\/[^"]*"[^>]*>/g)?.map(script => 
        script.replace('src="/', 'src="./')
              .replace('<script', '<script crossorigin="anonymous" onload="onResourceLoad()" onerror="onResourceError(this.src)"')
    ).join('\n    ') || ''}
    
    ${indexContent.match(/<script[^>]*src="https:\/\/[^"]*"[^>]*>.*?<\/script>/gs)?.join('\n    ') || ''}
</body>
</html>`;

// Write the fixed content
fs.writeFileSync(indexPath, chromeFixedContent);

console.log('✅ Build files fixed for Chrome compatibility!');
console.log('📁 Updated: build/index.html');