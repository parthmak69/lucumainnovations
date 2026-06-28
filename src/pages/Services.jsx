import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { servicesData } from '../data/mockData';
import { FiCheck, FiInfo, FiSliders, FiFileText } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Project Estimator State
  const [selectedServices, setSelectedServices] = useState([]);
  const [projectTimeline, setProjectTimeline] = useState('standard'); // 'rush' | 'standard' | 'flexible'
  const [projectScope, setProjectScope] = useState('standard'); // 'mvp' | 'standard' | 'enterprise'
  const [copySuccess, setCopySuccess] = useState(false);

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

  // Handle service toggle in estimator
  const handleToggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Calculate project estimate metrics
  const estimateMetrics = useMemo(() => {
    if (selectedServices.length === 0) return { min: 0, max: 0, weeks: 0 };

    const selectedObjs = servicesData.filter((s) => selectedServices.includes(s.id));
    let baseSum = selectedObjs.reduce((acc, curr) => acc + curr.basePrice, 0);
    let maxTimeWeeks = Math.max(...selectedObjs.map((s) => s.timeframeWeeks));

    // Apply scope multiplier
    let scopeMultiplier = 1.0;
    if (projectScope === 'mvp') {
      scopeMultiplier = 0.75;
    } else if (projectScope === 'enterprise') {
      scopeMultiplier = 1.45;
    }

    // Apply timeline modifier (e.g., Rush costs more but takes less time)
    let timelineCostMultiplier = 1.0;
    let timelineWeeksMultiplier = 1.0;
    if (projectTimeline === 'rush') {
      timelineCostMultiplier = 1.3;
      timelineWeeksMultiplier = 0.7; // 30% reduction in time
    } else if (projectTimeline === 'flexible') {
      timelineCostMultiplier = 0.95; // slight discount
      timelineWeeksMultiplier = 1.3; // takes longer
    }

    const calculatedPrice = baseSum * scopeMultiplier * timelineCostMultiplier;
    const finalWeeks = Math.ceil(maxTimeWeeks * timelineWeeksMultiplier);

    // Range: Min price = calculatedPrice * 0.9, Max price = calculatedPrice * 1.15
    return {
      min: Math.round(calculatedPrice * 0.9 / 50) * 50, // round to nearest 50
      max: Math.round(calculatedPrice * 1.15 / 50) * 50,
      weeks: finalWeeks
    };
  }, [selectedServices, projectTimeline, projectScope]);

  // Copy proposal summary to clipboard
  const handleCopyProposal = () => {
    if (selectedServices.length === 0) return;

    const selectedNames = servicesData
      .filter((s) => selectedServices.includes(s.id))
      .map((s) => `  - ${s.title}`)
      .join('\n');

    const summaryText = `LUCUMA TECH PROJECT ESTIMATE PROPOSAL
---------------------------------------
Selected Services:
${selectedNames}

Scope: ${projectScope.toUpperCase()}
Timeline Speed: ${projectTimeline.toUpperCase()}

Estimated Cost: $${estimateMetrics.min.toLocaleString()} - $${estimateMetrics.max.toLocaleString()}
Estimated Timeline: ${estimateMetrics.weeks} weeks

Interested in building this? Reach out at:
Email: hello@lucumatech.com
Website: www.lucumatech.com
---------------------------------------`;

    navigator.clipboard.writeText(summaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

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
                  className="neumorphic-card p-8 flex flex-col justify-between text-left group hover:border-brand-purple/20 transition-all duration-300"
                >
                  <div className="space-y-5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-bg-light shadow-neumorphic-flat border border-gray-100 flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-all duration-300">
                        <IconComponent className="text-xl" />
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-purple-muted text-brand-purple uppercase tracking-wider">
                        {service.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-heading font-bold text-lg md:text-xl text-text-primary group-hover:text-brand-purple transition-colors duration-300">
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
                          <FiCheck className="text-brand-purple shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Est: {service.timeframeWeeks} weeks</span>
                    <button
                      onClick={() => {
                        handleToggleService(service.id);
                        document.getElementById('estimator-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold border border-brand-purple/30 text-brand-purple hover:bg-brand-purple hover:text-white transition-all"
                    >
                      {selectedServices.includes(service.id) ? 'Selected' : 'Estimate Cost'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ================= INTERACTIVE ESTIMATOR ================= */}
      <section id="estimator-section" className="relative max-w-5xl mx-auto px-6 z-10 scroll-mt-24">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1 text-brand-purple bg-brand-purple-muted px-4 py-1 rounded-full font-mono text-xs font-bold tracking-wider">
            <FiSliders /> INTERACTIVE PROJECT ESTIMATOR
          </div>
          <h2 className="font-heading font-extrabold text-3xl text-text-primary">
            Configure Your Project Budget
          </h2>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Select the services you need, pick your timeframe preferences, and immediately receive a budget proposal summary.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Services */}
            <div className="neumorphic-card p-6 text-left">
              <h3 className="font-heading font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-purple-muted text-brand-purple text-xs font-bold flex items-center justify-center">1</span>
                Select Services Required
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {servicesData.map((service) => {
                  const isChecked = selectedServices.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      onClick={() => handleToggleService(service.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple shadow-sm'
                          : 'bg-transparent border-gray-200/50 hover:bg-bg-flat/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="mt-1 accent-brand-purple pointer-events-none"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-text-primary">{service.title}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">${service.basePrice.toLocaleString()} base</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Project Scope */}
            <div className="neumorphic-card p-6 text-left">
              <h3 className="font-heading font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-purple-muted text-brand-purple text-xs font-bold flex items-center justify-center">2</span>
                Choose Project Tier
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'mvp', label: 'Minimum Viable Product', desc: 'Core features (0.75x)' },
                  { id: 'standard', label: 'Standard Tier', desc: 'Polished & full release (1.0x)' },
                  { id: 'enterprise', label: 'Enterprise Grade', desc: 'Complex scaling (1.45x)' }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setProjectScope(tier.id)}
                    className={`p-4 rounded-xl border flex flex-col text-left transition-all ${
                      projectScope === tier.id
                        ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple shadow-sm'
                        : 'bg-transparent border-gray-200/50 hover:bg-bg-flat/20'
                    }`}
                  >
                    <span className="font-bold text-xs text-text-primary">{tier.label}</span>
                    <span className="text-[9px] text-text-secondary mt-1">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Project Timeline */}
            <div className="neumorphic-card p-6 text-left">
              <h3 className="font-heading font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-purple-muted text-brand-purple text-xs font-bold flex items-center justify-center">3</span>
                Select Development Speed
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'flexible', label: 'Flexible', desc: 'Regular delivery (0.95x cost)' },
                  { id: 'standard', label: 'Standard', desc: 'Optimized sprint (1.0x cost)' },
                  { id: 'rush', label: 'Rush Project', desc: 'Priority team (1.3x cost)' }
                ].map((timeline) => (
                  <button
                    key={timeline.id}
                    onClick={() => setProjectTimeline(timeline.id)}
                    className={`p-4 rounded-xl border flex flex-col text-left transition-all ${
                      projectTimeline === timeline.id
                        ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple shadow-sm'
                        : 'bg-transparent border-gray-200/50 hover:bg-bg-flat/20'
                    }`}
                  >
                    <span className="font-bold text-xs text-text-primary">{timeline.label}</span>
                    <span className="text-[9px] text-text-secondary mt-1">{timeline.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Dashboard */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="p-8 rounded-[24px] neumorphic-card bg-gradient-to-br from-white to-brand-purple-muted/30 border-brand-purple/10 text-left space-y-6">
              <h3 className="font-heading font-extrabold text-xl text-text-primary flex items-center gap-2">
                Estimate Summary
              </h3>

              {selectedServices.length === 0 ? (
                <div className="py-12 text-center text-text-secondary space-y-4">
                  <FiInfo className="text-3xl text-brand-purple/40 mx-auto animate-bounce" />
                  <p className="text-sm">Please select at least one service to generate an estimate.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Price range display */}
                  <div className="space-y-1">
                    <p className="text-xs uppercase font-semibold tracking-wider text-text-secondary">ESTIMATED PRICE RANGE</p>
                    <div className="font-heading font-extrabold text-3xl sm:text-4xl text-brand-purple">
                      ${estimateMetrics.min.toLocaleString()} - ${estimateMetrics.max.toLocaleString()}
                    </div>
                  </div>

                  {/* Weeks display */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200/30">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-text-secondary">TIMEFRAME</p>
                      <p className="font-heading font-bold text-lg text-text-primary">{estimateMetrics.weeks} Weeks</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-text-secondary">SERVICES SELECTED</p>
                      <p className="font-heading font-bold text-lg text-text-primary">{selectedServices.length}</p>
                    </div>
                  </div>

                  {/* Mini summary list */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-text-secondary">INCLUDED SERVICES</p>
                    <ul className="text-xs space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {servicesData
                        .filter((s) => selectedServices.includes(s.id))
                        .map((s) => (
                          <li key={s.id} className="flex items-center gap-2 text-text-primary font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                            {s.title}
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleCopyProposal}
                      className="w-full py-3.5 btn-neumorphic-primary flex items-center justify-center gap-2 text-sm"
                    >
                      <FiFileText />
                      {copySuccess ? 'Estimate Copied!' : 'Copy Proposal Summary'}
                    </button>
                    <p className="text-[10px] text-center text-text-secondary">
                      This is a non-binding developer estimate. Final quote requires a strategic project briefing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
