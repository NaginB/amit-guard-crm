import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import classNames from "classnames";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  placeholder = "Select an option",
  options,
  value,
  onValueChange,
  disabled = false,
  className,
  wrapperClassName,
}) => {
  // Filter out options with empty string values to avoid Radix UI error
  const validOptions = options.filter((option) => option.value !== "");

  // Handle empty value by converting to undefined
  const selectValue = value === "" ? undefined : value;

  const handleValueChange = (newValue: string | undefined) => {
    if (onValueChange) {
      // Convert undefined back to empty string for our state management
      onValueChange(newValue || "");
    }
  };

  return (
    <div className={`w-full bg-white ${wrapperClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 transition-colors">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={selectValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={classNames(
            "w-full px-3 py-2 border overflow-hidden rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between",
            error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
              : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md animate-in fade-in-80">
            <SelectPrimitive.Viewport className="p-1">
              {validOptions.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && (
        <p className="mt-1 text-sm text-red-600 animate-pulse">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
