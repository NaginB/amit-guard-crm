import React, { useState, useEffect, useCallback, useRef } from "react";
import { Camera, MapPin, User, CheckCircle, RotateCcw } from "lucide-react";
import { Card, Select, Button } from "../components/common";
import apiService from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface Guard {
  _id: string;
  firstName: string;
  lastName: string;
  guardId: string;
}

interface Site {
  _id: string;
  name: string;
  address: string;
  city: string;
}

export const GuardAttendance: React.FC = () => {
  const navigate = useNavigate();
  const [guard, setGuard] = useState<Guard | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [attendanceAlreadyMarked, setAttendanceAlreadyMarked] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadGuardInfo = useCallback(
    async (guardId: string) => {
      try {
        const response = await apiService.getGuard(guardId);
        if (response.status === "success") {
          setGuard(response.data.guard);
        }
      } catch (error: unknown) {
        console.error("Error loading guard info:", error);
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to load guard info";
        toast.error(errorMessage);
        navigate("/guard/login");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const loadSites = useCallback(async () => {
    try {
      const response = await apiService.getSites();
      if (response.status === "success") {
        setSites(response.data);
      }
    } catch (error: unknown) {
      console.error("Error loading sites:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load sites";
      toast.error(errorMessage);
    }
  }, []);

  useEffect(() => {
    // Check guard authentication
    const guardToken = localStorage.getItem("guardToken");
    const guardId = localStorage.getItem("guardId");

    if (!guardToken || !guardId) {
      toast.error("Please login to access guard portal");
      navigate("/guard/login");
      return;
    }

    loadGuardInfo(guardId);
    loadSites();
  }, [navigate, loadGuardInfo, loadSites]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraLoading(true);
      setCameraReady(false);

      // Stop existing stream first using ref to avoid stale closure
      setStream((currentStream) => {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
        return null;
      });

      // Try to get camera with mobile-friendly constraints
      let mediaStream: MediaStream | null = null;

      try {
        // First try: back camera (environment) - preferred for mobile
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        // Fallback: any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      }

      if (!mediaStream) {
        throw new Error("Failed to access camera");
      }

      // Set stream state - useEffect will handle video element setup
      setStream(mediaStream);
    } catch (error: unknown) {
      console.error("Error accessing camera:", error);
      const errorName = (error as Error)?.name;
      let errorMessage = "Unable to access camera. Please check permissions.";

      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
      ) {
        errorMessage =
          "Camera permission denied. Please enable camera access in your browser settings.";
      } else if (
        errorName === "NotFoundError" ||
        errorName === "DevicesNotFoundError"
      ) {
        errorMessage = "No camera found on this device.";
      } else if (
        errorName === "NotReadableError" ||
        errorName === "TrackStartError"
      ) {
        errorMessage = "Camera is already in use by another application.";
      }

      setCameraError(errorMessage);
      setCameraLoading(false);
      setCameraReady(false);
      toast.error(errorMessage);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    setStream((currentStream) => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      return null;
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCameraLoading(false);
  }, []);

  // Capture image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      toast.error("Camera is not ready. Please wait...");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Failed to capture image");
      return;
    }

    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Camera video is not ready. Please try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(imageDataUrl);
    stopCamera();
    toast.success("Photo captured successfully!");
  }, [stopCamera, cameraReady]);

  // Check if attendance already exists when site is selected
  const checkExistingAttendance = useCallback(async () => {
    if (!selectedSiteId || !guard) {
      setAttendanceAlreadyMarked(false);
      return;
    }

    try {
      setCheckingAttendance(true);

      // Get project for this site
      const projectsResponse = await apiService.getProjectsBySite(
        selectedSiteId,
        {
          status: "Active",
        }
      );
      const projects = projectsResponse.data?.projects || [];

      // Find project with this guard assigned
      const project = projects.find((p: any) =>
        p.guardAssignments?.some(
          (a: any) => a.guardId === guard._id && a.isActive
        )
      );

      if (!project) {
        setAttendanceAlreadyMarked(false);
        return;
      }

      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Check if attendance exists for today
      const attendanceResponse = await apiService.getAttendance({
        guardId: guard._id,
        projectId: project._id,
        startDate: today.toISOString(),
        endDate: todayEnd.toISOString(),
      });

      if (
        attendanceResponse.status === "success" &&
        attendanceResponse.data?.attendance?.length > 0
      ) {
        const todayAttendance = attendanceResponse.data.attendance.find(
          (a: any) => {
            const attendanceDate = new Date(a.date);
            attendanceDate.setHours(0, 0, 0, 0);
            return attendanceDate.getTime() === today.getTime();
          }
        );

        if (todayAttendance && todayAttendance.status === "present") {
          setAttendanceAlreadyMarked(true);
          return;
        }
      }

      setAttendanceAlreadyMarked(false);
    } catch (error) {
      console.error("Error checking existing attendance:", error);
      setAttendanceAlreadyMarked(false);
    } finally {
      setCheckingAttendance(false);
    }
  }, [selectedSiteId, guard]);

  // Upload and submit attendance
  const handleSubmitAttendance = useCallback(async () => {
    if (!capturedImage) {
      toast.error("Please capture a photo first");
      return;
    }

    if (!guard || !selectedSiteId) {
      toast.error("Guard and site information is required");
      return;
    }

    setUploading(true);
    try {
      // Convert data URL to File
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "attendance-photo.jpg", {
        type: "image/jpeg",
      });

      // Upload file
      const uploadResponse = await apiService.uploadFile(file);
      const photoUrl = uploadResponse.data.url;

      // Submit attendance
      const attendanceData = {
        guardId: guard._id,
        siteId: selectedSiteId,
        photoUrl,
        notes: notes.trim() || undefined,
      };

      await apiService.createAttendanceWithPhoto(attendanceData);
      toast.success("Attendance marked successfully!");

      // Reset form
      setCapturedImage(null);
      setNotes("");
      // Don't reset selectedSiteId, but check attendance again
      await checkExistingAttendance();
    } catch (error: unknown) {
      console.error("Error marking attendance:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to mark attendance";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [capturedImage, guard, selectedSiteId, notes, checkExistingAttendance]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Sync video element with stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || capturedImage) return;

    console.log(
      "Setting up video with stream, active tracks:",
      stream.getVideoTracks().map((t) => ({
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState,
      }))
    );

    // Ensure stream tracks are active
    stream.getVideoTracks().forEach((track) => {
      if (!track.enabled) track.enabled = true;
      if (track.readyState === "ended") {
        console.error("Track already ended!");
      }
    });

    // Set stream if not already set
    if (video.srcObject !== stream) {
      console.log("Setting video srcObject");
      video.srcObject = stream;
    }

    // Ensure video is visible
    video.style.display = "block";

    // Set up event handlers
    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded, attempting to play");
      setCameraLoading(false);
      video
        .play()
        .then(() => {
          console.log("Video play started");
        })
        .catch((playError) => {
          console.error("Error playing video:", playError);
          // Retry after a short delay
          setTimeout(() => {
            video
              .play()
              .then(() => {
                console.log("Video play retry successful");
              })
              .catch((retryError) => {
                console.error("Retry play error:", retryError);
                setCameraError(
                  "Failed to start camera preview. Please try again."
                );
                setCameraLoading(false);
              });
          }, 500);
        });
    };

    const handleCanPlay = () => {
      console.log("Video can play, readyState:", video.readyState);
      if (video.paused) {
        video.play().catch(console.error);
      }
    };

    const handlePlaying = () => {
      console.log("Video is playing");
      setCameraReady(true);
      setCameraLoading(false);
    };

    const handleError = (e: Event) => {
      console.error("Video error:", e, video.error);
      setCameraError("Failed to load camera video");
      setCameraLoading(false);
    };

    // Remove any existing listeners first
    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    video.removeEventListener("canplay", handleCanPlay);
    video.removeEventListener("playing", handlePlaying);
    video.removeEventListener("error", handleError);

    // Add event listeners
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    // Try to play immediately if already ready
    if (video.readyState >= 2) {
      console.log("Video readyState >= 2, attempting immediate play");
      video.play().catch((err) => {
        console.log("Immediate play failed, will wait for events:", err);
      });
    }

    // Cleanup
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
    };
  }, [stream, capturedImage]);

  // Reset camera and image when site changes
  useEffect(() => {
    if (selectedSiteId) {
      // Reset captured image when site changes
      setCapturedImage(null);
      setNotes("");
      setCameraError(null);
      setAttendanceAlreadyMarked(false);
      // Stop existing stream
      stopCamera();
      // Check if attendance already exists
      checkExistingAttendance();
    }
  }, [selectedSiteId, stopCamera, checkExistingAttendance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12 min-h-[60vh]">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedSite = sites.find((s) => s._id === selectedSiteId);

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0 pb-6">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="text-center pt-2 sm:pt-0">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="p-3 sm:p-4 bg-blue-100 rounded-full">
            <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 px-2">
          Mark Your Attendance
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
          Capture a photo of your assigned site to automatically mark your
          attendance for today. No photo capture means you'll be marked as
          absent.
        </p>
      </div>

      {/* Guard Info Display */}
      <Card>
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            Your Information
          </h3>

          {guard && (
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-semibold text-blue-900 truncate">
                    {guard.firstName} {guard.lastName}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Guard ID: {guard.guardId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Site Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 inline mr-2" />
              Select Your Assigned Site
            </label>
            <Select
              value={selectedSiteId}
              onValueChange={setSelectedSiteId}
              placeholder="Choose your site..."
              options={sites.map((site) => ({
                value: site._id,
                label: `${site.name} - ${site.city}`,
              }))}
            />
            {selectedSite && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  {selectedSite.name}
                </p>
                <p className="text-xs text-green-700 break-words">
                  {selectedSite.address}, {selectedSite.city}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Camera Capture Component */}
      {selectedSiteId && guard && (
        <Card>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Capture Site Photo
            </h3>

            {/* Attendance Already Marked Message */}
            {checkingAttendance ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">
                    Checking attendance...
                  </p>
                </div>
              </div>
            ) : attendanceAlreadyMarked ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Attendance is already marked as present
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Your attendance for today has already been recorded. No
                      need to mark it again.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Camera Error */}
                {cameraError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{cameraError}</p>
                  </div>
                )}

                {/* Camera Preview or Captured Image */}
                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden"
                  style={{ minHeight: "300px" }}
                >
                  {capturedImage ? (
                    <div className="relative">
                      <img
                        src={capturedImage}
                        alt="Captured site"
                        className="w-full h-auto max-h-[400px] object-contain mx-auto"
                      />
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          setCameraError(null);
                          // Restart camera after a brief delay
                          setTimeout(() => {
                            startCamera();
                          }, 100);
                        }}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
                        type="button"
                      >
                        <RotateCcw className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                  ) : stream ? (
                    <div
                      className="relative w-full bg-black rounded-lg overflow-hidden"
                      style={{ minHeight: "300px" }}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-[400px] object-contain mx-auto"
                        style={{
                          opacity: cameraReady ? 1 : 0.5,
                          backgroundColor: "#000",
                          minHeight: "300px",
                          display: "block",
                        }}
                      />
                      {!cameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 pointer-events-none">
                          <div className="text-center text-white p-4">
                            {cameraLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                                <p className="text-sm">Starting camera...</p>
                              </>
                            ) : (
                              <>
                                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Camera loading...</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center text-white p-4">
                        <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm mb-4">Click to start camera</p>
                        <Button
                          onClick={startCamera}
                          className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 flex items-center gap-2 mx-auto"
                          type="button"
                          disabled={cameraLoading}
                        >
                          {cameraLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Starting...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              Start Camera
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Capture Button */}
                {!capturedImage && cameraReady && stream && (
                  <div className="flex justify-center">
                    <Button
                      onClick={captureImage}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 flex items-center gap-2"
                      type="button"
                    >
                      <Camera className="h-5 w-5" />
                      Capture Photo
                    </Button>
                  </div>
                )}

                {/* Notes */}
                {capturedImage && (
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
                      disabled={uploading}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      {notes.length}/500 characters
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                {capturedImage && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleSubmitAttendance}
                      disabled={uploading}
                      className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 min-w-[200px] flex items-center justify-center gap-2"
                      type="button"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Marking Attendance...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Mark Attendance
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="p-2.5 sm:p-3 bg-blue-100 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">
                1. Select Your Site
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                Choose the site you're assigned to
              </p>
            </div>
            <div className="text-center">
              <div className="p-2.5 sm:p-3 bg-green-100 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">
                2. Capture Photo
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                Click to capture a clear photo of the site
              </p>
            </div>
            <div className="text-center">
              <div className="p-2.5 sm:p-3 bg-purple-100 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">
                3. Mark Attendance
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                Your attendance is automatically marked as present
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Important Notes */}
      <Card>
        <div className="p-4 sm:p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-3">
            Important Notes
          </h3>
          <ul className="space-y-2.5 sm:space-y-2 text-xs sm:text-sm text-yellow-800">
            <li className="flex items-start">
              <span className="font-medium mr-2 flex-shrink-0">•</span>
              <span>
                Only upload photos of the actual site you're assigned to
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2 flex-shrink-0">•</span>
              <span>Photos are automatically timestamped when uploaded</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2 flex-shrink-0">•</span>
              <span>
                If you don't capture a photo, you'll be marked as absent
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2 flex-shrink-0">•</span>
              <span>You can only mark attendance once per day per site</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
