import React, { useEffect } from "react";
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
  Banknote,
  FileText,
  Users,
  Printer,
  type LucideIcon,
} from "lucide-react";
import { Card, Button } from "../components/common";
import { fetchGuardById, clearCurrentGuard } from "../features/guards/guardSlice";
import type { AppDispatch, RootState } from "../app/store";
import { useDispatch, useSelector } from "react-redux";
import { GuardIDCardSection } from "../components/guards/GuardIDCard";
import { GuardPrintProfile } from "../components/guards/GuardPrintProfile";
import { padToThreeDigits } from "../lib/utils";

// ─── Reusable components ──────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: LucideIcon; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="flex items-start space-x-3">
    <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
    <div className="min-w-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900 font-medium break-words">{value}</p>
    </div>
  </div>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm text-gray-900 font-medium">{value}</p>
  </div>
);

const DocumentPreview: React.FC<{ label: string; src?: string }> = ({ label, src }) => (
  <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
    <p className="text-xs font-medium text-gray-700 mb-2">{label}</p>
    {src ? (
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt={label} className="w-full h-32 object-cover rounded shadow-sm hover:opacity-90 transition-opacity" />
      </a>
    ) : (
      <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs border border-dashed border-gray-300">
        Not provided
      </div>
    )}
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode; cols?: 2 | 3 }> = ({
  title,
  children,
  cols = 2,
}) => (
  <Card>
    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
      {title}
    </h3>
    <div className={cols === 3 ? "grid grid-cols-1 sm:grid-cols-3 gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>{children}</div>
  </Card>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export const GuardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentGuard, loading, error } = useSelector(
    (state: RootState) => state.guards
  );

  useEffect(() => {
    if (id) dispatch(fetchGuardById(id));
    return () => { dispatch(clearCurrentGuard()); };
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Guard not found</h3>
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

  const isExpired =
    currentGuard.expiryDate &&
    new Date(currentGuard.expiryDate).getTime() < Date.now();
  const guardStatus = isExpired ? "inactive" : "active";

  const statusStyles = {
    active: "bg-blue-100 text-blue-800 border-blue-200",
    inactive: "bg-red-100 text-red-800 border-red-200",
  };

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not provided";

  return (
    <>
      <div className="max-w-5xl mx-auto p-6 space-y-5">

        {/* Back button */}
        <Button variant="outline" onClick={() => navigate("/guards")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Guards
        </Button>

        {/* Guard header */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-5">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
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
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentGuard.firstName} {currentGuard.lastName}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[guardStatus]}`}>
                    {guardStatus === "active" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span className="capitalize">{guardStatus}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-0.5">Security Guard · Guard ID: <span className="font-semibold">{padToThreeDigits(Number(currentGuard.guardId)) || "N/A"}</span></p>
                <p className="text-sm text-gray-500">{currentGuard.presentAddress || "No address"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-none"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Profile
              </Button>
              <Button
                onClick={() => navigate(`/guards/${currentGuard._id}/edit`)}
                className="bg-blue-600 text-white hover:bg-blue-700 flex-none"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Guard
              </Button>
            </div>
          </div>
        </Card>

        {/* ID Card */}
        <Card>
          <GuardIDCardSection guard={currentGuard} />
        </Card>

        {/* Personal Information */}
        <SectionCard title="Personal Information" cols={3}>
          <Field label="First Name" value={currentGuard.firstName} />
          <Field label="Last Name" value={currentGuard.lastName} />
          <Field label="Gender" value={currentGuard.gender || "Not specified"} />
          <Field label="Date of Birth" value={fmt(currentGuard.dateOfBirth)} />
          <Field label="Father's Name" value={(currentGuard as any).fatherName || "Not provided"} />
          <Field label="Mother's Name" value={(currentGuard as any).motherName || "Not provided"} />
          <Field label="Designation" value={(currentGuard as any).designation || "Not provided"} />
        </SectionCard>

        {/* Contact Information */}
        <SectionCard title="Contact Information" cols={2}>
          <InfoRow icon={Phone} label="Primary Phone" value={currentGuard.contactNumber || "Not provided"} />
          <InfoRow icon={Phone} label="Alternate Phone" value={(currentGuard as any).alternateContactNumber || "Not provided"} />
          <InfoRow icon={Mail} label="Email" value={currentGuard.email || "Not provided"} />
          <InfoRow icon={MapPin} label="Present Address" value={currentGuard.presentAddress || "Not provided"} />
          <InfoRow icon={MapPin} label="Permanent Address" value={(currentGuard as any).permanentAddress || "Not provided"} />
        </SectionCard>

        {/* Emergency Contact */}
        <SectionCard title="Emergency Contact" cols={3}>
          <InfoRow icon={User} label="Contact Name" value={(currentGuard as any).emergencyContactName || "Not provided"} />
          <InfoRow icon={Phone} label="Contact Number" value={currentGuard.emergencyContactNumber || "Not provided"} />
          <InfoRow icon={Users} label="Relation" value={(currentGuard as any).emergencyContactRelation || "Not provided"} />
        </SectionCard>

        {/* Employment Details */}
        <SectionCard title="Employment Details" cols={3}>
          <InfoRow icon={Calendar} label="Joining Date" value={fmt(currentGuard.joiningDate)} />
          <InfoRow icon={DollarSign} label="Salary" value={currentGuard.salary ? `₹${currentGuard.salary.toLocaleString()}` : "Not set"} />
          <InfoRow icon={Shield} label="Guard ID" value={` ${padToThreeDigits(Number(currentGuard.guardId)) || "N/A"}`} />
        </SectionCard>

        {/* KYC & Bank Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">KYC Documents</h3>
            <div className="space-y-4">
              <div>
                <InfoRow icon={FileText} label="Aadhaar Number" value={currentGuard.aadharNumber || "Not provided"} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <DocumentPreview label="Aadhaar Front" src={(currentGuard as any).aadharCardFront} />
                  <DocumentPreview label="Aadhaar Back" src={(currentGuard as any).aadharCardBack} />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <InfoRow icon={FileText} label="PAN Card Number" value={currentGuard.panNumber || "Not provided"} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <DocumentPreview label="PAN Front" src={(currentGuard as any).panCardFront} />
                  <DocumentPreview label="PAN Back" src={(currentGuard as any).panCardBack} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Bank Details</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <InfoRow icon={Banknote} label="Bank Name" value={currentGuard.bankName || "Not provided"} />
                <InfoRow icon={Banknote} label="Account Number" value={currentGuard.accountNumber || "Not provided"} />
                <InfoRow icon={Banknote} label="IFSC Code" value={currentGuard.ifscCode || "Not provided"} />
                <InfoRow icon={Banknote} label="Branch Name" value={(currentGuard as any).branchName || "Not provided"} />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <DocumentPreview label="Bank Proof (Passbook / Cheque)" src={(currentGuard as any).bankProof} />
              </div>
            </div>
          </Card>
        </div>

        {/* Children */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Children {currentGuard.children?.length ? `(${currentGuard.children.length})` : ""}
          </h3>
          {currentGuard.children && currentGuard.children.length > 0 ? (
            <div className="space-y-3">
              {currentGuard.children.map((child, index) => (
                <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                  <Field label="Name" value={child.name} />
                  <Field label="Age" value={String(child.age)} />
                  <Field label="Gender" value={child.gender || "—"} />
                  <Field label="Phone" value={child.phoneNumber || "—"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No children added.</p>
          )}
        </Card>
      </div>

      {/* Print-only profile — hidden on screen, shown on print */}
      <GuardPrintProfile guard={currentGuard} />

    </>
  );
};
