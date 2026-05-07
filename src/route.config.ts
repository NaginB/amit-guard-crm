import React from "react";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { GuardManagement } from "./pages/GuardManagement";
import { GuardDetail } from "./pages/GuardDetail";
import { GuardForm } from "./pages/GuardForm";
import { InventoryManagement } from "./pages/InventoryManagement";
import { SiteManagement } from "./pages/SiteManagement";
import { SiteDetail } from "./pages/SiteDetail";
import { SiteForm } from "./pages/SiteForm";
import ProjectManagement from "./pages/ProjectManagement";
import { JobDetails } from "./pages/JobDetails";
import { AttendanceManagement } from "./pages/AttendanceManagement";
import { GuardLogin } from "./pages/GuardLogin";
import { GuardAttendance } from "./pages/GuardAttendance";
import { SalarySlip } from "./pages/SalarySlip";
import { Bill } from "./pages/Bill";
import { BillGeneration } from "./pages/BillGeneration";
import { BillingManagement } from "./pages/BillingManagement";
import { Payroll } from "./pages/Payroll";
import QuickBillManagement from "./pages/QuickBillManagement";

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  isPrivate?: boolean;
  dashboard?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    element: Login,
    isPrivate: false,
  },
  {
    path: "/dashboard",
    element: Dashboard,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/guards",
    element: GuardManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/guards/:id",
    element: GuardDetail,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/guards/new",
    element: GuardForm,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/guards/:id/edit",
    element: GuardForm,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/inventories",
    element: InventoryManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/sites",
    element: SiteManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/sites/new",
    element: SiteForm,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/sites/:id",
    element: SiteDetail,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/sites/:id/edit",
    element: SiteForm,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/projects",
    element: ProjectManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/projects/:id",
    element: JobDetails,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/attendance/:projectId/:guardId",
    element: AttendanceManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/attendance",
    element: AttendanceManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/salary-slip/:guardId/:siteId",
    element: SalarySlip,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/bills/:billId",
    element: Bill,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/bills/generate/:projectId",
    element: BillGeneration,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/billing",
    element: BillingManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/quick-bills",
    element: QuickBillManagement,
    isPrivate: true,
    dashboard: true,
  },
  {
    path: "/payroll",
    element: Payroll,
    isPrivate: true,
    dashboard: true,
  },
  // Guard routes
  {
    path: "/guard/login",
    element: GuardLogin,
    isPrivate: false,
  },
  {
    path: "/guard/attendance",
    element: GuardAttendance,
    isPrivate: false,
    dashboard: false,
  },
];
