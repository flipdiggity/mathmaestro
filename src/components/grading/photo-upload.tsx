'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onPhotosChanged: (files: File[]) => void;
  isLoading: boolean;
}

interface PhotoEntry {
  file: File;
  preview: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoUpload({ onPhotosChanged, isLoading }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length === 0) return;

      const newEntries: PhotoEntry[] = imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setPhotos((prev) => {
        const updated = [...prev, ...newEntries];
        onPhotosChanged(updated.map((p) => p.file));
        return updated;
      });
    },
    [onPhotosChanged]
  );

  const removePhoto = useCallback(
    (index: number) => {
      setPhotos((prev) => {
        URL.revokeObjectURL(prev[index].preview);
        const updated = prev.filter((_, i) => i !== index);
        onPhotosChanged(updated.map((p) => p.file));
        return updated;
      });
    },
    [onPhotosChanged]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
      }
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  // Photos have been selected — show thumbnail grid + add more button
  if (photos.length > 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div
              key={`${photo.file.name}-${index}`}
              className="relative group rounded-lg border overflow-hidden bg-muted/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt={`Page ${index + 1}`}
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                Page {index + 1}
              </div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                disabled={isLoading}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:pointer-events-none"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                {photo.file.name} ({formatFileSize(photo.file.size)})
              </div>
            </div>
          ))}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            flex items-center justify-center gap-2 rounded-lg border-2 border-dashed
            p-4 cursor-pointer transition-colors
            ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
            ${isLoading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Add another page
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} uploaded.
          Upload pages in order (page 1 first).
        </p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Empty state — show drop zone
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-4
          min-h-[240px] rounded-lg border-2 border-dashed
          cursor-pointer transition-colors
          ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
          ${isLoading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-muted p-4">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Take a photo or upload images
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag and drop, or click to select. You can upload multiple pages.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="sm:hidden bg-indigo-600"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); openCamera(); }}
          >
            <Camera className="h-3 w-3 mr-1" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-none"
            tabIndex={-1}
          >
            <Upload className="h-3 w-3 mr-1" />
            Choose Files
          </Button>
        </div>
      </div>
      {/* Camera-specific input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
