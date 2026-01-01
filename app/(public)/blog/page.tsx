import BlogGrid from '../../components/blog/BlogGrid';
import CategoryFilter from '../../components/blog/CategoryFilter';
import SearchBar from '../../components/blog/SarchBar';
import FeaturedBlogs from '../../components/blog/FeaturedBlogs';
import Newsletter from '../../components/blog/NewsLetter';
import connectDb from '@/lib/mongodb';
import { Blog } from '../../../models/Blog';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog & Gameplay Guides | JoyJuncture',
  description: 'Discover expert gameplay guides, event highlights, community stories, and strategy tips for all your favorite JoyJuncture games.',
  keywords: ['game guides', 'strategy tips', 'gameplay', 'board games', 'card games', 'events', 'community'],
  openGraph: {
    title: 'Blog & Gameplay Guides | JoyJuncture',
    description: 'Master your favorite games with our comprehensive gameplay guides and community stories.',
    type: 'website',
    images: ['/og-blog.jpg'],
    url: 'https://joyjuncture.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog & Gameplay Guides | JoyJuncture',
    description: 'Master your favorite games with our comprehensive gameplay guides and community stories.',
    images: ['/og-blog.jpg'],
  },
};

const BLOG_CATEGORIES = [
  'Game Stories & Experiences',
  'Event Highlights', 
  'Strategy & Storytelling',
  'Community Features'
];

const POPULAR_TAGS = [
  'Strategy',
  'Events', 
  'Community',
  'Tips',
  'Beginners',
  'Advanced',
  'Game Night',
  'Corporate',
  'Weddings',
  'Team Building'
];

