'use client';

import React, { useState } from 'react';
import './blog.css';
import { FaSearch, FaCalendar, FaUser, FaTags, FaHeart, FaComment, FaShare, FaFilter, FaFire, FaNewspaper, FaGamepad, FaUsers } from 'react-icons/fa';

// Mock blog data
const blogPosts = [
  {
    id: 1,
    title: "How Board Games Saved Our Remote Team",
    excerpt: "Discover how we transformed a struggling remote team into a cohesive unit through weekly game nights and collaborative play.",
    category: "Corporate",
    date: "2024-03-15",
    author: "Alex Chen",
    readTime: "5 min read",
    likes: 142,
    comments: 23,
    featured: true,
    tags: ["team-building", "remote-work", "corporate-games"]
  },
  {
    id: 2,
    title: "The Psychology Behind Game Night Bonding",
    excerpt: "Why do games create such strong social bonds? We explore the science behind shared play and connection.",
    category: "Psychology",
    date: "2024-03-10",
    author: "Dr. Sarah Johnson",
    readTime: "7 min read",
    likes: 89,
    comments: 15,
    featured: true,
    tags: ["psychology", "social-bonding", "game-theory"]
  },
  {
    id: 3,
    title: "Creating the Perfect Wedding Game Experience",
    excerpt: "From ice-breakers to custom trivia, learn how to make your wedding unforgettable with interactive games.",
    category: "Occasions",
    date: "2024-03-05",
    author: "Maya Rodriguez",
    readTime: "6 min read",
    likes: 76,
    comments: 12,
    featured: false,
    tags: ["weddings", "events", "custom-games"]
  },
  {
    id: 4,
    title: "Behind the Scenes: Designing 'Dead Man's Deck'",
    excerpt: "A deep dive into the creative process behind our most popular mystery card game.",
    category: "Design",
    date: "2024-02-28",
    author: "Jamal Williams",
    readTime: "8 min read",
    likes: 203,
    comments: 42,
    featured: false,
    tags: ["game-design", "behind-scenes", "creative-process"]
  },
  {
    id: 5,
    title: "10 Ice-Breaker Games for Awkward Gatherings",
    excerpt: "Never face an awkward silence again with these proven ice-breaker games for any occasion.",
    category: "Tips",
    date: "2024-02-22",
    author: "Priya Sharma",
    readTime: "4 min read",
    likes: 165,
    comments: 31,
    featured: false,
    tags: ["ice-breakers", "social-tips", "party-games"]
  },
  {
    id: 6,
    title: "The Rise of Play in Corporate Wellness Programs",
    excerpt: "How forward-thinking companies are using games to reduce burnout and boost employee happiness.",
    category: "Corporate",
    date: "2024-02-18",
    author: "David Park",
    readTime: "6 min read",
    likes: 94,
    comments: 18,
    featured: false,
    tags: ["corporate-wellness", "employee-engagement", "workplace-culture"]
  }
];

