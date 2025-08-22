import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';


function ProtectedRoute({ children, roles }) {
  const { currentUser, validateToken } = useAuth();
  const [checking, setChecking] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  useEffect(() => {
    async function check() {
      await validateToken();
      setChecking(false);
    }
    check();
  }, []);
  if (checking) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) {
    setUnauthorized(true);
    return <div className="text-center mt-8 text-red-600">Unauthorized: You do not have access to this page.</div>;
  }
  return children;
}

export default ProtectedRoute;
