// app/blog/[slug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  FaArrowLeft,
  FaCalendar,
  FaUser,
  FaClock,
  FaTag,
  FaStar,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import "./blog-detail.css";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  images?: string[];
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  createdBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  status: "draft" | "published";
  featured: boolean;
  readTime?: number;
  publishedDate?: string;
  createdAt?: string;
  views?: number;
}

const BlogDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Fetching blog with slug:", slug);
      setDebugInfo(`Attempting to fetch blog with slug: ${slug}`);

      // First, let's check what blogs are available
      // Note: We don't return early here because the list API excludes 'content'
      const listResponse = await fetch("/api/blogs");
      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log(
          "📋 Available blogs:",
          listData.blogs?.map((b: Blog) => ({
            title: b.title,
            slug: b.slug,
            status: b.status,
          })),
        );
      }

      // If direct list lookup didn't work, try the API endpoints
      console.log("🔄 Trying API endpoint: /api/blogs/" + slug);
      let response = await fetch(`/api/blogs/${slug}`);

      if (!response.ok) {
        console.log("🔄 Trying alternate endpoint: /api/blog/" + slug);
        response = await fetch(`/api/blog/${slug}`);
      }

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Blog data received:", data);

        if (data.blog) {
          if (
            data.blog.status === "published" ||
            (user && data.blog.createdBy.userId === user.uid)
          ) {
            setBlog(data.blog);
          } else {
            setError("This article is not yet published.");
          }
        } else {
          setError("Blog post not found in response");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error response:", errorData);
        setError(`Blog post not found (${response.status})`);
        setDebugInfo(
          (prev) =>
            prev +
            `\n\nAPI Error: ${response.status} - ${JSON.stringify(errorData)}`,
        );
      }
    } catch (error) {
      console.error("💥 Error fetching blog:", error);
      setError("Failed to load blog post. Please try again.");
      setDebugInfo((prev) => prev + `\n\nException: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="blog-detail-page">
        <div className="not-found">
          <h1>🔍 Blog Post Not Found</h1>
          <p>
            {error ||
              "The article you're looking for doesn't exist or may have been removed."}
          </p>

          <div
            style={{
              background: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px",
              marginTop: "20px",
              textAlign: "left",
              fontSize: "0.85rem",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              maxWidth: "600px",
              margin: "20px auto",
            }}
          >
            <strong>Debug Information:</strong>
            <br />
            Requested slug: <code>{slug}</code>
            {debugInfo && (
              <>
                <br />
                <br />
                {debugInfo}
              </>
            )}
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <button onClick={() => router.push("/blog")}>
              <FaArrowLeft /> Back to Blogs
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#6366f1" }}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-detail-page">
      <div className="blog-detail-container">
        {/* Header */}
        <div className="blog-header">
          <button className="back-btn" onClick={() => router.push("/blog")}>
            <FaArrowLeft /> Back to Blogs
          </button>

          {blog.featured && (
            <div className="featured-badge">
              <FaStar /> Featured Post
            </div>
          )}
        </div>

        {/* Carousel / Cover Image */}
        {(() => {
          const allImages = [];
          if (blog.coverImage) allImages.push(blog.coverImage);
          if (blog.images && blog.images.length > 0) allImages.push(...blog.images);

          if (allImages.length === 0) return null;

          if (allImages.length === 1) {
            return (
              <div className="blog-cover-image">
                <img src={allImages[0]} alt={blog.title} />
              </div>
            );
          }

          // Carousel Logic
          const [currentSlide, setCurrentSlide] = useState(0);

          const nextSlide = () => {
            setCurrentSlide((prev) => (prev + 1) % allImages.length);
          };

          const prevSlide = () => {
            setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length);
          };

          return (
            <div className="blog-cover-image relative group">
              <img src={allImages[currentSlide]} alt={`${blog.title} - Slide ${currentSlide + 1}`} className="w-full h-full object-cover transition-opacity duration-500" />

              {/* Navigation Buttons */}
              <button
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <FaArrowLeft />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${currentSlide === idx ? 'bg-orange-500' : 'bg-white/50 hover:bg-white'}`}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Blog Content */}
        <article className="blog-article">
          <header>
            <h1>{blog.title}</h1>

            <div className="blog-meta">
              <span className="meta-item">
                <FaUser /> {blog.createdBy.userName}
              </span>
              <span className="meta-item">
                <FaCalendar />{" "}
                {new Date(
                  blog.publishedDate || blog.createdAt!,
                ).toLocaleDateString()}
              </span>
              {blog.readTime && (
                <span className="meta-item">
                  <FaClock /> {blog.readTime} min read
                </span>
              )}
              <span className="meta-item">
                <FaTag /> {blog.category}
              </span>
            </div>

            <div className="blog-tags">
              {blog.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>

            {blog.excerpt && (
              <p className="blog-excerpt text-xl text-gray-300 italic my-6 border-l-4 border-orange-500 pl-4 py-2">
                {blog.excerpt}
              </p>
            )}
          </header>



          {/* Blog Content */}
          <div className="blog-content">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;
