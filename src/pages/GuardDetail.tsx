import React, { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  User,
  DollarSign,
  Download,
} from "lucide-react";
import { Card, Button } from "../components/common";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  fetchGuardById,
  clearCurrentGuard,
  Guard,
} from "../features/guards/guardSlice";
import type { AppDispatch, RootState } from "../app/store";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { IDCardFront, IDCardBack } from "../components/guards/GuardIDCard";

export const GuardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentGuard, loading, error } = useSelector(
    (state: RootState) => state.guards
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!cardRef.current || !backCardRef.current || !currentGuard) return;
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });
      const scale = 3;
      const opts = { scale, useCORS: true, backgroundColor: "#ffffff", logging: false };
      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(cardRef.current, opts),
        html2canvas(backCardRef.current, opts),
      ]);

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const pxToMm = 0.264583;

      const fitCard = (canvas: HTMLCanvasElement, maxW: number, maxH: number) => {
        const wMm = canvas.width * pxToMm;
        const hMm = canvas.height * pxToMm;
        const r = Math.min(maxW / wMm, maxH / hMm);
        return { w: wMm * r, h: hMm * r };
      };

      const margin = 6;
      const cardMaxW = (pageW - margin * 3) / 2;
      const cardMaxH = pageH - margin * 2;

      const front = fitCard(frontCanvas, cardMaxW, cardMaxH);
      const back = fitCard(backCanvas, cardMaxW, cardMaxH);

      const yFront = (pageH - front.h) / 2;
      const yBack = (pageH - back.h) / 2;

      pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", margin, yFront, front.w, front.h);
      pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", margin * 2 + cardMaxW, yBack, back.w, back.h);

      pdf.save(`${currentGuard.firstName}_${currentGuard.lastName}_ID_Card.pdf`);
      toast.success("PDF downloaded!", { id: "pdf-download" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: "pdf-download" });
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchGuardById(id));
    }
    return () => {
      dispatch(clearCurrentGuard());
    };
  }, [dispatch, id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guard details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentGuard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Guard not found
          </h3>
          <p className="text-gray-600 mb-4">
            {error || "The guard you're looking for doesn't exist."}
          </p>
          <Button onClick={() => navigate("/guards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guards
          </Button>
        </Card>
      </div>
    );
  }

  const guardStatus =
    currentGuard.expiryDate &&
      new Date(currentGuard.expiryDate).getTime() < Date.now()
      ? "inactive"
      : "active";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/guards")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Guards
        </Button>
      </div>

      {/* Guard Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center">
              {currentGuard.photo ? (
                <img
                  src={currentGuard.photo}
                  alt={`${currentGuard.firstName} ${currentGuard.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {currentGuard.firstName} {currentGuard.lastName}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    guardStatus
                  )}`}
                >
                  {getStatusIcon(guardStatus)}
                  <span className="ml-2 capitalize">{guardStatus}</span>
                </span>
              </div>
              <p className="text-xl text-gray-600 mb-2">Security Guard</p>
              <p className="text-lg text-gray-500">
                {currentGuard.presentAddress || "No address"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/guards/${currentGuard._id}/edit`)}
            className="bg-blue-600 text-white hover:bg-blue-700 flex-none"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Guard
          </Button>
        </div>
      </Card>

      {/* ID Cards */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Identity Card</h3>
        <div className="flex flex-wrap gap-6 justify-center mb-5">
          <div>
            <p className="text-xs text-center text-gray-500 mb-2 uppercase tracking-wider font-medium">Front</p>
            <IDCardFront guard={currentGuard} cardRef={cardRef} />
          </div>
          <div>
            <p className="text-xs text-center text-gray-500 mb-2 uppercase tracking-wider font-medium">Back</p>
            <IDCardBack backRef={backCardRef} />
          </div>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={downloadPDF}
            className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Download ID Card (Front &amp; Back)
          </Button>
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">
                {currentGuard.email || "No email"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{currentGuard.contactNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-900">
                {currentGuard.presentAddress || "No address"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Emergency Contact</p>
              <p className="text-gray-900">
                {currentGuard.emergencyContactNumber || "No emergency contact"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Employment Details */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Employment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="text-gray-900">
                {new Date(currentGuard.joiningDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="text-gray-900">
                {currentGuard.dateOfBirth
                  ? new Date(currentGuard.dateOfBirth).toLocaleDateString()
                  : "Not provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Annual Salary</p>
              <p className="text-gray-900">
                {currentGuard.salary
                  ? `₹${currentGuard.salary.toLocaleString()}`
                  : "Not set"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="text-gray-900">
                {currentGuard.gender || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* KYC & Bank Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            KYC Documents
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Aadhaar Number</p>
              <p className="text-gray-900">
                {currentGuard.aadharNumber || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PAN Card Number</p>
              <p className="text-gray-900">
                {currentGuard.panNumber || "Not provided"}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bank Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="text-gray-900">
                {currentGuard.accountNumber || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="text-gray-900">
                {currentGuard.bankName || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">IFSC Code</p>
              <p className="text-gray-900">
                {currentGuard.ifscCode || "Not provided"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Children */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Children</h3>
        {currentGuard.children && currentGuard.children.length > 0 ? (
          <div className="space-y-3">
            {currentGuard.children.map((child, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <p className="text-gray-900 font-medium capitalize">
                    {child.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Age: {child.age}
                    {child.gender ? ` • ${child.gender}` : ""}
                  </p>
                </div>
                {child.phoneNumber && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{child.phoneNumber}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No children added.</p>
        )}
      </Card>
    </div>
  );
};
