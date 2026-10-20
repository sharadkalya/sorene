import mongoose from 'mongoose';

export interface ICollection {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CollectionSchema = new mongoose.Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
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
      default: '',
      maxlength: [600, 'Description cannot exceed 600 characters'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

CollectionSchema.index({ slug: 1 });
CollectionSchema.index({ isActive: 1 });

export default mongoose.models.Collection ||
  mongoose.model<ICollection>('Collection', CollectionSchema);
