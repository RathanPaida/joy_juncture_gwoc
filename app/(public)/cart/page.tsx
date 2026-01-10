// app/cart/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
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
  Gift
} from 'lucide-react';
import './cart.css';

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

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchCartData();
      } else {
        router.push('/login?redirect=/cart');
      }
    }
  }, [user, authLoading]);

  const fetchCartData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push('/login?redirect=/cart');
        return;
      }

      const token = await currentUser.getIdToken();
      
      const res = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev =>
      prev.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );

    // Update in backend
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const token = await currentUser.getIdToken();
      
      await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, quantity: newQuantity })
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return;

    setCartItems(prev => prev.filter(item => item._id !== itemId));

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const token = await currentUser.getIdToken();
      
      await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId })
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });

      if (res.ok) {
        const data = await res.json();
        setPromoApplied(true);
        setPromoDiscount(data.discount || 10);
      } else {
        alert('Invalid promo code');
      }
    } catch (error) {
      console.error('Error applying promo:', error);
    }
  };

  const calculateSummary = (): CartSummary => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = promoApplied ? (subtotal * promoDiscount) / 100 : 0;
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = (subtotal - discount) * 0.18; // 18% GST
    const total = subtotal - discount + shipping + tax;

    return { subtotal, discount, shipping, tax, total };
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    router.push('/checkout');
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

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-header-content">
          <div className="cart-title-section">
            <ShoppingCart size={40} className="cart-icon" />
            <div>
              <h1>Shopping Cart</h1>
              <p>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
          </div>
          <button className="continue-shopping" onClick={() => router.push('/store')}>
            Continue Shopping
          </button>
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
          <button className="btn-primary" onClick={() => router.push('/store')}>
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
                      <span className="stock-warning">Only {item.maxStock} left in stock!</span>
                    )}
                  </div>

                  <div className="item-actions">
                    <div className="quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.maxStock ? item.quantity >= item.maxStock : false}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="item-total">
                      <span className="total-label">Total</span>
                      <span className="total-price">₹{(item.price * item.quantity).toLocaleString()}</span>
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
                  onClick={applyPromoCode}
                  disabled={promoApplied || !promoCode.trim()}
                >
                  {promoApplied ? 'Applied' : 'Apply'}
                </button>
              </div>
              {promoApplied && (
                <div className="promo-success">
                  <ShieldCheck size={16} />
                  <span>Promo code applied! {promoDiscount}% off</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h2>Order Summary</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{summary.subtotal.toLocaleString()}</span>
                </div>

                {summary.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount ({promoDiscount}%)</span>
                    <span>-₹{summary.discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}</span>
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