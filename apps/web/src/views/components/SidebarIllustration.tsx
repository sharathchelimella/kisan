export function TractorLogo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Crisp White Tractor Silhouette with Plant/Sprout Accent */}
      {/* Engine Hood */}
      <path
        d="M8 26C8 24.5 9 23 10.5 23H23V33H8V26Z"
        fill="white"
      />
      {/* Front Grille */}
      <path d="M7 26C7 24 8 23 9.5 23V33H7V26Z" fill="#E2E8F0" />
      {/* Exhaust Stack */}
      <rect x="13" y="15" width="2" height="9" fill="white" rx="0.5" />
      <path d="M13 15.5C13 14 14.5 13 15.5 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" />

      {/* Sprout on hood / exhaust */}
      <path
        d="M15 13C16.5 10 19 8.5 22 8.5"
        stroke="#4ADE80"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 8.5C22 8.5 23.5 11 21 12.5C18.5 14 19.5 11.5 22 8.5Z"
        fill="#4ADE80"
      />

      {/* Driver Cab */}
      <path
        d="M22 17C22 15.5 23 14.5 24.5 14.5H33C34.5 14.5 35.5 15.5 35.5 17L34 33H22V17Z"
        fill="white"
      />
      {/* Cab Window cutout */}
      <path
        d="M24 17.5H32.5L31.5 25H24V17.5Z"
        fill="#064B35"
        rx="1"
      />
      {/* Steering wheel silhouette */}
      <path d="M25 24L27 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

      {/* Rear Fender */}
      <path
        d="M24 28C24 24 29 22 35 22C39 22 41 24 41 28V33H24V28Z"
        fill="white"
      />

      {/* Large Rear Tyre with Spoked Center */}
      <circle cx="34" cy="33" r="9" fill="white" />
      <circle cx="34" cy="33" r="6" fill="#064B35" />
      <circle cx="34" cy="33" r="3" fill="#4ADE80" />
      <circle cx="34" cy="33" r="1.2" fill="white" />

      {/* Small Front Tyre */}
      <circle cx="12" cy="35" r="5.5" fill="white" />
      <circle cx="12" cy="35" r="3.5" fill="#064B35" />
      <circle cx="12" cy="35" r="1.5" fill="#4ADE80" />
    </svg>
  );
}

export function SidebarLandscape() {
  return (
    <div className="w-full relative overflow-hidden select-none pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 260 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06472F" stopOpacity="0" />
            <stop offset="40%" stopColor="#085237" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0A5C3D" />
          </linearGradient>
          <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#126843" />
            <stop offset="50%" stopColor="#0D5536" />
            <stop offset="100%" stopColor="#073B25" />
          </linearGradient>
        </defs>

        {/* Sky / Atmospheric haze */}
        <rect width="260" height="160" fill="url(#skyGrad)" />

        {/* Distant Hills */}
        <path
          d="M0 65 Q 60 42 130 58 T 260 48 L 260 160 L 0 160 Z"
          fill="#0C5738"
          opacity="0.8"
        />

        {/* Mid-distance Rolling Hills & Tree Line */}
        <path
          d="M0 80 Q 75 58 150 74 T 260 66 L 260 160 L 0 160 Z"
          fill="#10633F"
        />
        {/* Subtle Tree silhouettes on ridge */}
        <circle cx="140" cy="72" r="5" fill="#0B4D31" opacity="0.6" />
        <circle cx="148" cy="71" r="6" fill="#0B4D31" opacity="0.6" />
        <circle cx="156" cy="73" r="5" fill="#0B4D31" opacity="0.6" />
        <circle cx="190" cy="67" r="4" fill="#0B4D31" opacity="0.5" />
        <circle cx="196" cy="66" r="5" fill="#0B4D31" opacity="0.5" />

        {/* Foreground Agricultural Farmland */}
        <path
          d="M0 94 Q 90 76 180 92 L 260 86 L 260 160 L 0 160 Z"
          fill="url(#fieldGrad)"
        />

        {/* Curved Farmland Crop Furrows fanning towards bottom-left (matching reference image) */}
        <path
          d="M0 148 C 60 142 120 128 190 92"
          stroke="#1FA363"
          strokeWidth="3.5"
          opacity="0.75"
          strokeLinecap="round"
        />
        <path
          d="M0 136 C 55 130 110 118 175 90"
          stroke="#1FA363"
          strokeWidth="3"
          opacity="0.65"
          strokeLinecap="round"
        />
        <path
          d="M0 124 C 50 120 100 110 160 88"
          stroke="#27AE60"
          strokeWidth="2.5"
          opacity="0.6"
          strokeLinecap="round"
        />
        <path
          d="M0 112 C 45 108 90 100 145 86"
          stroke="#2ECC71"
          strokeWidth="2"
          opacity="0.5"
          strokeLinecap="round"
        />
        <path
          d="M0 102 C 40 98 80 92 130 84"
          stroke="#4ADE80"
          strokeWidth="1.5"
          opacity="0.4"
          strokeLinecap="round"
        />

        {/* Additional contour lines on lower right */}
        <path
          d="M60 160 C 110 152 170 134 230 104"
          stroke="#16803D"
          strokeWidth="4"
          opacity="0.5"
          strokeLinecap="round"
        />
        <path
          d="M120 160 C 160 154 210 138 260 116"
          stroke="#15803D"
          strokeWidth="4.5"
          opacity="0.4"
          strokeLinecap="round"
        />

        {/* Green Tractor Standing in the Farmland (matches reference position on left!) */}
        <g transform="translate(20, 86) scale(0.68)">
          {/* Tractor Body & Hood */}
          <path d="M10 24C10 22 11.5 20 13.5 20H28V32H10V24Z" fill="#15803D" stroke="#064E3B" strokeWidth="1" />
          <rect x="7" y="24" width="3" height="8" rx="0.5" fill="#1F2937" />
          {/* Exhaust */}
          <rect x="14" y="10" width="2.5" height="11" fill="#1F2937" rx="0.5" />
          
          {/* Cab */}
          <path d="M26 20L30 8C30.5 7 31.5 6 33 6H47C48.5 6 49.5 7 50 8.5L48 24H26V20Z" fill="#E0F2FE" fillOpacity="0.85" stroke="#1F2937" strokeWidth="1.2" />
          {/* Cab roof */}
          <rect x="29" y="5" width="23" height="3" rx="1" fill="#15803D" />

          {/* Yellow Front Wheel */}
          <circle cx="14" cy="34" r="7" fill="#1F2937" stroke="#111827" strokeWidth="1.5" />
          <circle cx="14" cy="34" r="4.2" fill="#FACC15" />
          <circle cx="14" cy="34" r="1.5" fill="#1F2937" />

          {/* Yellow Rear Wheel (Large) */}
          <circle cx="44" cy="30" r="12" fill="#1F2937" stroke="#111827" strokeWidth="2" />
          <circle cx="44" cy="30" r="7.5" fill="#FACC15" />
          <circle cx="44" cy="30" r="3" fill="#1F2937" />
        </g>
      </svg>
    </div>
  );
}
