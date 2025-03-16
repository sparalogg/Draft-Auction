import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';

const Instructions = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  
  // Funzione di fallback per gestire casi inattesi
  const getSafeSteps = (key) => {
    try {
      const steps = t(key, { returnObjects: true });
      return Array.isArray(steps) ? steps : 
             typeof steps === 'string' ? [steps] : [];
    } catch (error) {
      console.error('Errore nel recuperare i passaggi:', error);
      return [];
    }
  };
  
  // Funzione per gestire in modo sicuro l'array di traduzioni
  const getSteps = (key) => {
    try {
      const steps = t(key, { returnObjects: true });
      return Array.isArray(steps) ? steps : [];
    } catch (error) {
      console.error('Errore nel recuperare i passaggi:', error);
      return [];
    }
  };
  
  return (
    <div className="instructions-container bg-dark bg-opacity-70 p-4 mt-4 rounded-3">
      <h4 className="text-warning text-center mb-3">{t('instruction.title')}</h4>
      
      <div className="row">
        {/* Draft sequence based on number of bans */}
        <div className="col-md-3">
          <h5 className="text-primary">
            {t(`instruction.draftSequence.${settings.numberOfBans}ban.title`)}
          </h5>
          <ol className="text-light">
            {getSteps(`instruction.draftSequence.${settings.numberOfBans}ban.steps`).map((step, index) => (
              <li key={index}><strong>{step}</strong></li>
            ))}
          </ol>
        </div>
        
        {/* Multiple sequences for other ban options */}
        {settings.numberOfBans !== 1 && (
          <div className="col-md-3">
            <h5 className="text-primary">
              {t('instruction.draftSequence.1ban.title')}
            </h5>
            <ol className="text-light">
              {getSteps('instruction.draftSequence.1ban.steps').map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        
        {settings.numberOfBans !== 2 && settings.numberOfBans !== 1 && (
          <div className="col-md-3">
            <h5 className="text-primary">
              {t('instruction.draftSequence.2ban.title')}
            </h5>
            <ol className="text-light">
              {getSteps('instruction.draftSequence.2ban.steps').map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        
        {settings.numberOfBans !== 3 && settings.numberOfBans !== 1 && (
          <div className="col-md-3">
            <h5 className="text-primary">
              {t('instruction.draftSequence.3ban.title')}
            </h5>
            <ol className="text-light">
              {getSteps('instruction.draftSequence.3ban.steps').map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}
        
        {/* Special features */}
        <div className="col-md-3">
          <h5 className="text-primary">{t('instruction.specialFeatures.title')}</h5>
          <ul className="text-light">
            {t('instruction.specialFeatures.features', { returnObjects: true }).map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-light text-center mt-3">
        {t('instruction.footer')} <i className="fa-solid fa-copyright"></i>
      </div>
    </div>
  );
};

export default Instructions;