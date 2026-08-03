# Reference catalog — Foro de São Paulo dataset

> **Generated file — do not edit by hand.** Produced from the JSON single
> source of truth (`data/forum.json` + `data/countries/*.json`) by
> `scripts/gen-catalog.js`, which `build.js` runs on every build. To refresh:
> `node scripts/gen-catalog.js`. See [`context.md`](context.md) for domain
> background and [`docs/adrs/`](docs/adrs/) for the architecture.

_Last generated: 2026-08-03 · 16 countries · 11 listed parties · 5 armed movements · 5 regional bodies · 4 related organizations · 52 references._

## Contents

- [Countries & FSP presidents](#countries--fsp-presidents)
- [Member parties](#member-parties)
- [Member parties in government](#member-parties-in-government)
- [Membership rosters over time](#membership-rosters-over-time)
- [Armed & guerrilla movements](#armed--guerrilla-movements)
- [Regional integration bodies](#regional-integration-bodies)
- [Related organizations](#related-organizations)
- [References](#references)

## Countries & FSP presidents

Countries with a dossier here (presidential succession since 1990, with
Foro de São Paulo member/affiliated presidents flagged). **This is the set of
*tracked* countries — not an exhaustive list of Latin America.** Affiliations
marked *to verify* are not asserted as confirmed. See ADR-0009.

Total FSP-party presidential terms across tracked countries: **36**.

| Country | Code | FSP party | Status | FSP presidents (term) |
|---|---|---|---|---|
| [Brazil](docs/countries/BR.html) | BR | Partido dos Trabalhadores (PT) & Partido Comunista do Brasil (PCdoB) | founding member | Luiz Inácio Lula da Silva (2003–2011); Dilma Rousseff (2011–2016); Luiz Inácio Lula da Silva (2023–present) |
| [Venezuela](docs/countries/VE.html) | VE | Partido Socialista Unido de Venezuela (PSUV) | member | Hugo Chávez (1999–2013); Nicolás Maduro (2013–present) |
| [Bolivia](docs/countries/BO.html) | BO | Movimiento al Socialismo (MAS) | member | Evo Morales (2006–2019); Luis Arce (2020–2025) |
| [Nicaragua](docs/countries/NI.html) | NI | Frente Sandinista de Liberación Nacional (FSLN) | founding member | Daniel Ortega (2007–present) |
| [Uruguay](docs/countries/UY.html) | UY | Frente Amplio (FA) | member (Frente Amplio, founding participant) | Tabaré Vázquez (2005–2010); José Mujica (2010–2015); Tabaré Vázquez (2015–2020); Yamandú Orsi (2025–present) |
| [El Salvador](docs/countries/SV.html) | SV | Frente Farabundo Martí (FMLN) | founding member | Mauricio Funes (2009–2014); Salvador Sánchez Cerén (2014–2019) |
| [Honduras](docs/countries/HN.html) | HN | Libertad y Refundación (LIBRE) | member | Xiomara Castro (2022–2026) |
| [Mexico](docs/countries/MX.html) | MX | Morena | member (MORENA, PT and PRD) | Andrés Manuel López Obrador (2018–2024); Claudia Sheinbaum (2024–present) |
| [Argentina](docs/countries/AR.html) | AR | Peronist/Kirchnerist coalitions (PJ / FpV / FdT) | member (PJ / Kirchnerist Peronism — FpV / FdT) | Néstor Kirchner (2003–2007); Cristina Fernández de Kirchner (2007–2015); Alberto Fernández (2019–2023) |
| [Chile](docs/countries/CL.html) | CL | Partido Socialista / Partido Comunista de Chile | member (Partido Socialista and Partido Comunista) | Ricardo Lagos (2000–2006); Michelle Bachelet (2006–2010); Michelle Bachelet (2014–2018); Gabriel Boric (2022–2026) |
| [Ecuador](docs/countries/EC.html) | EC | Movimiento PAIS (Alianza PAIS) | member (Alianza PAIS / Revolución Ciudadana — Correísmo) | Rafael Correa (2007–2017) |
| [Dominican Republic](docs/countries/DO.html) | DO | Partido de la Liberación Dominicana (PLD) | member (PLD, per Regalado 2008) | Leonel Fernández (1996–2000); Leonel Fernández (2004–2012); Danilo Medina (2012–2020) |
| [Peru](docs/countries/PE.html) | PE | Partido Nacionalista Peruano (Humala) | member (Partido Nacionalista Peruano per Regalado 2008; Perú Libre since 2018/2020) | Ollanta Humala (2011–2016); Pedro Castillo (2021–2022); José María Balcázar (2026–2026) |
| [Paraguay](docs/countries/PY.html) | PY | Frente Guasú / Alianza Patriótica para el Cambio (Lugo) | member (Frente Guasú — Lugo) | Fernando Lugo (2008–2012) |
| [Colombia](docs/countries/CO.html) | CO | Pacto Histórico / Colombia Humana (Petro) | member (Pacto Histórico; Partido Comunista Colombiano and the Polo/UP tradition) | Gustavo Petro (2022–present) |
| [Cuba](docs/countries/CU.html) | CU | Partido Comunista de Cuba (PCC) | member (PCC; one-party state — no competitive elections) | Fidel Castro (1976–2008); Raúl Castro (2008–2018); Miguel Díaz-Canel (2018–present) |

### Legislative control (lower house)
The FSP-member party’s standing in the lower chamber over time, where compiled
(issue #106). `majority`/`plurality`/`minority` describe the FSP party or its
governing coalition; `opposition` = out of government; `single-party` = one-party state.
- **Brazil** (PT / PCdoB): 1990–2003: **opposition** · 2003–2016: **majority** · 2016–2023: **opposition** · 2023–present: **majority**
- **Venezuela** (MVR/Chavismo): 1990–2000: **opposition** · 2000–2016: **majority** · 2016–2020: **minority** · 2020–present: **majority**
- **Bolivia** (MAS): 1990–2006: **opposition** · 2006–2025: **majority** · 2025–present: **opposition**
- **Nicaragua** (FSLN): 1990–2007: **opposition** · 2007–2012: **plurality** · 2012–present: **majority**
- **Uruguay** (Frente Amplio): 1990–2005: **opposition** · 2005–2020: **majority** · 2020–2025: **opposition** · 2025–present: **minority**
- **El Salvador** (FMLN): 1994–2009: **opposition** · 2009–2019: **minority** · 2019–present: **opposition**
- **Honduras** (LIBRE): 2013–2022: **opposition** · 2022–2026: **plurality** · 2026–present: **opposition**
- **Mexico** (PRD / PT): 1990–2018: **opposition** · 2018–present: **majority**
- **Argentina** (PJ (non-Kirchnerist)): 1990–2003: **opposition** · 2003–2015: **majority** · 2015–2019: **plurality** · 2019–2021: **plurality** · 2021–2023: **plurality** · 2023–present: **plurality**
- **Chile** (PS): 1990–2000: **minority** · 2000–2010: **minority** · 2010–2014: **opposition** · 2014–2018: **minority** · 2018–2022: **opposition** · 2022–2026: **minority** · 2026–present: **opposition**
- **Ecuador** (—): 1990–2007: **opposition** · 2007–2017: **majority** · 2017–2021: **opposition** · 2021–present: **plurality**
- **Dominican Republic** (PLD): 1990–1996: **opposition** · 1996–2020: **majority** · 2020–present: **opposition**
- **Peru** (PNP): 1990–2011: **opposition** · 2011–2016: **plurality** · 2016–2021: **opposition** · 2021–2022: **plurality** · 2022–2026: **opposition** · 2026–present: **minority**
- **Paraguay** (—): 1990–2008: **opposition** · 2008–2012: **minority** · 2012–present: **opposition**
- **Colombia** (PCC / UP / Polo): 1990–2022: **opposition** · 2022–2026: **plurality** · 2026–present: **plurality**
- **Cuba** (PCC): 1990–present: **single-party**

## Member parties

A curated, non-exhaustive list of notable member parties (from
`forum.json → parties[]`). The full membership is in the rosters below.

| Party | Abbr | Country | Founding member | Notes |
|---|---|---|---|---|
| Partido dos Trabalhadores (PT) | PT | Brazil | yes | Convening party of the Forum. |
| Partido Comunista do Brasil | PCdoB | Brazil | yes | Brazilian FSP member alongside the PT (both in Regalado's 1990, 1993 and 2007 rosters). Runs with the PT in the Federação Brasil da Esperança. |
| Partido Comunista de Cuba | PCC | Cuba | yes |  |
| Frente Sandinista de Liberación Nacional | FSLN | Nicaragua | yes |  |
| Frente Farabundo Martí para la Liberación Nacional | FMLN | El Salvador | yes | Was an insurgent coalition in 1990; later an electoral party. |
| Partido Socialista Unido de Venezuela | PSUV | Venezuela | no | PSUV founded 2007; Chávez aligned with the Forum from the early 2000s. |
| Movimiento al Socialismo | MAS | Bolivia | no |  |
| Frente Amplio | FA | Uruguay | — | Membership/founding status to be verified. |
| Partido Comunista de Chile | PCCh | Chile | — |  |
| Partido de la Revolución Democrática (historically); later Morena-aligned organizations | PRD | Mexico | — | Membership over time to be verified. |
| Various left and Kirchnerist organizations |  | Argentina | — | Specific member parties to be verified. |

## Member parties in government

Parties that belong to or are aligned with the Foro de São Paulo have held the presidency across much of Latin America — a measure of the network's electoral weight. (The region has also elected non-FSP, right-leaning governments, so this is a pattern, not exclusive control.) Founding/membership status of some parties is still being verified (see parties list).

| Country | Party | FSP status | Heads of state/government |
|---|---|---|---|
| Brazil | Partido dos Trabalhadores (PT) | founding member | Lula da Silva (2003–2010, 2023–); Dilma Rousseff (2011–2016) |
| Venezuela | PSUV (and predecessors) | member | Hugo Chávez (1999–2013); Nicolás Maduro (2013–) |
| Bolivia | Movimiento al Socialismo (MAS) | member | Evo Morales (2006–2019); Luis Arce (2020–) |
| Nicaragua | Frente Sandinista (FSLN) | founding member | Daniel Ortega (1985–1990, 2007–) |
| Uruguay | Frente Amplio | member (to verify founding) | Vázquez, Mujica (2005–2020); Yamandú Orsi (2025–) |
| El Salvador | FMLN | founding member | Mauricio Funes (2009–2014); Sánchez Cerén (2014–2019) |
| Honduras | LIBRE | member | Xiomara Castro (2022–) |
| Mexico | Morena (formerly PRD-aligned) | affiliated (to verify) | López Obrador (2018–2024); Claudia Sheinbaum (2024–) |
| Argentina | Peronist/Kirchnerist coalitions | affiliated (to verify) | N. Kirchner, C. F. de Kirchner, A. Fernández (2003–2015, 2019–2023) |
| Chile | PS / Partido Comunista de Chile | member (to verify) | Bachelet (2006–2010, 2014–2018) |
| Ecuador | Movimiento PAIS | affiliated (to verify) | Rafael Correa (2007–2017) |

## Membership rosters over time

Snapshots of the Forum’s membership at documented points, from Regalado
(2008). Counts are organizations / countries per snapshot.

### Founding meeting — São Paulo, 2–4 July 1990 — 48 organizations, 14 countries

_The founding roster: parties, movements and fronts that took part in the first meeting. Reconciles with the documented “48 organizations from 14 countries.”_

<details><summary>Full list by country</summary>

- **Argentina** (12): Grupo de los Ocho · Frente Izquierda Unida · Movimiento al Socialismo · Partido Comunista Argentino · Partido Intransigente · Partido Intransigencia Revolucionaria · Partido Socialista Popular · Partido Revolucionario de los Trabajadores · Partido Obrero · Movimiento de los de Abajo · Movimiento de los Descamisados · Unidad Socialista
- **Bolivia** (2): Eje de Convergencia Patriótica · Partido Comunista Boliviano
- **Brasil** (5): Partido de los Trabajadores · Partido Comunista de Brasil · Partido Comunista Brasileño · Partido Democrático de los Trabajadores · Partido Socialista Brasileño
- **Colombia** (2): Partido Comunista Colombiano · Unión Patriótica
- **Chile** (3): Izquierda Cristiana · Movimiento de Izquierda Revolucionaria · Partido Comunista de Chile
- **Ecuador** (5): Liberación Nacional · Movimiento Popular Democrático · Partido Comunista del Ecuador · Partido Socialista del Ecuador · Partido Socialista Popular
- **Paraguay** (4): Corriente Patria Libre · Partido Comunista Paraguayo · Partido Revolucionario Febrerista · Partido de los Trabajadores
- **Perú** (5): Movimiento al Socialismo · Partido Comunista Peruano · Partido Unificado Mariateguista · Partido Comunista Revolucionario · Unidad Democrática y Popular
- **Uruguay** (1): Frente Amplio
- **Venezuela** (4): Causa R · Movimiento al Socialismo · Movimiento Electoral del Pueblo · Partido Comunista de Venezuela
- **México** (2): Partido de la Revolución Democrática · Partido Popular Socialista
- **El Salvador** (1): Frente Farabundo Martí para la Liberación Nacional
- **Cuba** (1): Partido Comunista de Cuba
- **República Dominicana** (1): Partido Comunista Dominicano

</details>

### IV Encuentro — La Habana, July 1993 — 141 organizations, 30 countries

_Members list drawn up at the IV Encuentro — the Forum had grown well beyond the founding core, reaching the Caribbean, Central America and the French Antilles._

<details><summary>Full list by country</summary>

- **Argentina** (16): Izquierda Democrática y Popular · Frente Amplio de Liberación-Izquierda Unida · Frente para la Democracia Avanzada · Movimiento al Socialismo · Movimiento Encuentro Popular · Movimiento Los de Abajo · Partido Comunista Argentino · Partido de la Intransigencia Popular · Partido Democracia Popular · Partido Humanista · Partido Intransigente · Partido Obrero · Partido Obrero Revolucionario-Posadista · Partido Socialista Popular · Partido Peronista de las Bases · Partido Revolucionario por la Independencia Soc.
- **Barbados** (1): Partido de los Trabajadores de Barbados
- **Bolivia** (5): Eje de Convergencia Patriótica · Movimiento Bolivia Libre · Partido Alternativa al Socialismo · Partido Comunista de Bolivia · Partido Revolucionario del Pueblo
- **Brasil** (6): Partido Comunista Brasileño · Partido Comunista de Brasil · Partido de los Trabajadores · Partido Democrático de los Trabajadores · Partido Popular Socialista · Partido Socialista Brasileño
- **Colombia** (8): Alianza Democrática M-19 · A Luchar · Corriente de Renovación Socialista · Partido Comunista Colombiano · Partido Comunista Marxista Leninista de Colombia · Partido Obrero Revolucionario · Partido Revolucionario de los Trabajadores · Unión Patriótica
- **Costa Rica** (5): Grupo Soberanía · Foro Cívico · Partido del Pueblo Costarricense · Partido del Pueblo Unido · Partido Vanguardia Popular
- **Cuba** (1): Partido Comunista de Cuba
- **Curazao** (1): Movimiento Antillano Nuevo
- **Chile** (7): Fuerza Amplia de Izquierda · Movimiento de Izquierda Democrática Allendista · Movimiento de Izquierda Revolucionaria · Movimiento de Izquierda Revolucionaria-R · Partido Comunista de Chile · Partido Humanista Verde · Partido Socialista de Chile
- **Dominica** (1): Partido Laborista de Dominica
- **Ecuador** (5): Acción Revolucionaria Popular Ecuatoriana · Acción Política Socialista · Liberación Nacional · Movimiento Popular Democrático · Partido Socialista Ecuatoriano
- **El Salvador** (4): Convergencia Democrática · Frente Farabundo Martí para la Liberación Nacional · Movimiento Nacional Revolucionario · Unión Democrática Nacional
- **Granada** (1): Movimiento Patriótico Maurice Bishop
- **Guadalupe** (5): Combate Obrero · Grupo Revolución Socialista · Grupo Unión Resistencia · Partido Comunista de Guadalupe · Unión Por la Liberación de Guadalupe
- **Guatemala** (1): Unidad Nacional Revolucionaria Guatemalteca
- **Guyana** (2): Partido Progresista del Pueblo · Alianza del Pueblo Trabajador
- **Haití** (3): Fuerza para defender los Derechos del Pueblo Haitiano · Organización Política Lavalás · Partido de los Trabajadores Haitiano
- **Honduras** (2): Partido de los Trabajadores de Honduras · Partido Revolucionario del Pueblo
- **Martinica** (4): Consejo Nacional de los Comités Populares · Grupo Revolución Socialista · Partido Comunista Martiniqueño · Partido Comunista por la Independencia y el Soc.
- **México** (5): Partido de la Revolución Democrática · Partido del Trabajo · Partido de la Revolución Socialista · Partido Popular Socialista · Partido Revolucionario de los Trabajadores
- **Nicaragua** (1): Frente Sandinista de Liberación Nacional
- **Panamá** (1): Partido Revolucionario Democrático
- **Paraguay** (5): Movimiento Patria Libre · Paraguay para Todos · Partido Comunista Paraguayo · Partido de los Trabajadores · Partido Democrático Popular
- **Perú** (9): Corriente Patria Libre · Izquierda Unida · Movimiento de Afirmación Socialista · Partido Comunista Peruano · Partido Mariateguista Revolucionario · Partido Socialista Democrático · Partido Unificado Mariateguista · Unión de Izquierda Revolucionaria · Unión Democrática y Popular
- **Puerto Rico** (2): Frente Socialista · Partido Socialista Puertorriqueño
- **República Dominicana** (15): Alianza por la Democracia · Concertación Democrática · Onda Democrática · Bloque Socialista · Fuerza de Liberación Popular · Movimiento Popular Dominicano · Movimiento de Izquierda Unida · Movimiento Independiente de Unidad y C. · Movimiento Popular de Liberación · Movimiento de Unidad Nacional · Partido Comunista del Trabajo · Partido Comunista Dominicano · Partido de la Liberación Dominicana · Partido de los Trabajadores Dominicanos · Unión Patriótica
- **Santa Lucía** (1): Partido Progresista
- **Trinidad y Tobago** (2): Movimiento 18 de febrero · Movimiento de Transformación Social
- **Uruguay** (14): Agrupación Pregón · Corriente de Unidad Frenteamplista · Corriente Popular · Frente de Izquierda de Liberación · MLN Tupamaros · Movimiento de Participación Popular · Movimiento Revolucionario Oriental · Movimiento 26 de Marzo · Partido Comunista Uruguayo · Partido Obrero Revolucionario · Partido por la Victoria del Pueblo · Partido Socialista Uruguayo · Partido Socialista de los Trabajadores · Vertiente Artiguista
- **Venezuela** (8): Bandera Roja · Causa R · Foro Democrático · Liga Socialista · Movimiento al Socialismo · Movimiento Electoral del Pueblo · Partido Comunista Venezolano · Unión Patriótica de Venezuela

</details>

### Active members — end of 2007 — 75 organizations, 20 countries

_The full list of active member parties and organizations at the end of 2007, per Regalado. It consolidated from the 1993 peak around larger parties. (Distinct from the standing Working Group, whose one-delegation-per-country composition is shown under Organization & structure.)_

<details><summary>Full list by country</summary>

- **Argentina** (10): Frente Grande · Frente Transversal Nacional y Popular · Movimiento Libres del Sur · Partido Comunista · Partido Comunista Revolucionario · Partido Humanista · Partido Intransigente · Partido Obrero Revolucionario-Posadista · Partido Socialista · Unión de Militantes por el Socialismo
- **Bolivia** (4): Movimiento al Socialismo · Movimiento Bolivia Libre · Partido Comunista de Bolivia · Partido Patria Socialista-Movimiento Guevarista
- **Brasil** (2): Partido de los Trabajadores · Partido Comunista de Brasil
- **Chile** (4): Izquierda Cristiana · Partido Comunista de Chile · Partido Humanista · Partido Socialista de Chile
- **Colombia** (3): Partido Comunista Colombiano · Polo Democrático Alternativo · Presentes por el Socialismo
- **Cuba** (1): Partido Comunista de Cuba
- **Ecuador** (5): MUP Pachakutik-Nuevo País · Movimiento Popular Democrático · Partido Comunista de Ecuador · Partido Comunista Marxista-Leninista · Partido Socialista-Frente Amplio
- **El Salvador** (1): Frente Farabundo Martí para la Liberación Nacional (FMLN)
- **Guatemala** (2): Alianza Nueva Nación · Unidad Nacional Revolucionaria Guatemalteca (URNG)
- **Honduras** (1): Unificación Democrática
- **Martinica** (1): Partido Comunista por la Independencia y el Socialismo
- **México** (4): Partido de los Comunistas Mexicanos · Partido Comunista de México · Partido de la Revolución Democrática · Partido del Trabajo
- **Nicaragua** (1): Frente Sandinista de Liberación Nacional
- **Panamá** (1): Partido del Pueblo de Panamá
- **Paraguay** (5): Partido Comunista Paraguayo · Partido Democrático Popular · Partido Patria Libre · Convergencia Popular Socialista · Partido Humanista de Paraguay
- **Perú** (4): Partido Comunista del Perú-Patria Roja · Partido Comunista Peruano · Partido Nacionalista del Perú · Partido Socialista
- **Puerto Rico** (3): Frente Socialista · M. I. Nacional Hostosiano · Partido Nacionalista de Puerto Rico
- **República Dominicana** (7): Alianza por la Democracia · Fuerza de la Revolución · Movimiento Izquierda Unida · Partido Comunista del Trabajo · Partido de la Liberación Dominicana · Partido de los Trabajadores Dominicanos · Partido Revolucionario Dominicano
- **Uruguay** (12): Asamblea Uruguay-FA · Corriente de Unidad Frenteamplista-FA · Frente Amplio · Movimiento 26 de marzo-FA · MLN Tupamaros-FA · Movimiento de Participación Popular · Partido Comunista de Uruguay · POR Troskista-Posadista-FA · Partido por la Victoria del Pueblo-FA · Partido Socialista de los Trabajadores · Partido Socialista de Uruguay-FA · Vertiente Artiguista-FA
- **Venezuela** (4): Liga Socialista · Movimiento Electoral del Pueblo · Partido Comunista de Venezuela · Partido Socialista Unido de Venezuela

</details>

## Armed & guerrilla movements

The Forum was founded as a gathering of the whole Latin American left, and its participants included not only electoral parties but organizations that had waged, or still waged, armed struggle. Some — the FSLN in Nicaragua, the FMLN in El Salvador, the URNG in Guatemala, the MLN-Tupamaros in Uruguay — were guerrilla movements that became legal parties (the first two are listed among the parties above). Others took part as active armed organizations, most notably Colombia’s FARC and Chile’s MIR. Several of these groups were formally designated terrorist organizations by governments including the United States and the European Union; those designations are noted below with attribution. The precise extent and formality of each armed group’s participation in specific Forum meetings is documented unevenly, so those points are marked to verify and, where contested, attributed rather than asserted.

| Movement | Abbr | Country | Period | Nature | Role in the Forum | Status |
|---|---|---|---|---|---|---|
| Fuerzas Armadas Revolucionarias de Colombia — Ejército del Pueblo | FARC-EP | Colombia | 1964–2017 (armed); legal party since 2017 | The hemisphere’s longest-running Marxist–Leninist guerrilla insurgency; during the conflict it financed itself partly through kidnapping-for-ransom and the taxation of the cocaine trade. | (to verify) Took part in Foro de São Paulo encuentros during the 1990s and 2000s, when the Forum brought together armed and electoral currents of the left. | Signed the 2016 peace accord and demobilized; in 2017 became a legal party — the Fuerza Alternativa Revolucionaria del Común, which kept the “FARC” acronym — renamed Comunes in 2021. The accord guarantees it 10 congressional seats for the 2018–2026 terms. It has not won the presidency. |
| Movimiento de Izquierda Revolucionaria | MIR | Chile | 1965–1990s | Revolutionary-socialist movement that took up armed struggle, especially in clandestine resistance to the Pinochet dictatorship (1973–1990). | (to verify) Took part in early Foro de São Paulo meetings. | Effectively defunct as an armed force after the return to democracy; only small successor groupings remain. |
| Movimiento 19 de Abril | M-19 | Colombia | 1970–1990 | Nationalist, left-wing urban guerrilla, known for the 1980 Dominican embassy siege and the 1985 storming of the Palace of Justice in Bogotá. | (to verify) Demobilized in 1990 — the year the Forum was founded — and continued in legal politics through the Alianza Democrática M-19. | Demobilized 1990. Former members stayed active in politics; Gustavo Petro, elected President of Colombia in 2022, is a former M-19 member. |
| Movimiento de Liberación Nacional–Tupamaros | MLN-T | Uruguay | 1960s–1970s (armed); legal since the 1980s | Urban guerrilla movement crushed under the 1973–1985 dictatorship, its members imprisoned for years. | (to verify) Joined the Frente Amplio — a founding-era Forum member — and takes part through it. | Legal; part of the Frente Amplio coalition. José Mujica, a former Tupamaro imprisoned during the dictatorship, was President of Uruguay (2010–2015). |
| Unidad Revolucionaria Nacional Guatemalteca | URNG | Guatemala | 1982–1996 (guerrilla coalition); legal party since 1998 | Coalition of Guatemalan guerrilla organizations during the civil war (1960–1996). | (to verify) Signed the 1996 peace accords and became a legal party; participant in the Forum. | Legal political party (small). |

## Regional integration bodies

These are state-level intergovernmental organizations — distinct from the Foro de São Paulo, which is a network of political parties, not of governments. They are listed here because they were created or led largely by governments headed by FSP-member parties during the 2000s “pink tide”. Critical authors (Graça Salgueiro; Olavo de Carvalho / Mídia Sem Máscara) go further and describe them as instruments of the Forum’s regional-integration project (the “pátria grande”); that stronger, coordinating-hand claim is attributed to those authors, not asserted here. Founding dates and membership below are factual.

### Mercosur (Mercosul) — Southern Common Market (Mercosur) — founded 1991 (Treaty of Asunción)

A customs union and trade bloc — created in 1991, before the pink tide.

**Members:** Argentina, Brazil, Paraguay, Uruguay; Venezuela (joined 2012, suspended 2016); Bolivia acceding.

**Link to the Forum:** Its foundation predates the FSP-aligned governments; from the 2000s, presidents from FSP-member parties (Lula, Kirchner, Chávez) drove its more political orientation. Salgueiro / Mídia Sem Máscara argue the “new” Mercosur follows the Forum’s directives — attributed to those authors.

### ALBA-TCP — Bolivarian Alliance for the Peoples of Our America (ALBA) — founded 2004 (Havana; Chávez & Fidel Castro)

An explicitly left, anti-neoliberal bloc created as a counter to the US-backed FTAA/ALCA.

**Members:** Venezuela, Cuba, Bolivia, Nicaragua and several Caribbean/Central American states; linked energy pact Petrocaribe (2005).

**Link to the Forum:** The bloc most closely aligned with FSP membership — founded and led by FSP-member governing parties (PSUV, PCC, MAS, FSLN); its social-movements arm overlaps with FSP-orbit organizations.

### UNASUR — Union of South American Nations (UNASUR) — founded 2008 (Brasília)

A South American intergovernmental union loosely modeled on the EU.

**Members:** 12 South American states (founding). Most withdrew after 2018; partial revival from 2023.

**Link to the Forum:** Championed by Lula, Kirchner and Chávez; Néstor Kirchner (Peronism/FpV) was its first Secretary-General (2010). It fractured as the pink tide receded.

### CELAC — Community of Latin American and Caribbean States (CELAC) — founded 2010–2011 (successor to the Rio Group)

A regional forum spanning all of Latin America and the Caribbean.

**Members:** 33 states — every country of the Americas except the United States and Canada.

**Link to the Forum:** Created under pink-tide leadership (early summits chaired by Piñera, then Raúl Castro); FSP-aligned governments have used it as their preferred regional forum. Its civil-society arm, CELAC Social, is listed under Related organizations.

### BRICS (BRICS) — founded 2009 (first summit); Brazil a founding member

A global grouping of major emerging economies — NOT a Latin American or FSP body.

**Members:** Brazil, Russia, India, China, South Africa (2010); a 2024 expansion added Egypt, Ethiopia, Iran, the UAE and others.

**Link to the Forum:** Included only because Brazil’s participation has been driven by PT (FSP-founding-member) governments under Lula. BRICS spans governments of every ideology (e.g. India) and has no organizational tie to the Forum.

## Related organizations

Distinct, coexisting networks often confused with the Forum (it has **not**
been renamed). See `context.md` for the Foro ≠ Grupo de Puebla distinction.

### Grupo de Puebla (Puebla Group) — founded July 2019, Puebla, Mexico

**Composition:** Individual progressive leaders — presidents, ex-presidents, ministers, parliamentarians and intellectuals — rather than political parties.

A distinct, complementary organization — NOT a renaming of the Foro de São Paulo. Launched in 2019 with the help of Foro-aligned networks; it notably does not include parties from Venezuela, Cuba and Bolivia, partly to distance itself from the authoritarian-left image. Both organizations remain active and have met side by side, e.g. in Tegucigalpa, June 2024.

<https://www.grupodepuebla.org/>

### Progressive International — founded 2020, Global

**Composition:** Global network of left/progressive movements, parties and figures.

Allied international network; co-present with the Foro and the Puebla Group at the June 2024 Tegucigalpa gatherings. Separate organization with a worldwide (not Latin America–specific) scope.

<https://progressive.international/>

### CELAC Social — founded 2010s, Latin America and the Caribbean

**Composition:** Social-movements space associated with the Community of Latin American and Caribbean States (CELAC), an intergovernmental body.

Allied civil-society space, distinct from the Foro (which is a party forum, not an intergovernmental one). Co-present at the June 2024 Tegucigalpa gatherings.

### Fórum Social Mundial (World Social Forum, WSF) — founded January 2001, Porto Alegre, Brazil

**Composition:** Civil-society movements, unions, NGOs and activists — explicitly NOT political parties. Its Charter of Principles bars parties from taking positions in the WSF’s name.

Born in the same Porto Alegre / PT-linked milieu as the Foro and often described as the “movement” counterpart to the Foro’s “party” network — distinct and autonomous, not a Foro body. Some Foro-aligned figures helped launch it. Critical authors (e.g. Salgueiro) treat the two as parts of one apparatus; that stronger, coordinating-hand claim is attributed to those authors, not asserted here.

<https://en.wikipedia.org/wiki/World_Social_Forum>

## References

Every cited source (`forum.json → references[]`). Each is also preserved in
the Internet Archive and as a local copy in the document vault (ADR-0004, ADR-0008).

| id | Title | Type | URL |
|---|---|---|---|
| `wikipedia-en` | São Paulo Forum — Wikipedia (English) | encyclopedia | <https://en.wikipedia.org/wiki/S%C3%A3o_Paulo_Forum> |
| `wikipedia-pt` | Foro de São Paulo — Wikipédia (Português) | encyclopedia | <https://pt.wikipedia.org/wiki/Foro_de_S%C3%A3o_Paulo> |
| `pt-oficial` | Foro de São Paulo: 33 anos em defesa da integração regional e da democracia | primary/affiliated | <https://pt.org.br/foro-de-sao-paulo-33-anos-em-defesa-da-integracao-regional-e-da-democracia/> |
| `brasildefato-30anos` | Foro de São Paulo completa 30 anos; entenda sua importância | news | <https://www.brasildefato.com.br/2020/07/29/foro-de-sao-paulo-completa-30-anos-entenda-sua-importancia/> |
| `peoplesdispatch-2023` | São Paulo Forum is back in Brasília with leaders from across the globe (2023) | news | <https://peoplesdispatch.org/2023/06/30/sao-paulo-forum-is-back-in-brasilia-with-leaders-from-across-the-globe/> |
| `granma-30years` | Thirty years ago, the São Paulo Forum gave the left heart | news/affiliated | <https://en.granma.cu/mundo/2020-07-06/thirty-years-ago-the-sao-paulo-forum-gave-the-left-heart> |
| `heritage-marxist` | The Marxist Influence of the São Paulo Forum in Latin America | commentary (critical) | <https://www.heritage.org/americas/commentary/the-marxist-influence-the-sao-paulo-forum-latin-america> |
| `gis-scandals` | Scandals erode Sao Paulo Forum's leftist grip | analysis | <https://www.gisreportsonline.com/r/sao-paulo-forum/> |
| `infoescola` | Foro de São Paulo — InfoEscola | encyclopedia | <https://www.infoescola.com/politica/foro-de-sao-paulo/> |
| `infobae-relevo` | El Grupo de Puebla: ¿el relevo del Foro de Sao Paulo? | analysis (Foro vs. Puebla Group) | <https://www.infobae.com/america/opinion/2023/10/08/el-grupo-de-puebla-el-relevo-del-foro-de-sao-paulo/> |
| `comitedelectura` | Las diferencias entre el grupo de Puebla y el foro de Sao Paulo | analysis (Foro vs. Puebla Group) | <https://comitedelectura.pe/blogs/noticias/las-diferencias-entre-el-grupo-de-puebla-y-el-foro-de-sao-paulo> |
| `infobae-tegucigalpa` | Foro de São Paulo y Grupo de Puebla, en Honduras (June 2024) | news (both orgs met in 2024) | <https://www.infobae.com/america/agencias/2024/06/24/foro-de-sao-paulo-y-grupo-de-puebla-en-honduras-para-los-15-anos-del-golpe-de-estado-contra-zelaya/> |
| `carvalho-foro` | O Foro de São Paulo: A ascensão do comunismo latino-americano | book (analysis) | <https://www.amazon.com/Foro-S%C3%A3o-Paulo-latino-americano-Portuguese/dp/8595071861> |
| `salgueiro-foro` | Graça Salgueiro — O Foro de São Paulo (book; Cap. 5 “Cronologia dos Encontros”) | book (analysis) | <https://www.goodreads.com/book/show/32619274-o-foro-de-s-o-paulo> |
| `radiovox` | Rádio Vox / Observatório Latino — YouTube channel | media/podcast (analysis) | <https://www.youtube.com/@RadioVox1029> |
| `wikipedia-liberation-theology` | Liberation theology — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Liberation_theology> |
| `wikipedia-frei-betto` | Frei Betto — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Frei_Betto> |
| `castro-lula-voltairenet` | Lula da Silva, by Fidel Castro Ruz (on the 1985 Havana debt conference) | primary/affiliated | <https://www.voltairenet.org/article154638.html> |
| `foro-declaraciones-libro` | Declaração Final dos Encontros do Foro de São Paulo (1990–2013) — official numbered declarations | primary-source | <https://web.archive.org/web/20220510181707/https://forodesaopaulo.org/wp-content/uploads/2014/07/15-Declaracion-de-Mexico-III-2009.pdf> |
| `farc-wikipedia` | Revolutionary Armed Forces of Colombia (FARC) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Revolutionary_Armed_Forces_of_Colombia> |
| `comunes-wikipedia` | Comunes (political party) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Comunes_(political_party)> |
| `colombia-peace-2016` | Colombian peace process (2016 FARC accord) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Colombian_peace_process> |
| `petro-wikipedia` | Gustavo Petro — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Gustavo_Petro> |
| `m19-wikipedia` | 19th of April Movement (M-19) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/19th_of_April_Movement> |
| `mir-chile-wikipedia` | Revolutionary Left Movement (Chile) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Revolutionary_Left_Movement_(Chile)> |
| `tupamaros-wikipedia` | Tupamaros (MLN-T) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Tupamaros> |
| `urng-wikipedia` | Guatemalan National Revolutionary Unity (URNG) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Guatemalan_National_Revolutionary_Unity> |
| `midiasemmascara` | Mídia Sem Máscara — Olavo de Carvalho | media (analysis) | <https://www.midiasemmascara.org/> |
| `atas-foro-msm` | Atas do Foro de São Paulo (compilation) — Mídia Sem Máscara / Olavo de Carvalho | compilation (attributed) | <https://archive.org/details/atas-do-foro-de-sao-paulo-midia-sem-mascara-olavo-de-carvalho> |
| `declaracion-xxv-2019` | Declaración Final del XXV Encuentro del Foro de São Paulo (Caracas, 2019) | primary-source | <https://forodesaopaulo.org/memoria-del-xxv-encuentro-del-foro-de-sao-paulo-25-al-28-de-julio-de-2019-caracas-venezuela/> |
| `declaracion-xxvi-2023` | Declaração Final do XXVI Encontro do Foro de São Paulo (Brasília, 2023) | primary-source | <https://forodesaopaulo.org/declaracao-final-do-xxvi-encontro-do-foro-de-sao-paulo/> |
| `memoria-xx-2014` | Memoria del XX Encuentro del Foro de São Paulo — La Paz, 25–29 ago 2014 | primary-source | <https://forodesaopaulo.org/memoria-del-xx-encuentro-del-foro-de-sao-paulo/> |
| `memoria-xxii-2016` | Memoria del XXII Encuentro del Foro de São Paulo — San Salvador, 23–26 jun 2016 | primary-source | <https://forodesaopaulo.org/memoria-del-xxii-encuentro-del-foro-de-sao-paulo-san-salvador-el-salvador-2016/> |
| `memoria-xxiii-2017` | Memoria del XXIII Encuentro del Foro de São Paulo — Managua, 15–19 jul 2017 | primary-source | <https://forodesaopaulo.org/memoria-del-xxiii-encuentro-del-foro-de-sao-paulo-managua-nicaragua-15-al-19-de-julio-de-2017/> |
| `memoria-xxiv-2018` | Memoria del XXIV Encuentro del Foro de São Paulo — La Habana, 15–17 jul 2018 | primary-source | <https://forodesaopaulo.org/memoria-del-xxiv-encuentro-del-foro-de-sao-paulo-la-habana-cuba-15-al-17-de-julio-de-2018/> |
| `declaracion-porto-alegre-1997` | Declaración final — Porto Alegre 1997 (VII Encuentro del Foro de São Paulo) | primary-source | <https://forodesaopaulo.org/declaracion-final-porto-alegre-1997/> |
| `mercosur-wikipedia` | Mercosur — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Mercosur> |
| `alba-wikipedia` | Bolivarian Alliance for the Peoples of Our America (ALBA-TCP) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Bolivarian_Alliance_for_the_Peoples_of_Our_America> |
| `unasur-wikipedia` | Union of South American Nations (UNASUR) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Union_of_South_American_Nations> |
| `celac-wikipedia` | Community of Latin American and Caribbean States (CELAC) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/Community_of_Latin_American_and_Caribbean_States> |
| `brics-wikipedia` | BRICS — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/BRICS> |
| `regalado-2008` | Roberto Regalado — Encuentros y desencuentros de la izquierda latinoamericana: una mirada desde el Foro de São Paulo | book (insider) | <https://oceansur.com/catalogo/titulos/encuentros-y-desencuentros-de-la-izquierda-latinoa> |
| `pomar-regalado-2013` | Valter Pomar & Roberto Regalado — Foro de São Paulo: construindo a integração latino-americana e caribenha | book (insider) | <https://diegoazziufabc.wordpress.com/wp-content/uploads/2018/08/livro-foro-de-sao-paulo-roberto-regalado-e-valter-pomar-compl.pdf> |
| `pena-esclusa-foro` | Alejandro Peña Esclusa — El Foro de São Paulo: una amenaza continental (expanded ed. of “…contra Álvaro Uribe”, 2008) | book (analysis) | <https://www.goodreads.com/book/show/54416676-el-foro-de-s-o-paulo> |
| `wsf-wikipedia` | World Social Forum (Fórum Social Mundial) — Wikipedia | encyclopedia | <https://en.wikipedia.org/wiki/World_Social_Forum> |
| `olavo-ruschel-2014` | Entrevista de Olavo de Carvalho para Leandro Ruschel | video (interview, critical) | <https://www.youtube.com/watch?v=YoApKNuOQ1A> |
| `olavo-astv-2015` | The Triumph of Cultural Marxism — America's Survival TV, with Olavo de Carvalho, Cliff Kincaid and Jerry Kenney | video (interview, critical) | <https://www.youtube.com/watch?v=Mn9iS9jSs9E> |
| `olavo-cof316-2015` | O Brasil perante a nova ordem mundial (online-course lecture) | video (lecture, critical) | <https://www.youtube.com/watch?v=dlQG02mwTD0> |
| `olavo-true-outspeak` | True Outspeak (weekly programme, 2006–2011) | video (programme, critical) | <https://www.youtube.com/playlist?list=PLeDYbSG3ee95BaJB-caH9btRz6tcv2sne> |
| `pomar-30anos-2020` | Aula sobre os 30 anos do Foro de São Paulo (Valter Pomar) | video (insider) | <https://www.youtube.com/watch?v=aBGA1LTiXNI> |
| `radiovox-xxiii-2017` | XXIII Encontro do Foro de São Paulo na Nicarágua (Observatório Latino) | video (commentary, critical) | <https://www.youtube.com/watch?v=lQ8ynn2rQGE> |
| `conspiracao-portas-abertas-2008` | Conspiração de Portas Abertas | book (analysis) | <https://www.erealizacoes.com.br/> |
