import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesData } from '../data/mockData';
import { FiCheck } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';
import SpotlightCard from '../components/SpotlightCard';

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('all');

  // Category list
  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'web', label: 'Web Dev' },
    { id: 'mobile', label: 'Mobile Apps' },
    { id: 'backend', label: 'Backend & APIs' },
    { id: 'cloud', label: 'Hosting & Cloud' },
    { id: 'design', label: 'UX & Automation' }
  ];

  // Filter services
  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return servicesData;
    return servicesData.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-bg-light overflow-hidden">
      <GradientBlobs />

      {/* ================= HERO INTRO ================= */}
      <section className="relative max-w-7xl mx-auto px-6 mb-16 text-center z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-text-primary">
            Our Technology Services
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
            We provide full-cycle engineering from high-performance single page apps to robust backend integrations and dedicated cloud configurations.
          </p>
        </div>
      </section>

      {/* ================= SERVICE TAB FILTERS ================= */}
      <section className="relative max-w-7xl mx-auto px-6 mb-12 z-10 flex justify-center">
        <div className="flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-bg-flat border border-gray-200/40 shadow-sm max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-heading text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-card-light text-brand-purple shadow-sm border border-gray-100'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ================= SERVICES GRID ================= */}
      <section className="relative max-w-7xl mx-auto px-6 mb-24 z-10">
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  key={service.id}
                  className="flex flex-col h-full"
                >
                  <SpotlightCard
                    spotlightColor="rgba(124, 58, 237, 0.25)"
                    className="p-8 flex flex-col justify-between text-left group hover:border-brand-purple/20 transition-all duration-300 h-full"
                  >
                    <div className="space-y-5">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-brand-purple-accent group-hover:scale-110 transition-all duration-300"
                          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
                        >
                          <IconComponent className="text-xl" />
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-purple-muted text-brand-purple-accent uppercase tracking-wider">
                          {service.category}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-heading font-bold text-lg md:text-xl text-white group-hover:text-brand-purple-accent transition-colors duration-300">
                          {service.title}
                        </h3>
                        <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      {/* Features checklist */}
                      <ul className="space-y-2.5 pt-2">
                        {service.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs md:text-sm text-text-secondary">
                            <FiCheck className="text-brand-purple-accent shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800">
                      <span className="text-xs text-text-secondary">Est: {service.timeframeWeeks} weeks</span>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
