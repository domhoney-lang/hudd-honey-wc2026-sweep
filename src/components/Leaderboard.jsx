import React from 'react';
import ParticipantCard from './ParticipantCard';

export default function Leaderboard({ participants, searchTerm, sortBy, fixtures, globalFlip }) {
  const getNextMatchTime = (countryName) => {
    if (!fixtures || fixtures.length === 0) return Infinity;
    const teamFixtures = fixtures.filter(f => f.home_team === countryName.toLowerCase() || f.away_team === countryName.toLowerCase());
    if (teamFixtures.length === 0) return Infinity;
    
    // Filter out games that finished more than 3 hours ago to match ParticipantCard logic
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const upcoming = teamFixtures.filter(f => new Date(f.commence_time) > threeHoursAgo);
    
    if (upcoming.length === 0) return Infinity;
    const sortedFixtures = upcoming.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    return new Date(sortedFixtures[0].commence_time).getTime();
  };

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
    } else if (sortBy === 'match') {
       // Find the earliest next match time for active teams of each participant
       const getEarliestMatch = (p) => {
          const activeMatchTimes = p.countries
             .filter(c => c.status === 'active')
             .map(c => getNextMatchTime(c.name));
          return activeMatchTimes.length > 0 ? Math.min(...activeMatchTimes) : Infinity;
       };

       const aNext = getEarliestMatch(a);
       const bNext = getEarliestMatch(b);

       if (aNext !== bNext) {
          return aNext - bNext;
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
           if (sortBy === 'match') {
              const aMatch = a.status === 'active' ? getNextMatchTime(a.name) : Infinity;
              const bMatch = b.status === 'active' ? getNextMatchTime(b.name) : Infinity;
              if (aMatch === bMatch) return a.name.localeCompare(b.name);
              return aMatch - bMatch;
           }
           return 0;
        });

        return (
          <div 
            key={`${sortBy}-${player.id}`} 
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
