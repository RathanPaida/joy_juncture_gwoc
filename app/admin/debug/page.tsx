// app/admin/debug/page.tsx
// Create this page to debug what's happening
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

const AdminDebugPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      checkEverything();
    }
  }, [user, loading]);

  const checkEverything = async () => {
    setChecking(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      userExists: !!user,
      userEmail: user?.email || "N/A",
      userDisplayName: user?.displayName || "N/A",
      userUid: user?.uid || "N/A",
    };

    try {
      // Test 1: Can we get a token?
      console.log("Test 1: Getting Firebase token...");
      const token = await user!.getIdToken();
      info.tokenObtained = !!token;
      info.tokenLength = token?.length || 0;
      info.tokenPreview = token ? `${token.substring(0, 20)}...` : "N/A";

      // Test 2: Check MongoDB User
      console.log("Test 2: Checking MongoDB user...");
      try {
        const walletRes = await fetch("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        info.walletApiStatus = walletRes.status;
        info.walletApiOk = walletRes.ok;

        if (walletRes.ok) {
          const walletData = await walletRes.json();
          info.mongoUser = {
            email: walletData.user?.email,
            role: walletData.user?.role,
            firebaseUid: walletData.user?.firebaseUid,
            hasFirebaseUid: !!walletData.user?.firebaseUid,
          };
        } else {
          const errorText = await walletRes.text();
          info.walletApiError = errorText;
        }
      } catch (err: any) {
        info.walletApiError = err.message;
      }

      // Test 3: Check Admin Access
      console.log("Test 3: Checking admin access...");
      try {
        const adminRes = await fetch("/api/admin/check-access", {
          headers: { Authorization: `Bearer ${token}` },
        });
        info.adminCheckStatus = adminRes.status;
        info.adminCheckOk = adminRes.ok;

        const adminData = await adminRes.json();
        info.adminCheckResponse = adminData;
      } catch (err: any) {
        info.adminCheckError = err.message;
      }

      // Test 4: Check if admin routes exist
      console.log("Test 4: Checking admin API routes...");
      const routes = [
        "/api/admin/check-access",
        "/api/admin/wallet/criteria",
        "/api/admin/wallet/rewards",
        "/api/admin/wallet/achievements",
        "/api/admin/wallet/stats",
      ];

      info.routeChecks = {};
      for (const route of routes) {
        try {
          const res = await fetch(route, {
            headers: { Authorization: `Bearer ${token}` },
          });
          info.routeChecks[route] = {
            status: res.status,
            exists: res.status !== 404,
          };
        } catch (err: any) {
          info.routeChecks[route] = {
            error: err.message,
            exists: false,
          };
        }
      }
    } catch (error: any) {
      info.error = error.message;
      info.errorStack = error.stack;
    }

    setDebugInfo(info);
    setChecking(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={{ color: "#E74C3C" }}>Not Logged In</h1>
          <p>Please login first</p>
          <button
            onClick={() => (window.location.href = "/login")}
            style={styles.button}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ color: "#FF8C00", marginBottom: "2rem" }}>
          Admin Access Debug
        </h1>

        <button
          onClick={checkEverything}
          disabled={checking}
          style={{
            ...styles.button,
            marginBottom: "2rem",
            opacity: checking ? 0.6 : 1,
          }}
        >
          {checking ? "Checking..." : "Run Tests Again"}
        </button>

        {Object.keys(debugInfo).length > 0 && (
          <>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>User Information</h2>
              <div style={styles.infoGrid}>
                <div>
                  <strong>Email:</strong> {debugInfo.userEmail}
                </div>
                <div>
                  <strong>Display Name:</strong> {debugInfo.userDisplayName}
                </div>
                <div>
                  <strong>Firebase UID:</strong> {debugInfo.userUid}
                </div>
                <div>
                  <strong>Token Obtained:</strong>{" "}
                  {debugInfo.tokenObtained ? "✅" : "❌"}
                </div>
              </div>
            </div>

            {debugInfo.mongoUser && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>MongoDB User</h2>
                <div style={styles.infoGrid}>
                  <div>
                    <strong>Email:</strong> {debugInfo.mongoUser.email}
                  </div>
                  <div>
                    <strong>Role:</strong>{" "}
                    <span
                      style={{
                        color:
                          debugInfo.mongoUser.role === "admin" ||
                          debugInfo.mongoUser.role === "super_admin"
                            ? "#2ECC71"
                            : "#E74C3C",
                      }}
                    >
                      {debugInfo.mongoUser.role}
                    </span>
                  </div>
                  <div>
                    <strong>Firebase UID:</strong>{" "}
                    {debugInfo.mongoUser.firebaseUid || "NOT SET"}
                  </div>
                  <div>
                    <strong>Has Firebase UID:</strong>{" "}
                    {debugInfo.mongoUser.hasFirebaseUid ? "✅" : "❌"}
                  </div>
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>API Tests</h2>
              <div style={styles.testResults}>
                <div style={styles.testItem}>
                  <strong>Wallet API:</strong>
                  <span
                    style={{
                      color: debugInfo.walletApiOk ? "#2ECC71" : "#E74C3C",
                      marginLeft: "1rem",
                    }}
                  >
                    {debugInfo.walletApiStatus}{" "}
                    {debugInfo.walletApiOk ? "✅" : "❌"}
                  </span>
                  {debugInfo.walletApiError && (
                    <div style={styles.error}>{debugInfo.walletApiError}</div>
                  )}
                </div>

                <div style={styles.testItem}>
                  <strong>Admin Check:</strong>
                  <span
                    style={{
                      color: debugInfo.adminCheckOk ? "#2ECC71" : "#E74C3C",
                      marginLeft: "1rem",
                    }}
                  >
                    {debugInfo.adminCheckStatus}{" "}
                    {debugInfo.adminCheckOk ? "✅" : "❌"}
                  </span>
                  {debugInfo.adminCheckResponse && (
                    <pre style={styles.pre}>
                      {JSON.stringify(debugInfo.adminCheckResponse, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {debugInfo.routeChecks && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>API Routes Check</h2>
                <div style={styles.routeChecks}>
                  {Object.entries(debugInfo.routeChecks).map(
                    ([route, check]: [string, any]) => (
                      <div key={route} style={styles.routeItem}>
                        <code style={styles.route}>{route}</code>
                        <span
                          style={{
                            color: check.exists ? "#2ECC71" : "#E74C3C",
                            marginLeft: "1rem",
                          }}
                        >
                          {check.status || "Error"} {check.exists ? "✅" : "❌"}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Full Debug Data</h2>
              <pre style={styles.pre}>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Troubleshooting</h2>
              <div style={styles.troubleshoot}>
                {!debugInfo.mongoUser && (
                  <div style={styles.issue}>
                    ❌ <strong>MongoDB user not found</strong>
                    <p>
                      Solution: Visit /walletandpoints to create your wallet
                      first
                    </p>
                  </div>
                )}

                {debugInfo.mongoUser && !debugInfo.mongoUser.hasFirebaseUid && (
                  <div style={styles.issue}>
                    ❌ <strong>Firebase UID not linked</strong>
                    <p>
                      Solution: Visit /walletandpoints once to link your
                      Firebase account
                    </p>
                  </div>
                )}

                {debugInfo.mongoUser &&
                  debugInfo.mongoUser.role === "viewer" && (
                    <div style={styles.issue}>
                      ❌ <strong>Not an admin</strong>
                      <p>Solution: Run this in MongoDB:</p>
                      <code style={styles.codeBlock}>
                        db.users.updateOne(
                        {`{ email: "${debugInfo.userEmail}" }`},
                        {`{ $set: { role: "admin" } }`})
                      </code>
                    </div>
                  )}

                {debugInfo.routeChecks &&
                  Object.values(debugInfo.routeChecks).some(
                    (r: any) => !r.exists,
                  ) && (
                    <div style={styles.issue}>
                      ❌ <strong>Some API routes are missing</strong>
                      <p>Solution: Create the missing API route files</p>
                    </div>
                  )}

                {debugInfo.adminCheckOk && (
                  <div style={styles.success}>
                    ✅ <strong>Everything looks good!</strong>
                    <p>You should be able to access admin pages</p>
                    <button
                      onClick={() => (window.location.href = "/admin/wallet")}
                      style={{ ...styles.button, marginTop: "1rem" }}
                    >
                      Go to Admin Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#0B0B0B",
    padding: "2rem",
    color: "#FFFFFF",
  },
  card: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "2rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    background: "#FF8C00",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  section: {
    marginBottom: "2rem",
    padding: "1.5rem",
    background: "#0B0B0B",
    border: "1px solid #333",
    borderRadius: "8px",
  },
  sectionTitle: {
    color: "#FF8C00",
    marginBottom: "1rem",
    fontSize: "1.3rem",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
  testResults: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  testItem: {
    padding: "1rem",
    background: "#1a1a1a",
    borderRadius: "6px",
  },
  error: {
    marginTop: "0.5rem",
    padding: "0.5rem",
    background: "#E74C3C",
    color: "white",
    borderRadius: "4px",
    fontSize: "0.9rem",
  },
  pre: {
    marginTop: "1rem",
    padding: "1rem",
    background: "#000",
    border: "1px solid #333",
    borderRadius: "6px",
    overflow: "auto",
    fontSize: "0.875rem",
  },
  routeChecks: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  routeItem: {
    padding: "0.75rem",
    background: "#1a1a1a",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  route: {
    fontFamily: "monospace",
    fontSize: "0.9rem",
  },
  troubleshoot: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  issue: {
    padding: "1rem",
    background: "rgba(231, 76, 60, 0.1)",
    border: "1px solid #E74C3C",
    borderRadius: "6px",
  },
  success: {
    padding: "1rem",
    background: "rgba(46, 204, 113, 0.1)",
    border: "1px solid #2ECC71",
    borderRadius: "6px",
  },
  codeBlock: {
    display: "block",
    marginTop: "0.5rem",
    padding: "0.5rem",
    background: "#000",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.85rem",
  },
};

export default AdminDebugPage;
