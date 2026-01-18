"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  CreditCard,
  Truck,
  ShieldCheck,
  Tag,
  Gift,
} from "lucide-react";
import "./cart.css";
import DeliveryChecker from "@/app/components/DeliveryChecker";

interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  maxStock?: number;
}

interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoType, setPromoType] = useState<"fixed" | "percentage">("fixed");
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]); // For compatibility with older logic

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchCartData();
        fetchWalletAndRewards();
      } else {
        router.push("/login?redirect=/cart");
      }
    }
  }, [user, authLoading]);

  const fetchWalletAndRewards = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Fetch Wallet (Coupons)
      const walletRes = await fetch("/api/user/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const data = await walletRes.json();
        console.log("💰 Wallet Data:", data);
        setUserCoupons(data.wallet.coupons || []);
        setUserPoints(data.wallet.points || 0);
      }

      // Fetch Rewards
      const rewardsRes = await fetch("/api/wallet/rewards");
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setAvailableRewards(data.rewards || []);
      }

      // Fetch Profile Coupons (Legacy/Redeemed check)
      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        // Merge or use these if needed. Currently userCoupons from wallet is primary.
        const redeemed = pData.profile.redeemedCoupons?.filter((c: any) => c.status === 'available') || [];
        setAvailableCoupons(redeemed);
      }

    } catch (error) {
      console.error("Error fetching wallet/rewards:", error);
    }
  };

  const fetchCartData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login?redirect=/cart");
        return;
      }

      const token = await currentUser.getIdToken();

      const res = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );

    // Update in backend
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm("Remove this item from cart?")) return;

    setCartItems((prev) => prev.filter((item) => item._id !== itemId));

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();

      await fetch("/api/cart/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const applyPromoCode = async (codeOverride?: string) => {
    const codeToApply = codeOverride || promoCode;
    if (!codeToApply?.trim()) return;

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : '';
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Validate Promo
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: codeToApply, amount: subtotal }),
      });

      if (res.ok) {
        const data = await res.json();
        setPromoApplied(true);
        if (codeOverride) setPromoCode(codeOverride);

        // Handle Discount Logic
        // API returns:
        // discount: The calculated amount to deduct (based on subtotal sent)
        // discountValue: The raw value (e.g. 25 for 25%, or 100 for ₹100)
        // type: 'percentage' | 'fixed'

        // We should store the RATE/VALUE for recalculation if cart changes?
        // Or simply use the calculated amount? 
        // Current logic recalculates in calculateSummary(). 
        // So we need the RATE/VALUE.

        if (data.type === 'percentage') {
          setPromoType('percentage');
          setPromoDiscount(data.discountValue || 0); // Store RATE (25)
        } else {
          setPromoType('fixed');
          setPromoDiscount(data.discountValue || 0); // Store Fixed Amount (100)
        }

        // Also we might want to store maxDiscount if available?
        // For now, let's assume the basic calculation works.

      } else {
        const err = await res.json();
        alert(err.error || "Invalid promo code");
      }
    } catch (error) {
      console.error("Error applying promo:", error);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!confirm("Redeem this reward using your points?")) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rewardId })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Redeemed! Code: ${data.couponCode}`);
        fetchWalletAndRewards(); // Refresh to show new coupon
      } else {
        alert(data.error || "Failed to redeem");
      }
    } catch (err) {
      console.error("Redeem error:", err);
    }
  };

  const [calculatedShipping, setCalculatedShipping] = useState<number | null>(null);

  const calculateSummary = (): CartSummary => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let discount = 0;
    if (promoApplied) {
      if (promoType === "percentage") {
        discount = (subtotal * promoDiscount) / 100;
      } else {
        discount = promoDiscount;
      }
      // Ensure discount doesn't exceed subtotal
      if (discount > subtotal) discount = subtotal;
    }

    // Shipping Logic: 
    // If calculatedShipping (from Pincode) is available, use it.
    // Otherwise fallback to default logic: 
    // Free if > 500, else 50.
    let shipping = 0;
    if (calculatedShipping !== null) {
      shipping = calculatedShipping;
    } else {
      shipping = subtotal > 500 ? 0 : 50;
    }

    const tax = (subtotal - discount) * 0.18; // 18% GST
    const total = subtotal - discount + shipping + tax;

    return { subtotal, discount, shipping, tax, total };
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    const queryParams = new URLSearchParams();
    if (promoApplied && promoCode) {
      queryParams.set('promo', promoCode);
    }
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (authLoading || loading) {
    return (
      <div className="cart-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  const summary = calculateSummary();

  const handleDeliveryCalculated = (fee: number | null, isFree: boolean) => {
    setCalculatedShipping(isFree ? 0 : fee);
  };

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-content">
          <div className="cart-title-section">
            <ShoppingCart size={40} className="cart-icon" />
            <div>
              <h1>Shopping Cart</h1>
              <p>
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}{" "}
                in your cart
              </p>
            </div>
          </div>
          <button
            className="continue-shopping"
            onClick={() => router.push("/store")}
          >
            Continue Shopping
          </button>
        </div>
        {/* Wallet Balance Header */}
        <div className="bg-[#111] border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3 mt-4 md:mt-0">
          <div className="text-right">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Your Balance</p>
            <p className="text-orange-500 font-bold">{userPoints.toLocaleString()} pts</p>
          </div>
          <Gift className="text-orange-500" size={20} />
        </div>
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingCart size={80} />
          </div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added anything to your cart yet</p>
          <button className="btn-primary" onClick={() => router.push("/store")}>
            Start Shopping
          </button>
        </div>
      ) : (
        /* Cart Content */
        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items-section">
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="item-image">
                    <img src={item.productImage} alt={item.productName} />
                  </div>

                  <div className="item-details">
                    <h3>{item.productName}</h3>
                    <p className="item-price">₹{item.price.toLocaleString()}</p>
                    {item.maxStock && item.maxStock <= 5 && (
                      <span className="stock-warning">
                        Only {item.maxStock} left in stock!
                      </span>
                    )}
                  </div>

                  <div className="item-actions">
                    <div className="quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                        disabled={
                          item.maxStock ? item.quantity >= item.maxStock : false
                        }
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="item-total">
                      <span className="total-label">Total</span>
                      <span className="total-price">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item._id)}
                      title="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="promo-section">
              <div className="promo-header">
                <Tag size={20} />
                <span>Have a promo code?</span>
              </div>
              <div className="promo-input-group">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={promoApplied}
                />
                <button
                  className="apply-promo-btn"
                  onClick={() => applyPromoCode()}
                  disabled={promoApplied || !promoCode.trim()}
                >
                  {promoApplied ? "Applied" : "Apply"}
                </button>
              </div>
              {promoApplied && (
                <div className="promo-success">
                  <ShieldCheck size={16} />
                  <span>
                    Discount applied: {promoType === "percentage" ? `${promoDiscount}%` : `₹${promoDiscount}`} off
                  </span>
                </div>
              )}

              {/* Existing Coupons List */}
              {userCoupons.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-orange-500">✨ Your Exclusive Coupons:</p>
                  </div>
                  <div className="grid gap-2">
                    {userCoupons.map((coupon, idx) => (
                      <div key={idx} className="bg-zinc-900 border border-white/5 p-3 rounded flex justify-between items-center hover:border-orange-500/30 transition-colors">
                        <div>
                          <p className="font-bold text-white text-sm">{coupon.code}</p>
                          <p className="text-xs text-zinc-400">
                            {coupon.name}
                          </p>
                          <span className="text-[10px] text-green-400">
                            {coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPromoCode(coupon.code);
                            applyPromoCode(coupon.code);
                          }}
                          disabled={promoApplied && promoCode === coupon.code}
                          className={`text-xs px-3 py-1.5 rounded font-bold transition-colors ${promoApplied && promoCode === coupon.code ? 'bg-green-500 text-black cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}
                        >
                          {promoApplied && promoCode === coupon.code ? "Applied" : "Apply"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Rewards Redemption Section Removed as per user request to focus on Exclusive Coupons */}

          </div>

          {/* Order Summary Sidebar */}
          <div className="cart-summary-section">

            {/* Delivery Checker Component */}
            <DeliveryChecker onDeliveryCalculated={handleDeliveryCalculated} />

            <div className="summary-card">
              <h2>Order Summary</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{summary.subtotal.toLocaleString()}</span>
                </div>

                {summary.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-₹{summary.discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Shipping</span>
                  <span>
                    {summary.shipping === 0 ? "FREE" : `₹${summary.shipping}`}
                  </span>
                </div>

                <div className="summary-row">
                  <span>Tax (18% GST)</span>
                  <span>₹{summary.tax.toLocaleString()}</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{summary.total.toLocaleString()}</span>
                </div>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              {/* Benefits */}
              <div className="cart-benefits">
                <div className="benefit-item">
                  <Truck size={18} />
                  <span>Free shipping on orders over ₹500</span>
                </div>
                <div className="benefit-item">
                  <ShieldCheck size={18} />
                  <span>Secure checkout</span>
                </div>
                <div className="benefit-item">
                  <Package size={18} />
                  <span>Easy returns within 7 days</span>
                </div>
                <div className="benefit-item">
                  <Gift size={18} />
                  <span>Earn Joy Points on every purchase</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="payment-methods">
              <h3>We Accept</h3>
              <div className="payment-icons">
                <div className="payment-icon">
                  <CreditCard size={24} />
                  <span>Cards</span>
                </div>
                <div className="payment-icon">UPI</div>
                <div className="payment-icon">Wallet</div>
                <div className="payment-icon">COD</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
