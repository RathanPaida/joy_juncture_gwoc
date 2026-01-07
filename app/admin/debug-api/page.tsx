// app/admin/debug-api/page.tsx
// This will test each API individually and show which one is failing
'use client';

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

const DebugAPIPage: React.FC = () => {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testAllAPIs = async () => {
    setTesting(true);
    const testResults: any = {};

    try {
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) {
        testResults.error = 'Not logged in';
        setResults(testResults);
        setTesting(false);
        return;
      }

      const token = await user.getIdToken();

      // Test each API one by one
      const apis = [
        { name: 'check-access', url: '/api/admin/check-access' },
        { name: 'criteria', url: '/api/admin/wallet/criteria' },
        { name: 'rewards', url: '/api/admin/wallet/rewards' },
        { name: 'achievements', url: '/api/admin/wallet/achievements' },
        { name: 'stats', url: '/api/admin/wallet/stats' },
      ];

      for (const api of apis) {
        try {
          console.log(`Testing ${api.name}...`);
          
          const response = await fetch(api.url, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const contentType = response.headers.get('content-type');
          
          testResults[api.name] = {
            status: response.status,
            ok: response.ok,
            contentType: contentType,
          };

          if (contentType?.includes('application/json')) {
            try {
              const data = await response.json();
              testResults[api.name].data = data;
              testResults[api.name].dataPreview = JSON.stringify(data).substring(0, 100);
            } catch (jsonError) {
              testResults[api.name].jsonError = 'Failed to parse JSON';
            }
          } else {
            const text = await response.text();
            testResults[api.name].isHTML = text.startsWith('<!DOCTYPE') || text.startsWith('<html');
            testResults[api.name].textPreview = text.substring(0, 200);
          }

        } catch (error: any) {
          testResults[api.name] = {
            error: error.message
          };
        }
      }

    } catch (error: any) {
      testResults.globalError = error.message;
    }

    setResults(testResults);
    setTesting(false);
  };

  useEffect(() => {
    testAllAPIs();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={{ color: '#FF8C00', marginBottom: '2rem' }}>
          🔍 API Debug Tool
        </h1>

        <button
          onClick={testAllAPIs}
          disabled={testing}
          style={{
            ...styles.button,
            opacity: testing ? 0.6 : 1,
            marginBottom: '2rem'
          }}
        >
          {testing ? 'Testing...' : 'Test All APIs'}
        </button>

        {results.error && (
          <div style={styles.error}>
            ❌ {results.error}
            <br />
            <a href="/login" style={{ color: 'white', marginTop: '1rem', display: 'inline-block' }}>
              Go to Login
            </a>
          </div>
        )}

        {results.globalError && (
          <div style={styles.error}>
            ❌ Global Error: {results.globalError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(results).map(([apiName, result]: [string, any]) => {
            if (apiName === 'error' || apiName === 'globalError') return null;

            const isSuccess = result.ok && result.contentType?.includes('json');
            const isHTML = result.isHTML;

            return (
              <div
                key={apiName}
                style={{
                  ...styles.apiResult,
                  borderColor: isSuccess ? '#2ECC71' : isHTML ? '#E74C3C' : '#FF8C00'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>
                    {isSuccess ? '✅' : isHTML ? '❌' : '⚠️'} {apiName}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    background: result.ok ? '#2ECC71' : '#E74C3C',
                    color: 'white'
                  }}>
                    {result.status}
                  </span>
                </div>

                <div style={styles.details}>
                  <div><strong>Content-Type:</strong> {result.contentType || 'N/A'}</div>
                  
                  {result.error && (
                    <div style={styles.error}>
                      Error: {result.error}
                    </div>
                  )}

                  {result.isHTML && (
                    <div style={styles.error}>
                      <strong>⚠️ PROBLEM: API is returning HTML instead of JSON!</strong>
                      <br />
                      <br />
                      This means the API route file doesn't exist or has an error.
                      <br />
                      <strong>File should be at:</strong>
                      <code style={styles.code}>
                        app/api/admin/{apiName === 'check-access' ? 'check-access' : `wallet/${apiName}`}/route.ts
                      </code>
                      <br />
                      <br />
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#FF8C00' }}>
                          Show HTML Preview
                        </summary>
                        <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', overflow: 'auto' }}>
                          {result.textPreview}
                        </pre>
                      </details>
                    </div>
                  )}

                  {result.dataPreview && (
                    <div style={styles.success}>
                      <strong>✅ Success! Returning JSON</strong>
                      <details>
                        <summary style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
                          Show Data Preview
                        </summary>
                        <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', overflow: 'auto' }}>
                          {result.dataPreview}
                        </pre>
                      </details>
                    </div>
                  )}

                  {result.jsonError && (
                    <div style={styles.warning}>
                      ⚠️ Response is JSON but failed to parse: {result.jsonError}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(results).length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#FF8C00' }}>Summary</h2>
            <div style={styles.summary}>
              {Object.entries(results).filter(([k]) => k !== 'error' && k !== 'globalError').map(([name, r]: [string, any]) => (
                <div key={name}>
                  <strong>{name}:</strong>{' '}
                  {r.isHTML ? (
                    <span style={{ color: '#E74C3C' }}>❌ Missing API file</span>
                  ) : r.ok ? (
                    <span style={{ color: '#2ECC71' }}>✅ Working</span>
                  ) : (
                    <span style={{ color: '#FF8C00' }}>⚠️ Error {r.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#0B0B0B', borderRadius: '8px' }}>
          <h3 style={{ color: '#FF8C00', marginBottom: '1rem' }}>How to Fix</h3>
          <ol style={{ lineHeight: '2' }}>
            <li>Look for red ❌ entries above</li>
            <li>Those API routes are missing or broken</li>
            <li>Create the file at the path shown</li>
            <li>Copy the code from my previous artifacts</li>
            <li>Restart your server</li>
            <li>Run this test again</li>
          </ol>
        </div>
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
    maxWidth: '1000px',
    margin: '0 auto',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '2rem',
  },
  button: {
    width: '100%',
    padding: '1rem',
    background: '#FF8C00',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  apiResult: {
    padding: '1.5rem',
    background: '#0B0B0B',
    border: '2px solid',
    borderRadius: '8px',
  },
  details: {
    fontSize: '0.9rem',
    color: '#CCCCCC',
  },
  error: {
    marginTop: '0.5rem',
    padding: '1rem',
    background: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid #E74C3C',
    borderRadius: '6px',
    color: '#E74C3C',
  },
  success: {
    marginTop: '0.5rem',
    padding: '1rem',
    background: 'rgba(46, 204, 113, 0.1)',
    border: '1px solid #2ECC71',
    borderRadius: '6px',
    color: '#2ECC71',
  },
  warning: {
    marginTop: '0.5rem',
    padding: '1rem',
    background: 'rgba(255, 140, 0, 0.1)',
    border: '1px solid #FF8C00',
    borderRadius: '6px',
    color: '#FF8C00',
  },
  summary: {
    padding: '1rem',
    background: '#0B0B0B',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  code: {
    padding: '0.25rem 0.5rem',
    background: '#000',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
  },
};

export default DebugAPIPage;