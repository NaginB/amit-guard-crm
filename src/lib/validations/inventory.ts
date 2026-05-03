import * as yup from "yup";

export const inventoryValidationSchema = yup.object({
  name: yup
    .string()
    .required("Inventory name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .trim(),
  description: yup
    .string()
    .max(200, "Description must not exceed 200 characters")
    .trim()
    .optional(),
  quantity: yup
    .number()
    .required("Quantity is required")
    .min(0, "Quantity must be non-negative")
    .integer("Quantity must be a whole number"),
  unit: yup
    .string()
    .required("Unit is required")
    .oneOf(
      ["pieces", "pairs", "sets", "units", "items"],
      "Invalid unit selected"
    ),
  isActive: yup.boolean().required("Status is required"),
});

export type InventoryFormData = yup.InferType<typeof inventoryValidationSchema>;
