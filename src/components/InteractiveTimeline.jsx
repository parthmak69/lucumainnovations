import React from 'react';
import { motion } from 'framer-motion';
import { processSteps } from '../data/mockData';

export default function InteractiveTimeline() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
      },
    },
  };

  return (
    <div className="relative max-w-5xl mx-auto px-4 py-8">
      {/* Central Timeline Spine Line */}
      <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-brand-purple/20 via-brand-purple-light/20 to-brand-purple-accent/10 rounded-full transform -translate-x-1/2 hidden sm:block" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="space-y-12 md:space-y-16"
      >
        {processSteps.map((step, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.div
              key={step.step}
              variants={itemVariants}
              className={`relative flex flex-col sm:flex-row items-start ${
                isEven ? 'sm:flex-row-reverse' : ''
              } justify-between`}
            >
              {/* Timeline Center Node (Dot) */}
              <div className="absolute left-8 md:left-1/2 top-6 w-8 h-8 rounded-full bg-card-light border-4 border-brand-purple shadow-neumorphic-flat flex items-center justify-center transform -translate-x-1/2 z-10 select-none">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-pulse" />
              </div>

              {/* Empty Spacer Column for Desktop Alignment */}
              <div className="w-full sm:w-[45%] hidden sm:block" />

              {/* Content Card Panel */}
              <div className="w-full sm:w-[45%] pl-12 sm:pl-0">
                <div className="neumorphic-card p-6 md:p-8 relative overflow-hidden group hover:border-brand-purple/20 transition-all duration-300">
                  {/* Decorative corner tag */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-brand-purple-muted rounded-bl-full flex items-center justify-center select-none">
                    <span className="font-heading font-bold text-sm text-brand-purple translate-x-2.5 -translate-y-2.5">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg md:text-xl text-text-primary mb-3 group-hover:text-brand-purple transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
