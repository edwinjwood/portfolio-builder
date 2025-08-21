import React, { useRef } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Home from '../components/Home';
import TenantAdminDashboard from '../components/TenantAdminDashboard';
import Login from '../components/Login';
import Signup from '../components/Signup';
import TemplateGallery from '../components/TemplateGallery';
import TemplateDemoShell from '../components/TemplateDemoShell';
import LandingCard from '../components/LandingCard';
import Resume from '../components/Resume';
import ProjectsSimple from '../components/ProjectsSimple';
import TemplatePreview from '../components/TemplatePreview';
import classic from '../templates/classic';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import Pricing from '../components/Pricing';
import Dashboard from '../components/Dashboard';
import AdminDashboard from '../components/AdminDashboard';

function Shell() {
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const firstRenderRef = useRef(true);

  const isPreview = location.pathname.startsWith('/preview/');
  const isDemo = location.pathname.startsWith('/demo/');

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-600 text-white px-3 py-2 rounded">Skip to content</a>
      {!isPreview && !isDemo && <NavBar />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={firstRenderRef.current ? false : { opacity: 0, y: prefersReduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReduced ? 0 : -6 }}
          transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
          className={(!isPreview && !isDemo) ? "flex-1 grid place-items-center" : "flex-1 w-full"}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/tenant-admin" element={<TenantAdminDashboard />} />
            <Route path="/portfolio-preview" element={<TemplateGallery />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pricing" element={<Pricing />} />
            {/* Standalone template preview route (unbranded) */}
            <Route path="/preview/:id" element={<TemplatePreview />} />
            {/* Full demo experience routes (unbranded, new-tab friendly) */}
            <Route path="/demo/:id" element={<TemplateDemoShell view="landing" />} />
            <Route path="/demo/:id/resume" element={<TemplateDemoShell view="resume" />} />
            <Route path="/demo/:id/projects" element={<TemplateDemoShell view="projects" />} />
            {/* Classic template preview routes */}
            <Route path="/virtual-bc" element={<LandingCard data={classic.defaults.landing} variant="classic" />} />
            <Route path="/resume" element={<Resume data={classic.defaults.resume} />} />
            <Route path="/projects" element={<ProjectsSimple data={classic.defaults.projects} />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!isPreview && !isDemo && <Footer />}
    </div>
  );
}

export default Shell;
