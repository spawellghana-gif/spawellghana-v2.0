import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  // Dimensions based on size
  const dimensions = {
    sm: { width: "w-8", height: "h-8", textClass: "text-sm", taglineClass: "text-[7px]" },
    md: { width: "w-12", height: "h-12", textClass: "text-base", taglineClass: "text-[8px]" },
    lg: { width: "w-24", height: "h-24", textClass: "text-2xl", taglineClass: "text-[10px]" },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Line Art Logo Icon */}
      <div className={`${dimensions.width} ${dimensions.height} text-emerald-600 shrink-0 select-none`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Therapist & Client Line Art */}
          <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Therapist Head */}
            <path d="M42 27 C38 21, 41 16, 46 17 C50 18, 51 23, 47 28 C45 30, 42 29, 42 27 Z" />
            
            {/* Therapist Back & Arm */}
            <path d="M48 24 C53 27, 57 32, 58 37 C60 41, 64 45, 66 45" />
            
            {/* Therapist Arms pressing down */}
            <path d="M43 32 L38 46" />
            <path d="M49 34 L43 47" />
            
            {/* Client Head / Face Cradle (Left curve) */}
            <path d="M25 45 C18 43, 19 51, 22 51 C24 51, 30 47, 33 49" />
            
            {/* Client Body Contour (Wave) */}
            <path d="M33 49 C38 46, 44 48, 51 51 C57 53, 64 50, 71 48 T 83 51" />
            
            {/* Back pressure area contour */}
            <path d="M51 51 C50 48, 49 43, 52 41 C54 39, 56 42, 57 45" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="font-sans font-black tracking-tight uppercase leading-none text-[11px] sm:text-xs md:text-sm lg:text-base" style={{ color: "#6ca863" }}>
            SPAWELL GHANA
          </div>
          {/* Thin horizontal line */}
          <div className="h-[1px] w-full my-0.5 sm:my-1" style={{ backgroundColor: "#6ca863" }} />
          <div className="font-sans font-bold tracking-[0.15em] uppercase leading-none text-[5.5px] sm:text-[7px] md:text-[8px]" style={{ color: "#6ca863" }}>
            THE CARE YOU DESERVE!
          </div>
        </div>
      )}
    </div>
  );
}
