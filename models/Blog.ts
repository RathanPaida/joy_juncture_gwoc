// models/Blog.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
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
    role: string;
  };
  createdBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
  status: 'draft' | 'published';
  featured: boolean;
  readTime?: number;
  views: number;
  likes: number;
  comments: number;
  publishedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: 500
    },
    content: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
      default: null
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Game Stories & Experiences',
        'Event Highlights',
        'Strategy & Storytelling',
        'Community Features'
      ]
    },
    tags: {
      type: [String],
      default: []
    },
    author: {
      name: {
        type: String,
        required: true
      },
      avatar: String,
      role: {
        type: String,
        default: 'user'
      }
    },
    createdBy: {
      userId: {
        type: String,
        required: true,
        index: true
      },
      userName: {
        type: String,
        required: true
      },
      userRole: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    featured: {
      type: Boolean,
      default: false
    },
    readTime: {
      type: Number,
      default: 5
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    publishedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ featured: 1 });
BlogSchema.index({ publishedDate: -1 });
BlogSchema.index({ 'createdBy.userId': 1 });

export const Blog = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);