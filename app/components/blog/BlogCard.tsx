import { IBlog } from '../../../models/Blog';
import Link from 'next/link';
import { FaHeart, FaComment, FaClock, FaUser } from 'react-icons/fa';

interface BlogCardProps {
  blog: IBlog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Game Stories & Experiences':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Event Highlights':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Strategy & Storytelling':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Community Features':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Link href={`/blog/${blog.slug}`}>
      <article className="group relative bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1">
        {/* Featured Badge */}
        {blog.featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
              Featured
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(blog.category)}`}>
            {blog.category.split(' ')[0]}
          </span>
        </div>
        
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent z-10"></div>
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
            {blog.title}
          </h3>
          
          <p className="text-gray-400 mb-4 line-clamp-2">
            {blog.excerpt}
          </p>
          
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <FaUser className="w-4 h-4" />
              <span>{blog.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="w-4 h-4" />
              <span>{blog.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaHeart className="w-4 h-4" />
              <span>{blog.likes}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaComment className="w-4 h-4" />
              <span>{blog.comments}</span>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Read More Link */}
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <span className="text-orange-500 font-semibold text-sm group-hover:text-orange-400 transition-colors">
              Read Guide →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}