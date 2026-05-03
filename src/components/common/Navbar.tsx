import React from "react";
import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "./Button";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
  };
  onLogout?: () => void;
  onMobileMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onMobileMenuToggle,
}) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button and title */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            <img
              src="/favicon.jpeg"
              alt="Guard CRM Logo"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Guard CRM
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Security Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Search, notifications, user */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search - Hidden on small screens */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search guards, sites..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 lg:w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User info and logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User avatar and info */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              {/* User details - Hidden on small screens */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || "admin@guardcrm.com"}
                </p>
              </div>
            </div>

            {/* Logout button */}
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="hidden sm:inline-flex"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar - Show on small screens */}
      <div className="mt-4 sm:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search guards, sites..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </nav>
  );
};
