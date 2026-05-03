import React from "react";
import {
  Controller,
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Input, Select } from "../common";
import { SiteFormData } from "../../lib/validations/site";

interface SiteFormFieldsProps {
  register: UseFormRegister<SiteFormData>;
  control: Control<SiteFormData>;
  errors: FieldErrors<SiteFormData>;
  isModal?: boolean;
}

export const SiteFormFields: React.FC<SiteFormFieldsProps> = ({
  register,
  control,
  errors,
  isModal = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Basic Information */}
      {!isModal && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Basic Information
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Site Name *"
          placeholder="e.g., ABC Hotel, XYZ Office"
          {...register("name")}
          error={errors.name?.message}
          aria-label="Site name"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Type *
          </label>
          <Controller
            name="siteType"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select site type"
                options={[
                  { value: "Hotel", label: "Hotel" },
                  { value: "Office", label: "Office" },
                  { value: "Residential", label: "Residential" },
                  { value: "Event", label: "Event" },
                  { value: "Commercial", label: "Commercial" },
                  { value: "Industrial", label: "Industrial" },
                  { value: "Other", label: "Other" },
                ]}
                value={field.value}
                onValueChange={field.onChange}
                className="w-full"
              />
            )}
          />
          {errors.siteType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.siteType.message}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Address *"
        placeholder="Full address"
        {...register("address")}
        error={errors.address?.message}
        aria-label="Site address"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="City *"
          placeholder="City name"
          {...register("city")}
          error={errors.city?.message}
          aria-label="City"
        />

        <Input
          label="State"
          placeholder="State name"
          {...register("state")}
          error={errors.state?.message}
          aria-label="State"
        />

        <Input
          label="Postal Code"
          placeholder="Postal code"
          {...register("postalCode")}
          error={errors.postalCode?.message}
          aria-label="Postal code"
        />
      </div>

      <Input
        label="Country"
        placeholder="Country name"
        {...register("country")}
        error={errors.country?.message}
        aria-label="Country"
      />

      {/* Contact Information */}
      {!isModal && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Contact Information
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Contact Person Name *"
          placeholder="Contact person name"
          {...register("contactPersonName")}
          error={errors.contactPersonName?.message}
          aria-label="Contact person name"
        />

        <Input
          label="Contact Phone *"
          placeholder="Phone number"
          {...register("contactPhoneNumber")}
          error={errors.contactPhoneNumber?.message}
          aria-label="Contact phone number"
        />
      </div>

      <Input
        label="Contact Email"
        type="email"
        placeholder="Email address"
        {...register("contactEmail")}
        error={errors.contactEmail?.message}
        aria-label="Contact email"
      />

      {/* Site Details */}
      {!isModal && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Site Details
          </h2>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register("description")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Site description"
          rows={3}
          aria-label="Site description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Security Requirements
        </label>
        <textarea
          {...register("securityRequirements")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe security requirements for this site"
          rows={3}
          aria-label="Security requirements"
        />
        {errors.securityRequirements && (
          <p className="mt-1 text-sm text-red-600">
            {errors.securityRequirements.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Instructions
        </label>
        <textarea
          {...register("specialInstructions")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special instructions for guards"
          rows={3}
          aria-label="Special instructions"
        />
        {errors.specialInstructions && (
          <p className="mt-1 text-sm text-red-600">
            {errors.specialInstructions.message}
          </p>
        )}
      </div>

      {/* Status */}
      {!isModal && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Status
          </h2>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Site Status
        </label>
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  aria-label="Set site as active"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  aria-label="Set site as inactive"
                />
                <span className="ml-2 text-sm text-gray-700">Inactive</span>
              </label>
            </div>
          )}
        />
        {errors.isActive && (
          <p className="mt-1 text-sm text-red-600">{errors.isActive.message}</p>
        )}
      </div>
    </div>
  );
};
