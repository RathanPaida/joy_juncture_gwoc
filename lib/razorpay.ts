// export const loadRazorpay = (): Promise<boolean> => {
//     return new Promise((resolve) => {
//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.onload = () => {
//         resolve(true);
//       };
//       script.onerror = () => {
//         resolve(false);
//       };
//       document.body.appendChild(script);
//     });
//   };
  
//   export const initializeRazorpay = () => {
//     if (typeof window !== 'undefined' && !(window as any).Razorpay) {
//       return loadRazorpay();
//     }
//     return Promise.resolve(true);
//   };

export const loadRazorpay = async () => {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    
    document.body.appendChild(script);
  });
};