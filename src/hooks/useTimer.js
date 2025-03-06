import { useEffect, useRef } from 'react';
import { useDraft } from '../context/DraftContext';
import { useChampions } from './useChampions';

/**
 * Custom hook to handle the draft timer
 */
export function useTimer() {
  const { state, updateTimer, autoSelectChampion, isChampionSelectable } = useDraft();
  const { champions } = useChampions();
  const intervalRef = useRef(null);
  
  useEffect(() => {
    // Pulisci eventuali intervalli esistenti
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Avvia un nuovo intervallo solo se siamo in una fase attiva e non in pausa
    if (
      state.currentPhase !== 'notStarted' &&
      state.currentPhase !== 'completed' &&
      !state.isPaused
    ) {
      intervalRef.current = setInterval(() => {
        if (state.currentTimer <= 0) {
          // Tempo scaduto - pulisci l'intervallo e gestisci la selezione automatica
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          
          // Filtra i campioni disponibili per la selezione automatica
          const availableChampions = champions.filter(champion => {
            const isReusable = champion.isReusable || champion.id === 'empty';
            return isReusable || isChampionSelectable(champion.id, isReusable);
          });
          
          // Seleziona automaticamente un campione
          if (typeof autoSelectChampion === 'function') {
            autoSelectChampion(availableChampions);
          } else {
            console.error('autoSelectChampion non è una funzione');
          }
        } else {
          // Aggiorna il timer
          updateTimer();
        }
      }, 1000);
    }

    // Pulisci all'smontaggio o quando cambiano le dipendenze
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    state.currentPhase,
    state.isPaused,
    state.currentTimer,
    updateTimer,
    autoSelectChampion,
    champions,
    isChampionSelectable
  ]);

  return {
    currentTimer: state.currentTimer,
    isPaused: state.isPaused
  };
}