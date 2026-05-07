import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Mail,
  FileText,
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  Send,
} from "lucide-react";
import { Card, Button, Modal } from "../components/common";
import apiService from "../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface BillData {
  billNumber: string;
  projectId: string;
  projectName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  siteCity: string;
  siteContactPerson?: string;
  siteContactEmail?: string;
  siteContactPhone?: string;
  month: number;
  year: number;
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  guardAssignments: Array<{
    guardId: string;
    guardName: string;
    shiftType: string;
    monthlyRate: number;
    daysWorked: number;
    workingDays: number;
    absentDays: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status: "Pending" | "Overdue" | "Hold" | "Paid";
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

const shiftTimingMap: Record<string, string> = {
  "Full Day": "06:00 AM - 06:00 PM",
  "Full Night": "06:00 PM - 06:00 AM",
  "Half Day": "06:00 AM - 12:00 PM",
  "Half Night": "06:00 PM - 12:00 AM",
};

export const Bill: React.FC = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadBill = async () => {
      if (!billId) {
        toast.error("Bill ID is required");
        navigate("/projects");
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getBill(billId);

        if (response.status === "success") {
          setBillData(response.data);
          if (response.data.siteContactEmail) {
            setEmailAddress(response.data.siteContactEmail);
          }
        } else {
          throw new Error(response.message || "Failed to load bill");
        }
      } catch (error: any) {
        console.error("Error loading bill:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to load bill";
        toast.error(errorMessage);
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };

    loadBill();
  }, [billId, navigate]);

  const handleDownload = async () => {
    if (!printRef.current) return;

    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const orientation = canvas.width > canvas.height ? "l" : "p";
      const pdf = new jsPDF(orientation, "mm", "a4");
      const pageWidth = orientation === "p" ? 210 : 297;
      const pageHeight = orientation === "p" ? 297 : 210;
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const scale = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(
        `Bill_${billData?.billNumber}_${monthNames[(billData?.month || 1) - 1]}_${billData?.year}.pdf`
      );
      toast.success("Bill downloaded successfully", { id: "pdf-download" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { id: "pdf-download" });
    }
  };

  const handleSendEmail = async () => {
    if (!billId || !emailAddress) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSendingEmail(true);
      await apiService.sendBillEmail(billId, emailAddress, emailMessage);
      toast.success("Bill sent via email successfully");
      setShowEmailModal(false);

      // Reload bill to update status
      const response = await apiService.getBill(billId);
      if (response.status === "success") {
        setBillData(response.data);
      }
    } catch (error: any) {
      console.error("Error sending email:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send email";
      toast.error(errorMessage);
    } finally {
      setSendingEmail(false);
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
          <p className="text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">No bill data available</p>
          <Button
            variant="outline"
            onClick={() => navigate("/projects")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
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
            <h1 className="text-3xl font-bold text-gray-900">Bill</h1>
            <p className="text-gray-600 mt-1">
              {billData.billNumber} - {monthNames[billData.month - 1]}{" "}
              {billData.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Bill Content */}
      <div ref={printRef} className="bg-white p-8 space-y-6">
        {/* Company Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Guard CRM</h2>
          <p className="text-gray-600 mt-1">Bill</p>
        </div>

        {/* Bill Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Project Details
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Project:</span> {billData.projectName}
              </p>
              <p>
                <span className="font-medium">Bill Number:</span>{" "}
                {billData.billNumber}
              </p>
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
                <span className="font-medium">Site Name:</span> {billData.siteName}
              </p>
              <p>
                <span className="font-medium">Address:</span> {billData.siteAddress}
              </p>
              <p>
                <span className="font-medium">City:</span> {billData.siteCity}
              </p>
              {billData.siteContactPerson && (
                <p>
                  <span className="font-medium">Contact Person:</span>{" "}
                  {billData.siteContactPerson}
                </p>
              )}
              {billData.siteContactEmail && (
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {billData.siteContactEmail}
                </p>
              )}
              {billData.siteContactPhone && (
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {billData.siteContactPhone}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Billing Period */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Billing Period</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Period</p>
              <p className="text-gray-900">
                {formatDate(billData.billingPeriod.startDate)} -{" "}
                {formatDate(billData.billingPeriod.endDate)}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Generated On</p>
              <p className="text-gray-900">
                {formatDate(billData.generatedDate)}
              </p>
            </div>
          </div>
        </Card>

        {/* Guard Assignments */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Guard Assignments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Guard Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Shift Type
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Shift Timing
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Monthly Rate
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Working Days
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Present Days
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Absent Days
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-medium text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {billData.guardAssignments.map((assignment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {assignment.guardName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {assignment.shiftType}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {shiftTimingMap[assignment.shiftType] || "As assigned"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {formatCurrency(assignment.monthlyRate)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {assignment.workingDays}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {assignment.daysWorked}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                      {assignment.absentDays}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-medium">
                      {formatCurrency(assignment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bill Summary */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Bill Summary
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(billData.subtotal)}</span>
            </div>
            {billData.tax && billData.tax > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax ({billData.tax}%):</span>
                <span className="font-medium">
                  {formatCurrency((billData.subtotal * billData.tax) / 100)}
                </span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(billData.totalAmount)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Send Bill via Email"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailAddress}
              className="flex items-center gap-2"
            >
              {sendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Add a custom message to the email..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

