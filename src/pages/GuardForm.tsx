import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  User,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Users,
} from "lucide-react";
import { Card, Button, FileUpload, Dropdown } from "../components/common";
import {
  createGuard,
  updateGuard,
  fetchGuardById,
  clearError,
} from "../features/guards/guardSlice";
import apiService from "../services/api";
import type { AppDispatch, RootState } from "../app/store";
import type { Guard } from "../features/guards/guardSlice";

import toast from "react-hot-toast";

interface GuardFormData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  contactNumber: string;
  alternateContactNumber?: string;
  email?: string;
  presentAddress?: string;
  permanentAddress?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  salary?: number;
  aadharNumber?: string;
  panNumber?: string;
  photo?: string;
  photoPublicId?: string;
  fatherName?: string;
  motherName?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  joiningDate: string;
  expiryDate?: string;
}

interface Child {
  name: string;
  age: number;
  phoneNumber?: string;
  gender?: "Male" | "Female" | "Other";
}

export const GuardForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { currentGuard, loading, createLoading, updateLoading } = useSelector(
    (state: RootState) => state.guards
  );


  const [children, setChildren] = useState<Child[]>([]);
  const [childErrors, setChildErrors] = useState<
    Record<number, { name?: string; age?: string; gender?: string }>
  >({});
  const [uploadedImagePublicId, setUploadedImagePublicId] = useState<
    string | null
  >(null);


  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<GuardFormData>({
    mode: "onChange",
    defaultValues: {
      joiningDate: new Date().toISOString().split("T")[0],
    },
  });

  const joiningDateValue = watch("joiningDate");
  const expiryDateValue = watch("expiryDate");
  const gender = watch("gender");

  const formatAadhaar = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    const parts = digitsOnly.match(/.{1,4}/g) || [];
    return parts.slice(0, 4).join("-");
  };

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchGuardById(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (currentGuard && isEditMode) {
      reset({
        firstName: currentGuard.firstName,
        lastName: currentGuard.lastName,
        dateOfBirth: currentGuard.dateOfBirth
          ? new Date(currentGuard.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: currentGuard.gender,
        contactNumber: currentGuard.contactNumber,
        alternateContactNumber: currentGuard.alternateContactNumber,
        email: currentGuard.email,
        presentAddress: currentGuard.presentAddress,
        permanentAddress: currentGuard.permanentAddress,
        bankName: currentGuard.bankName,
        accountNumber: currentGuard.accountNumber,
        ifscCode: currentGuard.ifscCode,
        branchName: currentGuard.branchName,
        salary: currentGuard.salary,
        aadharNumber: currentGuard.aadharNumber,
        panNumber: currentGuard.panNumber,
        photo: currentGuard.photo,
        photoPublicId: currentGuard.photoPublicId,
        fatherName: currentGuard.fatherName,
        motherName: currentGuard.motherName,
        emergencyContactName: currentGuard.emergencyContactName,
        emergencyContactNumber: currentGuard.emergencyContactNumber,
        emergencyContactRelation: currentGuard.emergencyContactRelation,
        joiningDate: currentGuard.joiningDate
          ? new Date(currentGuard.joiningDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        expiryDate: currentGuard.expiryDate
          ? new Date(currentGuard.expiryDate).toISOString().split("T")[0]
          : "",
      });
      setChildren((currentGuard as Guard).children || []);

    }
  }, [currentGuard, isEditMode, reset]);

  const addChild = () => {
    setChildren([
      ...children,
      { name: "", age: 0, phoneNumber: "", gender: undefined },
    ]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (
    index: number,
    field: keyof Child,
    value: string | number | undefined
  ) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };



  const handleCancel = async () => {
    // Close any open modals or dialogs
    document.body.style.overflow = "auto";

    // Delete uploaded image if it exists and we're not in edit mode
    if (uploadedImagePublicId && !isEditMode) {
      try {
        await apiService.deleteUpload(uploadedImagePublicId);
      } catch (error) {
        console.warn("Failed to delete uploaded image:", error);
      }
    }

    navigate("/guards");
  };

  const validateChildren = () => {
    const errors: Record<number, { name?: string; age?: string; gender?: string }> = {};
    children.forEach((child, index) => {
      const fieldErrors: { name?: string; age?: string; gender?: string } = {};
      if (!child.name.trim()) {
        fieldErrors.name = "Name is required";
      }
      if (child.age > 100) {
        fieldErrors.age = "Age must not exceed 100";
      }
      if (!child.gender) {
        fieldErrors.gender = "Gender is required";
      }
      if (Object.keys(fieldErrors).length > 0) {
        errors[index] = fieldErrors;
      }
    });
    setChildErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (data: GuardFormData) => {
    dispatch(clearError());

    if (!validateChildren()) return;

    const guardData: Partial<Guard> = {
      ...data,
      dateOfBirth: data.dateOfBirth
        ? new Date(data.dateOfBirth).toISOString()
        : undefined,
      joiningDate: new Date(data.joiningDate).toISOString(),
      expiryDate: data.expiryDate
        ? new Date(data.expiryDate).toISOString()
        : undefined,
    };

    if (children.length > 0) {
      guardData.children = children;
    }



    try {
      if (isEditMode && id) {
        await dispatch(updateGuard({ id, guardData })).unwrap();
        toast.success("Guard updated successfully!");
      } else {
        const result = await dispatch(createGuard(guardData)).unwrap();
        const password = result.password;
        if (password) {
          toast.success(`Guard created successfully! Password: ${password}`, {
            duration: 10000,
          });
        } else {
          toast.success("Guard created successfully!");
        }
      }
      setUploadedImagePublicId(null); // Clear the uploaded image tracking
      navigate("/guards");
    } catch {
      void 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/guards")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guards
          </Button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditMode ? "Edit Guard" : "Add New Guard"}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {isEditMode
            ? "Update guard information"
            : "Fill in the details to add a new guard"}
        </p>
      </div>

      {/* Error Message (removed) */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 order-first">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo
                </label>
                <input type="hidden" {...register("photo")} />
                <input type="hidden" {...register("photoPublicId")} />
                <FileUpload
                  label="Upload guard image"
                  accept="image/*"
                  value={
                    watch("photo") !== undefined
                      ? watch("photo") || undefined
                      : (currentGuard as Guard | null)?.photo || undefined
                  }
                  imagePublicId={
                    watch("photoPublicId") !== undefined
                      ? watch("photoPublicId") || undefined
                      : (currentGuard as Guard | null)?.photoPublicId ||
                      undefined
                  }
                  onChange={(url, publicId) => {
                    setValue("photo", url, { shouldValidate: true });
                    setValue("photoPublicId", publicId || "", {
                      shouldValidate: true,
                    });
                    if (publicId) {
                      setUploadedImagePublicId(publicId);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="John"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.firstName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.lastName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  placeholder="1990-01-01"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.dateOfBirth
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("dateOfBirth", {
                    required: "Date of birth is required",
                  })}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <Dropdown
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" }
                  ]}
                  value={watch("gender") || ""}
                  onChange={(value) =>
                    setValue("gender", value as "Male" | "Female", {
                      shouldValidate: true,
                    })
                  }
                  placeholder="Select Gender"
                  className="w-full"
                  triggerClassName={
                    errors.gender
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }
                />
                {/* hidden input to register the custom dropdown with react-hook-form for validation */}
                <input
                  type="hidden"
                  {...register("gender", {
                    required: "Gender is required",
                  })}
                  value={watch("gender") || ""}
                />
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.contactNumber
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("contactNumber", {
                    required: "Contact number is required",
                    pattern: {
                      value: /^[+]?[-\s\d]{10,15}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                />
                {errors.contactNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="9123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("alternateContactNumber", {
                    pattern: {
                      value: /^[+]?[-\s\d]{10,15}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register("email")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joining Date *
                </label>
                <input
                  type="date"
                  placeholder="2025-01-01"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.joiningDate
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("joiningDate", {
                    required: "Joining date is required",
                  })}
                />
                {errors.joiningDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.joiningDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Card Validity
                </label>
                <Dropdown
                  options={Array.from({ length: 10 }).map((_, idx) => ({
                    value: String(idx + 1),
                    label: `${idx + 1} Year${idx + 1 > 1 ? "s" : ""}`,
                  }))}
                  value=""
                  onChange={(value) => {
                    const years = Number(value) || 0;
                    if (!joiningDateValue || years <= 0) return;
                    const base = new Date(joiningDateValue);
                    const expiry = new Date(base);
                    expiry.setFullYear(expiry.getFullYear() + years);
                    const iso = expiry.toISOString().split("T")[0];
                    setValue("expiryDate", iso, { shouldValidate: true });
                  }}
                  placeholder="Select validity (years)"
                  className="w-full"
                />
                <input
                  type="date"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-gray-50"
                  value={expiryDateValue || ""}
                  onChange={(e) =>
                    setValue("expiryDate", e.target.value, {
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>



        {/* Address Information */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Present Address *
                </label>
                <textarea
                  rows={3}
                  placeholder="123 Main St, Springfield, IL"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.presentAddress
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("presentAddress", {
                    required: "Present address is required",
                  })}
                />
                {errors.presentAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.presentAddress.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Address *
                </label>
                <textarea
                  rows={3}
                  placeholder="456 Elm St, Springfield, IL"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.permanentAddress
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("permanentAddress", {
                    required: "Permanent address is required",
                  })}
                />
                {errors.permanentAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.permanentAddress.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* KYC Documents */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              KYC Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number *
                </label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.aadharNumber
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("aadharNumber", {
                    required: "Aadhaar number is required",
                    pattern: {
                      value: /^(\d{4}-){3}\d{4}$/,
                      message: "Aadhaar must be XXXX-XXXX-XXXX-XXXX",
                    },
                    onChange: (e) => {
                      const formatted = formatAadhaar(e.target.value);
                      setValue("aadharNumber", formatted, {
                        shouldValidate: true,
                      });
                    },
                  })}
                />
                {errors.aadharNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.aadharNumber.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number *
                </label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.panNumber
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("panNumber", {
                    required: "PAN number is required",
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                      message: "Invalid PAN format",
                    },
                  })}
                />
                {errors.panNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.panNumber.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Family Information */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Family Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name *
                </label>
                <input
                  type="text"
                  placeholder="Robert Doe"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.fatherName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("fatherName", {
                    required: "Father's name is required",
                  })}
                />
                {errors.fatherName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.fatherName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mother's Name *
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.motherName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("motherName", {
                    required: "Mother's name is required",
                  })}
                />
                {errors.motherName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.motherName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  placeholder="Alice Doe"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.emergencyContactName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("emergencyContactName", {
                    required: "Emergency contact name is required",
                  })}
                />
                {errors.emergencyContactName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.emergencyContactName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Number *
                </label>
                <input
                  type="tel"
                  placeholder="9000000000"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.emergencyContactNumber
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("emergencyContactNumber", {
                    required: "Emergency contact number is required",
                    pattern: {
                      value: /^[+]?[-\s\d]{10,15}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                />
                {errors.emergencyContactNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.emergencyContactNumber.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <input
                  type="text"
                  placeholder="Spouse"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.emergencyContactRelation
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("emergencyContactRelation", {
                    required: "Emergency contact relationship is required",
                  })}
                />
                {errors.emergencyContactRelation && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.emergencyContactRelation.message}
                  </p>
                )}
              </div>
            </div>

            {/* Children */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Children
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addChild}
                  className="text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Child
                </Button>
              </div>
              {children.map((child, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                  {/* Card header with index and delete button */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Child {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Child Name"
                        value={child.name}
                        onChange={(e) => {
                          updateChild(index, "name", e.target.value);
                          if (e.target.value.trim()) {
                            setChildErrors((prev) => {
                              const updated = { ...prev };
                              if (updated[index]) {
                                delete updated[index].name;
                                if (!Object.keys(updated[index]).length)
                                  delete updated[index];
                              }
                              return updated;
                            });
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          childErrors[index]?.name
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                      {childErrors[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {childErrors[index].name}
                        </p>
                      )}
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        placeholder="10"
                        min={0}
                        max={100}
                        value={child.age || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateChild(index, "age", val);
                          setChildErrors((prev) => {
                            const updated = { ...prev };
                            if (val <= 100) {
                              if (updated[index]) {
                                delete updated[index].age;
                                if (!Object.keys(updated[index]).length)
                                  delete updated[index];
                              }
                            } else {
                              updated[index] = {
                                ...updated[index],
                                age: "Age must not exceed 100",
                              };
                            }
                            return updated;
                          });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          childErrors[index]?.age
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                      {childErrors[index]?.age && (
                        <p className="mt-1 text-sm text-red-600">
                          {childErrors[index].age}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="9000000000"
                        value={child.phoneNumber || ""}
                        onChange={(e) =>
                          updateChild(index, "phoneNumber", e.target.value)
                        }
                        pattern="^[+]?[-\s\d]{10,15}$"
                        title="Enter a valid phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <Dropdown
                        options={[
                          { value: "Male", label: "Male" },
                          { value: "Female", label: "Female" },
                        ]}
                        value={child.gender || ""}
                        onChange={(value) => {
                          updateChild(
                            index,
                            "gender",
                            value as "Male" | "Female"
                          );
                          setChildErrors((prev) => {
                            const updated = { ...prev };
                            if (updated[index]) {
                              delete updated[index].gender;
                              if (!Object.keys(updated[index]).length)
                                delete updated[index];
                            }
                            return updated;
                          });
                        }}
                        placeholder="Select Gender"
                        className="w-full"
                        triggerClassName={
                          childErrors[index]?.gender
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }
                      />
                      {childErrors[index]?.gender && (
                        <p className="mt-1 text-sm text-red-600">
                          {childErrors[index].gender}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Bank Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  placeholder="HDFC Bank"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.bankName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("bankName", {
                    required: "Bank name is required",
                  })}
                />
                {errors.bankName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.bankName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  placeholder="123456789012"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.accountNumber
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("accountNumber", {
                    required: "Account number is required",
                  })}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  placeholder="HDFC0001234"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.ifscCode
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("ifscCode", {
                    required: "IFSC code is required",
                  })}
                />
                {errors.ifscCode && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.ifscCode.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  placeholder="Andheri West"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.branchName
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("branchName", {
                    required: "Branch name is required",
                  })}
                />
                {errors.branchName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.branchName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary (Annual) *
                </label>
                <input
                  type="number"
                  placeholder="500000"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.salary
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  {...register("salary", {
                    valueAsNumber: true,
                    required: "Salary is required",
                  })}
                />
                {errors.salary && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.salary.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>



        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createLoading || updateLoading}>
            {createLoading || updateLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditMode ? "Updating..." : "Creating..."}
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update Guard" : "Create Guard"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
