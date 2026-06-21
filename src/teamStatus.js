import Papa from 'papaparse';

export const normalizeCountryName = (name) => {
  if (!name) return '';

  const lower = String(name)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ');

  if (lower === 'korea republic' || lower === 'republic of korea' || lower === 'south korea') return 'south korea';
  if (lower === 'usa' || lower === 'united states of america') return 'united states';
  if (lower === 'dr congo' || lower === 'drc' || lower === 'democratic republic of the congo') return 'congo dr';
  if (lower === 'cape verde') return 'cape verde islands';
  if (lower === 'bosnia and herzegovina' || lower === 'bosnia-herzegovina') return 'bosnia & herzegovina';
  if (lower === 'ivory coast' || lower === "cote d'ivoire") return "cote d'ivoire";
  if (lower === 'czechia') return 'czech republic';
  if (lower === 'turkiye') return 'turkey';

  return lower;
};

export const parseEliminatedAt = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const ukMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, dayText, monthText, yearText] = ukMatch;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const parsed = new Date(year, month - 1, day);

    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return parsed.getTime();
    }
  }

  const timestamp = Date.parse(trimmed);
  if (!Number.isNaN(timestamp)) return timestamp;

  throw new Error(`Invalid EliminatedAt date: ${trimmed}`);
};

const parseStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'eliminated') return normalized;
  throw new Error(`Invalid team status: ${value}`);
};

const getKnownCountryKeys = (participants) => new Set(
  participants.flatMap(participant => participant.countries.map(country => normalizeCountryName(country.name)))
);

export const parseManualTeamStatusCsv = (csvText, participants) => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map(error => error.message).join('; '));
  }

  const fields = new Set(parsed.meta.fields || []);
  ['Country', 'Status', 'EliminatedAt'].forEach(field => {
    if (!fields.has(field)) {
      throw new Error(`Manual team status CSV is missing ${field}`);
    }
  });

  const knownCountryKeys = getKnownCountryKeys(participants);

  return parsed.data.reduce((statusMap, row) => {
    const countryKey = normalizeCountryName(row.Country);
    if (!countryKey || !knownCountryKeys.has(countryKey)) return statusMap;

    const status = parseStatus(row.Status);
    statusMap[countryKey] = {
      status,
      eliminatedAt: status === 'eliminated' ? parseEliminatedAt(row.EliminatedAt) : null,
    };

    return statusMap;
  }, {});
};

export const applyTeamStatusOverrides = (participants, oddsMap, manualStatusMap = {}, now = Date.now()) => {
  const hasOddsMap = oddsMap && typeof oddsMap === 'object';

  return participants.map(participant => ({
    ...participant,
    countries: participant.countries.map(country => {
      const countryKey = normalizeCountryName(country.name);
      const hasOddsPrice = hasOddsMap && oddsMap[countryKey] !== undefined && oddsMap[countryKey] !== null;

      let status = country.status;
      let eliminatedAt = country.eliminatedAt || null;
      let price = hasOddsMap ? null : country.price;

      if (hasOddsMap) {
        price = hasOddsPrice ? oddsMap[countryKey] : null;
        status = hasOddsPrice ? 'active' : 'eliminated';
        eliminatedAt = hasOddsPrice ? null : eliminatedAt || now;
      }

      const manualStatus = manualStatusMap[countryKey];
      if (manualStatus) {
        status = manualStatus.status;
        eliminatedAt = manualStatus.status === 'eliminated' ? manualStatus.eliminatedAt || eliminatedAt || now : null;
      }

      return {
        ...country,
        status,
        eliminatedAt,
        price,
      };
    }),
  }));
};
