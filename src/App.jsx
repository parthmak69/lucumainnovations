import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingLines from './components/FloatingLines';
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
    const preloaderTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(preloaderTimer);
  }, []);

  return (
    <Router>
      <ScrollToTop />

      {/* ── Fixed WebGL Background (behind everything) ── */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive
          parallax={true}
          animationSpeed={1}
          linesGradient={['#e945f5', '#6f6f6f', '#6a6a6a']}
          mixBlendMode="normal"
        />
        {/* Dark overlay to reduce background glare and increase text contrast */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'rgba(8, 2, 16, 0.72)' }} 
        />
      </div>

      {/* ── App content ── */}
      <div className="relative" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="preloader"
              className="fixed inset-0 z-50 flex flex-col items-center justify-center"
              style={{ background: 'rgba(8, 1, 18, 0.95)' }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-light flex items-center justify-center text-white text-3xl shadow-lg animate-float-medium">
                  <FiCode />
                </div>
                <h2 className="font-heading font-extrabold text-2xl tracking-tight text-white mt-6">
                  Lucuma <span className="text-brand-purple-accent">Innovations</span>
                </h2>
                <p className="text-[10px] text-white/50 font-mono tracking-[0.25em] mt-1.5 uppercase">
                  Developing Future Systems
                </p>
                <div className="w-44 h-1 rounded-full mt-8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
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
              className="flex flex-col min-h-screen"
            >
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/"            element={<Home />} />
                  <Route path="/services"    element={<Services />} />
                  <Route path="/about"       element={<About />} />
                  <Route path="/contact"     element={<Contact />} />
                  <Route path="/get-started" element={<GetStarted />} />
                </Routes>
              </main>
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
