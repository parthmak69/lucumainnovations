import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiCheckCircle, FiAlertCircle, FiSend, FiMessageSquare, FiBriefcase, FiUsers, FiLifeBuoy, FiStar, FiMoreHorizontal, FiArrowRight } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';
import SpotlightCard from '../components/SpotlightCard';

const API_BASE_URL = "http://localhost:5000/api";

const subjectOptions = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'business', label: 'Business Inquiry' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'support', label: 'Technical Support' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' }
];

const subjectIcons = {
  general: <FiMessageSquare className="text-brand-purple-accent text-lg" />,
  business: <FiBriefcase className="text-brand-purple-accent text-lg" />,
  partnership: <FiUsers className="text-brand-purple-accent text-lg" />,
  support: <FiLifeBuoy className="text-brand-purple-accent text-lg" />,
  feedback: <FiStar className="text-brand-purple-accent text-lg" />,
  other: <FiMoreHorizontal className="text-brand-purple-accent text-lg" />
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verification States
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  // Validation
  const validateForm = () => {
    const tempErrors = {};

    if (!formData.name.trim()) {
      tempErrors.name = 'Please fill in all required fields';
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'Please fill in all required fields';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      tempErrors.message = 'Please fill in all required fields';
    } else if (formData.message.trim().length < 10) {
      tempErrors.message = 'Message should be at least 10 characters';
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
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Step 1: Dispatches the OTP to the provided address
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();

      if (res.ok) {
        setShowOtpField(true);
      } else {
        setErrors({ email: data.message || "Failed to deliver code." });
      }
    } catch (err) {
      setErrors({ email: "Cannot connect to server gateway." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Validates OTP and auto-submits form data
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrors({ otp: "Please input the verification code" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check code
      const verifyRes = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: otp })
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setErrors({ otp: verifyData.message || "Invalid authentication token." });
        setIsSubmitting(false);
        return;
      }

      // Persist to MongoDB & send twin notifications
      const contactRes = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          message: formData.message,
          formType: 'contact'
        })
      });

      if (contactRes.ok) {
        setIsSuccess(true);
        setShowOtpField(false);
        setOtp('');
        setFormData({
          name: '',
          email: '',
          subject: 'general',
          message: ''
        });
      } else {
        const contactData = await contactRes.json();
        setErrors({ otp: contactData.message || "Failed to commit record." });
      }
    } catch (err) {
      setErrors({ otp: "Final verification channel timeout." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 bg-bg-light overflow-hidden">
      <GradientBlobs />

      <section className="relative max-w-7xl mx-auto px-6 mb-16 text-center z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-purple-muted border border-brand-purple-light/20 text-brand-purple font-mono text-xs font-semibold tracking-wider">
            GET IN TOUCH
          </div>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-text-primary">
            Contact Us
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Have a question, partnership idea, or need support? This is the fastest way to reach us.
          </p>
        </div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-28 text-left">
            <div className="space-y-4">
              <h2 className="font-heading font-extrabold text-2xl text-text-primary">
                Reach Out
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Connect with our team directly. We review all messages and general inquiries in under 12 hours.
              </p>
            </div>

            <div className="space-y-5">
              <SpotlightCard spotlightColor="rgba(233, 69, 245, 0.15)" className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple-accent shrink-0">
                  <FiMail className="text-lg" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Send Email</h4>
                  <p className="text-xs text-text-secondary mt-1">info@lucumainnovations.com</p>
                </div>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.15)" className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple-accent shrink-0">
                  <FiPhone className="text-lg" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Call Founders</h4>
                  <p className="text-xs text-text-secondary mt-1">+91 99300 80190</p>
                  <p className="text-xs text-text-secondary mt-1.5">+91 77388 31706</p>
                  <p className="text-xs text-text-secondary mt-1">Mon - Fri: 10 AM - 9 PM IST</p>
                </div>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(233, 69, 245, 0.15)" className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple-accent shrink-0">
                  <FiMapPin className="text-lg" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Development Hub</h4>
                  <p className="text-xs text-text-secondary">Mumbai, Maharashtra</p>
                </div>
              </SpotlightCard>

              <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.25)" className="p-5 border border-brand-purple/10">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">Looking to start a project?</h4>
                    <p className="text-xs text-text-secondary mt-1">Use the Get Started flow for a guided onboarding experience.</p>
                  </div>
                  <Link
                    to="/get-started"
                    className="w-full py-2.5 btn-neumorphic-primary flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                  >
                    Start Your Project <FiArrowRight className="text-xs" />
                  </Link>
                </div>
              </SpotlightCard>
            </div>
          </div>

          <div className="lg:col-span-8">
            <SpotlightCard spotlightColor="rgba(124, 58, 237, 0.2)" className="p-6 md:p-10 relative overflow-hidden">
              <form onSubmit={showOtpField ? handleVerifyAndSubmit : handleRequestOtp} className="space-y-6 text-left">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      disabled={showOtpField}
                      autoFocus
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your Name"
                      className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${errors.name
                        ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                        : 'border-gray-800 focus:border-brand-purple-accent/50 bg-[#130b24]/40 focus:bg-[#130b24]/85 text-white placeholder:text-white/30'
                        }`}
                    />
                    {errors.name && (
                      <p role="alert" className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <FiAlertCircle /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                      Email Address*
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      disabled={showOtpField}
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="eg. you@example.com"
                      className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all ${errors.email
                        ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                        : 'border-gray-800 focus:border-brand-purple-accent/50 bg-[#130b24]/40 focus:bg-[#130b24]/85 text-white placeholder:text-white/30'
                        }`}
                    />
                    {errors.email && (
                      <p role="alert" className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <FiAlertCircle /> {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                    Subject*
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                      {subjectIcons[formData.subject]}
                    </div>
                    <select
                      id="subject"
                      name="subject"
                      disabled={showOtpField}
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-10 py-4 rounded-xl text-sm border border-gray-800 focus:border-brand-purple-accent/50 focus:outline-none bg-[#130b24]/40 focus:bg-[#130b24]/85 text-white appearance-none cursor-pointer"
                    >
                      {subjectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#130b24] text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-heading font-bold text-text-primary uppercase tracking-wider">
                    Message*
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    disabled={showOtpField}
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Type your message here..."
                    className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all resize-none ${errors.message
                      ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                      : 'border-gray-800 focus:border-brand-purple-accent/50 bg-[#130b24]/40 focus:bg-[#130b24]/85 text-white placeholder:text-white/30'
                      }`}
                  />
                  {errors.message && (
                    <p role="alert" className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                      <FiAlertCircle /> {errors.message}
                    </p>
                  )}
                </div>

                {/* Secure Verification Insertion Field */}
                {showOtpField && (
                  <div className="space-y-2 pt-2 border-t border-gray-800/60 dynamic-otp-container">
                    <label htmlFor="otp" className="text-xs font-heading font-bold text-brand-purple-accent uppercase tracking-wider">
                      Verify OTP Security Token*
                    </label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit verification code"
                      className={`w-full p-4 rounded-xl text-sm border focus:outline-none transition-all tracking-[4px] font-bold ${errors.otp
                        ? 'border-red-400 bg-red-50/10 focus:ring-1 focus:ring-red-400'
                        : 'border-brand-purple/40 focus:border-brand-purple-accent bg-[#130b24]/60 text-white placeholder:tracking-normal placeholder:font-normal placeholder:text-white/20'
                        }`}
                    />
                    {errors.otp && (
                      <p role="alert" className="text-xs text-red-500 flex items-center gap-1 mt-1 font-semibold">
                        <FiAlertCircle /> {errors.otp}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 btn-neumorphic-primary flex items-center justify-center gap-2 text-base font-bold shadow-lg disabled:opacity-75 focus:outline-none"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : showOtpField ? (
                      <>
                        <FiCheckCircle className="text-sm" /> Confirm & Submit Enquiry
                      </>
                    ) : (
                      <>
                        <FiSend className="text-sm" /> Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SpotlightCard>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
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
                  Message Sent
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Thank you for contacting Lucuma Innovations. Your message has been received and our team will respond shortly.
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