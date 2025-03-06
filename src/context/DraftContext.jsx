import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { generateDraftSequence } from '../hooks/useDraftSequence';
import { database } from '../services/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';

// Timeout più lungo per le operazioni Firebase
const DEFAULT_TIMEOUT = 60000; // 60 secondi

// Funzione di utilità per aggiungere timeout e retry alle richieste Firebase
const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase request timeout')), DEFAULT_TIMEOUT)
        )
      ]);
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Initial state
const initialState = {
  currentPhase: 'notStarted', 
  currentTeam: 'blue',
  currentTimer: 30, // Default timer
  isPaused: false,
  selectedChampion: null,
  selectedChampions: {
    blue: [],
    red: []
  },
  bannedChampions: {
    blue: [],
    red: []
  },
  currentSelections: [], 
  requiredSelections: 1,
  isMultipleSelectionStep: false,
  draftSequence: [],
  currentStepIndex: 0,
  draftId: null,
  userTeam: null,
  slotSelections: {},
  teamNames: {
    blue: 'Blue',
    red: 'Red'
  },
  teamBonusTime: {
    blue: 0,
    red: 0
  },
  settings: {
    timePerPick: 30,
    timePerBan: 20,
    numberOfBans: 2,
    teamBonusTime: 10,
    mirrorPicks: false
  }
};

// Action types
const ACTIONS = {
  SET_DRAFT_STATE: 'SET_DRAFT_STATE',
  START_DRAFT: 'START_DRAFT',
  RESET_DRAFT: 'RESET_DRAFT',
  TOGGLE_PAUSE: 'TOGGLE_PAUSE',
  UPDATE_TIMER: 'UPDATE_TIMER',
  RESET_TIMER: 'RESET_TIMER',
  SELECT_CHAMPION: 'SELECT_CHAMPION',
  CONFIRM_SELECTION: 'CONFIRM_SELECTION',
  MOVE_TO_NEXT_STEP: 'MOVE_TO_NEXT_STEP',
  COMPLETE_DRAFT: 'COMPLETE_DRAFT',
  SET_DRAFT_ID: 'SET_DRAFT_ID',
  SET_USER_TEAM: 'SET_USER_TEAM',
  UPDATE_TEAM_NAME: 'UPDATE_TEAM_NAME',
  UPDATE_DRAFT_SETTINGS: 'UPDATE_DRAFT_SETTINGS'
};

// Utility function for champion selectability
const isChampionSelectable = (state, championId, isReusable) => {
  // Always selectable if reusable
  if (isReusable) return true;
  
  const { selectedChampions, bannedChampions, currentTeam, settings } = state;
  
  // Normalize selections and bans
  const blueSelected = selectedChampions.blue || [];
  const redSelected = selectedChampions.red || [];
  const blueBanned = bannedChampions.blue || [];
  const redBanned = bannedChampions.red || [];
  
  // Check if banned
  const isBanned = blueBanned.includes(championId) || redBanned.includes(championId);
  if (isBanned) return false;
  
  // Mirror picks logic
  if (!settings.mirrorPicks) {
    // Without mirror picks, champion can be selected only once total
    return !blueSelected.includes(championId) && !redSelected.includes(championId);
  } else {
    // With mirror picks, champion can be selected once per team
    const currentTeamSelections = currentTeam === 'blue' ? blueSelected : redSelected;
    return !currentTeamSelections.includes(championId);
  }
};

