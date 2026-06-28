import React from 'react';
import { Link } from 'react-router-dom';
import { FiCode, FiGithub, FiTwitter, FiLinkedin, FiInstagram, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: FiGithub, href: 'https://github.com', label: 'GitHub' },
    { icon: FiTwitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: FiLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: FiInstagram, href: 'https://instagram.com', label: 'Instagram' }
  ];

  return (
    <footer className="relative bg-bg-light border-t border-gray-200/50 pt-16 pb-8 overflow-hidden z-10">
      {/* Soft background glow */}
      <div className="absolute bottom-[-10%] left-[40%] w-[300px] h-[300px] rounded-full bg-brand-purple/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand Block */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple to-brand-purple-light flex items-center justify-center text-white shadow-sm">
              <FiCode className="text-lg" />
            </div>
            <span className="font-heading font-extrabold text-lg tracking-tight text-text-primary">
              Lucuma <span className="text-brand-purple">Tech</span>
            </span>
          </Link>
          <p className="text-sm text-text-secondary leading-relaxed">
            Founded by student developers to build modern digital products. We deliver high-performance web apps, mobile apps, and custom business automations.
          </p>
          <div className="flex gap-3 pt-2">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-card-light shadow-neumorphic-flat flex items-center justify-center text-text-secondary hover:text-brand-purple hover:scale-105 border border-gray-100 transition-all focus:outline-none"
                aria-label={social.label}
              >
                <social.icon className="text-sm" />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Block */}
        <div>
          <h4 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider mb-5">
            Quick Links
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/" className="text-text-secondary hover:text-brand-purple transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/services" className="text-text-secondary hover:text-brand-purple transition-colors">
                Services
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-text-secondary hover:text-brand-purple transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-text-secondary hover:text-brand-purple transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Services Block */}
        <div>
          <h4 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider mb-5">
            Services
          </h4>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li>
              <Link to="/services?cat=web" className="hover:text-brand-purple transition-colors">
                Custom Web Dev
              </Link>
            </li>
            <li>
              <Link to="/services?cat=mobile" className="hover:text-brand-purple transition-colors">
                Mobile Android / iOS
              </Link>
            </li>
            <li>
              <Link to="/services?cat=backend" className="hover:text-brand-purple transition-colors">
                REST APIs & Databases
              </Link>
            </li>
            <li>
              <Link to="/services?cat=cloud" className="hover:text-brand-purple transition-colors">
                Cloud Servers & Devops
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info Block */}
        <div>
          <h4 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider mb-5">
            Connect
          </h4>
          <ul className="space-y-4 text-sm text-text-secondary">
            <li className="flex items-start gap-3">
              <FiMail className="mt-1 text-brand-purple text-base shrink-0" />
              <span>hello@lucumatech.com</span>
            </li>
            <li className="flex items-start gap-3">
              <FiPhone className="mt-1 text-brand-purple text-base shrink-0" />
              <span>+1 (555) 019-2831</span>
            </li>
            <li className="flex items-start gap-3">
              <FiMapPin className="mt-1 text-brand-purple text-base shrink-0" />
              <span>Remote / Silicon Valley, CA</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-200/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
        <p>© {currentYear} Lucuma Tech. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Made with <span className="text-red-500 animate-pulse">❤️</span> by Lucuma Tech
        </p>
      </div>
    </footer>
  );
}
