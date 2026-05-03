import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { Card, Button } from "../components/common";
import apiService from "../services/api";
import toast from "react-hot-toast";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

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

const billGenerationSchema = yup.object().shape({
  year: yup
    .number()
    .required("Year is required")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  month: yup
    .number()
    .required("Month is required")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  tax: yup.number().min(0, "Tax must be 0 or greater").max(100, "Tax cannot exceed 100%"),
  notes: yup.string().max(500, "Notes cannot exceed 500 characters"),
});

interface BillGenerationFormData {
  year: number;
  month: number;
  tax?: number;
  notes?: string;
}

export const BillGeneration: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BillGenerationFormData>({
    resolver: yupResolver(billGenerationSchema) as any,
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      tax: 0,
      notes: "",
    },
  });

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        toast.error("Project ID is required");
        navigate("/projects");
        return;
      }

      try {
        const response = await apiService.getProject(projectId);
        if (response.status === "success") {
          setProjectData(response.data.project);
        } else {
          throw new Error(response.message || "Failed to load project");
        }
      } catch (error: any) {
        console.error("Error loading project:", error);
        toast.error("Failed to load project");
        navigate("/projects");
      }
    };

    loadProject();
  }, [projectId, navigate]);

  const onSubmit = async (data: BillGenerationFormData) => {
    if (!projectId) {
      toast.error("Project ID is required");
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.generateBill(projectId, {
        year: data.year,
        month: data.month,
        ...(data.tax && data.tax > 0 && { tax: data.tax }),
        ...(data.notes && { notes: data.notes }),
      });

      if (response.status === "success") {
        toast.success("Bill generated successfully");
        // Navigate using bill ID if available, otherwise use billNumber
        const billId = response.data._id || response.data.billNumber;
        navigate(`/bills/${billId}`, {
          state: { billData: response.data },
        });
      } else {
        throw new Error(response.message || "Failed to generate bill");
      }
    } catch (error: any) {
      console.error("Error generating bill:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to generate bill";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Bill</h1>
          {projectData && (
            <p className="text-gray-600 mt-1">{projectData.projectName}</p>
          )}
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Billing Period */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Billing Period
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("year", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.year.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("month", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.month.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tax */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Additional Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax (%)
                </label>
                <input
                  type="number"
                  {...register("tax", { valueAsNumber: true })}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.tax && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.tax.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              {...register("notes")}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes for this bill..."
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">
                {errors.notes.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Bill"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

