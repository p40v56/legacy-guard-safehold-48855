import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle } from 'lucide-react';
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
      // Simulate upload progress
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
    
    // Reset input
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
        "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
        dragActive && !disabled && !isUploading 
          ? "border-emerald-400 bg-emerald-500/10" 
          : "border-slate-600 hover:border-slate-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
        <div className="space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Upload Complete!</h3>
            <p className="text-slate-400">Your file has been uploaded successfully.</p>
          </div>
        </div>
      ) : isUploading ? (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
            <File className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Uploading...</h3>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
            <p className="text-slate-400 text-sm mt-2">{uploadProgress}% complete</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {dragActive ? "Drop your file here" : "Upload a file"}
            </h3>
            <p className="text-slate-400 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              Choose File
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              Maximum file size: {maxSize}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export { FileUpload };