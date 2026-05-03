import React, { useState } from "react";
import { Camera, CheckCircle, AlertCircle } from "lucide-react";
import { Card, Button } from "../common";
import FileUpload from "../common/FileUpload";
import apiService from "../../services/api";
import toast from "react-hot-toast";

interface AttendancePhotoUploadProps {
  guardId: string;
  siteId: string;
  onUploadSuccess?: () => void;
  disabled?: boolean;
}

export const AttendancePhotoUpload: React.FC<AttendancePhotoUploadProps> = ({
  guardId,
  siteId,
  onUploadSuccess,
  disabled = false,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");

  const handlePhotoUpload = async (url: string) => {
    setPhotoUrl(url);
  };

  const handleSubmitAttendance = async () => {
    if (!photoUrl) {
      toast.error("Please upload a site photo first");
      return;
    }

    if (!guardId || !siteId) {
      toast.error("Guard and site information is required");
      return;
    }

    setUploading(true);
    try {
      const attendanceData = {
        guardId,
        siteId,
        photoUrl,
        notes: notes.trim() || undefined,
      };

      await apiService.createAttendanceWithPhoto(attendanceData);
      toast.success("Attendance marked successfully!");

      // Reset form
      setPhotoUrl("");
      setNotes("");

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error("Error marking attendance:", error);
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Mark Attendance with Site Photo
          </h3>
          <p className="text-sm text-gray-600">
            Upload a photo of the site to automatically mark your attendance for
            today
          </p>
        </div>

        {/* Photo Upload */}
        <div className="space-y-4">
          <FileUpload
            label="Site Photo"
            value={photoUrl}
            onChange={handlePhotoUpload}
            accept="image/*"
            disabled={disabled || uploading}
            maxSizeMB={10}
            enforceSquare={false}
            targetSize={800}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about the site visit..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={disabled || uploading}
            maxLength={500}
          />
          <p className="text-xs text-gray-500">{notes.length}/500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmitAttendance}
            disabled={!photoUrl || uploading || disabled}
            className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 min-w-[200px]"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Marking Attendance...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark Attendance
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="space-y-1 text-xs">
                <li>• Upload a clear photo of the site to mark attendance</li>
                <li>• Photo will be automatically timestamped</li>
                <li>
                  • Attendance is marked as present only when photo is uploaded
                </li>
                <li>• No photo upload = marked as absent for the day</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
