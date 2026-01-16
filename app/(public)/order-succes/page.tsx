// app/order-success/page.tsx - UPDATED (Cart cleared by backend)
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Home,
  ShoppingBag,
  Sparkles,
  Gift,
} from "lucide-react";
import "./success.css";
import confetti from "canvas-confetti";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderCount = searchParams.get("count") || "1";
  const joyPoints = searchParams.get("points") || "0";

  const [celebrating, setCelebrating] = useState(true);

  useEffect(() => {
    // Cart is already cleared by the backend after payment verification
    // No need to clear it again here
    console.log("✅ Order success page loaded");
    console.log("✅ Cart already cleared by backend during payment verification");
  }, []);

  useEffect(() => {
    // Trigger confetti celebration
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        setCelebrating(false);
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <CheckCircle2 size={80} />
          </div>
          {celebrating && (
            <div className="celebration-sparkles">
              <Sparkles className="sparkle sparkle-1" size={24} />
              <Sparkles className="sparkle sparkle-2" size={20} />
              <Sparkles className="sparkle sparkle-3" size={28} />
            </div>
          )}
        </div>

        <h1>Order Placed Successfully!</h1>
        <p className="success-message">
          Thank you for your purchase. Your{" "}
          {orderCount === "1" ? "order has" : `${orderCount} orders have`} been
          confirmed and will be processed soon.
        </p>

        {orderId && (
          <div className="order-details">
            <div className="order-id">
              <span>Order Reference:</span>
              <strong>{orderId}</strong>
            </div>
            {orderCount !== "1" && (
              <p className="order-note">
                {orderCount} separate orders created for your items
              </p>
            )}
          </div>
        )}

        {/* Joy Points Earned */}
        {parseInt(joyPoints) > 0 && (
          <div className="points-earned">
            <div className="points-icon">
              <Gift size={32} />
            </div>
            <div className="points-content">
              <h3>🎉 Joy Points Earned!</h3>
              <div className="points-amount">+{joyPoints} Points</div>
              <p>Added to your wallet balance</p>
            </div>
          </div>
        )}

        <div className="success-benefits">
          <div className="benefit">
            <Package size={24} />
            <div>
              <h3>Track Your Orders</h3>
              <p>Monitor your order status in real-time</p>
            </div>
          </div>
          <div className="benefit">
            <Gift size={24} />
            <div>
              <h3>Earn More Points</h3>
              <p>Every purchase earns you Joy Points</p>
            </div>
          </div>
        </div>

        <div className="email-notification">
          <p>
            📧 A confirmation email has been sent to your registered email
            address.
          </p>
        </div>

        <div className="success-actions">
          <button
            className="btn-primary"
            onClick={() => router.push("/profile")}
          >
            <ShoppingBag size={20} />
            View My Profile
          </button>
          <button className="btn-secondary" onClick={() => router.push("/")}>
            <Home size={20} />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="success-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}