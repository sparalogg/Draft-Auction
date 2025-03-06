import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../../context/DraftContext';
import { useTimer } from '../../hooks/useTimer';

const Timer = () => {
  const { t } = useTranslation();
  const { state } = useDraft();
  const { currentTimer } = useTimer();
  
  const getTimerClasses = () => {
    const baseClass = 'timer-header';
    
    if (currentTimer <= 5) {
      return `${baseClass} danger`;
    } else if (currentTimer <= 10) {
      return `${baseClass} warning`;
    }
    
    return baseClass;
  };
  
  // Determina il tipo di fase corrente (pick o ban)
  const getCurrentPhaseType = () => {
    if (state.currentPhase === 'notStarted') return 'waiting';
    if (state.currentPhase === 'completed') return 'completed';
    
    return state.draftSequence[state.currentStepIndex]?.type || 'unknown';
  };

  const phaseType = getCurrentPhaseType();
  
  return (
    <div id="timer" className={getTimerClasses()}>
      <div className="timer-content">
        <i className="fa-solid fa-clock me-2"></i>
        {phaseType === 'ban' ? (
          <span>Ban: {t('draft.timer', { seconds: currentTimer })}</span>
        ) : phaseType === 'pick' ? (
          <span>Pick: {t('draft.timer', { seconds: currentTimer })}</span>
        ) : (
          <span>{t(`draft.phase.${phaseType}`)}</span>
        )}
      </div>
    </div>
  );
};

export default Timer;