import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Calendar,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { Card, Button } from "../components/common";
import apiService from "../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SalarySlipData {
  guardId: string;
  guardName: string;
  guardIdNumber?: number;
  contactNumber: string;
  email?: string;
  address?: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  projectId: string;
  projectName: string;
  month: number;
  year: number;
  shiftType: string;
  monthlyRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  weeklyOffDays: number;
  workingDays: number;
  perDayRate: number;
  earnedSalary: number;
  startDate: string;
  endDate: string;
  generatedDate: string;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const SalarySlip: React.FC = () => {
  const { guardId, siteId } = useParams<{ guardId: string; siteId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salarySlipData, setSalarySlipData] = useState<SalarySlipData | null>(
    null
  );
  const printRef = React.useRef<HTMLDivElement>(null);

  const year = parseInt(searchParams.get("year") || "") || new Date().getFullYear();
  const month = parseInt(searchParams.get("month") || "") || new Date().getMonth() + 1;

  useEffect(() => {
    const loadSalarySlip = async () => {
      if (!guardId || !siteId) {
        toast.error("Guard ID and Site ID are required");
        navigate("/attendance");
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getSalarySlip(guardId, siteId, year, month);

        if (response.status === "success") {
          setSalarySlipData(response.data);
        } else {
          throw new Error(response.message || "Failed to load salary slip");
        }
      } catch (error: any) {
        console.error("Error loading salary slip:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to load salary slip";
        toast.error(errorMessage);
        navigate("/attendance");
      } finally {
        setLoading(false);
      }
    };

    loadSalarySlip();
  }, [guardId, siteId, year, month, navigate]);

  const handlePrint = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Salary_Slip_${salarySlipData?.guardName}_${monthNames[month - 1]}_${year}.pdf`
      );
      toast.success("Salary slip downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary slip...</p>
        </div>
      </div>
    );
  }

  if (!salarySlipData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">No salary slip data available</p>
          <Button
            variant="outline"
            onClick={() => navigate("/attendance")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Slip</h1>
            <p className="text-gray-600 mt-1">
              {monthNames[month - 1]} {year}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Salary Slip Content */}
      <div ref={printRef} className="bg-white p-8 space-y-6">
        {/* Company Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Guard CRM</h2>
          <p className="text-gray-600 mt-1">Salary Slip</p>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Employee Details
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Name:</span> {salarySlipData.guardName}
              </p>
              {salarySlipData.guardIdNumber && (
                <p>
                  <span className="font-medium">Guard ID:</span>{" "}
                  {salarySlipData.guardIdNumber}
                </p>
              )}
              <p>
                <span className="font-medium">Contact:</span>{" "}
                {salarySlipData.contactNumber}
              </p>
              {salarySlipData.email && (
                <p>
                  <span className="font-medium">Email:</span> {salarySlipData.email}
                </p>
              )}
              {salarySlipData.address && (
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {salarySlipData.address}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Site Details
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Site Name:</span>{" "}
                {salarySlipData.siteName}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {salarySlipData.siteAddress}
              </p>
              <p>
                <span className="font-medium">City:</span> {salarySlipData.siteCity}
              </p>
              <p>
                <span className="font-medium">Project:</span>{" "}
                {salarySlipData.projectName}
              </p>
              <p>
                <span className="font-medium">Shift:</span> {salarySlipData.shiftType}
              </p>
            </div>
          </Card>
        </div>

        {/* Salary Period */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Salary Period</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Period</p>
              <p className="text-gray-900">
                {formatDate(salarySlipData.startDate)} -{" "}
                {formatDate(salarySlipData.endDate)}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Generated On</p>
              <p className="text-gray-900">
                {formatDate(salarySlipData.generatedDate)}
              </p>
            </div>
          </div>
        </Card>

        {/* Attendance Summary */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance Summary
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Days</p>
              <p className="text-xl font-bold text-gray-900">
                {salarySlipData.totalDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Working Days</p>
              <p className="text-xl font-bold text-blue-600">
                {salarySlipData.workingDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Present Days</p>
              <p className="text-xl font-bold text-green-600">
                {salarySlipData.presentDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent Days</p>
              <p className="text-xl font-bold text-red-600">
                {salarySlipData.absentDays}
              </p>
            </div>
          </div>
          {salarySlipData.weeklyOffDays > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Weekly Off Days: <span className="font-medium">{salarySlipData.weeklyOffDays}</span>
              </p>
            </div>
          )}
        </Card>

        {/* Salary Calculation */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Salary Calculation
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">Monthly Rate</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(salarySlipData.monthlyRate)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">Working Days</span>
              <span className="font-semibold text-gray-900">
                {salarySlipData.workingDays} days
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">Per Day Rate</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(salarySlipData.perDayRate)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">Present Days</span>
              <span className="font-semibold text-gray-900">
                {salarySlipData.presentDays} days
              </span>
            </div>
            <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">
                Earned Salary
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(salarySlipData.earnedSalary)}
              </span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>This is a computer-generated document and does not require a signature.</p>
          <p className="mt-2">
            Generated on {formatDate(salarySlipData.generatedDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

