import React from 'react';
import { useDraft } from '../../context/DraftContext';

const BonusTimeDisplay = () => {
  const { state } = useDraft();
  
  const blueBonusTime = state.teamBonusTime?.blue || 0;
  const redBonusTime = state.teamBonusTime?.red || 0;

  return (
    <div className="team-bonus-container">
      <div className="team-bonus blue-bonus">
        <span className="bonus-label">Bonus blue:</span>
        <span className="bonus-time">{blueBonusTime} secondi</span>
      </div>
      <div className="team-bonus red-bonus">
        <span className="bonus-label">Bonus red:</span>
        <span className="bonus-time">{redBonusTime} secondi</span>
      </div>
    </div>
  );
};

export default BonusTimeDisplay;