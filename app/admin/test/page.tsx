// app/admin/test/page.tsx
// SIMPLEST POSSIBLE PAGE - NO DEPENDENCIES

export default function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0B0B',
      color: 'white',
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#1a1a1a',
        padding: '2rem',
        borderRadius: '12px',
        border: '2px solid #2ECC71'
      }}>
        <h1 style={{ color: '#2ECC71', marginBottom: '1rem' }}>
          ✅ SUCCESS!
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          If you can see this page, your admin routes are working!
        </p>
        
        <div style={{
          background: '#0B0B0B',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#FF8C00', marginBottom: '1rem' }}>Next Steps:</h2>
          <ol style={{ lineHeight: '2' }}>
            <li>Open browser console (F12)</li>
            <li>Check if you're logged in to Firebase</li>
            <li>Copy and paste this code in console:</li>
          </ol>
          <pre style={{
            background: '#000',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            marginTop: '1rem',
            fontSize: '0.9rem'
          }}>
{`// Check Firebase Auth
import { getAuth } from 'firebase/auth';
const auth = getAuth();
const user = auth.currentUser;
console.log('User:', user);
console.log('Email:', user?.email);
console.log('UID:', user?.uid);

// If logged in, get token and check MongoDB
if (user) {
  const token = await user.getIdToken();
  console.log('Token obtained!');
  
  // Check wallet API
  const res = await fetch('/api/wallet', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
  const data = await res.json();
  console.log('Wallet API:', res.status);
  console.log('User Role:', data.user?.role);
  console.log('Firebase UID:', data.user?.firebaseUid);
  
  // Check admin access
  const adminRes = await fetch('/api/admin/check-access', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
  console.log('Admin Check:', adminRes.status);
  const adminData = await adminRes.json();
  console.log('Admin Response:', adminData);
}`}
          </pre>
        </div>

        <div style={{
          background: 'rgba(255, 140, 0, 0.1)',
          border: '1px solid #FF8C00',
          padding: '1.5rem',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#FF8C00', marginBottom: '1rem' }}>Manual Checks:</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <strong>1. Check MongoDB User Role:</strong>
            <pre style={{
              background: '#000',
              padding: '1rem',
              borderRadius: '6px',
              marginTop: '0.5rem',
              fontSize: '0.85rem'
            }}>
{`// In MongoDB Compass or shell:
db.users.findOne({ email: "your-email@example.com" })`}
            </pre>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
              Make sure 'role' is 'admin' or 'super_admin'
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong>2. Update Role if Needed:</strong>
            <pre style={{
              background: '#000',
              padding: '1rem',
              borderRadius: '6px',
              marginTop: '0.5rem',
              fontSize: '0.85rem'
            }}>
{`db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)`}
            </pre>
          </div>

          <div>
            <strong>3. Check if Firebase UID is Linked:</strong>
            <pre style={{
              background: '#000',
              padding: '1rem',
              borderRadius: '6px',
              marginTop: '0.5rem',
              fontSize: '0.85rem'
            }}>
{`// In MongoDB, your user should have:
{
  email: "your-email@example.com",
  role: "admin",
  firebaseUid: "some-long-uid-here" // <-- Must exist!
}`}
            </pre>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#2ECC71', marginBottom: '1rem' }}>Try These Links:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="/login" style={{
              padding: '1rem',
              background: '#FF8C00',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              Login Page
            </a>
            <a href="/walletandpoints" style={{
              padding: '1rem',
              background: '#4ECDC4',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              Wallet Page (Creates/Links User)
            </a>
            <a href="/admin/setup" style={{
              padding: '1rem',
              background: '#9B59B6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              Admin Setup Page
            </a>
            <a href="/admin/wallet" style={{
              padding: '1rem',
              background: '#2ECC71',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}