// Reducer function
function draftReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DRAFT_STATE:
      return {
        ...state,
        ...action.payload
      };

      case ACTIONS.UPDATE_DRAFT_SETTINGS:
        return {
          ...state,
          settings: {
            ...state.settings,
            ...action.payload
          },
          // Inizializza il tempo bonus se specificato
          teamBonusTime: action.payload.teamBonusTime !== undefined
            ? { blue: action.payload.teamBonusTime, red: action.payload.teamBonusTime }
            : state.teamBonusTime
        };

        case ACTIONS.START_DRAFT:
          return {
            ...state,
            currentPhase: 'inProgress',
            currentStepIndex: 0,
            selectedChampions: { blue: [], red: [] },
            bannedChampions: { blue: [], red: [] },
            slotSelections: {},
            isPaused: false,
            draftSequence: action.payload.draftSequence,
            currentTeam: action.payload.startingTeam || action.payload.draftSequence[0].team,
            currentTimer: action.payload.initialTimer,
            currentSelections: [],
            isMultipleSelectionStep: action.payload.draftSequence[0].multiSelect || false,
            requiredSelections: action.payload.draftSequence[0].selectCount || 1,
            teamBonusTime: action.payload.teamBonusTime || { blue: 0, red: 0 }
          };

      case ACTIONS.RESET_DRAFT:
        return {
          ...initialState,
          draftId: state.draftId,
          userTeam: state.userTeam,
          teamNames: state.teamNames,
          draftSequence: [],
          settings: state.settings,
          teamBonusTime: {
            blue: state.settings.teamBonusTime || 0,
            red: state.settings.teamBonusTime || 0
          }
        };

    case ACTIONS.TOGGLE_PAUSE:
      return {
        ...state,
        isPaused: !state.isPaused
      };

      case ACTIONS.UPDATE_TIMER:
        const currentTimer = state.currentTimer > 0 ? state.currentTimer - 1 : 0;
        const currentTeam = state.currentTeam;
        let remainingBonusTime = state.teamBonusTime[currentTeam];
      
        // Se il timer principale è 0, inizia a sottrarre dal tempo bonus
        if (currentTimer === 0) {
          // Sottrae l'intero tempo del turno dal bonus
          remainingBonusTime = Math.max(remainingBonusTime - (state.settings.timePerPick || state.settings.timePerBan), 0);
          
          return {
            ...state,
            currentTimer: 0,
            teamBonusTime: {
              ...state.teamBonusTime,
              [currentTeam]: remainingBonusTime
            }
          };
        }
        
        return {
          ...state,
          currentTimer
        };

    case ACTIONS.RESET_TIMER:
      return {
        ...state,
        currentTimer: action.payload
      };

    case ACTIONS.SELECT_CHAMPION: {
      const { champion, team } = action.payload;
      
      if (!champion || !champion.id) {
        console.warn("Invalid champion data:", champion);
        return state;
      }
      
      let newSelections = [...(state.currentSelections || [])];
    
      // Multiple selection handling
      if (state.isMultipleSelectionStep) {
        // Check if champion is already selected
        const existingIndex = newSelections.findIndex(c => c.id === champion.id);
        
        if (existingIndex >= 0) {
          // If already selected, remove it (toggle selection)
          newSelections.splice(existingIndex, 1);
        } else {
          // If not selected and haven't reached limit, add it
          if (newSelections.length < state.requiredSelections) {
            newSelections.push(champion);
          } else {
            // If limit reached, remove oldest and add new
            newSelections.shift();
            newSelections.push(champion);
          }
        }
      } else {
        // Single selection, replace existing
        newSelections = [champion];
      }
    
      return {
        ...state,
        selectedChampion: champion,
        currentSelections: newSelections
      };
    }

    case ACTIONS.CONFIRM_SELECTION: {
      const currentStep = state.draftSequence[state.currentStepIndex];
      
      if (!currentStep) {
        console.warn("No current step found for confirmation");
        return state;
      }
      
      const team = currentStep.team;
      const isPickStep = currentStep.type === 'pick';
      const isBanStep = currentStep.type === 'ban';
      
      // Deep copy to prevent mutations
      const selectedChampions = JSON.parse(JSON.stringify(state.selectedChampions || { blue: [], red: [] }));
      const bannedChampions = JSON.parse(JSON.stringify(state.bannedChampions || { blue: [], red: [] }));
      const slotSelections = JSON.parse(JSON.stringify(state.slotSelections || {}));
      
      // Handle slot mapping
      const primarySlot = currentStep.slot;
      
      if (state.currentSelections.length > 0) {
        slotSelections[primarySlot] = state.currentSelections[0].id;
      }
      
      // Handle additional slots
      if (currentStep.additionalSlots && state.currentSelections.length > 1) {
        currentStep.additionalSlots.forEach((slot, index) => {
          if (state.currentSelections[index + 1]) {
            slotSelections[slot] = state.currentSelections[index + 1].id;
          }
        });
      }
      
      // Handle bans and picks
      if (isBanStep) {
        const validBans = (state.currentSelections || [])
          .filter(c => c && !c.isReusable)
          .map(c => c.id);
        
        bannedChampions[team] = [...(bannedChampions[team] || []), ...validBans];
      } else if (isPickStep) {
        const validPicks = (state.currentSelections || [])
          .filter(c => c && !c.isReusable)
          .map(c => c.id);
        
        selectedChampions[team] = [...(selectedChampions[team] || []), ...validPicks];
      }
      
      return {
        ...state,
        selectedChampions,
        bannedChampions,
        slotSelections,
        currentSelections: [],
        selectedChampion: null
      };
    }

    case ACTIONS.MOVE_TO_NEXT_STEP: {
      const nextStepIndex = state.currentStepIndex + 1;
      
      // Check if draft is complete
      if (nextStepIndex >= state.draftSequence.length) {
        return {
          ...state,
          currentPhase: 'completed',
          currentStepIndex: nextStepIndex
        };
      }
      
      const nextStep = state.draftSequence[nextStepIndex];
      
      const initialTimer = nextStep.type === 'ban' 
        ? action.payload.timePerBan 
        : action.payload.timePerPick;

      return {
        ...state,
        currentStepIndex: nextStepIndex,
        currentTeam: nextStep.team,
        currentTimer: initialTimer,
        currentPhase: nextStep.type,
        isMultipleSelectionStep: nextStep.multiSelect || false,
        requiredSelections: nextStep.selectCount || 1,
        currentSelections: []
      };
    }

    case ACTIONS.COMPLETE_DRAFT:
      return {
        ...state,
        currentPhase: 'completed'
      };

    case ACTIONS.SET_DRAFT_ID:
      return {
        ...state,
        draftId: action.payload
      };

    case ACTIONS.SET_USER_TEAM:
      return {
        ...state,
        userTeam: action.payload
      };
        
    case ACTIONS.UPDATE_TEAM_NAME:
      return {
        ...state,
        teamNames: {
          ...state.teamNames,
          [action.payload.team]: action.payload.name
        }
      };
  
    default:
      return state;
  }
}

