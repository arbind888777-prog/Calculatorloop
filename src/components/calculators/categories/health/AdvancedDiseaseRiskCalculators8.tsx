"use client"

import { useState } from "react"
import { Activity, AlertCircle, Thermometer, Heart, Droplets, Shield } from "lucide-react"
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

// ─── 39. qSOFA Score Calculator ───────────────────────────────────────────────
export function QSOFAScoreCalculator() {
  const [respiratoryRate, setRespiratoryRate] = useState("yes")
  const [alteredMental, setAlteredMental] = useState("no")
  const [systolicBP, setSystolicBP] = useState("yes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (respiratoryRate === "yes") score += 1
    if (alteredMental === "yes") score += 1
    if (systolicBP === "yes") score += 1

    const highRisk = score >= 2
    const mortality = score === 0 ? 3 : score === 1 ? 8 : score === 2 ? 24 : 40
    const label = score < 2 ? "Low Risk" : "High Sepsis Risk"
    const status: 'good' | 'warning' | 'danger' = score < 2 ? "good" : "danger"

    setResult({
      primaryMetric: { label: "qSOFA Score", value: `${score}/3`, status, description: `${label} — ${highRisk ? "Further sepsis workup needed" : "Low risk, reassess clinically"}` },
      healthScore: Math.max(10, r0(100 - mortality * 2)),
      metrics: [
        { label: "qSOFA Score", value: `${score}/3`, status },
        { label: "Sepsis Risk", value: highRisk ? "HIGH" : "Low", status },
        { label: "Mortality Estimate", value: mortality, unit: "%", status: mortality < 10 ? "good" : mortality < 25 ? "warning" : "danger" },
        { label: "RR ≥22", value: respiratoryRate === "yes" ? "✗ Yes" : "✓ No", status: respiratoryRate === "yes" ? "danger" : "good" },
        { label: "Altered Mentation", value: alteredMental === "yes" ? "✗ Yes" : "✓ No", status: alteredMental === "yes" ? "danger" : "good" },
        { label: "SBP ≤100", value: systolicBP === "yes" ? "✗ Yes" : "✓ No", status: systolicBP === "yes" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Sepsis Screening", description: `qSOFA: ${score}/3. ${highRisk ? "≥2 points — HIGH sepsis risk. Initiate sepsis workup: blood cultures, lactate, CBC, CRP/PCT. Start empiric antibiotics within 1 hour." : "Score <2 — low risk but continue monitoring. qSOFA is a bedside tool; clinical judgment overrides."} qSOFA identifies patients with suspected infection who have poor outcomes outside ICU.`, priority: "high", category: "Assessment" },
        { title: "Sepsis Bundle (if ≥2)", description: `Hour-1 Bundle: 1) Measure lactate. 2) Blood cultures before antibiotics. 3) Broad-spectrum IV antibiotics. 4) 30 mL/kg crystalloid for SBP <90 or lactate ≥4. 5) Vasopressors if MAP <65 after fluids. ${score >= 2 ? "Escalate to SOFA score for organ dysfunction quantification." : ""}`, priority: "high", category: "Treatment" },
        { title: "Limitations", description: "qSOFA sensitivity is ~50% (misses half of sepsis). A negative qSOFA does NOT rule out sepsis. Use alongside clinical assessment, SIRS criteria, and NEWS/MEWS scores. Any patient with suspected infection and clinical concern warrants further evaluation regardless of score.", priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Score": `${score}/3`, "Mortality": `${mortality}%`, "RR≥22": respiratoryRate, "AMS": alteredMental, "SBP≤100": systolicBP }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="qsofa-score" title="qSOFA Score Calculator"
      description="Quick SOFA bedside sepsis screening tool. Evaluates respiratory rate, mental status, and blood pressure for sepsis risk outside ICU."
      icon={AlertCircle} calculate={calculate} onClear={() => { setRespiratoryRate("yes"); setAlteredMental("no"); setSystolicBP("yes"); setResult(null) }}
      values={[respiratoryRate, alteredMental, systolicBP]} result={result}
      seoContent={<SeoContentGenerator title="qSOFA Score Calculator" description="Bedside sepsis screening with qSOFA criteria." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Respiratory Rate ≥ 22/min?" val={respiratoryRate} set={setRespiratoryRate} options={[{ value: "no", label: "No (<22)" }, { value: "yes", label: "Yes (≥22)" }]} />
        <SelectInput label="Altered Mental Status (GCS <15)?" val={alteredMental} set={setAlteredMental} options={[{ value: "no", label: "No (normal)" }, { value: "yes", label: "Yes (altered)" }]} />
        <SelectInput label="Systolic BP ≤ 100 mmHg?" val={systolicBP} set={setSystolicBP} options={[{ value: "no", label: "No (>100)" }, { value: "yes", label: "Yes (≤100)" }]} />
      </div>} />
  )
}

// ─── 40. SIRS Criteria Calculator ─────────────────────────────────────────────
export function SIRSCriteriaCalculator() {
  const [temperature, setTemperature] = useState(38.5)
  const [heartRate, setHeartRate] = useState(95)
  const [respiratoryRate, setRespiratoryRate] = useState(22)
  const [wbc, setWbc] = useState(13)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const temp = clamp(temperature, 34, 42)
    const hr = clamp(heartRate, 30, 200)
    const rr = clamp(respiratoryRate, 6, 50)
    const w = clamp(wbc, 1, 40)

    let criteria = 0
    const c1 = temp > 38 || temp < 36; if (c1) criteria++
    const c2 = hr > 90; if (c2) criteria++
    const c3 = rr > 20; if (c3) criteria++
    const c4 = w > 12 || w < 4; if (c4) criteria++

    const sirs = criteria >= 2
    const infectionSeverity = criteria <= 1 ? "Low" : criteria === 2 ? "Moderate" : criteria === 3 ? "High" : "Critical"
    const label = sirs ? `SIRS Positive (${criteria}/4)` : `SIRS Negative (${criteria}/4)`
    const status: 'good' | 'warning' | 'danger' = criteria < 2 ? "good" : criteria < 3 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "SIRS Criteria", value: `${criteria}/4`, status, description: `${sirs ? "SIRS PRESENT" : "No SIRS"} — ${infectionSeverity} severity` },
      healthScore: Math.max(10, r0(100 - criteria * 25)),
      metrics: [
        { label: "Criteria Met", value: `${criteria}/4`, status },
        { label: "SIRS Status", value: sirs ? "POSITIVE" : "Negative", status: sirs ? "danger" : "good" },
        { label: "Infection Severity", value: infectionSeverity, status },
        { label: "Temp (>38°C or <36°C)", value: `${temp}°C ${c1 ? "✗" : "✓"}`, status: c1 ? "danger" : "good" },
        { label: "HR (>90)", value: `${hr}/min ${c2 ? "✗" : "✓"}`, status: c2 ? "danger" : "good" },
        { label: "RR (>20)", value: `${rr}/min ${c3 ? "✗" : "✓"}`, status: c3 ? "danger" : "good" },
        { label: "WBC (>12 or <4)", value: `${w}×10³ ${c4 ? "✗" : "✓"}`, status: c4 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "SIRS Assessment", description: `${criteria}/4 criteria met. ${sirs ? "SIRS PRESENT (≥2 criteria). SIRS + suspected infection = Sepsis (old definition). Note: SIRS is sensitive but not specific — can be triggered by surgery, trauma, pancreatitis, burns." : "No SIRS. Continue monitoring."} Failed: ${[c1 && "temperature", c2 && "heart rate", c3 && "respiratory rate", c4 && "WBC"].filter(Boolean).join(", ") || "none"}.`, priority: "high", category: "Assessment" },
        { title: "Workup", description: `${sirs ? "If infection suspected: blood cultures ×2, urine culture, CXR, lactate level, CRP/PCT. Start empiric antibiotics if sepsis concern." : "Monitor vitals. Investigate cause of abnormal parameters."} ${criteria >= 3 ? "3-4 criteria = high severity. Consider ICU monitoring." : ""}`, priority: "high", category: "Workup" },
        { title: "Context", description: "SIRS criteria (1992) have been largely replaced by Sepsis-3 (2016) which uses SOFA/qSOFA. However, SIRS remains useful for detecting systemic inflammation from any cause. SIRS → Sepsis → Severe Sepsis → Septic Shock (old paradigm). Current: Infection + SOFA ≥2 = Sepsis.", priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Criteria": `${criteria}/4`, "SIRS": sirs ? "Yes" : "No", "Temp": `${temp}°C`, "HR": hr, "RR": rr, "WBC": `${w}k` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sirs-criteria-calculator" title="SIRS Criteria Calculator"
      description="Evaluate Systemic Inflammatory Response Syndrome from temperature, heart rate, respiratory rate, and white blood cell count."
      icon={Thermometer} calculate={calculate} onClear={() => { setTemperature(38.5); setHeartRate(95); setRespiratoryRate(22); setWbc(13); setResult(null) }}
      values={[temperature, heartRate, respiratoryRate, wbc]} result={result}
      seoContent={<SeoContentGenerator title="SIRS Criteria Calculator" description="Systemic inflammatory response syndrome detection." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Temperature" val={temperature} set={setTemperature} min={34} max={42} step={0.1} suffix="°C" />
          <NumInput label="Heart Rate" val={heartRate} set={setHeartRate} min={30} max={200} suffix="/min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Respiratory Rate" val={respiratoryRate} set={setRespiratoryRate} min={6} max={50} suffix="/min" />
          <NumInput label="WBC Count" val={wbc} set={setWbc} min={1} max={40} step={0.1} suffix="×10³/µL" />
        </div>
      </div>} />
  )
}

// ─── 41. APACHE II Score Calculator ───────────────────────────────────────────
export function APACHEIIScoreCalculator() {
  const [age, setAge] = useState(55)
  const [temperature, setTemperature] = useState(38.5)
  const [heartRate, setHeartRate] = useState(110)
  const [respiratoryRate, setRespiratoryRate] = useState(25)
  const [map, setMap] = useState(65)
  const [gcs, setGcs] = useState(12)
  const [chronicHealth, setChronicHealth] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 18, 100)
    const temp = clamp(temperature, 34, 42)
    const hr = clamp(heartRate, 30, 200)
    const rr = clamp(respiratoryRate, 5, 50)
    const m = clamp(map, 30, 160)
    const g = clamp(gcs, 3, 15)

    // Simplified APACHE II scoring
    let aps = 0 // Acute Physiology Score
    // Temperature
    if (temp >= 41 || temp < 30) aps += 4; else if (temp >= 39 || temp < 32) aps += 3; else if (temp >= 38.5 || temp < 34) aps += 1
    // Heart Rate
    if (hr >= 180 || hr < 40) aps += 4; else if (hr >= 140 || hr < 55) aps += 3; else if (hr >= 110 || hr < 70) aps += 2
    // Respiratory Rate
    if (rr >= 50 || rr < 6) aps += 4; else if (rr >= 35 || rr < 10) aps += 3; else if (rr >= 25) aps += 1
    // MAP
    if (m >= 160 || m < 50) aps += 4; else if (m >= 130 || m < 60) aps += 3; else if (m >= 110 || m < 70) aps += 2
    // GCS
    aps += (15 - g)

    // Age points
    let agePoints = 0
    if (a >= 75) agePoints = 6; else if (a >= 65) agePoints = 5; else if (a >= 55) agePoints = 3; else if (a >= 45) agePoints = 2

    // Chronic health
    const chp = chronicHealth === "severe" ? 5 : chronicHealth === "moderate" ? 2 : 0

    const total = aps + agePoints + chp
    const mortality = total <= 4 ? 4 : total <= 9 ? 8 : total <= 14 ? 15 : total <= 19 ? 25 : total <= 24 ? 40 : total <= 29 ? 55 : total <= 34 ? 73 : 85
    const label = total <= 9 ? "Low" : total <= 19 ? "Moderate" : total <= 29 ? "High" : "Very High"
    const status: 'good' | 'warning' | 'danger' = total <= 9 ? "good" : total <= 19 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "APACHE II Score", value: `${total}`, status, description: `${label} severity — Mortality: ~${mortality}%` },
      healthScore: Math.max(5, r0(100 - mortality)),
      metrics: [
        { label: "APACHE II Total", value: total, status },
        { label: "Acute Physiology", value: aps, status: aps <= 10 ? "good" : aps <= 20 ? "warning" : "danger" },
        { label: "Age Points", value: agePoints, status: agePoints <= 2 ? "good" : agePoints <= 5 ? "warning" : "danger" },
        { label: "Chronic Health", value: chp, status: chp === 0 ? "good" : chp <= 2 ? "warning" : "danger" },
        { label: "Mortality", value: mortality, unit: "%", status: mortality < 15 ? "good" : mortality < 40 ? "warning" : "danger" },
        { label: "Severity", value: label, status },
        { label: "Temperature", value: temp, unit: "°C", status: temp >= 36 && temp <= 38 ? "good" : "warning" },
        { label: "MAP", value: m, unit: "mmHg", status: m >= 70 ? "good" : m >= 60 ? "warning" : "danger" },
        { label: "GCS", value: g, status: g >= 13 ? "good" : g >= 9 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "ICU Severity", description: `APACHE II: ${total} (${label}). Estimated mortality: ~${mortality}%. APS: ${aps}, Age: ${agePoints}, Chronic: ${chp}. ${total > 25 ? "CRITICAL — aggressive intervention required." : total > 15 ? "Significant illness — close ICU monitoring." : "Lower acuity — continue supportive care."} Note: this is a simplified calculation — full APACHE II requires 12 physiologic variables + labs.`, priority: "high", category: "Assessment" },
        { title: "Management", description: `${mortality > 40 ? "Goals of care discussion recommended given high predicted mortality." : ""} Serial APACHE II at 24h helps assess trajectory. Improving score = good prognosis. Rising score = worsening. Standard ICU protocols: DVT prophylaxis, stress ulcer prevention, glucose control, early nutrition, ventilator weaning protocols.`, priority: "high", category: "Treatment" },
        { title: "Context", description: "APACHE II (1985) remains widely used for ICU mortality prediction and benchmarking. Ranges 0-71. Scores >35 have >80% mortality. Used for: ICU admission decisions, clinical trial enrollment, quality benchmarking, resource allocation. Limitations: does not account for specific diagnosis or treatment received.", priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Total": total, "APS": aps, "Age": agePoints, "Chronic": chp, "Mortality": `${mortality}%`, "MAP": m, "GCS": g }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="apache-ii-score" title="APACHE II Score Calculator"
      description="Acute Physiology and Chronic Health Evaluation for ICU mortality prediction. Combines vital signs, age, and chronic health status."
      icon={Activity} calculate={calculate} onClear={() => { setAge(55); setTemperature(38.5); setHeartRate(110); setRespiratoryRate(25); setMap(65); setGcs(12); setChronicHealth("none"); setResult(null) }}
      values={[age, temperature, heartRate, respiratoryRate, map, gcs, chronicHealth]} result={result}
      seoContent={<SeoContentGenerator title="APACHE II Score Calculator" description="ICU mortality prediction with APACHE II scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={100} suffix="years" />
          <NumInput label="Temperature" val={temperature} set={setTemperature} min={34} max={42} step={0.1} suffix="°C" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Heart Rate" val={heartRate} set={setHeartRate} min={30} max={200} suffix="/min" />
          <NumInput label="Respiratory Rate" val={respiratoryRate} set={setRespiratoryRate} min={5} max={50} suffix="/min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="MAP" val={map} set={setMap} min={30} max={160} suffix="mmHg" />
          <NumInput label="GCS" val={gcs} set={setGcs} min={3} max={15} />
        </div>
        <SelectInput label="Chronic Health" val={chronicHealth} set={setChronicHealth} options={[{ value: "none", label: "None" }, { value: "moderate", label: "Moderate (chronic disease)" }, { value: "severe", label: "Severe (immunocompromised/organ failure)" }]} />
      </div>} />
  )
}

// ─── 42. MELD Score Calculator ────────────────────────────────────────────────
export function MELDScoreCalculator() {
  const [bilirubin, setBilirubin] = useState(3.0)
  const [inr, setInr] = useState(1.8)
  const [creatinine, setCreatinine] = useState(1.5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let bil = clamp(bilirubin, 0.1, 30)
    let i = clamp(inr, 0.8, 8)
    let cr = clamp(creatinine, 0.3, 10)
    // MELD minimum values
    if (bil < 1) bil = 1; if (cr < 1) cr = 1; if (i < 1) i = 1

    // MELD = 3.78×ln(bilirubin) + 11.2×ln(INR) + 9.57×ln(creatinine) + 6.43
    const meld = r0(clamp(3.78 * Math.log(bil) + 11.2 * Math.log(i) + 9.57 * Math.log(cr) + 6.43, 6, 40))

    const mortality3m = meld <= 9 ? 2 : meld <= 19 ? 6 : meld <= 29 ? 20 : meld <= 39 ? 52 : 71
    const label = meld <= 9 ? "Low" : meld <= 19 ? "Moderate" : meld <= 29 ? "High" : "Very High"
    const status: 'good' | 'warning' | 'danger' = meld <= 9 ? "good" : meld <= 19 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "MELD Score", value: `${meld}`, status, description: `${label} severity — 3-month mortality: ${mortality3m}%` },
      healthScore: Math.max(5, r0(100 - mortality3m)),
      metrics: [
        { label: "MELD Score", value: meld, status },
        { label: "3-Month Mortality", value: mortality3m, unit: "%", status },
        { label: "Severity", value: label, status },
        { label: "Bilirubin", value: bilirubin, unit: "mg/dL", status: bilirubin < 2 ? "good" : bilirubin < 5 ? "warning" : "danger" },
        { label: "INR", value: inr, status: inr < 1.5 ? "good" : inr < 2.5 ? "warning" : "danger" },
        { label: "Creatinine", value: creatinine, unit: "mg/dL", status: creatinine < 1.2 ? "good" : creatinine < 2 ? "warning" : "danger" },
        { label: "Transplant Priority", value: meld >= 15 ? "Listed/Priority" : "Monitor", status: meld >= 15 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Liver Failure", description: `MELD: ${meld} (${label}). 3-month mortality without transplant: ${mortality3m}%. ${meld >= 15 ? "MELD ≥15 = transplant benefit exceeds waitlist mortality. Refer to transplant center." : "Continue monitoring. Repeat MELD every 1-3 months."} MELD is used by UNOS for organ allocation — higher score = higher priority.`, priority: "high", category: "Assessment" },
        { title: "Management", description: `${bilirubin >= 5 ? "Severe jaundice — evaluate for biliary obstruction, hepatocellular failure." : ""} ${inr >= 2 ? "Coagulopathy — vitamin K trial, FFP if bleeding." : ""} ${creatinine >= 2 ? "Hepatorenal syndrome risk — volume status, albumin infusion, consider terlipressin." : ""} Avoid nephrotoxic drugs. Lactulose for hepatic encephalopathy. Beta-blockers for portal hypertension.`, priority: "high", category: "Treatment" },
        { title: "Transplant", description: `${meld >= 20 ? "Strong transplant indication. Evaluate candidacy: cardiac clearance, cancer screening, psychosocial eval, abstinence documentation if ALD." : meld >= 15 ? "Consider transplant evaluation." : "Below transplant threshold currently."} MELD-Na (adds sodium) may provide more accurate prediction. Living donor evaluation if applicable.`, priority: "medium", category: "Transplant" }
      ],
      detailedBreakdown: { "MELD": meld, "Mortality": `${mortality3m}%`, "Bil": bilirubin, "INR": inr, "Cr": creatinine }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="meld-score-calculator" title="MELD Score Calculator"
      description="Model for End-Stage Liver Disease scoring. Predicts 3-month mortality and liver transplant priority from bilirubin, INR, and creatinine."
      icon={Activity} calculate={calculate} onClear={() => { setBilirubin(3.0); setInr(1.8); setCreatinine(1.5); setResult(null) }}
      values={[bilirubin, inr, creatinine]} result={result}
      seoContent={<SeoContentGenerator title="MELD Score Calculator" description="End-stage liver disease severity and transplant priority." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Total Bilirubin" val={bilirubin} set={setBilirubin} min={0.1} max={30} step={0.1} suffix="mg/dL" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="INR" val={inr} set={setInr} min={0.8} max={8} step={0.1} />
          <NumInput label="Serum Creatinine" val={creatinine} set={setCreatinine} min={0.3} max={10} step={0.1} suffix="mg/dL" />
        </div>
      </div>} />
  )
}

// ─── 43. Child-Pugh Score Calculator ──────────────────────────────────────────
export function ChildPughScoreCalculator() {
  const [bilirubin, setBilirubin] = useState(2.5)
  const [albumin, setAlbumin] = useState(3.0)
  const [inr, setInr] = useState(1.8)
  const [ascites, setAscites] = useState("moderate")
  const [encephalopathy, setEncephalopathy] = useState("mild")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bil = clamp(bilirubin, 0.1, 20)
    const alb = clamp(albumin, 1.5, 5.5)
    const i = clamp(inr, 0.8, 6)

    let score = 0
    // Bilirubin
    if (bil > 3) score += 3; else if (bil > 2) score += 2; else score += 1
    // Albumin
    if (alb < 2.8) score += 3; else if (alb < 3.5) score += 2; else score += 1
    // INR
    if (i > 2.3) score += 3; else if (i > 1.7) score += 2; else score += 1
    // Ascites
    if (ascites === "severe") score += 3; else if (ascites === "moderate") score += 2; else score += 1
    // Encephalopathy
    if (encephalopathy === "severe") score += 3; else if (encephalopathy === "mild") score += 2; else score += 1

    const cpClass = score <= 6 ? "A" : score <= 9 ? "B" : "C"
    const survival1y = cpClass === "A" ? 100 : cpClass === "B" ? 80 : 45
    const survival2y = cpClass === "A" ? 85 : cpClass === "B" ? 60 : 35
    const label = `Class ${cpClass} — ${cpClass === "A" ? "Compensated" : cpClass === "B" ? "Significant" : "Decompensated"}`
    const status: 'good' | 'warning' | 'danger' = cpClass === "A" ? "good" : cpClass === "B" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Child-Pugh", value: `Class ${cpClass} (${score}/15)`, status, description: label },
      healthScore: r0(survival1y * 0.95),
      metrics: [
        { label: "Total Score", value: `${score}/15`, status },
        { label: "Class", value: `${cpClass} — ${cpClass === "A" ? "5-6pts" : cpClass === "B" ? "7-9pts" : "10-15pts"}`, status },
        { label: "1-Year Survival", value: survival1y, unit: "%", status: survival1y >= 80 ? "good" : survival1y >= 50 ? "warning" : "danger" },
        { label: "2-Year Survival", value: survival2y, unit: "%", status: survival2y >= 70 ? "good" : survival2y >= 40 ? "warning" : "danger" },
        { label: "Bilirubin", value: bil, unit: "mg/dL", status: bil <= 2 ? "good" : bil <= 3 ? "warning" : "danger" },
        { label: "Albumin", value: alb, unit: "g/dL", status: alb >= 3.5 ? "good" : alb >= 2.8 ? "warning" : "danger" },
        { label: "INR", value: i, status: i <= 1.7 ? "good" : i <= 2.3 ? "warning" : "danger" },
        { label: "Ascites", value: ascites, status: ascites === "none" ? "good" : ascites === "moderate" ? "warning" : "danger" },
        { label: "Encephalopathy", value: encephalopathy, status: encephalopathy === "none" ? "good" : encephalopathy === "mild" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Cirrhosis Severity", description: `Child-Pugh Class ${cpClass} (${score}/15). ${cpClass === "A" ? "Compensated cirrhosis — good hepatic reserve. Perioperative mortality ~10%." : cpClass === "B" ? "Significant dysfunction — moderate surgical risk (~30%). Consider transplant evaluation." : "Decompensated cirrhosis — high mortality. Transplant evaluation urgent. Perioperative mortality ~80%."} 1-year survival: ${survival1y}%.`, priority: "high", category: "Assessment" },
        { title: "Management", description: `${ascites !== "none" ? "Ascites: sodium restriction <2g/day, diuretics (spironolactone + furosemide), paracentesis if refractory. " : ""}${encephalopathy !== "none" ? "Encephalopathy: lactulose (2-3 soft stools/day), rifaximin for prevention. " : ""}${i > 2 ? "Coagulopathy: vitamin K, consider FFP before procedures. " : ""}Variceal screening (EGD). Beta-blockers for portal hypertension. HCC surveillance (US + AFP every 6 months).`, priority: "high", category: "Treatment" },
        { title: "Prognosis", description: `Class A: surgery generally safe. Class B: consider alternatives to surgery. Class C: surgery only if life-saving. ${cpClass === "C" ? "Transplant referral if no contraindications. Expected MELD will also be elevated." : ""} Avoid hepatotoxic medications, alcohol, NSAIDs.`, priority: "medium", category: "Prognosis" }
      ],
      detailedBreakdown: { "Score": `${score}/15`, "Class": cpClass, "1yr": `${survival1y}%`, "2yr": `${survival2y}%`, "Ascites": ascites, "HE": encephalopathy }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="child-pugh-score" title="Child-Pugh Score Calculator"
      description="Classify cirrhosis severity into Class A, B, or C based on bilirubin, albumin, INR, ascites, and hepatic encephalopathy."
      icon={Shield} calculate={calculate} onClear={() => { setBilirubin(2.5); setAlbumin(3.0); setInr(1.8); setAscites("moderate"); setEncephalopathy("mild"); setResult(null) }}
      values={[bilirubin, albumin, inr, ascites, encephalopathy]} result={result}
      seoContent={<SeoContentGenerator title="Child-Pugh Score Calculator" description="Cirrhosis severity classification with Child-Pugh scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Bilirubin" val={bilirubin} set={setBilirubin} min={0.1} max={20} step={0.1} suffix="mg/dL" />
          <NumInput label="Albumin" val={albumin} set={setAlbumin} min={1.5} max={5.5} step={0.1} suffix="g/dL" />
        </div>
        <NumInput label="INR" val={inr} set={setInr} min={0.8} max={6} step={0.1} />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Ascites" val={ascites} set={setAscites} options={[{ value: "none", label: "None" }, { value: "moderate", label: "Mild/Moderate (controlled)" }, { value: "severe", label: "Severe (refractory)" }]} />
          <SelectInput label="Hepatic Encephalopathy" val={encephalopathy} set={setEncephalopathy} options={[{ value: "none", label: "None" }, { value: "mild", label: "Grade I-II (mild)" }, { value: "severe", label: "Grade III-IV (severe)" }]} />
        </div>
      </div>} />
  )
}

// ─── 46. Urine Protein-Creatinine Ratio ───────────────────────────────────────
export function UrineProteinCreatinineCalculator() {
  const [urineProtein, setUrineProtein] = useState(250)
  const [urineCreatinine, setUrineCreatinine] = useState(100)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const up = clamp(urineProtein, 10, 5000)
    const uc = clamp(urineCreatinine, 10, 500)

    const upcr = r2(up / uc)
    const estimated24h = r0(upcr * 1000) // rough estimate in mg/24h
    const classification = upcr < 0.15 ? "Normal" : upcr < 0.5 ? "Mild Proteinuria" : upcr < 3.5 ? "Moderate Proteinuria" : "Nephrotic Range"
    const kidneyDamage = upcr < 0.15 ? "No damage" : upcr < 0.5 ? "Mild glomerular leak" : upcr < 3.5 ? "Significant glomerular damage" : "Severe — nephrotic syndrome likely"
    const label = classification
    const status: 'good' | 'warning' | 'danger' = upcr < 0.15 ? "good" : upcr < 0.5 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "UPCR", value: `${upcr}`, status, description: `${classification} — Est. ${estimated24h} mg/24h` },
      healthScore: r0(clamp(upcr < 0.15 ? 95 : upcr < 0.5 ? 70 : upcr < 3.5 ? 40 : 15, 5, 100)),
      metrics: [
        { label: "UPCR", value: upcr, status },
        { label: "Classification", value: classification, status },
        { label: "Est. 24h Protein", value: estimated24h, unit: "mg/24h", status },
        { label: "Kidney Damage", value: kidneyDamage, status },
        { label: "Urine Protein", value: up, unit: "mg/dL", status: up < 15 ? "good" : up < 100 ? "warning" : "danger" },
        { label: "Urine Creatinine", value: uc, unit: "mg/dL", status: "normal" },
        { label: "Nephrotic Range", value: upcr >= 3.5 ? "YES" : "No", status: upcr >= 3.5 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Proteinuria", description: `UPCR: ${upcr} (${classification}). Estimated 24h protein: ~${estimated24h}mg. ${upcr >= 3.5 ? "NEPHROTIC RANGE — further workup: serum albumin, lipids, renal biopsy consideration. Causes: minimal change, membranous, diabetic nephropathy, FSGS." : upcr >= 0.5 ? "Significant proteinuria — nephrology referral for evaluation." : upcr >= 0.15 ? "Mild proteinuria — monitor, check for diabetes/hypertension." : "Normal range."}`, priority: "high", category: "Assessment" },
        { title: "Management", description: `${upcr >= 0.5 ? "ACE inhibitor or ARB — reduces proteinuria and slows CKD progression. Target BP <130/80. Sodium restriction <2g/day." : ""} ${upcr >= 3.5 ? "Nephrotic syndrome management: diuretics for edema, statins for hyperlipidemia, anticoagulation consideration, infection prevention." : ""} Monitor: repeat UPCR in 3-6 months to track response.`, priority: "high", category: "Treatment" },
        { title: "Context", description: "UPCR from spot urine correlates well with 24h urine collection (gold standard). Normal <0.15, microalbuminuria 0.03-0.3 (ACR), macroalbuminuria >0.3. In diabetics, check albumin-to-creatinine ratio (ACR) for early nephropathy detection.", priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "UPCR": upcr, "Class": classification, "24h": `${estimated24h}mg`, "Protein": up, "Creatinine": uc }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="urine-protein-creatinine" title="Urine Protein-Creatinine Ratio Calculator"
      description="Calculate UPCR to assess proteinuria severity. Estimates 24-hour protein excretion from spot urine and classifies kidney damage."
      icon={Droplets} calculate={calculate} onClear={() => { setUrineProtein(250); setUrineCreatinine(100); setResult(null) }}
      values={[urineProtein, urineCreatinine]} result={result}
      seoContent={<SeoContentGenerator title="Urine Protein-Creatinine Ratio Calculator" description="Proteinuria severity and kidney damage classification." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Urine Protein" val={urineProtein} set={setUrineProtein} min={10} max={5000} suffix="mg/dL" />
          <NumInput label="Urine Creatinine" val={urineCreatinine} set={setUrineCreatinine} min={10} max={500} suffix="mg/dL" />
        </div>
      </div>} />
  )
}
