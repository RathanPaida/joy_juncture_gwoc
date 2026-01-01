import mongoose, { Schema, Model, HydratedDocument, Document } from 'mongoose';

/* =========================
   Category Type
========================= */
export type BlogCategory =
  | 'Game Stories & Experiences'
  | 'Event Highlights'
  | 'Strategy & Storytelling'
  | 'Community Features';

/* =========================
   Interfaces
========================= */
interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
}

interface BlogAuthor {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: BlogCategory;

  coverImage: string;
  images?: string[];
  thumbnail?: string;

  author: BlogAuthor;

  publishedDate: Date;
  readTime: string;

  likes: number;
  comments: number;
  shares: number;
  views: number;

  featured: boolean;
  tags: string[];
  seo: SeoMetadata;

  status: 'draft' | 'published' | 'archived';

  createdAt: Date;
  updatedAt: Date;

  createdBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;

  // Virtuals
  formattedDate?: string;
  readTimeMinutes?: string;
}

/* =========================
   Static Methods Interface
========================= */
interface BlogModelStatics {
  findByCategory(category: BlogCategory): Promise<HydratedDocument<IBlog>[]>;
  findFeatured(limit?: number): Promise<HydratedDocument<IBlog>[]>;
  findByTag(tag: string): Promise<HydratedDocument<IBlog>[]>;
}

/* =========================
   Schema
========================= */
const BlogSchema = new Schema<IBlog>(
  {
    title: { 
      type: String, 
      required: [true, 'Title is required'], 
      trim: true, 
      minlength: [10, 'Title must be at least 10 characters'], 
      maxlength: [200, 'Title cannot exceed 200 characters'] 
    },
    slug: { 
      type: String, 
      unique: true, 
      lowercase: true, 
      trim: true,
      required: [true, 'Slug is required']
    },
    excerpt: { 
      type: String, 
      minlength: [50, 'Excerpt must be at least 50 characters'], 
      maxlength: [300, 'Excerpt cannot exceed 300 characters'] 
    },
    content: { 
      type: String, 
      required: [true, 'Content is required'], 
      minlength: [500, 'Content must be at least 500 characters'] 
    },

    category: {
      type: String,
      enum: {
        values: ['Game Stories & Experiences', 'Event Highlights', 'Strategy & Storytelling', 'Community Features'],
        message: '{VALUE} is not a valid category'
      },
      required: [true, 'Category is required']
    },

    coverImage: { 
      type: String, 
      required: [true, 'Cover image is required'] 
    },
    images: [String],
    thumbnail: String,

    author: {
      name: { 
        type: String, 
        required: [true, 'Author name is required'] 
      },
      role: { 
        type: String, 
        default: 'Contributor' 
      },
      avatar: String,
      bio: String
    },

    publishedDate: { 
      type: Date, 
      default: Date.now 
    },
    readTime: { 
      type: String, 
      default: '5 min read' 
    },

    likes: { 
      type: Number, 
      default: 0,
      min: 0
    },
    comments: { 
      type: Number, 
      default: 0,
      min: 0
    },
    shares: { 
      type: Number, 
      default: 0,
      min: 0
    },
    views: { 
      type: Number, 
      default: 0,
      min: 0
    },

    featured: { 
      type: Boolean, 
      default: false 
    },
    tags: [String],

    seo: {
      title: String,
      description: String,
      keywords: [String]
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },

    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'Created by is required'] 
    },
    lastEditedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* =========================
   Virtuals
========================= */
BlogSchema.virtual('formattedDate').get(function(this: IBlog) {
  return this.publishedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

BlogSchema.virtual('readTimeMinutes').get(function(this: IBlog) {
  const words = this.content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
});

/* =========================
   Middleware
========================= */
BlogSchema.pre('save', async function (this: HydratedDocument<IBlog>) {
  // Generate slug if not provided
  if (!this.slug || this.isModified('title')) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    // Check for existing slugs
    let slug = baseSlug;
    let counter = 1;
    const BlogModel = this.constructor as Model<IBlog>;
    
    while (await BlogModel.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }

  // Calculate read time
  if (this.isModified('content')) {
    const words = this.content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    this.readTime = minutes <= 1 ? '1 min read' : `${minutes} min read`;
  }

  // Generate excerpt if not provided
  if (!this.excerpt || this.isModified('content')) {
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 200).trim() + '...';
  }
});

/* =========================
   Instance Methods
========================= */
BlogSchema.methods.incrementViews = async function (this: HydratedDocument<IBlog>): Promise<void> {
  this.views += 1;
  await this.save();
};

BlogSchema.methods.incrementLikes = async function (this: HydratedDocument<IBlog>): Promise<void> {
  this.likes += 1;
  await this.save();
};

BlogSchema.methods.incrementComments = async function (this: HydratedDocument<IBlog>): Promise<void> {
  this.comments += 1;
  await this.save();
};

/* =========================
   Static Methods
========================= */
BlogSchema.statics.findByCategory = function (category: BlogCategory): Promise<HydratedDocument<IBlog>[]> {
  return this.find({ category, status: 'published' })
    .sort({ publishedDate: -1 })
    .exec();
};

BlogSchema.statics.findFeatured = function (limit = 5): Promise<HydratedDocument<IBlog>[]> {
  return this.find({ featured: true, status: 'published' })
    .sort({ publishedDate: -1 })
    .limit(limit)
    .exec();
};

BlogSchema.statics.findByTag = function (tag: string): Promise<HydratedDocument<IBlog>[]> {
  return this.find({ 
    tags: { $regex: new RegExp(tag, 'i') }, 
    status: 'published' 
  })
  .sort({ publishedDate: -1 })
  .exec();
};

/* =========================
   Indexes
========================= */
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ category: 1, status: 1, publishedDate: -1 });
BlogSchema.index({ featured: 1, status: 1, publishedDate: -1 });
BlogSchema.index({ tags: 1, status: 1 });
BlogSchema.index({ status: 1, publishedDate: -1 });
BlogSchema.index({ createdAt: -1 });

// Text search index
BlogSchema.index(
  { title: 'text', excerpt: 'text', content: 'text', tags: 'text' },
  { 
    weights: { title: 10, excerpt: 5, tags: 3, content: 1 },
    name: 'blog_search_index'
  }
);

/* =========================
   Model Export
========================= */
export type BlogModel = Model<IBlog> & BlogModelStatics;

export const Blog =
  (mongoose.models.Blog as BlogModel) ||
  mongoose.model<IBlog, BlogModel>('Blog', BlogSchema);