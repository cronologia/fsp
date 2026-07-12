#!/usr/bin/env node
'use strict';
/**
 * validate-data.js — zero-dependency schema check for the project's data files.
 *
 * Validates data/forum.json and data/countries/*.json against the expected
 * shape (required fields, types, enums). Prints all problems and exits non-zero
 * if any are found, so CI can gate on it.
 *
 * Usage: node scripts/validate-data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isBool = (v) => typeof v === 'boolean';
const isArr = (v) => Array.isArray(v);

function err(file, msg) {
  errors.push(`${file}: ${msg}`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch (e) {
    err(file, `invalid JSON — ${e.message}`);
    return null;
  }
}

// ---- forum.json -----------------------------------------------------------
function validateForum() {
  const f = 'data/forum.json';
  const d = readJson(f);
  if (!d) return;

  if (!d.meta || !isStr(d.meta.title)) err(f, 'meta.title missing');

  if (!isArr(d.meetings) || d.meetings.length === 0) {
    err(f, 'meetings[] missing or empty');
  } else {
    d.meetings.forEach((m, i) => {
      const at = `meetings[${i}]`;
      if (!isStr(m.edition)) err(f, `${at}.edition missing`);
      if (!isNum(m.year)) err(f, `${at}.year must be a number`);
      if (!isStr(m.city)) err(f, `${at}.city missing`);
      if (!isStr(m.country)) err(f, `${at}.country missing`);
      if (!isBool(m.datesVerified)) err(f, `${at}.datesVerified must be boolean`);
      if (m.declarationUrl !== undefined && !isStr(m.declarationUrl)) err(f, `${at}.declarationUrl must be a string`);
      if (m.numbered !== undefined && !isBool(m.numbered)) err(f, `${at}.numbered must be boolean`);
      if (m.editionVerified !== undefined && !isBool(m.editionVerified)) err(f, `${at}.editionVerified must be boolean`);
    });
  }

  if (!isArr(d.parties)) err(f, 'parties[] missing');
  else d.parties.forEach((p, i) => {
    if (!isStr(p.country)) err(f, `parties[${i}].country missing`);
    if (!isStr(p.name)) err(f, `parties[${i}].name missing`);
    if (!(p.founding === true || p.founding === false || p.founding === null)) err(f, `parties[${i}].founding must be true/false/null`);
  });

  const refIds = new Set();
  if (!isArr(d.references)) err(f, 'references[] missing');
  else d.references.forEach((r, i) => {
    if (!isStr(r.id)) err(f, `references[${i}].id missing (stable ids are required)`);
    else if (refIds.has(r.id)) err(f, `references[${i}].id duplicate: ${r.id}`);
    else refIds.add(r.id);
    if (!isStr(r.title)) err(f, `references[${i}].title missing`);
    if (!isStr(r.url)) err(f, `references[${i}].url missing`);
  });

  // sources[] entries must be a known reference id or a raw http(s) URL.
  const checkSources = (sources, at) => {
    if (sources === undefined) return;
    if (!isArr(sources)) { err(f, `${at} must be an array`); return; }
    sources.forEach((s, i) => {
      if (!isStr(s)) err(f, `${at}[${i}] must be a string`);
      else if (!refIds.has(s) && !/^https?:\/\//.test(s)) err(f, `${at}[${i}] is neither a known reference id nor a URL: ${s}`);
    });
  };
  (d.formation && d.formation.items || []).forEach((it, i) => checkSources(it.sources, `formation.items[${i}].sources`));
  if (d.organization) checkSources(d.organization.sources, 'organization.sources');
}

// ---- countries/*.json -----------------------------------------------------
const COURT_TYPES = new Set(['founding', 'reform', 'packing', 'purge', 'composition']);

function validateCountry(file, d) {
  if (!d) return;
  if (!isStr(d.country)) err(file, 'country missing');
  if (!isStr(d.code)) err(file, 'code missing');

  if (!isArr(d.presidentialSuccession) || d.presidentialSuccession.length === 0) {
    err(file, 'presidentialSuccession[] missing or empty');
  } else {
    d.presidentialSuccession.forEach((p, i) => {
      const at = `presidentialSuccession[${i}]`;
      if (!isStr(p.name)) err(file, `${at}.name missing`);
      if (!isStr(p.party)) err(file, `${at}.party missing`);
      if (!isBool(p.fsp)) err(file, `${at}.fsp must be boolean`);
    });
  }

  const sc = d.supremeCourt;
  if (!sc || !isStr(sc.name)) err(file, 'supremeCourt.name missing');
  else {
    if (!isBool(sc.verified)) err(file, 'supremeCourt.verified must be boolean');
    if (sc.courtHistory !== undefined) {
      if (!isArr(sc.courtHistory)) err(file, 'supremeCourt.courtHistory must be an array');
      else sc.courtHistory.forEach((h, i) => {
        const at = `supremeCourt.courtHistory[${i}]`;
        if (!isStr(h.period)) err(file, `${at}.period missing`);
        if (!COURT_TYPES.has(h.type)) err(file, `${at}.type invalid (${h.type})`);
        if (!isStr(h.event)) err(file, `${at}.event missing`);
        if (!isBool(h.verified)) err(file, `${at}.verified must be boolean`);
      });
    }
    if (sc.justices !== undefined) {
      if (!isArr(sc.justices)) err(file, 'supremeCourt.justices must be an array');
      else sc.justices.forEach((j, i) => {
        const at = `supremeCourt.justices[${i}]`;
        if (!isStr(j.name)) err(file, `${at}.name missing`);
        if (!isStr(j.appointedBy)) err(file, `${at}.appointedBy missing`);
        if (!isBool(j.fspAppointed)) err(file, `${at}.fspAppointed must be boolean`);
      });
    }
  }
}

function validateCountries() {
  const dir = path.join(ROOT, 'data', 'countries');
  let index;
  try {
    index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  } catch (e) {
    err('data/countries/index.json', `invalid/missing — ${e.message}`);
    return;
  }
  for (const c of index.countries || []) {
    const rel = `data/countries/${c.code}.json`;
    validateCountry(rel, readJson(rel));
  }
}

validateForum();
validateCountries();

if (errors.length) {
  console.error(`✗ data validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('✓ data validation passed (forum.json + country files).');