async function getBlogs(category?: string, searchQuery?: string, page: number = 1, limit: number = 12) {
  try {
    await connectDb();
    
    const query: any = { status: 'published' };
    const skip = (page - 1) * limit;
    
    if (searchQuery && searchQuery.length >= 2) {
      // Text search across multiple fields
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { excerpt: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } },
        { 'author.name': { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ];
    } else if (category && category !== 'all') {
      query.category = category;
    }
    
    // Get total count for pagination
    const total = await Blog.countDocuments(query);
    
    // Get blogs with pagination
    const blogs = await Blog.find(query)
      .sort({ featured: -1, publishedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content')
      .lean();
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      blogs: JSON.parse(JSON.stringify(blogs)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return {
      blogs: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

async function getFeaturedBlogs() {
  try {
    await connectDb();
    
    const featuredBlogs = await Blog.find({ 
      status: 'published',
      featured: true 
    })
    .sort({ publishedDate: -1 })
    .limit(3)
    .select('-content')
    .lean();
    
    return JSON.parse(JSON.stringify(featuredBlogs));
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    return [];
  }
}

async function getBlogStats() {
  try {
    await connectDb();
    
    const totalBlogs = await Blog.countDocuments({ status: 'published' });
    const totalCategories = BLOG_CATEGORIES.length;
    
    // Get most popular tags count
    const tagCounts = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    return {
      totalBlogs,
      totalCategories,
      popularTags: tagCounts.map(tag => ({ name: tag._id, count: tag.count }))
    };
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return {
      totalBlogs: 0,
      totalCategories: 0,
      popularTags: []
    };
  }
}

export default async function BlogPage({
  searchParams
}: {
  searchParams: { 
    category?: string; 
    q?: string;
    page?: string;
    tag?: string;
  }
}) {
  const category = searchParams.category || 'all';
  const searchQuery = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');
  const tag = searchParams.tag;
  
  const [{ blogs, pagination }, featuredBlogs, stats] = await Promise.all([
    getBlogs(category !== 'all' ? category : undefined, searchQuery, page),
    getFeaturedBlogs(),
    getBlogStats()
  ]);

  const currentSearchTitle = searchQuery 
    ? `Search Results for "${searchQuery}"`
    : tag
    ? `Articles tagged "${tag}"`
    : category !== 'all'
    ? `${category}`
    : 'Latest Articles';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-blue-500/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300">Welcome to JoyJuncture Blog</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {currentSearchTitle}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              {searchQuery 
                ? `Found ${pagination.total} article${pagination.total !== 1 ? 's' : ''} matching your search`
                : tag
                ? `Explore ${pagination.total} article${pagination.total !== 1 ? 's' : ''} about ${tag}`
                : 'Master your favorite games, discover event highlights, and join our thriving community of players.'
              }
            </p>
            
            <SearchBar />
          </div>
        </div>
      </section>
      
      {/* Featured Blogs Section */}
      {!searchQuery && !tag && category === 'all' && featuredBlogs.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <FeaturedBlogs blogs={featuredBlogs} />
          </div>
        </section>
      )}
      
      {/* Main Content */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-1/4">
              <div className="sticky top-24 space-y-6">
                {/* Category Filter */}
                <CategoryFilter 
                  categories={BLOG_CATEGORIES} 
                  activeCategory={category}
                  stats={stats}
                />
                
                {/* Popular Tags */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Popular Tags</h3>
                    <span className="text-xs text-gray-500 bg-gray-900/50 px-2 py-1 rounded">
                      {stats.popularTags.length} tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <a
                        key={tag}
                        href={`/blog?tag=${tag.toLowerCase()}`}
                        className="px-3 py-1.5 bg-gray-700/30 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-sm transition-all duration-300 hover:scale-105"
                      >
                        {tag}
                      </a>
                    ))}
                  </div>
                </div>
                
                {/* Blog Stats */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Blog Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Articles</span>
                      <span className="text-orange-500 font-bold">{stats.totalBlogs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Categories</span>
                      <span className="text-blue-500 font-bold">{stats.totalCategories}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Featured</span>
                      <span className="text-purple-500 font-bold">{featuredBlogs.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Newsletter Signup */}
                <Newsletter />
              </div>
            </aside>
            
            {/* Main Content Area */}
            <main className="lg:w-3/4">
              {/* Header with Filter Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {currentSearchTitle}
                  </h2>
                  <p className="text-gray-400 mt-2">
                    {searchQuery || tag || category !== 'all'
                      ? `Showing ${blogs.length} of ${pagination.total} articles`
                      : 'Browse our latest gameplay guides and community stories'
                    }
                  </p>
                </div>
                
                {/* Sort Options */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Sort by:
                  </div>
                  <select 
                    className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    defaultValue="newest"
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="featured">Featured</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
              
              {/* Blog Grid */}
              <BlogGrid blogs={blogs} />
              
              {/* No Results Message */}
              {blogs.length === 0 && (
                <div className="text-center py-16 px-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                  <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gray-700/50 rounded-full">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No articles found
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    {searchQuery 
                      ? `We couldn't find any articles matching "${searchQuery}". Try a different search term.`
                      : tag
                      ? `No articles found with tag "${tag}".`
                      : 'No articles available in this category.'
                    }
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <a 
                      href="/blog"
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      View All Articles
                    </a>
                    {searchQuery && (
                      <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Pagination */}
              {pagination.totalPages > 1 && blogs.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <nav className="flex items-center gap-2">
                    <a
                      href={`/blog?page=${pagination.page - 1}${category !== 'all' ? `&category=${category}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className={`px-4 py-2 rounded-lg border ${
                        !pagination.hasPrevPage
                          ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-orange-500 hover:text-orange-400'
                      }`}
                      aria-disabled={!pagination.hasPrevPage}
                    >
                      ← Previous
                    </a>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = pageNum === pagination.page;
                      return (
                        <a
                          key={pageNum}
                          href={`/blog?page=${pageNum}${category !== 'all' ? `&category=${category}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
                          className={`px-4 py-2 rounded-lg border ${
                            isCurrent
                              ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500'
                          }`}
                        >
                          {pageNum}
                        </a>
                      );
                    })}
                    
                    {pagination.totalPages > 5 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    
                    <a
                      href={`/blog?page=${pagination.page + 1}${category !== 'all' ? `&category=${category}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className={`px-4 py-2 rounded-lg border ${
                        !pagination.hasNextPage
                          ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-orange-500 hover:text-orange-400'
                      }`}
                      aria-disabled={!pagination.hasNextPage}
                    >
                      Next →
                    </a>
                  </nav>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl p-8 sm:p-12 border border-gray-700/50 backdrop-blur-sm">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Want to Share Your Game Story?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our community of writers and share your gaming experiences, strategies, and event highlights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
              >
                Submit Your Story
              </a>
              <a
                href="/games"
                className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Explore Games
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}