"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Package,
  AlertCircle,
  Edit,
  Search,
  Download,
  X,
} from "lucide-react";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string };
  images?: Array<{ url: string; isPrimary: boolean }>;
  stock: { quantity: number; available: boolean };
  meta?: {
    players?: string;
    duration?: string;
    moods?: string[];
    badges?: string[];
  };
  category?: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPlayers, setFilterPlayers] = useState("all");
  const [filterMood, setFilterMood] = useState("all");
  const [filterOccasion, setFilterOccasion] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product._id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.category?.includes(filterCategory),
      );
    }

    // Players filter
    if (filterPlayers !== "all") {
      filtered = filtered.filter((product) => {
        const players = product.meta?.players || "";
        if (filterPlayers === "2") return players.includes("2");
        if (filterPlayers === "3-4")
          return players.includes("3") || players.includes("4");
        if (filterPlayers === "5+")
          return (
            players.includes("5") ||
            players.includes("6") ||
            players.includes("8")
          );
        return true;
      });
    }

    // Mood filter
    if (filterMood !== "all") {
      filtered = filtered.filter((product) =>
        product.meta?.moods?.includes(filterMood),
      );
    }

    // Occasion filter
    if (filterOccasion !== "all") {
      filtered = filtered.filter((product) =>
        product.meta?.badges?.some((badge) =>
          badge.toLowerCase().includes(filterOccasion.toLowerCase()),
        ),
      );
    }

    setFilteredProducts(filtered);
  }, [
    searchQuery,
    filterCategory,
    filterPlayers,
    filterMood,
    filterOccasion,
    products,
  ]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data.items || []);
      setFilteredProducts(data.items || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `⚠️ DELETE PRODUCT\n\nAre you sure you want to delete:\n"${name}"\n\nThis action cannot be undone!`,
    );

    if (!confirmed) return;
    setDeleting(id);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("✅ Product deleted successfully!");
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setSelectedProducts((prev) => prev.filter((p) => p !== id));
      } else {
        alert(
          `❌ Failed to delete product\n\n${data.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error during delete:", error);
      alert("❌ Error deleting product. Check console for details.");
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const confirmed = window.confirm(
      `⚠️ BULK DELETE\n\nDelete ${selectedProducts.length} products?\n\nThis cannot be undone!`,
    );

    if (!confirmed) return;

    for (const id of selectedProducts) {
      const product = products.find((p) => p._id === id);
      if (product) {
        await handleDelete(id, product.name);
      }
    }
    setSelectedProducts([]);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const getPrimaryImage = (product: Product): string => {
    const primaryImage = product.images?.find((img) => img.isPrimary)?.url;
    if (primaryImage) return primaryImage;
    if (product.images && product.images.length > 0)
      return product.images[0].url;
    return product.media?.thumbnail || "/placeholder-image.jpg";
  };

  const getStockStatus = (product: Product) => {
    if (!product.stock.available || product.stock.quantity === 0) {
      return {
        label: "Out of Stock",
        color: "bg-red-100 text-red-700 border-red-300",
        pulse: "animate-pulse",
      };
    }
    if (product.stock.quantity <= 5) {
      return {
        label: `Critical (${product.stock.quantity})`,
        color: "bg-red-500 text-white border-red-600",
        pulse: "animate-pulse",
      };
    }
    if (product.stock.quantity <= 20) {
      return {
        label: `Low (${product.stock.quantity})`,
        color: "bg-orange-100 text-orange-700 border-orange-300",
        pulse: "",
      };
    }
    return {
      label: `${product.stock.quantity} units`,
      color: "bg-green-100 text-green-700 border-green-300",
      pulse: "",
    };
  };

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Price", "Stock", "Players", "Category"];
    const rows = filteredProducts.map((p) => [
      p._id,
      p.name,
      p.price.amount,
      p.stock.quantity,
      p.meta?.players || "N/A",
      p.category?.[0] || "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Breadcrumbs */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-2 font-medium">
          <Link href="/admin" className="hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Products</span>
        </div>

        {/* Compact Header with Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Count */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Products</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filteredProducts.length} of {products.length} total
                </p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-2xl">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              >
                <option value="all">All Categories</option>
                <option value="board-game">Board Games</option>
                <option value="card-game">Card Games</option>
              </select>

              {/* Export CSV */}
              <button
                onClick={exportToCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm whitespace-nowrap"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Add Product */}
              <Link
                href="/admin/products/new"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-bold text-sm shadow-lg shadow-orange-200 whitespace-nowrap"
              >
                <Plus size={18} />
                Add Product
              </Link>
            </div>
          </div>

          {/* Advanced Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">
              Quick Filters:
            </span>

            {/* Players Filter */}
            <select
              value={filterPlayers}
              onChange={(e) => setFilterPlayers(e.target.value)}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold hover:bg-purple-100 transition-all outline-none cursor-pointer"
            >
              <option value="all">👥 All Players</option>
              <option value="2">2 Players</option>
              <option value="3-4">3-4 Players</option>
              <option value="5+">5+ Players</option>
            </select>

            {/* Mood/Vibe Filter */}
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="px-3 py-1.5 bg-pink-50 text-pink-700 border border-pink-200 rounded-full text-xs font-semibold hover:bg-pink-100 transition-all outline-none cursor-pointer"
            >
              <option value="all">😊 All Moods</option>
              <option value="party">🎉 Party</option>
              <option value="strategic">🧠 Strategic</option>
              <option value="family-friendly">👨‍👩‍👧 Family</option>
              <option value="competitive">⚔️ Competitive</option>
              <option value="chill">😌 Chill</option>
            </select>

            {/* Occasion Filter */}
            <select
              value={filterOccasion}
              onChange={(e) => setFilterOccasion(e.target.value)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold hover:bg-blue-100 transition-all outline-none cursor-pointer"
            >
              <option value="all">🎪 All Occasions</option>
              <option value="bestseller">🏆 Bestseller</option>
              <option value="new">✨ New Release</option>
              <option value="trending">🔥 Trending</option>
              <option value="limited">⏳ Limited</option>
            </select>

            {/* Stock Status Chips */}
            {/* Stock Status Chips */}
            <button
              onClick={() => {
                const criticalProducts = products.filter(
                  (p) => p.stock.quantity <= 5 && p.stock.quantity > 0,
                );
                setFilteredProducts(criticalProducts);
              }}
              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold hover:bg-red-100 transition-all"
            >
              🚨 Critical Stock (
              {
                products.filter(
                  (p) => p.stock.quantity <= 5 && p.stock.quantity > 0,
                ).length
              }
              )
            </button>

            <button
              onClick={() => {
                const lowStockProducts = products.filter(
                  (p) => p.stock.quantity > 5 && p.stock.quantity <= 20,
                );
                setFilteredProducts(lowStockProducts);
              }}
              className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold hover:bg-orange-100 transition-all"
            >
              ⚠️ Low Stock (
              {
                products.filter(
                  (p) => p.stock.quantity > 5 && p.stock.quantity <= 20,
                ).length
              }
              )
            </button>

            {/* Clear All Filters */}
            {(filterCategory !== "all" ||
              filterPlayers !== "all" ||
              filterMood !== "all" ||
              filterOccasion !== "all" ||
              searchQuery) && (
              <button
                onClick={() => {
                  setFilterCategory("all");
                  setFilterPlayers("all");
                  setFilterMood("all");
                  setFilterOccasion("all");
                  setSearchQuery("");
                  setFilteredProducts(products);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-300 transition-all"
              >
                ✕ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredProducts.map((product) => {
                    const primaryImageUrl = getPrimaryImage(product);
                    const imageCount = product.images?.length || 0;
                    const stockStatus = getStockStatus(product);

                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-orange-50/30 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => toggleSelectProduct(product._id)}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                              <Image
                                src={primaryImageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                              {imageCount > 1 && (
                                <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold leading-none">
                                  +{imageCount - 1}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                  {product._id.slice(-8)}
                                </p>
                                {imageCount > 0 && (
                                  <span className="text-[10px] text-blue-600 font-semibold">
                                    📸 {imageCount}
                                  </span>
                                )}
                              </div>
                              {!product.slug && (
                                <p className="text-[10px] text-yellow-600 flex items-center gap-1 mt-1">
                                  <AlertCircle size={10} />
                                  No slug
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 text-sm">
                            {product.price.currency === "INR" ? "₹" : "$"}
                            {product.price.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-sm">
                          {product.meta?.players || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${stockStatus.color} ${stockStatus.pulse}`}
                          >
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            <Link
                              href={`/admin/products/${product._id}/edit`}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-all group/edit relative"
                              title="Edit product"
                            >
                              <Edit
                                size={18}
                                className="text-gray-500 group-hover/edit:text-blue-600 transition-colors"
                              />
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Edit
                              </span>
                            </Link>

                            {/* Delete Button */}
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group/delete relative"
                              onClick={() =>
                                handleDelete(product._id, product.name)
                              }
                              disabled={deleting === product._id}
                              title="Delete product"
                            >
                              {deleting === product._id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <Trash2
                                    size={18}
                                    className="text-gray-500 group-hover/delete:text-red-600 transition-colors"
                                  />
                                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/delete:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    Delete
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold mb-2 text-gray-900">
                No products found
              </p>
              <p className="text-gray-500 mb-6">
                {searchQuery ||
                filterCategory !== "all" ||
                filterPlayers !== "all" ||
                filterMood !== "all" ||
                filterOccasion !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first product"}
              </p>
              {(searchQuery ||
                filterCategory !== "all" ||
                filterPlayers !== "all" ||
                filterMood !== "all" ||
                filterOccasion !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCategory("all");
                    setFilterPlayers("all");
                    setFilterMood("all");
                    setFilterOccasion("all");
                    setFilteredProducts(products);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-gray-900 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm">
                  {selectedProducts.length}
                </div>
                <span className="font-semibold text-sm">
                  {selectedProducts.length} selected
                </span>
              </div>

              <div className="h-6 w-px bg-gray-700"></div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all text-sm font-bold"
                >
                  <Trash2 size={16} />
                  Delete All
                </button>

                <button
                  onClick={() => setSelectedProducts([])}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-all text-sm font-medium"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
