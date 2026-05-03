import React, { useRef, useState, useCallback, useEffect } from "react";
import apiService from "../../services/api";
import { Card, Button, ConfirmModal } from ".";
import { Upload, X, User } from "lucide-react";

interface FileUploadProps {
  label?: string;
  value?: string | null;
  onChange: (url: string, publicId?: string) => void;
  accept?: string;
  disabled?: boolean;
  maxSizeMB?: number;
  enforceSquare?: boolean;
  targetSize?: number;
  imagePublicId?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = "Upload Image",
  value,
  onChange,
  accept = "image/*",
  disabled,
  maxSizeMB = 5,
  enforceSquare = true,
  targetSize = 512,
  imagePublicId,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [publicId, setPublicId] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const uploadSelected = useCallback(
    async (file?: File) => {
      if (!file) return;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMB}MB`);
        return;
      }
      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const objUrl = URL.createObjectURL(file);
        setPreview(objUrl);
        setFileName(file.name || "image.jpg");

        const tick = setInterval(() => {
          setProgress((p) => (p < 92 ? p + 4 : p));
        }, 100);

        let fileToUpload: File = file;
        if (enforceSquare) {
          const croppedBlob = await cropImageToSquare(file, targetSize);
          fileToUpload = new File([croppedBlob], file.name || "upload.jpg", {
            type: croppedBlob.type,
            lastModified: Date.now(),
          });
        }

        const res = await apiService.uploadFile(fileToUpload);
        onChange(res.data.url, res.data.publicId);
        // Store the publicId for deletion
        setPublicId(res.data.publicId);
        setProgress(100);
        clearInterval(tick);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [enforceSquare, maxSizeMB, onChange, targetSize]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    uploadSelected(file);
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      uploadSelected(file);
    },
    [uploadSelected]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  useEffect(() => {
    if (imagePublicId) {
      setPublicId(imagePublicId);
    }
  }, [imagePublicId]);

  return (
    <Card className="p-6 border-dashed border-2 border-gray-200 hover:border-blue-400 transition-all bg-gradient-to-b from-white/80 to-gray-50 shadow-sm">
      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          ref={inputRef}
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={disabled || uploading}
        />

        {/* PREVIEW OR UPLOAD BOX */}
        {value || preview ? (
          <div className="relative w-full flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={preview || (value as string)}
                alt="Uploaded"
                className="w-32 h-32 object-cover rounded-xl shadow-md border border-gray-200"
              />
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={uploading}
                type="button"
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>

            <div className="w-full">
              {uploading && (
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-600 rounded transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={uploading}
              onClick={handlePick}
              className="mt-2 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Change Image"}
            </Button>
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={handlePick}
            className={`w-full h-44 rounded-xl flex flex-col justify-center items-center transition-all cursor-pointer ${
              dragActive
                ? "border-blue-500 bg-blue-50 shadow-inner"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="bg-gray-100 p-4 rounded-full">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-800">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <ConfirmModal
          isOpen={confirmOpen}
          title="Remove image?"
          message="This will delete the uploaded image."
          confirmText="Delete"
          cancelText="Cancel"
          confirmLoading={deleting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            try {
              setDeleting(true);
              if (publicId) {
                await apiService.deleteUpload(publicId);
              }
              onChange("", "");
              setPreview(null);
              setPublicId("");
              setConfirmOpen(false);
            } catch {
              // silently ignore
            } finally {
              setDeleting(false);
            }
          }}
        />
      </div>
    </Card>
  );
};

// Utility: crop to square
async function cropImageToSquare(
  file: File,
  targetSize: number
): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSize, targetSize);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject("Failed to crop image")),
      "image/jpeg",
      0.92
    );
  });
}

export default FileUpload;
