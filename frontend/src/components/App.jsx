import '../styles/App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import React from 'react';

import Shell from '../layout/Shell';
import { AuthProvider } from '../features/user/context/AuthContext';
import { ThemeProvider } from '../features/auth/context/ThemeContext';
import { TenantProvider } from '../contexts/TenantContext';


function App() {
  // Remove global scroll lock; let each page/component control its own scrolling

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <Shell />
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
