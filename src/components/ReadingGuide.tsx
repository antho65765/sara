import React, { useEffect, useState } from 'react';

interface ReadingGuideProps {
  enabled: boolean;
}

export const ReadingGuide: React.FC<ReadingGuideProps> = ({ enabled }) => {
  const [mouseY, setMouseY] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="reading-guide-line"
      style={{ top: `${mouseY}px` }}
      aria-hidden="true"
    />
  );
};
