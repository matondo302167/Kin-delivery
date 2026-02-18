import { cn } from "@/lib/utils";

interface KolisaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, text: "text-lg", sub: "text-[8px]" },
  md: { icon: 36, text: "text-xl", sub: "text-[9px]" },
  lg: { icon: 48, text: "text-2xl", sub: "text-[10px]" },
  xl: { icon: 64, text: "text-4xl", sub: "text-xs" },
};

export default function KolisaLogo({ size = "md", showText = true, subtitle, className }: KolisaLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)} data-testid="kolisa-logo">
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="120" height="120" rx="28" fill="#1B5E20" />
        <path
          d="M30 25 L30 95 L48 95 L48 65 L68 95 L90 95 L64 58 L86 25 L66 25 L48 55 L48 25 Z"
          fill="#FACC15"
        />
        <circle cx="82" cy="82" r="12" fill="#FACC15" />
        <circle cx="82" cy="82" r="6" fill="#1B5E20" />
        <circle cx="82" cy="82" r="2.5" fill="#FACC15" />
      </svg>
      {showText && (
        <div className="leading-none">
          <span className={cn(s.text, "font-black tracking-tight text-[#1B5E20] font-display block leading-none")}>
            KOLISA
          </span>
          {subtitle && (
            <span className={cn(s.sub, "font-bold uppercase tracking-widest text-muted-foreground mt-0.5 block")}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
