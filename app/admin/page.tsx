import Link from 'next/link';
import { Package, Plus, TrendingUp, ShoppingBag, Grid } from 'lucide-react';

async function getStoreStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/products`, { cache: 'no-store' });
    if (!res.ok) return { total: 0, categories: 0 };
    
    const data = await res.json();
    const products = data.items || [];
    
    // Count unique categories
    const uniqueCategories = new Set<string>();
    products.forEach((product: any) => {
      if (product.category && Array.isArray(product.category)) {
        product.category.forEach((cat: string) => uniqueCategories.add(cat));
      }
    });
    
    return {
      total: data.total || 0,
      categories: uniqueCategories.size,
    };
  } catch {
    return { total: 0, categories: 0 };
  }
}

export default async function AdminDashboard() {
  const { total, categories } = await getStoreStats();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-5xl font-black text-white mb-2" 
          style={{ fontFamily: '"Inter", sans-serif', letterSpacing: '-0.02em' }}
        >
          Admin Dashboard
        </h1>
        <div className="h-1 w-32 rounded-full" style={{ backgroundColor: '#FF5F1F' }}></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#FF5F1F' }}>
              <Package size={32} className="text-white" />
            </div>
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <p className="text-5xl font-black text-white mb-2">{total}</p>
          <p className="text-gray-400 font-semibold">Total Products</p>
        </div>

        {/* Active Products */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-green-600">
              <ShoppingBag size={32} className="text-white" />
            </div>
          </div>
          <p className="text-5xl font-black text-white mb-2">{total}</p>
          <p className="text-gray-400 font-semibold">Active Products</p>
        </div>

        {/* Categories */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 rounded-xl bg-purple-600">
              <Grid size={32} className="text-white" />
            </div>
          </div>
          <p className="text-5xl font-black text-white mb-2">{categories}</p>
          <p className="text-gray-400 font-semibold">Categories</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#FF5F1F' }}></div>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-8 py-4 text-white font-black rounded-xl transition-all hover:scale-105 shadow-lg"
            style={{ backgroundColor: '#FF5F1F' }}
          >
            <Plus size={20} strokeWidth={3} />
            Add New Product
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-2 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all hover:scale-105"
          >
            <Package size={20} strokeWidth={2.5} />
            View All Products
          </Link>
          <Link
            href="/store"
            className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all hover:scale-105"
          >
            <ShoppingBag size={20} strokeWidth={2.5} />
            View Store
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#FF5F1F' }}></div>
          Recent Activity
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-gray-300">
              <span className="text-white font-bold">{total} products</span> currently in database
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF5F1F' }}></div>
            <p className="text-gray-300">
              <span className="text-white font-bold">{categories} categories</span> available
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <p className="text-gray-300">
              <span className="text-white font-bold">Store</span> is live and accessible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
