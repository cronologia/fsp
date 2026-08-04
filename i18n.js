'use strict';
/**
 * i18n.js — the multi-language layer for the fsp compiler (core#9).
 *
 * fsp keeps its own compiler (unlike the template-swap adopters); this module
 * carries everything locale-shaped so build.js stays one readable diff:
 * the chrome-string tables (UI), the data-localization walk, the switcher /
 * hreflang / disclaimer / redirect-stub renderers, and the sitemap.
 *
 * Model (identical to the family's, core#9):
 *  - English is authoritative and authored in data/ and in build.js/UI.en.
 *  - data/i18n/{es,pt}.json are committed, exact-English-string-keyed caches;
 *    a missing key falls back to English (translate.js --stats reports it).
 *  - NEVER localized: references[], party/person/org names, country and city
 *    names (join keys and proper names), rosters, URLs, the document vault.
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'es', 'pt'];
const BASE = 'https://cronologia.github.io/fsp/';
const I18N_DIR = path.join(__dirname, 'data', 'i18n');

// Data keys whose string values are translatable prose. Derived empirically
// from the datasets, then pruned of everything name-like: 'orgs', 'name',
// 'party', 'fspParty', 'current', 'led', 'delegation', 'foundingOnly',
// 'fspPresidents', 'heads', 'appointingGovernment', 'appointedBy', 'chamber',
// 'chamberName', 'work', 'publisher', 'originalName', 'country', 'city' are
// deliberately ABSENT — a mangled proper name is worse than an English one,
// and c.country is the countries<->forum join key.
const TRANSLATABLE_KEYS = new Set([
  'subtitle', 'description', 'dataQualityNote',
  'note', 'notes', 'text', 'detail', 'summary',
  'seats', 'event', 'appointmentMethod', 'fspEraChanges', 'background',
  'stillServing', 'justicesNote', 'fspStatus', 'status',
  'nature', 'designation', 'fspRole', 'currentStatus', 'whatItIs', 'fspLink',
  'composition', 'relationToForum', 'thesis',
  'renamed', 'convenedBy', 'context', 'attendance',
  'compositionNote', 'compositionTitle', 'scale', 'presidencyNote', 'seeAlso',
  'dataQuality', 'members', 'foro', 'puebla', 'period', 'founded',
  'place', 'dimension', 'venue',
]);

/** Committed translation cache ({ english: translated }); {} for English. */
function loadDict(lang) {
  if (lang === 'en') return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${lang}.json`), 'utf8'));
    return (parsed && parsed.strings) || {};
  } catch {
    return {};
  }
}

/** dict hit, else the English source string (the family's fallback rule). */
function translator(dict) {
  return (s) => (s !== null && s !== undefined && Object.prototype.hasOwnProperty.call(dict, s) ? dict[s] : s);
}

/** The narrow allowlist that applies INSIDE `references` (core template).
 *
 * A reference NAMES its source and also CHARACTERISES it. The name is
 * bibliography and stays verbatim; the characterisation is this project
 * writing in its own voice, and it must read in the page's language.
 *
 *   `publisherNote` — the parenthetical that was glued to `publisher`:
 *                     "official", "compiled by Mídia Sem Máscara", "re-upload".
 *   `type`          — in most family repos a closed vocabulary that belongs in
 *                     the chrome table. NOT here: this project's types are
 *                     written as prose — "video (interview, critical)",
 *                     "analysis (Foro vs. Puebla Group)", "book (insider)" —
 *                     and they carry the stance judgement that lets a reader
 *                     weigh a source. Nineteen of them rendered in English on
 *                     the Spanish and Portuguese pages.
 *
 * An allowlist rather than a boolean: a new key inside a reference stays
 * untranslated by default, which is the safe direction for citation data.
 */
const REFERENCE_TRANSLATABLE = new Set(['publisherNote', 'type']);

/**
 * Deep-copy `value` with every TRANSLATABLE_KEYS string routed through the
 * dict. `references` subtrees pass through verbatim (bibliography) EXCEPT for
 * REFERENCE_TRANSLATABLE, and `membershipRosters` keep their org-name lists
 * untouched — only each roster's editorial `title` and `note` are prose and go
 * through the dict. With an empty dict this is an identity copy, so the
 * English build is unchanged by construction.
 */
function localizeDeep(value, dict) {
  const t = translator(dict);
  const walk = (v, k, inRefs) => {
    const keys = inRefs ? REFERENCE_TRANSLATABLE : TRANSLATABLE_KEYS;
    const refs = inRefs || k === 'references';
    if (!refs && k === 'membershipRosters' && Array.isArray(v)) {
      return v.map((r) => (r && typeof r === 'object' ? { ...r, title: t(r.title), note: t(r.note) } : r));
    }
    if (Array.isArray(v)) return v.map((x) => walk(x, k, refs));
    if (v && typeof v === 'object') {
      const out = {};
      for (const kk of Object.keys(v)) out[kk] = walk(v[kk], kk, refs);
      return out;
    }
    if (typeof v === 'string' && keys.has(k)) return t(v);
    return v;
  };
  return walk(value, null, false);
}

/* ---------------------------------------------------------------------------
 * Chrome strings. Everything build.js emits itself (headings, table headers,
 * nav, control labels, flag titles). English is the key-free source table;
 * es/pt are authored here, next to it, so a new chrome string fails loudly
 * (undefined) instead of silently shipping English.
 * ------------------------------------------------------------------------- */
const UI = {
  en: {
    langLabel: 'Language',
    disclaimer: '',
    // nav
    navMap: 'Map', navPresidential: 'Presidential', navLegislative: 'Legislative', navCourts: 'Courts',
    navOrigins: 'Origins', navTimeline: 'Timeline', navMeetings: 'Meetings', navDocuments: 'Documents',
    navParties: 'Parties', navArmed: 'Armed movements', navRegional: 'Regional bodies',
    navGovernment: 'In government', navStructure: 'Structure', navCountries: 'Countries',
    navAnalyses: 'Analyses', navReferences: 'References',
    // section headings
    hGrids: 'The grids, year by year', hAnalyses: 'Analyses &amp; perspectives',
    hArmed: 'Armed &amp; guerrilla movements in the Forum', hBench: 'Bench control by appointing government',
    hCountries: 'Countries', hCourtComposition: 'Court composition — by appointing government',
    hCourtHistory: 'Court history (1990–present)', hDocuments: 'Documents (declarations &amp; atas)',
    hFspCoverage: 'FSP presidential coverage, year by year', hFounding: 'Founding',
    hInterventions: 'High-court interventions, year by year',
    hSeatsByGov: 'High-court seats by appointing government, year by year',
    hLegComposition: 'Legislative composition', hLegControl: 'Legislative control, year by year',
    hMeeting: 'Meeting', hMeetings: 'Meetings (Encontros)', hMembersGov: 'Member parties in government',
    hStructure: 'Organization &amp; structure', hParties: 'Parties &amp; organizations',
    hPresidential: 'Presidential succession (1990–present)', hRegional: 'Regional integration bodies',
    hReferences: 'References', hTimeline: 'Timeline at a glance', hAtlas: 'The map, year by year',
    hVsPuebla: 'Foro de São Paulo vs. Grupo de Puebla', hMembership: 'Membership over time',
    hParticipating: 'Participating countries',
    // table headers
    thAlignment: 'Alignment', thAppointedBy: 'Appointed by (party)', thApptYear: 'Appt. year',
    thBackground: 'Background', thChange: 'Change', thCity: 'City', thControl: 'Control',
    thCountry: 'Country', thDates: 'Dates', thDeclDateline: 'Declaration dateline', thDeclaration: 'Declaration',
    thDocuments: 'Documents', thEdition: 'Edition', thFspStatus: 'FSP status', thFspAppointees: 'FSP-era appointees',
    thFsp: 'Foro de São Paulo', thFullName: 'Full name', thGovernment: 'Government', thPuebla: 'Grupo de Puebla',
    thHeads: 'Heads of state (party)', thJustice: 'Justice', thNotesSources: 'Notes &amp; sources', thNotes: 'Notes',
    thNo: 'Nº', thParty: 'Party', thPeriod: 'Period', thPresident: 'President', thYear: 'Year', thYears: 'Years',
    thSeats: 'Seats', thStatus: 'Status', thText: 'Text', thPdf: 'PDF',
    // inline words & legends (seat bars, alignment cells, roster headings)
    wordYes: 'yes', wordNo: 'no', wordSeats: 'seats', wordMajority: 'majority', wordOf: 'of',
    wordOrganizations: 'organizations', wordCountries: 'countries',
    alignGovernment: 'Government', alignOpposition: 'Opposition',
    alignMixed: 'Mixed / centrão', alignIndependent: 'Independent',
    legFspParty: 'FSP party', legGovAlly: 'Government ally', legMajLine: 'Majority line',
    // controls / aria / titles
    play: '▶ Play', pause: '❚❚ Pause', playAria: 'Play through the years',
    searchMeetings: 'Search meetings', searchPlaceholder: 'Search city, country, notes…',
    filterCountry: 'Filter by country', sortYear: 'Sort by year', yearAria: 'Year',
    gridsAria: 'Year-by-year grids', allCountries: 'All countries',
    meetingsCount: '{n} of {m} meetings', atlasShowing: 'Showing {year} — {count} of {total} electoral countries FSP-governed (Cuba, one-party, shown separately). Hover or tap a country for its president.',
    tFinalDeclaration: 'Final declaration', tWayback: 'Internet Archive Wayback Machine snapshot',
    tSnapshot: 'Internet Archive snapshot', tPreserved: 'Preserved copy stored in this repository',
    tExternal: 'external source', tNotVerified: 'dates not verified against a primary source',
    tEditionNotVerified: 'edition not yet verified against a primary source',
    tParticipationNotVerified: 'Forum participation / details not yet verified against a primary source',
    tBroad: 'broad characterization; verify against a primary source',
    tReported: 'reported / attributed, not independently sourced here',
    tReportedForum: 'reported by the Forum / affiliated sources; to verify',
    tInterventionsPerYear: 'Interventions per year', tMajorityBenches: 'Majority-FSP-appointed benches per year',
    tLegMajorities: 'FSP legislative majorities per year',
    dInterventions: 'Number of high-court interventions across tracked countries that year',
    dLegMajority: 'Countries with an FSP legislative majority that year',
    dBenchMajority: 'Countries whose bench had a majority appointed under FSP-era governments that year',
    savedCopy: 'saved copy', official: 'official', archivedWord: 'archived', sourcesWord: 'Sources',
    backToIndex: '← Foro de São Paulo — Cronologia', backToMeetings: '← All meetings',
    // added during the multi-locale refactor (chrome literals that had no key)
    hRelated: 'Related organizations', hHighCourt: 'High court', thType: 'Type',
    tWaybackShort: 'Wayback Machine snapshot', declarationWord: 'declaration', snapshotWord: 'snapshot',
    pdfLocalCopy: 'PDF (local copy)', tUnknownSource: 'unknown source id',
    tabCourts: 'Court interventions', tabCourtBench: 'Court bench',
    atlasCaptionStatic: 'Showing {year}. Hover, tap or focus a country for its president that year.',
    chipMap: 'Member map by year', chipPresidencies: 'Presidencies', chipLegislatures: 'Legislatures',
    chipDeclarations: 'Declarations', lastUpdatedLabel: 'Last updated', dataQualityLabel: 'Data quality note',
    dtFirstMeeting: 'First meeting', dtPlace: 'Place', dtVenue: 'Venue', dtConvenedBy: 'Convened by',
    dtOriginalName: 'Original name', dtRenamed: 'Renamed', dtContext: 'Context', dtAttendance: 'Attendance',
    dtHostCity: 'Host city', dtOfficialPdf: 'Official PDF', dtForumPages: "Forum's own pages",
    notNumbered: 'Not part of the official numbered series', toVerify: 'to verify', yearOnly: 'year only',
    notRecovered: 'Not recovered yet — see issue tracker', localPreservedCopy: 'Local preserved copy',
    geoblockNote: 'the official site is geoblocked to non-Brazilian IPs — use the archived copy',
    backToFspMeetings: '← Foro de São Paulo — Meetings', backAllMeetings: 'Back to all meetings',
    backToChronology: 'Back to the chronology',
    countrySubtitle: 'Presidential succession since 1990 &amp; the high court',
    countryTitleSuffix: 'FSP presidents &amp; courts',
    fspPartyLabel: 'FSP party', fspPresidentsLabel: 'FSP presidents',
    fspPresidentOne: 'FSP president', fspPresidentMany: 'FSP presidents',
    dtAppointment: 'Appointment', dtFspAppointed: 'Appointed under FSP-party govts',
    dtFspChanges: 'Changes (FSP era)', dtRemains: 'How much remains', dtVerified: 'Verified',
    verifiedYes: 'yes — sourced', verifiedNo: 'no — to verify against primary sources',
    lblFspGoverned: 'FSP-governed', lblInterventions: 'Interventions', lblFspMajority: 'FSP majority',
    lblMajorityBenches: 'Majority benches',
    capPtl: 'Hover, tap or focus a cell for the country, year and president. Each state is shown by both colour and fill, so it reads without colour.',
    capLg: "Hover, tap or focus a cell for the party's legislative standing that year.",
    capCm: 'Hover, tap or focus a cell for the court change in that country and year.',
    capCs: "Hover, tap or focus a cell for the bench's appointment provenance that year. Each state is shown by colour, fill and glyph, so it reads without colour.",
    rowNature: 'Nature', rowDesignation: 'Designation', rowFspRole: 'Role in the Forum',
    rowStatusToday: 'Status today', rowWhatItIs: 'What it is', rowMembers: 'Members',
    rowFspLink: 'Link to the Forum', rowComposition: 'Composition', rowRelation: 'Relation to the Foro',
    rowScale: 'Scale', keyFigures: 'Key figures', sourceWord: 'source',
    badgeFounding: 'founding member', badgeLater: 'later member', badgeUnknown: 'status to verify',
    tReportedFigures: 'reported figures; to verify',
  },
  es: {
    langLabel: 'Idioma',
    disclaimer: 'Traducción automática del inglés; la página en inglés es la versión de referencia.',
    navMap: 'Mapa', navPresidential: 'Presidencial', navLegislative: 'Legislativo', navCourts: 'Cortes',
    navOrigins: 'Orígenes', navTimeline: 'Línea de tiempo', navMeetings: 'Encuentros', navDocuments: 'Documentos',
    navParties: 'Partidos', navArmed: 'Movimientos armados', navRegional: 'Organismos regionales',
    navGovernment: 'En el gobierno', navStructure: 'Estructura', navCountries: 'Países',
    navAnalyses: 'Análisis', navReferences: 'Referencias',
    hGrids: 'Las cuadrículas, año por año', hAnalyses: 'Análisis y perspectivas',
    hArmed: 'Movimientos armados y guerrilleros en el Foro', hBench: 'Control del tribunal por gobierno designante',
    hCountries: 'Países', hCourtComposition: 'Composición de la corte — por gobierno designante',
    hCourtHistory: 'Historia de la corte (1990–presente)', hDocuments: 'Documentos (declaraciones y actas)',
    hFspCoverage: 'Cobertura presidencial del FSP, año por año', hFounding: 'Fundación',
    hInterventions: 'Intervenciones en altas cortes, año por año',
    hSeatsByGov: 'Escaños de altas cortes por gobierno designante, año por año',
    hLegComposition: 'Composición legislativa', hLegControl: 'Control legislativo, año por año',
    hMeeting: 'Encuentro', hMeetings: 'Encuentros', hMembersGov: 'Partidos miembros en el gobierno',
    hStructure: 'Organización y estructura', hParties: 'Partidos y organizaciones',
    hPresidential: 'Sucesión presidencial (1990–presente)', hRegional: 'Organismos regionales de integración',
    hReferences: 'Referencias', hTimeline: 'Línea de tiempo de un vistazo', hAtlas: 'El mapa, año por año',
    hVsPuebla: 'Foro de São Paulo vs. Grupo de Puebla', hMembership: 'Membresía a lo largo del tiempo',
    hParticipating: 'Países participantes',
    thAlignment: 'Alineamiento', thAppointedBy: 'Designado por (partido)', thApptYear: 'Año de design.',
    thBackground: 'Trayectoria', thChange: 'Cambio', thCity: 'Ciudad', thControl: 'Control',
    thCountry: 'País', thDates: 'Fechas', thDeclDateline: 'Data de la declaración', thDeclaration: 'Declaración',
    thDocuments: 'Documentos', thEdition: 'Edición', thFspStatus: 'Estatus FSP', thFspAppointees: 'Designados en la era FSP',
    thFsp: 'Foro de São Paulo', thFullName: 'Nombre completo', thGovernment: 'Gobierno', thPuebla: 'Grupo de Puebla',
    thHeads: 'Jefes de Estado (partido)', thJustice: 'Magistrado', thNotesSources: 'Notas y fuentes', thNotes: 'Notas',
    thNo: 'N.º', thParty: 'Partido', thPeriod: 'Período', thPresident: 'Presidente', thYear: 'Año', thYears: 'Años',
    thSeats: 'Escaños', thStatus: 'Estatus', thText: 'Texto', thPdf: 'PDF',
    // inline words & legends (seat bars, alignment cells, roster headings)
    wordYes: 'sí', wordNo: 'no', wordSeats: 'escaños', wordMajority: 'mayoría', wordOf: 'de',
    wordOrganizations: 'organizaciones', wordCountries: 'países',
    alignGovernment: 'Gobierno', alignOpposition: 'Oposición',
    alignMixed: 'Mixto / centrão', alignIndependent: 'Independiente',
    legFspParty: 'Partido del FSP', legGovAlly: 'Aliado del gobierno', legMajLine: 'Línea de mayoría',
    play: '▶ Reproducir', pause: '❚❚ Pausar', playAria: 'Reproducir los años',
    searchMeetings: 'Buscar encuentros', searchPlaceholder: 'Buscar ciudad, país, notas…',
    filterCountry: 'Filtrar por país', sortYear: 'Ordenar por año', yearAria: 'Año',
    gridsAria: 'Cuadrículas año por año', allCountries: 'Todos los países',
    meetingsCount: '{n} de {m} encuentros', atlasShowing: 'Mostrando {year} — {count} de {total} países electorales gobernados por el FSP (Cuba, de partido único, se muestra aparte). Pase el cursor o toque un país para ver su presidente.',
    tFinalDeclaration: 'Declaración final', tWayback: 'Instantánea de la Wayback Machine de Internet Archive',
    tSnapshot: 'Instantánea de Internet Archive', tPreserved: 'Copia preservada almacenada en este repositorio',
    tExternal: 'fuente externa', tNotVerified: 'fechas no verificadas contra una fuente primaria',
    tEditionNotVerified: 'edición aún no verificada contra una fuente primaria',
    tParticipationNotVerified: 'participación en el Foro / detalles aún no verificados contra una fuente primaria',
    tBroad: 'caracterización amplia; verifique contra una fuente primaria',
    tReported: 'reportado / atribuido, no verificado independientemente aquí',
    tReportedForum: 'reportado por el Foro / fuentes afines; por verificar',
    tInterventionsPerYear: 'Intervenciones por año', tMajorityBenches: 'Tribunales con mayoría designada en la era FSP por año',
    tLegMajorities: 'Mayorías legislativas FSP por año',
    dInterventions: 'Número de intervenciones en altas cortes en los países rastreados ese año',
    dLegMajority: 'Países con mayoría legislativa FSP ese año',
    dBenchMajority: 'Países cuyo tribunal tenía mayoría designada bajo gobiernos de la era FSP ese año',
    savedCopy: 'copia guardada', official: 'oficial', archivedWord: 'archivado', sourcesWord: 'Fuentes',
    backToIndex: '← Foro de São Paulo — Cronologia', backToMeetings: '← Todos los encuentros',
    // added during the multi-locale refactor (chrome literals that had no key)
    hRelated: 'Organizaciones relacionadas', hHighCourt: 'Alta corte', thType: 'Tipo',
    tWaybackShort: 'Instantánea de la Wayback Machine', declarationWord: 'declaración', snapshotWord: 'instantánea',
    pdfLocalCopy: 'PDF (copia local)', tUnknownSource: 'id de fuente desconocido',
    tabCourts: 'Intervenciones judiciales', tabCourtBench: 'Composición de la corte',
    atlasCaptionStatic: 'Mostrando {year}. Pase el cursor, toque o enfoque un país para ver su presidente ese año.',
    chipMap: 'Mapa de miembros por año', chipPresidencies: 'Presidencias', chipLegislatures: 'Legislaturas',
    chipDeclarations: 'Declaraciones', lastUpdatedLabel: 'Última actualización', dataQualityLabel: 'Nota sobre la calidad de los datos',
    dtFirstMeeting: 'Primer encuentro', dtPlace: 'Lugar', dtVenue: 'Sede', dtConvenedBy: 'Convocado por',
    dtOriginalName: 'Nombre original', dtRenamed: 'Renombrado', dtContext: 'Contexto', dtAttendance: 'Asistencia',
    dtHostCity: 'Ciudad sede', dtOfficialPdf: 'PDF oficial', dtForumPages: 'Páginas del propio Foro',
    notNumbered: 'No forma parte de la serie oficial numerada', toVerify: 'por verificar', yearOnly: 'solo año',
    notRecovered: 'Aún no recuperada — vea el gestor de incidencias', localPreservedCopy: 'Copia local preservada',
    geoblockNote: 'el sitio oficial está geobloqueado para IP fuera de Brasil — use la copia archivada',
    backToFspMeetings: '← Foro de São Paulo — Encuentros', backAllMeetings: 'Volver a todos los encuentros',
    backToChronology: 'Volver a la cronología',
    countrySubtitle: 'Sucesión presidencial desde 1990 y la alta corte',
    countryTitleSuffix: 'presidentes del FSP y cortes',
    fspPartyLabel: 'Partido FSP', fspPresidentsLabel: 'Presidentes FSP',
    fspPresidentOne: 'presidente FSP', fspPresidentMany: 'presidentes FSP',
    dtAppointment: 'Nombramiento', dtFspAppointed: 'Nombrados bajo gobiernos FSP',
    dtFspChanges: 'Cambios (era FSP)', dtRemains: 'Cuánto permanece', dtVerified: 'Verificado',
    verifiedYes: 'sí — con fuentes', verifiedNo: 'no — por verificar contra fuentes primarias',
    lblFspGoverned: 'Gobernados por el FSP', lblInterventions: 'Intervenciones', lblFspMajority: 'Mayoría FSP',
    lblMajorityBenches: 'Tribunales con mayoría',
    capPtl: 'Pase el cursor, toque o enfoque una celda para ver el país, el año y el presidente. Cada estado se muestra con color y relleno, así que se lee sin color.',
    capLg: 'Pase el cursor, toque o enfoque una celda para ver la posición legislativa del partido ese año.',
    capCm: 'Pase el cursor, toque o enfoque una celda para ver el cambio judicial en ese país y año.',
    capCs: 'Pase el cursor, toque o enfoque una celda para ver la procedencia de los nombramientos del tribunal ese año. Cada estado se muestra con color, relleno y glifo, así que se lee sin color.',
    rowNature: 'Naturaleza', rowDesignation: 'Designación', rowFspRole: 'Papel en el Foro',
    rowStatusToday: 'Estatus hoy', rowWhatItIs: 'Qué es', rowMembers: 'Miembros',
    rowFspLink: 'Vínculo con el Foro', rowComposition: 'Composición', rowRelation: 'Relación con el Foro',
    rowScale: 'Escala', keyFigures: 'Figuras clave', sourceWord: 'fuente',
    badgeFounding: 'miembro fundador', badgeLater: 'miembro posterior', badgeUnknown: 'estatus por verificar',
    tReportedFigures: 'cifras reportadas; por verificar',
  },
  pt: {
    langLabel: 'Idioma',
    disclaimer: 'Tradução automática do inglês; a página em inglês é a versão de referência.',
    navMap: 'Mapa', navPresidential: 'Presidencial', navLegislative: 'Legislativo', navCourts: 'Cortes',
    navOrigins: 'Origens', navTimeline: 'Linha do tempo', navMeetings: 'Encontros', navDocuments: 'Documentos',
    navParties: 'Partidos', navArmed: 'Movimentos armados', navRegional: 'Organismos regionais',
    navGovernment: 'No governo', navStructure: 'Estrutura', navCountries: 'Países',
    navAnalyses: 'Análises', navReferences: 'Referências',
    hGrids: 'As grades, ano a ano', hAnalyses: 'Análises e perspectivas',
    hArmed: 'Movimentos armados e guerrilheiros no Foro', hBench: 'Controle do tribunal por governo nomeante',
    hCountries: 'Países', hCourtComposition: 'Composição da corte — por governo nomeante',
    hCourtHistory: 'História da corte (1990–presente)', hDocuments: 'Documentos (declarações e atas)',
    hFspCoverage: 'Cobertura presidencial do FSP, ano a ano', hFounding: 'Fundação',
    hInterventions: 'Intervenções em altas cortes, ano a ano',
    hSeatsByGov: 'Assentos de altas cortes por governo nomeante, ano a ano',
    hLegComposition: 'Composição legislativa', hLegControl: 'Controle legislativo, ano a ano',
    hMeeting: 'Encontro', hMeetings: 'Encontros', hMembersGov: 'Partidos membros no governo',
    hStructure: 'Organização e estrutura', hParties: 'Partidos e organizações',
    hPresidential: 'Sucessão presidencial (1990–presente)', hRegional: 'Organismos regionais de integração',
    hReferences: 'Referências', hTimeline: 'Linha do tempo num relance', hAtlas: 'O mapa, ano a ano',
    hVsPuebla: 'Foro de São Paulo vs. Grupo de Puebla', hMembership: 'Composição ao longo do tempo',
    hParticipating: 'Países participantes',
    thAlignment: 'Alinhamento', thAppointedBy: 'Nomeado por (partido)', thApptYear: 'Ano da nomeação',
    thBackground: 'Trajetória', thChange: 'Mudança', thCity: 'Cidade', thControl: 'Controle',
    thCountry: 'País', thDates: 'Datas', thDeclDateline: 'Data da declaração', thDeclaration: 'Declaração',
    thDocuments: 'Documentos', thEdition: 'Edição', thFspStatus: 'Status FSP', thFspAppointees: 'Nomeados na era FSP',
    thFsp: 'Foro de São Paulo', thFullName: 'Nome completo', thGovernment: 'Governo', thPuebla: 'Grupo de Puebla',
    thHeads: 'Chefes de Estado (partido)', thJustice: 'Ministro', thNotesSources: 'Notas e fontes', thNotes: 'Notas',
    thNo: 'N.º', thParty: 'Partido', thPeriod: 'Período', thPresident: 'Presidente', thYear: 'Ano', thYears: 'Anos',
    thSeats: 'Assentos', thStatus: 'Status', thText: 'Texto', thPdf: 'PDF',
    // inline words & legends (seat bars, alignment cells, roster headings)
    wordYes: 'sim', wordNo: 'não', wordSeats: 'assentos', wordMajority: 'maioria', wordOf: 'de',
    wordOrganizations: 'organizações', wordCountries: 'países',
    alignGovernment: 'Governo', alignOpposition: 'Oposição',
    alignMixed: 'Misto / centrão', alignIndependent: 'Independente',
    legFspParty: 'Partido do FSP', legGovAlly: 'Aliado do governo', legMajLine: 'Linha da maioria',
    play: '▶ Reproduzir', pause: '❚❚ Pausar', playAria: 'Reproduzir os anos',
    searchMeetings: 'Buscar encontros', searchPlaceholder: 'Buscar cidade, país, notas…',
    filterCountry: 'Filtrar por país', sortYear: 'Ordenar por ano', yearAria: 'Ano',
    gridsAria: 'Grades ano a ano', allCountries: 'Todos os países',
    meetingsCount: '{n} de {m} encontros', atlasShowing: 'Mostrando {year} — {count} de {total} países eleitorais governados pelo FSP (Cuba, de partido único, é mostrada à parte). Passe o cursor ou toque um país para ver seu presidente.',
    tFinalDeclaration: 'Declaração final', tWayback: 'Instantâneo da Wayback Machine do Internet Archive',
    tSnapshot: 'Instantâneo do Internet Archive', tPreserved: 'Cópia preservada armazenada neste repositório',
    tExternal: 'fonte externa', tNotVerified: 'datas não verificadas contra uma fonte primária',
    tEditionNotVerified: 'edição ainda não verificada contra uma fonte primária',
    tParticipationNotVerified: 'participação no Foro / detalhes ainda não verificados contra uma fonte primária',
    tBroad: 'caracterização ampla; verifique contra uma fonte primária',
    tReported: 'reportado / atribuído, não verificado de forma independente aqui',
    tReportedForum: 'reportado pelo Foro / fontes afins; a verificar',
    tInterventionsPerYear: 'Intervenções por ano', tMajorityBenches: 'Tribunais com maioria nomeada na era FSP por ano',
    tLegMajorities: 'Maiorias legislativas FSP por ano',
    dInterventions: 'Número de intervenções em altas cortes nos países rastreados naquele ano',
    dLegMajority: 'Países com maioria legislativa FSP naquele ano',
    dBenchMajority: 'Países cujo tribunal tinha maioria nomeada sob governos da era FSP naquele ano',
    savedCopy: 'cópia preservada', official: 'oficial', archivedWord: 'arquivado', sourcesWord: 'Fontes',
    backToIndex: '← Foro de São Paulo — Cronologia', backToMeetings: '← Todos os encontros',
    // added during the multi-locale refactor (chrome literals that had no key)
    hRelated: 'Organizações relacionadas', hHighCourt: 'Alta corte', thType: 'Tipo',
    tWaybackShort: 'Instantâneo da Wayback Machine', declarationWord: 'declaração', snapshotWord: 'instantâneo',
    pdfLocalCopy: 'PDF (cópia local)', tUnknownSource: 'id de fonte desconhecido',
    tabCourts: 'Intervenções judiciais', tabCourtBench: 'Composição da corte',
    atlasCaptionStatic: 'Mostrando {year}. Passe o cursor, toque ou foque um país para ver seu presidente naquele ano.',
    chipMap: 'Mapa de membros por ano', chipPresidencies: 'Presidências', chipLegislatures: 'Legislativos',
    chipDeclarations: 'Declarações', lastUpdatedLabel: 'Última atualização', dataQualityLabel: 'Nota sobre a qualidade dos dados',
    dtFirstMeeting: 'Primeiro encontro', dtPlace: 'Local', dtVenue: 'Sede', dtConvenedBy: 'Convocado por',
    dtOriginalName: 'Nome original', dtRenamed: 'Renomeado', dtContext: 'Contexto', dtAttendance: 'Presença',
    dtHostCity: 'Cidade-sede', dtOfficialPdf: 'PDF oficial', dtForumPages: 'Páginas do próprio Foro',
    notNumbered: 'Não faz parte da série oficial numerada', toVerify: 'a verificar', yearOnly: 'apenas ano',
    notRecovered: 'Ainda não recuperada — veja o rastreador de issues', localPreservedCopy: 'Cópia local preservada',
    geoblockNote: 'o site oficial é geobloqueado para IPs de fora do Brasil — use a cópia arquivada',
    backToFspMeetings: '← Foro de São Paulo — Encontros', backAllMeetings: 'Voltar a todos os encontros',
    backToChronology: 'Voltar à cronologia',
    countrySubtitle: 'Sucessão presidencial desde 1990 e a alta corte',
    countryTitleSuffix: 'presidentes do FSP e cortes',
    fspPartyLabel: 'Partido FSP', fspPresidentsLabel: 'Presidentes FSP',
    fspPresidentOne: 'presidente FSP', fspPresidentMany: 'presidentes FSP',
    dtAppointment: 'Nomeação', dtFspAppointed: 'Nomeados sob governos FSP',
    dtFspChanges: 'Mudanças (era FSP)', dtRemains: 'Quanto permanece', dtVerified: 'Verificado',
    verifiedYes: 'sim — com fontes', verifiedNo: 'não — a verificar contra fontes primárias',
    lblFspGoverned: 'Governados pelo FSP', lblInterventions: 'Intervenções', lblFspMajority: 'Maioria FSP',
    lblMajorityBenches: 'Tribunais com maioria',
    capPtl: 'Passe o cursor, toque ou foque uma célula para ver o país, o ano e o presidente. Cada estado é mostrado com cor e preenchimento, então pode ser lido sem cor.',
    capLg: 'Passe o cursor, toque ou foque uma célula para ver a posição legislativa do partido naquele ano.',
    capCm: 'Passe o cursor, toque ou foque uma célula para ver a mudança judicial naquele país e ano.',
    capCs: 'Passe o cursor, toque ou foque uma célula para ver a proveniência das nomeações do tribunal naquele ano. Cada estado é mostrado com cor, preenchimento e glifo, então pode ser lido sem cor.',
    rowNature: 'Natureza', rowDesignation: 'Designação', rowFspRole: 'Papel no Foro',
    rowStatusToday: 'Status hoje', rowWhatItIs: 'O que é', rowMembers: 'Membros',
    rowFspLink: 'Vínculo com o Foro', rowComposition: 'Composição', rowRelation: 'Relação com o Foro',
    rowScale: 'Escala', keyFigures: 'Figuras-chave', sourceWord: 'fonte',
    badgeFounding: 'membro fundador', badgeLater: 'membro posterior', badgeUnknown: 'status a verificar',
    tReportedFigures: 'números reportados; a verificar',
  },
};

/** Path-preserving language switcher. depth = how many levels below the locale root. */
function switcher(lang, route, ui) {
  const up = '../'.repeat(1 + (route.split('/').length - 1));
  const links = LOCALES.map((l) => (l === lang
    ? `<span class="lang-current" aria-current="true">${l.toUpperCase()}</span>`
    : `<a href="${up}${l}/${route}" hreflang="${l}">${l.toUpperCase()}</a>`)).join('');
  return `<nav class="lang-switch" aria-label="${ui.langLabel}">${links}</nav>`;
}

/** Canonical + hreflang cluster for a route ('' | 'meetings/1990.html' | …). */
function hreflangHead(lang, route) {
  const alt = LOCALES.map((l) => `  <link rel="alternate" hreflang="${l}" href="${BASE}${l}/${route}">`).join('\n');
  return `  <link rel="canonical" href="${BASE}${lang}/${route}">\n${alt}\n  <link rel="alternate" hreflang="x-default" href="${BASE}${route}">`;
}

function disclaimerHtml(ui) {
  return ui.disclaimer ? `\n  <div class="i18n-disclaimer" role="note">🌐 ${ui.disclaimer}</div>` : '';
}

/**
 * Redirect stub keeping a pre-i18n URL alive (the tl pattern): '' (the root),
 * 'meetings/<year>.html', 'countries/<CC>.html'. Sends the visitor into their
 * preferred locale tree; canonical points at /en/.
 */
function redirectStub(route, title) {
  const up = '../'.repeat(route.split('/').length - 1);
  const alt = LOCALES.map((l) => `  <link rel="alternate" hreflang="${l}" href="${BASE}${l}/${route}">`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="canonical" href="${BASE}en/${route}">
${alt}
  <link rel="alternate" hreflang="x-default" href="${BASE}${route}">
  <script>
    (function () {
      var supported = ${JSON.stringify(LOCALES)};
      var stored = null; try { stored = localStorage.getItem('lang'); } catch (e) {}
      var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
      var pick = supported.indexOf(stored) >= 0 ? stored : (supported.indexOf(nav) >= 0 ? nav : 'en');
      location.replace('${up ? up : './'}' + pick + '/${route}');
    })();
  </script>
  <noscript><meta http-equiv="refresh" content="0; url=${up ? up : './'}en/${route}"></noscript>
  <title>${title}</title>
</head>
<body><p>Redirecting… <a href="${up ? up : './'}en/${route}">English</a> · <a href="${up ? up : './'}es/${route}">Español</a> · <a href="${up ? up : './'}pt/${route}">Português</a></p></body>
</html>
`;
}

function sitemap(routes) {
  const urls = [];
  for (const route of routes) {
    for (const lang of LOCALES) {
      const alts = LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${l}/${route}"/>`).join('\n');
      urls.push(`  <url>\n    <loc>${BASE}${lang}/${route}</loc>\n${alts}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${route}"/>\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

module.exports = {
  LOCALES, BASE, TRANSLATABLE_KEYS, REFERENCE_TRANSLATABLE, UI,
  loadDict, translator, localizeDeep,
  switcher, hreflangHead, disclaimerHtml, redirectStub, sitemap,
};
