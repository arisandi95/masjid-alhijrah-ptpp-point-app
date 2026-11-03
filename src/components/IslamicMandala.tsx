import React from 'react';

interface IslamicMandalaProps {
  className?: string;
  size?: number;
  opacity?: number;
  color?: string;
}

export const IslamicMandala: React.FC<IslamicMandalaProps> = ({
  className = '',
  size = 360,
  opacity = 0.22,
  color = '#D4AF37',
}) => {
  // Generate 12 petals around circle
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const angles8 = [0, 45, 90, 135, 180, 225, 270, 315];
  const angles16 = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <g stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Concentric Circles */}
        <circle cx="200" cy="200" r="190" strokeDasharray="3 3" />
        <circle cx="200" cy="200" r="182" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="168" strokeWidth="0.8" />
        <circle cx="200" cy="200" r="130" strokeWidth="1" />
        <circle cx="200" cy="200" r="95" strokeWidth="0.9" />
        <circle cx="200" cy="200" r="65" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="35" strokeWidth="0.8" />
        <circle cx="200" cy="200" r="12" fill={color} fillOpacity="0.4" />

        {/* Outer 12 Arching Petals */}
        {angles.map((deg) => (
          <g key={`petal-${deg}`} transform={`rotate(${deg} 200 200)`}>
            <path
              d="M200 10 C215 50 230 110 200 130 C170 110 185 50 200 10 Z"
              strokeWidth="0.9"
            />
            <path
              d="M200 18 C210 55 220 105 200 125 C180 105 190 55 200 18 Z"
              strokeWidth="0.6"
            />
            {/* Fine Spoke line to outer edge */}
            <line x1="200" y1="130" x2="200" y2="190" strokeWidth="0.5" strokeDasharray="2 2" />
          </g>
        ))}

        {/* Intermediate 16 Star Points */}
        {angles16.map((deg) => (
          <g key={`star16-${deg}`} transform={`rotate(${deg} 200 200)`}>
            <path
              d="M200 70 L212 95 L200 120 L188 95 Z"
              strokeWidth="0.8"
            />
          </g>
        ))}

        {/* 8-fold Overlapping Interlaced Squares / Octagram */}
        {angles8.map((deg) => (
          <g key={`star8-${deg}`} transform={`rotate(${deg} 200 200)`}>
            <polygon
              points="200,80 230,170 320,200 230,230 200,320 170,230 80,200 170,170"
              strokeWidth="0.6"
              fill={color}
              fillOpacity="0.02"
            />
            <circle cx="200" cy="80" r="3" fill={color} fillOpacity="0.6" />
          </g>
        ))}

        {/* Inner Flower Rosette */}
        {angles.map((deg) => (
          <g key={`inner-${deg}`} transform={`rotate(${deg} 200 200)`}>
            <path
              d="M200 135 C208 150 215 170 200 180 C185 170 192 150 200 135 Z"
              strokeWidth="0.9"
            />
          </g>
        ))}
      </g>
    </svg>
  );
};
