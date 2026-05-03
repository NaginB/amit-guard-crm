import * as yup from "yup";

export interface ProjectFormData {
  projectName: string;
  siteId: string;
  status: "Active" | "Closed" | "On Hold";
  guardAssignments: Array<{
    guardId: string;
    startDate: string;
    endDate?: string | null;
    shiftType: "Full Day" | "Full Night" | "Half Day" | "Half Night";
    monthlyRate: number;
  }>;
  description?: string | null;
  specialInstructions?: string | null;
}

export const projectValidationSchema = yup.object({
  projectName: yup.string().required("Project name is required").trim(),
  siteId: yup.string().required("Site is required"),
  status: yup
    .string()
    .oneOf(["Active", "Closed", "On Hold"], "Invalid project status")
    .required("Project status is required"),
  guardAssignments: yup
    .array()
    .of(
      yup.object({
        guardId: yup.string().required("Guard is required"),
        startDate: yup.string().required("Assignment start date is required"),
        endDate: yup.string().nullable().optional(),
        shiftType: yup
          .string()
          .oneOf(
            ["Full Day", "Full Night", "Half Day", "Half Night"],
            "Invalid shift type"
          )
          .required("Shift type is required"),
        monthlyRate: yup
          .number()
          .positive("Monthly rate must be positive")
          .required("Monthly rate is required"),
      })
    )
    .min(1, "At least one guard assignment is required")
    .required("Guard assignments are required"),
  description: yup.string().nullable().optional().trim(),
  specialInstructions: yup.string().nullable().optional().trim(),
});
