import React, { useState } from 'react';

export default function ParticipantCard({ id, name, initials, color, countries, style }) {
  const isEliminated = countries.length > 0 && countries.every(c => c.status === 'eliminated');
  
  // Try loading .jpg first. If it fails, the onError handler will try .png, then fallback.
  const [imgSrc, setImgSrc] = useState(`/avatars/${name.toLowerCase()}.jpg`);
  const [useFallback, setUseFallback] = useState(false);

  const handleImgError = () => {
    if (imgSrc.endsWith('.jpg')) {
      setImgSrc(`/avatars/${name.toLowerCase()}.png`);
    } else if (imgSrc.endsWith('.png')) {
      // Also try .jpeg just in case!
      setImgSrc(`/avatars/${name.toLowerCase()}.jpeg`);
    } else {
      setUseFallback(true);
    }
  };

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

  return (
    <div className={`participant-card stagger-fade-in ${isEliminated ? 'eliminated-card' : ''}`} style={{ ...style, '--card-color': color, '--card-color-glow': `${color}4D` }}>
      <div className="card-header">
        {!useFallback ? (
          <img 
            src={imgSrc} 
            alt={name} 
            onError={handleImgError}
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              border: `2px solid ${color}`,
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0
            }}
          />
        ) : (
          <div className="avatar" style={{ backgroundColor: color }}>
            {initials}
          </div>
        )}
        <h3 className="participant-name">{name}</h3>
      </div>
      <div className="countries-list">
        {countries.map((country) => (
          <div 
            key={country.code} 
            className={`country-toggle ${country.status}`}
            title={`${country.name} - ${country.status}`}
            style={{ cursor: 'default' }}
          >
            <span className={`fi fi-${country.code} flag-icon`}></span>
            <span className="country-name">{country.name}</span>
            {country.status === 'active' && country.price && (
              <span className={`odds-badge slide-in ${getOddsTier(country.price)}`}>
                [{decimalToFraction(country.price)}]
              </span>
            )}
            {country.status === 'eliminated' && <span className="eliminated-badge slide-in">Eliminated</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
