import React, { useState, createContext, useContext } from 'react';

export const AuthenticatedUserContext = createContext({});

export const useAuthenticatedUser = () => {
  const context = useContext(AuthenticatedUserContext);
  
  if (!context) {
    throw new Error('useAuthenticatedUser must be used within an AuthenticatedUserProvider');
  }
  
  return context;
};

export const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};
