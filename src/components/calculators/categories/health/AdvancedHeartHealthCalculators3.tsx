"use client"
import { useState } from "react"
import { Heart, Activity, TrendingUp, AlertCircle, Thermometer, Droplets, Brain, Zap, Wind } from "lucide-react"
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

// ─── 14. Dehydration Risk Checker (Fluid Deficit Risk Engine) ────────────────
export function DehydrationRiskCalculator() {
  const [weight, setWeight] = useState(70)
  const [fluidIntake, setFluidIntake] = useState(1500)
  const [urineColor, setUrineColor] = useState(3)
  const [activity, setActivity] = useState("moderate")
  const [tempExposure, setTempExposure] = useState("normal")
  const [heartRate, setHeartRate] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 200)
    const intake = clamp(fluidIntake, 0, 8000)
    const uc = clamp(urineColor, 1, 8)
    const hr = clamp(heartRate, 40, 180)

    // Estimated fluid requirement (35 ml/kg baseline)
    let requirement = w * 35
    if (activity === "high") requirement += 800
    else if (activity === "moderate") requirement += 400
    if (tempExposure === "hot") requirement += 1000
    else if (tempExposure === "warm") requirement += 500
    requirement = r0(requirement)

    const deficit = r0(Math.max(0, requirement - intake))
    const deficitPct = r1(Math.max(0, (deficit / requirement) * 100))

    // Plasma volume reduction estimate (~1.5% per 1% fluid deficit)
    const plasmaReduction = r1(deficitPct * 1.5)

    // HR compensation index (HR elevates ~7 bpm per 1L deficit)
    const expectedHRrise = r0(deficit / 1000 * 7)
    const hrCompIndex = r0(Math.min(100, expectedHRrise * 5 + (uc > 5 ? 20 : 0)))

    // Heat exhaustion probability
    let heatProb = 0
    if (tempExposure === "hot") heatProb += 25
    else if (tempExposure === "warm") heatProb += 10
    if (deficitPct > 5) heatProb += 30
    else if (deficitPct > 3) heatProb += 15
    if (activity === "high") heatProb += 15
    if (uc >= 6) heatProb += 15
    heatProb = r0(Math.min(70, heatProb))

    // BP drop risk
    const bpDropRisk = deficitPct > 5 ? "High" : deficitPct > 3 ? "Moderate" : "Low"

    // Performance decline projection
    const perfDecline = r0(Math.min(30, deficitPct * 3))

    // Risk classification
    let riskLevel = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (heatProb >= 40 || deficitPct > 5) { riskLevel = "🟣 Purple (Heat Illness Risk)"; status = "danger" }
    else if (deficitPct > 3 || uc >= 6) { riskLevel = "🔴 Red (Moderate Dehydration)"; status = "danger" }
    else if (deficitPct > 1 || uc >= 4) { riskLevel = "🟡 Yellow (Mild Deficit)"; status = "warning" }
    else { riskLevel = "🟢 Green (Hydrated)"; status = "good" }

    // Electrolyte imbalance correlation
    const electrolyteRisk = deficitPct > 4 ? "High — sodium/potassium imbalance likely" : deficitPct > 2 ? "Moderate — monitor electrolytes" : "Low"

    setResult({
      primaryMetric: { label: "Hydration Status", value: `${deficitPct}% deficit`, status, description: riskLevel },
      healthScore: r0(Math.max(0, 100 - deficitPct * 10)),
      metrics: [
        { label: "Fluid Requirement", value: requirement, unit: "mL/day", status: "normal" },
        { label: "Fluid Intake", value: intake, unit: "mL", status: intake >= requirement ? "good" : intake >= requirement * 0.8 ? "warning" : "danger" },
        { label: "Fluid Deficit", value: deficit, unit: "mL", status: deficit < 500 ? "good" : deficit < 1500 ? "warning" : "danger" },
        { label: "Deficit %", value: deficitPct, unit: "%", status: deficitPct < 2 ? "good" : deficitPct < 4 ? "warning" : "danger" },
        { label: "Plasma Volume Reduction", value: plasmaReduction, unit: "%", status: plasmaReduction < 3 ? "good" : plasmaReduction < 6 ? "warning" : "danger" },
        { label: "HR Compensation Index", value: hrCompIndex, unit: "/100", status: hrCompIndex < 20 ? "good" : hrCompIndex < 50 ? "warning" : "danger" },
        { label: "Heat Exhaustion Probability", value: heatProb, unit: "%", status: heatProb < 15 ? "good" : heatProb < 30 ? "warning" : "danger" },
        { label: "BP Drop Risk", value: bpDropRisk, status: bpDropRisk === "Low" ? "good" : bpDropRisk === "Moderate" ? "warning" : "danger" },
        { label: "Performance Decline", value: perfDecline, unit: "%", status: perfDecline < 5 ? "good" : perfDecline < 15 ? "warning" : "danger" },
        { label: "Urine Color Score", value: `${uc}/8`, status: uc <= 3 ? "good" : uc <= 5 ? "warning" : "danger" },
        { label: "Electrolyte Risk", value: electrolyteRisk, status: electrolyteRisk.startsWith("Low") ? "good" : electrolyteRisk.startsWith("Moderate") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Hydration Assessment", description: `Deficit: ${deficit} mL (${deficitPct}%). Requirement: ${requirement} mL/day (adjusted for activity: ${activity}, temperature: ${tempExposure}). ${deficitPct > 5 ? "🔴 SIGNIFICANT DEHYDRATION: >5% deficit impairs thermoregulation, increases cardiac strain, and reduces exercise capacity by 20-30%. Immediate rehydration needed." : deficitPct > 3 ? "🟡 Moderate deficit. Cognitive function begins declining at 2%. Drink 200-300 mL every 15-20 minutes." : deficitPct > 1 ? "Mild deficit — increase fluid intake. Goal: pale yellow urine (color 1-3)." : "🟢 Adequately hydrated."}`, priority: "high", category: "Assessment" },
        { title: "Cardiovascular Impact", description: `Plasma volume reduction: ~${plasmaReduction}%. HR compensation: +${expectedHRrise} bpm expected. ${plasmaReduction > 5 ? "Significant hypovolemia — cardiac output drops, stroke volume decreases, compensatory tachycardia. Orthostatic hypotension risk." : "Manageable circulatory impact."} BP drop risk: ${bpDropRisk}. ${bpDropRisk !== "Low" ? "Monitor for lightheadedness and syncope." : ""}`, priority: "high", category: "Cardiovascular" },
        { title: "Heat Safety & Electrolytes", description: `Heat exhaustion probability: ${heatProb}%. ${heatProb > 30 ? "🟣 HEAT ILLNESS WARNING: Move to cool environment, apply cold packs to neck/axillae, drink electrolyte solution. Signs: nausea, headache, confusion, rapid pulse." : ""} Electrolyte status: ${electrolyteRisk}. ${deficitPct > 3 ? "Rehydrate with electrolyte solution (sodium 500-700mg/L) rather than plain water to prevent hyponatremia." : "Plain water adequate for mild deficit."}`, priority: "high", category: "Heat Safety" }
      ],
      detailedBreakdown: { "Requirement": `${requirement} mL`, "Intake": `${intake} mL`, "Deficit": `${deficit} mL (${deficitPct}%)`, "Urine Color": `${uc}/8`, "Heat Prob": `${heatProb}%`, "Plasma Red.": `${plasmaReduction}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="dehydration-risk" title="Dehydration Risk Checker"
      description="Assess dehydration risk with fluid deficit estimation, plasma volume reduction, HR compensation index, heat exhaustion probability, and electrolyte imbalance correlation."
      icon={Droplets} calculate={calculate} onClear={() => { setWeight(70); setFluidIntake(1500); setUrineColor(3); setActivity("moderate"); setTempExposure("normal"); setHeartRate(75); setResult(null) }}
      values={[weight, fluidIntake, urineColor, activity, tempExposure, heartRate]} result={result}
      seoContent={<SeoContentGenerator title="Dehydration Risk Checker" description="Estimate your dehydration risk and fluid needs." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
          <NumInput label="Fluid Intake (24h)" val={fluidIntake} set={setFluidIntake} min={0} max={8000} suffix="mL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Urine Color (1=clear, 8=dark)" val={urineColor} set={setUrineColor} min={1} max={8} />
          <NumInput label="Heart Rate" val={heartRate} set={setHeartRate} min={40} max={180} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Activity Level" val={activity} set={setActivity} options={[{ value: "low", label: "Low (sedentary)" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (intense exercise)" }]} />
          <SelectInput label="Temperature Exposure" val={tempExposure} set={setTempExposure} options={[{ value: "cool", label: "Cool (<20°C)" }, { value: "normal", label: "Normal (20-28°C)" }, { value: "warm", label: "Warm (28-35°C)" }, { value: "hot", label: "Hot (>35°C)" }]} />
        </div>
      </div>} />
  )
}

// ─── 15. Body Temperature Tracker (Thermoregulatory Stability Model) ─────────
export function BodyTemperatureTracker() {
  const [temp, setTemp] = useState(37.0)
  const [unit, setUnit] = useState("celsius")
  const [timeOfDay, setTimeOfDay] = useState("morning")
  const [symptoms, setSymptoms] = useState("none")
  const [age, setAge] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 1, 90)
    let t = clamp(temp, unit === "celsius" ? 34 : 93, unit === "celsius" ? 42 : 108)
    const tC = unit === "fahrenheit" ? r1((t - 32) * 5 / 9) : t

    // Circadian variation (normal: ±0.5°C; lower in morning, peak ~6PM)
    const circadianAdj = timeOfDay === "morning" ? -0.3 : timeOfDay === "evening" ? 0.3 : timeOfDay === "night" ? -0.2 : 0
    const adjustedTemp = r1(tC - circadianAdj) // normalized to afternoon baseline

    // Classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (tC < 35) { category = "Hypothermia"; status = "danger" }
    else if (tC < 36.1) { category = "Below Normal"; status = "warning" }
    else if (tC <= 37.2) { category = "Normal"; status = "good" }
    else if (tC <= 38.0) { category = "Low-grade Fever"; status = "warning" }
    else if (tC <= 39.0) { category = "Moderate Fever"; status = "danger" }
    else if (tC <= 40.0) { category = "High Fever"; status = "danger" }
    else { category = "Hyperthermia / Medical Emergency"; status = "danger" }

    // Fever grade
    let feverGrade = "No Fever"
    if (tC > 40) feverGrade = "Grade 4 (Hyperpyrexia)"
    else if (tC > 39) feverGrade = "Grade 3 (High)"
    else if (tC > 38) feverGrade = "Grade 2 (Moderate)"
    else if (tC > 37.2) feverGrade = "Grade 1 (Low)"

    // Infection probability
    let infectionProb = 0
    if (tC > 38.5) infectionProb += 40
    else if (tC > 37.5) infectionProb += 15
    if (symptoms === "fever-chills") infectionProb += 25
    else if (symptoms === "body-ache") infectionProb += 15
    else if (symptoms === "respiratory") infectionProb += 20
    infectionProb = r0(Math.min(75, infectionProb))

    // Hyperthermia risk
    const hyperthermiaRisk = tC > 40 ? "🔴 CRITICAL — immediate cooling needed" : tC > 39 ? "High" : tC > 38 ? "Moderate" : "Low"

    // Circadian variation index
    const circadianIndex = r1(Math.abs(tC - 36.8 - circadianAdj))

    setResult({
      primaryMetric: { label: "Body Temperature", value: `${tC}°C / ${r1(tC * 9 / 5 + 32)}°F`, status, description: `${category} — ${feverGrade}` },
      healthScore: r0(Math.max(0, 100 - Math.abs(tC - 36.8) * 20)),
      metrics: [
        { label: "Temperature", value: tC, unit: "°C", status },
        { label: "Temperature", value: r1(tC * 9 / 5 + 32), unit: "°F", status },
        { label: "Category", value: category, status },
        { label: "Fever Grade", value: feverGrade, status: feverGrade === "No Fever" ? "good" : "warning" },
        { label: "Circadian-Adjusted", value: adjustedTemp, unit: "°C", status: adjustedTemp <= 37.2 ? "good" : "warning" },
        { label: "Circadian Variation Index", value: circadianIndex, unit: "°C", status: circadianIndex < 0.5 ? "good" : circadianIndex < 1.0 ? "warning" : "danger" },
        { label: "Infection Probability", value: infectionProb, unit: "%", status: infectionProb < 15 ? "good" : infectionProb < 35 ? "warning" : "danger" },
        { label: "Hyperthermia Risk", value: hyperthermiaRisk, status: hyperthermiaRisk === "Low" ? "good" : hyperthermiaRisk === "Moderate" ? "warning" : "danger" },
        { label: "Time of Day", value: timeOfDay, status: "normal" },
        { label: "Symptoms", value: symptoms === "none" ? "None" : symptoms.replace("-", " "), status: symptoms === "none" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Temperature Interpretation", description: `${tC}°C at ${timeOfDay}. ${category}. ${timeOfDay === "morning" ? "Morning temps are ~0.3°C lower than afternoon — adjusted baseline: " + adjustedTemp + "°C." : timeOfDay === "evening" ? "Evening temps peak ~0.3°C above morning. Consider circadian rhythm." : ""} ${tC > 40 ? "🔴 EMERGENCY: Hyperpyrexia. Active cooling (tepid sponging, cold IV fluids). Rule out heat stroke, CNS infection, drug reaction." : tC > 38.5 ? "🟡 Significant fever. Antipyretics (acetaminophen 500-1000mg / ibuprofen 400mg). If >3 days, seek medical evaluation." : tC > 37.3 ? "Low-grade fever — monitor. May not require treatment. Track trend over 24-48 hours." : tC < 35 ? "🔴 HYPOTHERMIA: Active rewarming needed. Risk of cardiac arrhythmia below 32°C." : "🟢 Normal temperature."}`, priority: "high", category: "Assessment" },
        { title: "Infection Screening", description: `Infection probability: ${infectionProb}%. ${infectionProb > 30 ? "Fever + symptoms suggest active infection. Consider: CBC with differential, CRP, blood cultures if T>38.5°C. " : ""}${symptoms === "respiratory" ? "Respiratory symptoms + fever: consider COVID-19, influenza, pneumonia. Respiratory panel testing recommended." : symptoms === "fever-chills" ? "Rigors (shaking chills) suggest bacteremia or malaria. Blood cultures warranted." : ""}`, priority: "high", category: "Clinical" },
        { title: "Tracking & Patterns", description: `Track temperature at same time daily for trend analysis. Circadian variation of ±0.5°C is normal. Patterns: sustained fever (constant elevation) suggests bacterial infection; intermittent (spikes and normal) suggests abscess, TB; relapsing (days of fever, days normal) suggests malaria, Hodgkin's.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Temp": `${tC}°C / ${r1(tC * 9 / 5 + 32)}°F`, "Time": timeOfDay, "Adjusted": `${adjustedTemp}°C`, "Category": category, "Infection Prob": `${infectionProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="body-temperature-tracker" title="Body Temperature Tracker"
      description="Track body temperature with fever grading, circadian variation analysis, infection probability estimation, and hyperthermia risk alerts."
      icon={Thermometer} calculate={calculate} onClear={() => { setTemp(37.0); setUnit("celsius"); setTimeOfDay("morning"); setSymptoms("none"); setAge(35); setResult(null) }}
      values={[temp, unit, timeOfDay, symptoms, age]} result={result}
      seoContent={<SeoContentGenerator title="Body Temperature Tracker" description="Track body temperature and detect fever patterns." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Temperature" val={temp} set={setTemp} min={unit === "celsius" ? 34 : 93} max={unit === "celsius" ? 42 : 108} step={0.1} suffix={unit === "celsius" ? "°C" : "°F"} />
          <SelectInput label="Unit" val={unit} set={setUnit} options={[{ value: "celsius", label: "°C (Celsius)" }, { value: "fahrenheit", label: "°F (Fahrenheit)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Time of Day" val={timeOfDay} set={setTimeOfDay} options={[{ value: "morning", label: "Morning (6-10 AM)" }, { value: "afternoon", label: "Afternoon (12-4 PM)" }, { value: "evening", label: "Evening (5-9 PM)" }, { value: "night", label: "Night (10 PM-5 AM)" }]} />
          <NumInput label="Age" val={age} set={setAge} min={1} max={90} suffix="years" />
        </div>
        <SelectInput label="Symptoms" val={symptoms} set={setSymptoms} options={[{ value: "none", label: "None" }, { value: "fever-chills", label: "Fever & Chills" }, { value: "body-ache", label: "Body Ache / Fatigue" }, { value: "respiratory", label: "Cough / Respiratory" }, { value: "gi", label: "GI Symptoms" }]} />
      </div>} />
  )
}

// ─── 16. Blood Pressure Tracker (Longitudinal Hypertension Engine) ───────────
export function BloodPressureTracker() {
  const [sbp, setSbp] = useState(128)
  const [dbp, setDbp] = useState(82)
  const [sbp2, setSbp2] = useState(132)
  const [dbp2, setDbp2] = useState(84)
  const [sbp3, setSbp3] = useState(126)
  const [dbp3, setDbp3] = useState(80)
  const [timeOfDay, setTimeOfDay] = useState("morning")
  const [medication, setMedication] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s1 = clamp(sbp, 70, 240); const d1 = clamp(dbp, 40, 160)
    const s2 = clamp(sbp2, 70, 240); const d2 = clamp(dbp2, 40, 160)
    const s3 = clamp(sbp3, 70, 240); const d3 = clamp(dbp3, 40, 160)

    const avgSBP = r0((s1 + s2 + s3) / 3)
    const avgDBP = r0((d1 + d2 + d3) / 3)

    // BP variability index (SD of readings)
    const sbpMean = (s1 + s2 + s3) / 3
    const sbpSD = r1(Math.sqrt(((s1 - sbpMean) ** 2 + (s2 - sbpMean) ** 2 + (s3 - sbpMean) ** 2) / 3))
    const variabilityIndex = sbpSD > 15 ? "High" : sbpSD > 8 ? "Moderate" : "Normal"

    // Morning surge detection
    const morningSurge = timeOfDay === "morning" && avgSBP > 135 ? "⚠️ Morning surge detected (SBP >135 AM)" : "Not detected"

    // Masked hypertension risk
    const maskedHTN = medication === "yes" && avgSBP >= 125 && avgSBP < 140 ? "Moderate — readings near normal on meds but elevated off" :
                      medication === "no" && avgSBP >= 120 && avgSBP < 130 ? "Possible — consider 24-hour ABPM" : "Low"

    // Stroke probability trend
    let strokeTrend = "Low"
    if (avgSBP >= 160) strokeTrend = "High (2.5-4× normal)"
    else if (avgSBP >= 140) strokeTrend = "Elevated (2× normal)"
    else if (avgSBP >= 130) strokeTrend = "Above average"

    // Medication effectiveness
    const medEffect = medication === "yes" ?
      (avgSBP < 130 && avgDBP < 80 ? "✅ BP at target on medication" :
       avgSBP < 140 ? "⚠️ Suboptimal — consider dose adjustment" :
       "🔴 Uncontrolled despite medication — urgent review") : "Not on medication"

    let status: 'good' | 'warning' | 'danger' | 'normal' = avgSBP < 120 && avgDBP < 80 ? "good" :
      avgSBP < 130 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Average BP", value: `${avgSBP}/${avgDBP} mmHg`, status, description: `Variability: ${variabilityIndex} (SD: ${sbpSD})` },
      healthScore: r0(Math.max(0, Math.min(100, 100 - (avgSBP - 115) * 1.2))),
      metrics: [
        { label: "Average SBP", value: avgSBP, unit: "mmHg", status: avgSBP < 120 ? "good" : avgSBP < 130 ? "warning" : "danger" },
        { label: "Average DBP", value: avgDBP, unit: "mmHg", status: avgDBP < 80 ? "good" : avgDBP < 90 ? "warning" : "danger" },
        { label: "Reading 1", value: `${s1}/${d1}`, unit: "mmHg", status: "normal" },
        { label: "Reading 2", value: `${s2}/${d2}`, unit: "mmHg", status: "normal" },
        { label: "Reading 3", value: `${s3}/${d3}`, unit: "mmHg", status: "normal" },
        { label: "SBP Variability (SD)", value: sbpSD, status: sbpSD < 8 ? "good" : sbpSD < 15 ? "warning" : "danger" },
        { label: "Variability Index", value: variabilityIndex, status: variabilityIndex === "Normal" ? "good" : variabilityIndex === "Moderate" ? "warning" : "danger" },
        { label: "Morning Surge", value: morningSurge, status: morningSurge.includes("detected") ? "danger" : "good" },
        { label: "Masked HTN Risk", value: maskedHTN, status: maskedHTN === "Low" ? "good" : "warning" },
        { label: "Stroke Risk Trend", value: strokeTrend, status: strokeTrend === "Low" ? "good" : strokeTrend.includes("Above") ? "warning" : "danger" },
        { label: "Medication Effectiveness", value: medEffect, status: medEffect.includes("✅") ? "good" : medEffect.includes("⚠️") ? "warning" : medEffect.includes("🔴") ? "danger" : "normal" }
      ],
      recommendations: [
        { title: "BP Trend Analysis", description: `3-reading average: ${avgSBP}/${avgDBP} mmHg. SBP variability SD: ${sbpSD} mmHg (${variabilityIndex}). ${sbpSD > 15 ? "High BP variability is an independent stroke risk factor — even more predictive than mean BP. Consider long-acting antihypertensives (amlodipine, chlorthalidone)." : ""} ${morningSurge.includes("detected") ? "Morning surge increases stroke risk 2.7×. Consider evening dosing of antihypertensives." : ""}`, priority: "high", category: "Trend" },
        { title: "Clinical Monitoring", description: `${strokeTrend !== "Low" ? "Stroke risk: " + strokeTrend + ". Target: <130/80 for most adults (ACC/AHA 2017). " : ""}${medication === "yes" ? medEffect + ". " : ""}For accurate tracking: measure at same time daily, after 5 min rest, arm at heart level, empty bladder. Average of 2-3 readings is more reliable than a single reading.`, priority: "high", category: "Clinical" },
        { title: "30-Day Strategy", description: `Track daily for 30-day rolling average — this is the gold standard for home BP monitoring. ${avgSBP >= 130 ? "Lifestyle: DASH diet (−8-14 mmHg), sodium <2300mg (−2-8), exercise 30min/day (−4-9), weight loss (−5-20/10kg). Combined: up to 25 mmHg reduction." : "Good control — maintain current regimen."}`, priority: "medium", category: "Action Plan" }
      ],
      detailedBreakdown: { "Avg SBP": `${avgSBP} mmHg`, "Avg DBP": `${avgDBP} mmHg`, "SD": `${sbpSD} mmHg`, "Variability": variabilityIndex, "Surge": morningSurge, "Stroke": strokeTrend }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blood-pressure-tracker" title="Blood Pressure Tracker"
      description="Track multiple BP readings with variability analysis, morning surge detection, masked hypertension screening, and medication effectiveness assessment."
      icon={Heart} calculate={calculate} onClear={() => { setSbp(128); setDbp(82); setSbp2(132); setDbp2(84); setSbp3(126); setDbp3(80); setTimeOfDay("morning"); setMedication("no"); setResult(null) }}
      values={[sbp, dbp, sbp2, dbp2, sbp3, dbp3, timeOfDay, medication]} result={result}
      seoContent={<SeoContentGenerator title="Blood Pressure Tracker" description="Track blood pressure readings and analyze trends." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm text-muted-foreground">Enter 3 recent BP readings for trend analysis:</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Reading 1 — SBP" val={sbp} set={setSbp} min={70} max={240} suffix="mmHg" />
          <NumInput label="Reading 1 — DBP" val={dbp} set={setDbp} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Reading 2 — SBP" val={sbp2} set={setSbp2} min={70} max={240} suffix="mmHg" />
          <NumInput label="Reading 2 — DBP" val={dbp2} set={setDbp2} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Reading 3 — SBP" val={sbp3} set={setSbp3} min={70} max={240} suffix="mmHg" />
          <NumInput label="Reading 3 — DBP" val={dbp3} set={setDbp3} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Time of Day" val={timeOfDay} set={setTimeOfDay} options={[{ value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" }]} />
          <SelectInput label="On BP Medication?" val={medication} set={setMedication} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 17. Resting Pulse Tracker (Autonomic Baseline Monitor) ──────────────────
export function RestingPulseTracker() {
  const [morningPulse, setMorningPulse] = useState(68)
  const [baseline, setBaseline] = useState(65)
  const [sleepHours, setSleepHours] = useState(7)
  const [hrv, setHrv] = useState(40)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const mp = clamp(morningPulse, 30, 150)
    const bl = clamp(baseline, 30, 120)
    const sleep = clamp(sleepHours, 2, 14)
    const h = clamp(hrv, 5, 200)

    const deviation = mp - bl
    const deviationPct = r1(Math.abs(deviation) / bl * 100)

    // Sympathetic activation index
    const sympatheticIndex = r0(Math.min(100, Math.max(0, (mp - 50) * 1.5 + (200 - h) * 0.2)))

    // Illness early-warning
    let illnessRisk = "Low"
    if (deviation >= 10) illnessRisk = "High — sustained +10 bpm often precedes illness by 1-3 days"
    else if (deviation >= 5) illnessRisk = "Moderate — monitor for symptoms"

    // Fatigue detection
    let fatigueLevel = "Normal"
    if (deviation >= 7 && sleep < 6) fatigueLevel = "High — sleep deficit + elevated HR"
    else if (deviation >= 5 || sleep < 5) fatigueLevel = "Moderate"

    // Overtraining flag
    const overtrainingFlag = deviation >= 8 && h < 25 ? "⚠️ Overtraining suspected — elevated RHR + low HRV" : deviation >= 5 && h < 30 ? "Possible — reduce intensity" : "Not indicated"

    const status: 'good' | 'warning' | 'danger' | 'normal' = deviationPct < 5 ? "good" : deviationPct < 10 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Morning Pulse", value: `${mp} bpm`, status, description: `Baseline: ${bl} | Deviation: ${deviation > 0 ? "+" : ""}${deviation} bpm (${deviationPct}%)` },
      healthScore: r0(Math.max(0, 100 - deviationPct * 5)),
      metrics: [
        { label: "Morning Pulse", value: mp, unit: "bpm", status },
        { label: "Baseline", value: bl, unit: "bpm", status: "normal" },
        { label: "Deviation", value: `${deviation > 0 ? "+" : ""}${deviation}`, unit: "bpm", status },
        { label: "Deviation %", value: deviationPct, unit: "%", status },
        { label: "Sympathetic Index", value: sympatheticIndex, unit: "/100", status: sympatheticIndex < 40 ? "good" : sympatheticIndex < 65 ? "warning" : "danger" },
        { label: "Illness Early-Warning", value: illnessRisk, status: illnessRisk === "Low" ? "good" : illnessRisk.startsWith("Moderate") ? "warning" : "danger" },
        { label: "Fatigue Level", value: fatigueLevel, status: fatigueLevel === "Normal" ? "good" : fatigueLevel.startsWith("Moderate") ? "warning" : "danger" },
        { label: "Overtraining Flag", value: overtrainingFlag, status: overtrainingFlag === "Not indicated" ? "good" : overtrainingFlag.startsWith("Possible") ? "warning" : "danger" },
        { label: "Sleep", value: sleep, unit: "hrs", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" },
        { label: "HRV", value: h, unit: "ms", status: h >= 40 ? "good" : h >= 25 ? "normal" : "warning" }
      ],
      recommendations: [
        { title: "Pulse Baseline Analysis", description: `Morning pulse ${mp} bpm vs baseline ${bl} bpm = ${deviation > 0 ? "+" : ""}${deviation} bpm (${deviationPct}%). ${deviation >= 10 ? "🔴 Significant deviation (≥10 bpm). Top causes: illness onset, severe stress, alcohol, overtraining, poor sleep. Reduce training load. If persistent 3+ days, medical evaluation recommended." : deviation >= 5 ? "🟡 Moderate deviation. Monitor over next 2-3 days. Prioritize sleep and recovery." : "🟢 Within normal range. Autonomic nervous system stable."}`, priority: "high", category: "Assessment" },
        { title: "Autonomic Status", description: `Sympathetic activation: ${sympatheticIndex}/100. ${sympatheticIndex > 60 ? "High sympathetic tone indicates stress response. HRV: " + h + "ms (low parasympathetic). Interventions: 5-min deep breathing, cold face immersion (dive reflex), adequate sleep." : "Balanced autonomic tone."} ${overtrainingFlag !== "Not indicated" ? overtrainingFlag : ""}`, priority: "high", category: "Autonomic" },
        { title: "Trend Strategy", description: `Track morning pulse daily before standing. Record in consistent conditions (after waking, before coffee). A sustained rise of 5-7+ bpm above baseline for 3+ days = actionable signal. Combine with HRV trend for comprehensive autonomic picture. ${sleep < 7 ? "Sleep deficit ("+sleep+" hrs) directly impacts RHR. Each additional hour can reduce RHR 2-5 bpm." : ""}`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Pulse": `${mp} bpm`, "Baseline": `${bl} bpm`, "Deviation": `${deviation > 0 ? "+" : ""}${deviation}`, "Sympathetic": `${sympatheticIndex}/100`, "Fatigue": fatigueLevel, "Illness": illnessRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="resting-pulse-tracker" title="Resting Pulse Tracker"
      description="Track morning resting pulse with baseline deviation analysis, sympathetic activation index, illness early-warning, and overtraining detection."
      icon={Heart} calculate={calculate} onClear={() => { setMorningPulse(68); setBaseline(65); setSleepHours(7); setHrv(40); setResult(null) }}
      values={[morningPulse, baseline, sleepHours, hrv]} result={result}
      seoContent={<SeoContentGenerator title="Resting Pulse Tracker" description="Track resting pulse for stress and illness detection." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Morning Pulse (today)" val={morningPulse} set={setMorningPulse} min={30} max={150} suffix="bpm" />
          <NumInput label="Your Normal Baseline" val={baseline} set={setBaseline} min={30} max={120} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Last Night" val={sleepHours} set={setSleepHours} min={2} max={14} step={0.5} suffix="hours" />
          <NumInput label="HRV (RMSSD)" val={hrv} set={setHrv} min={5} max={200} suffix="ms" />
        </div>
      </div>} />
  )
}

// ─── 18. Stress-Heart Impact Estimator (Autonomic Load Model) ────────────────
export function StressHeartImpactCalculator() {
  const [stressLevel, setStressLevel] = useState(5)
  const [hrv, setHrv] = useState(38)
  const [rhr, setRhr] = useState(78)
  const [sbp, setSbp] = useState(130)
  const [dbp, setDbp] = useState(85)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const stress = clamp(stressLevel, 1, 10)
    const h = clamp(hrv, 5, 200)
    const hr = clamp(rhr, 40, 140)
    const s = clamp(sbp, 80, 220)
    const d = clamp(dbp, 40, 140)

    // Stress-cardiac load score (0-100)
    const cardiacLoad = r0(Math.min(100,
      stress * 6 +
      Math.max(0, (hr - 60) * 0.8) +
      Math.max(0, (s - 120) * 0.5) +
      Math.max(0, (50 - h) * 0.4)
    ))

    // Cortisol-driven HR elevation estimate
    const cortisolHRrise = r0(stress * 2.5)

    // Long-term hypertension risk projection (simplified)
    let htnProjection = "Low"
    if (cardiacLoad > 70) htnProjection = "High — chronic stress significantly accelerates hypertension"
    else if (cardiacLoad > 50) htnProjection = "Moderate — sustained stress elevates BP baseline over months"
    else if (cardiacLoad > 30) htnProjection = "Mild — manageable with stress reduction"

    // Burnout probability
    const burnoutProb = r0(Math.min(60, stress >= 8 ? stress * 6 + (8 - Math.min(8, h / 10)) * 3 : stress * 3))

    // Relaxation recommendation
    const relaxRec = cardiacLoad > 60 ? "Immediate: 4-7-8 breathing, progressive muscle relaxation. Daily: 20-min meditation, yoga, nature walk" :
                     cardiacLoad > 40 ? "Regular: meditation 10-15 min/day, exercise 4x/week, adequate sleep" :
                     "Maintenance: continue healthy habits"

    const status: 'good' | 'warning' | 'danger' | 'normal' = cardiacLoad < 30 ? "good" : cardiacLoad < 60 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Stress-Cardiac Load", value: `${cardiacLoad}/100`, status, description: `Stress: ${stress}/10 | Burnout Prob: ${burnoutProb}%` },
      healthScore: r0(Math.max(0, 100 - cardiacLoad)),
      metrics: [
        { label: "Cardiac Load Score", value: cardiacLoad, unit: "/100", status },
        { label: "Stress Level", value: `${stress}/10`, status: stress <= 3 ? "good" : stress <= 6 ? "warning" : "danger" },
        { label: "Cortisol HR Elevation", value: `+${cortisolHRrise}`, unit: "bpm est.", status: cortisolHRrise < 10 ? "normal" : "warning" },
        { label: "RHR", value: hr, unit: "bpm", status: hr <= 70 ? "good" : hr <= 85 ? "warning" : "danger" },
        { label: "HRV (RMSSD)", value: h, unit: "ms", status: h >= 40 ? "good" : h >= 25 ? "normal" : "warning" },
        { label: "Blood Pressure", value: `${s}/${d}`, unit: "mmHg", status: s < 130 && d < 85 ? "good" : "warning" },
        { label: "HTN Risk Projection", value: htnProjection, status: htnProjection === "Low" ? "good" : htnProjection.startsWith("Mild") ? "normal" : htnProjection.startsWith("Moderate") ? "warning" : "danger" },
        { label: "Burnout Probability", value: burnoutProb, unit: "%", status: burnoutProb < 15 ? "good" : burnoutProb < 35 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Stress-Heart Impact", description: `Cardiac load: ${cardiacLoad}/100. Chronic stress elevates cortisol → HR rises ~${cortisolHRrise} bpm, BP increases, HRV drops. ${cardiacLoad > 60 ? "🔴 HIGH CARDIAC LOAD: Your stress is significantly impacting cardiovascular function. Chronic high stress doubles heart disease risk. Cortisol promotes arterial inflammation, plaque formation, and arrhythmias." : cardiacLoad > 40 ? "🟡 Moderate load. Your body is compensating but prolonged stress will shift baseline BP upward." : "🟢 Low cardiac load. Stress impact is manageable."}`, priority: "high", category: "Assessment" },
        { title: "Relaxation Prescription", description: relaxRec + `. Evidence: meditation reduces SBP by 5-10 mmHg. Regular exercise reduces cortisol by 15-25%. Vagal breathing (exhale longer than inhale) acutely reduces HR by 5-15 bpm. Social connection reduces cortisol by 20%.`, priority: "high", category: "Intervention" },
        { title: "Long-term Cardiovascular Risk", description: `HTN projection: ${htnProjection}. Burnout probability: ${burnoutProb}%. ${burnoutProb > 30 ? "Burnout triples cardiovascular event risk. Screen for depression (PHQ-9). Consider professional support — cognitive behavioral therapy reduces cardiac events by 41% in stressed populations." : "Monitor stress levels weekly. Use heart-coherence (HRV biofeedback) training."}`, priority: "medium", category: "Prognosis" }
      ],
      detailedBreakdown: { "Stress": `${stress}/10`, "Cardiac Load": `${cardiacLoad}/100`, "Cortisol HR": `+${cortisolHRrise} bpm`, "RHR": `${hr} bpm`, "HRV": `${h} ms`, "BP": `${s}/${d}`, "Burnout": `${burnoutProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stress-heart-impact" title="Stress-Heart Impact Estimator"
      description="Quantify how psychological stress impacts your cardiovascular system with cardiac load scoring, burnout probability, and hypertension risk projection."
      icon={Brain} calculate={calculate} onClear={() => { setStressLevel(5); setHrv(38); setRhr(78); setSbp(130); setDbp(85); setResult(null) }}
      values={[stressLevel, hrv, rhr, sbp, dbp]} result={result}
      seoContent={<SeoContentGenerator title="Stress-Heart Impact Estimator" description="Estimate how stress affects your heart health." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Stress Level (1=relaxed, 10=extreme)" val={stressLevel} set={setStressLevel} min={1} max={10} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="HRV (RMSSD)" val={hrv} set={setHrv} min={5} max={200} suffix="ms" />
          <NumInput label="Resting Heart Rate" val={rhr} set={setRhr} min={40} max={140} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={80} max={220} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={dbp} set={setDbp} min={40} max={140} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 19. Heart Rate Recovery (HRR) ──────────────────────────────────────────
export function HeartRateRecoveryCalculator() {
  const [peakHR, setPeakHR] = useState(175)
  const [hr1min, setHr1min] = useState(145)
  const [hr2min, setHr2min] = useState(125)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const peak = clamp(peakHR, 100, 220)
    const hr1 = clamp(hr1min, 60, 220)
    const hr2 = clamp(hr2min, 50, 220)

    const hrr1 = peak - hr1
    const hrr2 = peak - hr2

    // Fitness classification
    let fitness = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (hrr1 >= 40) { fitness = "Excellent"; status = "good" }
    else if (hrr1 >= 25) { fitness = "Good"; status = "good" }
    else if (hrr1 >= 13) { fitness = "Average"; status = "normal" }
    else { fitness = "Poor — increased mortality risk"; status = "danger" }

    // Mortality risk correlation
    let mortalityRisk = "Low"
    if (hrr1 < 12) mortalityRisk = "High — HRR <12 bpm predicts 4× higher mortality"
    else if (hrr1 < 18) mortalityRisk = "Elevated — below average autonomic recovery"
    else if (hrr1 < 25) mortalityRisk = "Average"

    // Autonomic function score
    const autonomicScore = r0(Math.min(100, hrr1 * 2.5))

    // Recovery optimization
    const recoveryAdvice = hrr1 < 12 ? "Medical evaluation recommended — impaired parasympathetic reactivation" :
                           hrr1 < 25 ? "Improve: regular aerobic exercise, cool-down walks, breathing exercises" :
                           "Excellent recovery — maintain training"

    setResult({
      primaryMetric: { label: "HRR (1 min)", value: `${hrr1} bpm`, status, description: `${fitness} — Autonomic Score: ${autonomicScore}/100` },
      healthScore: autonomicScore,
      metrics: [
        { label: "Peak HR", value: peak, unit: "bpm", status: "normal" },
        { label: "HR at 1 min", value: hr1, unit: "bpm", status: "normal" },
        { label: "HR at 2 min", value: hr2, unit: "bpm", status: "normal" },
        { label: "HRR (1 min)", value: hrr1, unit: "bpm", status },
        { label: "HRR (2 min)", value: hrr2, unit: "bpm", status: hrr2 >= 42 ? "good" : hrr2 >= 22 ? "normal" : "danger" },
        { label: "Fitness Classification", value: fitness, status },
        { label: "Mortality Risk", value: mortalityRisk, status: mortalityRisk === "Low" ? "good" : mortalityRisk === "Average" ? "normal" : "danger" },
        { label: "Autonomic Score", value: autonomicScore, unit: "/100", status: autonomicScore >= 60 ? "good" : autonomicScore >= 30 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "HRR Interpretation", description: `HRR at 1 min: ${hrr1} bpm (${fitness}). HRR at 2 min: ${hrr2} bpm. ${hrr1 < 12 ? "🔴 CRITICAL: HRR <12 bpm at 1 min is a powerful predictor of all-cause mortality (Cole et al., NEJM). This indicates impaired parasympathetic reactivation. Cardiology evaluation recommended. Rule out: autonomic neuropathy, heart failure, coronary artery disease." : hrr1 < 25 ? "🟡 Below optimal. Parasympathetic reactivation can be improved through consistent aerobic training (12-16 weeks significantly improves HRR)." : "🟢 Excellent parasympathetic recovery. Strong prognostic indicator."}`, priority: "high", category: "Assessment" },
        { title: "Improving HRR", description: `${recoveryAdvice}. Key factors: 1) Aerobic base fitness (most important). 2) Proper cool-down (5 min walk, not abrupt stop). 3) Vagal tone training (deep breathing). 4) Adequate sleep. 5) Avoid overtraining (which paradoxically worsens HRR). Expected improvement: +5-10 bpm HRR after 8-12 weeks of regular cardio.`, priority: "high", category: "Training" },
        { title: "Trend Tracking", description: `Track HRR monthly using same protocol: peak effort → stand still → measure at 1 min and 2 min. Improving HRR is one of the strongest indicators of cardiovascular fitness gains. Target: HRR ≥25 bpm at 1 min.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Peak": `${peak} bpm`, "1-min": `${hr1} bpm`, "2-min": `${hr2} bpm`, "HRR1": `${hrr1} bpm`, "HRR2": `${hrr2} bpm`, "Fitness": fitness, "Mortality": mortalityRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="heart-rate-recovery" title="Heart Rate Recovery (HRR) Calculator"
      description="Calculate heart rate recovery at 1 and 2 minutes post-exercise with fitness classification, mortality risk correlation, and autonomic function scoring."
      icon={Activity} calculate={calculate} onClear={() => { setPeakHR(175); setHr1min(145); setHr2min(125); setResult(null) }}
      values={[peakHR, hr1min, hr2min]} result={result}
      seoContent={<SeoContentGenerator title="Heart Rate Recovery Calculator" description="Calculate HRR for cardiac fitness assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Peak Heart Rate" val={peakHR} set={setPeakHR} min={100} max={220} suffix="bpm" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="HR after 1 minute" val={hr1min} set={setHr1min} min={60} max={220} suffix="bpm" />
          <NumInput label="HR after 2 minutes" val={hr2min} set={setHr2min} min={50} max={220} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 20. MAF 180 Calculator (Low-Intensity Aerobic Optimization) ─────────────
export function AdvancedMAF180Calculator() {
  const [age, setAge] = useState(35)
  const [healthStatus, setHealthStatus] = useState("healthy")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 80)

    let maf = 180 - a
    let adjustment = ""

    if (healthStatus === "recovering") { maf -= 10; adjustment = "−10 (recovering from illness/injury)" }
    else if (healthStatus === "inconsistent") { maf -= 5; adjustment = "−5 (inconsistent training / frequent illness)" }
    else if (healthStatus === "healthy") { maf += 0; adjustment = "+0 (consistent 2+ years)" }
    else if (healthStatus === "elite") { maf += 5; adjustment = "+5 (elite competitive, >2 years no issues)" }

    const mafLow = maf - 10
    const mafHigh = maf

    // Fat oxidation zone peak (~85% of MAF)
    const fatOxPeak = r0(maf * 0.92)

    // Aerobic base zone
    const aerobaseZone = `${mafLow}–${mafHigh} bpm`

    setResult({
      primaryMetric: { label: "MAF Heart Rate", value: `${mafHigh} bpm`, status: "good", description: `Training zone: ${mafLow}–${mafHigh} bpm | Adjustment: ${adjustment}` },
      healthScore: 80,
      metrics: [
        { label: "MAF HR (ceiling)", value: mafHigh, unit: "bpm", status: "good" },
        { label: "MAF Zone Low", value: mafLow, unit: "bpm", status: "good" },
        { label: "Fat Oxidation Peak", value: fatOxPeak, unit: "bpm", status: "good" },
        { label: "Aerobic Base Zone", value: aerobaseZone, status: "good" },
        { label: "Adjustment Applied", value: adjustment, status: "normal" },
        { label: "Formula", value: `180 − ${a} = ${180 - a}`, status: "normal" }
      ],
      recommendations: [
        { title: "MAF Method", description: `MAF HR = 180 − age (${a}) ${adjustment} = ${mafHigh} bpm. Training zone: ${mafLow}–${mafHigh} bpm. Phil Maffetone's method prioritizes aerobic base building. All training should stay at or below MAF HR for 3-6 months to develop efficient fat metabolism and build aerobic engine without overtraining.`, priority: "high", category: "Training" },
        { title: "Fat Oxidation", description: `Peak fat burning at ~${fatOxPeak} bpm. At MAF intensity, body uses primarily fat for fuel (80-90%). Above MAF, glycogen usage increases rapidly. Building aerobic base allows faster paces at same MAF HR over time — this is the MAF test (monthly track performance at MAF HR).`, priority: "high", category: "Physiology" },
        { title: "MAF Test Protocol", description: `Monthly test: warm-up 15 min → run/walk at exactly ${mafHigh} bpm for 3-5 miles → record pace per mile. Improving pace at same HR = aerobic progress. Plateau or regression = overtraining, dietary issues, or sleep deficit. Most runners see 30-60 sec/mile improvement over 6 months.`, priority: "medium", category: "Testing" }
      ],
      detailedBreakdown: { "Age": a, "Base": `180 − ${a} = ${180 - a}`, "Adjustment": adjustment, "MAF HR": `${mafHigh} bpm`, "Zone": `${mafLow}–${mafHigh}`, "Fat Ox": `${fatOxPeak} bpm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="maf-180" title="MAF 180 Calculator"
      description="Calculate your Maximum Aerobic Function heart rate using the Maffetone method for optimal aerobic base training and fat oxidation."
      icon={Zap} calculate={calculate} onClear={() => { setAge(35); setHealthStatus("healthy"); setResult(null) }}
      values={[age, healthStatus]} result={result}
      seoContent={<SeoContentGenerator title="MAF 180 Calculator" description="Calculate MAF heart rate for aerobic training." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Age" val={age} set={setAge} min={10} max={80} suffix="years" />
        <SelectInput label="Health / Training Status" val={healthStatus} set={setHealthStatus} options={[
          { value: "recovering", label: "Recovering from illness/injury/medication" },
          { value: "inconsistent", label: "Inconsistent training / often sick" },
          { value: "healthy", label: "Healthy, consistent training 2+ years" },
          { value: "elite", label: "Elite/competitive, 2+ years no issues" }
        ]} />
      </div>} />
  )
}

// ─── 21. Karvonen Formula Calculator (Precision HR Targeting) ────────────────
export function AdvancedKarvonenCalculator() {
  const [restHR, setRestHR] = useState(65)
  const [maxHR, setMaxHR] = useState(185)
  const [intensity, setIntensity] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rest = clamp(restHR, 35, 120)
    const max = clamp(maxHR, 120, 220)
    const pct = clamp(intensity, 40, 100)

    const hrr = max - rest
    const targetHR = r0(((hrr) * pct / 100) + rest)

    // All zones
    const z1 = { low: r0(hrr * 0.50 + rest), high: r0(hrr * 0.60 + rest), name: "Z1: Recovery" }
    const z2 = { low: r0(hrr * 0.60 + rest), high: r0(hrr * 0.70 + rest), name: "Z2: Aerobic Base" }
    const z3 = { low: r0(hrr * 0.70 + rest), high: r0(hrr * 0.80 + rest), name: "Z3: Tempo" }
    const z4 = { low: r0(hrr * 0.80 + rest), high: r0(hrr * 0.90 + rest), name: "Z4: Threshold" }
    const z5 = { low: r0(hrr * 0.90 + rest), high: r0(hrr * 1.00 + rest), name: "Z5: VO₂max" }

    setResult({
      primaryMetric: { label: `Target HR (${pct}%)`, value: `${targetHR} bpm`, status: "good", description: `HRR: ${hrr} bpm | Formula: ((${max}−${rest}) × ${pct}%) + ${rest}` },
      healthScore: 80,
      metrics: [
        { label: "Target HR", value: targetHR, unit: "bpm", status: "good" },
        { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "normal" },
        { label: "Resting HR", value: rest, unit: "bpm", status: rest <= 60 ? "good" : rest <= 75 ? "normal" : "warning" },
        { label: "Max HR", value: max, unit: "bpm", status: "normal" },
        { label: z1.name, value: `${z1.low}–${z1.high}`, unit: "bpm", status: "good" },
        { label: z2.name, value: `${z2.low}–${z2.high}`, unit: "bpm", status: "good" },
        { label: z3.name, value: `${z3.low}–${z3.high}`, unit: "bpm", status: "good" },
        { label: z4.name, value: `${z4.low}–${z4.high}`, unit: "bpm", status: "warning" },
        { label: z5.name, value: `${z5.low}–${z5.high}`, unit: "bpm", status: "danger" }
      ],
      recommendations: [
        { title: "Karvonen Method", description: `THR = ((Max HR − Rest HR) × %) + Rest HR = ((${max} − ${rest}) × ${pct}%) + ${rest} = ${targetHR} bpm. Karvonen is more accurate than simple %MaxHR because it accounts for individual fitness via resting HR. Lower resting HR = fitter heart = wider usable range.`, priority: "high", category: "Method" },
        { title: "Zone Training Guide", description: `Z1 (${z1.low}-${z1.high}): Recovery/warm-up. Z2 (${z2.low}-${z2.high}): Aerobic base building, long runs. Z3 (${z3.low}-${z3.high}): Tempo work, marathon pace. Z4 (${z4.low}-${z4.high}): Lactate threshold, 10K-HM pace. Z5 (${z5.low}-${z5.high}): VO₂max intervals, 5K race pace. 80/20 rule: 80% Z1-Z2, 20% Z4-Z5.`, priority: "high", category: "Training" },
        { title: "Personalization", description: `Best accuracy: use actual measured Max HR (not 220−age estimate). Lab VO₂max test provides most accurate zones. For RPE correlation: Z2=conversational, Z3=can speak in sentences, Z4=few words, Z5=can't talk.`, priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: { "Rest HR": `${rest} bpm`, "Max HR": `${max} bpm`, "HRR": `${hrr} bpm`, "Intensity": `${pct}%`, "Target": `${targetHR} bpm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="karvonen-formula" title="Karvonen Formula Calculator"
      description="Calculate precision heart rate training zones using the Karvonen (Heart Rate Reserve) method with personalized zone breakdown."
      icon={Heart} calculate={calculate} onClear={() => { setRestHR(65); setMaxHR(185); setIntensity(70); setResult(null) }}
      values={[restHR, maxHR, intensity]} result={result}
      seoContent={<SeoContentGenerator title="Karvonen Formula Calculator" description="Calculate target HR zones using Karvonen method." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Resting Heart Rate" val={restHR} set={setRestHR} min={35} max={120} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={120} max={220} suffix="bpm" />
        </div>
        <NumInput label="Target Intensity" val={intensity} set={setIntensity} min={40} max={100} suffix="%" />
      </div>} />
  )
}

// ─── 22. Heart Rate Drift Calculator (Cardiac Decoupling Model) ──────────────
export function HeartRateDriftCalculator() {
  const [hrFirstHalf, setHrFirstHalf] = useState(145)
  const [hrSecondHalf, setHrSecondHalf] = useState(155)
  const [paceFirst, setPaceFirst] = useState(5.5)
  const [paceSecond, setPaceSecond] = useState(5.4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hr1 = clamp(hrFirstHalf, 80, 200)
    const hr2 = clamp(hrSecondHalf, 80, 210)
    const p1 = clamp(paceFirst, 2, 15)
    const p2 = clamp(paceSecond, 2, 15)

    const hrDrift = r1((hr2 - hr1) / hr1 * 100)
    const paceDrift = r1((p2 - p1) / p1 * 100)
    const decoupling = r1(hrDrift - paceDrift)

    // Aerobic efficiency
    let efficiency = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (decoupling < 3) { efficiency = "Excellent Aerobic Efficiency"; status = "good" }
    else if (decoupling < 5) { efficiency = "Good — aerobically fit"; status = "good" }
    else if (decoupling < 8) { efficiency = "Moderate — aerobic base needs work"; status = "warning" }
    else { efficiency = "Poor — significant cardiac drift"; status = "danger" }

    // Dehydration flag
    const dehydrationFlag = hrDrift > 8 ? "⚠️ Likely dehydration contributing — HR drift >8% common with fluid loss" : hrDrift > 5 ? "Possible mild dehydration" : "Unlikely"

    // Fatigue risk
    const fatigueRisk = decoupling > 8 ? "High — not ready for race-distance effort" : decoupling > 5 ? "Moderate — more base training needed" : "Low — aerobic system handles duration well"

    setResult({
      primaryMetric: { label: "HR Drift", value: `${hrDrift}%`, status, description: `${efficiency} | Decoupling: ${decoupling}%` },
      healthScore: r0(Math.max(0, 100 - decoupling * 8)),
      metrics: [
        { label: "HR First Half", value: hr1, unit: "bpm", status: "normal" },
        { label: "HR Second Half", value: hr2, unit: "bpm", status: "normal" },
        { label: "HR Drift", value: hrDrift, unit: "%", status: hrDrift < 5 ? "good" : hrDrift < 8 ? "warning" : "danger" },
        { label: "Pace/Power Drift", value: paceDrift, unit: "%", status: "normal" },
        { label: "Cardiac Decoupling", value: decoupling, unit: "%", status: decoupling < 5 ? "good" : decoupling < 8 ? "warning" : "danger" },
        { label: "Aerobic Efficiency", value: efficiency, status },
        { label: "Dehydration Flag", value: dehydrationFlag, status: dehydrationFlag.includes("Likely") ? "danger" : dehydrationFlag.includes("Possible") ? "warning" : "good" },
        { label: "Fatigue Risk", value: fatigueRisk, status: fatigueRisk.startsWith("Low") ? "good" : fatigueRisk.startsWith("Moderate") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Drift Analysis", description: `HR drift: ${hrDrift}%. Cardiac decoupling: ${decoupling}%. ${decoupling < 5 ? "🟢 Excellent — your aerobic system maintains efficiency over duration. You're likely ready for race distances at this intensity." : decoupling < 8 ? "🟡 Moderate drift indicates aerobic base is developing. More Zone 2 volume needed to reduce decoupling." : "🔴 Significant drift — HR rises disproportionate to pace/power. Not yet ready for longer races at this intensity. Increase aerobic base volume."}`, priority: "high", category: "Assessment" },
        { title: "Reducing Drift", description: `1) Increase weekly aerobic volume by 10-15%. 2) More Zone 2 long runs. 3) Hydrate properly (250-500 mL/hr). 4) Heat acclimation if training in heat. 5) Nutrition during long sessions (30-60g carbs/hr after 60 min). Target: <5% decoupling for marathon readiness, <3% for ultra readiness.`, priority: "high", category: "Training" },
        { title: "Hydration & Fueling", description: `${dehydrationFlag}. Each 1% body weight lost to sweat increases HR by ~7 bpm. For sessions >60 min: drink to thirst (400-800 mL/hr), intake 30-60g carbs/hr. Post-session: replenish 150% of fluid lost.`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "HR1": `${hr1} bpm`, "HR2": `${hr2} bpm`, "Drift": `${hrDrift}%`, "Decoupling": `${decoupling}%`, "Efficiency": efficiency, "Dehydration": dehydrationFlag }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="heart-rate-drift" title="Heart Rate Drift Calculator"
      description="Calculate cardiac decoupling during endurance sessions with aerobic efficiency rating, dehydration flagging, and race-readiness assessment."
      icon={TrendingUp} calculate={calculate} onClear={() => { setHrFirstHalf(145); setHrSecondHalf(155); setPaceFirst(5.5); setPaceSecond(5.4); setResult(null) }}
      values={[hrFirstHalf, hrSecondHalf, paceFirst, paceSecond]} result={result}
      seoContent={<SeoContentGenerator title="Heart Rate Drift Calculator" description="Calculate cardiac drift during endurance exercise." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Avg HR — First Half" val={hrFirstHalf} set={setHrFirstHalf} min={80} max={200} suffix="bpm" />
          <NumInput label="Avg HR — Second Half" val={hrSecondHalf} set={setHrSecondHalf} min={80} max={210} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Avg Pace — First Half" val={paceFirst} set={setPaceFirst} min={2} max={15} step={0.1} suffix="min/km" />
          <NumInput label="Avg Pace — Second Half" val={paceSecond} set={setPaceSecond} min={2} max={15} step={0.1} suffix="min/km" />
        </div>
      </div>} />
  )
}

// ─── 23. Orthostatic Heart Rate (Autonomic Stability Test) ───────────────────
export function OrthostaticHeartRateCalculator() {
  const [hrLying, setHrLying] = useState(62)
  const [hrStanding, setHrStanding] = useState(78)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lying = clamp(hrLying, 30, 120)
    const standing = clamp(hrStanding, 40, 160)

    const change = standing - lying

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (change < 10) { category = "Normal"; status = "good" }
    else if (change < 20) { category = "Mild Stress / Fatigue"; status = "warning" }
    else if (change < 30) { category = "Significant — Possible Dysautonomia"; status = "danger" }
    else { category = "Severe — POTS Screening Warranted"; status = "danger" }

    // Overtraining flag
    const overtrainingFlag = change >= 20 ? "⚠️ Elevated orthostatic change — possible overtraining" : change >= 15 ? "Monitor — mildly elevated" : "Not indicated"

    // POTS screening
    const potsAlert = change >= 30 || (standing >= 120 && change >= 20) ? "⚠️ POTS criteria may be met — HR increase ≥30 bpm standing. Referral to autonomic specialist recommended." : ""

    // Autonomic balance
    const autonomicBalance = change < 10 ? "Excellent" : change < 15 ? "Good" : change < 20 ? "Mildly impaired" : "Significantly impaired"

    setResult({
      primaryMetric: { label: "Orthostatic HR Change", value: `+${change} bpm`, status, description: category },
      healthScore: r0(Math.max(0, 100 - change * 3)),
      metrics: [
        { label: "HR Lying", value: lying, unit: "bpm", status: "normal" },
        { label: "HR Standing", value: standing, unit: "bpm", status: standing > 100 ? "warning" : "normal" },
        { label: "Orthostatic Change", value: `+${change}`, unit: "bpm", status },
        { label: "Category", value: category, status },
        { label: "Autonomic Balance", value: autonomicBalance, status: autonomicBalance === "Excellent" || autonomicBalance === "Good" ? "good" : autonomicBalance.includes("Mildly") ? "warning" : "danger" },
        { label: "Overtraining Flag", value: overtrainingFlag, status: overtrainingFlag === "Not indicated" ? "good" : overtrainingFlag.includes("Monitor") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Orthostatic Assessment", description: `Change: +${change} bpm (${category}). ${change < 10 ? "🟢 Normal autonomic response. Healthy baroreceptor and sympathetic reflexes." : change < 20 ? "🟡 Mild elevation. May indicate: fatigue, dehydration, mild autonomic stress, or early overtraining. Check hydration status and sleep quality." : "🔴 Significant orthostatic intolerance. " + (potsAlert || "Causes: dehydration, autonomic neuropathy, POTS, medications (beta-blockers, diuretics), adrenal insufficiency. Medical evaluation recommended.")}`, priority: "high", category: "Assessment" },
        { title: "Daily Monitoring Use", description: `Orthostatic test is a simple daily readiness check: lie down 5 min → measure HR → stand → measure after 1-2 min. A sustained increase of +5 bpm above your personal baseline indicates accumulated fatigue. Athletes use this to guide training load. ${overtrainingFlag !== "Not indicated" ? overtrainingFlag + ". Reduce training intensity until normalized." : ""}`, priority: "high", category: "Monitoring" },
        { title: "Management", description: `${change >= 20 ? "Increase fluid + salt intake (2-3L water, 3-5g sodium/day). Compression stockings. Physical counterpressure maneuvers (leg crossing). Avoid sudden position changes. If persistent, tilt-table test recommended." : "Maintain hydration. Normal orthostatic reflexes."}`, priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "Lying": `${lying} bpm`, "Standing": `${standing} bpm`, "Change": `+${change} bpm`, "Category": category, "Balance": autonomicBalance }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="orthostatic-heart-rate" title="Orthostatic Heart Rate Test"
      description="Assess autonomic stability with lying-to-standing heart rate change, POTS screening, overtraining detection, and dysautonomia risk."
      icon={Activity} calculate={calculate} onClear={() => { setHrLying(62); setHrStanding(78); setResult(null) }}
      values={[hrLying, hrStanding]} result={result}
      seoContent={<SeoContentGenerator title="Orthostatic Heart Rate Test" description="Assess autonomic stability with standing HR change." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Heart Rate — Lying Down (after 5 min)" val={hrLying} set={setHrLying} min={30} max={120} suffix="bpm" />
        <NumInput label="Heart Rate — Standing (after 1-3 min)" val={hrStanding} set={setHrStanding} min={40} max={160} suffix="bpm" />
      </div>} />
  )
}

// ─── 24. HRV (RMSSD) Calculator (Parasympathetic Index) ─────────────────────
export function HRVRMSSDCalculator() {
  const [rmssd, setRmssd] = useState(35)
  const [age, setAge] = useState(35)
  const [sleepHours, setSleepHours] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rm = clamp(rmssd, 5, 200)
    const a = clamp(age, 18, 80)
    const sleep = clamp(sleepHours, 3, 12)

    // Age-adjusted percentile
    const ageAdj = Math.max(0, (50 - a) * 0.4)
    const percentile = r0(Math.min(99, Math.max(1, rm / 1.2 + ageAdj)))

    // Readiness score
    const readiness = r0(Math.min(100, rm * 1.3 + (sleep - 5) * 5 + ageAdj))

    // Overtraining probability
    const overtrainingProb = rm < 20 && sleep < 6 ? r0(50) : rm < 25 ? r0(30) : rm < 30 && sleep < 7 ? r0(15) : r0(3)

    // Parasympathetic index
    const parasympathetic = r0(Math.min(100, rm * 1.8))

    let status: 'good' | 'warning' | 'danger' | 'normal' = rm >= 40 ? "good" : rm >= 25 ? "normal" : "warning"
    let readinessLabel = readiness >= 70 ? "Ready for High Intensity" : readiness >= 50 ? "Moderate Training OK" : readiness >= 30 ? "Light Training Only" : "Rest Day Recommended"

    setResult({
      primaryMetric: { label: "RMSSD", value: `${rm} ms`, status, description: `${percentile}th percentile — ${readinessLabel}` },
      healthScore: readiness,
      metrics: [
        { label: "RMSSD", value: rm, unit: "ms", status },
        { label: "Age-Adjusted Percentile", value: `${percentile}th`, status: percentile >= 60 ? "good" : percentile >= 30 ? "normal" : "warning" },
        { label: "Readiness Score", value: readiness, unit: "/100", status: readiness >= 70 ? "good" : readiness >= 50 ? "normal" : readiness >= 30 ? "warning" : "danger" },
        { label: "Readiness Status", value: readinessLabel, status: readiness >= 50 ? "good" : readiness >= 30 ? "warning" : "danger" },
        { label: "Parasympathetic Index", value: parasympathetic, unit: "/100", status: parasympathetic >= 60 ? "good" : parasympathetic >= 40 ? "normal" : "warning" },
        { label: "Overtraining Probability", value: overtrainingProb, unit: "%", status: overtrainingProb < 10 ? "good" : overtrainingProb < 25 ? "warning" : "danger" },
        { label: "Sleep", value: sleep, unit: "hrs", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "RMSSD Interpretation", description: `RMSSD: ${rm} ms (${percentile}th percentile for age ${a}). RMSSD measures beat-to-beat variability — directly reflects parasympathetic (vagal) activity. ${rm >= 40 ? "🟢 Strong vagal tone. Associated with stress resilience, cardiovascular health, and longevity." : rm >= 25 ? "Average range. Room for improvement through aerobic fitness and stress management." : "🟡 Low parasympathetic tone. Indicates chronic stress, fatigue, or autonomic dysfunction."}`, priority: "high", category: "Assessment" },
        { title: "Recovery Readiness", description: `Readiness: ${readiness}/100 (${readinessLabel}). ${readiness >= 70 ? "Green light for high-intensity training." : readiness >= 50 ? "Moderate effort appropriate. Avoid max intensity." : readiness < 30 ? "⚠️ Rest day strongly recommended. Your autonomic system needs recovery." : "Light exercise only — yoga, walking, mobility work."} Sleep: ${sleep} hours (${sleep >= 7 ? "adequate" : "suboptimal — each additional hour can improve RMSSD 10-20%"}).`, priority: "high", category: "Training" },
        { title: "Improving RMSSD", description: `Key factors (in order of impact): 1) Sleep quality and duration (most powerful). 2) Aerobic fitness (#1 long-term factor). 3) Stress management (meditation +5-10ms). 4) Cold exposure (cold showers boost vagal tone). 5) Avoid alcohol evening before measurement. Overtraining probability: ${overtrainingProb}%.`, priority: "medium", category: "Optimization" }
      ],
      detailedBreakdown: { "RMSSD": `${rm} ms`, "Percentile": `${percentile}th`, "Readiness": `${readiness}/100`, "Parasympathetic": `${parasympathetic}/100`, "Overtraining": `${overtrainingProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hrv-rmssd" title="HRV (RMSSD) Calculator"
      description="Calculate RMSSD-based heart rate variability with age-adjusted percentile, recovery readiness score, parasympathetic index, and overtraining probability."
      icon={Heart} calculate={calculate} onClear={() => { setRmssd(35); setAge(35); setSleepHours(7); setResult(null) }}
      values={[rmssd, age, sleepHours]} result={result}
      seoContent={<SeoContentGenerator title="HRV RMSSD Calculator" description="Calculate HRV using RMSSD for recovery assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="RMSSD Value" val={rmssd} set={setRmssd} min={5} max={200} suffix="ms" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={80} suffix="years" />
          <NumInput label="Sleep Last Night" val={sleepHours} set={setSleepHours} min={3} max={12} step={0.5} suffix="hours" />
        </div>
      </div>} />
  )
}

// ─── 25. HRV (SDNN) Calculator (Overall Variability Index) ──────────────────
export function HRVSDNNCalculator() {
  const [sdnn, setSdnn] = useState(50)
  const [age, setAge] = useState(45)
  const [diabetes, setDiabetes] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sd = clamp(sdnn, 10, 300)
    const a = clamp(age, 18, 90)
    const dm = diabetes === "yes"

    // SDNN classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (sd >= 100) { category = "Healthy / Good Variability"; status = "good" }
    else if (sd >= 50) { category = "Moderate Variability"; status = "normal" }
    else if (sd >= 30) { category = "Reduced Variability"; status = "warning" }
    else { category = "Severely Reduced — Cardiac Risk"; status = "danger" }

    // Cardiac autonomic neuropathy (CAN) risk — especially relevant in diabetics
    let canRisk = "Low"
    if (dm && sd < 50) canRisk = "High — diabetic autonomic neuropathy screening recommended"
    else if (dm && sd < 80) canRisk = "Moderate — monitor for CAN symptoms"
    else if (sd < 30) canRisk = "Elevated — regardless of diabetes status"

    // All-cause mortality correlation
    const mortalityRisk = sd < 50 ? "Elevated (2-3× in post-MI patients)" : sd < 70 ? "Mildly elevated" : "Normal"

    // Autonomic stability score
    const stabilityScore = r0(Math.min(100, sd * 0.8 + Math.max(0, (60 - a) * 0.3)))

    setResult({
      primaryMetric: { label: "SDNN", value: `${sd} ms`, status, description: `${category} — Stability: ${stabilityScore}/100` },
      healthScore: stabilityScore,
      metrics: [
        { label: "SDNN", value: sd, unit: "ms", status },
        { label: "Classification", value: category, status },
        { label: "Autonomic Stability Score", value: stabilityScore, unit: "/100", status: stabilityScore >= 60 ? "good" : stabilityScore >= 40 ? "normal" : "warning" },
        { label: "CAN Risk", value: canRisk, status: canRisk === "Low" ? "good" : canRisk.startsWith("Moderate") ? "warning" : "danger" },
        { label: "Mortality Correlation", value: mortalityRisk, status: mortalityRisk === "Normal" ? "good" : mortalityRisk.startsWith("Mildly") ? "warning" : "danger" },
        { label: "Age", value: a, status: "normal" },
        { label: "Diabetes", value: dm ? "Yes" : "No", status: dm ? "warning" : "good" }
      ],
      recommendations: [
        { title: "SDNN Interpretation", description: `SDNN: ${sd} ms (${category}). SDNN reflects overall HRV including sympathetic + parasympathetic activity over 24 hours (or 5-min segments). ${sd < 50 ? "🔴 SDNN <50 ms is a strong predictor of cardiac mortality. Associated with post-MI risk, heart failure progression, and sudden cardiac death. Cardiology evaluation recommended." : sd < 100 ? "🟡 Moderate — typical for middle-aged adults. Improvement possible with exercise and stress management." : "🟢 Healthy variability indicating robust autonomic regulation."}`, priority: "high", category: "Assessment" },
        { title: "Diabetic Neuropathy Screening", description: `${dm ? "CAN risk: " + canRisk + ". Cardiac Autonomic Neuropathy affects 20-65% of diabetics. Reduced SDNN is earliest marker. Screen with: deep breathing test, Valsalva, orthostatic BP. CAN increases 5-year mortality 5×." : "No diabetes — CAN screening not prioritized but low SDNN still warrants attention."}`, priority: dm ? "high" : "medium", category: "Neuropathy" },
        { title: "Improving SDNN", description: `SDNN is modifiable: aerobic exercise (8-12 weeks, +10-20ms). Meditation/yoga (+5-15ms). Omega-3 fatty acids (+3-5ms). Avoiding alcohol, smoking, chronic stress. SDNN naturally declines with age (~2ms/decade). Target: maintain SDNN ≥100ms or slow age-related decline.`, priority: "medium", category: "Optimization" }
      ],
      detailedBreakdown: { "SDNN": `${sd} ms`, "Category": category, "Stability": `${stabilityScore}/100`, "CAN Risk": canRisk, "Mortality": mortalityRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hrv-sdnn" title="HRV (SDNN) Calculator"
      description="Calculate SDNN-based heart rate variability with autonomic stability scoring, cardiac autonomic neuropathy screening, and mortality risk correlation."
      icon={Heart} calculate={calculate} onClear={() => { setSdnn(50); setAge(45); setDiabetes("no"); setResult(null) }}
      values={[sdnn, age, diabetes]} result={result}
      seoContent={<SeoContentGenerator title="HRV SDNN Calculator" description="Calculate HRV using SDNN for overall variability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="SDNN Value" val={sdnn} set={setSdnn} min={10} max={300} suffix="ms" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 26. Blood Pressure Dip (Nocturnal Dipping Pattern Analyzer) ─────────────
export function BloodPressureDipCalculator() {
  const [daySBP, setDaySBP] = useState(132)
  const [dayDBP, setDayDBP] = useState(84)
  const [nightSBP, setNightSBP] = useState(118)
  const [nightDBP, setNightDBP] = useState(72)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ds = clamp(daySBP, 80, 240)
    const dd = clamp(dayDBP, 50, 150)
    const ns = clamp(nightSBP, 70, 220)
    const nd = clamp(nightDBP, 40, 140)

    const sbpDip = r1((ds - ns) / ds * 100)
    const dbpDip = r1((dd - nd) / dd * 100)

    // Classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (sbpDip >= 20) { category = "Extreme Dipper"; status = "warning" }
    else if (sbpDip >= 10) { category = "Normal Dipper"; status = "good" }
    else if (sbpDip >= 0) { category = "Non-Dipper"; status = "danger" }
    else { category = "Reverse Dipper (Riser)"; status = "danger" }

    // Stroke risk correlation
    let strokeRisk = "Normal"
    if (sbpDip < 0) strokeRisk = "Very High — reverse dipping 3× stroke risk"
    else if (sbpDip < 10) strokeRisk = "Elevated — non-dipping 1.5-2× stroke risk"
    else if (sbpDip >= 20) strokeRisk = "Mildly elevated — excessive nocturnal hypotension"

    // Sleep apnea suspicion
    const apneaSuspicion = sbpDip < 10 ? "⚠️ Non-dipping pattern associated with obstructive sleep apnea. Screening recommended." : ""

    // Target organ damage risk
    const organDamage = sbpDip < 0 ? "High — LVH, renal damage, retinopathy" : sbpDip < 10 ? "Elevated — monitor for microalbuminuria" : "Normal"

    setResult({
      primaryMetric: { label: "Nocturnal SBP Dip", value: `${sbpDip}%`, status, description: category },
      healthScore: r0(Math.max(0, Math.min(100, sbpDip >= 10 && sbpDip < 20 ? 90 : 90 - Math.abs(sbpDip - 15) * 4))),
      metrics: [
        { label: "Daytime BP", value: `${ds}/${dd}`, unit: "mmHg", status: "normal" },
        { label: "Nighttime BP", value: `${ns}/${nd}`, unit: "mmHg", status: "normal" },
        { label: "SBP Dip", value: sbpDip, unit: "%", status },
        { label: "DBP Dip", value: dbpDip, unit: "%", status: dbpDip >= 10 && dbpDip < 20 ? "good" : "warning" },
        { label: "Dipping Pattern", value: category, status },
        { label: "Stroke Risk", value: strokeRisk, status: strokeRisk === "Normal" ? "good" : strokeRisk.startsWith("Mildly") ? "warning" : "danger" },
        { label: "Sleep Apnea Flag", value: apneaSuspicion || "Not indicated", status: apneaSuspicion ? "danger" : "good" },
        { label: "Target Organ Damage", value: organDamage, status: organDamage === "Normal" ? "good" : organDamage.startsWith("Elevated") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Dipping Pattern", description: `SBP dip: ${sbpDip}% — ${category}. Normal: 10-20% nighttime SBP reduction. ${sbpDip < 0 ? "🔴 REVERSE DIPPING: Nighttime BP higher than daytime. Strong predictor of cardiovascular events, stroke, and kidney damage. Causes: sleep apnea, autonomic neuropathy, chronic kidney disease, hyperaldosteronism. Urgent evaluation needed." : sbpDip < 10 ? "🟡 NON-DIPPER: Associated with increased cardiovascular mortality, LVH, and renal damage. Present in 30-50% of hypertensives. " + apneaSuspicion : sbpDip >= 20 ? "🟡 EXTREME DIPPER: Excessive nocturnal hypotension may cause cerebral hypoperfusion, silent cerebral infarcts, and falls (especially in elderly)." : "🟢 Normal dipping pattern — healthy nocturnal BP regulation."}`, priority: "high", category: "Assessment" },
        { title: "Clinical Significance", description: `Dipping pattern is determined by 24-hour ambulatory BP monitoring (ABPM). Non-dipping increases stroke risk 1.5-3×, LVH risk 2×, and renal disease progression. ${sbpDip < 10 ? "Consider: evening dosing of antihypertensives (chronotherapy), screening for OSA, checking renal function, evaluating for secondary hypertension." : "Continue routine monitoring."}`, priority: "high", category: "Clinical" },
        { title: "Target Organ Assessment", description: `Organ damage risk: ${organDamage}. ${organDamage !== "Normal" ? "Recommend: echocardiogram (LVH), urine albumin/creatinine ratio (renal), fundoscopy (retinopathy). Non-dippers develop end-organ damage faster even with similar daytime BP." : "Standard screening sufficient."}`, priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "Day BP": `${ds}/${dd}`, "Night BP": `${ns}/${nd}`, "SBP Dip": `${sbpDip}%`, "DBP Dip": `${dbpDip}%`, "Pattern": category, "Stroke": strokeRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blood-pressure-dip" title="Blood Pressure Dip Calculator"
      description="Analyze nocturnal blood pressure dipping pattern with stroke risk correlation, sleep apnea screening, and target organ damage assessment."
      icon={Heart} calculate={calculate} onClear={() => { setDaySBP(132); setDayDBP(84); setNightSBP(118); setNightDBP(72); setResult(null) }}
      values={[daySBP, dayDBP, nightSBP, nightDBP]} result={result}
      seoContent={<SeoContentGenerator title="Blood Pressure Dip Calculator" description="Analyze nocturnal BP dipping pattern." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm text-muted-foreground">Enter average daytime and nighttime BP from ambulatory monitoring:</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Daytime Avg SBP" val={daySBP} set={setDaySBP} min={80} max={240} suffix="mmHg" />
          <NumInput label="Daytime Avg DBP" val={dayDBP} set={setDayDBP} min={50} max={150} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Nighttime Avg SBP" val={nightSBP} set={setNightSBP} min={70} max={220} suffix="mmHg" />
          <NumInput label="Nighttime Avg DBP" val={nightDBP} set={setNightDBP} min={40} max={140} suffix="mmHg" />
        </div>
      </div>} />
  )
}
