import { useState, useEffect, useMemo, useRef } from 'react';
import { ParticipantAvatar } from './ParticipantCard';

export default function GroupStandingsDrawer({ 
  isOpen, 
  onClose, 
  loading, 
  error, 
  groups = [], 
  onParticipantClick 
}) {
  const [standingsSearch, setStandingsSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('A');
  const observerRef = useRef(null);
  const drawerBodyRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Local Search Filtering
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (!standingsSearch.trim()) return groups;

    const query = standingsSearch.toLowerCase().trim();

    return groups
      .map(group => {
        const matchedTeams = group.teams.filter(team => {
          const nameMatch = team.name && team.name.toLowerCase().includes(query);
          const ownerMatch = team.owner && team.owner.name.toLowerCase().includes(query);
          return nameMatch || ownerMatch;
        });

        return {
          ...group,
          teams: matchedTeams
        };
      })
      .filter(group => group.teams.length > 0);
  }, [groups, standingsSearch]);

  // Set of group letters currently visible in filtered list
  const activeLettersSet = useMemo(() => {
    return new Set(filteredGroups.map(g => g.name.toUpperCase()));
  }, [filteredGroups]);

  // IntersectionObserver to highlight current active group letter on scroll
  useEffect(() => {
    if (!isOpen || loading || error || filteredGroups.length === 0) return;

    // Disconnect previous observer if any
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: drawerBodyRef.current,
      rootMargin: '-10% 0px -75% 0px', // Target the top portion of the drawer viewport
      threshold: 0
    };

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const letter = entry.target.getAttribute('data-group');
          if (letter) {
            setActiveLetter(letter);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    observerRef.current = observer;

    // Observe each group card
    const cards = drawerBodyRef.current.querySelectorAll('.drawer-group-card');
    cards.forEach(card => observer.observe(card));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, loading, error, filteredGroups, standingsSearch]);

  const scrollToGroup = (letter) => {
    const element = document.getElementById(`group-card-${letter}`);
    if (element && drawerBodyRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveLetter(letter);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Qualification row indicator color helper
  const getQualifyingBorderColor = (idx) => {
    if (idx === 0 || idx === 1) return '#10b981'; // Emerald Green (Top 2)
    if (idx === 2) return '#fbbf24'; // Amber / Yellow (3rd)
    return 'transparent'; // 4th
  };

  // Group letters from A to L
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <div className="drawer-overlay" onClick={handleBackdropClick}>
      <div className="drawer-container glass-panel">
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-title">
            <span>🏆</span>
            <h2>Group Standings</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>

        {/* Sticky Nav Alphabetical Jump Bar */}
        {!loading && !error && groups.length > 0 && (
          <div className="drawer-jump-bar">
            {alphabet.map(letter => {
              const isActive = activeLetter === letter;
              const isAvailable = activeLettersSet.has(letter);
              return (
                <button
                  key={letter}
                  className={`jump-btn ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  onClick={() => isAvailable && scrollToGroup(letter)}
                  disabled={!isAvailable}
                  title={isAvailable ? `Scroll to Group ${letter}` : `No teams matching in Group ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="drawer-body" ref={drawerBodyRef}>
          
          {/* Internal search input */}
          {!error && (
            <div className="drawer-search-wrapper">
              <input
                type="text"
                className="drawer-search-input"
                placeholder="Filter by country or owner name..."
                value={standingsSearch}
                onChange={(e) => setStandingsSearch(e.target.value)}
              />
              {standingsSearch && (
                <button 
                  className="drawer-search-clear" 
                  onClick={() => setStandingsSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="drawer-skeletons">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card glass-panel">
                  <div className="skeleton-title pulsing"></div>
                  <div className="skeleton-table">
                    <div className="skeleton-row header pulsing"></div>
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="skeleton-row pulsing"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="drawer-error-banner">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* No results state */}
          {!loading && !error && filteredGroups.length === 0 && (
            <div className="drawer-no-results">
              <p>No groups match your search filter.</p>
            </div>
          )}

          {/* Standing Cards */}
          {!loading && !error && filteredGroups.length > 0 && (
            <div className="drawer-group-list">
              {filteredGroups.map(group => (
                <div 
                  key={group.name} 
                  id={`group-card-${group.name}`}
                  data-group={group.name}
                  className="drawer-group-card glass-panel"
                >
                  <h3 className="group-card-title">Group {group.name}</h3>
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Pos</th>
                        <th>Team</th>
                        <th style={{ width: '40px', textAlign: 'center' }}>P</th>
                        <th style={{ width: '50px', textAlign: 'center' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.teams.map((team, idx) => (
                        <tr 
                          key={team.team_id}
                          className="standings-row"
                          style={{ borderLeft: `4px solid ${getQualifyingBorderColor(idx)}` }}
                        >
                          <td className="team-pos">{idx + 1}</td>
                          <td>
                            <div className="team-cell">
                              <span className={`fi fi-${team.flagCode} flag-icon standings-flag`}></span>
                              <span className="standings-team-name" title={team.name}>
                                {team.name}
                              </span>
                              {team.owner && (
                                <button 
                                  className="team-owner-btn"
                                  onClick={() => onParticipantClick(team.owner.name)}
                                  title={`Click to show ${team.owner.name}'s portfolio`}
                                >
                                  <ParticipantAvatar participant={team.owner} size="20px" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="team-stat">{team.mp}</td>
                          <td className="team-stat pts">{team.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Legend Footer */}
        <div className="drawer-legend">
          <div className="legend-item">
            <span className="legend-indicator green"></span>
            <span>Top 2 (Automatic Qualify)</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator yellow"></span>
            <span>3rd Place (Potential Qualify)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
