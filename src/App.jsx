import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import GetStarted from './pages/GetStarted';
import { FiCode } from 'react-icons/fi';

// Scroll resetting component on route navigation change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock pre-loader animation duration
    const preloaderTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(preloaderTimer);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="preloader"
            className="fixed inset-0 z-50 bg-bg-light flex flex-col items-center justify-center"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="relative flex flex-col items-center">
              {/* Spinning / floating loader logo */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-light flex items-center justify-center text-white text-3xl shadow-lg animate-float-medium">
                <FiCode />
              </div>
              
              <h2 className="font-heading font-extrabold text-2xl tracking-tight text-text-primary mt-6">
                Lucuma <span className="text-brand-purple">Tech</span>
              </h2>
              <p className="text-[10px] text-text-secondary font-mono tracking-[0.25em] mt-1.5 uppercase opacity-75">
                Developing Future Systems
              </p>
              
              {/* Smooth loading progress indicator */}
              <div className="w-44 h-1 bg-gray-200/60 rounded-full mt-8 overflow-hidden neumorphic-inset p-0">
                <motion.div
                  className="h-full bg-brand-purple rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.3, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col min-h-screen bg-bg-light"
          >
            <Navbar />
            
            {/* Page contents mount area */}
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/get-started" element={<GetStarted />} />
              </Routes>
            </main>
            
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;
