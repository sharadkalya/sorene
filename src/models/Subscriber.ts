import mongoose from 'mongoose';

export interface ISubscriber {
  name: string;
  email: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubscriberSchema = new mongoose.Schema<ISubscriber>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email address',
      ],
    },
    count: {
      type: Number,
      default: 1,
      min: [1, 'Count must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient querying
SubscriberSchema.index({ email: 1 });
SubscriberSchema.index({ createdAt: -1 });

export default mongoose.models.Subscriber || 
  mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);
