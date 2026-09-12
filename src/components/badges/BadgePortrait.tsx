import React from 'react';

interface BadgePortraitProps {
  slug: string;
  className?: string;
  size?: number;
  locked?: boolean;
}

export function BadgePortrait({
  slug,
  className = '',
  size = 96,
  locked = false,
}: BadgePortraitProps) {
  const filterClass = locked ? 'grayscale opacity-40 brightness-75' : '';

  const renderArtwork = () => {
    switch (slug) {
      case 'clown':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Clown Badge Portrait"
          >
            {/* Background disc */}
            <circle cx="50" cy="50" r="46" fill="#1e1822" stroke="#d946ef" strokeWidth="2" />
            {/* Jester Hat */}
            <path d="M25 40 Q15 15 35 25 Q50 8 65 25 Q85 15 75 40 Z" fill="#9333ea" />
            <circle cx="16" cy="18" r="4" fill="#fbbf24" />
            <circle cx="50" cy="10" r="4" fill="#fbbf24" />
            <circle cx="84" cy="18" r="4" fill="#fbbf24" />
            {/* Face */}
            <circle cx="50" cy="58" r="26" fill="#fdf4ff" />
            {/* Eyes */}
            <ellipse cx="42" cy="52" rx="3.5" ry="5" fill="#18181b" />
            <ellipse cx="58" cy="52" rx="3.5" ry="5" fill="#18181b" />
            {/* Blue teardrop makeup */}
            <path d="M42 58 Q42 66 40 68 Q44 66 42 58 Z" fill="#38bdf8" />
            <path d="M58 58 Q58 66 60 68 Q56 66 58 58 Z" fill="#38bdf8" />
            {/* Clown Red Nose */}
            <circle cx="50" cy="61" r="6.5" fill="#ef4444" />
            {/* Wide goofy smile */}
            <path d="M35 69 Q50 84 65 69" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Rosy cheeks */}
            <circle cx="34" cy="64" r="4" fill="#f472b6" opacity="0.6" />
            <circle cx="66" cy="64" r="4" fill="#f472b6" opacity="0.6" />
          </svg>
        );

      case 'noob':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Noob Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#142115" stroke="#22c55e" strokeWidth="2" />
            {/* Green sprout on head */}
            <path d="M50 32 C50 20 40 18 38 24 C36 29 46 30 50 32 Z" fill="#4ade80" />
            <path d="M50 32 C50 18 62 18 62 24 C62 29 52 30 50 32 Z" fill="#22c55e" />
            {/* Face */}
            <circle cx="50" cy="58" r="25" fill="#fef08a" />
            {/* Green bandana */}
            <rect x="26" y="44" width="48" height="8" rx="2" fill="#16a34a" />
            {/* Innocent wide eyes */}
            <circle cx="41" cy="58" r="5" fill="#09090b" />
            <circle cx="43" cy="56" r="2" fill="#ffffff" />
            <circle cx="59" cy="58" r="5" fill="#09090b" />
            <circle cx="61" cy="56" r="2" fill="#ffffff" />
            {/* Small hopeful mouth */}
            <path d="M46 72 Q50 76 54 72" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'novice':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Novice Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#172554" stroke="#3b82f6" strokeWidth="2" />
            {/* Brown Hair */}
            <path d="M26 48 C24 30 38 22 50 22 C62 22 76 30 74 48 Z" fill="#78350f" />
            {/* Face */}
            <polygon points="28,46 72,46 66,78 50,84 34,78" fill="#fde047" />
            {/* Blue Headband */}
            <path d="M27 42 L73 42 L71 49 L29 49 Z" fill="#2563eb" />
            <polygon points="50,43 53,46 50,49 47,46" fill="#60a5fa" />
            {/* Focused Eyes */}
            <line x1="37" y1="56" x2="45" y2="58" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            <line x1="63" y1="56" x2="55" y2="58" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            {/* Determined smirk */}
            <path d="M44 72 Q52 75 58 70" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'average':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Average Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#18181b" stroke="#a1a1aa" strokeWidth="2" />
            {/* Sleek Hair */}
            <path d="M25 46 C24 24 40 18 54 18 C68 18 78 26 75 46 Z" fill="#27272a" />
            {/* Defined face shape */}
            <polygon points="28,44 72,44 67,78 50,86 33,78" fill="#fed7aa" />
            {/* Dark cool sunglasses */}
            <polygon points="32,49 47,49 45,61 34,61" fill="#09090b" stroke="#52525b" strokeWidth="1.5" />
            <polygon points="53,49 68,49 66,61 55,61" fill="#09090b" stroke="#52525b" strokeWidth="1.5" />
            <line x1="47" y1="52" x2="53" y2="52" stroke="#52525b" strokeWidth="2" />
            {/* White reflection in glasses */}
            <line x1="35" y1="52" x2="41" y2="58" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
            <line x1="56" y1="52" x2="62" y2="58" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
            {/* Confident mouth */}
            <line x1="43" y1="73" x2="57" y2="73" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'advanced':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Advanced Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            {/* Sharp Cyber Hair */}
            <path d="M22 42 L34 20 L50 25 L66 18 L76 42 Z" fill="#334155" />
            {/* Sharpened jaw */}
            <polygon points="26,42 74,42 66,79 50,89 34,79" fill="#fde68a" />
            {/* Titanium Circlet */}
            <path d="M25 39 L75 39 L73 45 L27 45 Z" fill="#64748b" />
            <circle cx="50" cy="42" r="3" fill="#10b981" />
            {/* Emerald glowing eye glint */}
            <circle cx="40" cy="55" r="3.5" fill="#34d399" />
            <circle cx="60" cy="55" r="3.5" fill="#34d399" />
            <circle cx="40" cy="55" r="7" fill="#10b981" opacity="0.3" />
            <circle cx="60" cy="55" r="7" fill="#10b981" opacity="0.3" />
            {/* Chiseled cheek contours */}
            <line x1="33" y1="64" x2="38" y2="73" stroke="#b45309" strokeWidth="1.5" />
            <line x1="67" y1="64" x2="62" y2="73" stroke="#b45309" strokeWidth="1.5" />
            {/* Stoic mouth */}
            <line x1="44" y1="76" x2="56" y2="76" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'sigma':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Sigma Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#190d24" stroke="#a855f7" strokeWidth="2" />
            {/* High coat collar framing face */}
            <polygon points="20,95 36,62 50,80 64,62 80,95" fill="#0f0717" stroke="#9333ea" strokeWidth="1.5" />
            {/* Chiseled face in shadows */}
            <polygon points="30,38 70,38 64,74 50,84 36,74" fill="#d4d4d8" />
            {/* Shadow contour */}
            <path d="M50 38 L70 38 L64 74 L50 84 Z" fill="#71717a" opacity="0.5" />
            {/* Glowing Purple Laser Eyes */}
            <line x1="20" y1="51" x2="43" y2="51" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
            <line x1="78" y1="51" x2="57" y2="51" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
            <circle cx="41" cy="51" r="3.5" fill="#f3e8ff" />
            <circle cx="59" cy="51" r="3.5" fill="#f3e8ff" />
            {/* Razor straight mouth */}
            <line x1="45" y1="71" x2="55" y2="71" stroke="#18181b" strokeWidth="2" />
          </svg>
        );

      case 'chad':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Chad Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#1c1917" stroke="#eab308" strokeWidth="2" />
            {/* Golden Laurel Wreath */}
            <path d="M22 45 Q20 20 48 18" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M78 45 Q80 20 52 18" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="28" cy="30" r="3" fill="#f59e0b" />
            <circle cx="72" cy="30" r="3" fill="#f59e0b" />
            {/* Chiseled Greek God Jawline */}
            <polygon points="26,38 74,38 72,70 50,91 28,70" fill="#fcd34d" />
            {/* High cheekbone and jaw shading */}
            <polygon points="28,70 50,91 50,78 35,66" fill="#d97706" opacity="0.4" />
            <polygon points="72,70 50,91 50,78 65,66" fill="#b45309" opacity="0.6" />
            {/* Confident Charismatic Eyes */}
            <path d="M35 50 Q41 46 46 50" stroke="#09090b" strokeWidth="2.5" fill="none" />
            <path d="M54 50 Q59 46 65 50" stroke="#09090b" strokeWidth="2.5" fill="none" />
            <circle cx="41" cy="52" r="2.5" fill="#09090b" />
            <circle cx="59" cy="52" r="2.5" fill="#09090b" />
            {/* Broad confident smirk */}
            <path d="M38 72 Q50 82 62 70" stroke="#09090b" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'absolute-chad':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Absolute Chad Badge Portrait"
          >
            <circle cx="50" cy="50" r="46" fill="#201007" stroke="#f97316" strokeWidth="2.5" />
            {/* Radiant Flame spikes */}
            <polygon points="50,4 55,16 50,14 45,16" fill="#f97316" />
            <polygon points="30,12 37,22 32,21 27,21" fill="#ea580c" />
            <polygon points="70,12 73,21 68,21 63,22" fill="#ea580c" />
            {/* Golden Crown */}
            <polygon points="28,30 38,20 50,28 62,20 72,30 68,36 32,36" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            {/* Diamond Cut Sculpted Head */}
            <polygon points="26,38 74,38 72,69 50,94 28,69" fill="#fed7aa" />
            {/* Hyper Defined Chin & Jaw Split */}
            <line x1="50" y1="84" x2="50" y2="93" stroke="#9a3412" strokeWidth="2" />
            <polygon points="28,69 50,94 48,78 34,65" fill="#ea580c" opacity="0.35" />
            <polygon points="72,69 50,94 52,78 66,65" fill="#c2410c" opacity="0.45" />
            {/* Flaming Eyes */}
            <circle cx="40" cy="50" r="4" fill="#ea580c" />
            <circle cx="60" cy="50" r="4" fill="#ea580c" />
            <circle cx="40" cy="50" r="2" fill="#fef08a" />
            <circle cx="60" cy="50" r="2" fill="#fef08a" />
            {/* Unbreakable Smirk */}
            <path d="M37 72 Q50 82 63 71" stroke="#431407" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'giga-chad':
      default:
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Giga Chad Badge Portrait"
          >
            {/* Outer Divine Aura Glow */}
            <circle cx="50" cy="50" r="46" fill="#0a0f1d" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Celestial Floating Halo */}
            <ellipse cx="50" cy="15" rx="32" ry="7" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <ellipse cx="50" cy="15" rx="30" ry="5" stroke="#f0abfc" strokeWidth="1.5" fill="none" />
            {/* Transcendent Mythical Marble Head */}
            <polygon points="24,36 76,36 74,68 50,96 26,68" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
            {/* High Contrast Chiseled Shadows */}
            <polygon points="50,36 76,36 74,68 50,96 Z" fill="#0284c7" opacity="0.25" />
            <line x1="50" y1="84" x2="50" y2="95" stroke="#0369a1" strokeWidth="2.5" />
            {/* Glowing Cyan Runic Eyes */}
            <polygon points="34,48 44,46 44,52 34,50" fill="#38bdf8" />
            <polygon points="66,48 56,46 56,52 66,50" fill="#38bdf8" />
            <circle cx="39" cy="49" r="6" fill="#38bdf8" opacity="0.4" />
            <circle cx="61" cy="49" r="6" fill="#38bdf8" opacity="0.4" />
            {/* Ultimate Confident Grin */}
            <path d="M35 72 Q50 85 65 72" stroke="#082f49" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Light sparkles */}
            <circle cx="20" cy="25" r="2" fill="#ffffff" />
            <circle cx="80" cy="25" r="2" fill="#ffffff" />
            <circle cx="50" cy="6" r="2.5" fill="#f0abfc" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full flex items-center justify-center p-1 bg-gradient-to-b from-neutral-800 to-neutral-950 border border-neutral-700 shadow-xl transition-all duration-300 ${filterClass} ${className}`}
    >
      {renderArtwork()}
      {locked && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}
    </div>
  );
}
