import React from 'react';

export default function PrizePool({ participants }) {
  // Flatten all countries with their participant owner
  const allTeams = participants.flatMap(p => 
    p.countries.map(c => ({
      ...c,
      participantName: p.name,
      participantInitials: p.initials,
      participantColor: p.color
    }))
  );

  const activeTeams = allTeams.filter(t => t.status === 'active');
  const eliminatedTeams = allTeams.filter(t => t.status === 'eliminated').sort((a, b) => (b.eliminatedAt || 0) - (a.eliminatedAt || 0));

  let winner = null;

  if (activeTeams.length === 1) {
    winner = activeTeams[0];
  } else if (activeTeams.length <= 4 && activeTeams.length > 1) {
    winner = { pending: true, teams: activeTeams };
  }

  const renderCandidate = (spot, label) => {
    if (!spot) return <div className="prize-candidates"><span className="candidate-badge">TBD</span></div>;
    
    if (spot.pending) {
      return (
        <div className="prize-candidates">
          {spot.teams.map(t => (
            <span key={t.code} className="candidate-badge slide-in">
              <span className={`fi fi-${t.code}`}></span> {t.participantName}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="prize-candidates">
        <span className="candidate-badge slide-in" style={{ borderLeft: `4px solid ${spot.participantColor}` }}>
          <div className="candidate-avatar" style={{ backgroundColor: spot.participantColor }}>{spot.participantInitials}</div>
          {spot.participantName} (<span className={`fi fi-${spot.code}`}></span>)
        </span>
      </div>
    );
  };

  return (
    <div className="prize-pool-container">
      <div className="prize-card winner">
        <div className="prize-title">Winner</div>
        <div className="prize-amount">£30</div>
        {renderCandidate(winner, 'Winner')}
      </div>
    </div>
  );
}
