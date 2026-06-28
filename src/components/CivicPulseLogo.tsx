import React from "react";
import { motion } from "motion/react";

interface CivicPulseLogoProps {
  variant?: "primary" | "icon" | "square-icon" | "circular-icon" | "monogram" | "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl" | number;
  animate?: boolean;
  className?: string;
  hideTextOnMobile?: boolean;
}

export default function CivicPulseLogo({
  variant = "primary",
  size = "md",
  animate = true,
  className = "",
  hideTextOnMobile = false,
}: CivicPulseLogoProps) {
  // Map size keys to pixels or use custom numbers
  const getSizeInPixels = () => {
    if (typeof size === "number") return size;
    switch (size) {
      case "sm":
        return 32;
      case "md":
        return 48;
      case "lg":
        return 64;
      case "xl":
        return 120;
      default:
        return 48;
    }
  };

  const pixelSize = getSizeInPixels();

  // SVG gradient IDs to ensure unique instances
  const blueGradientId = "civicPulseBlueGrad";
  const cyanGradientId = "civicPulseCyanGrad";
  const glowFilterId = "civicPulseGlow";

  // Animation variants
  const logoContainerVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    tap: { scale: 0.95 },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.02, 1],
      opacity: [0.95, 1, 0.95],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const sparkVariants = {
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 90, 0],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const drawPulseVariants = {
    initial: { pathLength: 0, opacity: 0.5 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, ease: "easeInOut" },
        opacity: { duration: 0.5 },
      },
    },
  };

  // Base SVG Icon Component
  const SvgIcon = ({ customColor }: { customColor?: string }) => {
    const isMonogram = variant === "monogram";
    const isLightMode = variant === "light";

    // Colors
    const primaryBlue = customColor || "#4285F4";
    const accentCyan = isMonogram ? "#FFFFFF" : "#22D3EE";
    const accentTeal = isMonogram ? "#FFFFFF" : "#0D9488";
    const pulseStroke = isLightMode ? "#1E3A8A" : (isMonogram ? "#FFFFFF" : "#00F2FE");

    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block overflow-visible"
        style={{
          filter: animate && !isMonogram ? `url(#${glowFilterId})` : "none",
        }}
      >
        <defs>
          {/* Main Google Blue Gradient */}
          <linearGradient id={blueGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Hyperlocal Cyan/Teal Gradient */}
          <linearGradient id={cyanGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentCyan} />
            <stop offset="100%" stopColor={accentTeal} />
          </linearGradient>

          {/* Premium Ambient Glow Filter */}
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Subtle Neural Pulse Ring Background (Community & Scale) */}
        {!isMonogram && (
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            stroke={primaryBlue}
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.2"
            animate={animate ? { rotate: 360 } : undefined}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* 2. Outer Geometric "C" Arc (Civic / Community) */}
        <motion.path
          d="M 75,30 A 32,32 0 1 0 75,70"
          stroke={isMonogram ? "#FFFFFF" : `url(#${blueGradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={animate ? { pathLength: 1 } : undefined}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* 3. The Map of India Silhouette - High-tech, glassy, glowing, with highly accurate geographic contours */}
        <motion.path
          d="M 50,22 C 48,22 46,23 45,25 C 44,27 45,29 42,30 C 39,31 38,34 38,36 C 38,38 34,39 33,41 C 32,43 30,42 29,44 C 28,46 27,48 29,49 C 31,50 33,49 35,49 C 36,49 37,51 37,53 C 37,55 38,57 40,59 C 42,61 44,64 46,67 C 48,70 49,73 50,77 C 51,73 52,70 54,67 C 56,64 58,61 60,59 C 62,57 63,55 63,53 C 63,51 61,50 60,49 C 59,48 58,47 58,46 C 58,45 60,44 61,44 C 62,44 63,42 64,42 C 65,42 66,41 68,41 C 70,41 73,39 74,41 C 75,43 73,45 71,46 C 69,47 67,46 66,48 C 65,50 63,51 62,52 C 61,53 59,51 58,50 C 57,49 56,47 55,46 C 54,45 55,42 54,40 C 53,38 54,35 53,33 C 52,31 53,28 52,26 C 51,24 51,22 50,22 Z"
          fill={isMonogram ? "rgba(34, 211, 238, 0.15)" : `url(#${cyanGradientId})`}
          fillOpacity={isMonogram ? "0.15" : "0.15"}
          stroke={isMonogram ? "#FFFFFF" : `url(#${cyanGradientId})`}
          strokeWidth={isMonogram ? 2.5 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* 4. Active Civic Pulse Wave passing through the heart of the country */}
        {!isMonogram && (
          <>
            {/* Glow backing */}
            <path
              d="M 24,50 H 42 L 46,36 L 50,64 L 54,42 L 58,50 H 75"
              stroke="#00F2FE"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
              style={{ filter: "blur(3px)" }}
            />
            {/* Main Pulse Path */}
            <motion.path
              d="M 24,50 H 42 L 46,36 L 50,64 L 54,42 L 58,50 H 75"
              stroke={`url(#${cyanGradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={animate ? drawPulseVariants : undefined}
              initial={animate ? "initial" : undefined}
              animate={animate ? "animate" : undefined}
            />
          </>
        )}

        {/* 5. Smart AI Spark (Intelligence & Verifiability) */}
        <motion.path
          d="M 78,16 Q 78,28 90,28 Q 78,28 78,40 Q 78,28 66,28 Q 78,28 78,16 Z"
          fill={isMonogram ? "#FFFFFF" : `url(#${cyanGradientId})`}
          variants={animate ? sparkVariants : undefined}
          initial={animate ? "initial" : undefined}
          animate={animate ? "animate" : undefined}
        />

        {/* 6. Glowing Varanasi Location Node on the Map of India (x:54, y:45) */}
        {!isMonogram && (
          <motion.circle
            cx="54"
            cy="45"
            r="3.5"
            fill="#FFFFFF"
            stroke={primaryBlue}
            strokeWidth="1.5"
            animate={animate ? { scale: [1, 1.4, 1] } : undefined}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>
    );
  };

  // Wrapper with animations or container options
  const renderWrapper = (children: React.ReactNode) => {
    if (!animate) return <div className={`inline-flex items-center ${className}`}>{children}</div>;

    return (
      <motion.div
        variants={logoContainerVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        className={`inline-flex items-center cursor-pointer ${className}`}
      >
        {children}
      </motion.div>
    );
  };

  // 1. App Icon Variant (Square Container)
  if (variant === "square-icon") {
    return renderWrapper(
      <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3 flex items-center justify-center shadow-xl shadow-black/40">
        <SvgIcon />
      </div>
    );
  }

  // 2. Circular Icon/Avatar Variant
  if (variant === "circular-icon") {
    return renderWrapper(
      <div className="bg-[#1E293B] border border-blue-500/30 rounded-full p-2.5 flex items-center justify-center shadow-lg shadow-blue-500/10">
        <SvgIcon />
      </div>
    );
  }

  // 3. Monogram / Flat Simple Icons
  if (variant === "monogram" || variant === "icon") {
    return renderWrapper(<SvgIcon />);
  }

  // 4. Primary Logo + Text (Wordmark version)
  return renderWrapper(
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center shrink-0">
        <SvgIcon />
      </div>
      <div className={`flex flex-col select-none ${hideTextOnMobile ? "hidden sm:flex" : "flex"}`}>
        <div className="flex items-center">
          <span className="font-extrabold tracking-tight text-white leading-none font-sans text-2xl md:text-3xl">
            CivicPulse
          </span>
          <span className="ml-1.5 px-2 py-0.5 rounded text-sm font-black tracking-wide uppercase bg-blue-600/20 text-blue-400 border border-blue-500/20">
            AI
          </span>
        </div>
      </div>
    </div>
  );
}
