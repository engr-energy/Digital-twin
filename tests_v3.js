/* FYP Decision-Support Tool v3 — Node tests for the physics core (script 0).
   Run:  node ~/workspace/digital_twin_v2/tests_v3.js
   The test extracts script 0 from index.html at run time, so it always tests
   the shipped file. The flat-75% mode and the worked example were removed
   from the page in v3 and live here only, as regression tests. No DOM needed. */
var fs = require("fs");
var html = fs.readFileSync("/home/hatch/workspace/digital_twin_v2/index.html", "utf8");
var scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
if (!scripts || scripts.length < 2) { console.error("FAIL: could not find 2 script blocks"); process.exit(1); }
var s0 = scripts[0].replace(/^<script>/, "").replace(/<\/script>$/, "");
fs.writeFileSync("/tmp/v3_s0_under_test.js", s0);
var P = require("/tmp/v3_s0_under_test.js");

var passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log("PASS  " + name + (detail ? " — " + detail : "")); }
  else { failed++; console.log("FAIL  " + name + (detail ? " — " + detail : "")); }
}
function approx(a, b, tol) { return Math.abs(a - b) <= tol; }

/* --- 1. Power rises with head (same flow, same turbine) --- */
var kap = P.turbById("kaplan");
var pLow = P.powerAt({hNet: 1.0, qUsed: 20, qDesign: 20, turb: kap, units: 1, effMode: "curve"});
var pHigh = P.powerAt({hNet: 4.0, qUsed: 20, qDesign: 20, turb: kap, units: 1, effMode: "curve"});
check("power rises with head", pHigh.kw > pLow.kw,
  "1.0 m -> " + pLow.kw.toFixed(1) + " kW, 4.0 m -> " + pHigh.kw.toFixed(1) + " kW");

/* --- 2. Two units never give less than one unit (all turbines, several flows) --- */
var twoOk = true, worst = "";
P.TURBINES.forEach(function (t) {
  [0.2, 0.5, 1.0, 1.5, 2.0, 5.0, 20.0, 54.93].forEach(function (q) {
    var qD = Math.max(q, t.qMin);
    var one = P.powerAt({hNet: 2.28, qUsed: q, qDesign: qD, turb: t, units: 1, effMode: "curve"});
    var two = P.powerAt({hNet: 2.28, qUsed: q, qDesign: qD, turb: t, units: 2, effMode: "curve"});
    if (two.kw < one.kw - 1e-9) { twoOk = false; worst = t.id + " Q=" + q + ": 1u " + one.kw.toFixed(1) + " > 2u " + two.kw.toFixed(1); }
  });
});
check("two units never give less than one", twoOk, worst || "all 7 families x 8 flows");

/* --- 3. User's example: Abazai Branch (ls2), Crossflow, Q 9.91 m3/s, H net 2.28 m --- */
var abazai = P.siteById("ls2");
var cf = P.turbById("crossflow");
var qAb = P.qDesign(abazai); /* 350 cusecs -> 9.91 m3/s */
var ab1 = P.powerAt({hNet: 2.28, qUsed: qAb, qDesign: qAb, turb: cf, units: 1, effMode: "curve"});
var ab2 = P.powerAt({hNet: 2.28, qUsed: qAb, qDesign: qAb, turb: cf, units: 2, effMode: "curve"});
check("Abazai Crossflow Q=" + qAb.toFixed(2) + " m3/s", approx(qAb, 9.91, 0.01), "qDesign " + qAb.toFixed(2) + " m3/s");
check("Abazai 1 unit ~137.8 kW", approx(ab1.kw, 137.8, 0.5), ab1.kw.toFixed(1) + " kW");
check("Abazai 2 units ~167 kW", approx(ab2.kw, 167, 1.0), ab2.kw.toFixed(1) + " kW");
check("Abazai 2 units > 1 unit", ab2.kw > ab1.kw, ab1.kw.toFixed(1) + " -> " + ab2.kw.toFixed(1) + " kW");

/* --- 4. Energy never exceeds rho*g*Q*H (eta = 1 ceiling) --- */
var ceilOk = true, ceilWorst = "";
P.TURBINES.forEach(function (t) {
  [0.5, 1.0, 2.28, 5.0].forEach(function (h) {
    [0.5, 5.0, 20.0, 54.93].forEach(function (q) {
      var r = P.powerAt({hNet: h, qUsed: q, qDesign: q, turb: t, units: 2, effMode: "curve"});
      var ceiling = 9.81 * Math.min(q, t.qMax * 2) * h; /* kW at eta=1, capped at usable flow */
      if (r.kw > ceiling + 1e-9) { ceilOk = false; ceilWorst = t.id + " H=" + h + " Q=" + q + ": " + r.kw.toFixed(1) + " > " + ceiling.toFixed(1); }
    });
  });
});
check("power never exceeds 9.81*Q*H ceiling", ceilOk, ceilWorst || "all families/heads/flows");

/* --- 5. Flat-75% regression (v1 number, kept as a test only) --- */
var ls1 = P.siteById("ls1");
var flat = P.powerAt({hNet: 2.0, qUsed: P.qDesign(ls1), qDesign: P.qDesign(ls1), turb: kap, units: 1, effMode: "flat"});
check("flat-75% ls1 ~808.4 kW at 2.0 m net", approx(flat.kw, 808.4, 0.6), flat.kw.toFixed(1) + " kW");

