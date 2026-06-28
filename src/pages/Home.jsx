import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { servicesData, whyChooseUsData, clientsData, statsData, testimonialsData } from '../data/mockData';
import IsometricCube from '../components/3d/IsometricCube';
import GradientBlobs from '../components/3d/GradientBlobs';
import StatCounter from '../components/StatCounter';
import InteractiveTimeline from '../components/InteractiveTimeline';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="relative min-h-screen pt-24 overflow-hidden bg-bg-light">
      {/* Background blobs for premium depth */}
      <GradientBlobs />

      {/* ================= HERO SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <motion.div
          className="lg:col-span-7 space-y-6 text-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple-muted border border-brand-purple-light/20 text-brand-purple font-mono text-xs font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
            INNOVATING DIGITAL HORIZONS
          </div>
          
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-[1.1] tracking-tight">
            We Build Digital <br />
            <span className="bg-gradient-to-r from-brand-purple via-brand-purple-light to-brand-purple-accent bg-clip-text text-transparent">
              Experiences
            </span> That <br />
            Grow Businesses.
          </h1>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl">
            Lucuma Tech is a cutting-edge software company specializing in custom web platforms, native mobile applications, and intelligent business automation systems.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link
              to="/get-started"
              className="px-8 py-4 text-center btn-neumorphic-primary text-base font-bold shadow-lg"
            >
              Start Your Project
            </Link>
            <Link
              to="/services"
              className="px-8 py-4 text-center btn-neumorphic text-base font-semibold border border-gray-200/50"
            >
              View Services
            </Link>
          </div>
        </motion.div>

        {/* 3D Cube Canvas Wrapper */}
        <motion.div
          className="lg:col-span-5 flex justify-center items-center relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-full flex justify-center py-6">
            <IsometricCube />
          </div>
        </motion.div>
      </section>

      {/* ================= CLIENTS LOGOS SECTION ================= */}
      <section className="relative py-10 bg-bg-flat/30 border-y border-gray-200/40 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-heading font-semibold text-center text-text-secondary uppercase tracking-[0.25em] mb-8">
            TRUSTED BY FORWARD-THINKING BRANDS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-75">
            {clientsData.map((client) => (
              <div
                key={client.name}
                className="group flex flex-col items-center select-none"
              >
                <span className="font-heading font-bold text-lg md:text-xl text-text-secondary grayscale group-hover:grayscale-0 group-hover:text-brand-purple group-hover:scale-105 transition-all duration-300">
                  {client.logoText}
                </span>
                <span className="text-[10px] text-text-secondary uppercase tracking-[0.1em] mt-0.5 opacity-60">
                  {client.industry}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
            Our Core Services
          </h2>
          <p className="text-text-secondary text-base">
            We deliver state-of-the-art solutions tailored to elevate your operational flow and increase user retention.
          </p>
        </div>

        {/* Feature Cards (Show 6 primary) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {servicesData.slice(0, 6).map((service) => {
            const IconComponent = service.icon;
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                className="neumorphic-card p-8 flex flex-col text-left group hover:border-brand-purple/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-bg-light shadow-neumorphic-flat border border-gray-100 flex items-center justify-center text-brand-purple mb-6 group-hover:scale-110 group-hover:bg-brand-purple group-hover:text-white transition-all duration-300">
                  <IconComponent className="text-xl" />
                </div>
                <h3 className="font-heading font-bold text-lg md:text-xl text-text-primary mb-3">
                  {service.title}
                </h3>
                <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-6 flex-grow">
                  {service.description}
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple group/link hover:text-brand-purple-light transition-colors"
                >
                  Learn More <FiArrowRight className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 z-10 border-t border-gray-200/20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
            Engineered For Excellence
          </h2>
          <p className="text-text-secondary text-base">
            Why companies partner with Lucuma Tech to engineer their mission-critical applications.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {whyChooseUsData.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-6 text-left neumorphic-card group border border-transparent hover:border-brand-purple/10"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-purple-muted flex items-center justify-center text-brand-purple font-bold">
                    <IconComponent className="text-lg" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-heading font-bold text-base text-text-primary">
                      {item.title}
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ================= PROCESS SECTION ================= */}
      <section className="relative py-20 bg-bg-flat/25 border-y border-gray-200/30 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
              Our Development Process
            </h2>
            <p className="text-text-secondary text-base">
              A structured, transparent roadmap from initial concept to launch day and beyond.
            </p>
          </div>
          <InteractiveTimeline />
        </div>
      </section>

      {/* ================= STATS COUNTER SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, idx) => (
            <div key={idx} className="p-8 neumorphic-card text-center flex flex-col justify-center items-center space-y-3">
              <StatCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-sm font-semibold text-text-secondary tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONIALS SECTION ================= */}
      <section className="relative py-20 bg-bg-flat/20 border-t border-gray-200/20 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
              What Our Partners Say
            </h2>
            <p className="text-text-secondary text-base">
              Real feedback from companies that scaled their products with Lucuma Tech.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonialsData.map((test) => (
              <div key={test.id} className="p-8 neumorphic-card text-left flex flex-col justify-between group hover:border-brand-purple/10">
                <div className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-1 text-yellow-500">
                    {[...Array(test.rating)].map((_, i) => (
                      <span key={i} className="text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-text-secondary text-sm md:text-base italic leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-8 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${test.avatarColor} flex items-center justify-center text-white font-bold font-heading text-sm`}>
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-text-primary">
                      {test.name}
                    </h4>
                    <p className="text-xs text-text-secondary">
                      {test.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ABOUT TEASER SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-left">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary">
            Student Founders. Professional Standards.
          </h2>
          <p className="text-text-secondary text-base leading-relaxed">
            Lucuma Tech was founded by two passionate 18-year-old student developers with an ambitious vision: proving that age does not limit engineering excellence.
          </p>
          <p className="text-text-secondary text-base leading-relaxed">
            By combining deep curiosity with robust system design standards, we craft digital platforms that feel premium, perform at speed, and stand the test of traffic.
          </p>
          <div>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3 btn-neumorphic font-semibold text-sm"
            >
              Read Our Story <FiArrowRight />
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center items-center h-80 neumorphic-card p-8 bg-gradient-to-br from-brand-purple/5 to-transparent overflow-hidden border-gray-100">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
          
          <div className="space-y-4 z-10 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-purple-muted text-brand-purple flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="text-3xl" />
            </div>
            <h4 className="font-heading font-extrabold text-xl text-text-primary">
              Fresh Ideas. Modern Tech Stack.
            </h4>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              We leverage modern practices in CSS 3D, responsive designs, database orchestration, and cloud VPS architectures.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-6 py-16 mb-20 z-10">
        <div className="p-8 md:p-12 lg:p-16 rounded-[32px] neumorphic-card bg-gradient-to-br from-white to-brand-purple-muted text-center space-y-6 relative overflow-hidden border-brand-purple/10">
          <div className="absolute top-[-50%] right-[-10%] w-[350px] h-[350px] rounded-full bg-brand-purple/5 blur-3xl pointer-events-none" />

          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight">
            Ready to Build Your Next Idea?
          </h2>
          <p className="text-text-secondary text-base max-w-xl mx-auto leading-relaxed">
            Estimate your pricing configuration immediately using our interactive project calculator or schedule a strategic briefing session.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              to="/get-started"
              className="px-8 py-4 btn-neumorphic-primary text-base font-bold shadow-lg w-full sm:w-auto"
            >
              Start Estimator Tool
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 btn-neumorphic text-base font-semibold w-full sm:w-auto border-gray-200/50"
            >
              Contact Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