const categories = ["All", "Corporate", "Psychology", "Occasions", "Design", "Tips", "Community"];
const tags = ["team-building", "remote-work", "weddings", "game-design", "ice-breakers", "psychology"];

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  const handleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
    } else {
      setLikedPosts([...likedPosts, postId]);
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="hero-content">
          <h1>Stories from the <span className="highlight">Playground</span></h1>
          <p className="subtitle">Dive into game strategies, community stories, event highlights, and the science of play.</p>
          
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for stories, tips, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>
          
          <div className="trending-tags">
            <span className="trending-label">
              <FaFire /> Trending Topics:
            </span>
            {tags.map(tag => (
              <button 
                key={tag} 
                className="tag-btn"
                onClick={() => setSearchQuery(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">150+</span>
            <span className="stat-label">Stories Published</span>
          </div>
          <div className="stat">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Community Comments</span>
          </div>
          <div className="stat">
            <span className="stat-number">5K+</span>
            <span className="stat-label">Story Likes</span>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2><FaNewspaper /> Featured <span className="highlight">Stories</span></h2>
          <p className="section-subtitle">Most loved and discussed articles from our community</p>
        </div>
        
        <div className="featured-grid">
          {featuredPosts.map(post => (
            <div key={post.id} className="featured-card">
              <div className="featured-badge">Featured</div>
              <div className="card-content">
                <div className="card-category">{post.category}</div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="card-meta">
                  <span><FaUser /> {post.author}</span>
                  <span><FaCalendar /> {post.date}</span>
                  <span>{post.readTime}</span>
                </div>
                <div className="card-actions">
                  <button 
                    className={`like-btn ${likedPosts.includes(post.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <FaHeart /> {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                  </button>
                  <button className="comment-btn">
                    <FaComment /> {post.comments}
                  </button>
                  <button className="share-btn">
                    <FaShare /> Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="blog-content">
        {/* Sidebar */}
        <aside className="blog-sidebar">
          <div className="sidebar-section">
            <h3><FaFilter /> Categories</h3>
            <div className="category-list">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                  <span className="post-count">
                    {category === "All" 
                      ? blogPosts.length 
                      : blogPosts.filter(p => p.category === category).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3><FaTags /> Popular Tags</h3>
            <div className="tag-cloud">
              {tags.map(tag => (
                <button 
                  key={tag} 
                  className="tag"
                  onClick={() => setSearchQuery(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3><FaGamepad /> Play & Earn Points</h3>
            <div className="points-card">
              <p>Read blog posts and earn Game Points!</p>
              <div className="points-info">
                <span className="points-value">+10 points per article</span>
                <span className="points-value">+25 points for commenting</span>
                <span className="points-value">+50 points for sharing</span>
              </div>
              <a href="/wallet" className="btn-primary">Check Your Points</a>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3><FaUsers /> Community Spotlight</h3>
            <div className="community-spotlight">
              <div className="spotlight-item">
                <div className="spotlight-avatar">JS</div>
                <div className="spotlight-content">
                  <h4>Jessica S.</h4>
                  <p>Shared 5 game night photos</p>
                  <span className="spotlight-points">+150 points earned</span>
                </div>
              </div>
              <div className="spotlight-item">
                <div className="spotlight-avatar">MK</div>
                <div className="spotlight-content">
                  <h4>Marcus K.</h4>
                  <p>Top commenter this month</p>
                  <span className="spotlight-points">+320 points earned</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Blog Posts */}
        <main className="blog-posts">
          <div className="posts-header">
            <h2>Latest Stories</h2>
            <div className="sort-options">
              <span>Sort by:</span>
              <select>
                <option>Most Recent</option>
                <option>Most Popular</option>
                <option>Most Comments</option>
              </select>
            </div>
          </div>
          
          <div className="posts-grid">
            {filteredPosts.map(post => (
              <article key={post.id} className="post-card">
                <div className="post-header">
                  <span className="post-category">{post.category}</span>
                  <span className="post-date"><FaCalendar /> {post.date}</span>
                </div>
                
                <h3>{post.title}</h3>
                <p className="post-excerpt">{post.excerpt}</p>
                
                <div className="post-meta">
                  <span className="post-author"><FaUser /> {post.author}</span>
                  <span className="post-read-time">{post.readTime}</span>
                </div>
                
                <div className="post-tags">
                  {post.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`action-btn like-btn ${likedPosts.includes(post.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <FaHeart /> {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                  </button>
                  <button className="action-btn">
                    <FaComment /> {post.comments}
                  </button>
                  <button className="action-btn">
                    <FaShare /> Share
                  </button>
                  <a href={`/blog/${post.id}`} className="read-more">Read More →</a>
                </div>
              </article>
            ))}
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="no-results">
              <h3>No stories found</h3>
              <p>Try a different search term or category</p>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {/* Pagination */}
          <div className="pagination">
            <button className="pagination-btn disabled">Previous</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <span className="pagination-ellipsis">...</span>
            <button className="pagination-btn">8</button>
            <button className="pagination-btn">Next</button>
          </div>
        </main>
      </div>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Join Our Story Circle</h2>
          <p>Get weekly game stories, event updates, and exclusive community content delivered to your inbox.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Your email address" />
            <button className="btn-primary">Subscribe</button>
          </div>
          <p className="newsletter-note">By subscribing, you agree to our Privacy Policy and may receive Game Points rewards!</p>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;