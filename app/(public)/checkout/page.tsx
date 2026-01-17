// app/checkout/page.tsx - FIXED CART CLEARING
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase"; // Import Firebase auth directly
import {
  CreditCard,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Building,
  ArrowLeft,
  ShieldCheck,
  Lock,
  CheckCircle2,
} from "lucide-react";
import "./checkout.css";

interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  const searchParams = useSearchParams();
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchCartData();
        loadRazorpayScript();
      } else {
        router.push("/login?redirect=/checkout");
      }
    }
  }, [user, authLoading]);

  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Validate promo code from URL
  useEffect(() => {
    const code = searchParams.get('promo');
    if (code && !isPromoApplied) {
      validatePromo(code);
    }
  }, [searchParams]);

  // Pincode Auto-fill Effect
  useEffect(() => {
    const fetchPincodeDetails = async () => {
      const pin = shippingAddress.pincode;

      // Only fetch if 6 digits
      if (!pin || pin.length !== 6) return;

      setIsPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await response.json();

        if (data && data[0].Status === "Success") {
          const details = data[0].PostOffice[0];
          setShippingAddress(prev => ({
            ...prev,
            city: details.District,
            state: details.State,
            country: details.Country || "India"
          }));
          setErrors(prev => ({ ...prev, pincode: undefined, city: undefined, state: undefined }));
        } else {
          setErrors(prev => ({ ...prev, pincode: "Invalid Pincode" }));
          // Optional: Clear fields if invalid
          setShippingAddress(prev => ({ ...prev, city: "", state: "" }));
        }
      } catch (error) {
        console.error("Error fetching pincode:", error);
      } finally {
        setIsPincodeLoading(false);
      }
    };

    // Debounce slightly or just call
    const timer = setTimeout(fetchPincodeDetails, 500);
    return () => clearTimeout(timer);
  }, [shippingAddress.pincode]);

  const validatePromo = async (code: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const data = await res.json();
        setPromoCode(code);

        // Calculate potential discount based on cart items
        // Note: Actual calculation happens in calculateTotals based on these state values
        // We just need to determine the value here to set state

        let discount = 0;
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (data.type === 'percentage') {
          // For percentage, store the % value or calculate absolute immediately?
          // Let's store absolute amount for simplicity in calculateTotals
          discount = (subtotal * data.discount) / 100;
        } else {
          discount = data.discount;
        }

        if (discount > subtotal) discount = subtotal;

        setDiscountAmount(discount);
        setIsPromoApplied(true);
        console.log("✅ Promo applied:", code, "Discount:", discount);
      }
    } catch (error) {
      console.error("Error validating promo:", error);
    }
  };

  const loadRazorpayScript = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  // Helper function to get fresh token
  const getFreshToken = async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("❌ No current user");
        return null;
      }

      // Force refresh to get a fresh token
      const token = await currentUser.getIdToken(true);
      console.log("✅ Got fresh token, length:", token.length);
      return token;
    } catch (error) {
      console.error("❌ Error getting token:", error);
      return null;
    }
  };

  const fetchCartData = async () => {
    try {
      if (!user) {
        router.push("/login?redirect=/checkout");
        return;
      }

      const token = await getFreshToken();
      if (!token) {
        router.push("/login?redirect=/checkout");
        return;
      }

      const res = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          router.push("/cart");
          return;
        }
        setCartItems(data.items || []);

        if (user.displayName) {
          setShippingAddress((prev) => ({
            ...prev,
            fullName: user.displayName || "",
          }));
        }
        if (user.email) {
          setShippingAddress((prev) => ({
            ...prev,
            email: user.email || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shipping = subtotal > 500 ? 0 : 50;

    // Apply discount BEFORE tax? Depends on local laws. Usually Tax is on discounted price.
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const tax = taxableAmount * 0.18;
    const total = taxableAmount + shipping + tax;

    return { subtotal, shipping, tax, total, discount: discountAmount };
  };

  const validateAddress = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};

    if (!shippingAddress.fullName.trim())
      newErrors.fullName = "Name is required";
    if (!shippingAddress.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(shippingAddress.email))
      newErrors.email = "Invalid email";
    if (!shippingAddress.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(shippingAddress.phone))
      newErrors.phone = "Invalid phone number";
    if (!shippingAddress.address.trim())
      newErrors.address = "Address is required";
    if (!shippingAddress.city.trim()) newErrors.city = "City is required";
    if (!shippingAddress.state.trim()) newErrors.state = "State is required";
    if (!shippingAddress.pincode.trim())
      newErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(shippingAddress.pincode))
      newErrors.pincode = "Invalid pincode";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateAddress()) {
      setStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "razorpay") {
      await initiateRazorpayPayment();
    } else if (paymentMethod === "cod") {
      await placeOrderCOD();
    }
  };

  const initiateRazorpayPayment = async () => {
    setProcessing(true);
    try {
      if (!user) return;

      const token = await getFreshToken();
      if (!token) {
        alert("Please login again");
        return;
      }

      const { total } = calculateTotals();

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: total,
          cartItems,
          shippingAddress,
          promoCode: isPromoApplied ? promoCode : null,
          discountAmount: isPromoApplied ? discountAmount : 0
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const order = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Your Store Name",
        description: "Order Payment",
        order_id: order.id,
        handler: async (response: any) => {
          await verifyPayment(response, order);
        },
        prefill: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        notes: {
          address: shippingAddress.address,
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      alert(error.message || "Failed to initiate payment. Please try again.");
      setProcessing(false);
    }
  };

  const verifyPayment = async (paymentResponse: any, order: any) => {
    try {
      if (!user) return;

      const token = await getFreshToken();
      if (!token) {
        alert("Authentication failed. Please login again.");
        return;
      }

      console.log("🔍 Verifying payment...");

      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          type: "product", // Specify product payment type
        }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        console.log("✅ Payment verified:", data);
        console.log("✅ Cart cleared by server:", data.cartCleared);

        // Redirect to success page with order info
        const orderIds = data.orderIds?.join(',') || '';
        const joyPoints = data.joyPointsEarned || 0;
        const count = data.ordersUpdated || 1;

        router.push(`/order-succes`);
      } else {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      alert(
        error.message || "Payment verification failed. Please contact support.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const placeOrderCOD = async () => {
    setProcessing(true);
    try {
      if (!user) return;

      const token = await getFreshToken();
      if (!token) {
        alert("Authentication failed. Please login again.");
        return;
      }

      const totals = calculateTotals();

      console.log("📦 Placing COD order...");

      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems,
          shippingAddress,
          paymentMethod: "cod",
          total: totals.total,
          promoCode: isPromoApplied ? promoCode : null,
          discountAmount: isPromoApplied ? discountAmount : 0
        }),
      });

      if (orderRes.ok) {
        const data = await orderRes.json();
        console.log("✅ Order created:", data);
        console.log("✅ Cart cleared by server:", data.cartCleared);

        // Redirect to success page with order info
        const orderIds = data.orderIds?.join(',') || '';
        const joyPoints = data.joyPointsEarned || 0;
        const count = data.ordersCreated || 1;

        router.push(`/order-succes`);
      } else {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Order creation failed:", error);
      alert(error.message || "Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="checkout-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  const { subtotal, shipping, tax, total } = calculateTotals();

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-button" onClick={() => router.push("/cart")}>
          <ArrowLeft size={20} />
          Back to Cart
        </button>
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span>Shipping</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-main">
          {step === 1 ? (
            <div className="checkout-section">
              <div className="section-header">
                <MapPin size={24} />
                <h2>Shipping Address</h2>
              </div>

              <div className="form-grid">
                {/* Pincode Section - Moved to Top for Auto-fill */}
                <div className="form-group full-width" style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
                  <label style={{ color: '#ff6b00', fontWeight: 'bold' }}>
                    <MapPin size={18} />
                    Enter Pincode First *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={shippingAddress.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setShippingAddress({
                          ...shippingAddress,
                          pincode: val,
                        })
                      }}
                      placeholder="Enter 6-digit Pincode to auto-fill details"
                      maxLength={6}
                      className={errors.pincode ? "error" : ""}
                      style={{ fontSize: '1.1rem', letterSpacing: '2px' }}
                      autoFocus
                    />
                    {isPincodeLoading && (
                      <div className="spinner-small" style={{ position: 'absolute', right: '10px', top: '12px' }}></div>
                    )}
                  </div>
                  {errors.pincode && (
                    <span className="error-text">{errors.pincode}</span>
                  )}
                  {shippingAddress.city && (
                    <p style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
                      ✓ {shippingAddress.city}, {shippingAddress.state}, {shippingAddress.country}
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>
                    <User size={18} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Enter your full name"
                    className={errors.fullName ? "error" : ""}
                  />
                  {errors.fullName && (
                    <span className="error-text">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={18} />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        email: e.target.value,
                      })
                    }
                    placeholder="your@email.com"
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={18} />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        phone: e.target.value,
                      })
                    }
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={errors.phone ? "error" : ""}
                  />
                  {errors.phone && (
                    <span className="error-text">{errors.phone}</span>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>
                    <Home size={18} />
                    Address *
                  </label>
                  <textarea
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        address: e.target.value,
                      })
                    }
                    placeholder="House No, Building Name, Street, Area"
                    rows={3}
                    className={errors.address ? "error" : ""}
                  />
                  {errors.address && (
                    <span className="error-text">{errors.address}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Building size={18} />
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value,
                      })
                    }
                    placeholder="Auto-filled from Pincode"
                    className={errors.city ? "error" : ""}
                    readOnly
                    style={{ backgroundColor: '#222', cursor: 'not-allowed' }}
                  />
                  {errors.city && (
                    <span className="error-text">{errors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        state: e.target.value,
                      })
                    }
                    placeholder="Auto-filled from Pincode"
                    className={errors.state ? "error" : ""}
                    readOnly
                    style={{ backgroundColor: '#222', cursor: 'not-allowed' }}
                  />
                  {errors.state && (
                    <span className="error-text">{errors.state}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    value={shippingAddress.country}
                    readOnly
                    style={{ backgroundColor: '#222', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <button
                className="continue-btn"
                onClick={handleContinueToPayment}
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="checkout-section">
              <div className="section-header">
                <CreditCard size={24} />
                <h2>Payment Method</h2>
              </div>

              <div className="payment-methods">
                <label
                  className={`payment-option ${paymentMethod === "razorpay" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <CreditCard size={24} />
                    <div>
                      <h3>Credit/Debit Card, UPI, Wallet</h3>
                      <p>Pay securely via Razorpay</p>
                    </div>
                  </div>
                  <CheckCircle2 className="check-icon" size={24} />
                </label>

                <label
                  className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <Truck size={24} />
                    <div>
                      <h3>Cash on Delivery</h3>
                      <p>Pay when you receive your order</p>
                    </div>
                  </div>
                  <CheckCircle2 className="check-icon" size={24} />
                </label>
              </div>

              <div className="secure-payment">
                <Lock size={18} />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <div className="checkout-actions">
                <button className="back-to-shipping" onClick={() => setStep(1)}>
                  Back to Shipping
                </button>
                <button
                  className="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <div className="spinner-small"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={20} />
                      Place Order - ₹{total.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="checkout-sidebar">
          <div className="summary-card">
            <h3>Order Summary</h3>

            <div className="cart-items-summary">
              {cartItems.map((item) => (
                <div key={item._id} className="summary-item">
                  <img src={item.productImage} alt={item.productName} />
                  <div className="summary-item-details">
                    <p>{item.productName}</p>
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <span className="summary-item-price">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row" style={{ color: '#22c55e' }}>
                  <span>Discount</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
              </div>

              <div className="summary-row">
                <span>Tax (18% GST)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="trust-badges">
            <div className="trust-badge">
              <ShieldCheck size={20} />
              <span>Secure Checkout</span>
            </div>
            <div className="trust-badge">
              <Truck size={20} />
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}