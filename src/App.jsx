import React, { useState, useEffect } from 'react';
import { initialParticipants, THE_ODDS_API_KEY } from './data';
import PrizePool from './components/PrizePool';
import SearchBar from './components/SearchBar';
import Leaderboard from './components/Leaderboard';

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

export default function App() {
  const [participants, setParticipants] = useState(initialParticipants);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOdds() {
      if (!THE_ODDS_API_KEY || THE_ODDS_API_KEY === 'YOUR_API_KEY_HERE') {
        return;
      }

      const CACHE_KEY = 'oddsDataCache';
      const CACHE_TIME_KEY = 'oddsDataTimestamp';
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      const applyOddsMap = (oddsMap) => {
        setParticipants(prev => prev.map(p => ({
          ...p,
          countries: p.countries.map(c => {
             const normalizedKey = normalizeCountryName(c.name);
             const price = oddsMap[normalizedKey];
             
             if (price === undefined) {
                return { ...c, status: 'eliminated', eliminatedAt: c.eliminatedAt || Date.now(), price: null };
             } else {
                return { ...c, status: 'active', eliminatedAt: null, price: price };
             }
          })
        })));
      };

      // Check LocalStorage Cache
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

      if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < ONE_DAY_MS)) {
        try {
          const oddsMap = JSON.parse(cachedData);
          applyOddsMap(oddsMap);
          return; // Skip the API fetch because we have fresh cache
        } catch(e) {
          console.error("Failed to parse cached odds data", e);
        }
      }

      setLoading(true);
      setError(null);
      
      try {
        const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup_winner/odds/?apiKey=${THE_ODDS_API_KEY}&regions=uk&markets=outrights&oddsFormat=decimal`;
        const response = await fetch(url);
        
        if (response.status === 401) throw new Error("Invalid API Key");
        if (response.status === 429) throw new Error("API Rate Limit Exceeded");
        if (!response.ok) throw new Error("Failed to fetch live odds data");
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
          throw new Error("No World Cup outrights market found at this time");
        }

        const event = data[0];
        const bookies = event.bookmakers;
        
        if (!bookies || bookies.length === 0) {
           throw new Error("No bookmaker data available");
        }

        let selectedBookie = bookies.find(b => b.key === 'bet365') 
                          || bookies.find(b => b.key === 'skybet') 
                          || bookies.find(b => b.key === 'williamhill') 
                          || bookies[0];

        const outrightMarket = selectedBookie.markets.find(m => m.key === 'outrights');
        
        if (!outrightMarket || !outrightMarket.outcomes) {
          throw new Error("Outrights market data is empty");
        }

        const oddsMap = {};
        outrightMarket.outcomes.forEach(outcome => {
           oddsMap[normalizeCountryName(outcome.name)] = outcome.price;
        });

        // Save to cache for 24 hours
        localStorage.setItem(CACHE_KEY, JSON.stringify(oddsMap));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

        applyOddsMap(oddsMap);

      } catch (err) {
        console.error(err);
        setError(err.message || "An error occurred fetching live data.");
      } finally {
        setLoading(false);
      }
    }

    fetchOdds();
  }, []);

  return (
    <div className="container">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/960px-2026_FIFA_World_Cup_emblem.svg.png" alt="FIFA World Cup 2026 Logo" style={{ height: '80px', objectFit: 'contain' }} />
          <h1 className="title" style={{ marginBottom: 0 }}>Hudd Honey Sweepstake</h1>
        </div>
        {error && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
        <PrizePool participants={participants} />
      </header>
      
      <main>
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        {loading ? (
           <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>
             Fetching live odds from The Odds API...
           </div>
        ) : (
          <Leaderboard 
            participants={participants} 
            searchTerm={searchTerm} 
            sortBy={sortBy}
          />
        )}
      </main>
    </div>
  );
}
