'use client';

import React from 'react';
import Image from 'next/image';

export function LandingHeroBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Deep Atmospheric Ambient Backlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[850px] pointer-events-none">
        {/* Central Auric Glow behind head/torso */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] h-[360px] sm:h-[480px] bg-[#C8FF3D]/12 rounded-full blur-[110px] sm:blur-[140px] animate-pulse-gentle" />
        {/* Upper Rim Light */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[240px] sm:w-[420px] h-[180px] sm:h-[240px] bg-emerald-400/10 rounded-full blur-[80px]" />
        {/* Deep Void Falloff Shadows */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-t from-[#090a0f] via-[#090a0f]/90 to-transparent" />
      </div>

      {/* 2. SVG ENERGY RIBBONS - BACK LAYER (Passes behind character) */}
      <div className="absolute top-[-20px] sm:top-[-10px] left-1/2 -translate-x-1/2 w-[900px] sm:w-[1100px] h-[750px] sm:h-[900px] opacity-75 sm:opacity-85 pointer-events-none z-0">
        <svg
          viewBox="0 0 1000 900"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Energy Gradient 1: Luminous Lime & Emerald */}
            <linearGradient id="backRibbonGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C8FF3D" stopOpacity="0" />
              <stop offset="25%" stopColor="#10B981" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#C8FF3D" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#E2FF7E" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>

            {/* Energy Gradient 2: Emerald to Cyan Highlight */}
            <linearGradient id="backRibbonGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0" />
              <stop offset="30%" stopColor="#10B981" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#C8FF3D" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#6EE7B7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>

            {/* Gaussian Blur Filters for 3D Luminous Glow */}
            <filter id="glow-wide" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" result="blur" />
            </filter>
            <filter id="glow-mid" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
            </filter>
          </defs>

          {/* Ribbon 1: Arching behind shoulders and torso */}
          <g className="energy-ribbon-back-1">
            {/* Outer soft aura */}
            <path
              d="M 230 720 C 310 630, 360 500, 450 440 C 540 380, 620 330, 640 240 C 660 150, 560 100, 480 120 C 400 140, 350 210, 330 270"
              stroke="url(#backRibbonGrad1)"
              strokeWidth="20"
              strokeLinecap="round"
              filter="url(#glow-wide)"
              opacity="0.4"
            />
            {/* Mid neon core */}
            <path
              d="M 230 720 C 310 630, 360 500, 450 440 C 540 380, 620 330, 640 240 C 660 150, 560 100, 480 120 C 400 140, 350 210, 330 270"
              stroke="url(#backRibbonGrad1)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#glow-mid)"
              opacity="0.8"
            />
            {/* Sharp laser filament */}
            <path
              d="M 230 720 C 310 630, 360 500, 450 440 C 540 380, 620 330, 640 240 C 660 150, 560 100, 480 120 C 400 140, 350 210, 330 270"
              stroke="#F4FFBD"
              strokeWidth="1.75"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          {/* Ribbon 2: Ascending swirl behind head */}
          <g className="energy-ribbon-back-2">
            <path
              d="M 760 660 C 680 560, 630 450, 540 410 C 450 370, 380 310, 370 220 C 360 130, 450 85, 530 105 C 600 120, 650 190, 630 260"
              stroke="url(#backRibbonGrad2)"
              strokeWidth="16"
              strokeLinecap="round"
              filter="url(#glow-wide)"
              opacity="0.35"
            />
            <path
              d="M 760 660 C 680 560, 630 450, 540 410 C 450 370, 380 310, 370 220 C 360 130, 450 85, 530 105 C 600 120, 650 190, 630 260"
              stroke="url(#backRibbonGrad2)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glow-mid)"
              opacity="0.75"
            />
            <path
              d="M 760 660 C 680 560, 630 450, 540 410 C 450 370, 380 310, 370 220 C 360 130, 450 85, 530 105 C 600 120, 650 190, 630 260"
              stroke="#F4FFBD"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>
        </svg>
      </div>

      {/* 3. MONOCHROME MUSCULAR CHARACTER SILHOUETTE LAYER */}
      <div className="absolute top-2 sm:top-6 left-1/2 -translate-x-1/2 w-[340px] sm:w-[540px] md:w-[620px] lg:w-[680px] h-[520px] sm:h-[640px] md:h-[720px] pointer-events-none z-[1] flex items-start justify-center">
        <div
          className="relative w-full h-full transition-opacity duration-1000"
          style={{
            // Mask image cleanly dissolves edges and bottom into deep background void
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 36%, black 25%, rgba(0,0,0,0.65) 55%, transparent 82%), linear-gradient(to bottom, transparent 0%, black 14%, black 65%, transparent 98%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 36%, black 25%, rgba(0,0,0,0.65) 55%, transparent 82%), linear-gradient(to bottom, transparent 0%, black 14%, black 65%, transparent 98%)',
          }}
        >
          <Image
            src="/images/character_hero.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 340px, (max-width: 1024px) 580px, 680px"
            className="object-contain object-top contrast-[1.22] brightness-[0.88] grayscale opacity-25 sm:opacity-[0.32] mix-blend-screen"
          />
        </div>
      </div>

      {/* 4. SVG ENERGY RIBBONS - FRONT LAYER (Coils through and in front of character) */}
      <div className="absolute top-[-20px] sm:top-[-10px] left-1/2 -translate-x-1/2 w-[900px] sm:w-[1100px] h-[750px] sm:h-[900px] opacity-80 sm:opacity-90 pointer-events-none z-[2]">
        <svg
          viewBox="0 0 1000 900"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Front Ribbon Gradient 1: Core energetic lime */}
            <linearGradient id="frontRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C8FF3D" stopOpacity="0" />
              <stop offset="20%" stopColor="#C8FF3D" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#F4FFBD" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C8FF3D" stopOpacity="0" />
            </linearGradient>

            {/* Front Ribbon Gradient 2: Swirling Torso Loop */}
            <linearGradient id="frontRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
              <stop offset="25%" stopColor="#34D399" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#C8FF3D" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#E2FF7E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ribbon 3: Sweeping across waist, ribcage, chest to shoulder */}
          <g className="energy-ribbon-front-1">
            <path
              d="M 780 610 C 690 650, 580 590, 480 545 C 385 500, 345 435, 375 375 C 410 315, 490 325, 570 345 C 655 365, 710 325, 680 245 C 645 165, 535 175, 465 205"
              stroke="url(#frontRibbonGrad1)"
              strokeWidth="22"
              strokeLinecap="round"
              filter="url(#glow-wide)"
              opacity="0.38"
            />
            <path
              d="M 780 610 C 690 650, 580 590, 480 545 C 385 500, 345 435, 375 375 C 410 315, 490 325, 570 345 C 655 365, 710 325, 680 245 C 645 165, 535 175, 465 205"
              stroke="url(#frontRibbonGrad1)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#glow-mid)"
              opacity="0.85"
            />
            <path
              d="M 780 610 C 690 650, 580 590, 480 545 C 385 500, 345 435, 375 375 C 410 315, 490 325, 570 345 C 655 365, 710 325, 680 245 C 645 165, 535 175, 465 205"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.95"
            />
          </g>

          {/* Ribbon 4: Tilted 3D orbital loop framing chest & core */}
          <g className="energy-ribbon-front-2">
            <path
              d="M 270 580 C 340 540, 430 560, 520 520 C 610 480, 650 415, 620 345 C 590 275, 490 285, 430 265 C 370 245, 330 285, 350 345 C 370 405, 460 425, 560 445"
              stroke="url(#frontRibbonGrad2)"
              strokeWidth="18"
              strokeLinecap="round"
              filter="url(#glow-wide)"
              opacity="0.32"
            />
            <path
              d="M 270 580 C 340 540, 430 560, 520 520 C 610 480, 650 415, 620 345 C 590 275, 490 285, 430 265 C 370 245, 330 285, 350 345 C 370 405, 460 425, 560 445"
              stroke="url(#frontRibbonGrad2)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glow-mid)"
              opacity="0.8"
            />
            <path
              d="M 270 580 C 340 540, 430 560, 520 520 C 610 480, 650 415, 620 345 C 590 275, 490 285, 430 265 C 370 245, 330 285, 350 345 C 370 405, 460 425, 560 445"
              stroke="#F4FFBD"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          {/* Glowing auric sparks / micro energy motes */}
          <circle cx="465" cy="205" r="3" fill="#F4FFBD" className="animate-pulse" filter="url(#glow-mid)" />
          <circle cx="680" cy="245" r="3.5" fill="#C8FF3D" className="animate-pulse" filter="url(#glow-mid)" />
          <circle cx="375" cy="375" r="2.5" fill="#34D399" className="animate-pulse" filter="url(#glow-mid)" />
          <circle cx="560" cy="445" r="3" fill="#F4FFBD" className="animate-pulse" filter="url(#glow-mid)" />
        </svg>
      </div>

      {/* 5. DARK READABILITY SHIELD (Vignette & Contrast Shield for text) */}
      {/* Ensures the headline, badge, and CTA are 100% readable while maintaining depth */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background:
            'radial-gradient(ellipse 65% 50% at 50% 36%, rgba(9, 10, 15, 0.72) 0%, rgba(9, 10, 15, 0.42) 55%, rgba(9, 10, 15, 0.88) 95%)',
        }}
      />

      {/* Component-scoped smooth CSS keyframes for organic continuous ribbon flow */}
      <style jsx>{`
        @keyframes pulseGentle {
          0%, 100% {
            opacity: 0.7;
            transform: translate(-50%, 0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.06);
          }
        }

        .animate-pulse-gentle {
          animation: pulseGentle 6s ease-in-out infinite;
        }

        /* Ribbon 1: Back main loop continuous flow */
        .energy-ribbon-back-1 path {
          stroke-dasharray: 600 350;
          animation: ribbonFlowBack1 22s linear infinite;
        }
        @keyframes ribbonFlowBack1 {
          0% {
            stroke-dashoffset: 1900;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Ribbon 2: Back wisp continuous flow */
        .energy-ribbon-back-2 path {
          stroke-dasharray: 550 400;
          animation: ribbonFlowBack2 26s linear infinite;
        }
        @keyframes ribbonFlowBack2 {
          0% {
            stroke-dashoffset: 1900;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Ribbon 3: Front chest & waist coil flow */
        .energy-ribbon-front-1 path {
          stroke-dasharray: 650 350;
          animation: ribbonFlowFront1 18s linear infinite;
        }
        @keyframes ribbonFlowFront1 {
          0% {
            stroke-dashoffset: 2000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        /* Ribbon 4: Front torso counter-spiral flow */
        .energy-ribbon-front-2 path {
          stroke-dasharray: 500 350;
          animation: ribbonFlowFront2 24s linear infinite reverse;
        }
        @keyframes ribbonFlowFront2 {
          0% {
            stroke-dashoffset: 1700;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
