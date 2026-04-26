import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconWrapperProps {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  strokeWidth?: number;
}

const sizeMap = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

/**
 * Icône wrapper standardisée pour garantir une cohérence visuelle
 * dans toute l'application. Utilise lucide-react avec des propriétés uniformes.
 */
export default function IconWrapper({
  icon: Icon,
  size = "md",
  className,
  strokeWidth = 2,
}: IconWrapperProps) {
  return (
    <Icon
      className={cn(sizeMap[size], className)}
      strokeWidth={strokeWidth}
    />
  );
}

export { sizeMap };

