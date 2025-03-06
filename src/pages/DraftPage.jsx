import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../context/DraftContext';
import { useSettings } from '../context/SettingsContext';

// Components
import TeamPanel from '../components/draft/TeamPanel';
import ChampionGrid from '../components/draft/ChampionGrid';
import Timer from '../components/common/Timer';
import PhaseIndicator from '../components/draft/PhaseIndicator';
import PreviewBox from '../components/draft/PreviewBox';
import SettingsModal from '../components/settings/SettingsModal';
import Instructions from '../components/layout/Instructions';
import TeamHeader from '../components/layout/TeamHeader';
import CoinFlipModal from '../components/draft/CoinFlipModal';
import BonusTimeDisplay from '../components/draft/BonusTimeDisplay';

const DraftPage = () => {
  const { t } = useTranslation();
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { 
    state, 
    startDraft, 
    joinDraft, 
    resetDraft, 
    togglePause 
  } = useDraft();
  const { settings } = useSettings();
  
  // State for modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCoinFlipModal, setShowCoinFlipModal] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState(null);
  
  // Handle the start/new draft button
  const handleStartDraft = () => {
    // Log per debug
    console.log('Avvio draft', {
      coinFlipEnabled: settings.coinFlipEnabled,
      currentPhase: state.currentPhase
    });

    if (settings.coinFlipEnabled) {
      // Forza la visualizzazione del modal
      setShowCoinFlipModal(true);
    } else {
      // Se coin flip è disabilitato, avvia direttamente il draft
      startDraft();
    }
  };

  // Gestisci la chiusura del coin flip modal
  const handleCoinFlipModalClose = (startingTeam) => {
    console.log('Chiusura coin flip modal', { startingTeam });
    
    // Nascondi il modal
    setShowCoinFlipModal(false);
    
    // Avvia il draft con il team scelto
    startDraft(startingTeam);
  };
  
    const initialized = useRef(false);
  

    // Leggi il codice di accesso da sessionStorage
    const storedAccessCode = useRef(sessionStorage.getItem('draftAccessCode'));

  useEffect(() => {
    if (storedAccessCode.current) {
      console.log("Trovato codice di accesso in sessionStorage:", storedAccessCode.current);
      sessionStorage.removeItem('draftAccessCode');
    }
  }, []);
  
  // Join the draft when component mounts - usando useRef per evitare il loop
  useEffect(() => {
    // Se è già stato inizializzato, non farlo di nuovo
    if (initialized.current) return;
    
    const connectToDraft = async () => {
      if (!draftId) {
        console.log("No draftId provided");
        return;
      }
      
      console.log("Connecting to draft:", draftId);
      setIsJoining(true);
      
      try {
        // Determine role based on access code
        let role = 'spectator'; // Default role
        
        // Use stored access code if available
        const effectiveAccessCode = storedAccessCode.current;
        
        if (effectiveAccessCode) {
          console.log("Using access code:", effectiveAccessCode);
          if (effectiveAccessCode.startsWith('AD')) {
            role = 'admin';
          } else if (effectiveAccessCode.startsWith('BL')) {
            role = 'blue';
          } else if (effectiveAccessCode.startsWith('RD')) {
            role = 'red';
          }
        }
        
        console.log("Joining draft as:", role);
        
        // If we haven't joined this draft yet, try to connect
        await joinDraft(draftId, role);
        console.log("Successfully joined draft");
        setIsJoining(false);
      } catch (error) {
        console.error('Error connecting to draft:', error);
        setError('Unable to connect to draft. It may no longer exist.');
        setIsJoining(false);
      }
    };
    
    connectToDraft();
    initialized.current = true;
    
  }, []); // Empty dependency array to avoid loops

  useEffect(() => {
    // Mostra il modal solo quando si inizia il draft, non all'accesso
    if (
      settings.coinFlipEnabled === true && 
      state.currentPhase === 'notStarted' && 
      showCoinFlipModal
    ) {
      // Chiudi immediatamente il modal se è apparso all'accesso
      setShowCoinFlipModal(false);
    }
  }, [settings.coinFlipEnabled, state.currentPhase, showCoinFlipModal]);



  // Join the draft when component mounts - usando useRef per evitare il loop
  useEffect(() => {
    // Se è già stato inizializzato, non farlo di nuovo
    if (initialized.current) return;
    
    const connectToDraft = async () => {
      if (!draftId) {
        console.log("No draftId provided");
        return;
      }
      
      console.log("Connecting to draft:", draftId);
      setIsJoining(true);
      
      try {
        // Determine role based on access code
        let role = 'spectator'; // Default role
        
        // Use stored access code if available
        const effectiveAccessCode = storedAccessCode.current;
        
        if (effectiveAccessCode) {
          console.log("Using access code:", effectiveAccessCode);
          if (effectiveAccessCode.startsWith('AD')) {
            role = 'admin';
          } else if (effectiveAccessCode.startsWith('BL')) {
            role = 'blue';
          } else if (effectiveAccessCode.startsWith('RD')) {
            role = 'red';
          }
        }
        
        console.log("Joining draft as:", role);
        
        // If we haven't joined this draft yet, try to connect
        await joinDraft(draftId, role);
        console.log("Successfully joined draft");
        setIsJoining(false);
      } catch (error) {
        console.error('Error connecting to draft:', error);
        setError('Unable to connect to draft. It may no longer exist.');
        setIsJoining(false);
      }
    };
    
    connectToDraft();
    initialized.current = true;
    
  }, []); // Empty dependency array to avoid loops
  
  // Redirect to home if there's an error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);
  
 
  
  // Handle reset draft
  const handleResetDraft = () => {
    if (window.confirm(t('confirmations.resetDraft'))) {
      resetDraft();
    }
  };
  
  // Handle toggle pause
  const handleTogglePause = () => {
    togglePause();
  };

  // Check if the user can modify the draft
  const canModifyDraft = state.userTeam === 'admin' || 
                         state.userTeam === state.currentTeam;
  
  // If there's an error, show error message
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>Errore</h2>
          <p>{error}</p>
          <p>Verrai reindirizzato alla pagina iniziale...</p>
        </div>
      </div>
    );
  }
  
  // Show loading state until we've joined the draft
  if (isJoining) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Caricamento draft in corso...</p>
      </div>
    );
  }
  
  return (
    <div className="main-container">
      
      {/* Headers with team names and timer */}
      <div className="team-headers">
        <TeamHeader team="blue" />
        <Timer />
        <TeamHeader team="red" />
      </div>
      
      {/* Phase indicator */}
      <PhaseIndicator />
      
      {/* Preview section */}
      <div className="preview-section">
        <PreviewBox team="blue" />
        <PreviewBox team="red" />
      </div>
      
      {/* Main draft container */}
      <div className="draft-container">
        {/* Blue team column */}
        <TeamPanel team="blue" />
        
        {/* Center column with champions grid */}
        <div className="champions-column">
          <ChampionGrid canSelect={canModifyDraft} />
          
          {/* Start/New draft button - only shown to admin */}
          {(state.currentPhase === 'notStarted' || state.currentPhase === 'completed') && 
           state.userTeam === 'admin' && (
            <button className="btn-start" id="startBtn" onClick={handleStartDraft}>
              {state.currentPhase === 'completed' 
                ? t('buttons.newDraft') 
                : 'INIZIA DRAFT'}
            </button>
          )}
        </div>
        
        {/* Red team column */}
        <TeamPanel team="red" />
      </div>
      
      {/* Controls */}
      <div className="controls">
        <button 
          className="btn-draft btn-blue" 
          id="pauseBtn"
          onClick={handleTogglePause}
          disabled={state.userTeam !== 'admin' && state.userTeam !== state.currentTeam}
        >
          <i className={`fas ${state.isPaused ? 'fa-play' : 'fa-pause'} me-2`}></i>
          {state.isPaused ? 'Riprendi' : 'Pausa'}
        </button>
        
        <button 
          className="btn-draft btn-red" 
          id="resetBtn"
          onClick={handleResetDraft}
          disabled={state.userTeam !== 'admin'}
        >
          <i className="fas fa-redo me-2"></i>
          Reset
        </button>
        
        <button 
          className="btn-draft" 
          id="settingsBtn" 
          style={{ backgroundColor: '#777' }}
          onClick={() => setShowSettingsModal(true)}
          disabled={(state.currentPhase !== 'notStarted' && 
                     state.currentPhase !== 'completed') || 
                    state.userTeam !== 'admin'}
        >
          <i className="fas fa-cog me-2"></i>
          Impostazioni
        </button>
        
        <button 
          className="btn-draft" 
          onClick={() => navigate('/')}
          style={{ backgroundColor: '#555' }}
        >
          <i className="fas fa-sign-out-alt me-2"></i>
          Esci
        </button>
      </div>
      
      {/* Phase info */}
      <div className="draft-info">
        <div className="phase-indicator" id="phaseIndicator">
          {state.currentPhase === 'notStarted' 
            ? 'In attesa di inizio'
            : state.currentPhase === 'completed'
              ? 'Draft Completato'
              : state.draftSequence[state.currentStepIndex]?.phase || ''}
              {/* Draft code badge */}
        </div>
        <div className="draft-code-badge">
          Codice Draft: <span className="draft-code">{draftId}</span>
          {state.userTeam && (
            <span className={`user-team ${state.userTeam}-team`}>
              {state.userTeam === 'blue' ? 'Team Blu' : 
              state.userTeam === 'red' ? 'Team Rosso' : 
              state.userTeam === 'admin' ? 'Admin' : 'Spettatore'}
            </span>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <Instructions />
      
      {/* Modals */}
      <SettingsModal 
        show={showSettingsModal} 
        onHide={() => setShowSettingsModal(false)} 
      />
      {showCoinFlipModal && (
      <CoinFlipModal 
        show={true}
        onHide={(startingTeam) => {
          setShowCoinFlipModal(false);
          // Passa il team di partenza al metodo di avvio draft
          startDraft(startingTeam);
        }}
        onCoinFlipResult={(result) => {
          console.log('Risultato lancio moneta:', result);
        }}
      />
    )}
    
    <BonusTimeDisplay />
    </div>
  );
};

export default DraftPage;