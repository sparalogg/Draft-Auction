
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useDraft } from '../../context/DraftContext';

const SettingsModal = ({ show, onHide }) => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, changeLanguage } = useSettings();
  const draftContext = useDraft();

  // Stato per i valori del form
  const [formValues, setFormValues] = useState({
    timePerPick: settings.timePerPick || 30,
    timePerBan: settings.timePerBan || 20,
    numberOfBans: settings.numberOfBans || 2,
    mirrorPicks: settings.mirrorPicks || false,
    teamBonusTime: settings.teamBonusTime || 0,
    coinFlipEnabled: settings.coinFlipEnabled || false,
    language: settings.language || 'en'
  });

  // Stato per i codici di accesso
  const [accessCodes, setAccessCodes] = useState({
    draftCode: '',
    adminCode: '',
    blueCode: '',
    redCode: ''
  });

  // Carica i codici di accesso quando il modal è aperto
  useEffect(() => {
    if (show) {
      const currentDraftId = draftContext.state.draftId;
      
      setAccessCodes({
        draftCode: currentDraftId || 'N/A',
        adminCode: draftContext.state.accessCodes?.admin || 'N/A',
        blueCode: draftContext.state.accessCodes?.blue || 'N/A',
        redCode: draftContext.state.accessCodes?.red || 'N/A'
      });
    }
  }, [show, draftContext.state]);

  // Gestore dei cambiamenti degli input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestore del cambio lingua
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setFormValues(prev => ({
      ...prev,
      language: newLanguage
    }));
    
    i18n.changeLanguage(newLanguage);
  };

  // Gestore del salvataggio delle impostazioni
  const handleSaveSettings = () => {
    const newSettings = {
      timePerPick: Math.min(Math.max(parseInt(formValues.timePerPick) || 30, 5), 120),
      timePerBan: Math.min(Math.max(parseInt(formValues.timePerBan) || 20, 5), 60),
      numberOfBans: parseInt(formValues.numberOfBans),
      mirrorPicks: formValues.mirrorPicks,
      teamBonusTime: Math.min(Math.max(parseInt(formValues.teamBonusTime) || 0, 0), 300),
      coinFlipEnabled: formValues.coinFlipEnabled,
      language: formValues.language
    };
    
    // Funzione per copiare negli appunti
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert("Codice copiato!");
        })
        .catch(err => {
          console.error('Errore durante la copia:', err);
        });
    };

    // Update global settings
    updateSettings(newSettings);
    
    // Update draft context settings
    draftContext.updateDraftSettings(newSettings);
    
    // Update language
    changeLanguage(formValues.language);
    
    // Close modal
    onHide();
  };

  // Se il modal non è mostrato, non renderizzare nulla
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} id="settingsModal" tabIndex="-1" aria-labelledby="settingsModalLabel">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="settingsModalLabel">{t('settings.title')}</h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {/* Codici di Accesso */}
            <div className="access-codes-section mb-4">
              <h6>Codici di Accesso</h6>
              
              <div className="access-code-item">
                <label>Codice Draft:</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={accessCodes.draftCode} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => navigator.clipboard.writeText(accessCodes.draftCode)}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              
              <div className="access-code-item">
                <label>Codice Admin:</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={accessCodes.adminCode} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => navigator.clipboard.writeText(accessCodes.adminCode)}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              
              <div className="access-code-item">
                <label>Codice Blue Team:</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={accessCodes.blueCode} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => navigator.clipboard.writeText(accessCodes.blueCode)}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              
              <div className="access-code-item">
                <label>Codice Red Team:</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={accessCodes.redCode} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => navigator.clipboard.writeText(accessCodes.redCode)}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
            {/* Time per pick */}
            <div className="mb-3">
              <label htmlFor="timePerPick" className="form-label">{t('settings.timePerPick')}</label>
              <input
                type="number"
                className="form-control"
                id="timePerPick"
                name="timePerPick"
                value={formValues.timePerPick}
                onChange={handleInputChange}
                min="5"
                max="120"
              />
            </div>
            
            {/* Time per ban */}
            <div className="mb-3">
              <label htmlFor="timePerBan" className="form-label">{t('settings.timePerBan')}</label>
              <input
                type="number"
                className="form-control"
                id="timePerBan"
                name="timePerBan"
                value={formValues.timePerBan}
                onChange={handleInputChange}
                min="5"
                max="60"
              />
            </div>
            
            {/* Number of bans */}
            <div className="mb-3">
              <label htmlFor="numberOfBans" className="form-label">{t('settings.numberOfBans')}</label>
              <select
                className="form-select"
                id="numberOfBans"
                name="numberOfBans"
                value={formValues.numberOfBans}
                onChange={handleInputChange}
              >
                <option value="1">1 ban</option>
                <option value="2">2 bans</option>
                <option value="3">3 bans</option>
                <option value="4">4 bans</option>
              </select>
            </div>

            {/* Coin flip */}
            <div className="mb-3">
              <label className="form-label">Lancio Moneta</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="coinFlipToggle"
                  name="coinFlipEnabled"
                  checked={formValues.coinFlipEnabled}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="coinFlipToggle">
                  Abilita lancio moneta all'inizio del draft
                </label>
              </div>
            </div>
            
            {/* Mirror picks */}
            <div className="mb-3">
              <label className="form-label">{t('settings.mirrorPicks')}</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="mirrorPicksToggle"
                  name="mirrorPicks"
                  checked={formValues.mirrorPicks}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="mirrorPicksToggle">
                  {t('settings.mirrorPicksDesc')}
                </label>
              </div>
            </div>
            
            {/* Team Bonus Time */}
            <div className="mb-3">
              <label htmlFor="teamBonusTime" className="form-label">
                {t('settings.teamBonusTime', 'Tempo Bonus per Squadra (secondi)')}
              </label>
              <input
                type="number"
                className="form-control"
                id="teamBonusTime"
                name="teamBonusTime"
                value={formValues.teamBonusTime}
                onChange={handleInputChange}
                min="0"
                max="300"
              />
            </div>
            
            {/* Language */}
            <div className="mb-3">
              <label htmlFor="language" className="form-label">Language / Lingua</label>
              <select
                className="form-select"
                id="language"
                name="language"
                value={formValues.language}
                onChange={handleLanguageChange}
              >
                <option value="en">English</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onHide}
            >
              {t('settings.close')}
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSaveSettings}
            >
              {t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;