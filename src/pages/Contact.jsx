import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';
import SpotlightCard from '../components/SpotlightCard';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: 'web-dev',
    budget: '3k-5k',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const projectOptions = [
    { value: 'web-dev', label: 'Custom Web Development' },
    { value: 'mobile-android', label: 'Android Application' },
    { value: 'mobile-ios', label: 'iOS Application' },
    { value: 'ui-ux', label: 'UI/UX Design' },
    { value: 'backend-api', label: 'Backend & REST APIs' },
    { value: 'cloud-hosting', label: 'Cloud Hosting & Servers' },
    { value: 'maintenance', label: 'Website Maintenance' },
    { value: 'optimization', label: 'Performance Optimization' },
    { value: 'automation', label: 'Business Automation' }
  ];

  const budgetOptions = [
    { value: 'under-3k', label: 'Under $3,000' },
    { value: '3k-5k', label: '$3,000 - $5,000' },
    { value: '5k-10k', label: '$5,000 - $10,000' },
    { value: '10k-25k', label: '$10,000 - $25,000' },
    { value: '25k-plus', label: '$25,000+' }
  ];

  // Validation
  const validateForm = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required.';
    
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is invalid.';
    }
    
    if (formData.phone.trim() && !/^\+?[0-9\s-]{7,15}$/.test(formData.phone)) {
      tempErrors.phone = 'Phone number is invalid.';
    }
    
    if (!formData.message.trim()) {
      tempErrors.message = 'Please write a brief description of your project.';
    } else if (formData.message.trim().length < 20) {
      tempErrors.message = 'Message must be at least 20 characters.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error as user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Mock server latency
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        projectType: 'web-dev',
        budget: '3k-5k',
        message: ''
      });
    }, 1800);
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-bg-light overflow-hidden">
      <GradientBlobs />

      {/* ================= HERO TITLE ================= */}
      <section className="relative max-w-7xl mx-auto px-6 mb-16 text-center z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-purple-muted border border-brand-purple-light/20 text-brand-purple font-mono text-xs font-semibold tracking-wider">
            GET IN TOUCH
          </div>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-text-primary">
            Let's Engineer Your Idea.
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Ready to scale your business operations? Send us a description of your project target, and our founding engineers will respond with a plan.
          </p>
        </div>
      </section>

      {/* ================= CONTACT SECTION CONTENT ================= */}
      <section className="relative max-w-6xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Info Panel */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-28 text-left">
            <div className="space-y-4">
              <h2 className="font-heading font-extrabold text-2xl text-text-primary">
                Briefing Brief
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Rather discuss in detail via email or call? Reach our founders directly. We answer briefings and estimate requests in under 12 hours.
              </p>
            </div>

            <div className="space-y-5">
              <SpotlightCard spotlightColor="rgba(233, 69, 245, 0.15)" className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple-accent shrink-0">
                  <FiMail className="text-lg" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Send Email</h4>
                  <p className="text-xs text-text-secondary mt-1">hello@lucumatech.com</p>
                  <p className="text-xs text-text-secondary">support@lucumatech.com</p>
                </div>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.15)" className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple-accent shrink-0">
                  <FiPhone className="text-lg" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Call Founders</h4>
                  <p className="text-xs text-text-secondary mt-1">+1 (555) 019-2831</p>
                  <p className="text-xs text-text-secondary">Mon - Fri: 8 AM - 6 PM PST</p>
                </div>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(233, 69, 245, 0.15)" className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple-accent shrink-0">
                  <FiMapPin className="text-lg" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Development Hub</h4>
                  <p className="text-xs text-text-secondary mt-1">Remote-first operations</p>
                  <p className="text-xs text-text-secondary">Silicon Valley, CA, USA</p>
                </div>
              </SpotlightCard>
            </div>
          </div>

          {/* Right Column: Neumorphic Contact Form */}
          <div className="lg:col-span-8">
            <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.2)" className="p-6 md:p-10 relative overflow-hidden">
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                        errors.name
                          ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                          : 'border-gray-200/50 focus:border-brand-purple/50 bg-bg-light/30 focus:bg-white neumorphic-inset'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <FiAlertCircle /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. john@company.com"
                      className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                        errors.email
                          ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                          : 'border-gray-200/50 focus:border-brand-purple/50 bg-bg-light/30 focus:bg-white neumorphic-inset'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <FiAlertCircle /> {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Phone and Project Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (555) 000-0000"
                      className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${
                        errors.phone
                          ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                          : 'border-gray-200/50 focus:border-brand-purple/50 bg-bg-light/30 focus:bg-white neumorphic-inset'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <FiAlertCircle /> {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="projectType" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                      Project Type
                    </label>
                    <div className="relative">
                      <select
                        id="projectType"
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleInputChange}
                        className="w-full p-4 rounded-xl text-sm border border-gray-200/50 focus:border-brand-purple/50 focus:outline-none bg-bg-light/30 focus:bg-white appearance-none cursor-pointer neumorphic-inset"
                      >
                        {projectOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Budget Bracket */}
                <div className="space-y-2">
                  <label htmlFor="budget" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                    Project Budget Range
                  </label>
                  <div className="relative">
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl text-sm border border-gray-200/50 focus:border-brand-purple/50 focus:outline-none bg-bg-light/30 focus:bg-white appearance-none cursor-pointer neumorphic-inset"
                    >
                      {budgetOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Row 4: Message Textarea */}
                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                    Project Description *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Briefly describe the key features, timeline expectations, and target audience for your product..."
                    className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all resize-none ${
                      errors.message
                        ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                        : 'border-gray-200/50 focus:border-brand-purple/50 bg-bg-light/30 focus:bg-white neumorphic-inset'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                      <FiAlertCircle /> {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 btn-neumorphic-primary flex items-center justify-center gap-2 text-base font-bold shadow-lg disabled:opacity-75 focus:outline-none"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <FiSend /> Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Success Modal Pop-up */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-text-dark/45 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full p-8 rounded-[24px] glass-card text-center space-y-5 border border-white/60 shadow-glass-shadow"
            >
              <div className="w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple flex items-center justify-center mx-auto text-3xl">
                <FiCheckCircle />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-xl text-text-primary">
                  Briefing Received!
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Thank you for submitting your project parameters. A founding engineer will review your requirements and reach out within 12 hours.
                </p>
              </div>

              <button
                onClick={() => setIsSuccess(false)}
                className="w-full py-3 btn-neumorphic font-bold text-sm"
              >
                Close Window
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
