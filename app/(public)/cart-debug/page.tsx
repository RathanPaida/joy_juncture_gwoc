"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";

export default function CartDebugPage() {
  const [output, setOutput] = useState<string[]>([]);
  const [status, setStatus] = useState<{ message: string; type: string } | null>(null);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const showStatus = (message: string, type: string) => {
    setStatus({ message, type });
  };

  const clearOutput = () => {
    setOutput([]);
    setStatus(null);
  };

  const checkAuth = async () => {
    log("🔍 Checking authentication...");
    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("❌ Not logged in! Please log in first.", "error");
        log("❌ No user found. Please log in to your app first.");
        return;
      }

      const token = await user.getIdToken(true);
      log("✅ Authenticated as: " + user.email);
      log("✅ Token length: " + token.length);
      log("👤 UID: " + user.uid);
      showStatus("✅ Authenticated successfully!", "success");
    } catch (error: any) {
      log("❌ Auth error: " + error.message);
      showStatus("❌ Authentication failed!", "error");
    }
  };

  const debugCart = async () => {
    log("\n========================================");
    log("🔍 DEBUGGING CART STATUS");
    log("========================================");

    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("❌ Not logged in!", "error");
        log("❌ Please log in first");
        return;
      }

      const token = await user.getIdToken(true);
      log("✅ Got token, calling /api/cart/debug...");

      const response = await fetch("/api/cart/debug", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      log("\n📊 Debug Results:");
      log(JSON.stringify(data, null, 2));

      if (data.userCart) {
        log("\n✅ Cart found with " + data.userCart.itemCount + " items");
        showStatus(`✅ Cart exists with ${data.userCart.itemCount} items`, "success");
        
        if (data.userCart.items && data.userCart.items.length > 0) {
          log("\n📦 Cart Items:");
          data.userCart.items.forEach((item: any, index: number) => {
            log(`   ${index + 1}. ${item.productName} - Qty: ${item.quantity} - ₹${item.price}`);
          });
        }
      } else {
        log("\n❌ No cart found for this user");
        showStatus("❌ No cart found", "error");
      }

      log("\n📦 Total carts in database: " + data.totalCartsInDb);
      log("========================================\n");
    } catch (error: any) {
      log("❌ Error: " + error.message);
      showStatus("❌ Debug failed!", "error");
    }
  };

  const clearCart = async () => {
    log("\n========================================");
    log("🧹 CLEARING CART");
    log("========================================");

    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("❌ Not logged in!", "error");
        log("❌ Please log in first");
        return;
      }

      const token = await user.getIdToken(true);
      log("✅ Got token, calling /api/cart/clear...");

      const response = await fetch("/api/cart/clear", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      log("\n📊 Clear Results:");
      log(JSON.stringify(data, null, 2));

      if (data.success && data.cleared) {
        log("\n🎉 CART CLEARED SUCCESSFULLY!");
        log("✅ Items cleared: " + (data.itemsCleared || 0));
        showStatus("🎉 Cart cleared successfully!", "success");
      } else if (data.success && !data.cartFound) {
        log("\n⚠️ Cart was already empty");
        showStatus("⚠️ Cart was already empty", "info");
      } else {
        log("\n❌ Cart clear failed");
        showStatus("❌ Cart clear failed!", "error");
      }

      log("========================================\n");
    } catch (error: any) {
      log("❌ Error: " + error.message);
      showStatus("❌ Clear failed!", "error");
    }
  };

  const checkCartAgain = () => {
    log("\n🔄 Checking cart status again...\n");
    debugCart();
  };

  const getCart = async () => {
    log("\n========================================");
    log("🛒 GETTING CART VIA /api/cart");
    log("========================================");

    try {
      const user = auth.currentUser;
      if (!user) {
        showStatus("❌ Not logged in!", "error");
        log("❌ Please log in first");
        return;
      }

      const token = await user.getIdToken(true);
      log("✅ Got token, calling /api/cart...");

      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      log("\n📊 Cart Response:");
      log(JSON.stringify(data, null, 2));

      if (data.items && data.items.length > 0) {
        log("\n✅ Cart has " + data.items.length + " items");
        showStatus(`✅ Cart has ${data.items.length} items`, "success");
      } else {
        log("\n❌ Cart is empty");
        showStatus("❌ Cart is empty", "info");
      }

      log("========================================\n");
    } catch (error: any) {
      log("❌ Error: " + error.message);
      showStatus("❌ Failed to get cart!", "error");
    }
  };

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: "900px",
      margin: "50px auto",
      padding: "20px",
      background: "#f5f5f5"
    }}>
      <div style={{
        background: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ color: "#333", marginBottom: "20px" }}>🛒 Cart Debug Tool</h1>
        
        <p style={{ color: "#666", marginBottom: "30px" }}>
          Use this tool to debug cart issues. Make sure you're logged in first!
        </p>

        {status && (
          <div style={{
            padding: "15px",
            margin: "15px 0",
            borderRadius: "5px",
            background: status.type === "success" ? "#d4edda" : 
                       status.type === "error" ? "#f8d7da" : "#d1ecf1",
            color: status.type === "success" ? "#155724" : 
                   status.type === "error" ? "#721c24" : "#0c5460",
            border: `1px solid ${status.type === "success" ? "#c3e6cb" : 
                                 status.type === "error" ? "#f5c6cb" : "#bee5eb"}`
          }}>
            {status.message}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <button onClick={checkAuth} style={buttonStyle("#2196F3")}>
            1. Check Authentication
          </button>
          <button onClick={getCart} style={buttonStyle("#9C27B0")}>
            2. Get Cart (Normal)
          </button>
          <button onClick={debugCart} style={buttonStyle("#2196F3")}>
            3. Debug Cart (Detailed)
          </button>
          <button onClick={clearCart} style={buttonStyle("#f44336")}>
            4. Clear Cart
          </button>
          <button onClick={checkCartAgain} style={buttonStyle("#4CAF50")}>
            5. Verify Cleared
          </button>
          <button onClick={clearOutput} style={buttonStyle("#FF9800")}>
            Clear Output
          </button>
        </div>

        <div style={{
          background: "#000",
          color: "#0f0",
          padding: "20px",
          borderRadius: "5px",
          fontFamily: "'Courier New', monospace",
          fontSize: "13px",
          maxHeight: "500px",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word"
        }}>
          {output.length === 0 ? (
            <div style={{ color: "#888" }}>
              👋 Cart Debug Tool Ready!
              <br /><br />
              📝 Instructions:
              <br />1. Make sure you are logged in
              <br />2. Click "Check Authentication" to verify
              <br />3. Click "Get Cart" to see normal cart response
              <br />4. Click "Debug Cart" to see detailed cart info
              <br />5. Click "Clear Cart" to clear it
              <br />6. Click "Verify Cleared" to confirm
              <br /><br />
              ========================================
            </div>
          ) : (
            output.map((line, index) => (
              <div key={index}>{line}</div>
            ))
          )}
        </div>

        <div style={{
          marginTop: "20px",
          padding: "15px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "5px",
          color: "#856404"
        }}>
          <strong>💡 Tips:</strong>
          <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
            <li>First add some items to your cart from the store</li>
            <li>Then use this tool to check if cart exists in database</li>
            <li>Try clearing cart and verify it's actually deleted</li>
            <li>Check the terminal/console for server-side logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function buttonStyle(color: string) {
  return {
    background: color,
    color: "white",
    border: "none",
    padding: "12px 20px",
    fontSize: "14px",
    borderRadius: "5px",
    cursor: "pointer",
    margin: "5px",
    transition: "all 0.3s"
  };
}