// app/admin/setup/page.tsx
// ⚠️ DELETE THIS FILE after creating your first admin!
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaUserShield, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const AdminSetupPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [setupLoading, setSetupLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetupAdmin = async () => {
    if (!user) {
      alert('Please login first!');
      router.push('/login');
      return;
    }

    try {
      setSetupLoading(true);
      setMessage('');

      const token = await user.getIdToken();

      const response = await fetch('/api/admin/setup-first-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
        
        // Show success message with next steps
        setTimeout(() => {
          alert(
            '🎉 Success!\n\n' +
            'Next steps:\n' +
            '1. Logout and login again\n' +
            '2. Visit /admin/wallet\n' +
            '3. DELETE this file for security:\n' +
            '   app/admin/setup/page.tsx\n' +
            '   app/api/admin/setup-first-admin/route.ts'
          );
          router.push('/');
        }, 2000);
      } else {
        setMessage(data.error || 'Setup failed');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>⚠️ Login Required</h1>
          <p style={styles.text}>Please login to setup your admin account.</p>
          <button 
            style={styles.button}
            onClick={() => router.push('/login')}
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
        <div style={styles.iconContainer}>
          <FaUserShield style={styles.icon} />
        </div>
        
        <h1 style={styles.title}>Setup First Admin</h1>
        
        <div style={styles.warningBox}>
          <FaExclamationTriangle style={styles.warningIcon} />
          <p style={styles.warningText}>
            This will make your account a <strong>Super Admin</strong> with full access to the admin panel.
          </p>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}><strong>Logged in as:</strong></p>
          <p style={styles.userEmail}>{user.email}</p>
          <p style={styles.userName}>{user.displayName || 'User'}</p>
        </div>

        {message && (
          <div style={{
            ...styles.messageBox,
            background: success ? '#2ECC71' : '#E74C3C'
          }}>
            {success && <FaCheck style={styles.checkIcon} />}
            <p>{message}</p>
          </div>
        )}

        <button
          style={{
            ...styles.button,
            opacity: setupLoading ? 0.6 : 1,
            cursor: setupLoading ? 'not-allowed' : 'pointer'
          }}
          onClick={handleSetupAdmin}
          disabled={setupLoading}
        >
          {setupLoading ? 'Setting up...' : 'Make Me Admin'}
        </button>

        <div style={styles.securityNote}>
          <p style={styles.securityTitle}>🔒 Security Note:</p>
          <ul style={styles.securityList}>
            <li>This endpoint only works if no admin exists yet</li>
            <li>After setup, you must delete these files:</li>
            <li style={{ marginLeft: '20px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
              app/admin/setup/page.tsx
            </li>
            <li style={{ marginLeft: '20px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
              app/api/admin/setup-first-admin/route.ts
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0B0B0B 0%, #1a1a1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: '#1a1a1a',
    border: '2px solid #FF8C00',
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(255, 140, 0, 0.3)',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  icon: {
    fontSize: '4rem',
    color: '#FF8C00',
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '2rem',
  },
  text: {
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  warningBox: {
    background: 'rgba(255, 140, 0, 0.1)',
    border: '1px solid #FF8C00',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  warningIcon: {
    color: '#FF8C00',
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  warningText: {
    color: '#FFFFFF',
    margin: 0,
    fontSize: '0.95rem',
  },
  infoBox: {
    background: '#0B0B0B',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  infoText: {
    color: '#888',
    margin: '0 0 0.5rem 0',
    fontSize: '0.9rem',
  },
  userEmail: {
    color: '#FF8C00',
    margin: '0 0 0.5rem 0',
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
  userName: {
    color: '#CCCCCC',
    margin: 0,
  },
  messageBox: {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkIcon: {
    fontSize: '1.2rem',
  },
  button: {
    width: '100%',
    padding: '1rem 2rem',
    background: '#FF8C00',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '2rem',
  },
  securityNote: {
    background: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid #E74C3C',
    borderRadius: '8px',
    padding: '1rem',
  },
  securityTitle: {
    color: '#E74C3C',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  securityList: {
    color: '#CCCCCC',
    margin: 0,
    paddingLeft: '1.5rem',
    fontSize: '0.9rem',
    lineHeight: '1.8',
  },
  loading: {
    color: '#FFFFFF',
    fontSize: '1.5rem',
  },
};

export default AdminSetupPage;