// Create context
const DraftContext = createContext();

// Provider component
export function DraftProvider({ children, settings }) {
  const [state, dispatch] = useReducer(draftReducer, {
    ...initialState,
    settings: { ...initialState.settings, ...settings }
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Genera un codice draft casuale
  const generateDraftCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const getRandomLetter = () => letters.charAt(Math.floor(Math.random() * letters.length));
    const getRandomDigits = (length) => {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10);
      }
      return result;
    };
    
    return `${getRandomLetter()}${getRandomLetter()}${getRandomDigits(6)}${getRandomLetter()}${getRandomLetter()}`;
  };
  
  // Genera codici di accesso
  const generateAccessCodes = (draftId) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const getRandomLetter = () => letters.charAt(Math.floor(Math.random() * letters.length));
    const getRandomDigits = (length) => {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10);
      }
      return result;
    };
    
    return {
      admin: `AD${getRandomDigits(6)}${getRandomLetter()}${getRandomLetter()}`,
      blue: `BL${getRandomDigits(6)}${getRandomLetter()}${getRandomLetter()}`,
      red: `RD${getRandomDigits(6)}${getRandomLetter()}${getRandomLetter()}`
    };
  };

  // Sincronizza lo stato con Firebase
  useEffect(() => {
    if (!state.draftId || !isInitialized) return;

    const draftRef = ref(database, `drafts/${state.draftId}`);
    
    const updateData = {
      currentPhase: state.currentPhase,
      currentTeam: state.currentTeam,
      currentTimer: state.currentTimer,
      isPaused: state.isPaused,
      selectedChampions: state.selectedChampions,
      bannedChampions: state.bannedChampions,
      currentStepIndex: state.currentStepIndex,
      draftSequence: state.draftSequence,
      slotSelections: state.slotSelections,
      teamNames: state.teamNames,
      settings: state.settings,
      isMultipleSelectionStep: state.isMultipleSelectionStep,
      requiredSelections: state.requiredSelections
    };
    
    withRetry(() => update(draftRef, updateData))
      .catch(error => {
        console.error("Error updating Firebase:", error);
      });
      
  }, [
    state.currentPhase,
    state.currentTeam,
    state.currentTimer,
    state.isPaused,
    state.selectedChampions,
    state.bannedChampions,
    state.currentStepIndex,
    state.draftId,
    state.slotSelections,
    state.teamNames,
    state.settings,
    state.isMultipleSelectionStep,
    state.requiredSelections,
    isInitialized
  ]);


  const createDraft = async (championsData) => {
    try {
      const draftCode = generateDraftCode();
      const draftRef = ref(database, `drafts/${draftCode}`);
      
      // Prepara lo stato iniziale (solo dati serializzabili)
      const serializableState = {
        currentPhase: initialState.currentPhase,
        currentTeam: initialState.currentTeam,
        currentTimer: state.settings.timePerPick, // Imposta timer iniziale dalle impostazioni
        isPaused: initialState.isPaused,
        selectedChampions: initialState.selectedChampions,
        bannedChampions: initialState.bannedChampions,
        currentSelections: initialState.currentSelections,
        requiredSelections: initialState.requiredSelections,
        isMultipleSelectionStep: initialState.isMultipleSelectionStep,
        draftSequence: initialState.draftSequence,
        currentStepIndex: initialState.currentStepIndex,
        draftId: draftCode,
        slotSelections: initialState.slotSelections,
        teamNames: initialState.teamNames,
        settings: state.settings,
        createdAt: Date.now()
      };
      
      // Se abbiamo ricevuto dati campioni, inizializza
      if (championsData) {
        serializableState.availableChampions = championsData.map(champion => champion.id);
      }
      
      // Salva il draft su Firebase
      await withRetry(() => set(draftRef, serializableState));
      
      // Crea record nella cronologia draft
      const historyRef = ref(database, `draftHistory/${draftCode}`);
      await withRetry(() => set(historyRef, {
        draftId: draftCode,
        createdAt: Date.now(),
        status: 'active',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 ore
        teamNames: initialState.teamNames,
        settings: state.settings
      }));
      
      // Imposta l'ID del draft e il team utente
      dispatch({ type: ACTIONS.SET_DRAFT_ID, payload: draftCode });
      dispatch({ type: ACTIONS.SET_USER_TEAM, payload: 'admin' });
      
      return draftCode;
    } catch (error) {
      console.error("Errore durante la creazione del draft:", error);
      throw error;
    }
  };

  // Metodo per unirsi a un draft esistente
  const joinDraft = async (draftCode, team) => {
    try {
      const draftRef = ref(database, `drafts/${draftCode}`);
      const snapshot = await withRetry(() => get(draftRef));
      
      if (!snapshot.exists()) {
        throw new Error("Draft non trovato");
      }
      
      // Imposta listener per aggiornamenti in tempo reale
      onValue(draftRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          dispatch({ 
            type: ACTIONS.SET_DRAFT_STATE, 
            payload: data 
          });
          
          if (!isInitialized) {
            setIsInitialized(true);
          }
        }
      });
      
      // Imposta ID draft e team
      dispatch({ type: ACTIONS.SET_DRAFT_ID, payload: draftCode });
      
      // Imposta team se fornito
      if (team) {
        dispatch({ type: ACTIONS.SET_USER_TEAM, payload: team });
      }
      
      return true;
    } catch (error) {
      console.error("Errore durante l'accesso al draft:", error);
      throw error;
    }
  };

  // Avvia il draft
  const startDraft = (startingTeam = null) => {
    if (!state.draftId) {
      console.error("Nessun draft selezionato");
      return;
    }
    
    const draftSequence = generateDraftSequence({
      numberOfBans: state.settings.numberOfBans,
      teamNames: state.teamNames,
      startingTeam: startingTeam
    });
  
    const initialTimer = draftSequence[0].type === 'ban' 
      ? state.settings.timePerBan 
      : state.settings.timePerPick;
  
    dispatch({
      type: ACTIONS.START_DRAFT,
      payload: {
        draftSequence,
        initialTimer,
        teamBonusTime: {
          blue: state.settings.teamBonusTime || 0,
          red: state.settings.teamBonusTime || 0
        },
        startingTeam: startingTeam || (Math.random() < 0.5 ? 'blue' : 'red')
      }
    });
  };

  // Resetta il draft
  const resetDraft = () => {
    if (!state.draftId) {
      console.error("Nessun draft selezionato");
      return;
    }
    
    dispatch({ type: ACTIONS.RESET_DRAFT });
  };

  // Metti in pausa/riprendi il draft
  const togglePause = () => {
    if (!state.draftId || 
        (state.userTeam !== 'blue' && 
         state.userTeam !== 'red' && 
         state.userTeam !== 'admin')) {
      console.warn("Solo i team o l'admin possono mettere in pausa");
      return;
    }
    
    dispatch({ type: ACTIONS.TOGGLE_PAUSE });
  };

  // Metodo per reimpostare il timer
