"use client"
import { useState } from "react"
import { Heart, Activity, TrendingUp, AlertCircle, Zap, Shield, Wind, Droplets, Thermometer, Brain } from "lucide-react"
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

// ─── 40. Ventricular Rate Calculator (ECG Rhythm Response Engine) ────────────
export function VentricularRateCalculator() {
  const [rrInterval, setRrInterval] = useState(0.8)
  const [qrsCount, setQrsCount] = useState(8)
  const [gridCount, setGridCount] = useState(4)
  const [sbp, setSbp] = useState(120)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rr = clamp(rrInterval, 0.15, 3.0)
    const qrs10 = clamp(qrsCount, 1, 30)
    const grid = clamp(gridCount, 1, 15)
    const bp = clamp(sbp, 60, 240)

    // Rate calculations (3 methods)
    const rateRR = r0(60 / rr)
    const rate10sec = r0(qrs10 * 6)
    const rateGrid = r0(300 / grid)

    // Average of methods
    const avgRate = r0((rateRR + rate10sec + rateGrid) / 3)

    // Rhythm regularity index (0-100; lower variance between methods = more regular)
    const variance = Math.sqrt(
      (Math.pow(rateRR - avgRate, 2) + Math.pow(rate10sec - avgRate, 2) + Math.pow(rateGrid - avgRate, 2)) / 3
    )
    const regularityIndex = r0(Math.max(0, 100 - variance * 3))

    // Classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (avgRate >= 60 && avgRate <= 100) { category = "🟢 Normal Sinus Rate"; status = "good" }
    else if (avgRate > 100 && avgRate <= 150) { category = "🟡 Sinus Tachycardia"; status = "warning" }
    else if (avgRate > 150) { category = "🔴 Severe Tachycardia"; status = "danger" }
    else if (avgRate >= 50 && avgRate < 60) { category = "🟡 Mild Bradycardia"; status = "warning" }
    else if (avgRate >= 40 && avgRate < 50) { category = "🔴 Bradycardia"; status = "danger" }
    else { category = "🟣 Severe Bradycardia"; status = "danger" }

    // Hemodynamic instability probability
    let hemoInstability = 0
    if (avgRate > 150) hemoInstability += 30
    else if (avgRate > 130) hemoInstability += 15
    if (avgRate < 40) hemoInstability += 35
    else if (avgRate < 50) hemoInstability += 15
    if (bp < 90) hemoInstability += 25
    else if (bp < 100) hemoInstability += 10
    if (regularityIndex < 50) hemoInstability += 15
    hemoInstability = r0(Math.min(80, hemoInstability))

    // Shock risk overlay
    const shockRisk = bp < 90 && (avgRate > 130 || avgRate < 45) ? "🔴 HIGH: Hemodynamic compromise — unstable arrhythmia" :
                      bp < 100 && avgRate > 120 ? "⚠️ Moderate — monitor closely" : "Low"

    // AI rhythm irregularity detection
    const irregularityAlert = regularityIndex < 40 ? "⚠️ Significant rhythm irregularity — consider AF, multifocal atrial tachycardia, or frequent ectopy" :
                              regularityIndex < 70 ? "Mild irregularity — sinus arrhythmia or occasional ectopy" : "Regular rhythm"

    setResult({
      primaryMetric: { label: "Ventricular Rate", value: `${avgRate} bpm`, status, description: category },
      healthScore: r0(Math.max(0, avgRate >= 60 && avgRate <= 100 ? 95 - Math.abs(avgRate - 75) * 0.5 : 100 - Math.abs(avgRate - 75) * 1.2)),
      metrics: [
        { label: "Avg Ventricular Rate", value: avgRate, unit: "bpm", status },
        { label: "Rate (60/R-R)", value: rateRR, unit: "bpm", status: "normal" },
        { label: "Rate (QRS×6)", value: rate10sec, unit: "bpm", status: "normal" },
        { label: "Rate (300/grid)", value: rateGrid, unit: "bpm", status: "normal" },
        { label: "Classification", value: category, status },
        { label: "Rhythm Regularity", value: regularityIndex, unit: "/100", status: regularityIndex >= 70 ? "good" : regularityIndex >= 40 ? "warning" : "danger" },
        { label: "Irregularity Analysis", value: irregularityAlert, status: regularityIndex >= 70 ? "good" : regularityIndex >= 40 ? "warning" : "danger" },
        { label: "Hemodynamic Instability", value: hemoInstability, unit: "%", status: hemoInstability < 15 ? "good" : hemoInstability < 35 ? "warning" : "danger" },
        { label: "Shock Risk", value: shockRisk, status: shockRisk === "Low" ? "good" : shockRisk.includes("Moderate") ? "warning" : "danger" },
        { label: "SBP", value: bp, unit: "mmHg", status: bp >= 110 ? "good" : bp >= 90 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "ECG Rate Assessment", description: `Three-method average: ${avgRate} bpm. R-R method: ${rateRR}, 10-sec strip: ${rate10sec}, grid: ${rateGrid}. ${category}. ${avgRate > 150 ? "🔴 URGENT: Rate >150 — differentiate SVT vs VT. If wide-complex → treat as VT until proven otherwise. Unstable → synchronized cardioversion." : avgRate < 40 ? "🔴 URGENT: Severe bradycardia — assess for heart block, medication effect (beta-blockers, CCBs, digoxin). Atropine 0.5mg IV, transcutaneous pacing if unresponsive." : ""}`, priority: "high", category: "Assessment" },
        { title: "Rhythm Stability", description: `Regularity index: ${regularityIndex}/100. ${irregularityAlert}. ${regularityIndex < 40 ? "Low regularity with rate discrepancy between methods suggests irregular rhythm. Atrial fibrillation is the most common cause. 12-lead ECG essential for diagnosis." : "Regular rhythm — sinus mechanism most likely if P waves present before each QRS."}`, priority: "high", category: "Rhythm" },
        { title: "Hemodynamic Correlation", description: `Instability probability: ${hemoInstability}%. ${shockRisk}. ${hemoInstability > 30 ? "Signs of instability: hypotension, altered mental status, chest pain, acute heart failure. ACLS protocol: unstable tachycardia → electrical cardioversion. Unstable bradycardia → atropine/pacing." : "Hemodynamically stable — pharmacologic management appropriate."}`, priority: hemoInstability > 30 ? "high" : "medium", category: "Hemodynamics" }
      ],
      detailedBreakdown: { "R-R Rate": `${rateRR} bpm`, "10s Rate": `${rate10sec} bpm`, "Grid Rate": `${rateGrid} bpm`, "Avg": `${avgRate} bpm`, "Regular": `${regularityIndex}/100`, "Hemo": `${hemoInstability}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ventricular-rate-calculator" title="Ventricular Rate Calculator"
      description="Calculate ventricular rate from ECG with three methods, rhythm regularity analysis, tachycardia/bradycardia classification, and hemodynamic instability assessment."
      icon={Zap} calculate={calculate} onClear={() => { setRrInterval(0.8); setQrsCount(8); setGridCount(4); setSbp(120); setResult(null) }}
      values={[rrInterval, qrsCount, gridCount, sbp]} result={result}
      seoContent={<SeoContentGenerator title="Ventricular Rate Calculator" description="Calculate ventricular rate from ECG intervals." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="R-R Interval" val={rrInterval} set={setRrInterval} min={0.15} max={3.0} step={0.01} suffix="seconds" />
          <NumInput label="QRS Count (10-sec strip)" val={qrsCount} set={setQrsCount} min={1} max={30} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Large Grid Boxes (R-R)" val={gridCount} set={setGridCount} min={1} max={15} />
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={60} max={240} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 41. Atrial Fibrillation Rate Calculator (AF Burden Estimator) ───────────
export function AtrialFibrillationRateCalculator() {
  const [avgHr, setAvgHr] = useState(95)
  const [rrVariability, setRrVariability] = useState(25)
  const [symptoms, setSymptoms] = useState("mild")
  const [sbp, setSbp] = useState(118)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hr = clamp(avgHr, 30, 250)
    const rrv = clamp(rrVariability, 0, 100)
    const bp = clamp(sbp, 60, 240)

    // Rate control classification
    let controlStatus = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (hr < 80) { controlStatus = "🟢 Well Controlled (Strict)"; status = "good" }
    else if (hr < 100) { controlStatus = "🟢 Controlled (Lenient)"; status = "good" }
    else if (hr < 110) { controlStatus = "🟡 Borderline Uncontrolled"; status = "warning" }
    else if (hr < 130) { controlStatus = "🔴 Uncontrolled"; status = "danger" }
    else { controlStatus = "🟣 Rapid Ventricular Response (RVR)"; status = "danger" }

    // CHA₂DS₂-VASc simplified stroke correlation
    const strokeCorrelation = hr > 100 ? "Uncontrolled AF increases stroke risk. CHA₂DS₂-VASc scoring recommended for anticoagulation decision." :
                              "Rate-controlled AF still requires anticoagulation assessment."

    // Rate control adequacy (0-100)
    const adequacy = r0(Math.max(0, hr < 100 ? 90 - Math.abs(hr - 75) * 0.5 : 100 - (hr - 80) * 1.5))

    // Hypotension probability
    let hypoProb = 0
    if (hr > 130) hypoProb += 25
    else if (hr > 110) hypoProb += 10
    if (bp < 100) hypoProb += 25
    else if (bp < 110) hypoProb += 10
    if (rrv > 40) hypoProb += 10
    hypoProb = r0(Math.min(60, hypoProb))

    // AF burden estimate
    const afBurden = rrv > 30 ? "High variability — persistent/permanent AF likely" : rrv > 15 ? "Moderate — paroxysmal or persistent AF" : "Low variability — may be rate-controlled or flutter"

    const symptomSeverity = symptoms === "severe" ? "EHRA IV — disabling symptoms" : symptoms === "moderate" ? "EHRA III — marked impact" : symptoms === "mild" ? "EHRA II — mild symptoms" : "EHRA I — asymptomatic"

    setResult({
      primaryMetric: { label: "AF Rate Control", value: `${hr} bpm`, status, description: controlStatus },
      healthScore: adequacy,
      metrics: [
        { label: "Average Heart Rate", value: hr, unit: "bpm", status },
        { label: "Control Status", value: controlStatus, status },
        { label: "Rate Control Adequacy", value: adequacy, unit: "/100", status: adequacy >= 70 ? "good" : adequacy >= 45 ? "warning" : "danger" },
        { label: "R-R Variability", value: rrv, unit: "%", status: rrv < 15 ? "normal" : rrv < 30 ? "warning" : "danger" },
        { label: "AF Burden", value: afBurden, status: rrv < 15 ? "good" : rrv < 30 ? "warning" : "danger" },
        { label: "Symptom Score (EHRA)", value: symptomSeverity, status: symptoms === "none" ? "good" : symptoms === "mild" ? "normal" : symptoms === "moderate" ? "warning" : "danger" },
        { label: "Systolic BP", value: bp, unit: "mmHg", status: bp >= 110 ? "good" : bp >= 90 ? "warning" : "danger" },
        { label: "Hypotension Probability", value: hypoProb, unit: "%", status: hypoProb < 10 ? "good" : hypoProb < 25 ? "warning" : "danger" },
        { label: "Stroke Risk Note", value: strokeCorrelation, status: hr > 100 ? "warning" : "normal" }
      ],
      recommendations: [
        { title: "AF Rate Assessment", description: `HR: ${hr} bpm. ${controlStatus}. AFFIRM/RACE trials: lenient rate control (HR <110 rest) is non-inferior to strict (<80). ${hr > 130 ? "🔴 RVR: IV rate control needed. Beta-blocker (metoprolol 5mg IV) or diltiazem (0.25mg/kg IV). If HF with reduced EF: amiodarone or digoxin preferred." : hr > 110 ? "🟡 Titrate rate control agents. Options: beta-blockers, non-DHP CCBs, digoxin." : "🟢 Rate adequately controlled."}`, priority: "high", category: "Assessment" },
        { title: "Stroke Prevention", description: `${strokeCorrelation} ALL AF patients need CHA₂DS₂-VASc assessment. Score ≥2 (men) or ≥3 (women): anticoagulate with DOAC (apixaban, rivarelbaan, edoxaban) or warfarin. DOACs preferred over warfarin for non-valvular AF.`, priority: "high", category: "Stroke" },
        { title: "Rhythm vs Rate", description: `${symptomSeverity}. ${symptoms === "severe" || symptoms === "moderate" ? "Symptomatic AF → consider rhythm control strategy: cardioversion, antiarrhythmic drugs, or catheter ablation. Ablation superior to drugs for maintaining sinus rhythm." : "Asymptomatic/mild → rate control is reasonable. Monitor for heart failure development (tachycardia-mediated cardiomyopathy risk if prolonged uncontrolled rate)."}`, priority: "medium", category: "Strategy" }
      ],
      detailedBreakdown: { "HR": `${hr} bpm`, "Control": controlStatus, "Adequacy": `${adequacy}/100`, "RRV": `${rrv}%`, "HypoRisk": `${hypoProb}%`, "EHRA": symptomSeverity }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="atrial-fibrillation-rate" title="Atrial Fibrillation Rate Calculator"
      description="Assess AF ventricular response rate, rate control adequacy, stroke risk correlation, and EHRA symptom scoring."
      icon={Heart} calculate={calculate} onClear={() => { setAvgHr(95); setRrVariability(25); setSymptoms("mild"); setSbp(118); setResult(null) }}
      values={[avgHr, rrVariability, symptoms, sbp]} result={result}
      seoContent={<SeoContentGenerator title="Atrial Fibrillation Rate Calculator" description="Evaluate AF rate control and burden." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average Heart Rate" val={avgHr} set={setAvgHr} min={30} max={250} suffix="bpm" />
          <NumInput label="R-R Variability" val={rrVariability} set={setRrVariability} min={0} max={100} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={60} max={240} suffix="mmHg" />
          <SelectInput label="Symptoms" val={symptoms} set={setSymptoms} options={[{ value: "none", label: "None (EHRA I)" }, { value: "mild", label: "Mild (EHRA II)" }, { value: "moderate", label: "Moderate (EHRA III)" }, { value: "severe", label: "Severe (EHRA IV)" }]} />
        </div>
      </div>} />
  )
}

// ─── 42. Pulse Deficit Calculator (Mechanical–Electrical Mismatch) ───────────
export function PulseDeficitCalculator() {
  const [apicalHr, setApicalHr] = useState(92)
  const [radialPulse, setRadialPulse] = useState(78)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ap = clamp(apicalHr, 30, 250)
    const rp = clamp(radialPulse, 20, 250)

    const deficit = r0(Math.max(0, ap - rp))
    const deficitPct = r1(ap > 0 ? deficit / ap * 100 : 0)

    // AF suspicion
    let afSuspicion = "Low"
    if (deficit >= 20) afSuspicion = "🔴 HIGH — large pulse deficit strongly suggests atrial fibrillation"
    else if (deficit >= 10) afSuspicion = "🟡 Moderate — significant mismatch, AF or frequent PVCs likely"
    else if (deficit >= 5) afSuspicion = "Mild — occasional ectopy possible"

    // Perfusion deficit alert
    let perfusionAlert = ""
    if (deficitPct > 20) perfusionAlert = "🔴 >20% beats not reaching periphery — significant perfusion deficit. End-organ hypoperfusion possible."
    else if (deficitPct > 10) perfusionAlert = "⚠️ Noticeable mechanical-electrical mismatch — cardiac output reduced"
    else perfusionAlert = "Minimal perfusion impact"

    // Hemodynamic effect estimate
    const coReduction = r0(deficitPct * 0.8)

    const status: 'good' | 'warning' | 'danger' | 'normal' = deficit < 5 ? "good" : deficit < 15 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Pulse Deficit", value: `${deficit} bpm`, status, description: `${deficitPct}% of beats lost — CO reduced ~${coReduction}%` },
      healthScore: r0(Math.max(0, 100 - deficitPct * 3)),
      metrics: [
        { label: "Pulse Deficit", value: deficit, unit: "bpm", status },
        { label: "Deficit Percentage", value: deficitPct, unit: "%", status },
        { label: "Apical Heart Rate", value: ap, unit: "bpm", status: ap >= 60 && ap <= 100 ? "good" : "warning" },
        { label: "Radial Pulse Rate", value: rp, unit: "bpm", status: rp >= 60 && rp <= 100 ? "good" : "warning" },
        { label: "AF Suspicion", value: afSuspicion, status: deficit < 5 ? "good" : deficit < 15 ? "warning" : "danger" },
        { label: "Perfusion Impact", value: perfusionAlert, status: deficitPct < 5 ? "good" : deficitPct < 15 ? "warning" : "danger" },
        { label: "Est. CO Reduction", value: coReduction, unit: "%", status: coReduction < 5 ? "good" : coReduction < 15 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Pulse Deficit Interpretation", description: `Deficit: ${deficit} bpm (${deficitPct}%). Apical: ${ap}, Radial: ${rp}. ${deficit >= 15 ? "🔴 LARGE DEFICIT: The heart is generating electrical beats that fail to produce effective mechanical contractions. This is pathognomonic of atrial fibrillation with rapid ventricular response, where many beats occur before adequate ventricular filling." : deficit >= 5 ? "🟡 Moderate deficit suggests irregular rhythm with some ineffective beats. Common in AF, frequent PVCs, or bigeminy." : "🟢 Minimal or no deficit — consistent mechanical-electrical coupling."}`, priority: "high", category: "Assessment" },
        { title: "Perfusion & CO Impact", description: `${perfusionAlert}. Estimated cardiac output reduction: ~${coReduction}%. ${coReduction > 15 ? "Each non-perfusing beat wastes energy without systemic flow. Rate control is essential to allow adequate diastolic filling time. Target HR <100 in AF." : "Perfusion adequate."}`, priority: "high", category: "Perfusion" },
        { title: "Clinical Action", description: `${deficit >= 10 ? "Confirm with 12-lead ECG. If AF confirmed: rate control + CHA₂DS₂-VASc assessment. Auscultate apex continuously for 60 seconds while partner palpates radial pulse. Deficit >20 bpm — urgent rate control." : "No urgent action needed. If symptomatic, consider Holter monitoring for intermittent arrhythmia."}`, priority: "medium", category: "Management" }
      ],
      detailedBreakdown: { "Apical": `${ap} bpm`, "Radial": `${rp} bpm`, "Deficit": `${deficit} bpm`, "Deficit%": `${deficitPct}%`, "CO Loss": `~${coReduction}%`, "AF": afSuspicion }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pulse-deficit-calculator" title="Pulse Deficit Calculator"
      description="Detect mechanical-electrical mismatch between apical and radial pulse with AF suspicion scoring, perfusion deficit analysis, and cardiac output impact."
      icon={Activity} calculate={calculate} onClear={() => { setApicalHr(92); setRadialPulse(78); setResult(null) }}
      values={[apicalHr, radialPulse]} result={result}
      seoContent={<SeoContentGenerator title="Pulse Deficit Calculator" description="Calculate pulse deficit for arrhythmia screening." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Apical Heart Rate" val={apicalHr} set={setApicalHr} min={30} max={250} suffix="bpm" />
          <NumInput label="Radial Pulse Rate" val={radialPulse} set={setRadialPulse} min={20} max={250} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 43. Respiratory Quotient (RQ) Calculator (Metabolic Substrate Analyzer) ─
export function RespiratoryQuotientCalculator() {
  const [vco2, setVco2] = useState(200)
  const [vo2, setVo2] = useState(250)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const vc = clamp(vco2, 50, 1000)
    const vo = clamp(vo2, 50, 1500)

    const rq = r2(vc / vo)

    // Substrate categories
    let substrate = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (rq <= 0.72) { substrate = "Pure Fat Oxidation"; status = "good" }
    else if (rq <= 0.82) { substrate = "Predominantly Fat"; status = "good" }
    else if (rq <= 0.88) { substrate = "Mixed Fuel (Fat + Carbs)"; status = "good" }
    else if (rq <= 0.95) { substrate = "Predominantly Carbohydrate"; status = "normal" }
    else if (rq <= 1.0) { substrate = "Pure Carbohydrate Oxidation"; status = "normal" }
    else { substrate = "🔴 Lipogenesis (RQ > 1.0) — Overfeeding"; status = "danger" }

    // Lipogenesis flag
    const lipogenesis = rq > 1.0 ? "⚠️ ACTIVE: RQ >1.0 indicates net fat synthesis from carbohydrate. Reduce caloric/carb intake." : "Not detected"

    // Metabolic flexibility score (optimal ~0.85, can switch fuels)
    const flexibility = r0(Math.max(0, 100 - Math.abs(rq - 0.85) * 200))

    // ICU context
    const icuNote = rq > 1.0 ? "ICU: Overfeeding. Excess CO₂ production may impair ventilator weaning. Reduce dextrose infusion rate." :
                    rq < 0.7 ? "ICU: Extreme fat oxidation. Check for starvation/underfeeding. Protein-calorie malnutrition risk." : ""

    // Fat vs carb oxidation rates (estimated)
    const fatOxRate = r0(Math.max(0, (1.0 - rq) / 0.3 * 100))
    const carbOxRate = r0(Math.max(0, (rq - 0.7) / 0.3 * 100))

    setResult({
      primaryMetric: { label: "Respiratory Quotient", value: `${rq}`, status, description: substrate },
      healthScore: flexibility,
      metrics: [
        { label: "RQ (VCO₂/VO₂)", value: rq, status },
        { label: "Substrate", value: substrate, status },
        { label: "Fat Oxidation", value: fatOxRate, unit: "%", status: "normal" },
        { label: "Carb Oxidation", value: carbOxRate, unit: "%", status: "normal" },
        { label: "VCO₂", value: vc, unit: "mL/min", status: "normal" },
        { label: "VO₂", value: vo, unit: "mL/min", status: "normal" },
        { label: "Metabolic Flexibility", value: flexibility, unit: "/100", status: flexibility >= 60 ? "good" : flexibility >= 40 ? "warning" : "danger" },
        { label: "Lipogenesis Flag", value: lipogenesis, status: rq > 1.0 ? "danger" : "good" }
      ],
      recommendations: [
        { title: "RQ Interpretation", description: `RQ: ${rq} = ${substrate}. Reference: 0.7 = pure fat, 0.8 = protein, 0.85 = mixed, 1.0 = pure carb, >1.0 = lipogenesis. ${rq > 1.0 ? "🔴 Lipogenesis: Excess carbohydrate being converted to fat. Produces extra CO₂ which can cause respiratory acidosis in ventilated patients and impair weaning." : rq < 0.72 ? "Low RQ indicates fat-dominant metabolism. Common in fasting, ketosis, or carbohydrate restriction." : "🟢 Mixed fuel utilization indicates normal metabolic flexibility."}`, priority: "high", category: "Assessment" },
        { title: "Clinical Application", description: `${icuNote || "Normal substrate utilization."} Metabolic flexibility: ${flexibility}/100. ${flexibility < 40 ? "Low metabolic flexibility is associated with insulin resistance and metabolic syndrome. Healthy individuals shift between fat (fasting) and carb (postprandial) oxidation." : "Good metabolic adaptability."}`, priority: "high", category: "Clinical" },
        { title: "Nutrition Optimization", description: `Fat oxidation: ~${fatOxRate}%, Carb oxidation: ~${carbOxRate}%. ${rq > 1.0 ? "Reduce carbohydrate calories by 20-30%. ICU: switch to lipid-based nutrition formulas." : rq < 0.75 ? "Consider increasing carbohydrate intake if unintentional." : "Balanced macronutrient intake reflected."} Optimal for weight loss: RQ 0.75-0.85 (fat-burning zone).`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "VCO₂": `${vc} mL/min`, "VO₂": `${vo} mL/min`, "RQ": rq, "Fat%": `${fatOxRate}%`, "Carb%": `${carbOxRate}%`, "Flex": `${flexibility}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="respiratory-quotient" title="Respiratory Quotient (RQ) Calculator"
      description="Determine metabolic fuel utilization from VCO₂/VO₂ with lipogenesis detection, metabolic flexibility scoring, and ICU nutrition guidance."
      icon={Wind} calculate={calculate} onClear={() => { setVco2(200); setVo2(250); setResult(null) }}
      values={[vco2, vo2]} result={result}
      seoContent={<SeoContentGenerator title="Respiratory Quotient Calculator" description="Calculate RQ for metabolic substrate analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="VCO₂ (CO₂ Production)" val={vco2} set={setVco2} min={50} max={1000} suffix="mL/min" />
          <NumInput label="VO₂ (O₂ Consumption)" val={vo2} set={setVo2} min={50} max={1500} suffix="mL/min" />
        </div>
      </div>} />
  )
}

// ─── 44. Tidal Volume Calculator (Ventilatory Capacity Estimator) ────────────
export function AdvancedTidalVolumeCalculator() {
  const [weight, setWeight] = useState(70)
  const [gender, setGender] = useState("male")
  const [lungCondition, setLungCondition] = useState("normal")
  const [measuredTv, setMeasuredTv] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 200)
    const male = gender === "male"

    // Ideal Body Weight (IBW) — Devine formula (in kg, height proxy from weight)
    // For ventilation, use IBW. Since we don't have height, use approximate
    const ibw = male ? Math.max(45, w * 0.85) : Math.max(40, w * 0.8)

    // Ideal TV ranges
    const tvLow = r0(ibw * 6) // 6 mL/kg IBW (lung-protective)
    const tvIdeal = r0(ibw * 7) // 7 mL/kg
    const tvHigh = r0(ibw * 8) // 8 mL/kg

    // Condition-adjusted
    let targetTv = tvIdeal
    let strategy = "Standard"
    if (lungCondition === "ards") { targetTv = tvLow; strategy = "Lung-Protective (6 mL/kg IBW)" }
    else if (lungCondition === "copd") { targetTv = r0(ibw * 6.5); strategy = "Low TV to prevent hyperinflation" }
    else if (lungCondition === "obese") { targetTv = tvLow; strategy = "Use IBW, not actual weight" }

    // Measured TV analysis
    const mv = clamp(measuredTv, 0, 2000)
    const mlPerKg = mv > 0 ? r1(mv / ibw) : 0

    // Barotrauma risk
    let baroRisk = "Low"
    if (mv > 0 && mlPerKg > 10) baroRisk = "🔴 HIGH — TV >10 mL/kg IBW dramatically increases VILI risk"
    else if (mv > 0 && mlPerKg > 8) baroRisk = "⚠️ Moderate — consider reducing TV"
    else if (lungCondition === "ards" && mv > 0 && mlPerKg > 6) baroRisk = "⚠️ Above lung-protective threshold for ARDS"

    // Lung-protective check
    const lpCompliant = mv > 0 ? (mlPerKg <= 6 ? "✅ Yes — ≤6 mL/kg IBW" : mlPerKg <= 8 ? "⚠️ Borderline" : "❌ No — exceeds protective limit") : "Enter measured TV to assess"

    const status: 'good' | 'warning' | 'danger' | 'normal' = mv === 0 ? "normal" : mlPerKg <= 6 ? "good" : mlPerKg <= 8 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Target Tidal Volume", value: `${targetTv} mL`, status: "good", description: `${strategy} — IBW: ${r0(ibw)} kg` },
      healthScore: mv > 0 ? r0(Math.max(0, 100 - Math.abs(mlPerKg - 6.5) * 15)) : 80,
      metrics: [
        { label: "Target TV", value: targetTv, unit: "mL", status: "good" },
        { label: "TV Range", value: `${tvLow}–${tvHigh}`, unit: "mL", status: "normal" },
        { label: "Ideal Body Weight", value: r0(ibw), unit: "kg", status: "normal" },
        { label: "Ventilation Strategy", value: strategy, status: "normal" },
        { label: "Measured TV", value: mv > 0 ? mv : "Not entered", unit: mv > 0 ? "mL" : "", status },
        { label: "mL/kg IBW", value: mv > 0 ? mlPerKg : "N/A", status },
        { label: "Lung-Protective", value: lpCompliant, status: mv === 0 ? "normal" : mlPerKg <= 6 ? "good" : mlPerKg <= 8 ? "warning" : "danger" },
        { label: "Barotrauma Risk", value: baroRisk, status: baroRisk === "Low" ? "good" : baroRisk.includes("Moderate") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Tidal Volume Strategy", description: `Target: ${targetTv} mL (${strategy}). IBW: ${r0(ibw)} kg. ${lungCondition === "ards" ? "🔴 ARDS: ARDSNet protocol — 6 mL/kg IBW is THE standard. Higher TV increases mortality. Plateau pressure <30 cmH₂O. Driving pressure <15 cmH₂O." : lungCondition === "copd" ? "COPD: Lower TV with longer expiratory time to prevent air trapping and auto-PEEP." : "Standard: 6-8 mL/kg IBW for all mechanically ventilated patients. Even non-ARDS patients benefit from lower TV (PREVENT trial)."} CRITICAL: Always use IBW, not actual body weight.`, priority: "high", category: "Ventilation" },
        { title: "Measured Volume Assessment", description: `${mv > 0 ? "Measured TV: " + mv + " mL = " + mlPerKg + " mL/kg IBW. " + lpCompliant + ". " + baroRisk + "." : "Enter measured TV to compare with target."} ${mv > 0 && mlPerKg > 8 ? "VILI risk: Ventilator-Induced Lung Injury occurs through volutrauma (overdistension), atelectrauma (cyclic opening/closing), and biotrauma (inflammatory cascade)." : ""}`, priority: "high", category: "Assessment" },
        { title: "Monitoring", description: `Monitor: plateau pressure (<30 cmH₂O), driving pressure (<15 preferred), compliance trends, and adequacy of gas exchange. ${lungCondition === "ards" ? "Consider prone positioning if P/F <150. Permissive hypercapnia acceptable (pH >7.20) to maintain lung-protective TV." : ""}`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "IBW": `${r0(ibw)} kg`, "Target": `${targetTv} mL`, "Range": `${tvLow}–${tvHigh}`, "Strategy": strategy, "Measured": mv > 0 ? `${mv} (${mlPerKg} mL/kg)` : "N/A", "Baro": baroRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="tidal-volume-calculator" title="Tidal Volume Calculator"
      description="Calculate ideal tidal volume with lung-protective ventilation strategy assessment, barotrauma risk scoring, and condition-specific targets."
      icon={Wind} calculate={calculate} onClear={() => { setWeight(70); setGender("male"); setLungCondition("normal"); setMeasuredTv(0); setResult(null) }}
      values={[weight, gender, lungCondition, measuredTv]} result={result}
      seoContent={<SeoContentGenerator title="Tidal Volume Calculator" description="Calculate ideal tidal volume for ventilation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <SelectInput label="Lung Condition" val={lungCondition} set={setLungCondition} options={[{ value: "normal", label: "Normal Lungs" }, { value: "ards", label: "ARDS" }, { value: "copd", label: "COPD" }, { value: "obese", label: "Obesity" }]} />
        <NumInput label="Measured TV (optional)" val={measuredTv} set={setMeasuredTv} min={0} max={2000} suffix="mL" />
      </div>} />
  )
}

// ─── 45. Minute Ventilation Calculator (Total Ventilation Model) ─────────────
export function MinuteVentilationCalculator() {
  const [tv, setTv] = useState(500)
  const [rr, setRr] = useState(16)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(tv, 100, 2000)
    const r = clamp(rr, 4, 50)

    const ve = r2(t * r / 1000) // L/min
    const veMl = r0(t * r)

    // Dead space estimate (~150 mL anatomical)
    const deadSpace = 150
    const alveolarVent = r2((t - deadSpace) * r / 1000) // L/min

    // Classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (ve >= 4 && ve <= 8) { category = "🟢 Normal"; status = "good" }
    else if (ve > 8 && ve <= 12) { category = "🟡 Mild Hyperventilation"; status = "warning" }
    else if (ve > 12) { category = "🔴 Hyperventilation"; status = "danger" }
    else if (ve >= 3 && ve < 4) { category = "🟡 Mild Hypoventilation"; status = "warning" }
    else { category = "🔴 Hypoventilation"; status = "danger" }

    // CO₂ retention probability
    let co2Retention = "Low"
    if (ve < 3) co2Retention = "🔴 HIGH — likely hypercapnia (PaCO₂ >50 mmHg)"
    else if (ve < 4) co2Retention = "⚠️ Moderate — monitor ABG"
    else if (ve > 12) co2Retention = "Low (hyperventilating — may cause hypocapnia)"

    // Respiratory failure risk
    const rfRisk = ve < 3 ? "🔴 Type II respiratory failure likely" : ve < 4 ? "⚠️ Borderline — watch for deterioration" : "Within acceptable range"

    setResult({
      primaryMetric: { label: "Minute Ventilation", value: `${ve} L/min`, status, description: `${category} — Alveolar: ${alveolarVent} L/min` },
      healthScore: r0(Math.max(0, ve >= 4 && ve <= 8 ? 95 : 100 - Math.abs(ve - 6) * 12)),
      metrics: [
        { label: "Minute Ventilation (VE)", value: ve, unit: "L/min", status },
        { label: "VE (mL/min)", value: veMl, unit: "mL/min", status: "normal" },
        { label: "Alveolar Ventilation", value: alveolarVent, unit: "L/min", status: alveolarVent >= 3 ? "good" : alveolarVent >= 2 ? "warning" : "danger" },
        { label: "Tidal Volume", value: t, unit: "mL", status: "normal" },
        { label: "Respiratory Rate", value: r, unit: "/min", status: r >= 12 && r <= 20 ? "good" : r >= 8 && r <= 25 ? "warning" : "danger" },
        { label: "Dead Space (est.)", value: deadSpace, unit: "mL", status: "normal" },
        { label: "Classification", value: category, status },
        { label: "CO₂ Retention Risk", value: co2Retention, status: co2Retention === "Low" ? "good" : co2Retention.includes("Moderate") ? "warning" : "danger" },
        { label: "Resp Failure Risk", value: rfRisk, status: rfRisk.includes("acceptable") ? "good" : rfRisk.includes("Borderline") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Minute Ventilation Analysis", description: `VE = TV × RR = ${t} × ${r} = ${ve} L/min. Normal: 4-8 L/min. Alveolar ventilation (effective gas exchange): ${alveolarVent} L/min. ${ve > 12 ? "🔴 Hyperventilation: Causes respiratory alkalosis (low PaCO₂). Common causes: anxiety, pain, metabolic acidosis compensation, PE, pneumothorax. Check ABG." : ve < 3 ? "🔴 Hypoventilation: Inadequate CO₂ clearance → respiratory acidosis. Causes: CNS depression, neuromuscular disease, obesity hypoventilation, chest wall abnormality." : "🟢 Normal ventilation."}`, priority: "high", category: "Assessment" },
        { title: "CO₂ & Acid-Base", description: `${co2Retention}. VE is inversely proportional to PaCO₂. Doubling VE halves PaCO₂. ${ve < 4 ? "ABG recommended. If PaCO₂ >50 with pH <7.35: acute hypercapnic respiratory failure. Consider NIV (BiPAP) or intubation." : ve > 10 ? "Consider etiology: metabolic acidosis? Kussmaul breathing if DKA. Pain? Anxiety? PE?" : ""}`, priority: "high", category: "Acid-Base" },
        { title: "Ventilator Context", description: `On mechanical ventilation: target VE to maintain PaCO₂ 35-45 mmHg and pH 7.35-7.45. ${t > 600 ? "TV is high — ensure <8 mL/kg IBW. Prefer increasing RR over TV  for higher VE (lung protection)." : ""} Weaning readiness: spontaneous VE <10 L/min, RR <25, rapid shallow breathing index (RR/TV) <105.`, priority: "medium", category: "Ventilator" }
      ],
      detailedBreakdown: { "TV": `${t} mL`, "RR": `${r}/min`, "VE": `${ve} L/min`, "AlvVent": `${alveolarVent} L/min`, "CO₂ Risk": co2Retention }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="minute-ventilation" title="Minute Ventilation Calculator"
      description="Calculate total and alveolar ventilation with hypo/hyperventilation detection, CO₂ retention risk, and ventilator weaning guidance."
      icon={Wind} calculate={calculate} onClear={() => { setTv(500); setRr(16); setResult(null) }}
      values={[tv, rr]} result={result}
      seoContent={<SeoContentGenerator title="Minute Ventilation Calculator" description="Calculate minute ventilation from tidal volume and rate." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Tidal Volume" val={tv} set={setTv} min={100} max={2000} suffix="mL" />
          <NumInput label="Respiratory Rate" val={rr} set={setRr} min={4} max={50} suffix="/min" />
        </div>
      </div>} />
  )
}

// ─── 46. Alveolar Gas Equation (Oxygenation Predictor) ──────────────────────
export function AlveolarGasEquationCalculator() {
  const [fio2, setFio2] = useState(0.21)
  const [patm, setPatm] = useState(760)
  const [paco2, setPaco2] = useState(40)
  const [rq, setRq] = useState(0.8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const fi = clamp(fio2, 0.21, 1.0)
    const pa = clamp(patm, 500, 800)
    const pc = clamp(paco2, 10, 100)
    const r = clamp(rq, 0.6, 1.2)

    const ph2o = 47 // water vapor pressure at 37°C
    const pao2 = r1(fi * (pa - ph2o) - pc / r)

    // Normal expected PAO₂ at sea level on room air ≈ 100-110 mmHg
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (pao2 >= 80) { category = "🟢 Adequate Alveolar Oxygenation"; status = "good" }
    else if (pao2 >= 60) { category = "🟡 Mild Oxygenation Impairment"; status = "warning" }
    else if (pao2 >= 40) { category = "🔴 Moderate Impairment"; status = "danger" }
    else { category = "🟣 Severe Oxygenation Compromise"; status = "danger" }

    // Oxygenation impairment severity
    const expectedPao2 = r1(fi * (pa - ph2o) - 40 / 0.8) // with normal PaCO₂
    const impairment = pao2 < expectedPao2 - 10 ? "Hypoventilation contributing (elevated PaCO₂)" : "PAO₂ appropriate for given FiO₂ and PaCO₂"

    setResult({
      primaryMetric: { label: "Alveolar PO₂ (PAO₂)", value: `${pao2} mmHg`, status, description: category },
      healthScore: r0(Math.max(0, Math.min(100, pao2 * 0.9))),
      metrics: [
        { label: "PAO₂", value: pao2, unit: "mmHg", status },
        { label: "Classification", value: category, status },
        { label: "FiO₂", value: fi, status: fi === 0.21 ? "good" : fi <= 0.4 ? "normal" : fi <= 0.6 ? "warning" : "danger" },
        { label: "Atmospheric Pressure", value: pa, unit: "mmHg", status: "normal" },
        { label: "PaCO₂", value: pc, unit: "mmHg", status: pc >= 35 && pc <= 45 ? "good" : pc <= 50 ? "warning" : "danger" },
        { label: "RQ", value: r, status: "normal" },
        { label: "Expected PAO₂ (normal CO₂)", value: expectedPao2, unit: "mmHg", status: "normal" },
        { label: "Impairment Note", value: impairment, status: impairment.includes("Hypoventilation") ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Alveolar Gas Equation", description: `PAO₂ = FiO₂ × (Patm − PH₂O) − PaCO₂/RQ = ${fi} × (${pa} − 47) − ${pc}/${r} = ${pao2} mmHg. ${pao2 < 60 ? "🔴 LOW PAO₂: Even maximum alveolar O₂ is compromised. At this level, PaO₂ will be even lower (due to A-a gradient). Hypoxic respiratory failure likely." : ""}. PAO₂ is the theoretical maximum O₂ available for gas exchange.`, priority: "high", category: "Assessment" },
        { title: "Clinical Significance", description: `PAO₂ is used to calculate the A-a gradient (PAO₂ − PaO₂). Normal A-a gradient: (Age/4) + 4 mmHg. ${pc > 50 ? "Elevated PaCO₂ reduces PAO₂ — treat the hypoventilation to improve oxygenation. In pure hypoventilation, A-a gradient is normal." : ""} ${fi > 0.6 ? "FiO₂ >0.6: Prolonged use risks oxygen toxicity (absorption atelectasis, oxidative lung injury)." : ""}`, priority: "high", category: "Clinical" },
        { title: "ARDS Context", description: `In ARDS: PAO₂ may be normal/high (if high FiO₂) but A-a gradient is wide. Monitor: PAO₂, A-a gradient, and P/F ratio together for complete oxygenation picture. ${fi > 0.4 ? "Goal: wean FiO₂ to maintain SpO₂ 88-95% (ARDS) or ≥94% (general). Use PEEP optimization to reduce FiO₂ requirement." : ""}`, priority: "medium", category: "ARDS" }
      ],
      detailedBreakdown: { "FiO₂": fi, "Patm": `${pa} mmHg`, "PH₂O": "47 mmHg", "PaCO₂": `${pc} mmHg`, "RQ": r, "PAO₂": `${pao2} mmHg` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="alveolar-gas-equation" title="Alveolar Gas Equation Calculator"
      description="Calculate alveolar oxygen pressure (PAO₂) with oxygenation impairment severity assessment and ARDS monitoring guidance."
      icon={Wind} calculate={calculate} onClear={() => { setFio2(0.21); setPatm(760); setPaco2(40); setRq(0.8); setResult(null) }}
      values={[fio2, patm, paco2, rq]} result={result}
      seoContent={<SeoContentGenerator title="Alveolar Gas Equation" description="Calculate alveolar oxygen partial pressure." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="FiO₂" val={fio2} set={setFio2} min={0.21} max={1.0} step={0.01} suffix="fraction" />
          <NumInput label="Atmospheric Pressure" val={patm} set={setPatm} min={500} max={800} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="PaCO₂" val={paco2} set={setPaco2} min={10} max={100} suffix="mmHg" />
          <NumInput label="Respiratory Quotient" val={rq} set={setRq} min={0.6} max={1.2} step={0.01} />
        </div>
      </div>} />
  )
}

// ─── 47. A-a Gradient Calculator (Gas Exchange Efficiency) ──────────────────
export function AaGradientCalculator() {
  const [pao2Alv, setPao2Alv] = useState(100)
  const [pao2Art, setPao2Art] = useState(85)
  const [age, setAge] = useState(40)
  const [fio2, setFio2] = useState(0.21)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pa = clamp(pao2Alv, 20, 700)
    const pArt = clamp(pao2Art, 20, 600)
    const a = clamp(age, 18, 90)
    const fi = clamp(fio2, 0.21, 1.0)

    const aaGrad = r1(pa - pArt)
    const expectedGrad = r1(a / 4 + 4) // age-adjusted normal
    const upperNormal = r1(expectedGrad + 10)

    // Elevated?
    const elevated = aaGrad > upperNormal

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (aaGrad <= expectedGrad) { category = "🟢 Normal A-a Gradient"; status = "good" }
    else if (aaGrad <= upperNormal) { category = "🟡 Borderline Elevated"; status = "warning" }
    else if (aaGrad <= 40) { category = "🔴 Elevated — V/Q Mismatch"; status = "danger" }
    else { category = "🟣 Severely Elevated — Shunt/Severe V/Q Mismatch"; status = "danger" }

    // V/Q mismatch probability
    const vqMismatch = aaGrad > upperNormal ? r0(Math.min(90, (aaGrad - expectedGrad) * 3)) : 0

    // PE suspicion
    const peSuspicion = aaGrad > 20 && fi === 0.21 ? "⚠️ Elevated A-a gradient on room air — PE should be considered in differential" : "Not specifically indicated"

    // Differential
    let differential = ""
    if (aaGrad <= expectedGrad) differential = "Normal gradient: If hypoxic, causes are hypoventilation or low FiO₂ (altitude)"
    else if (aaGrad <= 30) differential = "Mild-moderate elevation: V/Q mismatch (most common — COPD, asthma, pneumonia), early PE"
    else differential = "Severe elevation: Intrapulmonary shunt (ARDS, pneumonia, AVM), massive PE, hepatopulmonary syndrome"

    setResult({
      primaryMetric: { label: "A-a Gradient", value: `${aaGrad} mmHg`, status, description: `Expected: ${expectedGrad} mmHg (age ${a})` },
      healthScore: r0(Math.max(0, elevated ? 100 - aaGrad * 1.5 : 95)),
      metrics: [
        { label: "A-a Gradient", value: aaGrad, unit: "mmHg", status },
        { label: "Expected (age-adj)", value: expectedGrad, unit: "mmHg", status: "normal" },
        { label: "Upper Normal Limit", value: upperNormal, unit: "mmHg", status: "normal" },
        { label: "PAO₂ (Alveolar)", value: pa, unit: "mmHg", status: "normal" },
        { label: "PaO₂ (Arterial)", value: pArt, unit: "mmHg", status: pArt >= 80 ? "good" : pArt >= 60 ? "warning" : "danger" },
        { label: "Classification", value: category, status },
        { label: "V/Q Mismatch Prob.", value: vqMismatch, unit: "%", status: vqMismatch < 20 ? "good" : vqMismatch < 50 ? "warning" : "danger" },
        { label: "PE Consideration", value: peSuspicion, status: peSuspicion.includes("PE") ? "warning" : "good" },
        { label: "Differential", value: differential, status: elevated ? "warning" : "good" }
      ],
      recommendations: [
        { title: "A-a Gradient Interpretation", description: `A-a Gradient = PAO₂ − PaO₂ = ${pa} − ${pArt} = ${aaGrad} mmHg. Expected for age ${a}: ${expectedGrad} mmHg (upper limit: ${upperNormal}). ${elevated ? "🔴 ELEVATED: Indicates intrinsic lung problem — V/Q mismatch or shunt. The lung is unable to effectively transfer O₂ from alveoli to blood." : "🟢 NORMAL: If hypoxic, the lungs are working normally — problem is either hypoventilation (high PaCO₂) or low inspired O₂."}`, priority: "high", category: "Assessment" },
        { title: "Diagnostic Framework", description: `${differential}. KEY DISTINCTION: Normal A-a gradient + hypoxia = hypoventilation (treat the cause). Elevated A-a gradient + hypoxia = lung pathology (V/Q mismatch or shunt). If gradient doesn't correct with 100% O₂ → true shunt (ARDS, intracardiac right-to-left shunt).`, priority: "high", category: "Diagnosis" },
        { title: "PE & Pulmonary Pathology", description: `${peSuspicion}. ${aaGrad > 20 ? "An elevated A-a gradient is 80% sensitive for PE but not specific. Use with Wells score, D-dimer, and CTPA for PE workup. Other causes: pneumonia, CHF, ILD, ARDS." : "Low suspicion."}`, priority: "medium", category: "PE" }
      ],
      detailedBreakdown: { "PAO₂": `${pa} mmHg`, "PaO₂": `${pArt} mmHg`, "A-a": `${aaGrad} mmHg`, "Expected": `${expectedGrad} mmHg`, "V/Q%": `${vqMismatch}%`, "Diff": differential }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="aa-gradient-calculator" title="A-a Gradient Calculator"
      description="Calculate alveolar-arterial oxygen gradient with V/Q mismatch probability, PE screening, and pulmonary pathology differential."
      icon={Activity} calculate={calculate} onClear={() => { setPao2Alv(100); setPao2Art(85); setAge(40); setFio2(0.21); setResult(null) }}
      values={[pao2Alv, pao2Art, age, fio2]} result={result}
      seoContent={<SeoContentGenerator title="A-a Gradient Calculator" description="Calculate alveolar-arterial oxygen gradient." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="PAO₂ (Alveolar)" val={pao2Alv} set={setPao2Alv} min={20} max={700} suffix="mmHg" />
          <NumInput label="PaO₂ (Arterial)" val={pao2Art} set={setPao2Art} min={20} max={600} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <NumInput label="FiO₂" val={fio2} set={setFio2} min={0.21} max={1.0} step={0.01} suffix="fraction" />
        </div>
      </div>} />
  )
}

// ─── 48. PaO₂/FiO₂ Ratio (ARDS Severity Marker) ───────────────────────────
export function AdvancedPaO2FiO2Calculator() {
  const [pao2, setPao2] = useState(80)
  const [fio2, setFio2] = useState(0.4)
  const [peep, setPeep] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pa = clamp(pao2, 20, 600)
    const fi = clamp(fio2, 0.21, 1.0)
    const p = clamp(peep, 0, 25)

    const pfRatio = r0(pa / fi)

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (pfRatio >= 300) { category = "🟢 Normal Oxygenation"; status = "good" }
    else if (pfRatio >= 200) { category = "🟡 Mild ARDS (Berlin: 200–300)"; status = "warning" }
    else if (pfRatio >= 100) { category = "🔴 Moderate ARDS (Berlin: 100–200)"; status = "danger" }
    else { category = "🟣 Severe ARDS (Berlin: <100)"; status = "danger" }

    // ICU alert
    const icuAlert = pfRatio < 100 ? "🔴 CRITICAL: PF <100 = severe ARDS. Mortality 40-50%. Lung-protective ventilation + prone positioning + consider ECMO if refractory." :
                     pfRatio < 200 ? "⚠️ Moderate ARDS. Prone positioning if PF <150 (PROSEVA trial: 16hrs/day — reduces mortality by 50%)." :
                     pfRatio < 300 ? "Mild ARDS. Lung-protective ventilation, conservative fluid strategy." : ""

    // SpO₂ estimate
    const spo2Est = pa >= 80 ? ">95%" : pa >= 60 ? "88-95%" : pa >= 40 ? "75-88%" : "<75%"

    // Mortality estimate based on PF and Berlin
    const mortalityEst = pfRatio < 100 ? "40-50%" : pfRatio < 200 ? "25-35%" : pfRatio < 300 ? "15-25%" : "<5%"

    setResult({
      primaryMetric: { label: "P/F Ratio", value: `${pfRatio}`, status, description: category },
      healthScore: r0(Math.max(0, Math.min(100, pfRatio / 3.5))),
      metrics: [
        { label: "P/F Ratio", value: pfRatio, status },
        { label: "ARDS Classification", value: category, status },
        { label: "PaO₂", value: pa, unit: "mmHg", status: pa >= 80 ? "good" : pa >= 60 ? "warning" : "danger" },
        { label: "FiO₂", value: fi, status: fi <= 0.4 ? "good" : fi <= 0.6 ? "warning" : "danger" },
        { label: "PEEP", value: p, unit: "cmH₂O", status: p <= 8 ? "good" : p <= 15 ? "warning" : "danger" },
        { label: "Est. SpO₂", value: spo2Est, status: pa >= 80 ? "good" : pa >= 60 ? "warning" : "danger" },
        { label: "Est. Mortality (ARDS)", value: mortalityEst, status: pfRatio >= 300 ? "good" : pfRatio >= 200 ? "warning" : "danger" },
        { label: "ICU Alert", value: icuAlert || "No alert", status: pfRatio >= 300 ? "good" : pfRatio >= 200 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "P/F Ratio & ARDS Berlin", description: `PF = PaO₂ / FiO₂ = ${pa} / ${fi} = ${pfRatio}. ${category}. Berlin criteria require: acute onset (<1 week), bilateral opacities on CXR (not fully explained by effusions/atelectasis), respiratory failure not fully explained by cardiac failure, and PEEP ≥5. ${pfRatio < 200 ? "🔴 Moderate-Severe ARDS: 6 mL/kg IBW tidal volume, plateau <30, consider prone positioning, conservative fluids, neuromuscular blockade if severe." : ""}`, priority: "high", category: "Assessment" },
        { title: "Treatment by Severity", description: `${pfRatio < 100 ? "SEVERE ARDS: Lung-protective vent + prone 16h/day + neuromuscular blockers (first 48h per ACURASYS) + consider ECMO if PF <80 despite maximal care (EOLIA trial)." : pfRatio < 150 ? "MODERATE ARDS (PF<150): Prone positioning reduces mortality 50% (PROSEVA). High PEEP strategy. Consider recruitment maneuvers." : pfRatio < 300 ? "MILD ARDS: Lung-protective ventilation, conservative fluid strategy (FACTT trial: −2.5 ventilator days)." : "Normal — no ARDS management needed."}`, priority: "high", category: "Treatment" },
        { title: "Monitoring", description: `Track PF ratio serially. Improving PF = good prognosis. Worsening = consider complications (VAP, pneumothorax, fluid overload). ${p >= 10 ? "PEEP " + p + " cmH₂O — high PEEP tables reduce mortality in moderate-severe ARDS. Monitor for hemodynamic effects." : ""}`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "PaO₂": `${pa} mmHg`, "FiO₂": fi, "PEEP": `${p} cmH₂O`, "PF": pfRatio, "ARDS": category, "Mortality": mortalityEst }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pao2-fio2-ratio" title="PaO₂/FiO₂ Ratio Calculator"
      description="Calculate P/F ratio with Berlin ARDS classification, severity-based treatment protocol, and mortality estimation."
      icon={AlertCircle} calculate={calculate} onClear={() => { setPao2(80); setFio2(0.4); setPeep(5); setResult(null) }}
      values={[pao2, fio2, peep]} result={result}
      seoContent={<SeoContentGenerator title="PaO2/FiO2 Ratio Calculator" description="Calculate P/F ratio for ARDS severity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="PaO₂" val={pao2} set={setPao2} min={20} max={600} suffix="mmHg" />
          <NumInput label="FiO₂" val={fio2} set={setFio2} min={0.21} max={1.0} step={0.01} suffix="fraction" />
        </div>
        <NumInput label="PEEP" val={peep} set={setPeep} min={0} max={25} suffix="cmH₂O" />
      </div>} />
  )
}

// ─── 49. Oxygen Delivery Calculator (Systemic O₂ Transport Model) ───────────
export function OxygenDeliveryCalculator() {
  const [co, setCo] = useState(5.0)
  const [hb, setHb] = useState(14)
  const [sao2, setSao2] = useState(97)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(co, 1, 15)
    const h = clamp(hb, 3, 25)
    const sa = clamp(sao2, 50, 100)

    // DO₂ = CO × (Hb × 1.34 × SaO₂/100) × 10
    const cao2 = r1(h * 1.34 * sa / 100) // CaO₂ in mL O₂/dL
    const do2 = r0(c * cao2 * 10) // mL O₂/min

    // Normal DO₂: 800-1200 mL/min
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (do2 >= 800) { category = "🟢 Adequate Oxygen Delivery"; status = "good" }
    else if (do2 >= 600) { category = "🟡 Marginal"; status = "warning" }
    else if (do2 >= 400) { category = "🔴 Critical — Tissue Hypoxia Likely"; status = "danger" }
    else { category = "🟣 Severe — Organ Failure Risk"; status = "danger" }

    // Hypoxia risk
    const hypoxiaRisk = do2 < 400 ? "🔴 HIGH — DO₂ <400: anaerobic metabolism, lactic acidosis" :
                        do2 < 600 ? "⚠️ Moderate — supply-demand balance compromised" : "Low"

    // Shock probability
    let shockProb = 0
    if (do2 < 400) shockProb += 30
    else if (do2 < 600) shockProb += 10
    if (c < 3.5) shockProb += 20
    if (h < 7) shockProb += 15
    if (sa < 90) shockProb += 15
    shockProb = r0(Math.min(70, shockProb))

    // DO₂I (index per BSA ~1.8)
    const do2i = r0(do2 / 1.8)

    setResult({
      primaryMetric: { label: "Oxygen Delivery (DO₂)", value: `${do2} mL/min`, status, description: `${category} — CaO₂: ${cao2} mL/dL` },
      healthScore: r0(Math.max(0, Math.min(100, do2 / 10))),
      metrics: [
        { label: "DO₂", value: do2, unit: "mL O₂/min", status },
        { label: "DO₂ Index", value: do2i, unit: "mL/min/m²", status: do2i >= 450 ? "good" : do2i >= 350 ? "warning" : "danger" },
        { label: "CaO₂", value: cao2, unit: "mL O₂/dL", status: cao2 >= 16 ? "good" : cao2 >= 12 ? "warning" : "danger" },
        { label: "Cardiac Output", value: c, unit: "L/min", status: c >= 4 ? "good" : c >= 3 ? "warning" : "danger" },
        { label: "Hemoglobin", value: h, unit: "g/dL", status: h >= 12 ? "good" : h >= 7 ? "warning" : "danger" },
        { label: "SaO₂", value: sa, unit: "%", status: sa >= 94 ? "good" : sa >= 90 ? "warning" : "danger" },
        { label: "Hypoxia Risk", value: hypoxiaRisk, status: do2 >= 800 ? "good" : do2 >= 600 ? "warning" : "danger" },
        { label: "Shock Probability", value: shockProb, unit: "%", status: shockProb < 10 ? "good" : shockProb < 30 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Oxygen Transport Chain", description: `DO₂ = CO × CaO₂ × 10 = ${c} × ${cao2} × 10 = ${do2} mL/min. Normal: 800-1200. The three determinants: 1) Cardiac output (${c} L/min), 2) Hemoglobin (${h} g/dL), 3) SaO₂ (${sa}%). ${do2 < 600 ? "🔴 CRITICAL: DO₂ below critical threshold (~330 mL/min). Tissue oxygen extraction maximized. Below this: anaerobic metabolism → lactic acidosis → organ failure." : ""}`, priority: "high", category: "Assessment" },
        { title: "Optimization Strategy", description: `Improve DO₂ by targeting: ${c < 4 ? "1) ⬆️ CO: Fluids (if preload responsive), inotropes (dobutamine). " : ""}${h < 10 ? "2) ⬆️ Hb: Transfuse if Hb <7 (or <8 with cardiac disease). Each unit PRBC raises Hb ~1 g/dL → DO₂ +50-70 mL/min. " : ""}${sa < 94 ? "3) ⬆️ SaO₂: Supplemental O₂, PEEP optimization, treat lung pathology. " : ""}Most impactful: CO optimization (biggest single lever on DO₂).`, priority: "high", category: "Treatment" },
        { title: "Shock & Critical Care", description: `Shock probability: ${shockProb}%. ${shockProb > 25 ? "Check lactate (gold standard for tissue hypoxia). Lactate >4 = severe shock. ScvO₂ <70% = inadequate O₂ delivery vs demand. Rivers' protocol: target DO₂I >600 mL/min/m²." : "Adequate O₂ delivery."}`, priority: "medium", category: "Critical Care" }
      ],
      detailedBreakdown: { "CO": `${c} L/min`, "Hb": `${h} g/dL`, "SaO₂": `${sa}%`, "CaO₂": `${cao2} mL/dL`, "DO₂": `${do2} mL/min`, "DO₂I": `${do2i} mL/min/m²` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="oxygen-delivery-calculator" title="Oxygen Delivery Calculator"
      description="Calculate systemic oxygen delivery (DO₂) with hypoxia risk scoring, shock probability, and critical care optimization strategy."
      icon={Droplets} calculate={calculate} onClear={() => { setCo(5.0); setHb(14); setSao2(97); setResult(null) }}
      values={[co, hb, sao2]} result={result}
      seoContent={<SeoContentGenerator title="Oxygen Delivery Calculator" description="Estimate systemic oxygen delivery for critical care." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Cardiac Output" val={co} set={setCo} min={1} max={15} step={0.1} suffix="L/min" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Hemoglobin" val={hb} set={setHb} min={3} max={25} step={0.1} suffix="g/dL" />
          <NumInput label="SaO₂" val={sao2} set={setSao2} min={50} max={100} suffix="%" />
        </div>
      </div>} />
  )
}

// ─── 50. Oxygen Consumption (VO₂) Calculator (Metabolic Demand Model) ───────
export function OxygenConsumptionCalculator() {
  const [co, setCo] = useState(5.0)
  const [cao2, setCao2] = useState(19)
  const [cvo2, setCvo2] = useState(14)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(co, 1, 15)
    const ca = clamp(cao2, 5, 25)
    const cv = clamp(cvo2, 2, 20)

    // VO₂ = CO × (CaO₂ − CvO₂) × 10
    const avDiff = r1(ca - cv)
    const vo2 = r0(c * avDiff * 10) // mL/min

    // Normal VO₂: 200-300 mL/min
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (vo2 >= 200 && vo2 <= 300) { category = "🟢 Normal Metabolic Demand"; status = "good" }
    else if (vo2 > 300 && vo2 <= 400) { category = "🟡 Elevated (Hypermetabolic)"; status = "warning" }
    else if (vo2 > 400) { category = "🔴 Severely Elevated"; status = "danger" }
    else if (vo2 >= 150 && vo2 < 200) { category = "🟡 Low — Reduced Metabolic Activity"; status = "warning" }
    else { category = "🔴 Very Low — Possible Tissue Hypoxia"; status = "danger" }

    // Extraction ratio
    const o2er = r0(avDiff / ca * 100) // normal 20-30%

    // Septic shock logic
    const septicShock = c > 6 && avDiff < 4 ? "⚠️ HIGH CO + LOW extraction = distributive (septic) shock pattern. Tissues unable to extract O₂ despite adequate delivery (mitochondrial dysfunction)." :
                        o2er > 40 ? "⚠️ High extraction ratio (>40%) — maximal compensation. Further DO₂ reduction will cause VO₂ to fall (supply-dependency)." : ""

    // Metabolic demand index
    const mdi = r0(Math.min(100, vo2 / 250 * 100))

    setResult({
      primaryMetric: { label: "VO₂", value: `${vo2} mL/min`, status, description: `${category} — O₂ER: ${o2er}%` },
      healthScore: r0(Math.max(0, vo2 >= 200 && vo2 <= 300 ? 90 : 100 - Math.abs(vo2 - 250) * 0.3)),
      metrics: [
        { label: "VO₂", value: vo2, unit: "mL/min", status },
        { label: "A-V O₂ Difference", value: avDiff, unit: "mL/dL", status: avDiff >= 3 && avDiff <= 5 ? "good" : avDiff < 3 ? "warning" : "danger" },
        { label: "O₂ Extraction Ratio", value: o2er, unit: "%", status: o2er >= 20 && o2er <= 30 ? "good" : o2er <= 40 ? "warning" : "danger" },
        { label: "Cardiac Output", value: c, unit: "L/min", status: c >= 4 && c <= 8 ? "good" : "warning" },
        { label: "CaO₂ (Arterial)", value: ca, unit: "mL O₂/dL", status: ca >= 16 ? "good" : ca >= 12 ? "warning" : "danger" },
        { label: "CvO₂ (Venous)", value: cv, unit: "mL O₂/dL", status: cv >= 12 ? "good" : cv >= 8 ? "warning" : "danger" },
        { label: "Metabolic Demand Index", value: mdi, unit: "/100", status: mdi >= 70 && mdi <= 130 ? "good" : "warning" },
        { label: "Category", value: category, status }
      ],
      recommendations: [
        { title: "VO₂ Interpretation", description: `VO₂ = CO × (CaO₂ − CvO₂) × 10 = ${c} × ${avDiff} × 10 = ${vo2} mL/min. Normal: 200-300 mL/min (~3.5 mL/kg/min). ${vo2 > 400 ? "HYPERMETABOLIC: Causes: sepsis, fever (↑13% per °C), burns, thyrotoxicosis, seizures. Ensure DO₂ > VO₂ to prevent tissue hypoxia." : vo2 < 150 ? "Low VO₂ may indicate: hypothermia, deep sedation, or pathological supply-dependency (tissues aren't getting enough O₂ to consume)." : "Normal resting metabolic demand."}`, priority: "high", category: "Assessment" },
        { title: "Septic Shock Detection", description: `${septicShock || "No septic pattern detected."} O₂ extraction ratio: ${o2er}% (normal: 20-30%). ${o2er > 40 ? "Maximum extraction reached. Any further reduction in DO₂ will directly reduce VO₂ (critical DO₂ point). Urgent resuscitation needed." : o2er < 20 ? "Low extraction: either high DO₂ (appropriate) or mitochondrial dysfunction (sepsis, cyanide). Check lactate." : ""}`, priority: "high", category: "Shock" },
        { title: "Supply-Demand Balance", description: `DO₂:VO₂ ratio can be calculated with oxygen delivery data. Normal ratio 4:1 to 5:1. Ratio <2:1 = critical imbalance. ${vo2 > 300 ? "Reduce metabolic demand: treat fever (antipyretics), control seizures, reduce work of breathing (ventilator), sedation." : "Balanced supply-demand."}`, priority: "medium", category: "Critical Care" }
      ],
      detailedBreakdown: { "CO": `${c} L/min`, "CaO₂": `${ca} mL/dL`, "CvO₂": `${cv} mL/dL`, "AvDiff": `${avDiff} mL/dL`, "VO₂": `${vo2} mL/min`, "O₂ER": `${o2er}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="oxygen-consumption" title="Oxygen Consumption (VO₂) Calculator"
      description="Calculate tissue oxygen consumption with extraction ratio analysis, septic shock detection, and supply-demand balance assessment."
      icon={Activity} calculate={calculate} onClear={() => { setCo(5.0); setCao2(19); setCvo2(14); setResult(null) }}
      values={[co, cao2, cvo2]} result={result}
      seoContent={<SeoContentGenerator title="Oxygen Consumption Calculator" description="Estimate tissue VO₂ and metabolic demand." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Cardiac Output" val={co} set={setCo} min={1} max={15} step={0.1} suffix="L/min" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="CaO₂ (Arterial O₂ Content)" val={cao2} set={setCao2} min={5} max={25} step={0.1} suffix="mL O₂/dL" />
          <NumInput label="CvO₂ (Venous O₂ Content)" val={cvo2} set={setCvo2} min={2} max={20} step={0.1} suffix="mL O₂/dL" />
        </div>
      </div>} />
  )
}

// ─── 51. Metabolic Cart Simulator (Integrated Respiratory Metabolism Engine) ──
export function MetabolicCartSimulator() {
  const [vo2, setVo2] = useState(250)
  const [vco2, setVco2] = useState(200)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const vo = clamp(vo2, 50, 1500)
    const vc = clamp(vco2, 50, 1000)
    const w = clamp(weight, 30, 200)

    // RQ
    const rq = r2(vc / vo)

    // REE (Weir equation): REE = (3.9 × VO₂ + 1.1 × VCO₂) × 1.44
    const ree = r0((3.9 * vo + 1.1 * vc) * 1.44)
    const reePerKg = r1(ree / w)

    // Substrate oxidation rates (Frayn equations simplified)
    // Fat oxidation (g/min) = 1.67 × VO₂ − 1.67 × VCO₂
    // Carb oxidation (g/min) = 4.55 × VCO₂ − 3.21 × VO₂
    const fatOxMin = r2(Math.max(0, 1.67 * (vo / 1000) - 1.67 * (vc / 1000)))
    const carbOxMin = r2(Math.max(0, 4.55 * (vc / 1000) - 3.21 * (vo / 1000)))
    const fatOxDay = r0(fatOxMin * 1440)
    const carbOxDay = r0(carbOxMin * 1440)

    // Calories from each
    const fatCal = r0(fatOxDay * 9)
    const carbCal = r0(carbOxDay * 4)

    // ICU nutrition recommendation
    let icuNutrition = ""
    if (ree < 1200) icuNutrition = "Low metabolic rate. Start nutrition at 15-20 kcal/kg/day. Reassess in 48h."
    else if (ree < 1800) icuNutrition = "Moderate. Target 20-25 kcal/kg/day (80% of measured REE initially)."
    else if (ree < 2500) icuNutrition = "Elevated metabolic demand. Target 25-30 kcal/kg/day. Include 1.2-2g protein/kg."
    else icuNutrition = "🔴 Hypermetabolic. High caloric needs — BUT avoid overfeeding (RQ >1.0 = lipogenesis). Titrate carefully."

    // Overfeeding/underfeeding
    const feedStatus = rq > 1.0 ? "🔴 OVERFEEDING — reduce carbohydrate calories" :
                       rq < 0.7 ? "⚠️ UNDERFEEDING — metabolic starvation, increase caloric intake" : "Appropriate feeding"

    // Substrate distribution
    const fatPct = r0(fatCal / (fatCal + carbCal + 1) * 100)
    const carbPct = r0(carbCal / (fatCal + carbCal + 1) * 100)

    const status: 'good' | 'warning' | 'danger' | 'normal' = rq >= 0.75 && rq <= 0.95 ? "good" : rq > 1.0 || rq < 0.7 ? "danger" : "warning"

    setResult({
      primaryMetric: { label: "Resting Energy Expenditure", value: `${ree} kcal/day`, status, description: `RQ: ${rq} — ${reePerKg} kcal/kg/day` },
      healthScore: r0(Math.max(0, 100 - Math.abs(rq - 0.85) * 150)),
      metrics: [
        { label: "REE (Weir)", value: ree, unit: "kcal/day", status: "normal" },
        { label: "REE per kg", value: reePerKg, unit: "kcal/kg/day", status: reePerKg >= 20 && reePerKg <= 35 ? "good" : "warning" },
        { label: "RQ", value: rq, status },
        { label: "VO₂", value: vo, unit: "mL/min", status: "normal" },
        { label: "VCO₂", value: vc, unit: "mL/min", status: "normal" },
        { label: "Fat Oxidation", value: fatOxDay, unit: "g/day", status: "normal" },
        { label: "Carb Oxidation", value: carbOxDay, unit: "g/day", status: "normal" },
        { label: "Fat Calories", value: fatCal, unit: "kcal/day", status: "normal" },
        { label: "Carb Calories", value: carbCal, unit: "kcal/day", status: "normal" },
        { label: "Substrate Split", value: `Fat ${fatPct}% / Carb ${carbPct}%`, status: "normal" },
        { label: "Feeding Status", value: feedStatus, status: feedStatus.includes("Appropriate") ? "good" : feedStatus.includes("UNDER") ? "warning" : "danger" },
        { label: "ICU Nutrition", value: icuNutrition, status: ree < 2500 ? "normal" : "warning" }
      ],
      recommendations: [
        { title: "Metabolic Cart Results", description: `REE (Weir): (3.9 × ${vo} + 1.1 × ${vc}) × 1.44 = ${ree} kcal/day (${reePerKg} kcal/kg). RQ: ${rq}. ${rq > 1.0 ? "🔴 LIPOGENESIS detected (RQ >1.0) — excess CO₂ production impairs ventilator weaning. Reduce total calories by 20% and shift to lipid-based formulas (40-50% fat)." : rq < 0.7 ? "Starvation pattern — pure fat oxidation. Gradually increase nutrition (refeeding syndrome risk if aggressive)." : "🟢 Mixed substrate utilization — appropriate feeding."}`, priority: "high", category: "Assessment" },
        { title: "Substrate Oxidation", description: `Fat: ${fatOxDay} g/day (${fatCal} kcal), Carbs: ${carbOxDay} g/day (${carbCal} kcal). Distribution: ${fatPct}% fat / ${carbPct}% carb. ${fatPct > 70 ? "Fat-dominant: ketosis or low-carb state." : carbPct > 70 ? "Carb-dominant: high glycemic load." : "Balanced fuel utilization."}`, priority: "high", category: "Nutrition" },
        { title: "ICU Nutrition Protocol", description: `${icuNutrition}. ${feedStatus}. ASPEN/ESPEN guidelines: start enteral within 24-48h of ICU admission, advance to target over 48-72h. Measure REE by metabolic cart (gold standard) vs predictive equations — equations can be off by 40%. Protein: 1.2-2.0 g/kg/day for critical illness. Monitor prealbumin weekly.`, priority: "medium", category: "ICU" }
      ],
      detailedBreakdown: { "VO₂": `${vo} mL/min`, "VCO₂": `${vc} mL/min`, "RQ": rq, "REE": `${ree} kcal`, "Fat": `${fatOxDay}g (${fatCal} kcal)`, "Carb": `${carbOxDay}g (${carbCal} kcal)` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="metabolic-cart-simulator" title="Metabolic Cart Simulator"
      description="Simulate indirect calorimetry with REE (Weir equation), substrate oxidation rates, RQ analysis, and ICU nutrition recommendations."
      icon={Brain} calculate={calculate} onClear={() => { setVo2(250); setVco2(200); setWeight(70); setResult(null) }}
      values={[vo2, vco2, weight]} result={result}
      seoContent={<SeoContentGenerator title="Metabolic Cart Simulator" description="Simulate metabolic cart measurements." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="VO₂ (O₂ Consumption)" val={vo2} set={setVo2} min={50} max={1500} suffix="mL/min" />
          <NumInput label="VCO₂ (CO₂ Production)" val={vco2} set={setVco2} min={50} max={1000} suffix="mL/min" />
        </div>
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
      </div>} />
  )
}
