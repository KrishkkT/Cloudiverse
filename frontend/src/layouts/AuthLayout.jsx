import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-void">
      {children}
    </div>
  );
};

export default AuthLayout;