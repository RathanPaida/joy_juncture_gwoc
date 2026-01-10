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

        const availableSlugs = listData.blogs?.map((b: Blog) => b.slug) || [];
        console.log("🔗 Available slugs:", availableSlugs);
        setDebugInfo(
          (prev) =>
            prev +
            `\n\nAvailable slugs: ${availableSlugs.join(", ")}\nLooking for: ${slug}`,
        );

        // Check if the slug exists in the list
        const matchingBlog = listData.blogs?.find((b: Blog) => b.slug === slug);
        if (matchingBlog) {
          console.log("✅ Found matching blog in list:", matchingBlog.title);

          // Check if it's published or user is author
          if (
            matchingBlog.status === "published" ||
            (user && matchingBlog.createdBy.userId === user.uid)
          ) {
            setBlog(matchingBlog);
            setLoading(false);
            return;
          } else {
            setError("This article is not yet published.");
            setLoading(false);
            return;
          }
        } else {
          console.log("❌ No matching blog found in list");
          setDebugInfo(
            (prev) =>
              prev +
              `\n\n❌ The slug "${slug}" was not found in the blog list.`,
          );
        }
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

        {/* Cover Image */}
        {blog.coverImage && (
          <div className="blog-cover-image">
            <img src={blog.coverImage} alt={blog.title} />
          </div>
        )}

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
          </header>

          <div className="blog-content">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetailPage;
