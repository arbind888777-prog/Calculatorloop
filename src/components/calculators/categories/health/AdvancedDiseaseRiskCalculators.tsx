"use client"

import { useState } from "react"
import { AlertCircle, Activity, TrendingUp, Shield } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function r2(n: number) { return Math.round(n * 100) / 100 }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

function NumInput({ label, val, set, min, max, step, suffix }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}{suffix && <span className="text-muted-foreground ml-1">({suffix})</span>}</label>
      <input type="number" value={val} onChange={e => set(Number(e.target.value))} min={min} max={max} step={step ?? 1}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

function SelectInput({ label, val, set, options }: { label: string; val: string; set: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select value={val} onChange={e => set(e.target.value)}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── 1. Diabetes Risk Score (ADA Screening) ──────────────────────────────────
export function DiabetesRiskCalculator() {
  const [age, setAge] = useState(40)
  const [gender, setGender] = useState("male")
  const [bmi, setBmi] = useState(26)
  const [waist, setWaist] = useState(90)
  const [activity, setActivity] = useState("no")
  const [family, setFamily] = useState("no")
  const [htn, setHtn] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    const a = clamp(age, 10, 90)
    const b = clamp(bmi, 10, 70)
    const w = clamp(waist, 50, 200)
    const male = gender === "male"

    // ADA Risk scoring
    if (a >= 40 && a < 50) score += 1
    else if (a >= 50 && a < 60) score += 2
    else if (a >= 60) score += 3

    if (b >= 25 && b < 30) score += 1
    else if (b >= 30 && b < 40) score += 2
    else if (b >= 40) score += 3

    const waistHigh = male ? (w > 102 ? 2 : w > 94 ? 1 : 0) : (w > 88 ? 2 : w > 80 ? 1 : 0)
    score += waistHigh

    if (activity === "no") score += 1
    if (family === "yes") score += 1
    if (gender === "female") score -= 0   // neutral
    if (htn === "yes") score += 1

    let risk = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (score < 3) { risk = "Low Risk"; status = "good" }
    else if (score < 5) { risk = "Moderate Risk"; status = "warning" }
    else if (score < 7) { risk = "High Risk"; status = "danger" }
    else { risk = "Very High Risk"; status = "danger" }

    const tenYearRisk = Math.min(40, r0(score * 4))

    setResult({
      primaryMetric: { label: "Diabetes Risk", value: risk, status, description: `Score: ${r1(score)} — est. ${tenYearRisk}% 10-year risk` },
      healthScore: Math.max(0, 100 - r0(score * 12)),
      metrics: [
        { label: "Risk Score", value: r1(score), unit: "/10", status },
        { label: "Risk Category", value: risk, status },
        { label: "Estimated 10-Year Risk", value: tenYearRisk, unit: "%", status },
        { label: "BMI", value: b, status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Waist Circumference", value: w, unit: "cm", status: waistHigh === 0 ? "good" : waistHigh === 1 ? "warning" : "danger" },
        { label: "Physical Activity", value: activity === "yes" ? "Active (+0 pts)" : "Inactive (+1 pt)", status: activity === "yes" ? "good" : "warning" },
        { label: "Family History", value: family === "yes" ? "Yes (+1 pt)" : "No", status: family === "yes" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "ADA Risk Interpretation", description: `Score ${r1(score)}: ${risk}. ${score >= 5 ? "ADA recommends fasting glucose or HbA1c testing. Pre-diabetes (HbA1c 5.7-6.4%) affects 96 million Americans and is reversible with lifestyle changes." : "Lower risk profile. Schedule diabetes screening at age 35-40, or earlier with risk factors."}`, priority: "high", category: "Screening" },
        { title: "Diabetes Prevention Program", description: "Losing 7% body weight and 150 min/week moderate exercise reduces type 2 diabetes progression by 58% in high-risk individuals. This outperforms metformin (31% reduction). Even modest changes have significant impact.", priority: "high", category: "Prevention" },
        { title: "Dietary Approach", description: "Mediterranean or DASH diet reduces diabetes risk by 19-23%. Key: reduce refined carbohydrates, increase fiber (>25g/day), choose whole grains, include legumes 3-4x/week, minimize sugar-sweetened beverages.", priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Age Points": a >= 60 ? 3 : a >= 50 ? 2 : a >= 40 ? 1 : 0, "BMI Points": b >= 40 ? 3 : b >= 30 ? 2 : b >= 25 ? 1 : 0, "Waist Points": waistHigh, "Inactive": activity === "no" ? 1 : 0, "Family History": family === "yes" ? 1 : 0, "Total Score": r1(score) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="diabetes-risk-calculator" title="Type 2 Diabetes Risk Calculator"
      description="Assess your risk of developing type 2 diabetes using ADA screening criteria. Includes 10-year risk estimate and prevention strategies."
      icon={AlertCircle} calculate={calculate} onClear={() => { setAge(40); setBmi(26); setWaist(90); setActivity("no"); setFamily("no"); setHtn("no"); setGender("male"); setResult(null) }}
      values={[age, gender, bmi, waist, activity, family, htn]} result={result}
      seoContent={<SeoContentGenerator title="Diabetes Risk Calculator" description="Calculate your type 2 diabetes risk score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="BMI" val={bmi} set={setBmi} min={10} max={70} step={0.1} />
          <NumInput label="Waist Circumference" val={waist} set={setWaist} min={50} max={200} suffix="cm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Physical Activity (≥3x/week)" val={activity} set={setActivity} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
          <SelectInput label="Family History of Diabetes" val={family} set={setFamily} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (parent/sibling)" }]} />
        </div>
        <SelectInput label="High Blood Pressure" val={htn} set={setHtn} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      </div>} />
  )
}

// ─── 2. Cholesterol Ratio Calculator ─────────────────────────────────────────
export function CholesterolRatioCalculator() {
  const [totalCholesterol, setTotalCholesterol] = useState(200)
  const [hdl, setHdl] = useState(55)
  const [ldl, setLdl] = useState(120)
  const [triglycerides, setTriglycerides] = useState(125)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const tc = clamp(totalCholesterol, 50, 600)
    const h = clamp(hdl, 10, 200)
    const l = clamp(ldl, 10, 400)
    const tg = clamp(triglycerides, 20, 3000)

    const tcHdlRatio = r2(tc / h)
    const ldlHdlRatio = r2(l / h)
    const tgHdlRatio = r2(tg / h)
    const friedewaldLDL = r0(tc - h - tg / 5)   // mg/dL estimate (US)
    const nonHdl = tc - h
    const apoB_est = r1(l * 0.63 + tg * 0.12)   // rough estimate

    const tcStatus = tcHdlRatio < 3.5 ? "good" : tcHdlRatio < 5 ? "warning" : "danger"
    const ldlStatus = l < 100 ? "good" : l < 130 ? "normal" : l < 160 ? "warning" : "danger"
    const hdlStatus = h >= 60 ? "good" : h >= 40 ? "normal" : "danger"
    const tgStatus = tg < 150 ? "good" : tg < 200 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "TC/HDL Ratio", value: tcHdlRatio, status: tcStatus, description: `${tcHdlRatio < 3.5 ? "Optimal" : tcHdlRatio < 5 ? "Borderline high" : "High risk"} — Target: <5.0, Optimal: <3.5` },
      healthScore: Math.max(0, Math.min(100, r0(110 - tcHdlRatio * 10))),
      metrics: [
        { label: "Total Cholesterol", value: tc, unit: "mg/dL", status: tc < 200 ? "good" : tc < 240 ? "warning" : "danger" },
        { label: "HDL (Good)", value: h, unit: "mg/dL", status: hdlStatus },
        { label: "LDL (Bad)", value: l, unit: "mg/dL", status: ldlStatus },
        { label: "Triglycerides", value: tg, unit: "mg/dL", status: tgStatus },
        { label: "TC/HDL Ratio", value: tcHdlRatio, status: tcStatus },
        { label: "LDL/HDL Ratio", value: ldlHdlRatio, status: ldlHdlRatio < 2 ? "good" : ldlHdlRatio < 3 ? "warning" : "danger" },
        { label: "TG/HDL Ratio (insulin resist.)", value: tgHdlRatio, status: tgHdlRatio < 2 ? "good" : tgHdlRatio < 4 ? "warning" : "danger" },
        { label: "Non-HDL Cholesterol", value: nonHdl, unit: "mg/dL", status: nonHdl < 130 ? "good" : nonHdl < 160 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Cholesterol Targets", description: "TC <200 mg/dL (desirable). LDL <100 (optimal), <130 (near optimal), <160 (borderline high), >190 (very high). HDL >60 (protective), <40 men/<50 women (low risk factor). TG <150 (normal), 200-499 (high), ≥500 (very high).", priority: "high", category: "Standards" },
        { title: "Raising HDL", description: `Your HDL is ${h} mg/dL (${h >= 60 ? "Protective level — excellent!" : h >= 40 ? "Average — aim for >60" : "Low — cardiovascular risk factor"}). To raise HDL: aerobic exercise (+2-8%), niacin (+15-35%), reduce trans fats, quit smoking, moderate alcohol (+4-13%).`, priority: "high", category: "HDL" },
        { title: "TG/HDL Ratio", description: `TG/HDL ratio of ${tgHdlRatio}: ${tgHdlRatio < 2 ? "Optimal — low insulin resistance" : tgHdlRatio < 4 ? "Mild insulin resistance possible" : "Significant insulin resistance likely"}. Reducing refined carbohydrates and increasing omega-3s can reduce triglycerides by 20-30%.`, priority: "medium", category: "Insulin Resistance" }
      ],
      detailedBreakdown: { "TC": `${tc} mg/dL`, "LDL": `${l} mg/dL`, "HDL": `${h} mg/dL`, "TG": `${tg} mg/dL`, "TC/HDL": tcHdlRatio, "LDL/HDL": ldlHdlRatio, "TG/HDL": tgHdlRatio }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cholesterol-ratio-calculator" title="Cholesterol Ratio Calculator"
      description="Calculate all important cholesterol ratios (TC/HDL, LDL/HDL, TG/HDL) and assess cardiovascular risk. Includes complete lipid panel interpretation."
      icon={Activity} calculate={calculate} onClear={() => { setTotalCholesterol(200); setHdl(55); setLdl(120); setTriglycerides(125); setResult(null) }}
      values={[totalCholesterol, hdl, ldl, triglycerides]} result={result}
      seoContent={<SeoContentGenerator title="Cholesterol Ratio Calculator" description="Calculate cholesterol ratios from lipid panel." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalCholesterol} set={setTotalCholesterol} min={50} max={600} suffix="mg/dL" />
          <NumInput label="HDL (Good Cholesterol)" val={hdl} set={setHdl} min={10} max={200} suffix="mg/dL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="LDL (Bad Cholesterol)" val={ldl} set={setLdl} min={10} max={400} suffix="mg/dL" />
          <NumInput label="Triglycerides" val={triglycerides} set={setTriglycerides} min={20} max={3000} suffix="mg/dL" />
        </div>
      </div>} />
  )
}

// ─── 3. LDL Cholesterol Calculator (Friedewald) ───────────────────────────────
export function LDLCholesterolCalculator() {
  const [totalCholesterol, setTotalCholesterol] = useState(200)
  const [hdl, setHdl] = useState(55)
  const [triglycerides, setTriglycerides] = useState(125)
  const [unit, setUnit] = useState("mgdl")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let tc = clamp(totalCholesterol, 50, 600)
    let h = clamp(hdl, 10, 200)
    let tg = clamp(triglycerides, 20, 3000)

    // Convert mmol/L to mg/dL if needed
    if (unit === "mmol") {
      tc = tc * 38.67
      h = h * 38.67
      tg = tg * 88.57
    }

    let ldl = 0
    let method = ""
    let valid = true

    if (tg > 400) {
      valid = false
      method = "Friedewald invalid (TG > 400 mg/dL). Use direct LDL measurement."
    } else {
      ldl = r0(tc - h - tg / 5)
      method = "Friedewald equation: LDL = TC − HDL − TG/5"
    }

    const ldlMmol = r2(ldl / 38.67)

    let ldlStatus: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (ldl < 100) ldlStatus = "good"
    else if (ldl < 130) ldlStatus = "normal"
    else if (ldl < 160) ldlStatus = "warning"
    else ldlStatus = "danger"

    setResult({
      primaryMetric: { label: "Calculated LDL", value: valid ? ldl : "Invalid", unit: "mg/dL", status: valid ? ldlStatus : "danger", description: valid ? method : "Cannot calculate — measure LDL directly" },
      metrics: [
        { label: "Calculated LDL", value: valid ? ldl : "N/A", unit: "mg/dL", status: valid ? ldlStatus : "danger" },
        { label: "LDL (mmol/L)", value: valid ? ldlMmol : "N/A", unit: unit === "mmol" ? "mmol/L" : "mmol/L (converted)", status: valid ? ldlStatus : "danger" },
        { label: "Total Cholesterol", value: r0(tc), unit: "mg/dL", status: tc < 200 ? "good" : tc < 240 ? "warning" : "danger" },
        { label: "HDL", value: r0(h), unit: "mg/dL", status: h >= 60 ? "good" : h >= 40 ? "normal" : "danger" },
        { label: "Triglycerides", value: r0(tg), unit: "mg/dL", status: tg < 150 ? "good" : tg < 200 ? "warning" : "danger" },
        { label: "Non-HDL Cholesterol", value: r0(tc - h), unit: "mg/dL", status: (tc - h) < 130 ? "good" : (tc - h) < 160 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "LDL Target Goals", description: `General population LDL targets: <100 mg/dL (optimal), <130 (near optimal), <160 (borderline), >190 (high). High CVD risk: <70 mg/dL. Very high risk (known CVD): <55 mg/dL. Your LDL: ${valid ? ldl : "N/A"} mg/dL.`, priority: "high", category: "Standards" },
        { title: "Reducing LDL", description: "Dietary changes: reduce saturated fat (−5-10%), eliminate trans fats (−1-3 mg/dL), soluble fiber 5-10g/day (−5%), plant sterols 2g/day (−10-15%). Plant-based diets can reduce LDL by 20-30%.", priority: "high", category: "Treatment" },
        { title: "Statins", description: "Statins can reduce LDL by 30-50% depending on dose. If diet/lifestyle are insufficient and you have risk factors, discuss statin therapy with your doctor. Combination of lifestyle + statin achieves the best outcomes.", priority: "medium", category: "Medication" }
      ],
      detailedBreakdown: { "Formula": method, "TC": `${r0(tc)} mg/dL`, "HDL": `${r0(h)} mg/dL`, "TG": `${r0(tg)} mg/dL`, "LDL": valid ? `${ldl} mg/dL` : "Invalid" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ldl-cholesterol-calculator" title="LDL Cholesterol Calculator"
      description="Calculate LDL cholesterol using the Friedewald equation from total cholesterol, HDL, and triglycerides."
      icon={Activity} calculate={calculate} onClear={() => { setTotalCholesterol(200); setHdl(55); setTriglycerides(125); setUnit("mgdl"); setResult(null) }}
      values={[totalCholesterol, hdl, triglycerides, unit]} result={result}
      seoContent={<SeoContentGenerator title="LDL Cholesterol Calculator" description="Calculate LDL from total cholesterol using Friedewald equation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Unit" val={unit} set={setUnit} options={[{ value: "mgdl", label: "mg/dL (US standard)" }, { value: "mmol", label: "mmol/L (International)" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalCholesterol} set={setTotalCholesterol} min={50} max={unit === "mgdl" ? 600 : 20} step={unit === "mgdl" ? 1 : 0.1} suffix={unit === "mgdl" ? "mg/dL" : "mmol/L"} />
          <NumInput label="HDL Cholesterol" val={hdl} set={setHdl} min={10} max={unit === "mgdl" ? 200 : 10} step={unit === "mgdl" ? 1 : 0.1} suffix={unit === "mgdl" ? "mg/dL" : "mmol/L"} />
        </div>
        <NumInput label="Triglycerides" val={triglycerides} set={setTriglycerides} min={20} max={unit === "mgdl" ? 3000 : 30} step={unit === "mgdl" ? 1 : 0.1} suffix={unit === "mgdl" ? "mg/dL" : "mmol/L"} />
      </div>} />
  )
}

// ─── 4. HOMA-IR Calculator (Insulin Resistance) ──────────────────────────────
export function HOMAIRCalculator() {
  const [glucose, setGlucose] = useState(90)
  const [insulin, setInsulin] = useState(8)
  const [unit, setUnit] = useState("mgdl")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let g = clamp(glucose, 40, 600)
    const ins = clamp(insulin, 0.5, 300)

    if (unit === "mmol") g = g * 18    // convert to mg/dL for formula

    const homaIr = r2((g * ins) / 405)    // standard HOMA-IR formula
    const homa2 = r2(ins / 22.5 * Math.exp(g / (g + 100)))   // simplified HOMA2 approximation

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (homaIr < 1.0) { category = "Insulin Sensitive (Optimal)"; status = "good" }
    else if (homaIr < 1.9) { category = "Normal"; status = "good" }
    else if (homaIr < 2.9) { category = "Early Insulin Resistance"; status = "warning" }
    else if (homaIr < 5) { category = "Significant Insulin Resistance"; status = "danger" }
    else { category = "Severe Insulin Resistance"; status = "danger" }

    setResult({
      primaryMetric: { label: "HOMA-IR", value: homaIr, status, description: `${category} — Normal: <1.9, Insulin Resistant: ≥2.9` },
      healthScore: Math.max(0, Math.min(100, r0(100 - homaIr * 15))),
      metrics: [
        { label: "HOMA-IR", value: homaIr, status },
        { label: "Category", value: category, status },
        { label: "Fasting Glucose", value: unit === "mmol" ? r2(g / 18) : g, unit: unit === "mgdl" ? "mg/dL" : "mmol/L", status: g < 100 ? "good" : g < 126 ? "warning" : "danger" },
        { label: "Fasting Insulin", value: ins, unit: "μIU/mL", status: ins < 10 ? "good" : ins < 20 ? "warning" : "danger" },
        { label: "Glucose (for formula)", value: r0(g), unit: "mg/dL", status: "normal" }
      ],
      recommendations: [
        { title: "HOMA-IR Interpretation", description: `HOMA-IR = (Fasting Glucose [mg/dL] × Fasting Insulin [μIU/mL]) / 405. Your score of ${homaIr} = ${category}. HOMA-IR >2 is associated with metabolic syndrome and predicts future type 2 diabetes and cardiovascular disease.`, priority: "high", category: "Interpretation" },
        { title: "Improving Insulin Sensitivity", description: "Evidence-based interventions: 1) Time-restricted eating (reduces insulin 15-20%). 2) Resistance training (increases GLUT-4 by 20%). 3) Weight loss (each 1 kg lost reduces HOMA-IR ~0.1). 4) Mediterranean diet. 5) Magnesium supplementation. 6) Reduce refined carbohydrates and fructose.", priority: "high", category: "Intervention" },
        { title: "Related Tests", description: "HOMA-IR should be interpreted alongside HbA1c, fasting lipids, waist circumference, and blood pressure. Low-carb diets can lower fasting insulin significantly within 2-4 weeks of implementation.", priority: "medium", category: "Testing" }
      ],
      detailedBreakdown: { "Glucose": `${r0(g)} mg/dL`, "Insulin": `${ins} μIU/mL`, "Formula": "Glucose × Insulin / 405", "HOMA-IR": homaIr, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="homa-ir-calculator" title="HOMA-IR Calculator (Insulin Resistance)"
      description="Calculate HOMA-IR insulin resistance index from fasting glucose and insulin levels. Includes metabolic risk assessment."
      icon={TrendingUp} calculate={calculate} onClear={() => { setGlucose(90); setInsulin(8); setUnit("mgdl"); setResult(null) }}
      values={[glucose, insulin, unit]} result={result}
      seoContent={<SeoContentGenerator title="HOMA-IR Calculator" description="Calculate insulin resistance with HOMA-IR." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Glucose Unit" val={unit} set={setUnit} options={[{ value: "mgdl", label: "mg/dL (US standard)" }, { value: "mmol", label: "mmol/L (International)" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Fasting Blood Glucose" val={glucose} set={setGlucose} min={40} max={unit === "mgdl" ? 600 : 35} step={unit === "mgdl" ? 1 : 0.1} suffix={unit === "mgdl" ? "mg/dL" : "mmol/L"} />
          <NumInput label="Fasting Insulin" val={insulin} set={setInsulin} min={0.5} max={300} step={0.1} suffix="μIU/mL" />
        </div>
      </div>} />
  )
}

// ─── 5. eGFR Calculator (Kidney Function) ────────────────────────────────────
export function eGFRCalculator() {
  const [creatinine, setCreatinine] = useState(0.9)
  const [age, setAge] = useState(40)
  const [gender, setGender] = useState("male")
  const [race, setRace] = useState("other")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const scr = clamp(creatinine, 0.1, 30)
    const a = clamp(age, 18, 90)
    const male = gender === "male"

    // CKD-EPI 2009 equation
    const kappa = male ? 0.9 : 0.7
    const alpha = male ? -0.411 : -0.329
    const scrKappa = scr / kappa
    const minVal = Math.min(scrKappa, 1)
    const maxVal = Math.max(scrKappa, 1)

    let egfr = 141 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.209) * Math.pow(0.993, a)
    if (!male) egfr *= 1.018
    if (race === "black") egfr *= 1.159   // Note: 2021 race-free equation removes this
    egfr = r0(egfr)

    let stage = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (egfr >= 90) { stage = "G1: Normal (≥90)"; status = "good" }
    else if (egfr >= 60) { stage = "G2: Mildly Decreased (60-89)"; status = "good" }
    else if (egfr >= 45) { stage = "G3a: Mildly-Moderately Decreased (45-59)"; status = "warning" }
    else if (egfr >= 30) { stage = "G3b: Moderately-Severely Decreased (30-44)"; status = "warning" }
    else if (egfr >= 15) { stage = "G4: Severely Decreased (15-29)"; status = "danger" }
    else { stage = "G5: Kidney Failure (<15)"; status = "danger" }

    setResult({
      primaryMetric: { label: "eGFR", value: egfr, unit: "mL/min/1.73m²", status, description: stage },
      healthScore: Math.min(100, r0(egfr * 100 / 90)),
      metrics: [
        { label: "eGFR (CKD-EPI)", value: egfr, unit: "mL/min/1.73m²", status },
        { label: "CKD Stage", value: stage, status },
        { label: "Serum Creatinine", value: scr, unit: "mg/dL", status: male ? (scr < 1.0 ? "good" : scr < 1.3 ? "normal" : "warning") : (scr < 0.8 ? "good" : scr < 1.1 ? "normal" : "warning") },
        { label: "Age", value: a, status: "normal" }
      ],
      recommendations: [
        { title: "CKD Staging & Management", description: `Stage ${stage} — ${egfr >= 60 ? "Normal-mild: Monitor annually with repeat eGFR + urine albumin/creatinine ratio. Manage CVD risk factors." : egfr >= 30 ? "Moderate-severe: Refer to nephrology. Restrict protein, phosphorus, potassium. Monitor electrolytes frequently." : "Advanced CKD: Immediate nephrology referral. Prepare for dialysis or transplant evaluation."}`, priority: "high", category: "Management" },
        { title: "Protecting Kidney Function", description: "Control blood pressure (<130/80), glucose (HbA1c target per risk), avoid NSAIDs, stay hydrated, avoid nephrotoxic drugs. ACE inhibitors or ARBs are first-line for CKD with proteinuria (reduces progression by 30-50%).", priority: "high", category: "Protection" }
      ],
      detailedBreakdown: { "Creatinine": `${scr} mg/dL`, "Age": a, "Gender": gender, "eGFR": `${egfr} mL/min/1.73m²`, "Stage": stage }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="egfr-calculator" title="eGFR Calculator (Kidney Function)"
      description="Calculate eGFR and CKD stage using the CKD-EPI equation. Assess kidney function from serum creatinine, age, and gender."
      icon={Activity} calculate={calculate} onClear={() => { setCreatinine(0.9); setAge(40); setGender("male"); setRace("other"); setResult(null) }}
      values={[creatinine, age, gender, race]} result={result}
      seoContent={<SeoContentGenerator title="eGFR Calculator" description="Calculate kidney function eGFR from serum creatinine." categoryName="Health" />
      }
      inputs={<div className="space-y-5">
        <NumInput label="Serum Creatinine" val={creatinine} set={setCreatinine} min={0.1} max={30} step={0.01} suffix="mg/dL" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ─── 6. Creatinine Clearance (Cockcroft-Gault) ───────────────────────────────
export function CrClCalculator() {
  const [age, setAge] = useState(50)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(70)
  const [creatinine, setCreatinine] = useState(1.0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 18, 100)
    const w = clamp(weight, 20, 300)
    const scr = clamp(creatinine, 0.1, 30)
    const male = gender === "male"

    const crcl = r0(((140 - a) * w) / (72 * scr) * (male ? 1 : 0.85))

    let stage = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (crcl >= 90) { stage = "Normal"; status = "good" }
    else if (crcl >= 60) { stage = "Mild impairment"; status = "good" }
    else if (crcl >= 30) { stage = "Moderate impairment"; status = "warning" }
    else if (crcl >= 15) { stage = "Severe impairment"; status = "danger" }
    else { stage = "Kidney failure"; status = "danger" }

    setResult({
      primaryMetric: { label: "CrCl (Cockcroft-Gault)", value: crcl, unit: "mL/min", status, description: `${stage} — Used for renal drug dosing` },
      metrics: [
        { label: "CrCl", value: crcl, unit: "mL/min", status },
        { label: "Category", value: stage, status },
        { label: "Creatinine", value: scr, unit: "mg/dL", status: "normal" }
      ],
      recommendations: [
        { title: "Cockcroft-Gault Use", description: `CrCl = ${crcl} mL/min. Cockcroft-Gault is used for drug dosing (not disease staging). For CKD staging, use eGFR (CKD-EPI). Most renally-cleared drugs need dose adjustment below CrCl 60 or 30 mL/min.`, priority: "high", category: "Clinical Use" },
        { title: "Drug Dosing Thresholds", description: "CrCl >60: Normal dosing for most drugs. CrCl 30-60: Reduce dose for metformin, direct oral anticoagulants, many antibiotics. CrCl <30: Avoid metformin, many NSAIDs; significant dose reduction for others. Always consult prescribing information.", priority: "high", category: "Medications" }
      ],
      detailedBreakdown: { "Formula": "CrCl = ((140-age) × weight) / (72 × Scr) × (0.85 if female)", "CrCl": `${crcl} mL/min`, "Category": stage }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="creatinine-clearance-calculator" title="Creatinine Clearance Calculator"
      description="Calculate creatinine clearance using the Cockcroft-Gault formula. Used for renal drug dosing adjustments."
      icon={Activity} calculate={calculate} onClear={() => { setAge(50); setGender("male"); setWeight(70); setCreatinine(1.0); setResult(null) }}
      values={[age, gender, weight, creatinine]} result={result}
      seoContent={<SeoContentGenerator title="Creatinine Clearance Calculator" description="Calculate CrCl using Cockcroft-Gault formula." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={100} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Serum Creatinine" val={creatinine} set={setCreatinine} min={0.1} max={30} step={0.01} suffix="mg/dL" />
        </div>
      </div>} />
  )
}

// ─── 7. Anion Gap Calculator ──────────────────────────────────────────────────
export function AnionGapCalculator() {
  const [sodium, setSodium] = useState(140)
  const [chloride, setChloride] = useState(100)
  const [bicarbonate, setBicarbonate] = useState(24)
  const [albumin, setAlbumin] = useState(4.0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const na = clamp(sodium, 100, 200)
    const cl = clamp(chloride, 60, 160)
    const hco3 = clamp(bicarbonate, 5, 60)
    const alb = clamp(albumin, 0.5, 8)

    const ag = na - cl - hco3
    const correctedAG = r1(ag + 2.5 * (4.0 - alb))    // correct for hypoalbuminemia

    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    let category = ""
    if (ag < 3 || ag > 30) { category = "Outside typical reference range"; status = "warning" }
    else if (ag <= 12) { category = "Normal"; status = "good" }
    else if (ag <= 20) { category = "Elevated — possible HAGMA"; status = "warning" }
    else { category = "High — significant HAGMA"; status = "danger" }

    let corrStatus: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (correctedAG <= 12) corrStatus = "good"
    else if (correctedAG <= 20) corrStatus = "warning"
    else corrStatus = "danger"

    setResult({
      primaryMetric: { label: "Anion Gap", value: ag, unit: "mEq/L", status, description: `${category}` },
      metrics: [
        { label: "Anion Gap", value: ag, unit: "mEq/L", status },
        { label: "Corrected AG (for albumin)", value: correctedAG, unit: "mEq/L", status: corrStatus },
        { label: "Sodium", value: na, unit: "mEq/L", status: "normal" },
        { label: "Chloride", value: cl, unit: "mEq/L", status: "normal" },
        { label: "Bicarbonate", value: hco3, unit: "mEq/L", status: hco3 < 18 ? "warning" : "normal" },
        { label: "Albumin (for correction)", value: alb, unit: "g/dL", status: alb < 3 ? "warning" : "normal" }
      ],
      recommendations: [
        { title: "Anion Gap Interpretation", description: `AG = Na − Cl − HCO3 = ${ag} mEq/L. Normal: 8-12 mEq/L. Elevated AG (>12) indicates high anion gap metabolic acidosis (HAGMA). Causes: MUDPILES = Methanol, Uremia, DKA, Propylene glycol, Isoniazid, Lactic acidosis, Ethylene glycol, Salicylates.`, priority: "high", category: "Interpretation" },
        { title: "Albumin Correction", description: `For every 1 g/dL decrease in albumin below 4.0, add 2.5 mEq/L to the AG. Your albumin is ${alb} g/dL → Corrected AG: ${correctedAG} mEq/L. Without correction, hypoalbuminemia will mask an elevated AG.`, priority: "high", category: "Correction" }
      ],
      detailedBreakdown: { "Na": na, "Cl": cl, "HCO3": hco3, "AG": `${ag} mEq/L`, "Corrected AG": `${correctedAG} mEq/L`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="anion-gap-calculator" title="Anion Gap Calculator"
      description="Calculate serum anion gap from electrolytes with albumin correction for hypoalbuminemia. Used for metabolic acidosis diagnosis."
      icon={Shield} calculate={calculate} onClear={() => { setSodium(140); setChloride(100); setBicarbonate(24); setAlbumin(4.0); setResult(null) }}
      values={[sodium, chloride, bicarbonate, albumin]} result={result}
      seoContent={<SeoContentGenerator title="Anion Gap Calculator" description="Calculate anion gap for metabolic acidosis assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sodium (Na⁺)" val={sodium} set={setSodium} min={100} max={200} suffix="mEq/L" />
          <NumInput label="Chloride (Cl⁻)" val={chloride} set={setChloride} min={60} max={160} suffix="mEq/L" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Bicarbonate (HCO3⁻)" val={bicarbonate} set={setBicarbonate} min={5} max={60} suffix="mEq/L" />
          <NumInput label="Serum Albumin" val={albumin} set={setAlbumin} min={0.5} max={8} step={0.1} suffix="g/dL" />
        </div>
      </div>} />
  )
}

// ─── 8. Corrected Calcium Calculator ─────────────────────────────────────────
export function CorrectedCalciumCalculator() {
  const [calcium, setCalcium] = useState(9.0)
  const [albumin, setAlbumin] = useState(4.0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ca = clamp(calcium, 4, 20)
    const alb = clamp(albumin, 0.5, 8)

    const corrCa = r2(ca + 0.8 * (4.0 - alb))

    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    let category = ""
    if (corrCa < 8.5) { category = "Hypocalcemia"; status = "danger" }
    else if (corrCa <= 10.5) { category = "Normal"; status = "good" }
    else if (corrCa <= 12) { category = "Mild Hypercalcemia"; status = "warning" }
    else if (corrCa <= 14) { category = "Moderate Hypercalcemia"; status = "danger" }
    else { category = "Severe Hypercalcemia — Emergency"; status = "danger" }

    setResult({
      primaryMetric: { label: "Corrected Calcium", value: corrCa, unit: "mg/dL", status, description: `${category}` },
      metrics: [
        { label: "Reported Calcium", value: ca, unit: "mg/dL", status: "normal" },
        { label: "Corrected Calcium", value: corrCa, unit: "mg/dL", status },
        { label: "Category", value: category, status },
        { label: "Albumin", value: alb, unit: "g/dL", status: alb < 3 ? "warning" : "normal" },
        { label: "Correction Applied", value: r2(0.8 * (4.0 - alb)), unit: "mg/dL adjustment", status: "normal" }
      ],
      recommendations: [
        { title: "Why Correction is Needed", description: `Calcium is 40% albumin-bound. Low albumin falsely lowers measured calcium. Formula: Corrected Ca = Measured Ca + 0.8 × (4.0 − Albumin). Your albumin of ${alb} g/dL adds ${r2(0.8 * (4.0 - alb))} mg/dL → Corrected Ca: ${corrCa} mg/dL (${category}).`, priority: "high", category: "Interpretation" },
        { title: "Clinical Significance", description: "Hypocalcemia (<8.5): Muscle cramps, tetany, Trousseau/Chvostek signs, arrhythmia. Hypercalcemia (>10.5): 'Groans, moans, bones, stones' — constipation, fatigue, confusion, kidney stones. Causes: PTH, vitamin D, malignancy, thiazide diuretics.", priority: "high", category: "Clinical" }
      ],
      detailedBreakdown: { "Measured Ca": `${ca} mg/dL`, "Albumin": `${alb} g/dL`, "Formula": "Ca + 0.8 × (4 - Albumin)", "Corrected Ca": `${corrCa} mg/dL`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="corrected-calcium-calculator" title="Corrected Calcium Calculator"
      description="Calculate corrected serum calcium for albumin level. Essential when measured calcium and albumin are both available."
      icon={Activity} calculate={calculate} onClear={() => { setCalcium(9.0); setAlbumin(4.0); setResult(null) }}
      values={[calcium, albumin]} result={result}
      seoContent={<SeoContentGenerator title="Corrected Calcium Calculator" description="Calculate corrected calcium for albumin level." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Serum Calcium" val={calcium} set={setCalcium} min={4} max={20} step={0.1} suffix="mg/dL" />
          <NumInput label="Serum Albumin" val={albumin} set={setAlbumin} min={0.5} max={8} step={0.1} suffix="g/dL" />
        </div>
      </div>} />
  )
}
