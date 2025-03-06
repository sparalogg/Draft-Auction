import React, { useState, useEffect } from 'react';

const CoinFlipModal = ({ show, onHide, onCoinFlipResult }) => {
    const [flipping, setFlipping] = useState(false);
    const [result, setResult] = useState(null);
  
    // Se show è false, non renderizzare nulla
    if (!show) return null;
  
    const performCoinFlip = () => {
      setFlipping(true);
      setResult(null);
      
      // Simula il lancio della moneta con un timeout
      setTimeout(() => {
        const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
        setResult(coinResult);
        setFlipping(false);
        
        // Chiama la callback con il risultato
        if (onCoinFlipResult) {
          onCoinFlipResult(coinResult);
        }
      }, 1500);
    };
  
    return (
      <div 
        className="modal coin-flip-modal" 
        style={{ 
          display: 'block', 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 1000 
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Lancio della Moneta</h5>
            </div>
            <div className="modal-body text-center">
              {/* Contenuto esistente */}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default CoinFlipModal;