// lib/razorpay.ts or utils/razorpay.ts

/**
 * Loads the Razorpay checkout script dynamically
 * @returns Promise that resolves to true if loaded successfully, false otherwise
 */
export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ Razorpay SDK loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Razorpay SDK');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Initializes Razorpay by loading the script if not already present
 * @returns Promise that resolves to true if initialized successfully
 */
export const initializeRazorpay = async (): Promise<boolean> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('⚠️ Razorpay can only be initialized in browser environment');
    return false;
  }

  // Check if already loaded
  if ((window as any).Razorpay) {
    return true;
  }

  // Load the script
  return loadRazorpay();
};

/**
 * Type definition for Razorpay options
 */
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

/**
 * Type definition for Razorpay payment response
 */
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Opens Razorpay checkout with the provided options
 * @param options - Razorpay checkout options
 * @returns Promise that resolves when checkout is opened
 */
export const openRazorpayCheckout = async (
  options: RazorpayOptions
): Promise<void> => {
  const isLoaded = await initializeRazorpay();

  if (!isLoaded) {
    throw new Error('Failed to load Razorpay SDK');
  }

  const razorpay = new (window as any).Razorpay(options);
  razorpay.open();
};

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}