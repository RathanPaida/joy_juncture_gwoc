// // components/ProtectedRoute.tsx
// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   requireAdmin?: boolean;
// }

// export default function ProtectedRoute({
//   children,
//   requireAdmin = false
// }: ProtectedRouteProps) {
//   const { user, loading, isAdmin } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading) {
//       if (!user) {
//         // Redirect to login if not authenticated
//         router.push('/login');
//       } else if (requireAdmin && !isAdmin) {
//         // Redirect to unauthorized if not admin
//         router.push('/unauthorized');
//       }
//     }
//   }, [user, loading, isAdmin, requireAdmin, router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
//         <div className="text-white text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
//           <p>Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user || (requireAdmin && !isAdmin)) {
//     return null;
//   }

//   return <>{children}</>;
// }
