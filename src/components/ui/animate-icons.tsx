"use client";

import React, { useState } from "react";

interface AnimateIconProps {
  size?: number;
  className?: string;
  tone?: "primary" | "grape" | "bubblegum" | "sunny" | "mint" | "sky" | "current";
  animateOnHoverOnly?: boolean;
}

export function AnimateTeddyIcon({
  size = 28,
  className = "",
  animateOnHoverOnly = false,
}: AnimateIconProps) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || !animateOnHoverOnly;

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-300 ${active ? "animate-wiggle" : ""}`}
      >
        {/* Left Ear */}
        <circle cx="8" cy="8" r="4.5" fill="#FFB38A" stroke="#3B1F5C" strokeWidth="1.75" />
        <circle cx="8" cy="8" r="2.2" fill="#FF8FA3" />
        {/* Right Ear */}
        <circle cx="24" cy="8" r="4.5" fill="#FFB38A" stroke="#3B1F5C" strokeWidth="1.75" />
        <circle cx="24" cy="8" r="2.2" fill="#FF8FA3" />
        {/* Head */}
        <ellipse cx="16" cy="18" rx="10" ry="9" fill="#FFD23F" stroke="#3B1F5C" strokeWidth="1.75" />
        {/* Muzzle */}
        <ellipse cx="16" cy="20" rx="4.5" ry="3.5" fill="#FFF8EC" />
        {/* Eyes */}
        <circle cx="12.5" cy="16" r="1.4" fill="#3B1F5C" />
        <circle cx="19.5" cy="16" r="1.4" fill="#3B1F5C" />
        {/* Nose & Smile */}
        <ellipse cx="16" cy="19" rx="1.5" ry="1.1" fill="#FF6FAE" />
        <path d="M14.5 21.5C15 22.3 17 22.3 17.5 21.5" stroke="#3B1F5C" strokeWidth="1.2" strokeLinecap="round" />
        {/* Cheeks */}
        <circle cx="10" cy="19" r="1.5" fill="#FF6FAE" fillOpacity="0.45" />
        <circle cx="22" cy="19" r="1.5" fill="#FF6FAE" fillOpacity="0.45" />
      </svg>
    </span>
  );
}

export function AnimateSparkleIcon({ size = 24, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-500 hover:rotate-45 hover:scale-125"
      >
        <path
          d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
          fill="#FFD23F"
          stroke="#3B1F5C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="5" r="1.5" fill="#FF6FAE" />
        <circle cx="5" cy="19" r="1.2" fill="#4CC9F0" />
      </svg>
    </span>
  );
}

export function AnimateBalloonIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:-translate-y-1"
      >
        <ellipse cx="16" cy="13" rx="8" ry="10" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.75" />
        <path d="M16 23L14.5 25H17.5L16 23Z" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.2" />
        <path
          d="M16 25C15 27 18 28 17 30"
          stroke="#3B1F5C"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M19 8C19 6 15 6 14 8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
      </svg>
    </span>
  );
}

export function AnimateRocketIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-120 hover:-translate-y-1 hover:rotate-6"
      >
        <path
          d="M16 3C11 8 10 16 11 22L16 20L21 22C22 16 21 8 16 3Z"
          fill="#4CC9F0"
          stroke="#3B1F5C"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="11" r="3" fill="#FFF8EC" stroke="#3B1F5C" strokeWidth="1.5" />
        <path d="M10 18L5 21L7 24L11 22" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.5" />
        <path d="M22 18L27 21L25 24L21 22" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.5" />
        <path d="M13 22L16 28L19 22" fill="#FFD23F" stroke="#BD4B2A" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function AnimatePaletteIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:rotate-12"
      >
        <path
          d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C17.66 28 19 26.66 19 25C19 24.23 18.69 23.53 18.19 23.01C17.7 22.5 17.4 21.8 17.4 21C17.4 19.34 18.74 18 20.4 18H23C26.31 18 29 15.31 29 12C29 7.58 23.18 4 16 4Z"
          fill="#FFF3C4"
          stroke="#3B1F5C"
          strokeWidth="1.75"
        />
        <circle cx="10" cy="12" r="2.2" fill="#FF6FAE" />
        <circle cx="16" cy="9" r="2.2" fill="#4CC9F0" />
        <circle cx="22" cy="12" r="2.2" fill="#3DDC97" />
        <circle cx="11" cy="18" r="2.2" fill="#FFD23F" />
      </svg>
    </span>
  );
}

export function AnimateMusicIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:rotate-[-8deg]"
      >
        <path d="M10 24V9L24 5V20" stroke="#3B1F5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="8" cy="24" rx="4" ry="3" fill="#9B5CF6" stroke="#3B1F5C" strokeWidth="1.75" />
        <ellipse cx="22" cy="20" rx="4" ry="3" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.75" />
        <path d="M10 13L24 9" stroke="#3B1F5C" strokeWidth="2.5" />
      </svg>
    </span>
  );
}

export function AnimateRobotIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:rotate-3"
      >
        {/* Antenna */}
        <circle cx="16" cy="4" r="2" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.5" />
        <line x1="16" y1="6" x2="16" y2="9" stroke="#3B1F5C" strokeWidth="1.75" />
        {/* Head */}
        <rect x="6" y="9" width="20" height="16" rx="4" fill="#D9F4FF" stroke="#3B1F5C" strokeWidth="1.75" />
        {/* Eyes */}
        <circle cx="11" cy="15" r="2.5" fill="#3B1F5C" />
        <circle cx="11" cy="14" r="0.8" fill="white" />
        <circle cx="21" cy="15" r="2.5" fill="#3B1F5C" />
        <circle cx="21" cy="14" r="0.8" fill="white" />
        {/* Mouth grid */}
        <rect x="11" y="20" width="10" height="2" rx="1" fill="#FFD23F" stroke="#3B1F5C" strokeWidth="1" />
        {/* Ears */}
        <rect x="3" y="14" width="3" height="6" rx="1" fill="#FFB38A" stroke="#3B1F5C" strokeWidth="1.2" />
        <rect x="26" y="14" width="3" height="6" rx="1" fill="#FFB38A" stroke="#3B1F5C" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

export function AnimateCampIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115"
      >
        {/* Mountain background */}
        <path d="M4 26L16 8L28 26H4Z" fill="#3DDC97" stroke="#3B1F5C" strokeWidth="1.75" strokeLinejoin="round" />
        {/* Tent door */}
        <path d="M16 14L10 26H22L16 14Z" fill="#FFF8EC" stroke="#3B1F5C" strokeWidth="1.5" />
        {/* Pennant flag */}
        <path d="M16 8V4L20 6L16 8Z" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

export function AnimatePuzzleIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:rotate-6"
      >
        <path
          d="M14 6C14 4.5 15 4 16 4C17 4 18 4.5 18 6H24C25.1 6 26 6.9 26 8V14C27.5 14 28 15 28 16C28 17 27.5 18 26 18V24C26 25.1 25.1 26 24 26H18C18 24.5 17 24 16 24C15 24 14 24.5 14 26H8C6.9 26 6 25.1 6 24V18C7.5 18 8 17 8 16C8 15 7.5 14 6 14V8C6 6.9 6.9 6 8 6H14Z"
          fill="#FFD23F"
          stroke="#3B1F5C"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function AnimateShieldCheckIcon({ size = 24, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-120 text-good"
      >
        <path
          d="M12 2L4 5.5V11C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11V5.5L12 2Z"
          fill="#DDF8EA"
          stroke="#2F7D4F"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 11.5L11 14L15.5 9.5"
          stroke="#2F7D4F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function AnimateCertificateIcon({ size = 24, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115"
      >
        <rect x="3" y="4" width="18" height="13" rx="2" fill="#FFF8EC" stroke="#3B1F5C" strokeWidth="1.5" />
        <path d="M7 8H17M7 11H13" stroke="#3B1F5C" strokeWidth="1.2" strokeLinecap="round" />
        {/* Ribbon / Seal */}
        <circle cx="16" cy="15" r="3" fill="#FFD23F" stroke="#BD4B2A" strokeWidth="1.2" />
        <path d="M15 17.5L14 21L16 19.5L18 21L17 17.5" fill="#BD4B2A" />
      </svg>
    </span>
  );
}

export function AnimateVideoPlayIcon({ size = 24, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-120"
      >
        <circle cx="12" cy="12" r="10" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.5" />
        <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="white" />
      </svg>
    </span>
  );
}

export function AnimateBabyIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115"
      >
        <circle cx="16" cy="16" r="11" fill="#FFE6D5" stroke="#3B1F5C" strokeWidth="1.75" />
        <circle cx="12" cy="15" r="1.5" fill="#3B1F5C" />
        <circle cx="20" cy="15" r="1.5" fill="#3B1F5C" />
        <path d="M14 20C15 21.5 17 21.5 18 20" stroke="#3B1F5C" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="17" r="1.5" fill="#FF8FA3" fillOpacity="0.5" />
        <circle cx="23" cy="17" r="1.5" fill="#FF8FA3" fillOpacity="0.5" />
        {/* Tuft of hair */}
        <path d="M16 5C14.5 3 17 2 16 5Z" fill="#3B1F5C" />
      </svg>
    </span>
  );
}

export function AnimateTicketIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:rotate-6"
      >
        <path
          d="M6 10C6 8.9 6.9 8 8 8H24C25.1 8 26 8.9 26 10V14C24.5 14 23.5 15 23.5 16C23.5 17 24.5 18 26 18V22C26 23.1 25.1 24 24 24H8C6.9 24 6 23.1 6 22V18C7.5 18 8.5 17 8.5 16C8.5 15 7.5 14 6 14V10Z"
          fill="#DDF8EA"
          stroke="#3B1F5C"
          strokeWidth="1.75"
        />
        <line x1="13" y1="11" x2="13" y2="21" stroke="#3B1F5C" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="19" cy="16" r="2.5" fill="#FFD23F" stroke="#3B1F5C" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function AnimateCalendarIcon({ size = 26, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:rotate-[-4deg]"
      >
        <rect x="5" y="8" width="22" height="19" rx="3" fill="#E3ECFF" stroke="#3B1F5C" strokeWidth="1.75" />
        <path d="M5 14H27" stroke="#3B1F5C" strokeWidth="1.5" />
        <rect x="9" y="5" width="3" height="5" rx="1" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.2" />
        <rect x="20" y="5" width="3" height="5" rx="1" fill="#FF6FAE" stroke="#3B1F5C" strokeWidth="1.2" />
        <circle cx="16" cy="20" r="2.5" fill="#FFD23F" stroke="#3B1F5C" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function AnimateHomeIcon({ size = 24, className = "" }: AnimateIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-115 hover:-translate-y-0.5"
      >
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10.5Z"
          fill="#FFE8DD"
          stroke="#1C1B19"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <rect x="9" y="14" width="6" height="7" rx="1" fill="#BD4B2A" />
      </svg>
    </span>
  );
}
