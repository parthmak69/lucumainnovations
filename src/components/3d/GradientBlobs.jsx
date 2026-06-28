import React from 'react';

export default function GradientBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Blob 1: Deep Purple - Top Right */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-purple-light/10 blur-[80px] md:blur-[120px] animate-blob-slow" />

      {/* Blob 2: Fuchsia/Pink - Bottom Left */}
      <div className="absolute bottom-[10%] left-[-10%] w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-gradient-to-tr from-fuchsia-500/10 to-brand-purple-accent/15 blur-[60px] md:blur-[100px] animate-blob-slow" style={{ animationDelay: '2s' }} />

      {/* Blob 3: Indigo/Blue - Middle Right */}
      <div className="absolute top-[40%] right-[10%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-gradient-to-r from-indigo-500/10 to-brand-purple/10 blur-[80px] md:blur-[100px] animate-blob-slow" style={{ animationDelay: '4s' }} />

      {/* Subtle Dot Matrix Pattern Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 mix-blend-multiply" />
    </div>
  );
}
