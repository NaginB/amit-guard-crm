import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  UserCheck,
  CreditCard,
  MapPin,
  Receipt,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, Button, LoadingSpinner } from "../components/common";
import apiService from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}) => {
  const changeColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
          <p
            className={`text-xs sm:text-sm ${changeColor[changeType]} truncate`}
          >
            {change}
          </p>
        </div>
        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );
};

interface GuardData {
  _id: string;
  firstName: string;
  lastName: string;
  status?: string;
  salary?: number;
}

type ShiftType = "Full Day" | "Full Night" | "Half Day" | "Half Night";

interface GuardAssignment {
  guardId: string;
  guardName: string;
  shiftType: ShiftType;
  monthlyRate: number;
  isActive?: boolean;
}

interface ProjectData {
  _id: string;
  projectName: string;
  status: "Active" | "Closed" | "On Hold";
  siteId:
    | string
    | {
        _id: string;
        name: string;
        address: string;
        city: string;
      };
  guardAssignments: GuardAssignment[];
}

interface BillData {
  _id: string;
  projectId: string;
  projectName?: string;
  totalAmount: number;
  status: "Pending" | "Overdue" | "Hold" | "Paid";
  month: number;
  year: number;
  generatedDate?: string;
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const shiftColors = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#f97316",
  "#1d4ed8",
  "#0f172a",
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [guards, setGuards] = useState<GuardData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [guardsRes, projectsRes, sitesRes] = await Promise.all([
          apiService.getGuards(),
          apiService.getProjects(),
          apiService.getActiveSites(),
        ]);

        const fetchedProjects: ProjectData[] = projectsRes.data.projects || [];
        setProjects(fetchedProjects);
        setGuards(guardsRes.data.guards || []);
        setSites(sitesRes.data || []);

        const allBills: BillData[] = [];
        for (const project of fetchedProjects) {
          try {
            const billsRes = await apiService.getBillsByProject(project._id);
            if (billsRes.status === "success") {
              const mappedBills =
                (billsRes.data || []).map((bill: any) => ({
                  ...bill,
                  projectName: bill.projectName || project.projectName,
                })) || [];
              allBills.push(...mappedBills);
            }
          } catch (billError) {
            console.error(
              `Error fetching bills for project ${project._id}`,
              billError
            );
          }
        }
        setBills(allBills);
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Failed to load dashboard data";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthlyPayroll = useMemo(() => {
    // Calculate payroll from guard table salary field
    // Get all unique guard IDs from active project assignments
    const activeGuardIds = new Set<string>();
    projects.forEach((project) => {
      const activeAssignments = (project.guardAssignments || []).filter(
        (assignment) => assignment.isActive !== false
      );
      activeAssignments.forEach((assignment) => {
        activeGuardIds.add(assignment.guardId);
      });
    });

