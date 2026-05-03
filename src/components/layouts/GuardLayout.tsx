import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Camera } from "lucide-react";
import toast from "react-hot-toast";

interface GuardLayoutProps {
  children: React.ReactNode;
}

export const GuardLayout: React.FC<GuardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear guard authentication
    localStorage.removeItem("guardToken");
    localStorage.removeItem("guardId");

    toast.success("Logged out successfully");
    navigate("/guard/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Top Navigation Bar for Guards */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <img
                src="/favicon.jpeg"
                alt="Guard CRM Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                  Guard Portal
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Attendance Management
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <button
                onClick={() => navigate("/guard/attendance")}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:bg-blue-100"
                title="Mark Attendance"
              >
                <Camera className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">
                  Mark Attendance
                </span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors active:bg-red-100"
                title="Logout"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
};
