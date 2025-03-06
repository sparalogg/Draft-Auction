import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../../context/DraftContext';
import { useChampions } from '../../hooks/useChampions';

/**
 * BanSlot component for displaying a team's ban slot
 */
const BanSlot = ({ team, slotNumber }) => {
  const { t } = useTranslation();
  const { state } = useDraft();
  const { champions } = useChampions();
  
  // Create the slot ID matching the format used in the draft sequence
  const slotId = `${team}Ban${slotNumber}`;
  
  // Verifica se questo slot è specificato nel currentStep o additionalSlots
  const currentStep = state.draftSequence[state.currentStepIndex] || {};
  const isActiveSlot = state.currentPhase !== 'notStarted' && 
                      state.currentPhase !== 'completed' && 
                      state.currentTeam === team &&
                      (currentStep.slot === slotId || 
                      (currentStep.additionalSlots && currentStep.additionalSlots.includes(slotId)));
  
  // Otteniamo l'ID del campione bannato per questo slot
  const championId = state.slotSelections && state.slotSelections[slotId];
  const isBanned = !!championId;
  
  // Ottiene il campione dal suo ID
  const getChampionById = (championId) => {
    return champions.find(champ => champ.id.toString() === championId.toString());
  };
  
  // Ottiene le informazioni del campione bannato
  let championInfo = null;
  if (isBanned && championId) {
    const champion = getChampionById(championId);
    if (champion) {
      championInfo = {
        id: champion.id,
        name: champion.name,
        image: champion.image
      };
    }
  }
  
  // Fix the image path
  const getImagePath = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  };
  
// CSS classes
const slotClasses = [
  'ban-slot',
  isActiveSlot ? 'active' : '',
  isBanned ? 'banned' : ''
].filter(Boolean).join(' ');

return (
  <div 
    id={slotId}
    className={slotClasses}
  >
    {isBanned && championInfo ? (
      <>
        {championInfo.image ? (
          <img src={getImagePath(championInfo.image)} alt={championInfo.name} />
        ) : (
          <i className="fa-solid fa-user-ninja"></i>
        )}
        <div className="ban-name">{championInfo.name}</div>
      </>
    ) : (
      <>
        <i className="fa-solid fa-user-ninja"></i>
        <span>Slot Ban</span>
      </>
    )}
  </div>
);
};

export default BanSlot;