import React from 'react';
import { useTranslation } from 'react-i18next';
import PickSlot from './PickSlot';
import BanContainer from './BanContainer';
import { useDraft } from '../../context/DraftContext';

/**
 * TeamPanel component for displaying a team's selections
 */
const TeamPanel = ({ team }) => {
  const { t } = useTranslation();
  const { state } = useDraft();
  
  // Is the current step for this team?
  const isActiveTeam = state.currentPhase !== 'notStarted' && 
                       state.currentPhase !== 'completed' && 
                       state.currentTeam === team;
  
  return (
    <div className={`team-panel ${team}-panel`}>
      {/* Player slots */}
      {[1, 2, 3, 4, 5].map(slotNumber => (
        <PickSlot 
          key={slotNumber}
          team={team}
          slotNumber={slotNumber}
          isActive={isActiveTeam && state.currentStepIndex < state.draftSequence.length && 
                   state.draftSequence[state.currentStepIndex].slot === `${team}Player${slotNumber}`}
        />
      ))}
      
      {/* Ban slots */}
      <BanContainer team={team} numberOfBans={parseInt(state.settings?.numberOfBans || 2)} />
    </div>
  );
};

export default TeamPanel;