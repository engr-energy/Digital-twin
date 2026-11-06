# FYP Decision-Support Tool — Low-Head Hydropower, KP Irrigation Network

Interactive decision-support tool for the final-year project "Feasibility Study and Analysis of Low-Head Hydropower Generation from KP Irrigation Network" (UET Peshawar). Formerly called the FYP Digital Twin; renamed in v3 because it is a screening and decision-support tool, not a calibrated twin — see Limitations below.

- v3: per-fall structures with editable heads (placeholders until measured), two-unit flow fix, cost by turbine type and size, CRF-based LCOE, IRR and NPV, tornado sensitivity, per-canal hydrology with Q50–Q70 design flow, CSV upload of measured flow/power with an error metric, longitudinal profile, Top 5 sites, input badges (Measured / Assumed / Placeholder).
- v2.3: live turbine FIT/NOT FIT verdict, working turbine selection, component options, realistic head-flow map, editable economics.
- 21 canal reaches from the progress-report tables: 10 Lower Swat, 11 Kabul River.
- Live site: https://engr-energy.github.io/Digital-twin/
- Open `index.html` in a browser to run it offline; no internet needed. `tests_v3.js` runs the physics tests with Node.

## Limitations
- Per-fall heads are placeholders (2.5 m) until measured in the field or sourced from the Irrigation Department / SRSP engineers; the ranking changes when real heads arrive.
- No gauge data yet: monthly factors and closures are planning estimates per canal.
- The longitudinal profile is schematic, not surveyed; real geometry must come from a QGIS GeoJSON export.
- Costs are planning estimates, not supplier quotes; tariff values have no stated source.
- No trained Random Forest / Isolation Forest model is included: the suitability score and anomaly check are transparent simple methods that run on uploaded measured data, and a trained model needs a labelled dataset.
- kr1 (Kabul River Main Canal) length 1,500 ft and missing CCA need checking against the progress report; stored values are unchanged.
- Totals across reaches are not additive: branches reuse the same water.
