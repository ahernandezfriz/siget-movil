// src/components/ui/SearchBar.jsx
import React from 'react';

function SearchBar({ searchTerm, onSearchChange, placeholder }) {
    return (
        <div className="search-bar-container">
            <input
                type="text"
                className="search-input"
                placeholder={placeholder || "Buscar..."}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    );
}

export default SearchBar;