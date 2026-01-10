"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function RewardDeleteDiagnostic() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const loadRewards = async () => {
    if (!user) {
      addLog("❌ Not logged in");
      return;
    }

    try {
      addLog("📥 Loading rewards...");
      const token = await user.getIdToken(true);

      const response = await fetch("/api/admin/wallet/rewards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setRewards(data.rewards || []);

      addLog(`✅ Found ${data.rewards?.length || 0} rewards`);
      data.rewards?.forEach((r: any, i: number) => {
        addLog(`  ${i + 1}. ID: ${r._id} | Name: ${r.name}`);
      });
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const testDelete = async (rewardId: string, rewardName: string) => {
    if (!user) return;

    setTesting(true);
    addLog(`\n🗑️ Testing delete for: ${rewardName}`);
    addLog(`📝 Reward ID: ${rewardId}`);
    addLog(`📏 ID Length: ${rewardId.length}`);
    addLog(`🔤 ID Type: ${typeof rewardId}`);

    try {
      const token = await user.getIdToken(true);

      addLog(`🌐 Sending DELETE request...`);
      const response = await fetch(`/api/admin/wallet/rewards/${rewardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      addLog(`📡 Response status: ${response.status}`);

      const data = await response.json();
      addLog(`📥 Response: ${JSON.stringify(data, null, 2)}`);

      if (data.deletedCount > 0) {
        addLog(`✅ SUCCESS! Reward was deleted`);
        loadRewards(); // Reload list
      } else {
        addLog(`❌ FAILED! deletedCount = 0 (reward not found)`);
        addLog(`💡 This means the ID doesn't exist in MongoDB`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const checkMongoDB = async (rewardId: string) => {
    if (!user) return;

    addLog(`\n🔍 Checking if reward exists in MongoDB...`);
    addLog(`📝 Looking for ID: ${rewardId}`);

    try {
      const token = await user.getIdToken(true);

      // Try to get this specific reward
      const response = await fetch(`/api/admin/wallet/rewards/${rewardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 405) {
        addLog(`⚠️ GET method not implemented (this is ok)`);
      } else {
        const data = await response.json();
        addLog(`📥 Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (user) {
      loadRewards();
    }
  }, [user]);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "50px auto",
        padding: "30px",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
        🔍 Reward Delete Diagnostic
      </h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        This tool will help diagnose why rewards aren't deleting
      </p>

      <button
        onClick={loadRewards}
        style={{
          padding: "12px 24px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "30px",
          fontWeight: "bold",
        }}
      >
        🔄 Reload Rewards
      </button>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}
      >
        <div>
          <h2 style={{ marginBottom: "20px" }}>Rewards in Database</h2>
          {rewards.length === 0 ? (
            <p style={{ color: "#999" }}>No rewards found</p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {rewards.map((reward) => (
                <div
                  key={reward._id}
                  style={{
                    padding: "20px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
                    {reward.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "10px",
                      fontFamily: "monospace",
                    }}
                  >
                    ID: {reward._id}
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => testDelete(reward._id, reward.name)}
                      disabled={testing}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: testing ? "#ccc" : "#F44336",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: testing ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {testing ? "⏳ Testing..." : "🗑️ Test Delete"}
                    </button>
                    <button
                      onClick={() => checkMongoDB(reward._id)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#FF9800",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      🔍 Check DB
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ marginBottom: "20px" }}>Diagnostic Logs</h2>
          <div
            style={{
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: "20px",
              borderRadius: "8px",
              minHeight: "500px",
              maxHeight: "600px",
              overflow: "auto",
              fontSize: "13px",
              fontFamily: "monospace",
              lineHeight: "1.6",
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: "#666" }}>
                Click "Test Delete" on any reward...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: "5px" }}>
                  {log}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setLogs([])}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            🗑️ Clear Logs
          </button>
        </div>
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
        <h3 style={{ marginTop: 0 }}>📋 What to Look For:</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>
            <strong>If deletedCount = 0:</strong> The ID doesn't exist in
            MongoDB
          </li>
          <li>
            <strong>If ID looks weird:</strong> There might be extra characters
            or formatting issues
          </li>
          <li>
            <strong>If ID length is wrong:</strong> MongoDB ObjectIDs should be
            24 characters
          </li>
          <li>
            <strong>Copy the logs and send them to me</strong> so I can see
            exactly what's happening
          </li>
        </ul>
      </div>
    </div>
  );
}
