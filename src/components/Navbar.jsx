import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import logoUrl from '../assets/logo.png';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact Us', path: '/contact' }
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          scrolled
            ? 'py-3 shadow-glass-shadow glass-navbar'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none"
          >
            <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <img src={logoUrl} alt="Lucuma Innovations logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-heading font-extrabold text-base min-[400px]:text-lg sm:text-xl tracking-tight text-text-primary group-hover:text-brand-purple transition-colors duration-300">
              Lucuma <span className="text-brand-purple">Innovations</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 bg-bg-flat/40 p-1 rounded-full border border-gray-200/30">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `px-5 py-2 rounded-full font-heading text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-card-light text-brand-purple shadow-sm border border-gray-100'
                      : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/get-started"
              className="px-6 py-2.5 btn-neumorphic-primary text-sm font-semibold tracking-wide"
            >
              Get Started
            </Link>
          </div>

          {/* Hamburger Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full bg-card-light shadow-neumorphic-flat flex items-center justify-center text-text-primary hover:text-brand-purple transition-colors border border-gray-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 pt-24 pb-8 px-6 bg-bg-light/95 backdrop-blur-lg flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-4 mt-8 flex-grow">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `w-full py-4 text-center rounded-2xl font-heading text-lg font-bold border ${
                      isActive
                        ? 'bg-card-light text-brand-purple shadow-neumorphic-pressed border-gray-200/50'
                        : 'text-text-secondary border-transparent'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            <div className="mt-auto">
              <Link
                to="/get-started"
                className="block w-full py-4 text-center btn-neumorphic-primary text-base font-bold shadow-md"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}