import React from 'react';
import ParticipantCard from './ParticipantCard';

export default function Leaderboard({ participants, searchTerm, sortBy, fixtures, globalFlip }) {
  const sortedParticipants = [...participants].sort((a, b) => {
    // Check if fully eliminated
    const aEliminated = a.countries.length > 0 && a.countries.every(c => c.status === 'eliminated');
    const bEliminated = b.countries.length > 0 && b.countries.every(c => c.status === 'eliminated');

    if (aEliminated && !bEliminated) return 1;
    if (!aEliminated && bEliminated) return -1;
    
    if (sortBy === 'odds') {
       // Find the best (lowest) odds for active teams of each participant
       const getBestOdds = (p) => {
          const activeOdds = p.countries
             .filter(c => c.status === 'active')
             .map(c => Number(c.price) || Infinity);
          return activeOdds.length > 0 ? Math.min(...activeOdds) : Infinity;
       };
       
       const aBest = getBestOdds(a);
       const bBest = getBestOdds(b);
       
       if (aBest !== bBest) {
          return aBest - bBest;
       }
    }

    // Default or tie-breaker: Sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="leaderboard-grid">
      {sortedParticipants
        .filter(player => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return player.name.toLowerCase().includes(searchLower) ||
                 player.countries.some(c => c.name.toLowerCase().includes(searchLower));
        })
        .map((player, index) => {
        // Sort countries based on the current dashboard sort mode
        const sortedCountries = [...player.countries].sort((a, b) => {
           if (sortBy === 'name') {
              return a.name.localeCompare(b.name);
           }
           if (sortBy === 'odds') {
              const aOdds = a.status === 'active' ? Number(a.price) || Infinity : Infinity;
              const bOdds = b.status === 'active' ? Number(b.price) || Infinity : Infinity;
              // If both have the same odds (e.g. both Infinity because they are eliminated), sort alphabetically
              if (aOdds === bOdds) return a.name.localeCompare(b.name);
              return aOdds - bOdds;
           }
           return 0;
        });

        return (
          <div 
            key={player.id} 
            className="participant-wrapper"
            style={{ '--index': index }}
          >
            <ParticipantCard 
              {...player} 
              countries={sortedCountries}
              fixtures={fixtures}
              globalFlip={globalFlip}
              allParticipants={participants}
            />
          </div>
        );
      })}
    </div>
  );
}
