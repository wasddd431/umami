import type { SVGProps } from 'react';

// Sito's speech bubble on a dark or cobalt background (docs/brand/logo/sito-symbol-negativ.svg).
const SvgLogoWhite = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 100 100" {...props}>
    <g transform="translate(-14.1 -15.38) scale(1.2821)">
      <path
        d="M30 12H70A18 18 0 0 1 88 30V58A18 18 0 0 1 70 76H42L24 90V75A18 18 0 0 1 12 58V30A18 18 0 0 1 30 12Z"
        fill="#fff"
      />
      <circle cx={37} cy={38} r={5} fill="#2146d0" />
      <circle cx={63} cy={38} r={5} fill="#2146d0" />
      <path
        d="M34 53Q50 66 66 53"
        fill="none"
        stroke="#2146d0"
        strokeWidth={6.5}
        strokeLinecap="round"
      />
    </g>
  </svg>
);
export default SvgLogoWhite;
