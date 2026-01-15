import { IBlog } from "../../../models/Blog";
import BlogCard from "./BlogCard";

interface BlogGridProps {
  blogs: IBlog[];
}

export default function BlogGrid({ blogs }: BlogGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">No blog posts found</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <BlogCard key={blog._id.toString()} blog={blog} />
      ))}
    </div>
  );
}
