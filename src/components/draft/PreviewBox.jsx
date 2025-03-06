import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../../context/DraftContext';

const PreviewBox = ({ team }) => {
  const { t } = useTranslation();
  const { state, confirmSelection } = useDraft();
  
  // Determina se l'utente è in modalità spettatore o admin
  const isSpectator = state.userTeam === 'spectator';
  const isAdmin = state.userTeam === 'admin';
  
  // Verifica se l'utente può vedere questa preview
  const canViewPreview = isSpectator || 
                         isAdmin || 
                         state.userTeam === team;
  
  // È il turno di questo team
  const isCurrentTeam = state.currentTeam === team;
  
  // Controlli per selezioni multiple
  const isMultipleSelection = state.isMultipleSelectionStep;
  const requiredSelections = state.requiredSelections || 1;
  const currentSelections = state.currentSelections || [];
  
  // Può bloccare la selezione
  const canLock = isCurrentTeam && 
                  currentSelections.length > 0 && 
                  (!isMultipleSelection || currentSelections.length >= requiredSelections);
  
  // L'utente può confermare per questo team
  const userCanConfirm = (state.userTeam === team || state.userTeam === 'admin') && canLock;
  
  // Gestisce il click per bloccare
  const handleLockClick = () => {
    if (!userCanConfirm) return;
    
    if (isMultipleSelection && currentSelections.length < requiredSelections) {
      alert(`Seleziona ${requiredSelections} eroi prima di confermare (attualmente ${currentSelections.length})`);
      return;
    }
    
    confirmSelection();
  };
  
  // Se l'utente non può vedere questa preview, mostra un placeholder
  if (!canViewPreview) {
    return (
      <div className={`team-column ${team}-column`}>
        <div 
          id={`${team}PreviewBox`}
          className="preview-box spectator-preview"
        >
          <div className="d-flex justify-content-center align-items-center w-100 h-100 text-muted">
            <div className="text-center">
              <i className="fa-solid fa-eye-slash mb-2" style={{ fontSize: '2rem' }}></i>
              <div>Pick Preview <i class="fa-solid fa-lock"></i></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get CSS classes for the container based on team
  const containerClass = `team-column ${team}-column`;
  
  // Is it currently this team's turn?
  const isTeamTurn = isCurrentTeam && 
                     state.currentPhase !== 'notStarted' && 
                     state.currentPhase !== 'completed';
  
  // Fix image path if needed
  const getImagePath = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  };
  
  // Generate preview content based on current selections
  const renderPreviewContent = () => {
    // If this isn't the current team's turn, show empty state
    console.log("Rendering preview for team:", team, "isCurrentTeam:", isCurrentTeam, 
      "multiSelect:", state.isMultipleSelectionStep, 
      "required:", state.requiredSelections,
      "currentSelections:", state.currentSelections);

    if (!isCurrentTeam) {
      return (
        <div className="d-flex justify-content-center align-items-center w-100 h-100 text-muted">
          <div className="text-center">
            <i className="fa-solid fa-hand-pointer mb-2" style={{ fontSize: '2rem' }}></i>
            <div>{t('draft.selectHero')}</div>
          </div>
        </div>
      );
    }
    
    // If no selections yet, show empty state with instruction
    if (!currentSelections.length) {
      return (
        <div className="d-flex justify-content-center align-items-center w-100 h-100 text-muted">
          <div className="text-center">
            <i className="fa-solid fa-hand-pointer mb-2" style={{ fontSize: '2rem' }}></i>
            <div>{t('draft.selectHero')}</div>
            {isMultipleSelection && (
              <div className="mt-2 badge bg-info">
                Select {requiredSelections} heroes
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Show all current selections
    return (
      <div className="w-100">
        {/* Show selection count for multiple selection steps */}
        {isMultipleSelection && (
          <div className="w-100 text-center mb-3">
            <div className="bg-dark bg-opacity-75 p-2 rounded">
              <span className="text-white">
                {currentSelections.length}/{requiredSelections} heroes selected
              </span>
            </div>
          </div>
        )}
        
        <div className="d-flex flex-wrap justify-content-center">
          {currentSelections.map((selection, index) => (
            <div key={index} className="m-2 text-center">
              {selection && selection.image ? (
                <img 
                  src={getImagePath(selection.image)} 
                  alt={selection.name || 'Champion'} 
                  style={{ height: '70px', display: 'block', margin: '0 auto' }} 
                />
              ) : (
                <i className="fa-solid fa-user-ninja" style={{ fontSize: '2rem', display: 'block', margin: '0 auto' }}></i>
              )}
              <div className="fs-6 mt-1">{selection ? selection.name : 'Unknown'}</div>
            </div>
          ))}
          
          {/* Show placeholders for remaining required selections */}
          {isMultipleSelection && currentSelections.length < requiredSelections && (
            Array.from({ length: requiredSelections - currentSelections.length }).map((_, index) => (
              <div key={`placeholder-${index}`} className="m-2 text-center opacity-50">
                <div style={{ 
                  width: '70px', 
                  height: '70px', 
                  border: '2px dashed #aaa', 
                  borderRadius: '5px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <i className="fa-solid fa-plus" style={{ fontSize: '1.5rem', color: '#aaa' }}></i>
                </div>
                <div className="text-muted small mt-1">
                  Select champion {currentSelections.length + index + 1}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={containerClass}>
      
      <div 
        id={`${team}PreviewBox`}
        className={`preview-box ${isTeamTurn ? 'active-turn' : ''}`}
      >
        {renderPreviewContent()}
      </div>
      <button
        id={`${team}LockBtn`}
        className="lock-button"
        disabled={!userCanConfirm}
        onClick={handleLockClick}
      >
        {t('buttons.lock')}
      </button>
    </div>
  );
};

export default PreviewBox;