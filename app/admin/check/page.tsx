// app/admin/check/page.tsx
// Simple admin check without AuthContext dependency
'use client';

import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

const AdminCheckPage: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    const info: any = {};

    try {
      const auth = getAuth(app);
      const user = auth.currentUser;

      info.firebaseUser = {
        exists: !!user,
        email: user?.email,
        uid: user?.uid,
        displayName: user?.displayName
      };

      if (!user) {
        info.error = 'No user logged in. Please login first.';
        setResults(info);
        setChecking(false);
        return;
      }

      // Get token
      const token = await user.getIdToken();
      info.token = {
        obtained: true,
        length: token.length,
        preview: token.substring(0, 30) + '...'
      };

      // Check wallet API
      try {
        const walletRes = await fetch('/api/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        info.walletAPI = {
          status: walletRes.status,
          ok: walletRes.ok
        };

        if (walletRes.ok) {
          const walletData = await walletRes.json();
          info.mongoUser = {
            email: walletData.user?.email,
            role: walletData.user?.role,
            firebaseUid: walletData.user?.firebaseUid,
            hasUid: !!walletData.user?.firebaseUid
          };
        } else {
          const errorText = await walletRes.text();
          info.walletAPI.error = errorText;
        }
      } catch (err: any) {
        info.walletAPI = { error: err.message };
      }

      // Check admin access
      try {
        const adminRes = await fetch('/api/admin/check-access', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        info.adminCheck = {
          status: adminRes.status,
          ok: adminRes.ok
        };

        const adminData = await adminRes.json();
        info.adminCheck.response = adminData;
      } catch (err: any) {
        info.adminCheck = { error: err.message };
      }

    } catch (error: any) {
      info.error = error.message;
    }

    setResults(info);
    setChecking(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ color: '#FF8C00', marginBottom: '2rem' }}>
          🔍 Admin Access Check
        </h1>

        <button
          onClick={runCheck}
          disabled={checking}
          style={{
            ...styles.button,
            opacity: checking ? 0.6 : 1,
            cursor: checking ? 'not-allowed' : 'pointer'
          }}
        >
          {checking ? 'Checking...' : 'Run Check'}
        </button>

        {results && (
          <div style={{ marginTop: '2rem' }}>
            {/* Firebase User */}
            <div style={styles.section}>
              <h2 style={styles.heading}>Firebase User</h2>
              {results.firebaseUser?.exists ? (
                <div style={styles.success}>
                  ✅ Logged in as: {results.firebaseUser.email}
                  <br />
                  UID: {results.firebaseUser.uid}
                </div>
              ) : (
                <div style={styles.error}>
                  ❌ Not logged in
                  <br />
                  <button
                    onClick={() => window.location.href = '/login'}
                    style={{ ...styles.button, marginTop: '1rem' }}
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>

            {/* Token */}
            {results.token && (
              <div style={styles.section}>
                <h2 style={styles.heading}>Firebase Token</h2>
                <div style={styles.success}>
                  ✅ Token obtained ({results.token.length} chars)
                </div>
              </div>
            )}

            {/* MongoDB User */}
            {results.mongoUser && (
              <div style={styles.section}>
                <h2 style={styles.heading}>MongoDB User</h2>
                <div style={styles.info}>
                  <p><strong>Email:</strong> {results.mongoUser.email}</p>
                  <p>
                    <strong>Role:</strong>{' '}
                    <span style={{
                      color: ['admin', 'super_admin'].includes(results.mongoUser.role)
                        ? '#2ECC71'
                        : '#E74C3C'
                    }}>
                      {results.mongoUser.role}
                    </span>
                  </p>
                  <p>
                    <strong>Firebase UID:</strong>{' '}
                    {results.mongoUser.hasUid ? (
                      <span style={{ color: '#2ECC71' }}>✅ Linked</span>
                    ) : (
                      <span style={{ color: '#E74C3C' }}>❌ Not linked</span>
                    )}
                  </p>
                </div>

                {results.mongoUser.role === 'viewer' && (
                  <div style={{ ...styles.error, marginTop: '1rem' }}>
                    ❌ <strong>You are not an admin!</strong>
                    <br />
                    <br />
                    <strong>Fix in MongoDB:</strong>
                    <pre style={styles.code}>
{`db.users.updateOne(
  { email: "${results.mongoUser.email}" },
  { $set: { role: "admin" } }
)`}
                    </pre>
                    <br />
                    <strong>Or visit:</strong>
                    <br />
                    <button
                      onClick={() => window.location.href = '/admin/setup'}
                      style={{ ...styles.button, marginTop: '0.5rem' }}
                    >
                      Admin Setup Page
                    </button>
                  </div>
                )}

                {!results.mongoUser.hasUid && (
                  <div style={{ ...styles.warning, marginTop: '1rem' }}>
                    ⚠️ <strong>Firebase UID not linked</strong>
                    <br />
                    Visit /walletandpoints to link your account
                    <br />
                    <button
                      onClick={() => window.location.href = '/walletandpoints'}
                      style={{ ...styles.button, marginTop: '0.5rem' }}
                    >
                      Link Account
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Wallet API */}
            {results.walletAPI && (
              <div style={styles.section}>
                <h2 style={styles.heading}>Wallet API</h2>
                {results.walletAPI.ok ? (
                  <div style={styles.success}>
                    ✅ Status: {results.walletAPI.status}
                  </div>
                ) : (
                  <div style={styles.error}>
                    ❌ Status: {results.walletAPI.status}
                    <br />
                    {results.walletAPI.error && (
                      <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {results.walletAPI.error}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Admin Check */}
            {results.adminCheck && (
              <div style={styles.section}>
                <h2 style={styles.heading}>Admin Access</h2>
                {results.adminCheck.ok ? (
                  <div style={styles.success}>
                    ✅ Admin access granted!
                    <br />
                    <button
                      onClick={() => window.location.href = '/admin/wallet'}
                      style={{ ...styles.button, marginTop: '1rem' }}
                    >
                      Go to Admin Dashboard
                    </button>
                  </div>
                ) : (
                  <div style={styles.error}>
                    ❌ Status: {results.adminCheck.status}
                    <br />
                    {results.adminCheck.response && (
                      <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {JSON.stringify(results.adminCheck.response, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full Debug */}
            <details style={{ marginTop: '2rem' }}>
              <summary style={{ cursor: 'pointer', color: '#FF8C00', fontSize: '1.1rem' }}>
                📋 Full Debug Data
              </summary>
              <pre style={styles.code}>
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#0B0B0B',
    padding: '2rem',
    color: '#FFFFFF',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '2rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#FF8C00',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    width: '100%',
  },
  section: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    background: '#0B0B0B',
    border: '1px solid #333',
    borderRadius: '8px',
  },
  heading: {
    color: '#FF8C00',
    marginBottom: '1rem',
    fontSize: '1.2rem',
  },
  info: {
    color: '#CCCCCC',
  },
  success: {
    padding: '1rem',
    background: 'rgba(46, 204, 113, 0.1)',
    border: '1px solid #2ECC71',
    borderRadius: '6px',
    color: '#2ECC71',
  },
  error: {
    padding: '1rem',
    background: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid #E74C3C',
    borderRadius: '6px',
    color: '#E74C3C',
  },
  warning: {
    padding: '1rem',
    background: 'rgba(255, 140, 0, 0.1)',
    border: '1px solid #FF8C00',
    borderRadius: '6px',
    color: '#FF8C00',
  },
  code: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#000',
    border: '1px solid #333',
    borderRadius: '6px',
    overflow: 'auto',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
  },
};

export default AdminCheckPage;