import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../../context/DraftContext';

const TeamHeader = ({ team, readOnly = false }) => {
  const { t } = useTranslation();
  const { state, updateTeamName } = useDraft();
  
  const [isEditing, setIsEditing] = useState(false);
  const [teamName, setTeamName] = useState(state.teamNames?.[team] || t(`teams.${team}`));
  
  const bonusTime = state.teamBonusTime?.[team] || 0;
  
  // Determina se questo è il team attuale
  const isCurrentTeam = state.currentTeam === team;

  const handleDoubleClick = () => {
    if (!readOnly) {
      setIsEditing(true);
    }
  };
  
  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      if (teamName !== (state.teamNames?.[team] || t(`teams.${team}`))) {
        updateTeamName(team, teamName);
      }
    }
  };
  
  const handleChange = (e) => {
    setTeamName(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };
  
  // Componente per il tempo bonus
  const BonusTimeIndicator = () => {
    if (bonusTime <= 0) return null;
    
    return (
      <span 
        className={`bonus-time-indicator ${team}-bonus-time`}
        title={`Tempo bonus rimanente: ${bonusTime} secondi`}
      >
        <i className="fas fa-clock"></i>
        <small>{bonusTime}s</small>
      </span>
    );
  };

  // Badge del turno corrente
  const CurrentTurnBadge = () => {
    if (!isCurrentTeam) return null;
    
    return (
      <span className="current-turn-badge">
        <i className="fas fa-chess-knight"></i>
      </span>
    );
  };
  
  if (readOnly || !isEditing) {
    return (
      <div 
        className={`team-header ${team}-header`}
        onDoubleClick={handleDoubleClick}
        title={readOnly ? "" : "Doppio click per modificare"}
      >
        <CurrentTurnBadge />
        {teamName}
        <BonusTimeIndicator />
      </div>
    );
  }
  
  return (
    <input
      type="text"
      className={`team-header ${team}-header team-name-input`}
      value={teamName}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      maxLength={20}
    />
  );
};

export default TeamHeader;