import React from "react";
import classNames from "classnames";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = "md",
  shadow = "sm",
  hover = false,
}) => {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const shadowClasses = {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  return (
    <div
      className={classNames(
        "bg-white rounded-2xl border border-gray-200 transition-all duration-300",
        paddingClasses[padding],
        shadowClasses[shadow],
        hover && "hover:shadow-xl hover:scale-105 hover:border-gray-300",
        className
      )}
    >
      {children}
    </div>
  );
};
