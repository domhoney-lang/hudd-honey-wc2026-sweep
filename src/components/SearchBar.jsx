import React from 'react';

export default function SearchBar({ searchTerm, onSearchChange, sortBy, onSortChange, globalFlip, onFlipToggle }) {
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
      <div className="sort-buttons">
        <button 
          className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => onSortChange('name')}
        >
          Sort by Name
        </button>
        <button 
          className={`sort-btn ${sortBy === 'odds' ? 'active' : ''}`}
          onClick={() => onSortChange('odds')}
        >
          Sort by Odds
        </button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
        <button 
          className="sort-btn"
          onClick={onFlipToggle}
          style={{ color: globalFlip ? 'var(--color-primary)' : 'inherit' }}
        >
          {globalFlip ? 'Unflip Cards' : 'Flip Cards'}
        </button>
      </div>
    </div>
  );
}
