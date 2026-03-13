"use client"
import { useState } from "react"
import { Heart, Activity, TrendingUp, AlertCircle, Zap, Shield, Wind } from "lucide-react"
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

// ─── 1. Target Heart Rate Calculator (Precision Cardio Zone Engine) ──────────
export function AdvancedTargetHeartRateCalculator() {
  const [age, setAge] = useState(35)
  const [restHR, setRestHR] = useState(68)
  const [fitness, setFitness] = useState("moderate")
  const [betaBlocker, setBetaBlocker] = useState("no")
  const [heartDisease, setHeartDisease] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const rhr = clamp(restHR, 35, 120)
    const onBeta = betaBlocker === "yes"
    const cvd = heartDisease === "yes"

    const maxHR = onBeta ? r0((220 - a) * 0.75) : r0(220 - a)

    // Karvonen zones — THR = ((MaxHR - RestHR) × %Intensity) + RestHR
    const hrr = maxHR - rhr
    const z1Low = r0(hrr * 0.50 + rhr); const z1High = r0(hrr * 0.60 + rhr)
    const z2Low = r0(hrr * 0.60 + rhr); const z2High = r0(hrr * 0.70 + rhr)
    const z3Low = r0(hrr * 0.70 + rhr); const z3High = r0(hrr * 0.80 + rhr)
    const z4Low = r0(hrr * 0.80 + rhr); const z4High = r0(hrr * 0.90 + rhr)
    const z5Low = r0(hrr * 0.90 + rhr); const z5High = r0(hrr * 1.00 + rhr)

    // Fat oxidation zone peak (typically ~63% VO₂max ≈ ~68% HRmax)
    const fatOxPeak = r0(hrr * 0.65 + rhr)

    // Anaerobic threshold estimate (~85% HRmax Karvonen)
    const anaerobicThr = r0(hrr * 0.85 + rhr)

    // Cardiac strain ceiling
    const strainCeiling = cvd ? r0(hrr * 0.75 + rhr) : onBeta ? r0(hrr * 0.85 + rhr) : r0(hrr * 0.95 + rhr)

    // Risk classification
    let riskColor = "🟢 Green (Safe)", riskStatus: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (cvd) { riskColor = "🟣 Purple (Medical Supervision)"; riskStatus = "danger" }
    else if (onBeta) { riskColor = "🟡 Yellow (Moderate Caution)"; riskStatus = "warning" }
    else if (a > 65) { riskColor = "🟡 Yellow (Age Caution)"; riskStatus = "warning" }

    // Recommended zone based on fitness
    const recZone = fitness === "sedentary" ? `Zone 1-2 (${z1Low}-${z2High} bpm)` :
                    fitness === "moderate" ? `Zone 2-3 (${z2Low}-${z3High} bpm)` :
                    `Zone 3-4 (${z3Low}-${z4High} bpm)`

    // Arrhythmia safety alert
    const arrhythmiaAlert = rhr > 100 ? "⚠️ Resting HR >100 bpm — tachycardia. Medical evaluation recommended before exercise." :
                            rhr < 40 && fitness !== "athlete" ? "⚠️ Resting HR <40 bpm — possible bradycardia. Consult cardiologist." : ""

    setResult({
      primaryMetric: { label: "Safe Training Range", value: `${z2Low}–${z3High} bpm`, status: riskStatus, description: `${riskColor}` },
      healthScore: r0(Math.min(100, Math.max(0, 100 - (a - 20) * 0.8))),
      metrics: [
        { label: "Max HR", value: maxHR, unit: "bpm", status: "normal" },
        { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "normal" },
        { label: "Zone 1 (Warm-up)", value: `${z1Low}–${z1High}`, unit: "bpm", status: "good" },
        { label: "Zone 2 (Fat Burn)", value: `${z2Low}–${z2High}`, unit: "bpm", status: "good" },
        { label: "Zone 3 (Aerobic)", value: `${z3Low}–${z3High}`, unit: "bpm", status: "good" },
        { label: "Zone 4 (Threshold)", value: `${z4Low}–${z4High}`, unit: "bpm", status: "warning" },
        { label: "Zone 5 (VO₂max)", value: `${z5Low}–${z5High}`, unit: "bpm", status: "danger" },
        { label: "Fat Oxidation Peak", value: fatOxPeak, unit: "bpm", status: "good" },
        { label: "Anaerobic Threshold", value: anaerobicThr, unit: "bpm", status: "warning" },
        { label: "Cardiac Strain Ceiling", value: strainCeiling, unit: "bpm", status: riskStatus },
        { label: "Risk Classification", value: riskColor, status: riskStatus },
        { label: "Recommended Zone", value: recZone, status: "good" },
        { label: "Beta-Blocker Adjusted", value: onBeta ? "Yes (Max HR reduced 25%)" : "No", status: onBeta ? "warning" : "normal" }
      ],
      recommendations: [
        { title: "Personalized Cardio Zones", description: `Max HR: ${maxHR} bpm (${onBeta ? "beta-blocker adjusted" : "standard"}). Karvonen method uses heart rate reserve for accurate zones. Recommended: ${recZone}. ${fitness === "sedentary" ? "Start with Zone 1-2 for 20-30 min, 3x/week. Progress after 4 weeks." : fitness === "moderate" ? "Train in Zone 2-3 for 30-45 min. Add 1 HIIT session/week in Zone 4." : "Mix Zone 3 endurance with Zone 4-5 intervals. 80/20 rule: 80% easy, 20% hard."}${arrhythmiaAlert ? `\n\n${arrhythmiaAlert}` : ""}`, priority: "high", category: "Training" },
        { title: "Fat Oxidation & Threshold", description: `Peak fat burning at ~${fatOxPeak} bpm. Anaerobic threshold at ~${anaerobicThr} bpm. Below threshold: sustainable aerobic work, primarily fat fuel. Above threshold: glycogen dominant, limited to 20-60 min. Training at/near threshold 1-2x/week improves endurance significantly (shift threshold upward).`, priority: "high", category: "Physiology" },
        { title: "Cardiac Safety", description: `${cvd ? "🟣 KNOWN HEART DISEASE: Exercise only under medical supervision. Do not exceed strain ceiling of " + strainCeiling + " bpm. Cardiac rehab Phase II-III protocols recommended. Carry emergency medication. Stop immediately if chest pain, severe dyspnea, or dizziness occurs." : onBeta ? "🟡 Beta-blocker suppresses HR response. Perceived exertion (RPE 12-14) may be more reliable than HR targets. Do not exceed " + strainCeiling + " bpm." : "🟢 Standard safety. Warm up 5-10 min in Zone 1. Cool down gradually. Stay hydrated. Stop if chest pain, dizziness, or abnormal breathlessness."}`, priority: "high", category: "Clinical" }
      ],
      detailedBreakdown: { "Max HR": `${maxHR} bpm`, "Resting HR": `${rhr} bpm`, "HRR": `${hrr} bpm`, "Fat Ox Peak": `${fatOxPeak} bpm`, "Anaerobic Thr": `${anaerobicThr} bpm`, "Strain Ceiling": `${strainCeiling} bpm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="target-heart-rate" title="Target Heart Rate Calculator"
      description="Calculate precise cardio training zones using the Karvonen method. Includes fat oxidation zone, anaerobic threshold, medication-adjusted HR zones, and cardiac safety classification."
      icon={Heart} calculate={calculate} onClear={() => { setAge(35); setRestHR(68); setFitness("moderate"); setBetaBlocker("no"); setHeartDisease("no"); setResult(null) }}
      values={[age, restHR, fitness, betaBlocker, heartDisease]} result={result}
      seoContent={<SeoContentGenerator title="Target Heart Rate Calculator" description="Find your precise target heart rate training zones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <NumInput label="Resting Heart Rate" val={restHR} set={setRestHR} min={35} max={120} suffix="bpm" />
        </div>
        <SelectInput label="Fitness Level" val={fitness} set={setFitness} options={[{ value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderately Active" }, { value: "active", label: "Very Active" }, { value: "athlete", label: "Athlete" }]} />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="On Beta-Blocker?" val={betaBlocker} set={setBetaBlocker} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Known Heart Disease?" val={heartDisease} set={setHeartDisease} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 2. Blood Pressure Calculator (Hypertension Risk Engine) ─────────────────
export function AdvancedBloodPressureCalculator() {
  const [systolic, setSystolic] = useState(125)
  const [diastolic, setDiastolic] = useState(82)
  const [age, setAge] = useState(45)
  const [bmi, setBmi] = useState(27)
  const [smoking, setSmoking] = useState("no")
  const [diabetes, setDiabetes] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(systolic, 60, 260)
    const d = clamp(diastolic, 40, 160)
    const a = clamp(age, 18, 90)
    const b = clamp(bmi, 10, 60)

    const pp = s - d
    const map = r1(d + pp / 3)

    // AHA/ACC classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (s > 180 || d > 120) { category = "Hypertensive Crisis"; status = "danger" }
    else if (s >= 140 || d >= 90) { category = "Stage 2 Hypertension"; status = "danger" }
    else if ((s >= 130 && s <= 139) || (d >= 80 && d <= 89)) { category = "Stage 1 Hypertension"; status = "warning" }
    else if (s >= 120 && s <= 129 && d < 80) { category = "Elevated"; status = "warning" }
    else if (s >= 90 && d >= 60) { category = "Normal"; status = "good" }
    else { category = "Low (Hypotension)"; status = "warning" }

    // 10-year stroke risk estimate (simplified Framingham-based)
    let strokeRiskPts = 0
    if (a >= 55) strokeRiskPts += 3; else if (a >= 45) strokeRiskPts += 2; else if (a >= 35) strokeRiskPts += 1
    if (s >= 140) strokeRiskPts += 3; else if (s >= 130) strokeRiskPts += 2; else if (s >= 120) strokeRiskPts += 1
    if (smoking === "yes") strokeRiskPts += 2
    if (diabetes === "yes") strokeRiskPts += 2
    if (b >= 30) strokeRiskPts += 1
    const strokeRisk10y = r1(Math.min(35, strokeRiskPts * 2.8))

    // LVH probability (simplified — based on BP severity and duration proxy)
    const lvhProb = r0(Math.min(45, (Math.max(0, s - 120) * 0.3 + Math.max(0, d - 80) * 0.4 + Math.max(0, a - 40) * 0.2)))

    // Masked hypertension alert
    const maskedAlert = s >= 120 && s < 130 && a > 45 ? "⚠️ Borderline readings in age >45 — consider 24-hour ambulatory BP monitoring to rule out masked hypertension." : ""

    // BP variability index (simplified)
    const variabilityRisk = pp > 60 ? "High" : pp > 40 ? "Moderate" : "Normal"

    setResult({
      primaryMetric: { label: `${s}/${d} mmHg`, value: category, status, description: `Pulse Pressure: ${pp} | MAP: ${map}` },
      healthScore: Math.max(0, Math.min(100, r0(100 - strokeRiskPts * 8))),
      metrics: [
        { label: "Systolic", value: s, unit: "mmHg", status: s < 120 ? "good" : s < 130 ? "warning" : "danger" },
        { label: "Diastolic", value: d, unit: "mmHg", status: d < 80 ? "good" : d < 90 ? "warning" : "danger" },
        { label: "Category", value: category, status },
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status: pp >= 30 && pp <= 50 ? "good" : pp <= 60 ? "warning" : "danger" },
        { label: "Mean Arterial Pressure", value: map, unit: "mmHg", status: map >= 70 && map <= 100 ? "good" : "warning" },
        { label: "10-Year Stroke Risk", value: strokeRisk10y, unit: "%", status: strokeRisk10y < 5 ? "good" : strokeRisk10y < 10 ? "warning" : "danger" },
        { label: "LV Hypertrophy Probability", value: lvhProb, unit: "%", status: lvhProb < 10 ? "good" : lvhProb < 25 ? "warning" : "danger" },
        { label: "BP Variability", value: variabilityRisk, status: variabilityRisk === "Normal" ? "good" : variabilityRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "BP Classification & Risk", description: `${s}/${d} = ${category}. Pulse pressure ${pp} mmHg (${pp > 60 ? "widened — indicates arterial stiffness" : "normal range"}). MAP ${map} (${map < 70 ? "⚠️ risk of organ hypoperfusion" : map > 105 ? "⚠️ elevated — increases end-organ damage risk" : "adequate organ perfusion"}). 10-year stroke risk: ${strokeRisk10y}%. LVH probability: ${lvhProb}%.${maskedAlert ? `\n\n${maskedAlert}` : ""}`, priority: "high", category: "Assessment" },
        { title: "Lifestyle Modifications", description: `Each intervention reduces SBP: DASH diet (−8-14 mmHg), weight loss (−5-20/10kg), sodium <2300mg (−2-8), exercise 30 min/day (−4-9), limit alcohol (−2-4), quit smoking (−2-4 + CV risk reduction). Combined effect can be 15-25 mmHg reduction. ${category.includes("Stage") ? "Medication likely needed alongside lifestyle changes." : "Lifestyle changes may be sufficient."}`, priority: "high", category: "Intervention" },
        { title: "Clinical Monitoring", description: `${s > 180 || d > 120 ? "🔴 CRISIS: Seek emergency care immediately. Risk of stroke, aortic dissection, or end-organ damage." : category.includes("Stage 2") ? "🔴 Medical treatment required. Target: <130/80 for most adults. Medication + lifestyle changes." : category.includes("Stage 1") ? "🟡 Re-check in 1-3 months. If persistent, initiate treatment. Home BP monitoring 2x daily recommended." : "🟢 Annual checkup sufficient. Maintain healthy lifestyle."}`, priority: "high", category: "Clinical" }
      ],
      detailedBreakdown: { "SBP": `${s} mmHg`, "DBP": `${d} mmHg`, "PP": `${pp} mmHg`, "MAP": `${map} mmHg`, "Category": category, "Stroke Risk": `${strokeRisk10y}%`, "LVH Prob": `${lvhProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blood-pressure-calculator" title="Blood Pressure Calculator"
      description="Interpret BP readings with AHA/ACC 2017 classification, 10-year stroke risk, LVH probability, pulse pressure analysis, and masked hypertension detection."
      icon={Heart} calculate={calculate} onClear={() => { setSystolic(125); setDiastolic(82); setAge(45); setBmi(27); setSmoking("no"); setDiabetes("no"); setResult(null) }}
      values={[systolic, diastolic, age, bmi, smoking, diabetes]} result={result}
      seoContent={<SeoContentGenerator title="Blood Pressure Calculator" description="Interpret blood pressure readings with cardiovascular risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic (top)" val={systolic} set={setSystolic} min={60} max={260} suffix="mmHg" />
          <NumInput label="Diastolic (bottom)" val={diastolic} set={setDiastolic} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={10} max={60} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Smoking" val={smoking} set={setSmoking} options={[{ value: "no", label: "Non-smoker" }, { value: "yes", label: "Current Smoker" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 3. Resting Heart Rate Calculator (Autonomic Health Marker) ──────────────
export function AdvancedRestingHeartRateCalculator() {
  const [rhr, setRhr] = useState(72)
  const [age, setAge] = useState(35)
  const [fitness, setFitness] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hr = clamp(rhr, 30, 150)
    const a = clamp(age, 10, 90)

    // Classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "normal"
    if (hr < 40) { category = "Bradycardia (very low)"; status = fitness === "athlete" ? "good" : "danger" }
    else if (hr <= 50) { category = "Athletic"; status = "good" }
    else if (hr <= 60) { category = "Excellent"; status = "good" }
    else if (hr <= 70) { category = "Good"; status = "good" }
    else if (hr <= 80) { category = "Average"; status = "normal" }
    else if (hr <= 90) { category = "Below Average"; status = "warning" }
    else if (hr <= 100) { category = "Poor"; status = "warning" }
    else { category = "Tachycardia"; status = "danger" }

    // Fitness percentile (age-adjusted, simplified)
    const ageAdj = a > 50 ? 5 : a > 40 ? 3 : 0
    const percentile = r0(Math.min(99, Math.max(1, 100 - (hr - 45 + ageAdj) * 1.5)))

    // Sympathetic dominance score (higher RHR = more sympathetic)
    const sympatheticScore = r0(Math.min(100, Math.max(0, (hr - 50) * 2)))

    // Overtraining alert
    const overtrainingAlert = fitness === "athlete" && hr > 70 ? "⚠️ Elevated RHR for athlete — possible overtraining, illness, or insufficient recovery." : ""

    // Illness flag
    const illnessFlag = hr > 85 ? "Elevated baseline may indicate infection, stress, dehydration, or thyroid dysfunction." : ""

    // Mortality correlation
    const mortalityRisk = hr > 80 ? "Elevated" : hr > 70 ? "Moderate" : "Low"

    setResult({
      primaryMetric: { label: "Resting Heart Rate", value: `${hr} bpm`, status, description: `${category} — ${percentile}th percentile` },
      healthScore: r0(Math.min(100, percentile)),
      metrics: [
        { label: "RHR", value: hr, unit: "bpm", status },
        { label: "Category", value: category, status },
        { label: "Fitness Percentile", value: `${percentile}th`, status: percentile >= 70 ? "good" : percentile >= 40 ? "normal" : "warning" },
        { label: "Sympathetic Dominance", value: sympatheticScore, unit: "/100", status: sympatheticScore < 30 ? "good" : sympatheticScore < 60 ? "normal" : "warning" },
        { label: "CV Mortality Risk", value: mortalityRisk, status: mortalityRisk === "Low" ? "good" : mortalityRisk === "Moderate" ? "warning" : "danger" },
        { label: "Age", value: a, status: "normal" },
        { label: "Fitness Level", value: fitness, status: "normal" }
      ],
      recommendations: [
        { title: "RHR Assessment", description: `${hr} bpm = ${category} (${percentile}th percentile for age ${a}). ${hr <= 60 ? "Excellent cardiovascular fitness. Low resting HR reflects strong vagal tone and efficient cardiac function." : hr <= 75 ? "Average range. Regular aerobic exercise (30+ min, 4-5x/week) can lower RHR by 5-15 bpm over 8-12 weeks." : "Above average. Elevated RHR is an independent risk factor for all-cause mortality. Each 10 bpm increase above 70 associates with 10-20% higher mortality."}${overtrainingAlert ? `\n\n${overtrainingAlert}` : ""}${illnessFlag ? `\n\n${illnessFlag}` : ""}`, priority: "high", category: "Assessment" },
        { title: "Autonomic Balance", description: `Sympathetic dominance: ${sympatheticScore}/100. ${sympatheticScore > 60 ? "High sympathetic activation may indicate chronic stress, poor sleep, or deconditioning. Interventions: deep breathing (4-7-8 technique), meditation, regular aerobic exercise, adequate sleep (7-9 hrs)." : "Good parasympathetic tone. Vagal activity supports recovery, digestion, and cardiovascular health."}`, priority: "high", category: "Autonomic" },
        { title: "Trend Monitoring", description: `Track RHR daily upon waking (before standing). A sustained rise of 5-7+ bpm above baseline can indicate: illness onset (2-3 days before symptoms), overtraining, dehydration, or psychological stress. This is one of the most valuable free health metrics available.`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "RHR": `${hr} bpm`, "Category": category, "Percentile": `${percentile}th`, "Sympathetic": `${sympatheticScore}/100`, "Mortality": mortalityRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="resting-heart-rate" title="Resting Heart Rate Calculator"
      description="Assess your resting heart rate with fitness percentile ranking, sympathetic dominance scoring, overtraining detection, and cardiovascular mortality risk."
      icon={Heart} calculate={calculate} onClear={() => { setRhr(72); setAge(35); setFitness("moderate"); setResult(null) }}
      values={[rhr, age, fitness]} result={result}
      seoContent={<SeoContentGenerator title="Resting Heart Rate Calculator" description="Assess your resting heart rate and fitness level." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Resting Heart Rate (morning)" val={rhr} set={setRhr} min={30} max={150} suffix="bpm" />
        <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
        <SelectInput label="Fitness Level" val={fitness} set={setFitness} options={[{ value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderately Active" }, { value: "active", label: "Very Active" }, { value: "athlete", label: "Athlete" }]} />
      </div>} />
  )
}

// ─── 4. Cardiovascular Risk Calculator (Comprehensive CVD Risk Engine) ───────
export function CardiovascularRiskCalculator() {
  const [age, setAge] = useState(50)
  const [gender, setGender] = useState("male")
  const [systolic, setSystolic] = useState(135)
  const [totalChol, setTotalChol] = useState(220)
  const [hdl, setHdl] = useState(50)
  const [smoking, setSmoking] = useState("no")
  const [diabetes, setDiabetes] = useState("no")
  const [bpTreatment, setBpTreatment] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 79)
    const s = clamp(systolic, 90, 200)
    const tc = clamp(totalChol, 100, 400)
    const h = clamp(hdl, 20, 100)
    const male = gender === "male"
    const smk = smoking === "yes"
    const dm = diabetes === "yes"
    const bpTx = bpTreatment === "yes"

    // Pooled Cohort Equations (simplified ASCVD 10-year risk)
    let risk = 0
    if (male) {
      const lnAge = Math.log(a)
      const lnTC = Math.log(tc)
      const lnHDL = Math.log(h)
      const lnSBP = Math.log(s)
      const sum = 12.344 * lnAge + 11.853 * lnTC - 2.664 * lnHDL
                  + (bpTx ? 1.797 * lnSBP : 1.764 * lnSBP)
                  + (smk ? 7.837 : 0) + (dm ? 0.658 : 0)
                  - 61.18
      risk = r1(Math.min(50, Math.max(0.1, (1 - Math.pow(0.9144, Math.exp(sum))) * 100)))
    } else {
      const lnAge = Math.log(a)
      const lnTC = Math.log(tc)
      const lnHDL = Math.log(h)
      const lnSBP = Math.log(s)
      const sum = -29.799 * lnAge + 13.540 * lnTC + 0.198 * lnHDL
                  + (bpTx ? 2.019 * lnSBP : 1.957 * lnSBP)
                  + (smk ? 7.574 : 0) + (dm ? 0.661 : 0)
                  + 29.18
      risk = r1(Math.min(50, Math.max(0.1, (1 - Math.pow(0.9665, Math.exp(sum))) * 100)))
    }

    let riskCategory = "Low", riskStatus: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (risk >= 20) { riskCategory = "High"; riskStatus = "danger" }
    else if (risk >= 7.5) { riskCategory = "Borderline-High"; riskStatus = "warning" }
    else if (risk >= 5) { riskCategory = "Moderate"; riskStatus = "warning" }

    // Statin eligibility
    const statinEligible = risk >= 7.5 || (dm && a >= 40) || tc >= 190
    const statinAdvice = statinEligible ? "Statin therapy should be discussed with physician" : "Below statin threshold"

    // Lifetime risk (simplified)
    const lifetimeRisk = r0(Math.min(60, risk * 3 + (smk ? 8 : 0) + (dm ? 10 : 0)))

    // 5-year BP reduction benefit estimate
    const bpReductionBenefit = s > 130 ? r1((s - 120) * 0.3) : 0

    // Peer comparison (simplified age-gender average)
    const peerAvgRisk = male ? (a > 60 ? 15 : a > 50 ? 8 : 4) : (a > 60 ? 10 : a > 50 ? 5 : 2)

    setResult({
      primaryMetric: { label: "10-Year ASCVD Risk", value: `${risk}%`, status: riskStatus, description: `${riskCategory} Risk — Peer avg: ~${peerAvgRisk}%` },
      healthScore: r0(Math.max(0, Math.min(100, 100 - risk * 3))),
      metrics: [
        { label: "10-Year ASCVD Risk", value: risk, unit: "%", status: riskStatus },
        { label: "Risk Category", value: riskCategory, status: riskStatus },
        { label: "Lifetime Risk", value: lifetimeRisk, unit: "%", status: lifetimeRisk < 20 ? "good" : lifetimeRisk < 40 ? "warning" : "danger" },
        { label: "Statin Eligibility", value: statinAdvice, status: statinEligible ? "warning" : "good" },
        { label: "Peer Comparison", value: `You: ${risk}% vs Avg: ~${peerAvgRisk}%`, status: risk <= peerAvgRisk ? "good" : "warning" },
        { label: "BP Reduction Benefit", value: bpReductionBenefit > 0 ? `−${bpReductionBenefit}% risk` : "N/A", status: "good" },
        { label: "Systolic BP", value: s, unit: "mmHg", status: s < 130 ? "good" : s < 140 ? "warning" : "danger" },
        { label: "Total Cholesterol", value: tc, unit: "mg/dL", status: tc < 200 ? "good" : tc < 240 ? "warning" : "danger" },
        { label: "HDL", value: h, unit: "mg/dL", status: h >= 60 ? "good" : h >= 40 ? "normal" : "danger" },
        { label: "Smoking", value: smk ? "Yes (+major risk)" : "No", status: smk ? "danger" : "good" },
        { label: "Diabetes", value: dm ? "Yes (+major risk)" : "No", status: dm ? "danger" : "good" }
      ],
      recommendations: [
        { title: "ASCVD Risk Interpretation", description: `10-year risk: ${risk}% (${riskCategory}). Based on Pooled Cohort Equations. ${risk >= 20 ? "HIGH RISK: Intensive lifestyle modification + high-intensity statin therapy. Target LDL <70 mg/dL." : risk >= 7.5 ? "BORDERLINE-HIGH: Moderate-intensity statin + lifestyle modifications. Risk-enhancing factors (CAC score, family history) can guide treatment decision." : risk >= 5 ? "MODERATE: Lifestyle modifications primary. If risk-enhancing factors present, consider statin." : "LOW RISK: Maintain healthy lifestyle. Reassess in 5 years."}`, priority: "high", category: "Assessment" },
        { title: "Modifiable Risk Reduction", description: `Intervention impact: ${smk ? "Quitting smoking: risk drops 50% within 1 year. " : ""}${s > 130 ? `Lowering SBP from ${s} to 120: ~${bpReductionBenefit}% absolute risk reduction. ` : ""}${tc > 200 ? "Statin therapy: 25-50% LDL reduction → ~25% CVD event reduction. " : ""}${h < 40 ? "Raise HDL: exercise (+2-8%), niacin (+15-35%). " : ""}Regular exercise alone reduces CVD risk by 20-30%.`, priority: "high", category: "Intervention" },
        { title: "Lifetime Perspective", description: `Lifetime CVD risk: ~${lifetimeRisk}%. Even low 10-year risk in younger adults can mask high lifetime risk. ${a < 50 ? "Young adults with risk factors accumulate damage over decades. Early intervention prevents 50-year disease progression." : "Focus on aggressive risk factor management to prevent events."} Coronary calcium scoring (CAC) can refine risk if decision uncertain.`, priority: "medium", category: "Long-term" }
      ],
      detailedBreakdown: { "Age": a, "Gender": gender, "SBP": `${s} mmHg`, "TC": `${tc} mg/dL`, "HDL": `${h} mg/dL`, "10yr Risk": `${risk}%`, "Lifetime": `${lifetimeRisk}%`, "Statin": statinEligible ? "Eligible" : "Not indicated" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cardiovascular-risk" title="Cardiovascular Risk Calculator"
      description="Assess 10-year ASCVD risk using Pooled Cohort Equations with lifetime risk projection, statin eligibility, peer comparison, and intervention impact modeling."
      icon={Heart} calculate={calculate} onClear={() => { setAge(50); setGender("male"); setSystolic(135); setTotalChol(220); setHdl(50); setSmoking("no"); setDiabetes("no"); setBpTreatment("no"); setResult(null) }}
      values={[age, gender, systolic, totalChol, hdl, smoking, diabetes, bpTreatment]} result={result}
      seoContent={<SeoContentGenerator title="Cardiovascular Risk Calculator" description="Assess heart disease and stroke risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={79} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Systolic Blood Pressure" val={systolic} set={setSystolic} min={90} max={200} suffix="mmHg" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalChol} set={setTotalChol} min={100} max={400} suffix="mg/dL" />
          <NumInput label="HDL Cholesterol" val={hdl} set={setHdl} min={20} max={100} suffix="mg/dL" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectInput label="Smoking" val={smoking} set={setSmoking} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="BP Treatment" val={bpTreatment} set={setBpTreatment} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 5. Pulse Pressure Calculator ────────────────────────────────────────────
export function AdvancedPulsePressureCalculator() {
  const [systolic, setSystolic] = useState(130)
  const [diastolic, setDiastolic] = useState(80)
  const [age, setAge] = useState(55)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(systolic, 60, 260)
    const d = clamp(diastolic, 40, 160)
    const a = clamp(age, 18, 90)

    const pp = s - d
    const map = r1(d + pp / 3)

    // Arterial stiffness index (simplified)
    const stiffnessIndex = r1(pp / (s * 0.01))
    const stiffCategory = pp > 60 ? "High (stiff arteries)" : pp > 50 ? "Mild elevation" : pp >= 30 ? "Normal" : "Low (possible valve issue)"

    // Atherosclerosis probability 
    const atheroProb = r0(Math.min(50, Math.max(2, (pp - 40) * 1.5 + (a - 40) * 0.5)))

    let status: 'good' | 'warning' | 'danger' | 'normal' = pp >= 30 && pp <= 50 ? "good" : pp <= 60 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Pulse Pressure", value: `${pp} mmHg`, status, description: `${stiffCategory}` },
      healthScore: r0(Math.max(0, Math.min(100, 100 - Math.abs(pp - 40) * 2))),
      metrics: [
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status },
        { label: "Arterial Stiffness Index", value: stiffnessIndex, status: stiffnessIndex < 40 ? "good" : stiffnessIndex < 50 ? "warning" : "danger" },
        { label: "Arterial Stiffness Category", value: stiffCategory, status },
        { label: "Atherosclerosis Probability", value: atheroProb, unit: "%", status: atheroProb < 10 ? "good" : atheroProb < 25 ? "warning" : "danger" },
        { label: "MAP", value: map, unit: "mmHg", status: map >= 70 && map <= 100 ? "good" : "warning" },
        { label: "SBP", value: s, unit: "mmHg", status: s < 130 ? "good" : "warning" },
        { label: "DBP", value: d, unit: "mmHg", status: d < 85 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Pulse Pressure Interpretation", description: `PP: ${pp} mmHg. Normal: 30-50 mmHg. Widened PP (>60) is an independent risk factor for coronary heart disease and stroke, especially in adults >55. ${pp > 60 ? "Indicates arterial stiffness or aortic regurgitation. This is a stronger predictor of cardiac events than SBP or DBP alone in elderly patients." : pp < 25 ? "Narrow PP may indicate reduced cardiac output, aortic stenosis, or heart failure. Medical evaluation recommended." : "Normal pulse pressure — good arterial compliance."}`, priority: "high", category: "Assessment" },
        { title: "Vascular Health", description: `Arterial stiffness: ${stiffCategory}. Atherosclerosis probability: ${atheroProb}%. ${atheroProb > 15 ? "Consider: carotid intima-media thickness (CIMT) or coronary artery calcium (CAC) scoring for further evaluation. Omega-3s, exercise, and BP control improve arterial compliance." : "Maintain cardiovascular health through regular exercise and healthy diet."}`, priority: "high", category: "Vascular" },
        { title: "Aging & Arteries", description: `Age-related arterial stiffening increases PP by ~1 mmHg per decade after age 40. ${a > 55 ? "At age " + a + ", monitoring PP trend is important. Progressive widening indicates accelerated vascular aging." : "Monitor PP annually as part of cardiovascular assessment."}`, priority: "medium", category: "Aging" }
      ],
      detailedBreakdown: { "SBP": `${s} mmHg`, "DBP": `${d} mmHg`, "PP": `${pp} mmHg`, "MAP": `${map} mmHg`, "Stiffness": stiffCategory, "Athero Prob": `${atheroProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pulse-pressure-calculator" title="Pulse Pressure Calculator"
      description="Calculate pulse pressure with arterial stiffness index and atherosclerosis probability assessment."
      icon={Activity} calculate={calculate} onClear={() => { setSystolic(130); setDiastolic(80); setAge(55); setResult(null) }}
      values={[systolic, diastolic, age]} result={result}
      seoContent={<SeoContentGenerator title="Pulse Pressure Calculator" description="Calculate pulse pressure and arterial stiffness." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={systolic} set={setSystolic} min={60} max={260} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={diastolic} set={setDiastolic} min={40} max={160} suffix="mmHg" />
        </div>
        <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
      </div>} />
  )
}

// ─── 6. Mean Arterial Pressure (MAP) ─────────────────────────────────────────
export function AdvancedMAPCalculator() {
  const [systolic, setSystolic] = useState(120)
  const [diastolic, setDiastolic] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(systolic, 60, 260)
    const d = clamp(diastolic, 40, 160)

    const map = r1(d + (s - d) / 3)
    const pp = s - d

    // Organ perfusion assessment
    let perfusion = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (map < 60) { perfusion = "⚠️ Critical Hypoperfusion"; status = "danger" }
    else if (map < 70) { perfusion = "Low — Risk of Organ Damage"; status = "warning" }
    else if (map <= 100) { perfusion = "Adequate Perfusion"; status = "good" }
    else if (map <= 110) { perfusion = "Elevated — Monitor"; status = "warning" }
    else { perfusion = "High — End-Organ Damage Risk"; status = "danger" }

    // ICU alert
    const icuAlert = map < 65 || map > 110

    // Cerebral autoregulation range (typically MAP 50-150)
    const cerebralAR = map >= 50 && map <= 150 ? "Within autoregulation range" : "Outside autoregulation — risk of cerebral damage"

    setResult({
      primaryMetric: { label: "MAP", value: `${map} mmHg`, status, description: perfusion },
      healthScore: r0(Math.max(0, Math.min(100, 100 - Math.abs(map - 85) * 3))),
      metrics: [
        { label: "MAP", value: map, unit: "mmHg", status },
        { label: "Organ Perfusion", value: perfusion, status },
        { label: "ICU Alert", value: icuAlert ? "⚠️ Outside safe range" : "Within safe range", status: icuAlert ? "danger" : "good" },
        { label: "Cerebral Autoregulation", value: cerebralAR, status: cerebralAR.includes("Within") ? "good" : "danger" },
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status: pp >= 30 && pp <= 50 ? "good" : "warning" },
        { label: "Systolic", value: s, unit: "mmHg", status: "normal" },
        { label: "Diastolic", value: d, unit: "mmHg", status: "normal" }
      ],
      recommendations: [
        { title: "MAP Interpretation", description: `MAP = ${map} mmHg. Formula: DBP + ⅓(SBP − DBP). ${perfusion}. MAP 70-100 mmHg ensures adequate blood flow to organs (brain, kidneys, heart). ${map < 65 ? "🔴 CRITICAL: MAP <65 mmHg associated with acute kidney injury and ischemic organ damage. Immediate medical intervention needed (fluids, vasopressors)." : map > 110 ? "🔴 Elevated MAP increases risk of hemorrhagic stroke and heart failure. Aggressive BP management recommended." : "🟢 Adequate MAP for normal organ function."}`, priority: "high", category: "Assessment" },
        { title: "Clinical Significance", description: `MAP is more important than individual SBP/DBP for organ perfusion. In critical care: target MAP ≥65 mmHg (Surviving Sepsis Campaign). In chronic hypertension: MAP >105 accelerates nephropathy and retinopathy. MAP is the driving pressure for tissue perfusion.`, priority: "high", category: "Clinical" },
        { title: "Special Populations", description: `In sepsis: target MAP 65-70. In head injury: target MAP 80-90 to maintain cerebral perfusion pressure. In chronic hypertension: autoregulation curve shifts right — higher MAP may be needed temporarily.`, priority: "medium", category: "Critical Care" }
      ],
      detailedBreakdown: { "SBP": `${s} mmHg`, "DBP": `${d} mmHg`, "MAP": `${map} mmHg`, "PP": `${pp} mmHg`, "Perfusion": perfusion }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="mean-arterial-pressure" title="Mean Arterial Pressure (MAP) Calculator"
      description="Calculate MAP with organ perfusion assessment, ICU alert thresholds, and cerebral autoregulation range analysis."
      icon={Activity} calculate={calculate} onClear={() => { setSystolic(120); setDiastolic(80); setResult(null) }}
      values={[systolic, diastolic]} result={result}
      seoContent={<SeoContentGenerator title="Mean Arterial Pressure Calculator" description="Calculate MAP for organ perfusion assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={systolic} set={setSystolic} min={60} max={260} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={diastolic} set={setDiastolic} min={40} max={160} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 7. Heart Age Calculator (Vascular Age Estimator) ────────────────────────
export function AdvancedHeartAgeCalculator() {
  const [age, setAge] = useState(45)
  const [systolic, setSystolic] = useState(130)
  const [totalChol, setTotalChol] = useState(210)
  const [smoking, setSmoking] = useState("no")
  const [bmi, setBmi] = useState(27)
  const [diabetes, setDiabetes] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 80)
    const s = clamp(systolic, 90, 200)
    const tc = clamp(totalChol, 100, 400)
    const b = clamp(bmi, 15, 50)
    const smk = smoking === "yes"
    const dm = diabetes === "yes"

    // Heart age estimation (Framingham-based simplified)
    let heartAge = a
    heartAge += (s - 120) * 0.15      // each mmHg above 120 adds ~0.15 years
    heartAge += (tc - 180) * 0.03     // each mg/dL above 180 adds ~0.03 years
    heartAge += (b - 25) * 0.4        // each BMI point above 25 adds ~0.4 years
    if (smk) heartAge += 8            // smoking adds ~8 years
    if (dm) heartAge += 6             // diabetes adds ~6 years
    heartAge = r0(Math.max(a - 10, Math.min(a + 30, heartAge)))

    const ageDiff = heartAge - a
    const reversalPotential = r0(Math.min(15, Math.max(0, ageDiff * 0.7)))

    let status: 'good' | 'warning' | 'danger' | 'normal' = ageDiff <= 0 ? "good" : ageDiff <= 5 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Heart Age", value: `${heartAge} years`, status, description: `Actual: ${a} | Difference: ${ageDiff > 0 ? "+" : ""}${ageDiff} years` },
      healthScore: r0(Math.max(0, Math.min(100, 100 - ageDiff * 5))),
      metrics: [
        { label: "Heart Age", value: heartAge, unit: "years", status },
        { label: "Actual Age", value: a, unit: "years", status: "normal" },
        { label: "Age Difference", value: `${ageDiff > 0 ? "+" : ""}${ageDiff}`, unit: "years", status },
        { label: "Reversal Potential", value: reversalPotential, unit: "years", status: reversalPotential > 5 ? "warning" : "good" },
        { label: "Systolic BP", value: s, unit: "mmHg", status: s < 130 ? "good" : "warning" },
        { label: "Total Cholesterol", value: tc, unit: "mg/dL", status: tc < 200 ? "good" : "warning" },
        { label: "BMI", value: b, status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Smoking", value: smk ? "Yes (+8 years)" : "No", status: smk ? "danger" : "good" },
        { label: "Diabetes", value: dm ? "Yes (+6 years)" : "No", status: dm ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Heart Age vs Actual Age", description: `Your heart is ${ageDiff > 0 ? ageDiff + " years OLDER" : Math.abs(ageDiff) + " years YOUNGER"} than you. ${ageDiff > 10 ? "🔴 Significant premature aging. Aggressive risk factor management needed." : ageDiff > 5 ? "🟡 Moderate premature aging. Lifestyle changes can reverse this." : ageDiff > 0 ? "🟡 Slightly older than actual. Preventive measures recommended." : "🟢 Excellent — your cardiovascular system is aging well."} Heart age is a powerful risk communication tool — more intuitive than % risk.`, priority: "high", category: "Assessment" },
        { title: "Reversal Potential", description: `Up to ${reversalPotential} years of heart age can be reversed through: ${smk ? "Quitting smoking (−8 years over 5-15 years). " : ""}${s > 130 ? "Lowering BP to <130 (−" + r0((s-120)*0.15) + " years). " : ""}${b > 25 ? "Weight loss to BMI 25 (−" + r0((b-25)*0.4) + " years). " : ""}${tc > 200 ? "Lowering cholesterol (−" + r0((tc-180)*0.03) + " years). " : ""}Regular exercise contributes to all factors simultaneously.`, priority: "high", category: "Reversal" },
        { title: "Monitoring Strategy", description: `Reassess heart age every 6-12 months to track improvement. Target: reduce heart age to match or be below actual age. Each modifiable risk factor controlled subtracts years from heart age. Coronary calcium score provides more precise vascular age assessment.`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Actual Age": a, "Heart Age": heartAge, "Difference": `${ageDiff > 0 ? "+" : ""}${ageDiff} years`, "Reversal": `${reversalPotential} years possible`, "SBP": `${s}`, "TC": `${tc}`, "BMI": b }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="heart-age-calculator" title="Heart Age Calculator"
      description="Estimate your heart's biological age with age difference analysis, reversal potential projection, and risk factor impact breakdown."
      icon={Heart} calculate={calculate} onClear={() => { setAge(45); setSystolic(130); setTotalChol(210); setSmoking("no"); setBmi(27); setDiabetes("no"); setResult(null) }}
      values={[age, systolic, totalChol, smoking, bmi, diabetes]} result={result}
      seoContent={<SeoContentGenerator title="Heart Age Calculator" description="Estimate your biological heart age." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Actual Age" val={age} set={setAge} min={20} max={80} suffix="years" />
          <NumInput label="Systolic BP" val={systolic} set={setSystolic} min={90} max={200} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalChol} set={setTotalChol} min={100} max={400} suffix="mg/dL" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={50} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Smoking" val={smoking} set={setSmoking} options={[{ value: "no", label: "Non-smoker" }, { value: "yes", label: "Current Smoker" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 8. Blood Volume Calculator (Hemodynamic Estimator) ──────────────────────
export function AdvancedBloodVolumeCalculator() {
  const [weight, setWeight] = useState(75)
  const [gender, setGender] = useState("male")
  const [height, setHeight] = useState(175)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 200)
    const h = clamp(height, 100, 230)
    const male = gender === "male"

    // Nadler formula (more accurate)
    const bv = male
      ? r0(0.3669 * Math.pow(h / 100, 3) * 1000 + 32.19 * w + 604)
      : r0(0.3561 * Math.pow(h / 100, 3) * 1000 + 33.08 * w + 183)

    const bvMlKg = r0(bv / w)
    const rbcVol = r0(bv * (male ? 0.45 : 0.40)) // rough hematocrit estimate
    const plasmaVol = bv - rbcVol

    // Fluid overload threshold (~20% above normal)
    const overloadThreshold = r0(bv * 1.2)
    // Dehydration threshold (~10% below)
    const dehydrationThreshold = r0(bv * 0.9)

    // Class-based hemorrhage thresholds
    const class1 = r0(bv * 0.15) // <15%
    const class2 = r0(bv * 0.30) // 15-30%
    const class3 = r0(bv * 0.40) // 30-40%

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Estimated Blood Volume", value: `${(bv / 1000).toFixed(1)} L`, status, description: `${bvMlKg} mL/kg` },
      healthScore: 75,
      metrics: [
        { label: "Total Blood Volume", value: bv, unit: "mL", status: "good" },
        { label: "Blood Volume/kg", value: bvMlKg, unit: "mL/kg", status: "normal" },
        { label: "Est. RBC Volume", value: rbcVol, unit: "mL", status: "normal" },
        { label: "Est. Plasma Volume", value: plasmaVol, unit: "mL", status: "normal" },
        { label: "Fluid Overload Threshold", value: `>${(overloadThreshold / 1000).toFixed(1)} L`, status: "warning" },
        { label: "Dehydration Threshold", value: `<${(dehydrationThreshold / 1000).toFixed(1)} L`, status: "warning" },
        { label: "Class I Hemorrhage", value: `<${class1} mL (<15%)`, status: "normal" },
        { label: "Class II Hemorrhage", value: `${class1}–${class2} mL (15-30%)`, status: "warning" },
        { label: "Class III Hemorrhage", value: `${class2}–${class3} mL (30-40%)`, status: "danger" }
      ],
      recommendations: [
        { title: "Blood Volume Assessment", description: `Estimated ${(bv / 1000).toFixed(1)} L (${bvMlKg} mL/kg) using Nadler formula. ${male ? "Male average: 70 mL/kg." : "Female average: 65 mL/kg."} Athletes may have 10-20% higher blood volume due to plasma volume expansion. Obese individuals have lower mL/kg due to adipose tissue's lower blood supply.`, priority: "high", category: "Assessment" },
        { title: "Surgical & Emergency Use", description: `Hemorrhage classification: Class I (<15%, ${class1}mL) — minimal symptoms. Class II (15-30%, ${class1}-${class2}mL) — tachycardia, anxiety. Class III (30-40%, ${class2}-${class3}mL) — confusion, hypotension, needs transfusion. Class IV (>40%, >${class3}mL) — lethal without immediate intervention.`, priority: "high", category: "Clinical" },
        { title: "Fluid Balance", description: `Overload risk above ${(overloadThreshold / 1000).toFixed(1)} L (edema, pulmonary congestion). Dehydration risk below ${(dehydrationThreshold / 1000).toFixed(1)} L (tachycardia, hypotension). Daily fluid needs: 30-40 mL/kg. In heat/exercise: additional 500-1000 mL/hour. Monitor urine color (pale yellow = adequate).`, priority: "medium", category: "Fluid Balance" }
      ],
      detailedBreakdown: { "Weight": `${w} kg`, "Height": `${h} cm`, "Blood Vol": `${bv} mL`, "mL/kg": bvMlKg, "RBC Vol": `${rbcVol} mL`, "Plasma": `${plasmaVol} mL` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blood-volume-calculator" title="Blood Volume Calculator"
      description="Estimate total blood volume using the Nadler formula with hemorrhage classification, fluid overload risk, and dehydration thresholds."
      icon={AlertCircle} calculate={calculate} onClear={() => { setWeight(75); setGender("male"); setHeight(175); setResult(null) }}
      values={[weight, gender, height]} result={result}
      seoContent={<SeoContentGenerator title="Blood Volume Calculator" description="Estimate your total blood volume." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={100} max={230} suffix="cm" />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 9. Cardiac Output Calculator (Pump Efficiency Model) ────────────────────
export function AdvancedCardiacOutputCalculator() {
  const [strokeVol, setStrokeVol] = useState(70)
  const [heartRate, setHeartRate] = useState(72)
  const [height, setHeight] = useState(175)
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sv = clamp(strokeVol, 20, 200)
    const hr = clamp(heartRate, 40, 200)
    const h = clamp(height, 100, 230)
    const w = clamp(weight, 30, 200)

    const co = r2(sv * hr / 1000) // L/min
    const bsa = r2(0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425)) // DuBois
    const ci = r2(co / bsa) // Cardiac Index

    // Efficiency rating
    let efficiency = "", coStatus: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (co >= 4 && co <= 8) { efficiency = "Normal"; coStatus = "good" }
    else if (co < 4) { efficiency = "Low — Possible Heart Failure"; coStatus = "danger" }
    else { efficiency = "High — Hyperdynamic State"; coStatus = "warning" }

    // CI classification
    let ciClass = ""
    if (ci >= 2.5 && ci <= 4.0) ciClass = "Normal"
    else if (ci < 2.5) ciClass = "Low (cardiogenic shock risk)"
    else ciClass = "High (sepsis, thyrotoxicosis)"

    // Heart failure probability (simplified)
    const hfProb = co < 3.5 ? r0(Math.min(50, (3.5 - co) * 30 + 5)) : r0(2)

    // Exercise CO reserve
    const exerciseCO = r1(co * 3.5) // can increase 3-5x

    setResult({
      primaryMetric: { label: "Cardiac Output", value: `${co} L/min`, status: coStatus, description: `${efficiency} — CI: ${ci} L/min/m²` },
      healthScore: r0(Math.max(0, Math.min(100, 100 - Math.abs(co - 5.5) * 15))),
      metrics: [
        { label: "Cardiac Output", value: co, unit: "L/min", status: coStatus },
        { label: "Cardiac Index", value: ci, unit: "L/min/m²", status: ci >= 2.5 && ci <= 4.0 ? "good" : "danger" },
        { label: "CI Classification", value: ciClass, status: ciClass === "Normal" ? "good" : "danger" },
        { label: "Stroke Volume", value: sv, unit: "mL", status: sv >= 60 && sv <= 100 ? "good" : "warning" },
        { label: "Heart Rate", value: hr, unit: "bpm", status: hr >= 60 && hr <= 100 ? "good" : "warning" },
        { label: "BSA", value: bsa, unit: "m²", status: "normal" },
        { label: "Heart Failure Probability", value: hfProb, unit: "%", status: hfProb < 5 ? "good" : hfProb < 20 ? "warning" : "danger" },
        { label: "Exercise CO Reserve", value: `~${exerciseCO} L/min`, status: "normal" }
      ],
      recommendations: [
        { title: "Cardiac Output Analysis", description: `CO = SV × HR = ${sv} × ${hr} = ${co} L/min. CI = CO/BSA = ${ci} L/min/m². ${efficiency}. Normal rest CO: 4-8 L/min. CI: 2.5-4.0 L/min/m². ${co < 4 ? "🔴 LOW: Consider echocardiography to assess ejection fraction. Low CO may indicate heart failure, cardiomyopathy, or significant valve disease." : co > 8 ? "🟡 HIGH: May indicate sepsis, anemia, thyrotoxicosis, or high-output heart failure. Clinical correlation needed." : "🟢 Normal cardiac pump function."}`, priority: "high", category: "Assessment" },
        { title: "Heart Failure Risk", description: `Probability: ${hfProb}%. ${hfProb > 10 ? "Low cardiac output syndrome (LCOS) warning signs: fatigue, exercise intolerance, orthopnea, peripheral edema. BNP/NT-proBNP testing recommended. Echocardiogram to assess EF%." : "Normal pump function. Exercise capacity maintained."}`, priority: "high", category: "Clinical" },
        { title: "Functional Reserve", description: `Max exercise CO: ~${exerciseCO} L/min (3.5× resting). Elite athletes can reach 6× resting CO. ${ci < 2.5 ? "Reduced functional reserve limits exercise tolerance. Cardiac rehab may be indicated." : "Adequate cardiac reserve for normal activities and moderate exercise."}`, priority: "medium", category: "Exercise" }
      ],
      detailedBreakdown: { "SV": `${sv} mL`, "HR": `${hr} bpm`, "CO": `${co} L/min`, "BSA": `${bsa} m²`, "CI": `${ci} L/min/m²`, "HF Prob": `${hfProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cardiac-output-calculator" title="Cardiac Output Calculator"
      description="Calculate cardiac output and cardiac index with heart failure probability, pump efficiency rating, and exercise reserve estimation."
      icon={Heart} calculate={calculate} onClear={() => { setStrokeVol(70); setHeartRate(72); setHeight(175); setWeight(75); setResult(null) }}
      values={[strokeVol, heartRate, height, weight]} result={result}
      seoContent={<SeoContentGenerator title="Cardiac Output Calculator" description="Calculate cardiac output and pump efficiency." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stroke Volume" val={strokeVol} set={setStrokeVol} min={20} max={200} suffix="mL" />
          <NumInput label="Heart Rate" val={heartRate} set={setHeartRate} min={40} max={200} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={100} max={230} suffix="cm" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 10. Oxygen Saturation Interpreter (SpO₂ Analyzer) ──────────────────────
export function AdvancedOxygenSaturationInterpreter() {
  const [spo2, setSpo2] = useState(97)
  const [altitude, setAltitude] = useState(0)
  const [respiratory, setRespiratory] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sp = clamp(spo2, 50, 100)
    const alt = clamp(altitude, 0, 8000)
    const hasResp = respiratory !== "none"

    // Altitude correction (SpO₂ drops ~3% per 1000m above 1500m)
    const altCorrection = alt > 1500 ? r1((alt - 1500) / 1000 * 3) : 0
    const correctedSp = r1(Math.min(100, sp + altCorrection))

    // Hypoxia classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (correctedSp >= 95) { category = "Normal"; status = "good" }
    else if (correctedSp >= 90) { category = "Mild Hypoxemia"; status = "warning" }
    else if (correctedSp >= 85) { category = "Moderate Hypoxemia"; status = "danger" }
    else { category = "Severe Hypoxemia — Emergency"; status = "danger" }

    // Silent hypoxia alert (COVID-related phenomenon)
    const silentHypoxia = sp < 92 && hasResp ? "⚠️ Silent hypoxia risk — patient may not feel breathless despite low SpO₂. Common in COVID-19 pneumonia." : ""

    // Estimated PaO₂ (rough correlation)
    const estPaO2 = sp >= 90 ? r0(sp * 0.8 + 10) : r0(sp * 0.5 + 20)

    // Oxygen therapy threshold
    const needsO2 = correctedSp < 94 ? "Supplemental oxygen indicated" : "Not currently needed"

    setResult({
      primaryMetric: { label: "SpO₂", value: `${sp}%`, status, description: `${category}${altCorrection > 0 ? ` — Corrected: ${correctedSp}%` : ""}` },
      healthScore: r0(Math.max(0, (correctedSp - 80) * 5)),
      metrics: [
        { label: "Measured SpO₂", value: sp, unit: "%", status },
        { label: "Altitude Correction", value: altCorrection > 0 ? `+${altCorrection}%` : "None", status: altCorrection > 0 ? "warning" : "normal" },
        { label: "Corrected SpO₂", value: correctedSp, unit: "%", status: correctedSp >= 95 ? "good" : correctedSp >= 90 ? "warning" : "danger" },
        { label: "Category", value: category, status },
        { label: "Est. PaO₂", value: estPaO2, unit: "mmHg", status: estPaO2 >= 80 ? "good" : estPaO2 >= 60 ? "warning" : "danger" },
        { label: "O₂ Therapy", value: needsO2, status: needsO2.includes("indicated") ? "danger" : "good" },
        { label: "Altitude", value: alt, unit: "m", status: alt > 2500 ? "warning" : "normal" },
        { label: "Respiratory Condition", value: respiratory === "none" ? "None" : respiratory.replace("-", " "), status: hasResp ? "warning" : "good" }
      ],
      recommendations: [
        { title: "SpO₂ Interpretation", description: `Measured: ${sp}%. ${altCorrection > 0 ? `Altitude-corrected: ${correctedSp}%. At ${alt}m, expected SpO₂ is ~${r0(98 - altCorrection)}%.` : ""} ${category}. ${sp < 90 ? "🔴 CRITICAL: Immediate medical attention. Supplemental oxygen, ABG analysis, and treatment of underlying cause needed." : sp < 94 ? "🟡 Below target. Monitor closely. Consider supplemental oxygen. If persistent, investigate cause (PE, pneumonia, COPD exacerbation)." : "🟢 Normal oxygen saturation. Hemoglobin is adequately saturated."}${silentHypoxia ? `\n\n${silentHypoxia}` : ""}`, priority: "high", category: "Assessment" },
        { title: "Emergency Thresholds", description: `SpO₂ <88%: Emergency supplemental O₂. SpO₂ <85%: Consider ICU admission. SpO₂ <80%: Risk of organ damage within minutes. The oxyhemoglobin dissociation curve is S-shaped — SpO₂ drops rapidly below 90% (steep part of curve). A fall from 95% to 90% represents less PaO₂ change than 90% to 85%.`, priority: "high", category: "Emergency" },
        { title: "Monitoring Guidance", description: `${hasResp ? "With known respiratory condition: target SpO₂ 88-92% for COPD (to avoid oxygen-driven ventilatory depression), 94-98% for most others." : "Healthy individual: SpO₂ should remain ≥95% at sea level."} Measure at rest, on room air, warm fingers. Cold, nail polish, poor perfusion can give falsely low readings.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "SpO₂": `${sp}%`, "Altitude": `${alt}m`, "Correction": `+${altCorrection}%`, "Corrected": `${correctedSp}%`, "Est PaO₂": `${estPaO2} mmHg`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="oxygen-saturation-interpreter" title="Oxygen Saturation Interpreter"
      description="Interpret SpO₂ readings with altitude correction, silent hypoxia detection, PaO₂ estimation, and emergency threshold alerts."
      icon={Wind} calculate={calculate} onClear={() => { setSpo2(97); setAltitude(0); setRespiratory("none"); setResult(null) }}
      values={[spo2, altitude, respiratory]} result={result}
      seoContent={<SeoContentGenerator title="Oxygen Saturation Interpreter" description="Interpret SpO₂ oxygen saturation levels." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="SpO₂ Reading" val={spo2} set={setSpo2} min={50} max={100} suffix="%" />
        <NumInput label="Altitude" val={altitude} set={setAltitude} min={0} max={8000} suffix="meters" />
        <SelectInput label="Respiratory Condition" val={respiratory} set={setRespiratory} options={[{ value: "none", label: "None" }, { value: "copd", label: "COPD" }, { value: "asthma", label: "Asthma" }, { value: "pneumonia", label: "Pneumonia/Infection" }, { value: "other", label: "Other Lung Disease" }]} />
      </div>} />
  )
}

// ─── 11. Respiration Rate Calculator (Ventilation Index) ─────────────────────
export function RespirationRateCalculator() {
  const [breathsPerMin, setBreathsPerMin] = useState(16)
  const [age, setAge] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rr = clamp(breathsPerMin, 4, 60)
    const a = clamp(age, 1, 90)

    // Normal ranges by age
    const normalLow = a < 1 ? 30 : a < 3 ? 24 : a < 6 ? 22 : a < 12 ? 18 : 12
    const normalHigh = a < 1 ? 60 : a < 3 ? 40 : a < 6 ? 34 : a < 12 ? 30 : 20

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (rr < normalLow) { category = "Bradypnea (slow)"; status = "warning" }
    else if (rr <= normalHigh) { category = "Normal"; status = "good" }
    else if (rr <= normalHigh + 8) { category = "Tachypnea (elevated)"; status = "warning" }
    else { category = "Severe Tachypnea"; status = "danger" }

    // Respiratory distress probability
    const distressProb = rr > normalHigh + 10 ? r0(Math.min(60, (rr - normalHigh) * 4)) :
                         rr > normalHigh ? r0(Math.min(30, (rr - normalHigh) * 2)) :
                         rr < normalLow ? r0(15) : r0(2)

    // Minute ventilation estimate (RR × ~500mL tidal volume for adults)
    const minuteVent = a >= 12 ? r1(rr * 0.5) : r1(rr * 0.2) // L/min

    // Sepsis screening (qSOFA: RR ≥ 22 is one criterion)
    const qsofaFlag = rr >= 22 ? "⚠️ RR ≥22 meets one qSOFA criterion for sepsis screening" : ""

    setResult({
      primaryMetric: { label: "Respiration Rate", value: `${rr} breaths/min`, status, description: `${category} — Normal: ${normalLow}-${normalHigh}` },
      healthScore: r0(Math.max(0, Math.min(100, 100 - distressProb * 1.5))),
      metrics: [
        { label: "Respiration Rate", value: rr, unit: "breaths/min", status },
        { label: "Category", value: category, status },
        { label: "Normal Range", value: `${normalLow}–${normalHigh}`, unit: "breaths/min", status: "normal" },
        { label: "Respiratory Distress Prob.", value: distressProb, unit: "%", status: distressProb < 5 ? "good" : distressProb < 20 ? "warning" : "danger" },
        { label: "Est. Minute Ventilation", value: minuteVent, unit: "L/min", status: "normal" },
        { label: "Age", value: a, status: "normal" }
      ],
      recommendations: [
        { title: "Respiratory Assessment", description: `${rr} breaths/min = ${category} for age ${a} (normal: ${normalLow}-${normalHigh}). ${rr > normalHigh ? "Elevated RR is the most sensitive vital sign for clinical deterioration. Causes include: infection, pain, anxiety, metabolic acidosis, PE, pneumonia, heart failure." : rr < normalLow ? "Low RR may indicate CNS depression (opioids, sedatives), hypothyroidism, or severe fatigue." : "Normal respiratory rate. No immediate concerns."}${qsofaFlag ? `\n\n${qsofaFlag}` : ""}`, priority: "high", category: "Assessment" },
        { title: "ER/Triage Relevance", description: `Distress probability: ${distressProb}%. ${distressProb > 20 ? "🔴 High distress probability. Monitor SpO₂, assess work of breathing (accessory muscles, nasal flaring, intercostal retractions). Consider ABG. RR is the single best predictor of cardiac arrest in hospitalized patients." : "Stable respiratory status."}`, priority: "high", category: "Emergency" },
        { title: "Monitoring Tips", description: `Count breaths for full 60 seconds for accuracy. Normal adults at rest: 12-20/min. During sleep: 10-16. During exercise: up to 40-60. Persistent tachypnea (>20) at rest warrants medical evaluation. RR is often called the "neglected vital sign."`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "RR": `${rr}/min`, "Normal": `${normalLow}-${normalHigh}/min`, "Category": category, "Distress Prob": `${distressProb}%`, "Minute Vent": `${minuteVent} L/min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="respiration-rate-calculator" title="Respiration Rate Calculator"
      description="Assess respiratory rate with age-adjusted normal ranges, respiratory distress probability, minute ventilation estimation, and sepsis screening (qSOFA)."
      icon={Wind} calculate={calculate} onClear={() => { setBreathsPerMin(16); setAge(35); setResult(null) }}
      values={[breathsPerMin, age]} result={result}
      seoContent={<SeoContentGenerator title="Respiration Rate Calculator" description="Track and interpret breathing rate." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Breaths per Minute" val={breathsPerMin} set={setBreathsPerMin} min={4} max={60} suffix="breaths/min" />
        <NumInput label="Age" val={age} set={setAge} min={1} max={90} suffix="years" />
      </div>} />
  )
}

// ─── 12. HRV Score Calculator (Autonomic Nervous System Intelligence) ────────
export function HRVScoreCalculator() {
  const [rmssd, setRmssd] = useState(35)
  const [sdnn, setSdnn] = useState(50)
  const [age, setAge] = useState(35)
  const [sleepHours, setSleepHours] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rm = clamp(rmssd, 5, 200)
    const sd = clamp(sdnn, 10, 300)
    const a = clamp(age, 18, 80)
    const sleep = clamp(sleepHours, 3, 12)

    // HRV score (0-100, age-adjusted)
    const ageAdj = Math.max(0, (50 - a) * 0.3) // younger = higher baseline
    const rmssdScore = Math.min(50, rm / 2 + ageAdj)
    const sdnnScore = Math.min(50, sd / 4 + ageAdj)
    const hrvScore = r0(Math.min(100, rmssdScore + sdnnScore))

    // Percentile (age-adjusted, simplified)
    const percentile = r0(Math.min(99, Math.max(1, hrvScore * 1.1 - a * 0.3)))

    // Parasympathetic dominance index
    const parasympathetic = r0(Math.min(100, rm * 1.5))

    // Overtraining probability
    const overtrainingProb = rm < 20 && sleep < 6 ? r0(45) :
                              rm < 25 ? r0(25) :
                              rm < 30 && sleep < 7 ? r0(15) : r0(3)

    // Illness detection
    const illnessFlag = rm < 20 ? "⚠️ Low RMSSD may indicate illness onset, acute stress, or autonomic dysfunction." : ""

    // Recovery readiness
    let readiness = "", readinessStatus: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (hrvScore >= 70) { readiness = "Excellent — Ready for High Intensity"; readinessStatus = "good" }
    else if (hrvScore >= 50) { readiness = "Good — Moderate Training OK"; readinessStatus = "good" }
    else if (hrvScore >= 30) { readiness = "Fair — Light Training Only"; readinessStatus = "warning" }
    else { readiness = "Poor — Rest Day Recommended"; readinessStatus = "danger" }

    setResult({
      primaryMetric: { label: "HRV Score", value: `${hrvScore}/100`, status: readinessStatus, description: `${readiness}` },
      healthScore: hrvScore,
      metrics: [
        { label: "HRV Score", value: hrvScore, unit: "/100", status: readinessStatus },
        { label: "RMSSD", value: rm, unit: "ms", status: rm >= 40 ? "good" : rm >= 25 ? "normal" : "warning" },
        { label: "SDNN", value: sd, unit: "ms", status: sd >= 50 ? "good" : sd >= 30 ? "normal" : "warning" },
        { label: "Percentile", value: `${percentile}th`, status: percentile >= 60 ? "good" : percentile >= 30 ? "normal" : "warning" },
        { label: "Parasympathetic Index", value: parasympathetic, unit: "/100", status: parasympathetic >= 60 ? "good" : parasympathetic >= 40 ? "normal" : "warning" },
        { label: "Recovery Readiness", value: readiness, status: readinessStatus },
        { label: "Overtraining Probability", value: overtrainingProb, unit: "%", status: overtrainingProb < 10 ? "good" : overtrainingProb < 25 ? "warning" : "danger" },
        { label: "Sleep Hours", value: sleep, unit: "hrs", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "HRV Assessment", description: `Score: ${hrvScore}/100 (${percentile}th percentile for age ${a}). RMSSD ${rm}ms reflects parasympathetic (vagal) activity. SDNN ${sd}ms reflects overall autonomic variability. ${hrvScore >= 70 ? "Excellent autonomic balance. Recovery is complete. Safe for high-intensity training." : hrvScore >= 50 ? "Good recovery. Moderate training appropriate." : hrvScore >= 30 ? "Suboptimal recovery. Reduce training intensity today." : "⚠️ Poor recovery. Rest day strongly recommended. Investigate: sleep quality, stress, illness, alcohol."}${illnessFlag ? `\n\n${illnessFlag}` : ""}`, priority: "high", category: "Assessment" },
        { title: "Autonomic Balance", description: `Parasympathetic index: ${parasympathetic}/100. ${parasympathetic >= 60 ? "Strong vagal tone — associated with longevity, stress resilience, and cardiovascular health." : parasympathetic >= 40 ? "Moderate vagal tone. Improve with: deep breathing (5-min daily), cold exposure, aerobic fitness." : "Low vagal tone. Chronic sympathetic dominance increases inflammation, cortisol, and CVD risk. Prioritize sleep, stress management, and aerobic base building."}`, priority: "high", category: "Autonomic" },
        { title: "Trend Intelligence", description: `Track HRV daily upon waking. A 15-20% decline from baseline (over 3+ days) indicates: overtraining, illness onset, or accumulated stress. Sleep quality is the #1 modifiable factor for HRV. ${sleep < 7 ? "Your " + sleep + " hours is below optimal (7-9). Each additional hour of quality sleep can raise HRV 5-15%." : "Good sleep duration — maintain consistency."}`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "RMSSD": `${rm} ms`, "SDNN": `${sd} ms`, "HRV Score": `${hrvScore}/100`, "Percentile": `${percentile}th`, "Parasympathetic": `${parasympathetic}/100`, "Overtraining": `${overtrainingProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hrv-score-calculator" title="HRV Score Calculator"
      description="Calculate Heart Rate Variability score with recovery readiness, parasympathetic dominance index, overtraining probability, and illness detection."
      icon={Heart} calculate={calculate} onClear={() => { setRmssd(35); setSdnn(50); setAge(35); setSleepHours(7); setResult(null) }}
      values={[rmssd, sdnn, age, sleepHours]} result={result}
      seoContent={<SeoContentGenerator title="HRV Score Calculator" description="Track heart rate variability for recovery and stress." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="RMSSD" val={rmssd} set={setRmssd} min={5} max={200} suffix="ms" />
          <NumInput label="SDNN" val={sdnn} set={setSdnn} min={10} max={300} suffix="ms" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={80} suffix="years" />
          <NumInput label="Sleep Last Night" val={sleepHours} set={setSleepHours} min={3} max={12} step={0.5} suffix="hours" />
        </div>
      </div>} />
  )
}

// ─── 13. Ankle-Brachial Index (ABI) Calculator ──────────────────────────────
export function AdvancedAnkleBrachialIndexCalculator() {
  const [ankleSBP, setAnkleSBP] = useState(120)
  const [brachialSBP, setBrachialSBP] = useState(130)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ankle = clamp(ankleSBP, 40, 300)
    const brachial = clamp(brachialSBP, 60, 260)

    const abi = r2(ankle / brachial)

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (abi > 1.4) { category = "Calcification (non-compressible)"; status = "warning" }
    else if (abi >= 1.0) { category = "Normal"; status = "good" }
    else if (abi >= 0.9) { category = "Borderline PAD"; status = "warning" }
    else if (abi >= 0.7) { category = "Mild-Moderate PAD"; status = "warning" }
    else if (abi >= 0.5) { category = "Moderate-Severe PAD"; status = "danger" }
    else { category = "Severe PAD — Critical Limb Ischemia"; status = "danger" }

    // Cardiovascular event probability (simplified 5-year)
    const cvEventProb = abi < 0.5 ? r0(35) : abi < 0.7 ? r0(22) : abi < 0.9 ? r0(14) : abi <= 1.4 ? r0(5) : r0(12)

    // Claudication distance estimate (less ABI → shorter walking distance)
    const claudDistance = abi >= 1.0 ? "Unlimited" : abi >= 0.7 ? "~200-500m before pain" : abi >= 0.5 ? "~100-200m before pain" : "<100m or rest pain"

    setResult({
      primaryMetric: { label: "ABI", value: abi, status, description: category },
      healthScore: r0(Math.max(0, Math.min(100, abi >= 1.0 && abi <= 1.4 ? 90 : abi * 80))),
      metrics: [
        { label: "ABI Value", value: abi, status },
        { label: "Category", value: category, status },
        { label: "Ankle SBP", value: ankle, unit: "mmHg", status: "normal" },
        { label: "Brachial SBP", value: brachial, unit: "mmHg", status: "normal" },
        { label: "5-Year CV Event Risk", value: cvEventProb, unit: "%", status: cvEventProb < 10 ? "good" : cvEventProb < 20 ? "warning" : "danger" },
        { label: "Claudication Distance", value: claudDistance, status: claudDistance === "Unlimited" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "ABI Interpretation", description: `ABI = ${abi}. ${category}. ${abi > 1.4 ? "Non-compressible arteries (medial calcification, common in diabetes and CKD). Toe-brachial index (TBI) may be more accurate." : abi >= 1.0 ? "Normal peripheral circulation. PPV for absence of PAD is >95%." : abi >= 0.9 ? "Borderline — risk factor modification needed. Repeat in 6-12 months or after exercise challenge." : "🔴 PAD confirmed. Vascular specialist referral recommended. Associated with 2-6× higher cardiovascular mortality rate."}`, priority: "high", category: "Assessment" },
        { title: "Cardiovascular Risk", description: `5-year CV event probability: ${cvEventProb}%. ${abi < 0.9 ? "PAD is a coronary heart disease equivalent. Patients should receive: antiplatelet therapy, statin, BP control, smoking cessation, supervised exercise therapy (3× /week walking program increases claudication distance by 100-200%)." : "Normal ABI. Standard cardiovascular risk factor management."}`, priority: "high", category: "CV Risk" },
        { title: "Vascular Monitoring", description: `${abi < 0.9 ? "Annual ABI monitoring recommended. Decline of >0.15 indicates disease progression. Consider duplex ultrasound or CT angiography for surgical planning if symptoms worsen. Critical limb ischemia (ABI <0.4, rest pain, gangrene) requires urgent vascular surgery evaluation." : "Recheck ABI in 5 years, or sooner if symptoms develop (leg pain with walking, non-healing wounds)."}`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Ankle SBP": `${ankle} mmHg`, "Brachial SBP": `${brachial} mmHg`, "ABI": abi, "Category": category, "CV Risk 5yr": `${cvEventProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ankle-brachial-index" title="Ankle-Brachial Index (ABI) Calculator"
      description="Calculate ABI for peripheral artery disease screening with cardiovascular event probability, claudication distance estimation, and PAD staging."
      icon={Shield} calculate={calculate} onClear={() => { setAnkleSBP(120); setBrachialSBP(130); setResult(null) }}
      values={[ankleSBP, brachialSBP]} result={result}
      seoContent={<SeoContentGenerator title="Ankle-Brachial Index Calculator" description="Screen for peripheral artery disease with ABI." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Ankle Systolic Pressure" val={ankleSBP} set={setAnkleSBP} min={40} max={300} suffix="mmHg" />
        <NumInput label="Brachial Systolic Pressure" val={brachialSBP} set={setBrachialSBP} min={60} max={260} suffix="mmHg" />
      </div>} />
  )
}
