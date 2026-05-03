import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar, Sidebar } from "../common";
import { logout } from "../../features/auth/authSlice";
import type { AppDispatch, RootState } from "../../app/store";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");

  // Update active sidebar item based on current location
  useEffect(() => {
    const path = location.pathname;
    if (path === "/dashboard") {
      setActiveSidebarItem("dashboard");
    } else if (path.startsWith("/guards")) {
      setActiveSidebarItem("guards");
    } else if (path.startsWith("/inventories")) {
      setActiveSidebarItem("inventories");
    } else if (path.startsWith("/sites")) {
      setActiveSidebarItem("sites");
    } else if (path.startsWith("/projects")) {
      setActiveSidebarItem("projects");
    } else if (path.startsWith("/attendance")) {
      setActiveSidebarItem("attendance");
    } else if (path.startsWith("/billing") || path.startsWith("/bills")) {
      setActiveSidebarItem("billing");
    } else if (
      path.startsWith("/payroll") ||
      path.startsWith("/salary-slip")
    ) {
      setActiveSidebarItem("payroll");
    }
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleSidebarItemClick = (itemId: string) => {
    setActiveSidebarItem(itemId);
    // Handle navigation logic here
    if (itemId === "dashboard") {
      navigate("/dashboard");
    } else if (itemId === "guards") {
      navigate("/guards");
    } else if (itemId === "inventories") {
      navigate("/inventories");
    } else if (itemId === "sites") {
      navigate("/sites");
    } else if (itemId === "projects") {
      navigate("/projects");
    } else if (itemId === "attendance") {
      navigate("/attendance");
    } else if (itemId === "billing") {
      navigate("/billing");
    } else if (itemId === "payroll") {
      navigate("/payroll");
    }
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeSidebarItem}
          onItemClick={handleSidebarItemClick}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            user={user || undefined}
            onLogout={handleLogout}
            onMobileMenuToggle={toggleMobileSidebar}
          />

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
