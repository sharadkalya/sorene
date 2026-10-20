import mongoose, { Schema } from 'mongoose';

export interface ISiteSettings {
  theme: string;
  updatedAt?: Date;
  createdAt?: Date;
}

const SiteSettingsSchema: Schema = new Schema(
  {
    theme: {
      type: String,
      required: true,
      default: 'sorvene',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
