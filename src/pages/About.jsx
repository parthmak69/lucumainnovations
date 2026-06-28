import React from 'react';
import { motion } from 'framer-motion';
import { FiCode, FiCpu, FiAward, FiBookOpen, FiActivity, FiBriefcase } from 'react-icons/fi';
import GradientBlobs from '../components/3d/GradientBlobs';

const techStack = [
  { name: 'React', category: 'Frontend', level: 'Expert', color: 'bg-[#61DAFB]/10 text-[#61DAFB] border-[#61DAFB]/20' },
  { name: 'Vite', category: 'Build Tool', level: 'Expert', color: 'bg-[#646CFF]/10 text-[#646CFF] border-[#646CFF]/20' },
  { name: 'Node.js', category: 'Backend', level: 'Advanced', color: 'bg-[#339933]/10 text-[#339933] border-[#339933]/20' },
  { name: 'Express.js', category: 'Backend', level: 'Advanced', color: 'bg-[#000000]/10 text-text-primary border-gray-200/50' },
  { name: 'MongoDB', category: 'Database', level: 'Advanced', color: 'bg-[#47A248]/10 text-[#47A248] border-[#47A248]/20' },
  { name: 'Swift & SwiftUI', category: 'iOS Mobile', level: 'Advanced', color: 'bg-[#F05138]/10 text-[#F05138] border-[#F05138]/20' },
  { name: 'Kotlin', category: 'Android Mobile', level: 'Intermediate', color: 'bg-[#7F52FF]/10 text-[#7F52FF] border-[#7F52FF]/20' },
  { name: 'Tailwind CSS', category: 'Styling', level: 'Expert', color: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20' },
  { name: 'AWS & GCP', category: 'Cloud Infrastructure', level: 'Intermediate', color: 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20' },
  { name: 'Docker', category: 'DevOps', level: 'Intermediate', color: 'bg-[#2496ED]/10 text-[#2496ED] border-[#2496ED]/20' },
  { name: 'Figma', category: 'UI/UX Design', level: 'Advanced', color: 'bg-[#F24E1E]/10 text-[#F24E1E] border-[#F24E1E]/20' },
  { name: 'Git & Github', category: 'Version Control', level: 'Expert', color: 'bg-[#F05032]/10 text-[#F05032] border-[#F05032]/20' }
];

export default function About() {
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
    <div className="relative min-h-screen pt-28 pb-20 bg-bg-light overflow-hidden">
      <GradientBlobs />

      {/* ================= HERO TITLE ================= */}
      <section className="relative max-w-7xl mx-auto px-6 mb-16 text-center z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-purple-muted border border-brand-purple-light/20 text-brand-purple font-mono text-xs font-semibold tracking-wider">
            WHO WE ARE
          </div>
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-text-primary">
            Student Founders. <br />
            <span className="bg-gradient-to-r from-brand-purple via-brand-purple-light to-brand-purple-accent bg-clip-text text-transparent">
              Enterprise Grade Code.
            </span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Lucuma Tech was established with a singular focus: build robust software products while proving that passion, curiosity, and execution define capability far better than age.
          </p>
        </div>
      </section>

      {/* ================= FOUNDERS PROFILE STORY ================= */}
      <section className="relative max-w-5xl mx-auto px-6 mb-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center neumorphic-card p-8 md:p-12">
          {/* Decorative left graphical layout */}
          <div className="lg:col-span-5 relative flex justify-center items-center h-64 md:h-80 bg-gradient-to-br from-brand-purple/5 to-brand-purple-accent/5 rounded-2xl overflow-hidden border border-gray-100/60 shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(#6d28d9_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
            <div className="relative space-y-3 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-purple-muted border border-brand-purple/20 text-brand-purple flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <p className="font-heading font-bold text-sm tracking-widest text-brand-purple uppercase">FOUNDERS</p>
              <p className="text-xs text-text-secondary font-mono">ESTD. SILICON VALLEY, CA</p>
            </div>
          </div>

          {/* Story Context */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-text-primary leading-tight">
              Our Origin Story
            </h2>
            
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Founded by **two passionate 18-year-old student developers**, Lucuma Tech started as a collaborative coding lab. We spent our school terms building complex open-source modules, debugging servers, and developing custom templates. We soon realized that businesses were looking for exactly what we loved doing: fast, responsive, and cleanly engineered solutions.
            </p>

            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Our youth represents our greatest strength: we are native to the modern web, unimpeded by outdated legacy structures, and possess an relentless appetite for technical innovation. We treat code as craftsmanship. Every database index is deliberate; every component is structured for reusability.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <h4 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
                  <FiCpu className="text-brand-purple shrink-0" />
                  Agile Frameworks
                </h4>
                <p className="text-xs text-text-secondary mt-1">Clean react modules, styled Tailwind pages, and lightweight servers.</p>
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-text-primary flex items-center gap-2">
                  <FiCode className="text-brand-purple shrink-0" />
                  24/7 Deployment
                </h4>
                <p className="text-xs text-text-secondary mt-1">Dedicated Git versioning workflows, CI/CD pipes, and automated cloud checks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE VALUES GRID ================= */}
      <section className="relative max-w-7xl mx-auto px-6 mb-24 z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-heading font-extrabold text-3xl text-text-primary">
            Mission, Vision & Values
          </h2>
          <p className="text-text-secondary text-base">
            The principles that guide our development cycles and long-term client engagements.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Mission Card */}
          <motion.div variants={itemVariants} className="neumorphic-card p-8 text-left hover:border-brand-purple/10">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple-muted flex items-center justify-center text-brand-purple mb-6">
              <FiAward className="text-2xl" />
            </div>
            <h3 className="font-heading font-bold text-lg md:text-xl text-text-primary mb-3">Our Mission</h3>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              To deliver premium-tier web, mobile, and server infrastructure solutions that optimize processes, empower developers, and accelerate business growth.
            </p>
          </motion.div>

          {/* Vision Card */}
          <motion.div variants={itemVariants} className="neumorphic-card p-8 text-left hover:border-brand-purple/10">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple-muted flex items-center justify-center text-brand-purple mb-6">
              <FiBookOpen className="text-2xl" />
            </div>
            <h3 className="font-heading font-bold text-lg md:text-xl text-text-primary mb-3">Our Vision</h3>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              To build a global developer agency led by fresh, motivated engineering talent, establishing that rigorous standards and curiosity dictate software success.
            </p>
          </motion.div>

          {/* Values Card */}
          <motion.div variants={itemVariants} className="neumorphic-card p-8 text-left hover:border-brand-purple/10">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple-muted flex items-center justify-center text-brand-purple mb-6">
              <FiActivity className="text-2xl" />
            </div>
            <h3 className="font-heading font-bold text-lg md:text-xl text-text-primary mb-3">Our Values</h3>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Craftsmanship first. Complete transparency in timeline estimations. Dedicated security measures. An endless commitment to learning.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ================= TECH STACK / SKILLS VISUALIZER ================= */}
      <section className="relative max-w-6xl mx-auto px-6 z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple-muted text-brand-purple font-mono text-xs font-bold tracking-wider">
            <FiBriefcase /> TECH STACK EXPERTISE
          </div>
          <h2 className="font-heading font-extrabold text-3xl text-text-primary">
            Technologies We Master
          </h2>
          <p className="text-text-secondary text-base">
            We work with the most efficient language standards and cloud architectures.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {techStack.map((tech) => (
            <motion.div
              variants={itemVariants}
              key={tech.name}
              className={`p-4 rounded-xl border flex flex-col items-start text-left bg-card-light shadow-sm transition-all hover:scale-105 ${tech.color}`}
            >
              <span className="font-bold text-sm sm:text-base text-text-primary">{tech.name}</span>
              <div className="flex items-center justify-between w-full mt-2 text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                <span>{tech.category}</span>
                <span className="font-bold text-brand-purple">{tech.level}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
