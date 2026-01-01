import Link from 'next/link';
import { IBlog } from '../../../models/Blog';
import { FaArrowRight, FaStar } from 'react-icons/fa';

interface FeaturedBlogsProps {
  blogs: IBlog[];
}

export default function FeaturedBlogs({ blogs }: FeaturedBlogsProps) {
  if (blogs.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
            <FaStar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Featured Guides</h2>
        </div>
        <Link 
          href="/blog?featured=true"
          className="flex items-center gap-2 text-orange-500 hover:text-orange-400 font-semibold"
        >
          View All Featured
          <FaArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blogs.map((blog, index) => (
          <Link 
            key={blog._id.toString()} 
            href={`/blog/${blog.slug}`}
            className="group"
          >
            <div className="relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-b from-gray-800/30 to-gray-900/30 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
              {/* Featured Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <FaStar className="w-3 h-3" />
                  Featured
                </span>
              </div>
              
              {/* Number Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className="w-8 h-8 flex items-center justify-center bg-gray-900/80 text-white text-sm font-bold rounded-full">
                  #{index + 1}
                </span>
              </div>
              
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                    {blog.category.split(' ')[0]}
                  </span>
                  <span className="text-sm text-gray-500">{blog.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                  {blog.title}
                </h3>
                
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {blog.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {blog.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{blog.author.name}</div>
                      <div className="text-xs text-gray-500">{blog.author.role}</div>
                    </div>
                  </div>
                  <span className="text-orange-500 group-hover:text-orange-400 transition-colors">
                    Read →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}