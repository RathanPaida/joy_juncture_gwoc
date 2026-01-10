// models/Discussion.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// Reply Interface
export interface IReply {
  _id: Types.ObjectId;
  content: string;
  authorId: string;
  authorName: string;
  likes: number;
  likedBy: string[];
  isAuthor: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussion extends Document {
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  replies: string[];
  likes: number;
  likedBy: string[];
  isHot: boolean;
  isPinned: boolean;
  tags: string[];
  status: 'active' | 'archived' | 'deleted';
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Reply Schema
const replySchema = new Schema<IReply>({
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  authorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  authorName: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String,
    ref: 'User'
  }],
  isAuthor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Discussion Schema
const discussionSchema = new Schema<IDiscussion>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['Game Strategy', 'Tips & Tricks', 'Community', 'News', 'General']
  },
  authorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  authorName: {
    type: String,
    required: true
  },
  replies: [replySchema], // Changed from number to array of replies
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String,
    ref: 'User'
  }],
  isHot: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
discussionSchema.index({ authorId: 1, createdAt: -1 });
discussionSchema.index({ category: 1, createdAt: -1 });
discussionSchema.index({ isHot: 1 });
discussionSchema.index({ isPinned: 1 });
discussionSchema.index({ 'replies.createdAt': -1 });
discussionSchema.index({ tags: 1 });

// Virtual field for reply count
discussionSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to add reply
discussionSchema.methods.addReply = async function(replyData: {
  content: string;
  authorId: string;
  authorName: string;
}) {
  const reply = {
    ...replyData,
    isAuthor: replyData.authorId === this.authorId
  };
  
  this.replies.push(reply);
  return await this.save();
};

// Method to like/unlike discussion
discussionSchema.methods.toggleLike = async function(userId: string) {
  const index = this.likedBy.indexOf(userId);
  
  if (index === -1) {
    // Like
    this.likedBy.push(userId);
    this.likes += 1;
  } else {
    // Unlike
    this.likedBy.splice(index, 1);
    this.likes = Math.max(0, this.likes - 1);
  }
  
  return await this.save();
};

// Method to like/unlike reply
discussionSchema.methods.toggleReplyLike = async function(replyId: string, userId: string) {
  const reply = this.replies.id(replyId);
  if (!reply) throw new Error('Reply not found');
  
  const index = reply.likedBy.indexOf(userId);
  
  if (index === -1) {
    reply.likedBy.push(userId);
    reply.likes += 1;
  } else {
    reply.likedBy.splice(index, 1);
    reply.likes = Math.max(0, reply.likes - 1);
  }
  
  return await this.save();
};

export const Discussion = mongoose.models.Discussion || mongoose.model<IDiscussion>('Discussion', discussionSchema);