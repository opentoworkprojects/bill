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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Max 3 retries for retryable errors
    const maxRetries = 3;
    const retryCount = originalRequest?._retryCount || 0;
    
    // Handle timeout errors with exponential backoff
    if ((error.code === 'ECONNABORTED' || error.message?.includes('timeout')) && retryCount < maxRetries) {
      originalRequest._retryCount = retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      originalRequest.timeout = Math.max(originalRequest.timeout || 20000, 25000 + (delay * 2));
      
      try {
        return await apiClient(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    
    // Handle network errors with retries
    if ((error.code === 'ERR_NETWORK' || !error.response) && retryCount < maxRetries) {
      originalRequest._retryCount = retryCount + 1;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        return await apiClient(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast.error('Session expired. Please login again.', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white'
        }
      });
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Helper function for critical operations with custom retry logic
export const apiWithRetry = async (requestConfig, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await apiClient(requestConfig);
      return response;
    } catch (error) {
      lastError = error;
      
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 408) {
        break;
      }
      
      if (attempt === maxRetries + 1) {
        break;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
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