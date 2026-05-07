import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
} from "lucide-react";
import classNames from "classnames";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const getSidebarItems = (): SidebarItem[] => {
  const items: SidebarItem[] = [
    { id: "guards", label: "Guard Management", icon: Shield },
  ];

  return items;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  activeItem = "dashboard",
  onItemClick,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const sidebarItems = getSidebarItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={classNames(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-50 overflow-y-auto",
          // Desktop: sticky sidebar with full height and scroll
          "hidden lg:flex lg:sticky lg:top-0 lg:h-screen",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile: slide-in panel with scroll
          isMobileOpen
            ? "fixed inset-y-0 left-0 w-64 flex lg:hidden"
            : "hidden lg:flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            {(!isCollapsed || isMobileOpen) && (
              <h2 className="text-lg font-semibold text-gray-900">Guard CRM</h2>
            )}
            <div className="flex items-center space-x-2">
              {/* Mobile close button */}
              {isMobileOpen && (
                <button
                  onClick={onMobileClose}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              )}
              {/* Desktop toggle button */}
              {onToggle && (
                <button
                  onClick={onToggle}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onItemClick?.(item.id);
                      // Close mobile sidebar when item is clicked
                      if (isMobileOpen) {
                        onMobileClose?.();
                      }
                    }}
                    className={classNames(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {(!isCollapsed || isMobileOpen) && (
                      <span>{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">Guard CRM v1.0.0</div>
          </div>
        )}
      </div>
    </>
  );
};
