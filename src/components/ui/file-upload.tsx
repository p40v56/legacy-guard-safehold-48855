import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

const FileUpload = ({ 
  onUpload, 
  accept = "*/*", 
  maxSize = 10, 
  className,
  disabled = false 
}: FileUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSize}MB`);
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(file);
      
      clearInterval(interval);
      setUploadProgress(100);
      setUploadComplete(true);
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadComplete(false);
      }, 2000);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        await handleFile(files[0]);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || disabled || isUploading) return;
    
    try {
      await handleFile(e.target.files[0]);
    } catch (error) {
      console.error('Upload error:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
        dragActive && !disabled && !isUploading 
          ? "border-primary bg-primary/5 scale-[1.01]" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {uploadComplete ? (
        <div className="space-y-3">
          <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">Upload complete!</p>
            <p className="text-xs text-muted-foreground mt-1">Your file has been encrypted and uploaded.</p>
          </div>
        </div>
      ) : isUploading ? (
        <div className="space-y-3">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <File className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">Encrypting & uploading…</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto mt-3" />
            <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <CloudUpload className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-card-foreground">
              {dragActive ? "Drop your file here" : "Drag & drop a file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or <span className="text-primary font-medium hover:underline">browse from your device</span>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Max {maxSize} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export { FileUpload };
