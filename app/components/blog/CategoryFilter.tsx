'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FaFire } from 'react-icons/fa';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  stats?: {
    totalBlogs: number;
    totalCategories: number;
    popularTags: Array<{ name: string; count: number }>;
  };
}

export default function CategoryFilter({ 
  categories, 
  activeCategory,
  stats 
}: CategoryFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Game Stories & Experiences':
        return '🎮';
      case 'Event Highlights':
        return '🎉';
      case 'Strategy & Storytelling':
        return '📖';
      case 'Community Features':
        return '👥';
      default:
        return '📰';
    }
  };

  const getCategoryCount = (category: string) => {
    if (!stats) return 0;
    
    // This is a simplified count - in production, you'd get actual counts from API
    if (category === 'all') return stats.totalBlogs;
    
    // For demo purposes, estimate category counts
    const estimatedCount = Math.floor(stats.totalBlogs / categories.length);
    return estimatedCount;
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Categories</h3>
        {stats && (
          <span className="text-xs text-gray-500 bg-gray-900/50 px-2 py-1 rounded">
            {stats.totalCategories} categories
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {/* All Categories */}
        <Link
          href={`${pathname}?${createQueryString('category', 'all')}`}
          className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-500/30'
              : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-3">
            <span>📰</span>
            <span>All Articles</span>
          </span>
          <span className="text-sm bg-gray-700 px-2 py-1 rounded">
            {stats ? stats.totalBlogs : '...'}
          </span>
        </Link>
        
        {/* Individual Categories */}
        {categories.map((category) => (
          <Link
            key={category}
            href={`${pathname}?${createQueryString('category', category)}`}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              activeCategory === category
                ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-500/30'
                : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <span>{getCategoryIcon(category)}</span>
              <span className="truncate">{category}</span>
            </span>
            <span className="text-sm bg-gray-700 px-2 py-1 rounded">
              {getCategoryCount(category)}
            </span>
          </Link>
        ))}
      </div>
      
      {/* Popular Tags Section */}
      {stats?.popularTags && stats.popularTags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <FaFire className="w-4 h-4 text-orange-500" />
            <h4 className="text-sm font-semibold text-white">Trending Tags</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.popularTags.slice(0, 5).map((tag) => (
              <Link
                key={tag.name}
                href={`/blog?tag=${tag.name.toLowerCase()}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-700/30 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-sm transition-all"
              >
                <span>{tag.name}</span>
                <span className="text-xs text-gray-500">({tag.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}