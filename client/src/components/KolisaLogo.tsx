import { cn } from "@/lib/utils";

interface KolisaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 36, text: "text-lg", sub: "text-[8px]" },
  md: { icon: 48, text: "text-xl", sub: "text-[9px]" },
  lg: { icon: 64, text: "text-2xl", sub: "text-[10px]" },
  xl: { icon: 80, text: "text-4xl", sub: "text-xs" },
};

export default function KolisaLogo({ size = "md", showText = true, subtitle, className }: KolisaLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)} data-testid="kolisa-logo">
      <img
        src="/icons/icon-192x192.png"
        alt="KOLISA Logo"
        width={s.icon}
        height={s.icon}
        className="shrink-0 rounded-lg"
      />
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
