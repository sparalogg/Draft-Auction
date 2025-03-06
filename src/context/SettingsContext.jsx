import React, { createContext, useContext, useState } from 'react';

// Default settings (same as your original config)
const defaultSettings = {
  timePerPick: 30, // seconds
  timePerBan: 20,  // seconds
  numberOfBans: 2,  // 1, 2, 3, or 4
  mirrorPicks: false, // Allow same champion to be picked by both teams
  language: 'en', // Default language
  teamBonusTime: 20,
  coinFlipEnabled: true 
};

// Create context
const SettingsContext = createContext();

// Provider component
export function SettingsProvider({ children, initialSettings = {} }) {
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...initialSettings
  });

  // Function to update settings
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Function to update language
  const changeLanguage = (language) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      language
    }));
  };

  // Creiamo un oggetto con lo state e le funzioni per modificarlo
  const value = {
    settings,
    updateSettings,
    changeLanguage
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook for using the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}