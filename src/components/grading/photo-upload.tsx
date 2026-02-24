'use client';

import { useCallback, useRef, useState } from 'react';
import { Camera, Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
  isLoading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoUpload({ onPhotoSelected, isLoading }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      onPhotoSelected(file);
    },
    [onPhotoSelected]
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

      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChangePhoto = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Show preview state
  if (preview && selectedFile) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg border overflow-hidden bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Worksheet photo preview"
            className="w-full max-h-80 object-contain"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedFile.name}</span>
            <span className="shrink-0">({formatFileSize(selectedFile.size)})</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleChangePhoto}
            disabled={isLoading}
          >
            <X className="h-3 w-3 mr-1" />
            Change Photo
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Show drop zone state
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
              Take a photo or upload an image
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag and drop, or click to select
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-none"
            tabIndex={-1}
          >
            <Upload className="h-3 w-3 mr-1" />
            Choose File
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
