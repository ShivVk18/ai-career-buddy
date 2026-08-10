// AscendLogo.jsx — SVG icon mark for AscendAI
// Renders the brand icon: an "A" letterform merged with an upward arrow and circuit nodes

export default function AscendLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AscendAI logo"
    >
      {/* Outer "A" shape with upward arrow tip */}
      {/* Left leg of A */}
      <polygon
        points="10,88 38,18 50,42 28,88"
        fill="currentColor"
      />
      {/* Right leg of A */}
      <polygon
        points="90,88 62,18 50,42 72,88"
        fill="currentColor"
      />
      {/* Arrow tip pointing up (triangle above the A peak) */}
      <polygon
        points="50,4 43,22 57,22"
        fill="currentColor"
      />
      {/* Crossbar of A — thin horizontal bar */}
      <rect x="30" y="60" width="40" height="6" rx="1" fill="currentColor" />

      {/* Circuit node dots — left leg */}
      <circle cx="22" cy="72" r="3" fill="var(--background, #F7F1EA)" />
      <circle cx="17" cy="82" r="2" fill="var(--background, #F7F1EA)" />
      {/* Circuit lines — left leg */}
      <line x1="22" y1="72" x2="17" y2="82" stroke="var(--background, #F7F1EA)" strokeWidth="1.2" />
      <line x1="22" y1="72" x2="14" y2="72" stroke="var(--background, #F7F1EA)" strokeWidth="1.2" />
      <circle cx="14" cy="72" r="2" fill="var(--background, #F7F1EA)" />

      {/* Circuit node dots — right leg */}
      <circle cx="78" cy="72" r="3" fill="var(--background, #F7F1EA)" />
      <circle cx="83" cy="82" r="2" fill="var(--background, #F7F1EA)" />
      {/* Circuit lines — right leg */}
      <line x1="78" y1="72" x2="83" y2="82" stroke="var(--background, #F7F1EA)" strokeWidth="1.2" />
      <line x1="78" y1="72" x2="86" y2="72" stroke="var(--background, #F7F1EA)" strokeWidth="1.2" />
      <circle cx="86" cy="72" r="2" fill="var(--background, #F7F1EA)" />
    </svg>
  );
}
