import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance with default timeout and retry logic
const apiClient = axios.create({
  timeout: 20000, // 20 second default timeout (increased from 15)
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token and timeout handling
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set shorter timeout for specific endpoints
    if (config.url?.includes('/orders/status') || config.url?.includes('/tables')) {
      config.timeout = 10000; // 10 seconds for status updates (increased from 8)
    }
    
    // Set longer timeout for file uploads or heavy operations
    if (config.url?.includes('/upload') || config.url?.includes('/export')) {
      config.timeout = 45000; // 45 seconds for uploads (increased from 30)
    }
    
    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }
    
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      status: error.response?.status,
      message: error.message,
      code: error.code,
      retryCount: originalRequest?._retryCount || 0
    });
    
    // Max 3 retries for retryable errors
    const maxRetries = 3;
    const retryCount = originalRequest?._retryCount || 0;
    
    // Handle timeout errors with exponential backoff
    if ((error.code === 'ECONNABORTED' || error.message?.includes('timeout')) && retryCount < maxRetries) {
      originalRequest._retryCount = retryCount + 1;
      
      // Exponential backoff: 1s, 2s, 4s (capped at 5s)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      
      console.warn(`⏰ Timeout (attempt ${retryCount + 1}/${maxRetries}) - waiting ${delay}ms before retry...`);
      
      // Only show toast on first timeout
      if (retryCount === 0) {
        toast.error('Request taking longer than expected. Retrying...', {
          duration: 2000,
          style: {
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white'
          }
        });
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase timeout for next attempt
      originalRequest.timeout = Math.max(originalRequest.timeout || 20000, 25000 + (delay * 2));
      
      try {
        console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries})...`);
        return await apiClient(originalRequest);
      } catch (retryError) {
        console.error(`❌ Retry attempt ${retryCount + 1} failed:`, retryError);
        
        // If this was the last retry, show error
        if (retryCount >= maxRetries - 1) {
          toast.error('Request timeout - please check your connection and try again', {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white'
            }
          });
        }
        
        return Promise.reject(retryError);
      }
    }
    
    // Handle network errors with retries
    if ((error.code === 'ERR_NETWORK' || !error.response) && retryCount < maxRetries) {
      originalRequest._retryCount = retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      
      console.warn(`🌐 Network error (attempt ${retryCount + 1}/${maxRetries}) - waiting ${delay}ms...`);
      
      if (retryCount === 0) {
        toast.error('Network unstable - retrying...', {
          duration: 2000,
          style: {
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white'
          }
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        console.log(`🔄 Retrying network request (${retryCount + 1}/${maxRetries})...`);
        return await apiClient(originalRequest);
      } catch (retryError) {
        console.error(`❌ Network retry attempt ${retryCount + 1} failed`);
        
        if (retryCount >= maxRetries - 1) {
          toast.error('Network error - please check your internet connection', {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white'
            }
          });
        }
        
        return Promise.reject(retryError);
      }
    }
    
    // If max retries exceeded, show error
    if (retryCount >= maxRetries && (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ERR_NETWORK' || !error.response)) {
      const errorMsg = error.code === 'ERR_NETWORK' 
        ? 'Network connection failed - please check your internet'
        : 'Request timeout - server not responding';
      
      toast.error(errorMsg, {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white'
        }
      });
      return Promise.reject(error);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('🔐 Authentication error - redirecting to login');
      
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast.error('Session expired. Please login again.', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white'
        }
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      return Promise.reject(error);
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      toast.error('Server error - please try again later', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white'
        }
      });
      return Promise.reject(error);
    }
    
    // Handle other client errors
    if (error.response?.status >= 400) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          `Request failed (${error.response.status})`;
      
      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white'
        }
      });
    }
    
    return Promise.reject(error);
  }
);

// Helper function for critical operations with custom retry logic
export const apiWithRetry = async (requestConfig, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`🔄 API attempt ${attempt}/${maxRetries + 1}: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
      
      const response = await apiClient(requestConfig);
      
      if (attempt > 1) {
        toast.success('Request succeeded after retry!', {
          duration: 2000,
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white'
          }
        });
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 408 (timeout)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 408) {
        break;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries + 1) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Helper function for non-critical operations (fail silently)
export const apiSilent = async (requestConfig) => {
  try {
    return await apiClient(requestConfig);
  } catch (error) {
    console.warn('🔇 Silent API call failed:', error.message);
    return { data: null, error };
  }
};

// Helper function for background operations (no user notifications)
export const apiBackground = async (requestConfig) => {
  try {
    // Create a new axios instance for background requests to avoid interceptor conflicts
    const backgroundClient = axios.create({
      timeout: requestConfig.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...requestConfig.headers
      }
    });
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      backgroundClient.defaults.headers.Authorization = `Bearer ${token}`;
    }
    
    // Simple error handling for background requests
    backgroundClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.warn('🔇 Background API error:', error.message);
        return Promise.reject(error);
      }
    );
    
    const response = await backgroundClient(requestConfig);
    return response;
  } catch (error) {
    console.warn('🔇 Background API call failed:', error.message);
    throw error;
  }
};

export default apiClient;