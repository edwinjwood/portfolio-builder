import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import HomeCard from '../components/HomeCard';
import Projects from '../components/Projects';
import Resume from '../components/Resume';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';

function Shell() {
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const firstRenderRef = useRef(true);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('dark') === 'true'; } catch(e) { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [dark]);
  useEffect(() => { firstRenderRef.current = false; }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-600 text-white px-3 py-2 rounded">Skip to content</a>
      <NavBar dark={dark} setDark={setDark} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={firstRenderRef.current ? false : { opacity: 0, y: prefersReduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReduced ? 0 : -6 }}
          transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
          className="flex-1 grid place-items-center"
        >
          <Routes location={location}>
            <Route path="/" element={<HomeCard />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default Shell;
