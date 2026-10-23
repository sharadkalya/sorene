import mongoose, { Schema, type Types } from 'mongoose';

export type ProductStatus = 'draft' | 'active';

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  categories: Types.ObjectId[];
  collections: Types.ObjectId[];
  status: ProductStatus;
  featured: boolean;
  materialInfo?: string;
  manufacturingInfo?: string;
  stockQuantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [160, 'Name cannot exceed 160 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: [0, 'Compare-at price cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    categories: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
    },
    collections: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'active'],
      default: 'draft',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    materialInfo: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Material info cannot exceed 500 characters'],
    },
    manufacturingInfo: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Manufacturing info cannot exceed 500 characters'],
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock quantity must be a whole number',
      },
    },
  },
  {
    timestamps: true,
  },
);

ProductSchema.index({ slug: 1 });
ProductSchema.index({ status: 1, featured: -1, createdAt: -1 });

export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);
