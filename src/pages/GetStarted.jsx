import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { servicesData } from '../data/mockData';
import { FiCheck, FiArrowRight, FiArrowLeft, FiCompass, FiBriefcase, FiAward, FiFeather, FiLayout, FiTrendingUp, FiZap, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';
import SpotlightCard from '../components/SpotlightCard';

const API_BASE_URL = "http://localhost:5000/api";

export default function GetStarted() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    company: '',
  });

  const [selectedServices, setSelectedServices] = useState([]);
  const [stage, setStage] = useState('idea');
  const [timeline, setTimeline] = useState('month');
  const [validationError, setValidationError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // OTP Validation States
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const estimateResult = useMemo(() => {
    if (selectedServices.length === 0) return { weeks: 0 };

    let totalWeeks = 0;
    selectedServices.forEach((id) => {
      const match = servicesData.find((s) => s.id === id);
      if (match) {
        totalWeeks += match.weeks || 4;
      }
    });

    let modifier = 1.0;
    if (timeline === 'asap') modifier = 0.7;
    if (timeline === 'flexible') modifier = 1.3;

    const finalWeeks = Math.ceil(totalWeeks * modifier);

    return {
      weeks: finalWeeks
    };
  }, [selectedServices, timeline]);

  const validateStep = () => {
    setValidationError('');

    if (currentStep === 1) {
      if (!clientData.name.trim() || !clientData.email.trim()) {
        setValidationError('Please fill in all required fields');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(clientData.email)) {
        setValidationError('Please enter a valid email address');
        return false;
      }
    }

    if (currentStep === 2) {
      if (selectedServices.length === 0) {
        setValidationError('Please select at least one requirement to continue.');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setValidationError('');
    setCurrentStep((prev) => prev - 1);
  };

  // Step 1: Request verification sequence on final submit click
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);
    setValidationError('');
    try {
      const res = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clientData.email })
      });

      if (res.ok) {
        setShowOtpField(true);
      } else {
        const data = await res.json();
        setValidationError(data.message || "Failed to issue validation token.");
      }
    } catch (err) {
      setValidationError("Failed to communicate with communication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Confirms verification and writes payload records
  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setValidationError("Please enter the verification OTP token.");
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clientData.email, otp: otp })
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        setValidationError(verifyData.message || "Invalid tracking token.");
        setIsSubmitting(false);
        return;
      }

      // Format payload text summaries
      const selectedTitles = servicesData
        .filter((s) => selectedServices.includes(s.id))
        .map((s) => s.title)
        .join(', ');

      const structuredMessage = `Project Stage: ${stage}\nTimeline Constraint: ${timeline}\nSelected Capabilities: ${selectedTitles}\nEstimated Scope duration calculated: ${estimateResult.weeks} Weeks`;

      const contactRes = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientData.name,
          email: clientData.email,
          phone: `Development Target: ${timeline}`,
          company: clientData.company || "Not Provided",
          message: structuredMessage,
          formType: 'get-started'
        })
      });

      if (contactRes.ok) {
        setIsSubmitted(true);
      } else {
        const contactData = await contactRes.json();
        setValidationError(contactData.message || "Failed to lock enquiry tracking.");
      }
    } catch (err) {
      setValidationError("Database communications pipeline failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-bg-light overflow-hidden flex flex-col justify-center">
      <GradientBlobs />

      <section className="relative max-w-3xl mx-auto px-6 mb-8 text-center z-10">
        <div className="space-y-3">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
            Get Started
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xl mx-auto">
            Ready to build something with us? Use this guided onboarding flow to tell us about your project.
          </p>
        </div>
      </section>

      <div className="relative max-w-3xl w-full mx-auto px-6 z-10">
        <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.25)" className="p-6 md:p-10 overflow-hidden relative text-left">

          {!isSubmitted && (
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-6 mb-6">
              {[
                { step: 1, label: 'Profile' },
                { step: 2, label: 'Services' },
                { step: 3, label: 'Discovery' },
                { step: 4, label: 'Brief' }
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-bold transition-all ${currentStep === s.step
                      ? 'bg-brand-purple text-white shadow-sm'
                      : currentStep > s.step
                        ? 'bg-brand-purple-muted text-brand-purple-accent'
                        : 'bg-transparent border border-gray-800 text-text-secondary'
                      }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-heading font-semibold ${currentStep === s.step ? 'text-brand-purple-accent' : 'text-text-secondary'
                      }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {validationError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-semibold text-left flex items-center gap-2 border border-red-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping shrink-0" />
              {validationError}
            </div>
          )}

          <div className="text-left min-h-80">
            {isSubmitted ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center mx-auto text-3xl">
                  <FiAward className="text-brand-purple" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-heading font-extrabold text-2xl text-text-primary">
                    Project Inquiry Received!
                  </h2>
                  <div className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed space-y-2">
                    <p>Thank you for choosing Lucuma Innovations.</p>
                    <p>Your project inquiry has been successfully received.</p>
                    <p>Our team will carefully review your requirements and reach out to discuss the next steps.</p>
                    <p className="font-semibold text-brand-purple-accent">We're excited to help bring your vision to life.</p>
                  </div>
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
                        <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Name*</label>
                        <input
                          type="text"
                          value={clientData.name}
                          onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                          placeholder="Your Name"
                          className="w-full p-4 rounded-xl text-sm border border-gray-800 focus:outline-none focus:border-brand-purple-accent/50 bg-transparent text-white placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Email Address *</label>
                        <input
                          type="email"
                          value={clientData.email}
                          onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                          placeholder="e.g. you@example.com"
                          className="w-full p-4 rounded-xl text-sm border border-gray-800 focus:outline-none focus:border-brand-purple-accent/50 bg-transparent text-white placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Company Name (Optional)</label>
                        <input
                          type="text"
                          value={clientData.company}
                          onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                          placeholder="Enter your company name"
                          className="w-full p-4 rounded-xl text-sm border border-gray-800 focus:outline-none focus:border-brand-purple-accent/50 bg-transparent text-white placeholder:text-white/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                        <FiCompass className="text-brand-purple-accent" /> Define Stage & Timeline
                      </h2>
                      <p className="text-text-secondary text-xs">Let us know about your project status and timeline targets.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Project Stage</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'idea', label: 'Just an Idea', icon: <FiFeather className="text-brand-purple-accent text-sm" />, desc: 'The project is still being planned.' },
                          { id: 'design', label: 'Design Ready', icon: <FiLayout className="text-brand-purple-accent text-sm" />, desc: 'Wireframes, UI or designs already exist.' },
                          { id: 'existing', label: 'Existing Product', icon: <FiTrendingUp className="text-brand-purple-accent text-sm" />, desc: 'Improve, scale or modernize an existing project.' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setStage(t.id)}
                            className={`p-4 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${stage === t.id
                              ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple-accent shadow-sm'
                              : 'bg-transparent border-gray-800 hover:bg-white/5'
                              }`}
                          >
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">{t.icon} {t.label}</span>
                            <span className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">Target Timeline</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'asap', label: 'ASAP', icon: <FiZap className="text-brand-purple-accent text-sm" /> },
                          { id: 'month', label: 'Within 1 Month', icon: <FiCalendar className="text-brand-purple-accent text-sm" /> },
                          { id: 'flexible', label: 'Flexible', icon: <FiClock className="text-brand-purple-accent text-sm" /> }
                        ].map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => setTimeline(sp.id)}
                            className={`p-4 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${timeline === sp.id
                              ? 'bg-brand-purple-muted border-brand-purple/40 text-brand-purple-accent shadow-sm'
                              : 'bg-transparent border-gray-800 hover:bg-white/5'
                              }`}
                          >
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">{sp.icon} {sp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                        <FiCompass className="text-brand-purple-accent" /> Project Brief
                      </h2>
                      <p className="text-text-secondary text-xs">Verify your onboarding details and selections before submission.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">CLIENT REPRESENTATIVE</p>
                          <p className="text-sm font-bold text-white mt-0.5">{clientData.name}</p>
                          <p className="text-xs text-text-secondary">{clientData.email}</p>
                          {clientData.company && <p className="text-xs text-text-secondary">Company: {clientData.company}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">PROJECT STAGE</p>
                            <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                              {stage === 'idea' && <><FiFeather className="text-brand-purple-accent" /> Just an Idea</>}
                              {stage === 'design' && <><FiLayout className="text-brand-purple-accent" /> Design Ready</>}
                              {stage === 'existing' && <><FiTrendingUp className="text-brand-purple-accent" /> Existing Product</>}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">TIMELINE</p>
                            <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                              {timeline === 'asap' && <><FiZap className="text-brand-purple-accent" /> ASAP</>}
                              {timeline === 'month' && <><FiCalendar className="text-brand-purple-accent" /> Within 1 Month</>}
                              {timeline === 'flexible' && <><FiClock className="text-brand-purple-accent" /> Flexible</>}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">CAPABILITIES SELECTED</p>
                          <ul className="text-xs space-y-1 mt-1.5 max-h-24 overflow-y-auto pr-1">
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

                      <div className="p-6 rounded-2xl bg-brand-purple-muted/30 border border-brand-purple/10 flex flex-col justify-center space-y-5">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">STATUS</p>
                          <p className="font-heading font-extrabold text-2xl text-brand-purple-accent mt-1">
                            Ready for Review
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">ESTIMATED DEVELOPMENT TIMELINE</p>
                          <p className="font-heading font-bold text-lg text-white mt-0.5">
                            {estimateResult.weeks} Weeks
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Integrated OTP Form Element */}
                    {showOtpField && (
                      <div className="mt-4 pt-4 border-t border-gray-800/60 space-y-2 text-left">
                        <label htmlFor="get-started-otp" className="text-xs font-heading font-bold text-brand-purple-accent uppercase tracking-wider">
                          Enter Onboarding Verification OTP*
                        </label>
                        <input
                          type="text"
                          id="get-started-otp"
                          maxLength="6"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="000000"
                          className="w-full p-4 rounded-xl text-sm border border-brand-purple/40 bg-[#130b24]/60 text-white tracking-[4px] font-bold focus:outline-none focus:border-brand-purple-accent"
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-800/60 space-y-3">
                      <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider">What Happens Next?</h4>
                      <ol className="text-xs text-text-secondary space-y-2 list-decimal list-inside leading-relaxed pl-1">
                        <li>Our team reviews your project requirements.</li>
                        <li>We carefully evaluate your goals and technical needs.</li>
                        <li>We'll contact you to discuss the best solution and next steps.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isSubmitted && (
            <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 btn-neumorphic text-xs font-semibold flex items-center gap-2"
                >
                  <FiArrowLeft /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 btn-neumorphic text-xs font-semibold flex items-center gap-2 text-brand-purple-accent"
                >
                  Continue <FiArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={showOtpField ? handleVerifyAndComplete : handleInitialSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 btn-neumorphic-primary text-xs font-bold tracking-wider flex items-center gap-2 relative"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : showOtpField ? (
                    <>Verify Code <FiCheck /></>
                  ) : (
                    <>Innovate <FiCheck /></>
                  )}
                </button>
              )}
            </div>
          )}

        </SpotlightCard>
      </div>
    </div>
  );
}