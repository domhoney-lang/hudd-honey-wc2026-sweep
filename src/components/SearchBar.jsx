import React from 'react';

export default function SearchBar({ searchTerm, onSearchChange, sortBy, onSortChange }) {
  return (
    <div className="controls-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search for a participant or country..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
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
      </div>
    </div>
  );
}
