'use client';

import { useRef, useState } from 'react';
import Button from '@/frontend/components/Button';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

/**
 * Reusable R2-backed image uploader for the admin catalog. Selecting files
 * uploads them to /api/admin/media and appends the returned public URLs.
 */
export default function ImageUploader({ images, onChange, max = 12 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      setError('Please choose image files.');
      return;
    }

    if (images.length + files.length > max) {
      setError(`You can upload at most ${max} images.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data?.error?.message || 'Upload failed. Please try again.');
        return;
      }

      const urls: string[] = data.files.map((file: { url: string }) => file.url);
      onChange([...images, ...urls]);
    } catch {
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (url: string) => {
    onChange(images.filter((image) => image !== url));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((image) => (
          <div key={image} className="relative">
            <img
              src={image}
              alt="Uploaded"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <Button
              type="button"
              onClick={() => removeImage(image)}
              variant="error"
              size="xs"
              shape="circle"
              className="absolute -top-2 -right-2"
              aria-label="Remove image"
            >
              ✕
            </Button>
          </div>
        ))}

        {images.length < max && (
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="h-20 w-20 flex-col gap-1"
          >
            {uploading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">Upload</span>
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error && <p className="text-error text-sm mt-1">{error}</p>}
      <p className="text-xs text-base-content/50 mt-1">
        {images.length}/{max} images · stored in Cloudflare R2
      </p>
    </div>
  );
}
