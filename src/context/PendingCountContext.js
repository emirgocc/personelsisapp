import React, { createContext, useContext, useState } from 'react';

const PendingCountContext = createContext();

export const usePendingCount = () => {
  const context = useContext(PendingCountContext);
  if (!context) {
    throw new Error('usePendingCount must be used within a PendingCountProvider');
  }
  return context;
};

export const PendingCountProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = (newCount) => {
    setPendingCount(newCount);
  };

  return (
    <PendingCountContext.Provider value={{ pendingCount, updatePendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
};