/* --- 6. Kaplan default (v2.3 verified number) at 2.28 m net, 54.93 m3/s --- */
var kapDef = P.powerAt({hNet: 2.28, qUsed: P.qDesign(ls1), qDesign: P.qDesign(ls1), turb: kap, units: 1, effMode: "curve"});
check("Kaplan default ls1 1,039.5 kW", approx(kapDef.kw, 1039.5, 0.6), kapDef.kw.toFixed(1) + " kW");
/* annual energy with the default monthly factors/closures, 0.95 availability */
var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var annual = 0;
for (var m = 0; m < 12; m++) {
  var qm = Math.min(P.qDesign(ls1) * P.DEF_FACTORS[m], P.qDesign(ls1));
  var pm = P.powerAt({hNet: 2.28, qUsed: qm, qDesign: P.qDesign(ls1), turb: kap, units: 1, effMode: "curve"});
  annual += pm.kw * (days[m] - P.DEF_CLOSURE[m]) * 24 * 0.95 / 1000;
}
check("Kaplan default ls1 ~6,348.9 MWh/yr", approx(annual, 6348.9, 2), annual.toFixed(1) + " MWh/yr");

/* --- 7. Worked example (removed from the page, kept as a test) --- */
/* gross 2.50 m, losses 0.50 m (0.25 + 0.10 + 0.04 + 0.11) -> net 2.00 m.
   Same flow, same turbine: power scales with head, so net power is exactly
   2.00/2.50 = 80% of gross power. (The v2 note "83.4 -> 66.7 kW" is that
   same 0.8 ratio at the flow that was selected at the time.) */
var wkGross = P.powerAt({hNet: 2.5, qUsed: 9.91, qDesign: 9.91, turb: kap, units: 1, effMode: "curve"});
var wkNet = P.powerAt({hNet: 2.0, qUsed: 9.91, qDesign: 9.91, turb: kap, units: 1, effMode: "curve"});
check("worked example: net 2.0 m power is 80% of gross 2.5 m power (losses 0.50 m)",
  approx(wkNet.kw / wkGross.kw, 0.8, 0.001),
  "gross " + wkGross.kw.toFixed(1) + " kW -> net " + wkNet.kw.toFixed(1) + " kW");

/* --- 8. Minimum-head gate: Kaplan at 0.90 m gives 0 kW --- */
var low = P.powerAt({hNet: 0.90, qUsed: 10, qDesign: 10, turb: kap, units: 1, effMode: "curve"});
check("Kaplan below minimum head (0.90 m) gives 0 kW", low.kw === 0, low.kw + " kW");

/* --- 9. Pump-as-turbine removed --- */
check("pump-as-turbine removed from library", !P.TURBINES.some(function (t) { return t.id === "pat"; }) && P.TURBINES.length === 7,
  P.TURBINES.length + " families: " + P.TURBINES.map(function (t) { return t.id; }).join(", "));

/* --- 10. Cost scaling: cost/kW rises as the plant shrinks --- */
var cpk1000 = P.costPerKw(kap, 1000), cpk100 = P.costPerKw(kap, 100), cpk50 = P.costPerKw(kap, 50);
check("Kaplan cost/kW: 50 kW > 100 kW > 1,000 kW",
  cpk50 > cpk100 && cpk100 > cpk1000,
  "50 kW " + Math.round(cpk50) + " > 100 kW " + Math.round(cpk100) + " > 1,000 kW " + Math.round(cpk1000) + " PKR/kW");
check("Kaplan cost/kW at 100 kW = 520,000 PKR/kW", approx(cpk100, 520000, 1), Math.round(cpk100) + " PKR/kW");

/* --- 11. CRF: 10% / 25 yr ~0.1102 --- */
check("CRF 10% / 25 yr ~0.1102", approx(P.crf(0.10, 25), 0.1102, 0.0005), P.crf(0.10, 25).toFixed(4));

/* --- 12. Auto-suggest by lowest LCOE, not peak efficiency --- */
var sugBig = P.autoSuggest(2.28, 54.93, 1.8, 1);
var sugSmall = P.autoSuggest(2.28, 2.83, 1.8, 1);
check("auto-suggest large site (54.93 m3/s) = Kaplan", sugBig.turb && sugBig.turb.id === "kaplan",
  sugBig.turb ? sugBig.turb.id + " — " + sugBig.reason : "none");
check("auto-suggest small site (2.83 m3/s) = Crossflow, not Kaplan", sugSmall.turb && sugSmall.turb.id === "crossflow",
  sugSmall.turb ? sugSmall.turb.id + " — " + sugSmall.reason : "none");

/* --- 13. SITES data unchanged: 21 reaches, kr1 flagged values kept --- */
check("21 reaches in SITES", P.SITES.length === 21, P.SITES.length + " reaches");
var kr1 = P.siteById("kr1");
check("kr1 stored values unchanged (length 1,500, CCA null)", kr1.len === 1500 && kr1.cca === null,
  "len " + kr1.len + ", CCA " + kr1.cca);

console.log("\n" + passed + " passed, " + failed + " failed.");
process.exit(failed ? 1 : 0);
