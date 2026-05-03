import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowLeft } from "lucide-react";
import { Card, Button } from "../components/common";
import { SiteFormFields } from "../components/forms/SiteFormFields";
import toast from "react-hot-toast";
import {
  fetchSiteById,
  createSite,
  updateSite,
  clearCurrentSite,
} from "../features/sites/siteSlice";
import type { AppDispatch, RootState } from "../app/store";
import { siteValidationSchema, SiteFormData } from "../lib/validations/site";

export const SiteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.sites);
  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SiteFormData>({
    resolver: yupResolver(siteValidationSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      contactPersonName: "",
      contactPhoneNumber: "",
      contactEmail: "",
      siteType: "Office",
      description: "",
      securityRequirements: "",
      specialInstructions: "",
      isActive: true,
    },
  });

  useEffect(() => {
    let isMounted = true;
    const loadSite = async () => {
      if (isEditing && id) {
        try {
          const site = await dispatch(fetchSiteById(id)).unwrap();
          if (!isMounted) return;
          reset({
            name: site.name || "",
            address: site.address || "",
            city: site.city || "",
            state: site.state || "",
            postalCode: site.postalCode || "",
            country: site.country || "India",
            contactPersonName: site.contactPersonName || "",
            contactPhoneNumber: site.contactPhoneNumber || "",
            contactEmail: site.contactEmail || "",
            siteType: site.siteType || "Office",
            description: site.description || "",
            securityRequirements: site.securityRequirements || "",
            specialInstructions: site.specialInstructions || "",
            isActive: site.isActive ?? true,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to load site";
          toast.error(errorMessage);
        }
      }
    };

    loadSite();

    return () => {
      isMounted = false;
      dispatch(clearCurrentSite());
    };
  }, [dispatch, id, isEditing, reset]);

  const onSubmit = async (data: SiteFormData) => {
    try {
      if (isEditing && id) {
        await dispatch(updateSite({ id, siteData: data })).unwrap();
        toast.success("Site updated successfully!");
      } else {
        await dispatch(createSite(data)).unwrap();
        toast.success("Site created successfully!");
      }
      navigate("/sites");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save site";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading site...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/sites")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Site" : "Add New Site"}
            </h1>
            <p className="text-gray-600">
              {isEditing ? "Update site information" : "Create a new site"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <SiteFormFields
            register={register}
            control={control}
            errors={errors}
            isModal={false}
          />

          {/* Form Actions */}
          <div className="flex space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/sites")}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? "Processing..."
                : isEditing
                ? "Update Site"
                : "Create Site"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
