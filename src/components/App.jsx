import '../styles/App.css';
import { HashRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';

import Shell from '../layout/Shell';
import { AuthProvider } from '../features/user/context/AuthContext';
import { ThemeProvider } from '../features/auth/context/ThemeContext';


function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
