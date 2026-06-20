import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyTeamStatusOverrides,
  normalizeCountryName,
  parseManualTeamStatusCsv,
} from './teamStatus.js';

const participants = [
  {
    id: 1,
    name: 'Test',
    initials: 'TE',
    color: '#000',
    countries: [
      { name: 'United States', code: 'us', status: 'active' },
      { name: "Cote d'Ivoire", code: 'ci', status: 'active' },
      { name: 'South Korea', code: 'kr', status: 'active' },
    ],
  },
];

test('normalizes common CSV country name variants', () => {
  assert.equal(normalizeCountryName('USA'), 'united states');
  assert.equal(normalizeCountryName('Korea Republic'), 'south korea');
  assert.equal(normalizeCountryName('C\u00f4te d\u2019Ivoire'), "cote d'ivoire");
});

test('parses manual CSV statuses and UK eliminated dates', () => {
  const csv = [
    'Country,Status,EliminatedAt',
    'USA,ELIMINATED,20/06/2026',
    'C\u00f4te d\u2019Ivoire,active,',
    'Korea Republic,eliminated,1/7/2026',
  ].join('\n');

  const statusMap = parseManualTeamStatusCsv(csv, participants);

  assert.equal(statusMap['united states'].status, 'eliminated');
  assert.equal(new Date(statusMap['united states'].eliminatedAt).getFullYear(), 2026);
  assert.equal(new Date(statusMap['united states'].eliminatedAt).getMonth(), 5);
  assert.equal(new Date(statusMap['united states'].eliminatedAt).getDate(), 20);
  assert.equal(statusMap["cote d'ivoire"].status, 'active');
  assert.equal(statusMap["cote d'ivoire"].eliminatedAt, null);
  assert.equal(new Date(statusMap['south korea'].eliminatedAt).getDate(), 1);
});

test('manual status overrides odds-derived status while preserving odds prices', () => {
  const csv = [
    'Country,Status,EliminatedAt',
    'USA,eliminated,20/06/2026',
    'C\u00f4te d\u2019Ivoire,active,',
  ].join('\n');
  const statusMap = parseManualTeamStatusCsv(csv, participants);
  const merged = applyTeamStatusOverrides(
    participants,
    { 'united states': 7, 'south korea': 34 },
    statusMap,
    123
  );
  const countries = merged[0].countries;

  assert.equal(countries.find(country => country.name === 'United States').status, 'eliminated');
  assert.equal(countries.find(country => country.name === 'United States').price, 7);
  assert.equal(countries.find(country => country.name === "Cote d'Ivoire").status, 'active');
  assert.equal(countries.find(country => country.name === "Cote d'Ivoire").price, null);
  assert.equal(countries.find(country => country.name === 'South Korea').status, 'active');
  assert.equal(countries.find(country => country.name === 'South Korea').price, 34);
});
