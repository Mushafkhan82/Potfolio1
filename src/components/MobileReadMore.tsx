import React, { useState } from 'react';

interface MobileReadMoreProps {
  children: React.ReactNode;
  lines?: 2 | 3;
  className?: string;
  buttonClassName?: string;
}

/**
 * Collapses long copy on mobile (<768px) while keeping 100% of text in the DOM for SEO
 * and keeping desktop (>=768px) layout completely unchanged.
 */
export const MobileReadMore: React.FC<MobileReadMoreProps> = ({
  children,
  lines = 2,
  className = '',
  buttonClassName = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const clampClass = lines === 3 ? 'line-clamp-3' : 'line-clamp-2';

  return (
    <div className={className}>
      <div className={expanded ? '' : `${clampClass} md:line-clamp-none`}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className={`md:hidden mt-1 min-h-[44px] inline-flex items-center font-mono text-xs font-semibold text-[#4C7A00] hover:underline cursor-pointer ${buttonClassName}`}
      >
        {expanded ? 'Show less ↑' : 'Read more ↓'}
      </button>
    </div>
  );
};