    // Sum up salaries from guard table for all active guards
    return guards
      .filter((guard) => activeGuardIds.has(guard._id))
      .reduce((sum, guard) => sum + (guard.salary || 0), 0);
  }, [projects, guards]);

  const billingStats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    bills.forEach((bill) => {
      if (bill.status === "Paid") {
        paid += bill.totalAmount || 0;
      } else if (bill.status === "Overdue") {
        overdue += bill.totalAmount || 0;
      } else {
        pending += bill.totalAmount || 0;
      }
    });

    // Calculate current month revenue
    let currentMonthRevenue = bills
      .filter(
        (bill) => bill.month === currentMonth && bill.year === currentYear
      )
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

    // If current month has no revenue, show the most recent month's revenue
    if (currentMonthRevenue === 0 && bills.length > 0) {
      // Sort bills by year and month (most recent first)
      const sortedBills = [...bills].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      // Get the most recent month's revenue
      if (sortedBills.length > 0) {
        const mostRecentBill = sortedBills[0];
        currentMonthRevenue = bills
          .filter(
            (bill) =>
              bill.month === mostRecentBill.month &&
              bill.year === mostRecentBill.year
          )
          .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      }
    }

    const currentMonthPending = bills
      .filter(
        (bill) =>
          bill.month === currentMonth &&
          bill.year === currentYear &&
          bill.status !== "Paid"
      )
      .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

    return {
      totalPaid: paid,
      totalPending: pending,
      totalOverdue: overdue,
      currentMonthRevenue,
      currentMonthPending,
    };
  }, [bills, currentMonth, currentYear]);

  const profitLoss = billingStats.currentMonthRevenue - monthlyPayroll;
  const profitChangeLabel =
    profitLoss >= 0 ? "Profit this month" : "Loss this month";

  const revenueTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthBills = bills.filter(
        (bill) => bill.month === month && bill.year === year
      );
      const paid = monthBills
        .filter((bill) => bill.status === "Paid")
        .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      const pending = monthBills
        .filter((bill) => bill.status !== "Paid")
        .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      data.push({
        name: `${monthNames[month - 1]} ${String(year).slice(-2)}`,
        paid,
        pending,
      });
    }
    return data;
  }, [bills, currentMonth, currentYear]);

  const profitTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthBills = bills.filter(
        (bill) => bill.month === month && bill.year === year
      );
      // Revenue from bills (monthly rate from bills)
      const revenue = monthBills.reduce(
        (sum, bill) => sum + (bill.totalAmount || 0),
        0
      );

      // Calculate payroll from guard table salary for active assignments
      // Get all unique guard IDs from active project assignments
      const activeGuardIds = new Set<string>();
      projects.forEach((project) => {
        const activeAssignments = (project.guardAssignments || []).filter(
          (assignment) => assignment.isActive !== false
        );
        activeAssignments.forEach((assignment) => {
          activeGuardIds.add(assignment.guardId);
        });
      });

      // Sum up salaries from guard table for all active guards
      const salaries = guards
        .filter((guard) => activeGuardIds.has(guard._id))
        .reduce((sum, guard) => sum + (guard.salary || 0), 0);

      data.push({
        name: `${monthNames[month - 1]} ${String(year).slice(-2)}`,
        revenue,
        salary: salaries,
        profit: revenue - salaries,
      });
    }
    return data;
  }, [bills, projects, guards, currentMonth, currentYear]);

  const shiftDistribution = useMemo(() => {
    const distribution: Record<ShiftType, number> = {
      "Full Day": 0,
      "Full Night": 0,
      "Half Day": 0,
      "Half Night": 0,
    };
    projects.forEach((project) => {
      (project.guardAssignments || [])
        .filter((assignment) => assignment.isActive !== false)
        .forEach((assignment) => {
          distribution[assignment.shiftType] =
            (distribution[assignment.shiftType] || 0) + 1;
        });
    });
    return Object.entries(distribution).map(([shift, value]) => ({
      name: shift,
      value,
    }));
  }, [projects]);

  const topProjects = useMemo(() => {
    return projects
      .map((project) => {
        const activeGuards = (project.guardAssignments || []).filter(
          (assignment) => assignment.isActive !== false
        );
        // Calculate monthly cost from guard table salary
        const monthlyCost = activeGuards.reduce((sum, assignment) => {
          const guard = guards.find((g) => g._id === assignment.guardId);
          return sum + (guard?.salary || 0);
        }, 0);
        const projectBills = bills.filter(
          (bill) => bill.projectId === project._id
        );
        const pendingInvoices = projectBills
          .filter((bill) => bill.status !== "Paid")
          .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

        return {
          id: project._id,
          name: project.projectName,
          guards: activeGuards.length,
          monthlyCost,
          status: project.status,
          pendingInvoices,
        };
      })
      .sort((a, b) => b.guards - a.guards)
      .slice(0, 5);
  }, [projects, bills, guards]);

  const recentActivities = useMemo(() => {
    const recentBills = bills
      .sort((a, b) => {
        const dateA = a.generatedDate ? new Date(a.generatedDate).getTime() : 0;
        const dateB = b.generatedDate ? new Date(b.generatedDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((bill) => ({
        id: bill._id,
        action: `Bill ${bill.projectName || bill.projectId} - ${bill.status}`,
        time: `${monthNames[bill.month - 1]} ${bill.year}`,
        icon: Receipt,
      }));

    const guardActivity = guards.slice(0, 3).map((guard) => ({
      id: guard._id,
      action: `Guard ${guard.firstName} ${guard.lastName}`,
      time: "Active assignment",
      icon: Shield,
    }));

    return [...recentBills, ...guardActivity].slice(0, 5);
  }, [bills, guards]);

  const alerts = useMemo(
    () => [
      {
        id: 1,
        type: "warning",
        message: `${billingStats.totalPending.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })} pending invoices`,
        icon: AlertTriangle,
      },
      {
        id: 2,
        type: "info",
        message: `${
          projects.filter((project) => project.status === "Active").length
        } active projects this month`,
        icon: Receipt,
      },
      {
        id: 3,
        type: "success",
        message: `${guards.length} guards on roster`,
        icon: CheckCircle,
      },
    ],
    [billingStats.totalPending, projects, guards.length]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-semibold text-red-700">
              Unable to load dashboard
            </p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Security Guard Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Welcome back, Admin! Here's your security operations overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Guards"
          value={guards.length.toString()}
          change="+ Guard roster"
          changeType="neutral"
          icon={Shield}
        />
        <StatCard
          title="Active Projects"
          value={projects
            .filter((project) => project.status === "Active")
            .length.toString()}
          change={`${sites.length} active sites`}
          changeType="neutral"
          icon={MapPin}
        />
        <StatCard
          title="Monthly Revenue"
          value={billingStats.currentMonthRevenue.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          change={`${billingStats.totalPending.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })} pending`}
          changeType="positive"
          icon={CreditCard}
        />
        <StatCard
          title="Payroll"
          value={monthlyPayroll.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
          change="Guard compensation"
          changeType="neutral"
          icon={UserCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card className="lg:col-span-2 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue vs Pending
              </h3>
              <p className="text-sm text-gray-500">
                Last six months performance
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="paid"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Paid"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Pending"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Profit & Loss
              </h3>
              <p className="text-sm text-gray-500">
                {monthNames[currentMonth - 1]} {currentYear}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                profitLoss >= 0
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {profitLoss >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {profitLoss.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}
          </p>
          <p
            className={`text-sm mt-1 ${
              profitLoss >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {profitChangeLabel}
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Revenue</span>
              <span className="font-semibold text-gray-900">
                {billingStats.currentMonthRevenue.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payroll</span>
              <span className="font-semibold text-gray-900">
                {monthlyPayroll.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending</span>
              <span className="font-semibold text-gray-900">
                {billingStats.currentMonthPending.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                View projects
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3"
                  >
                    <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="lg:col-span-3 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Income vs Salary vs Profit
                </h3>
                <p className="text-sm text-gray-500">
                  Tracking the last six months performance
                </p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="salary"
                    name="Salary"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                System Alerts
              </h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {alerts.length} Active
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                const alertColors = {
                  warning: "text-yellow-600 bg-yellow-50",
                  info: "text-blue-600 bg-blue-50",
                  success: "text-green-600 bg-green-50",
                };
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${
                      alertColors[alert.type as keyof typeof alertColors]
                    } flex items-center space-x-3`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Guard Shift Mix
                </h3>
                <p className="text-sm text-gray-500">
                  Distribution across assignments
                </p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shiftDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {shiftDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={shiftColors[index % shiftColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Project Insights */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Quick Actions
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/guards/new")}
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                Add New Guard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/attendance")}
              >
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                Attendance Console
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/billing")}
              >
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mr-2" />
                Billing Overview
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/payroll")}
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
                Salary Slips
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Top Projects
            </h3>
            <div className="space-y-4">
              {topProjects.map((project) => (
                <div key={project.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {project.guards} guards •{" "}
                        {project.status === "Active"
                          ? "Active"
                          : project.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{project.monthlyCost.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pending: ₹{project.pendingInvoices.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              Operations Snapshot
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Active Sites</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {sites.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Active Guards</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {guards.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Pending Revenue</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{billingStats.totalPending.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
