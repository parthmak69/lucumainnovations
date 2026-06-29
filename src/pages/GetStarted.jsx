import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { servicesData } from '../data/mockData';
import { FiCheck, FiArrowRight, FiArrowLeft, FiCompass, FiBriefcase, FiDollarSign, FiClock, FiFileText, FiAward } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';
import SpotlightCard from '../components/SpotlightCard';

export default function GetStarted() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [tier, setTier] = useState('standard'); // 'mvp' | 'standard' | 'enterprise'
  const [speed, setSpeed] = useState('standard'); // 'flexible' | 'standard' | 'rush'
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Handle service toggle
  const handleToggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Perform client data validation
  const validateStep1 = () => {
    if (!clientData.name.trim()) {
      setValidationError('Please enter your name.');
      return false;
    }
    if (!clientData.email.trim()) {
      setValidationError('Please enter your email.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(clientData.email)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    if (currentStep === 2 && selectedServices.length === 0) {
      setValidationError('Please select at least one service to continue.');
      return;
    }
    setValidationError('');
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setValidationError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Calculate pricing metrics
  const estimateResult = useMemo(() => {
    if (selectedServices.length === 0) return { min: 0, max: 0, weeks: 0 };
    const selectedObjs = servicesData.filter((s) => selectedServices.includes(s.id));
    const baseSum = selectedObjs.reduce((acc, curr) => acc + curr.basePrice, 0);
    const maxWeeks = Math.max(...selectedObjs.map((s) => s.timeframeWeeks));

    let tierMult = 1.0;
    if (tier === 'mvp') tierMult = 0.75;
    else if (tier === 'enterprise') tierMult = 1.45;

    let speedCostMult = 1.0;
    let speedTimeMult = 1.0;
    if (speed === 'rush') {
      speedCostMult = 1.3;
      speedTimeMult = 0.7;
    } else if (speed === 'flexible') {
      speedCostMult = 0.95;
      speedTimeMult = 1.3;
    }

    const calculatedBase = baseSum * tierMult * speedCostMult;
    const finalWeeks = Math.ceil(maxWeeks * speedTimeMult);

    return {
      min: Math.round(calculatedBase * 0.9 / 50) * 50,
      max: Math.round(calculatedBase * 1.15 / 50) * 50,
      weeks: finalWeeks
    };
  }, [selectedServices, tier, speed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-bg-light overflow-hidden flex flex-col justify-center">
      <GradientBlobs />

      <div className="relative max-w-3xl w-full mx-auto px-6 z-10">
        {/* Onboarding Wizard Card */}
        <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.25)" className="p-6 md:p-10 overflow-hidden relative text-left">
          
          {/* Progress Indicators */}
          {!isSubmitted && (
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
              {[
                { step: 1, label: 'Profile' },
                { step: 2, label: 'Services' },
                { step: 3, label: 'Scale' },
                { step: 4, label: 'Summary' }
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-bold transition-all ${
                      currentStep === s.step
                        ? 'bg-brand-purple text-white shadow-sm'
                        : currentStep > s.step
                        ? 'bg-brand-purple-muted text-brand-purple-accent'
                        : 'bg-transparent border border-gray-800 text-text-secondary'
                    }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-heading font-semibold ${
                      currentStep === s.step ? 'text-brand-purple-accent' : 'text-text-secondary'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-semibold text-left flex items-center gap-2 border border-red-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping shrink-0" />
              {validationError}
            </div>
          )}

          {/* STEP CONTENT SWITCHBOARD */}
          <div className="text-left min-h-80">
            {isSubmitted ? (
              // Success Screen
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center mx-auto text-3xl">
                  <FiAward className="text-brand-purple" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-heading font-extrabold text-2xl text-text-primary">
                    Project Configured!
                  </h2>
                  <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                    Thank you, **{clientData.name}**. Your configuration setup has been sent to our founding engineers. We will prepare a detailed operational roadmap and follow up at **{clientData.email}** within 12 hours.
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-4">
                  <Link to="/" className="px-6 py-2.5 btn-neumorphic text-sm">
                    Back to Home
                  </Link>
                  <Link to="/services" className="px-6 py-2.5 btn-neumorphic-primary text-sm font-semibold shadow-sm">
                    Explore Services
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {/* Step 1: Customer Contact Info */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                        <FiCompass className="text-brand-purple-accent animate-pulse" /> Tell Us About Yourself
                      </h2>
                      <p className="text-text-secondary text-xs">Let's get some basic context about you and your company.</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Your Name *</label>
                        <input
                          type="text"
                          value={clientData.name}
                          onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                          placeholder="e.g. Liam Devlin"
                          className="w-full p-4 rounded-xl text-sm border border-gray-800 focus:outline-none focus:border-brand-purple-accent/50 bg-transparent text-white placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Email Address *</label>
                        <input
                          type="email"
                          value={clientData.email}
                          onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                          placeholder="e.g. liam@company.com"
                          className="w-full p-4 rounded-xl text-sm border border-gray-800 focus:outline-none focus:border-brand-purple-accent/50 bg-transparent text-white placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Company Name (Optional)</label>
                        <input
                          type="text"
                          value={clientData.company}
                          onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                          placeholder="e.g. Future Labs"
                          className="w-full p-4 rounded-xl text-sm border border-gray-800 focus:outline-none focus:border-brand-purple-accent/50 bg-transparent text-white placeholder:text-white/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Choose Services */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                        <FiBriefcase className="text-brand-purple-accent" /> Select Project Requirements
                      </h2>
                      <p className="text-text-secondary text-xs">Choose one or more capabilities you require from our team.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 pt-2">
                      {servicesData.map((s) => {
                        const isSelected = selectedServices.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleToggleService(s.id)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple-accent shadow-sm'
                                : 'bg-transparent border-gray-800 hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="mt-1 accent-brand-purple-accent pointer-events-none"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-white">{s.title}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">${s.basePrice.toLocaleString()} base price</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Project Tier and Speed */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                        <FiDollarSign className="text-brand-purple-accent" /> Define Tier & Speed
                      </h2>
                      <p className="text-text-secondary text-xs">Adjust complexity scale and delivery sprints parameters.</p>
                    </div>
 
                    {/* Project Tier */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Project Tier</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'mvp', label: 'MVP Release', desc: 'Core features (0.75x)' },
                          { id: 'standard', label: 'Standard Release', desc: 'Full release (1.0x)' },
                          { id: 'enterprise', label: 'Enterprise Suite', desc: 'Custom scale (1.45x)' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTier(t.id)}
                            className={`p-4 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                              tier === t.id
                                ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple-accent shadow-sm'
                                : 'bg-transparent border-gray-800 hover:bg-white/5'
                            }`}
                          >
                            <span className="font-bold text-xs text-white">{t.label}</span>
                            <span className="text-[9px] text-text-secondary mt-1">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
 
                    {/* Timeline Speed */}
                    <div className="space-y-3">
                      <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Development Speed</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'flexible', label: 'Flexible', desc: 'Relaxed sprints (0.95x cost)' },
                          { id: 'standard', label: 'Standard', desc: 'Optimized (1.0x cost)' },
                          { id: 'rush', label: 'Rush Sprints', desc: 'Priority deployment (1.3x cost)' }
                        ].map((sp) => (
                          <button
                            key={sp.id}
                            onClick={() => setSpeed(sp.id)}
                            className={`p-4 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                              speed === sp.id
                                ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple-accent shadow-sm'
                                : 'bg-transparent border-gray-800 hover:bg-white/5'
                            }`}
                          >
                            <span className="font-bold text-xs text-white">{sp.label}</span>
                            <span className="text-[9px] text-text-secondary mt-1">{sp.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
 
                {/* Step 4: Summary Proposal */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                        <FiFileText className="text-brand-purple-accent" /> Project Summary Review
                      </h2>
                      <p className="text-text-secondary text-xs">Verify your selections and estimated values before submission.</p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Left: Metadata details */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary">CLIENT REPRESENTATIVE</p>
                          <p className="text-sm font-bold text-white mt-0.5">{clientData.name}</p>
                          <p className="text-xs text-text-secondary">{clientData.email}</p>
                          {clientData.company && <p className="text-xs text-text-secondary">Company: {clientData.company}</p>}
                        </div>
 
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary">TIER & DEVELOPMENT VELOCITY</p>
                          <p className="text-sm font-bold text-white mt-0.5">Tier: {tier.toUpperCase()}</p>
                          <p className="text-xs text-text-secondary">Sprints: {speed.toUpperCase()}</p>
                        </div>
 
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary">CAPABILITIES SELECTED</p>
                          <ul className="text-xs space-y-1 mt-1.5 max-h-28 overflow-y-auto pr-1">
                            {servicesData
                              .filter((s) => selectedServices.includes(s.id))
                              .map((s) => (
                                <li key={s.id} className="flex items-center gap-1.5 font-medium text-white">
                                  <FiCheck className="text-brand-purple-accent text-xs shrink-0" />
                                  {s.title}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
 
                      {/* Right: Calculations box */}
                      <div className="p-6 rounded-2xl bg-brand-purple-muted/30 border border-brand-purple/10 flex flex-col justify-center space-y-5">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary">ESTIMATED PRICE RANGE</p>
                          <p className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-purple-accent mt-1">
                            ${estimateResult.min.toLocaleString()} - ${estimateResult.max.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary">ESTIMATED TIMELINE</p>
                          <p className="font-heading font-bold text-lg text-white mt-0.5">
                            {estimateResult.weeks} Weeks
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
 
          {/* Nav buttons footer */}
          {!isSubmitted && (
            <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  onClick={prevStep}
                  className="px-5 py-2.5 btn-neumorphic text-xs font-semibold flex items-center gap-2"
                >
                  <FiArrowLeft /> Back
                </button>
              ) : (
                <div />
              )}
 
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-5 py-2.5 btn-neumorphic text-xs font-semibold flex items-center gap-2 text-brand-purple-accent"
                >
                  Continue <FiArrowRight />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 btn-neumorphic-primary text-xs font-bold tracking-wider flex items-center gap-2"
                >
                  Submit Briefing <FiCheck />
                </button>
              )}
            </div>
          )}
 
        </SpotlightCard>
      </div>
    </div>
  );
}
