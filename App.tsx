import React from 'react';
import { Sidebar } from './components/Sidebar';
import { CircuitCanvas } from './components/CircuitCanvas';
import { ThemeProvider, useTheme } from './components/ThemeContext';

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`${theme} h-screen w-screen overflow-hidden`}>
      <div className="flex h-full w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors duration-300">
        <Sidebar />
        <CircuitCanvas />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
