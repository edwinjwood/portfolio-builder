import '../styles/App.css';
import { HashRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import headshotUrl from '../assets/Headshot.png';

import Shell from '../layout/Shell';


function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;
