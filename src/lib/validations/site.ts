import * as yup from "yup";

export const siteValidationSchema = yup.object({
  name: yup
    .string()
    .required("Site name is required")
    .min(2, "Site name must be at least 2 characters")
    .max(100, "Site name must not exceed 100 characters")
    .trim(),
  address: yup
    .string()
    .required("Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must not exceed 200 characters")
    .trim(),
  city: yup
    .string()
    .required("City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters")
    .trim(),
  state: yup
    .string()
    .max(50, "State must not exceed 50 characters")
    .trim()
    .optional(),
  postalCode: yup
    .string()
    .max(10, "Postal code must not exceed 10 characters")
    .trim()
    .optional(),
  country: yup.string().default("India").trim(),
  contactPersonName: yup
    .string()
    .required("Contact person name is required")
    .max(100, "Contact person name must not exceed 100 characters")
    .trim(),
  contactPhoneNumber: yup
    .string()
    .required("Contact phone number is required")
    .matches(/^[0-9+\-\s()]+$/, "Invalid phone number format")
    .max(15, "Phone number must not exceed 15 characters")
    .trim(),
  contactEmail: yup
    .string()
    .email("Invalid email format")
    .max(100, "Email must not exceed 100 characters")
    .trim()
    .optional(),
  siteType: yup
    .string()
    .required("Site type is required")
    .oneOf(
      [
        "Hotel",
        "Office",
        "Residential",
        "Event",
        "Commercial",
        "Industrial",
        "Other",
      ],
      "Invalid site type"
    ),
  description: yup
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),
  securityRequirements: yup
    .string()
    .max(300, "Security requirements must not exceed 300 characters")
    .trim()
    .optional(),
  specialInstructions: yup
    .string()
    .max(500, "Special instructions must not exceed 500 characters")
    .trim()
    .optional(),
  isActive: yup.boolean().default(true),
});

export type SiteFormData = yup.InferType<typeof siteValidationSchema>;