const resetCurrentTimer = () => {
  if (
    state.currentPhase !== 'notStarted' && 
    state.currentPhase !== 'completed' &&
    state.draftSequence &&
    state.currentStepIndex < state.draftSequence.length
  ) {
    const currentStep = state.draftSequence[state.currentStepIndex];
    const newTimer = currentStep.type === 'ban' 
      ? state.settings.timePerBan 
      : state.settings.timePerPick;
    
    dispatch({ 
      type: ACTIONS.RESET_TIMER, 
      payload: newTimer 
    });
  }
};

  // Aggiorna il timer
  const updateTimer = () => {
    if (state.currentPhase !== 'notStarted' && 
        state.currentPhase !== 'completed' && 
        !state.isPaused && 
        state.currentTimer > 0) {
      dispatch({ type: ACTIONS.UPDATE_TIMER });
    }
  };

  // Seleziona un campione
  const selectChampion = (champion, team) => {
    // Verifica se l'utente può selezionare per questo team
    if (state.userTeam !== team && state.userTeam !== 'admin') {
      console.warn("Non sei autorizzato a selezionare per questo team");
      return;
    }
    
    dispatch({
      type: ACTIONS.SELECT_CHAMPION,
      payload: { champion, team }
    });
  };

  // Conferma selezione
  const confirmSelection = () => {
    const currentTeam = state.draftSequence[state.currentStepIndex]?.team;
    
    // Verifica se l'utente può confermare per questo team
    if (state.userTeam !== currentTeam && state.userTeam !== 'admin') {
      console.warn("Non sei autorizzato a confermare per questo team");
      return;
    }
    
    // Per selezioni multiple, verifica che ci siano abbastanza selezioni
    if (state.isMultipleSelectionStep && 
        state.currentSelections.length < state.requiredSelections) {
      console.warn(`Devi selezionare ${state.requiredSelections} eroi`);
      alert(`Seleziona ${state.requiredSelections} eroi prima di confermare`);
      return;
    }
    
    dispatch({ type: ACTIONS.CONFIRM_SELECTION });
    
    // Passa al prossimo passaggio
    dispatch({ 
      type: ACTIONS.MOVE_TO_NEXT_STEP,
      payload: {
        timePerBan: state.settings.timePerBan,
        timePerPick: state.settings.timePerPick
      }
    });
  };

  // Verifica se un campione è selezionabile
