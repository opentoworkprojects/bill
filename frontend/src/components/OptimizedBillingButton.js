/**
 * Optimized Billing Button with Instant Data Pre-loading
 * Eliminates 2-3 second delay by pre-loading billing data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2 } from 'lucide-react';
import { billingCache } from '../utils/billingCache';
import { toast } from 'sonner';

const OptimizedBillingButton = ({ order, user, className = "" }) => {
  const navigate = useNavigate();
  const [isPreloading, setIsPreloading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Check if user has billing permissions
  const canBill = ['admin', 'cashier'].includes(user?.role);
  const canShowButton = canBill && ['ready', 'preparing', 'pending'].includes(order.status);

  useEffect(() => {
    // Pre-load billing data when component mounts (order is visible)
    if (canShowButton && order?.id) {
      const preloadData = async () => {
        try {
          // Check if already cached
          const cached = billingCache.getCachedBillingData(order.id);
          if (cached) {
            setIsPreloaded(true);
            return;
          }

          // Pre-load in background
          setIsPreloading(true);
          await billingCache.preloadBillingData(order.id);
          setIsPreloaded(true);
        } catch (error) {
          console.warn('Failed to preload billing data:', error);
        } finally {
          setIsPreloading(false);
        }
      };

      // Delay preload slightly to avoid blocking initial render
      const timer = setTimeout(preloadData, 100);
      return () => clearTimeout(timer);
    }
  }, [order?.id, canShowButton]);

  const handleBillAndPay = async () => {
    if (!order?.id) return;

    try {
      // Check if data is already cached
      const cached = billingCache.getCachedBillingData(order.id);
      
      if (cached) {
        // Data is ready - navigate immediately
        console.log('⚡ Billing data ready - navigating instantly');
        navigate(`/billing/${order.id}`);
      } else {
        // Data not ready - show loading and fetch
        console.log('🔄 Billing data not ready - fetching...');
        setIsPreloading(true);
        
        // Start navigation immediately (optimistic)
        navigate(`/billing/${order.id}`);
        
        // Pre-load data for next time
        billingCache.preloadBillingData(order.id).catch(error => {
          console.warn('Background preload failed:', error);
        });
      }
    } catch (error) {
      console.error('Billing navigation error:', error);
      toast.error('Failed to open billing page');
    } finally {
      setIsPreloading(false);
    }
  };

  if (!canShowButton) {
    return null;
  }

  return (
    <button 
      onClick={handleBillAndPay}
      disabled={isPreloading}
      className={`flex-1 h-10 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all duration-200 ${className}`}
    >
      {isPreloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Bill & Pay
          {isPreloaded && (
            <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Data preloaded - instant billing!" />
          )}
        </>
      )}
    </button>
  );
};

export default OptimizedBillingButton;