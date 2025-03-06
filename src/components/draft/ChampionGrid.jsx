import React from 'react';
import ChampionCard from './ChampionCard';
import { useChampions } from '../../hooks/useChampions';
import { useDraft } from '../../context/DraftContext';

const ChampionGrid = ({ canSelect = true }) => {
  const { champions, loading, error } = useChampions();
  const { state } = useDraft();

  // Determina se l'utente è in modalità spettatore
  const isSpectator = state.userTeam === 'spectator';

  // Mostra overlay per spettatori
  if (isSpectator && state.currentPhase !== 'notStarted' && state.currentPhase !== 'completed') {
    return (
      <div className="champions-grid-container">
        <div className="spectator-overlay">
          <div className="spectator-message">
            <i className="fas fa-eye mb-3" style={{ fontSize: '2rem' }}></i>
            <h3>Modalità Spettatore</h3>
            <p>Stai assistendo al draft come spettatore.</p>
          </div>
        </div>
        <div className="champions-grid spectator-mode">
          {champions.map(champion => (
            <ChampionCard 
              key={champion.id} 
              champion={champion}
              canSelect={false}
              spectatorMode={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // Resto del codice esistente per modalità non spettatore
  if (loading) {
    return (
      <div className="champions-grid-container d-flex justify-content-center align-items-center">
        <div className="loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="champions-grid-container d-flex justify-content-center align-items-center">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="champions-grid">
      {champions.map(champion => (
        <ChampionCard 
          key={champion.id} 
          champion={champion}
          canSelect={canSelect}
        />
      ))}
    </div>
  );
};

export default ChampionGrid;