import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../../context/DraftContext';

const ChampionCard = ({ champion, canSelect = true, spectatorMode = false }) => {
  const { t } = useTranslation();
  const { 
    state, 
    selectChampion, 
    isChampionSelectable, 
    isChampionSelectedInCurrentStep 
  } = useDraft();
  
  const { id, name, image, isReusable } = champion;
  
  // Determina se l'utente è in modalità spettatore
  const isSpectator = state.userTeam === 'spectator';
  
  // Determina se il campione è selezionabile
  const selectable = isChampionSelectable(id, isReusable);
  
  // Determina se il campione è attualmente selezionato
  const isSelected = isChampionSelectedInCurrentStep(id);
  
  // È il draft attualmente attivo?
  const isDraftActive = state.currentPhase !== 'notStarted' && 
                        state.currentPhase !== 'completed' && 
                        !state.isPaused;
  
  // L'utente può selezionare campioni
  const userCanSelect = canSelect && 
                       (state.userTeam === 'admin' || 
                        state.userTeam === state.currentTeam);
  
  // Gestisce il click sul campione
  const handleClick = () => {
    if (isDraftActive && selectable && userCanSelect) {
      selectChampion(champion, state.currentTeam);
    }
  };
  
  // CSS classes per lo styling
  const cardClasses = [
    'champion-card',
    id === 'empty' || isReusable ? 'empty-champion' : '',
    isSelected ? 'selected' : '',
    !selectable || !userCanSelect ? 'disabled' : '',
    isSpectator ? 'spectator-mode' : '',
  ].filter(Boolean).join(' ');
  
  // Se è il campione vuoto
  if (id === 'empty' || !image) {
    return (
      <div 
        className={cardClasses}
        data-id={id}
        data-reusable={isReusable ? 'true' : 'false'}
        onClick={isSpectator ? undefined : handleClick}
      >
        <div className="d-flex flex-column align-items-center justify-content-center h-100">
          <i className="fas fa-user-plus" style={{ fontSize: '2rem', color: '#aaa' }}></i>
          <div className="mt-2 fs-6">PG Vuoto</div>
          {isSpectator && (
            <div className="spectator-badge">
              <i className="fas fa-eye"></i> Spettatore
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Fix del percorso immagine
  const imagePath = image.startsWith('/') ? image : `/${image}`;
  
  return (
    <div 
      className={cardClasses}
      data-id={id}
      data-reusable={isReusable ? 'true' : 'false'}
      onClick={isSpectator ? undefined : handleClick}
    >
      <img src={imagePath} alt={name} />
      <div className="champion-name">{name}</div>
      
      {isSpectator && (
        <div className="spectator-badge">
          <i className="fas fa-eye"></i> Spettatore
        </div>
      )}
    </div>
  );
};

export default ChampionCard;