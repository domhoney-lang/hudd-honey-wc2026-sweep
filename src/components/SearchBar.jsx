import React from 'react';

export default function SearchBar({ searchTerm, onSearchChange, sortBy, onSortChange, globalFlip, onFlipToggle, onOpenDrawer }) {
  return (
    <div className="controls-container">
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a participant or country..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="search-clear-btn" 
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      <div className="filter-controls-group">
        <div className="sort-buttons" style={{ alignItems: 'center' }}>
          <span style={{ paddingLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort</span>
          <button 
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => onSortChange('name')}
          >
            Name
          </button>
          <button 
            className={`sort-btn ${sortBy === 'odds' ? 'active' : ''}`}
            onClick={() => onSortChange('odds')}
          >
            Odds
          </button>
          <button 
            className={`sort-btn ${sortBy === 'match' ? 'active' : ''}`}
            onClick={() => onSortChange('match')}
          >
            Next Match
          </button>
        </div>
        
        <div className="action-buttons">
          <button 
            className="sort-btn"
            onClick={onFlipToggle}
            style={{ color: globalFlip ? 'var(--color-primary)' : 'inherit' }}
          >
            {globalFlip ? 'Unflip Cards' : 'Flip Cards'}
          </button>
          <button 
            className="sort-btn"
            onClick={onOpenDrawer}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span>🏆</span> Group Tables
          </button>
        </div>
      </div>
    </div>
  );
}
