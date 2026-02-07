'use client';

import React, { useState, useRef } from 'react';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageUpload = ({ value, onChange, label = 'Featured Image', required = false }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF).');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      setPreview(result.url);
      onChange(result.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(value || '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInput = (e) => {
    const url = e.target.value;
    setPreview(url);
    onChange(url);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Upload Area */}
      <div className="space-y-3">
        {/* File Upload Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                <span className="text-sm font-medium text-neutral-600">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-600">Upload Image</span>
              </>
            )}
          </button>
          
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Remove</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview */}
        {preview && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => {
                toast.error('Failed to load image preview');
                setPreview('');
              }}
            />
          </div>
        )}

        {/* URL Input (Alternative) */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ImageIcon className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="url"
            value={value || ''}
            onChange={handleUrlInput}
            placeholder="Or enter image URL"
            className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-sm"
          />
        </div>

        <p className="text-xs text-neutral-500">
          Upload an image (max 5MB) or paste an image URL. Supported formats: JPEG, PNG, WebP, GIF
        </p>
      </div>
    </div>
  );
};

export default ImageUpload;
