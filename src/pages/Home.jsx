import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import InteractiveLogo from '../components/InteractiveLogo';
import GradientBlobs from '../components/3d/GradientBlobs';
import StatCounter from '../components/StatCounter';
import InteractiveTimeline from '../components/InteractiveTimeline';
import SpotlightCard from '../components/SpotlightCard';
import BlurText from '../components/BlurText';
import { servicesData, whyChooseUsData, statsData, testimonialsData } from '../data/mockData';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const SPOTLIGHT_PINK   = 'rgba(233, 69, 245, 0.2)';
const SPOTLIGHT_PURPLE = 'rgba(139, 92, 246, 0.2)';
const SPOTLIGHT_DEEP   = 'rgba(109, 40, 217, 0.25)';

export default function Home() {
  return (
    <div className="overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <GradientBlobs />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">

          {/* Copy */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-brand-purple-muted text-brand-purple-accent px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-2 h-2 rounded-full bg-brand-purple-accent animate-pulse" />
              Available for New Projects
            </motion.div>

            <h1 className="font-heading font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6">
              <BlurText 
                text="Ideas deserve more than code. They deserve innovation."
                delay={150}
                animateBy="words"
                direction="top"
                className="justify-center lg:justify-start text-center lg:text-left"
              />
            </h1>

            <BlurText
              text="Lucuma Innovation is a full-stack development studio crafting premium web apps, mobile experiences, and cloud infrastructure for ambitious founders and growing businesses worldwide."
              delay={25}
              animateBy="words"
              direction="bottom"
              className="text-text-secondary text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10 justify-center lg:justify-start text-center lg:text-left"
            />

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link to="/get-started" className="btn-neumorphic-primary flex items-center gap-2 px-8 py-4 text-base">
                Start Your Project <FiArrowRight />
              </Link>
              <Link to="/services" className="btn-neumorphic flex items-center gap-2 px-8 py-4 text-base">
                View Services
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start mt-10 text-sm text-text-secondary">
              {['No upfront costs', 'Milestone-based payments', '30-day support guarantee'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <FiCheckCircle className="text-brand-purple-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 3D Cube */}
          <motion.div
            className="flex-shrink-0 lg:-mt-20"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            <InteractiveLogo />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {statsData.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08 }}
            >
              <SpotlightCard spotlightColor={SPOTLIGHT_PINK} className="text-center h-full">
                <StatCounter value={stat.value} suffix={stat.suffix} />
                <p className="text-text-secondary text-sm mt-2 font-medium">{stat.label}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SERVICES PREVIEW
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <GradientBlobs />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-brand-purple-accent bg-brand-purple-muted px-4 py-1.5 rounded-full mb-4">
              What We Do
            </span>
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-4">
              Services Built for Growth
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From idea to deployment — we cover every layer of the modern tech stack.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesData.slice(0, 6).map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <SpotlightCard spotlightColor={SPOTLIGHT_PURPLE} className="group h-full flex flex-col">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-brand-purple-accent mb-6 transition-all duration-300 group-hover:scale-110"
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-white mb-3 group-hover:text-brand-purple-accent transition-colors duration-300">
                      {service.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed mb-4 flex-1">
                      {service.description}
                    </p>
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1.5 text-brand-purple-accent text-sm font-semibold group/link"
                    >
                      Learn More <FiArrowRight className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-neumorphic inline-flex items-center gap-2 px-8 py-4">
              See All 12 Services <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-brand-purple-accent bg-brand-purple-muted px-4 py-1.5 rounded-full mb-4">
              Why Lucuma Innovations
            </span>
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-4">
              The Lucuma Difference
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Young, passionate, and technically elite. We bring a rare combination of speed and quality.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyChooseUsData.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <SpotlightCard spotlightColor={SPOTLIGHT_PINK} className="h-full">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-light flex items-center justify-center text-white mb-5 shadow-lg">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROCESS TIMELINE
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <GradientBlobs />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-brand-purple-accent bg-brand-purple-muted px-4 py-1.5 rounded-full mb-4">
              Our Process
            </span>
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-4">
              How We Work
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              A transparent, milestone-driven process from first call to live launch.
            </p>
          </motion.div>
          <InteractiveTimeline />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-brand-purple-accent bg-brand-purple-muted px-4 py-1.5 rounded-full mb-4">
              Client Stories
            </span>
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-4">
              What Our Clients Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonialsData.map((t, i) => (
              <motion.div
                key={t.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1 }}
              >
                <SpotlightCard spotlightColor={SPOTLIGHT_DEEP} className="h-full flex flex-col gap-5">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <span key={s} className="text-brand-purple-accent text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed flex-1 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{t.name}</p>
                      <p className="text-text-secondary text-xs">{t.role}</p>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <GradientBlobs />
        <motion.div
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <SpotlightCard spotlightColor={SPOTLIGHT_PINK}>
            <h2 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-6">
              Ready to Build Something{' '}
              <span className="text-brand-purple-accent">Extraordinary?</span>
            </h2>
            <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Tell us about your project and get a free consultation and detailed quote within 24 hours.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/get-started" className="btn-neumorphic-primary flex items-center gap-2 px-10 py-4 text-base">
                Get a Free Quote <FiArrowRight />
              </Link>
              <Link to="/contact" className="btn-neumorphic flex items-center gap-2 px-10 py-4 text-base">
                Contact Us
              </Link>
            </div>
          </SpotlightCard>
        </motion.div>
      </section>

    </div>
  );
}
