import mongoose from 'mongoose';

export type BlogStatus = 'draft' | 'published';

export interface IBlogPost {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
  status: BlogStatus;
  publishedAt: Date | null;
  authorName: string;
  canonicalUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogPostSchema = new mongoose.Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    metaDescription: {
      type: String,
      default: '',
      maxlength: [300, 'Meta description cannot exceed 300 characters'],
    },
    excerpt: {
      type: String,
      default: '',
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
      maxlength: [200000, 'Content is too long'],
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    authorName: {
      type: String,
      default: '',
      maxlength: [100, 'Author name cannot exceed 100 characters'],
    },
    canonicalUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
