import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Eye,
  EyeOff,
  Phone,
  Lock,
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../services/api";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface GuardLoginFormData {
  contactNumber: string;
  password: string;
}

export const GuardLogin: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<GuardLoginFormData>({
    mode: "onChange",
  });

  // Redirect if already logged in as guard
  useEffect(() => {
    const guardToken = localStorage.getItem("guardToken");
    if (guardToken) {
      navigate("/guard/attendance");
    }
  }, [navigate]);

  // PWA Install Prompt Handler
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("App installed successfully!");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  const onSubmit = async (data: GuardLoginFormData) => {
    setIsSubmitting(true);

    try {
      const response = await apiService.guardLogin(
        data.contactNumber,
        data.password
      );

      if (response.status === "success" && response.data.token) {
        // Store guard token separately from admin token
        localStorage.setItem("guardToken", response.data.token);
        // Backend returns `id` (not `_id`) in guard payload
        localStorage.setItem("guardId", response.data.guard.id);

        setShowSuccess(true);
        toast.success("Login successful! Welcome back.");

        // Redirect to guard attendance page
        setTimeout(() => {
          navigate("/guard/attendance");
        }, 1000);
      }
    } catch (error: unknown) {
      console.error("Guard login error:", error);
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to login. Please check your credentials.";
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Mobile Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
            <img
              src="/logo.svg"
              alt="Commando Security Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">Guard Login</h1>
            <p className="text-sm text-gray-600">Commando Security Portal</p>
          </div>
        </div>

        {/* PWA Install Prompt */}
        {showInstallPrompt &&
          !sessionStorage.getItem("pwa-install-dismissed") &&
          deferredPrompt && (
            <div className="mb-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-4 shadow-lg relative">
              <button
                onClick={handleDismissInstall}
                className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src="/logo.svg"
                    alt="App Icon"
                    className="w-12 h-12 bg-white rounded-lg p-1"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    Install Guard Portal
                  </h3>
                  <p className="text-xs text-red-100">
                    Add to home screen for quick access
                  </p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="flex-shrink-0 bg-white text-red-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Install</span>
                </button>
              </div>
            </div>
          )}

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mark Your Attendance
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to upload your site photo and mark attendance
            </p>
          </div>

          {/* Success Message */}
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Login Successful!
              </h3>
              <p className="text-gray-600">Redirecting to attendance...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter your contact number"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                    {...register("contactNumber", {
                      required: "Contact number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Please enter a valid 10-digit contact number",
                      },
                    })}
                  />
                </div>
                {errors.contactNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Instructions */}
          {!showSuccess && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                How It Works
              </h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Use your registered contact number and password</li>
                <li>• After login, upload a photo of your site</li>
                <li>• Your attendance will be automatically marked</li>
                <li>• No photo upload = marked absent for the day</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>© 2024 Guard CRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
