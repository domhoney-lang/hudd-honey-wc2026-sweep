import React, { useState, useEffect } from 'react';

export const ParticipantAvatar = ({ participant, size = '48px', style = {} }) => {
  const [imgSrc, setImgSrc] = useState(`/avatars/${participant.name.toLowerCase()}.jpg`);
  const [useFallback, setUseFallback] = useState(false);

  const handleImgError = () => {
    if (imgSrc.endsWith('.jpg')) {
      setImgSrc(`/avatars/${participant.name.toLowerCase()}.png`);
    } else if (imgSrc.endsWith('.png')) {
      setImgSrc(`/avatars/${participant.name.toLowerCase()}.jpeg`);
    } else {
      setUseFallback(true);
    }
  };

  if (useFallback) {
    return (
      <div 
        className="avatar" 
        style={{ 
          backgroundColor: participant.color, 
          width: size, 
          height: size, 
          fontSize: size === '80px' ? '2rem' : '1rem', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style
        }}
      >
        {participant.initials}
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt={participant.name} 
      onError={handleImgError}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover', 
        border: `2px solid ${participant.color}`,
        flexShrink: 0,
        ...style
      }}
    />
  );
};

export default function ParticipantCard({ id, name, initials, color, countries, fixtures, style, globalFlip, allParticipants = [] }) {
  const [isFlipped, setIsFlipped] = useState(globalFlip || false);

  useEffect(() => {
    if (globalFlip !== undefined) {
      setIsFlipped(globalFlip);
    }
  }, [globalFlip]);
  
  const isEliminated = countries.length > 0 && countries.every(c => c.status === 'eliminated');

  const decimalToFraction = (decimal) => {
    let d = Number(decimal) - 1;
    if (d <= 0) return 'Evens';
    if (Math.abs(d - 0.333) < 0.01) return '1/3';
    if (Math.abs(d - 0.667) < 0.01) return '2/3';
    
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = d;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(d - h1 / k1) > d * 1.0E-5);
    return `${h1}/${k1}`;
  };

  const getOddsTier = (price) => {
    if (!price) return '';
    const numPrice = Number(price);
    if (numPrice < 15) return 'favorite';    // Likely to win (e.g. 5.0 to 14.0)
    if (numPrice < 100) return 'middling';   // Dark horses (e.g. 15.0 to 99.0)
    return 'poor';                           // Outsiders (e.g. 100.0+)
  };

  const calculateWinProbability = () => {
    let prob = 0;
    countries.forEach(c => {
      if (c.status === 'active' && c.price) {
        prob += (1 / Number(c.price));
      }
    });
    if (prob === 0) return '0%';
    // If > 100 (arbitrage/bookie margin), cap at 99.9%
    if (prob >= 1) return '99.9%'; 
    return (prob * 100).toFixed(1) + '%';
  };

  const getBestHope = () => {
    let best = null;
    let minOdds = Infinity;
    countries.forEach(c => {
      if (c.status === 'active' && c.price) {
        const price = Number(c.price);
        if (price < minOdds) {
          minOdds = price;
          best = c;
        }
      }
    });
    return best;
  };

  // The fixtures in state have their team names normalized to lowercase
  const activeTeamNames = countries
    .filter(c => c.status === 'active')
    .map(c => c.name.trim().toLowerCase());

  const getNextFixture = () => {
    if (!fixtures || fixtures.length === 0) return null;
    
    const relevantFixtures = fixtures.filter(f => 
      activeTeamNames.includes(f.home_team) || activeTeamNames.includes(f.away_team)
    );

    // Filter out games that finished more than 3 hours ago
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const upcoming = relevantFixtures.filter(f => new Date(f.commence_time) > threeHoursAgo);
    
    upcoming.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    return upcoming[0] || null;
  };

  const normalizeCountryName = (name) => {
    if (!name) return '';
    const lower = name.trim().toLowerCase();
    if (lower === 'korea republic' || lower === 'republic of korea' || lower === 'south korea') return 'south korea';
    if (lower === 'usa' || lower === 'united states of america') return 'united states';
    if (lower === 'dr congo' || lower === 'democratic republic of the congo') return 'congo dr';
    if (lower === 'cape verde') return 'cape verde islands';
    if (lower === 'bosnia and herzegovina' || lower === 'bosnia-herzegovina') return 'bosnia & herzegovina';
    if (lower === 'ivory coast' || lower === "cote d'ivoire") return "cote d'ivoire";
    if (lower === 'curaçao') return 'curacao';
    return lower;
  };

  const winProb = calculateWinProbability();
  const bestHope = getBestHope();
  const nextFixture = getNextFixture();

  const getOpponentInfo = () => {
    if (!nextFixture) return null;
    // In hudd-honey, we just have home_team and away_team.
    const isHome = activeTeamNames.includes(nextFixture.home_team);
    const opponentTeamName = isHome ? nextFixture.away_team : nextFixture.home_team;
    const opponentTeamNormalized = normalizeCountryName(opponentTeamName);
    
    let opponent = null;
    let countryCode = null;
    
    if (allParticipants && allParticipants.length > 0) {
      opponent = allParticipants.find(p => p.countries.some(c => normalizeCountryName(c.name) === opponentTeamNormalized));
      if (opponent) {
        countryCode = opponent.countries.find(c => normalizeCountryName(c.name) === opponentTeamNormalized)?.code;
      }
    }
    
    return { opponent, teamName: opponentTeamName, countryCode };
  };

  const opponentInfo = getOpponentInfo();

  const formatFixtureTime = (isoString) => {
    const matchDate = new Date(isoString);
    const now = new Date();

    // If the match has started and it's within the 3 hour window, it's in progress
    if (matchDate <= now) {
      return `IN PROGRESS`;
    }

    // Set to midnight to compare calendar days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());

    const diffTime = matchDay - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const timeStr = matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    if (diffDays === 0) return `TODAY AT ${timeStr}`;
    if (diffDays === 1) return `TOMORROW AT ${timeStr}`;
    if (diffDays > 1) return `IN ${diffDays} DAYS AT ${timeStr}`;
    
    // Fallback
    return matchDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase() + ` AT ${timeStr}`;
  };

  return (
    <div 
      className={`participant-card-container stagger-fade-in ${isEliminated ? 'eliminated-card' : ''}`} 
      style={{ ...style, '--card-color': color, '--card-color-glow': `${color}4D` }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`participant-card-inner ${isFlipped ? 'flipped' : ''}`}>
        
        {/* FRONT FACE */}
        <div className="participant-card-face participant-card-front">
          <div className="card-header">
            <ParticipantAvatar participant={{ name, initials, color }} size="48px" style={{ boxShadow: 'var(--shadow-sm)' }} />
            <h3 className="participant-name">{name}</h3>
          </div>
          <div className="countries-list">
            {countries.map((country) => (
              <div 
                key={country.code} 
                className={`country-toggle ${country.status}`}
                title={`${country.name} - ${country.status}`}
              >
                <span className={`fi fi-${country.code} flag-icon`}></span>
                <span className="country-name">{country.name}</span>
                {country.status === 'active' && country.price && (
                  <span className={`odds-badge slide-in ${getOddsTier(country.price)}`}>
                    {decimalToFraction(country.price)}
                  </span>
                )}
                {country.status === 'eliminated' && <span className="eliminated-badge slide-in">Eliminated</span>}
              </div>
            ))}
          </div>
        </div>

        {/* BACK FACE */}
        <div className="participant-card-face participant-card-back" style={{ borderColor: color }}>
          <div className="back-content">
            <div className="avatar-large-container">
              <ParticipantAvatar participant={{ name, initials, color }} size="80px" style={{ boxShadow: `0 0 20px ${color}4D`, borderWidth: '3px' }} />
            </div>
            
            <h3 className="participant-name back-name">{name}'s Portfolio</h3>
            
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">Win Probability</div>
                <div className="stat-value" style={{ color: winProb === '0%' ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                  {winProb}
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-label">Best Hope</div>
                <div className="stat-value best-hope-value">
                  {bestHope ? (
                    <>
                      <span className={`fi fi-${bestHope.code} flag-icon`}></span>
                      <span>{bestHope.name}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--color-eliminated-text)' }}>None</span>
                  )}
                </div>
              </div>
            </div>

            <div className="fixture-container">
              <div className="stat-label" style={{marginBottom: '0.25rem'}}>Next Match</div>
              {nextFixture ? (
                <div className="fixture-box">
                  <div className="fixture-teams">
                    <span style={{fontWeight: activeTeamNames.includes(nextFixture.home_team) ? '800' : '400', color: activeTeamNames.includes(nextFixture.home_team) ? 'var(--color-text-main)' : 'var(--color-text-muted)', textTransform: 'capitalize'}}>{nextFixture.home_team}</span>
                    <span className="fixture-vs">vs</span>
                    <span style={{fontWeight: activeTeamNames.includes(nextFixture.away_team) ? '800' : '400', color: activeTeamNames.includes(nextFixture.away_team) ? 'var(--color-text-main)' : 'var(--color-text-muted)', textTransform: 'capitalize'}}>{nextFixture.away_team}</span>
                  </div>
                  <div className="fixture-time">{formatFixtureTime(nextFixture.commence_time)}</div>
                  
                  {opponentInfo && (
                    <div className="up-against-container" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                      <span className="match-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Up Against</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {opponentInfo.opponent ? (
                          <ParticipantAvatar participant={opponentInfo.opponent} size="36px" />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-bg-tertiary, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>?</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                            {opponentInfo.opponent ? opponentInfo.opponent.name : 'Unassigned'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', textTransform: 'capitalize' }}>
                            {opponentInfo.countryCode && <span className={`fi fi-${opponentInfo.countryCode} flag-icon`} style={{ width: '12px', height: '12px', fontSize: '10px' }}></span>}
                            {opponentInfo.teamName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="fixture-box" style={{color: 'var(--color-text-muted)'}}>
                  No upcoming matches scheduled
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
