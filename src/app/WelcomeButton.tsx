"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type WelcomeButtonProps = {
  children: React.ReactNode;
  color?: "blue" | "orange" | "green" | "gray";
  href?: string;
  onClickAction?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  icon?: LucideIcon;
};

const colorGradients: Record<string, string> = {
  blue: "linear-gradient(90deg, #1657F0 0%, #36D7E0 100%)",
  orange: "linear-gradient(90deg, #FF7300 0%, #FFA726 100%)",
  green: "linear-gradient(90deg, #10B981 0%, #34D399 100%)",
  gray: "linear-gradient(90deg, #9CA3AF 0%, #D1D5DB 100%)",
};

export function WelcomeButton({
  children,
  color = "gray",
  href,
  onClickAction,
  className,
  type = "button",
  disabled = false,
  icon: Icon,
}: WelcomeButtonProps) {
  const gradient = colorGradients[color] || colorGradients.gray;

  const baseClasses =
    "w-full max-w-[340px] mx-auto flex items-center justify-center rounded-button h-[54px] text-lg font-bold font-montserrat cursor-pointer transition-all duration-300 ease-in-out shadow-neumorphic disabled:opacity-50 disabled:cursor-not-allowed";

  // Estado normal: gris
  const defaultStyling = {
    background: colorGradients.gray,
    color: "#374151"
  };

  const Comp = href ? "a" : "button";

  return (
    <Comp
      href={href}
      onClick={onClickAction}
      type={!href ? type : undefined}
      disabled={disabled}
      style={defaultStyling}
      className={cn(
        baseClasses,
        "transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95",
        !disabled && "hover:shadow-lg",
        className
      )}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      <span className="flex items-center justify-center gap-3">
        {Icon && <Icon className="h-6 w-6 flex-shrink-0" />}
        <span className="leading-none">{children}</span>
      </span>
    </Comp>
  );
}
