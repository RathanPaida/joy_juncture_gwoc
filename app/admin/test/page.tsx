"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext"; // Use your existing auth

export default function AdminTestPage() {
  const { user } = useAuth(); // Get user from context
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()} - ${message}`,
    ]);
  };

  const testCreateReward = async () => {
    setTesting(true);
    setLogs([]);

    try {
      addLog("🔍 Step 1: Checking authentication...");

      if (!user) {
        addLog("❌ No user logged in!");
        addLog("💡 Please login first at /login");
        setTesting(false);
        return;
      }

      addLog(`✅ User logged in: ${user.email}`);

      // Get token
      addLog("🔑 Step 2: Getting Firebase token...");
      const token = await user.getIdToken(true); // Force refresh
      addLog(`✅ Token obtained (${token.substring(0, 20)}...)`);

      // Test creating a reward
      addLog("🎁 Step 3: Creating test reward...");

      const testReward = {
        name: "Test Reward " + Date.now(),
        description: "This is a test reward created for debugging",
        points: 100,
        category: "discount",
        icon: "FaGift",
        color: "#FF8C00",
        stock: 50,
        isActive: true,
      };

      addLog(`📦 Sending: ${JSON.stringify(testReward, null, 2)}`);

      const response = await fetch("/api/admin/wallet/rewards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testReward),
      });

      addLog(`📡 Response status: ${response.status} ${response.statusText}`);

      const data = await response.json();
      addLog(`📥 Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog("✅ ✅ ✅ SUCCESS! Reward created!");
        addLog("🎉 Your admin panel should be working now!");
      } else {
        addLog(`❌ FAILED: ${data.error}`);
        addLog(`💡 Check server console for more details`);
      }
    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`);
      addLog(`Stack: ${error.stack}`);
    } finally {
      setTesting(false);
    }
  };

  const testFetchRewards = async () => {
    setTesting(true);
    setLogs([]);

    try {
      addLog("🔍 Testing GET rewards...");

      if (!user) {
        addLog("❌ Not logged in");
        setTesting(false);
        return;
      }

      const token = await user.getIdToken(true);

      const response = await fetch("/api/admin/wallet/rewards", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      addLog(`Response: ${response.status}`);

      const data = await response.json();
      addLog(`Data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog(`✅ Found ${data.rewards?.length || 0} rewards`);
      } else {
        addLog(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "50px auto",
        padding: "30px",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
        🔧 Admin Panel Test Tool
      </h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Use this to debug your admin panel issues
      </p>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <button
          onClick={testCreateReward}
          disabled={testing}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: testing ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: testing ? "not-allowed" : "pointer",
          }}
        >
          {testing ? "⏳ Testing..." : "🧪 Test Create Reward"}
        </button>

        <button
          onClick={testFetchRewards}
          disabled={testing}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: testing ? "#ccc" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: testing ? "not-allowed" : "pointer",
          }}
        >
          {testing ? "⏳ Testing..." : "📥 Test Fetch Rewards"}
        </button>

        <button
          onClick={() => setLogs([])}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#999",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🗑️ Clear Logs
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
          padding: "20px",
          borderRadius: "8px",
          minHeight: "400px",
          maxHeight: "600px",
          overflow: "auto",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{ color: "#666", textAlign: "center", paddingTop: "100px" }}
          >
            Click a button above to start testing
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: "5px" }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderLeft: "4px solid #ffc107",
          borderRadius: "4px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>📋 Instructions:</h3>
        <ol style={{ lineHeight: "1.8" }}>
          <li>
            <strong>Make sure you're logged in</strong>
          </li>
          <li>
            <strong>Click "Test Create Reward"</strong>
          </li>
          <li>
            <strong>Watch the logs</strong> - it will show exactly where it
            fails
          </li>
          <li>
            <strong>Check your server console</strong> for matching logs
          </li>
          <li>
            <strong>Copy the error message</strong> and we'll fix it
          </li>
        </ol>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: "#d4edda",
          borderLeft: "4px solid #28a745",
          borderRadius: "4px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>✅ What to Look For:</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>
            <strong>If fails at Step 1:</strong> Firebase not initialized
          </li>
          <li>
            <strong>If fails at Step 2:</strong> Token issue
          </li>
          <li>
            <strong>If fails at Step 3 with 403:</strong> Admin check failing
          </li>
          <li>
            <strong>If fails at Step 3 with 500:</strong> Database/server error
          </li>
          <li>
            <strong>If succeeds:</strong> Your admin panel will work! 🎉
          </li>
        </ul>
      </div>
    </div>
  );
}