// Sostituisci la riga problematica con questo metodo
const isChampionSelectable = (championId, isReusable) => {
  // Champion sempre selezionabile se è riutilizzabile
  if (isReusable) return true;
  
  // Controlli di base
  if (!state.selectedChampions || !state.bannedChampions || !state.currentTeam) {
    return true;
  }
  
  const { selectedChampions, bannedChampions, currentTeam, settings } = state;
  const otherTeam = currentTeam === 'blue' ? 'red' : 'blue';
  
  // Normalizza le liste di campioni selezionati e bannati
  const blueSelected = selectedChampions.blue || [];
  const redSelected = selectedChampions.red || [];
  const blueBanned = bannedChampions.blue || [];
  const redBanned = bannedChampions.red || [];
  
  // Controllo ban
  const isBanned = blueBanned.includes(championId) || redBanned.includes(championId);
  if (isBanned) return false;
  
  // Gestione mirror picks
  if (!settings.mirrorPicks) {
    // Senza mirror picks, un campione può essere selezionato solo una volta in totale
    const isAlreadySelected = 
      blueSelected.includes(championId) || 
      redSelected.includes(championId);
    
    return !isAlreadySelected;
  } else {
    // Con mirror picks, un campione può essere selezionato una volta per team
    const currentTeamSelections = currentTeam === 'blue' ? blueSelected : redSelected;
    return !currentTeamSelections.includes(championId);
  }
};

  // Verifica se un campione è già selezionato nel passaggio corrente
  const isChampionSelectedInCurrentStep = (championId) => {
    if (!state.currentSelections) return false;
    return state.currentSelections.some(c => c && c.id === championId);
  };

  // Aggiorna il nome del team
  const updateTeamName = (team, name) => {
    if (!team || !name) return;
    
    dispatch({
      type: ACTIONS.UPDATE_TEAM_NAME,
      payload: { team, name }
    });
  };
  
  // Aggiorna le impostazioni del draft
  const updateDraftSettings = (newSettings) => {
    // Convalida le impostazioni
    const validatedSettings = {
      timePerPick: Math.min(Math.max(newSettings.timePerPick || 30, 5), 120),
      timePerBan: Math.min(Math.max(newSettings.timePerBan || 20, 5), 60),
      numberOfBans: newSettings.numberOfBans || 2,
      mirrorPicks: newSettings.mirrorPicks !== undefined 
        ? newSettings.mirrorPicks 
        : false
    };
  
    // Dispatch dell'azione di aggiornamento
    dispatch({
      type: ACTIONS.UPDATE_DRAFT_SETTINGS,
      payload: validatedSettings
    });
  
    // Se il draft è in corso, rigenera la sequenza con le nuove impostazioni
    if (state.currentPhase !== 'notStarted' && state.currentPhase !== 'completed') {
      const newDraftSequence = generateDraftSequence({
        numberOfBans: validatedSettings.numberOfBans,
        teamNames: state.teamNames
      });
  
      // Aggiorna la sequenza del draft
      dispatch({
        type: ACTIONS.SET_DRAFT_STATE,
        payload: {
          draftSequence: newDraftSequence
        }
      });
    }
  };

  // Auto-selezione campione quando il timer scade
  const autoSelectChampion = (availableChampions) => {
    console.log('Auto selecting champion', { 
      availableChampions, 
      currentTeam: state.currentTeam 
    });
  
    // Se non ci sono campioni disponibili, esci
    if (!availableChampions || availableChampions.length === 0) {
      console.error("Nessun campione disponibile per la selezione automatica");
      return;
    }
    
    // Controlla se il timer principale e il bonus time sono esauriti
    const currentTeam = state.currentTeam;
    const currentTeamBonusTime = state.teamBonusTime[currentTeam];
    
    if (state.currentTimer <= 0 || currentTeamBonusTime <= 0) {
      console.warn('Tempo esaurito per questa squadra');
   
    }
    
    // Filtra campioni selezionabili escludendo quelli già selezionati
    const selectableChampions = availableChampions.filter(champion => 
      isChampionSelectable(champion.id, champion.isReusable) &&
      !state.currentSelections.some(selected => selected.id === champion.id)
    );
    
    // Se non ci sono campioni selezionabili, esci
    if (selectableChampions.length === 0) {
      console.warn('Nessun campione selezionabile rimanente');
      return;
    }
    
    // Seleziona un campione casuale tra quelli disponibili
    const randomIndex = Math.floor(Math.random() * selectableChampions.length);
    const selectedChampion = selectableChampions[randomIndex];
    
    console.log('Selected champion:', selectedChampion);
    
    // Seleziona il campione
    dispatch({
      type: ACTIONS.SELECT_CHAMPION,
      payload: { 
        champion: selectedChampion, 
        team: currentTeam 
      }
    });
    
    // Per selezioni multiple
    if (state.isMultipleSelectionStep && 
        state.currentSelections.length < state.requiredSelections) {
      // Ripeti la selezione fino a raggiungere il numero richiesto
      const remainingSelections = state.requiredSelections - state.currentSelections.length;
      
      for (let i = 0; i < remainingSelections; i++) {
        // Filtra nuovamente i campioni disponibili
        const remainingChampions = selectableChampions.filter(champion => 
          !state.currentSelections.some(selected => selected.id === champion.id)
        );
        
        if (remainingChampions.length > 0) {
          const nextRandomIndex = Math.floor(Math.random() * remainingChampions.length);
          const nextChampion = remainingChampions[nextRandomIndex];
          
          dispatch({
            type: ACTIONS.SELECT_CHAMPION,
            payload: { 
              champion: nextChampion, 
              team: currentTeam 
            }
          });
        }
      }
    }
    
    // Conferma la selezione
    dispatch({ 
      type: ACTIONS.CONFIRM_SELECTION 
    });
    
    // Passa al prossimo step
    dispatch({ 
      type: ACTIONS.MOVE_TO_NEXT_STEP,
      payload: {
        timePerBan: state.settings.timePerBan,
        timePerPick: state.settings.timePerPick
      }
    });
  };

  return (
    <DraftContext.Provider
      value={{
        state,
        createDraft,
        joinDraft,
        startDraft,
        resetDraft,
        togglePause,
        updateTimer,
        selectChampion,
        confirmSelection,
        isChampionSelectable,
        isChampionSelectedInCurrentStep,
        generateAccessCodes,
        updateTeamName,
        autoSelectChampion,
        updateDraftSettings
      }}
    >
      {children}
    </DraftContext.Provider>
  );
}

// Custom hook per utilizzare il contesto del draft
export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft deve essere utilizzato all\'interno di un DraftProvider');
  }
  return context;
}