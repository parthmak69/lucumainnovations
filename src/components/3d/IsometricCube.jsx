import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function IsometricCube() {
  // Motion values for x/y mouse rotation relative to the center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring configuration
  const springX = useSpring(mouseX, { stiffness: 60, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 15 });

  // Map spring outputs to rotation degrees
  const rotateX = useTransform(springY, [-300, 300], [50, -10]);
  const rotateY = useTransform(springX, [-300, 300], [15, 75]);
  const translateZ = 75; // half of cube side length (150px)

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Get mouse displacement relative to window center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Design each face of the 3D cube
  const faceStyles = {
    front: { transform: `rotateY(0deg) translateZ(${translateZ}px)` },
    back: { transform: `rotateY(180deg) translateZ(${translateZ}px)` },
    left: { transform: `rotateY(-90deg) translateZ(${translateZ}px)` },
    right: { transform: `rotateY(90deg) translateZ(${translateZ}px)` },
    top: { transform: `rotateX(90deg) translateZ(${translateZ}px)` },
    bottom: { transform: `rotateX(-90deg) translateZ(${translateZ}px)` },
  };

  const icons = {
    front: '{ }',
    back: '</>',
    left: 'DB',
    right: 'API',
    top: 'cloud',
    bottom: '⚡'
  };

  return (
    <div className="relative flex items-center justify-center w-72 h-72 perspective-1000">
      {/* Decorative Outer Glow Blob */}
      <div className="absolute w-44 h-44 rounded-full bg-brand-purple/20 blur-3xl animate-pulse" />

      {/* Main 3D Rotator Container */}
      <motion.div
        className="w-40 h-40 transform-style-3d relative"
        style={{
          rotateX,
          rotateY,
          rotateZ: 0,
        }}
        animate={{
          // Slowly rotate by default if no mouse moves
          rotateY: [15, 375],
        }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: 'linear',
        }}
      >
        {Object.entries(faceStyles).map(([face, style]) => (
          <div
            key={face}
            className="absolute w-40 h-40 flex flex-col items-center justify-center rounded-2xl border border-brand-purple/35 glass-card shadow-glass-shadow text-brand-purple select-none backface-hidden"
            style={{
              ...style,
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Soft inner glow accent */}
            <div className="absolute inset-2 rounded-xl border border-purple-200/20" style={{ background: 'radial-gradient(circle, transparent 60%, rgba(109,40,217,0.05) 100%)' }} />
            
            {/* Technical Symbol */}
            <span className="font-mono text-2xl font-bold tracking-wider drop-shadow-[0_2px_8px_rgba(109,40,217,0.25)]">
              {icons[face]}
            </span>

            {/* Minor branding name */}
            <span className="absolute bottom-3 font-mono text-[8px] tracking-[0.2em] text-brand-purple-light uppercase opacity-50">
              LUCUMA
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
