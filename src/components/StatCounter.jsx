import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

export default function StatCounter({ value, duration = 1.5, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) {
      setCount(value);
      return;
    }

    const totalFrames = 60 * duration;
    const increment = end / totalFrames;
    let currentFrame = 0;

    const counterInterval = setInterval(() => {
      currentFrame++;
      start = Math.floor(increment * currentFrame);

      if (currentFrame >= totalFrames || start >= end) {
        setCount(end);
        clearInterval(counterInterval);
      } else {
        setCount(start);
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(counterInterval);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="font-heading font-extrabold text-4xl sm:text-5xl text-brand-purple tracking-tight">
      {count}
      {suffix}
    </span>
  );
}
