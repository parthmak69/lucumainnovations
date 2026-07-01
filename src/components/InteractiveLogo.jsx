import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import logoUrl from '../assets/logo.png';
import './InteractiveLogo.css';

export default function InteractiveLogo() {
  const containerRef = useRef(null);
  const [isNear, setIsNear] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Spring values for smooth 3D tilt of the logo
  const rotateX = useSpring(0, { damping: 20, stiffness: 150 });
  const rotateY = useSpring(0, { damping: 20, stiffness: 150 });

  // Spring values for smooth cursor tracker
  const cursorX = useSpring(0, { damping: 15, stiffness: 220 });
  const cursorY = useSpring(0, { damping: 15, stiffness: 220 });
  const cursorRotation = useSpring(0, { damping: 12, stiffness: 180 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const logoCenterX = rect.left + rect.width / 2;
      const logoCenterY = rect.top + rect.height / 2;

      // Distance from mouse to logo center
      const dx = e.clientX - logoCenterX;
      const dy = e.clientY - logoCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // We consider "near" if the cursor is within 320px
      const nearThreshold = 320;
      const isCurrentlyNear = distance < nearThreshold;
      setIsNear(isCurrentlyNear);

      // Update actual cursor coordinates
      setMousePos({ x: e.clientX, y: e.clientY });

      if (isCurrentlyNear) {
        // Position of custom cursor follower
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);

        // 1. Calculate angle to center to rotate (spin) the cursor
        // Adding 90 degrees so the pointer/indicator points toward the center of the logo
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI) + 90;
        cursorRotation.set(angleDeg);

        // 2. 3D Tilt calculation (max 20 degrees tilt)
        const tiltX = -Math.min(Math.max(dy / 8, -20), 20);
        const tiltY = Math.min(Math.max(dx / 8, -20), 20);
        rotateX.set(tiltX);
        rotateY.set(tiltY);
      } else {
        // Reset tilt if mouse goes far away
        rotateX.set(0);
        rotateY.set(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY, cursorRotation, rotateX, rotateY]);

  return (
    <div className="interactive-logo-container" ref={containerRef}>
      {/* Back glow */}
      <div className="logo-glow-backplate" />

      {/* Tilting Parent Container (Mouse-controlled springs) */}
      <motion.div
        className="logo-3d-box-wrapper"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Continuously spinning and floating Glass Cube Box */}
        <motion.div
          className="logo-3d-box"
          animate={{
            rotateY: 360,
            y: [0, -10, 0],
          }}
          transition={{
            rotateY: {
              duration: 18,
              ease: 'linear',
              repeat: Infinity,
            },
            y: {
              duration: 5,
              ease: 'easeInOut',
              repeat: Infinity,
            },
          }}
        >
          {/* Glass faces of the cube */}
          <div className="cube-face face-back" />
          <div className="cube-face face-left" />
          <div className="cube-face face-right" />
          <div className="cube-face face-top" />
          <div className="cube-face face-bottom" />

          {/* Static leaf logo suspended exactly in the center of the spinning cube */}
          {/* Static leaf logo suspended exactly in the center of the spinning cube */}
          <img
            src={logoUrl}
            alt="Lucuma Innovations logo"
            className="logo-graphic-inside-cube"
            style={{
              transform: 'translateZ(0px)', // Fixed at cube center
            }}
          />

          <div className="cube-face face-front" />
        </motion.div>
      </motion.div>

      {/* Proximity cursor follower */}
      {isNear && (
        <motion.div
          className="custom-cursor-follower"
          style={{
            left: cursorX,
            top: cursorY,
            rotate: cursorRotation,
            position: 'fixed',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {/* Top indicator pin to show rotation direction */}
          <div className="custom-cursor-pointer" />
          <div className="custom-cursor-dot" />
        </motion.div>
      )}
    </div>
  );
}
