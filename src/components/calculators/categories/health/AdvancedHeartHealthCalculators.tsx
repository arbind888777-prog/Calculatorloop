"use client"

import { useState } from "react"
import { Heart, Activity, TrendingUp, AlertCircle, Droplets, Wind } from "lucide-react"
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

// ─── 1. Blood Pressure Calculator ────────────────────────────────────────────
export function BloodPressureCalculator() {
  const [systolic, setSystolic] = useState(120)
  const [diastolic, setDiastolic] = useState(80)
  const [age, setAge] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(systolic, 60, 250)
    const d = clamp(diastolic, 40, 150)
    const a = clamp(age, 10, 90)

    const map = r1(d + (s - d) / 3)
    const pp = s - d

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal", desc = ""
    if (s < 90 || d < 60) { category = "Low (Hypotension)"; status = "warning"; desc = "Below normal. May cause dizziness. Consult a doctor if symptomatic." }
    else if (s < 120 && d < 80) { category = "Normal"; status = "good"; desc = "Optimal blood pressure. Maintain a healthy lifestyle." }
    else if (s < 130 && d < 80) { category = "Elevated"; status = "warning"; desc = "Above optimal. Lifestyle changes recommended." }
    else if ((s >= 130 && s <= 139) || (d >= 80 && d <= 89)) { category = "High BP – Stage 1"; status = "warning"; desc = "High blood pressure. Lifestyle changes and possible medication needed." }
    else if (s >= 140 || d >= 90) { category = "High BP – Stage 2"; status = "danger"; desc = "High blood pressure requiring medical treatment." }
    if (s > 180 || d > 120) { category = "Hypertensive Crisis"; status = "danger"; desc = "Seek emergency care immediately." }

    setResult({
      primaryMetric: { label: `${s}/${d} mmHg`, value: category, status, description: desc },
      metrics: [
        { label: "Systolic", value: s, unit: "mmHg", status: s < 120 ? "good" : s < 130 ? "warning" : "danger" },
        { label: "Diastolic", value: d, unit: "mmHg", status: d < 80 ? "good" : d < 90 ? "warning" : "danger" },
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status: pp >= 30 && pp <= 60 ? "good" : "warning" },
        { label: "Mean Arterial Pressure (MAP)", value: map, unit: "mmHg", status: map >= 70 && map <= 100 ? "good" : "warning" },
        { label: "Category", value: category, status }
      ],
      recommendations: [
        { title: "BP Targets", description: "Normal: <120/80 | Elevated: 120-129/<80 | Stage 1: 130-139/80-89 | Stage 2: ≥140/≥90 | Crisis: >180/>120. Your reading: " + s + "/" + d + " = " + category, priority: "high", category: "Guidelines" },
        { title: "Lifestyle Interventions", description: "Each of these alone can reduce systolic BP 4-11 mmHg: DASH diet, regular aerobic exercise (30 min/day), weight loss, sodium reduction (<2300 mg/day), limiting alcohol, quitting smoking.", priority: "high", category: "Lifestyle" },
        { title: "When to See a Doctor", description: "If your BP is consistently ≥130/80 or you experience headaches, dizziness, or chest pain, see a healthcare provider. Stage 2 hypertension requires medication.", priority: status === "danger" ? "high" : "medium", category: "Medical" }
      ],
      detailedBreakdown: { "Systolic": `${s} mmHg`, "Diastolic": `${d} mmHg`, "MAP": `${map} mmHg`, "Pulse Pressure": `${pp} mmHg`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blood-pressure-calculator" title="Blood Pressure Calculator"
      description="Interpret your blood pressure reading with AHA/ACC 2017 guidelines. Calculates MAP, pulse pressure, and hypertension stage."
      icon={Heart} calculate={calculate} onClear={() => { setSystolic(120); setDiastolic(80); setAge(35); setResult(null) }}
      values={[systolic, diastolic, age]} result={result}
      seoContent={<SeoContentGenerator title="Blood Pressure Calculator" description="Interpret blood pressure readings." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic (top number)" val={systolic} set={setSystolic} min={60} max={250} suffix="mmHg" />
          <NumInput label="Diastolic (bottom number)" val={diastolic} set={setDiastolic} min={40} max={150} suffix="mmHg" />
        </div>
        <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
      </div>} />
  )
}

// ─── 2. Resting Heart Rate ─────────────────────────────────────────────────────
export function RestingHeartRateCalculator() {
  const [rhr, setRhr] = useState(65)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const r = clamp(rhr, 30, 150)
    const a = clamp(age, 10, 90)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (r < 50) { category = gender === "male" ? "Athlete" : "Well Trained"; status = "good" }
    else if (r < 60) { category = "Excellent"; status = "good" }
    else if (r < 70) { category = "Good"; status = "good" }
    else if (r < 80) { category = "Average"; status = "normal" }
    else if (r < 90) { category = "Below Average"; status = "warning" }
    else { category = "Poor"; status = "danger" }

    const mhr = 208 - 0.7 * a
    const hrr = mhr - r
    const maxLoad = r0(mhr)
    const zone2Low = r0(hrr * 0.6 + r)
    const zone2High = r0(hrr * 0.7 + r)

    setResult({
      primaryMetric: { label: "Resting Heart Rate", value: r, unit: "bpm", status, description: `${category} cardiovascular fitness` },
      healthScore: Math.min(100, r0(120 - r)),
      metrics: [
        { label: "RHR", value: r, unit: "bpm", status },
        { label: "Fitness Category", value: category, status },
        { label: "Heart Rate Reserve (HRR)", value: hrr, unit: "bpm", status: "normal" },
        { label: "Max Heart Rate (Tanaka)", value: maxLoad, unit: "bpm", status: "normal" },
        { label: "Zone 2 Training Range", value: `${zone2Low}–${zone2High}`, unit: "bpm", status: "good" }
      ],
      recommendations: [
        { title: "Interpreting Your RHR", description: `Athletes typically have RHR 40-60 bpm. A lower RHR indicates better cardiovascular efficiency. Your ${r} bpm is "${category}". Each beat reduction corresponds to ~heart pumping 70ml more per beat.`, priority: "high", category: "Fitness" },
        { title: "Lower Your RHR", description: "Regular aerobic exercise (especially Zone 2 training) reduces RHR by 1 bpm per week initially. After 6-12 months of consistent cardio, improvements of 10-15 bpm are common.", priority: "medium", category: "Improvement" },
        { title: "When RHR Spikes", description: "An acute elevation of 5-7 bpm above baseline may indicate illness, overtraining, dehydration, or high stress. Use daily RHR tracking to spot these patterns early.", priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "RHR": `${r} bpm`, "Category": category, "MHR": `${maxLoad} bpm`, "HRR": `${hrr} bpm`, "Zone 2": `${zone2Low}–${zone2High} bpm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="resting-heart-rate" title="Resting Heart Rate Calculator"
      description="Assess your cardiovascular fitness level from your resting heart rate. Includes training zone calculations and improvement tips."
      icon={Heart} calculate={calculate} onClear={() => { setRhr(65); setAge(30); setGender("male"); setResult(null) }}
      values={[rhr, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Resting Heart Rate Calculator" description="Calculate your RHR and fitness level." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Resting Heart Rate" val={rhr} set={setRhr} min={30} max={150} suffix="bpm" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ─── 3. Pulse Pressure Calculator ────────────────────────────────────────────
export function PulsePressureCalculator() {
  const [systolic, setSystolic] = useState(120)
  const [diastolic, setDiastolic] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(systolic, 60, 250)
    const d = clamp(diastolic, 40, 150)
    const pp = s - d
    const map = r1(d + pp / 3)
    let status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    let category = ""
    if (pp < 25) { category = "Narrow pulse pressure"; status = "warning" }
    else if (pp <= 60) { category = "Normal"; status = "good" }
    else { category = "Wide pulse pressure"; status = "warning" }

    setResult({
      primaryMetric: { label: "Pulse Pressure", value: pp, unit: "mmHg", status, description: `${category} — Normal range: 30-60 mmHg` },
      metrics: [
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status },
        { label: "Category", value: category, status },
        { label: "Mean Arterial Pressure", value: map, unit: "mmHg", status: map >= 60 && map <= 100 ? "good" : "warning" },
        { label: "Systolic", value: s, unit: "mmHg", status: "normal" },
        { label: "Diastolic", value: d, unit: "mmHg", status: "normal" }
      ],
      recommendations: [
        { title: "Pulse Pressure Significance", description: "Normal PP is 30-60 mmHg. A wide PP (>60) may indicate arterial stiffness, aortic regurgitation, or hyperthyroidism. A narrow PP (<25) may indicate low cardiac output, aortic stenosis, or severe dehydration.", priority: "high", category: "Clinical" },
        { title: "Cardiovascular Health", description: "An elevated pulse pressure is an independent risk factor for cardiovascular disease, particularly in adults over 50. Regular BP monitoring is important.", priority: "medium", category: "Risk" }
      ],
      detailedBreakdown: { "Systolic": `${s} mmHg`, "Diastolic": `${d} mmHg`, "Pulse Pressure": `${pp} mmHg`, "MAP": `${map} mmHg`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pulse-pressure-calculator" title="Pulse Pressure Calculator"
      description="Calculate pulse pressure and mean arterial pressure from systolic and diastolic blood pressure readings."
      icon={Activity} calculate={calculate} onClear={() => { setSystolic(120); setDiastolic(80); setResult(null) }}
      values={[systolic, diastolic]} result={result}
      seoContent={<SeoContentGenerator title="Pulse Pressure Calculator" description="Calculate pulse pressure from BP." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic" val={systolic} set={setSystolic} min={60} max={250} suffix="mmHg" />
          <NumInput label="Diastolic" val={diastolic} set={setDiastolic} min={40} max={150} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 4. Mean Arterial Pressure Calculator ─────────────────────────────────────
export function MeanArterialPressureCalculator() {
  const [systolic, setSystolic] = useState(120)
  const [diastolic, setDiastolic] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(systolic, 60, 250)
    const d = clamp(diastolic, 40, 150)
    const map = r1(d + (s - d) / 3)
    const pp = s - d
    let status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    let category = ""
    if (map < 60) { category = "Critically Low"; status = "danger" }
    else if (map < 70) { category = "Low"; status = "warning" }
    else if (map <= 100) { category = "Normal"; status = "good" }
    else if (map <= 110) { category = "High"; status = "warning" }
    else { category = "Severely High"; status = "danger" }

    setResult({
      primaryMetric: { label: "Mean Arterial Pressure", value: map, unit: "mmHg", status, description: `${category} — Normal range: 70-100 mmHg` },
      metrics: [
        { label: "MAP", value: map, unit: "mmHg", status },
        { label: "Category", value: category, status },
        { label: "Perfusion Pressure", value: pp, unit: "mmHg", status: "normal" },
        { label: "Systolic", value: s, unit: "mmHg", status: "normal" },
        { label: "Diastolic", value: d, unit: "mmHg", status: "normal" }
      ],
      recommendations: [
        { title: "Why MAP Matters", description: `MAP of ${map} mmHg (${category}). A MAP below 60 mmHg means vital organs may not receive adequate blood flow. Critical care patients require MAP ≥65 mmHg. Normal range is 70-100 mmHg.`, priority: "high", category: "Clinical" },
        { title: "Improving MAP", description: "For low MAP: increase fluid intake, salt intake, lie down. For high MAP: reduce sodium, exercise regularly, medications if prescribed. Always consult a doctor for persistent abnormalities.", priority: "medium", category: "Management" }
      ],
      detailedBreakdown: { "Formula": "MAP = DBP + (SBP - DBP) / 3", "MAP": `${map} mmHg`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="mean-arterial-pressure" title="Mean Arterial Pressure (MAP) Calculator"
      description="Calculate Mean Arterial Pressure from systolic and diastolic BP. Clinically important indicator of organ perfusion."
      icon={Activity} calculate={calculate} onClear={() => { setSystolic(120); setDiastolic(80); setResult(null) }}
      values={[systolic, diastolic]} result={result}
      seoContent={<SeoContentGenerator title="Mean Arterial Pressure (MAP)" description="Calculate mean arterial pressure from BP." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic" val={systolic} set={setSystolic} min={60} max={250} suffix="mmHg" />
          <NumInput label="Diastolic" val={diastolic} set={setDiastolic} min={40} max={150} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 5. Cardiac Output Calculator ────────────────────────────────────────────
export function CardiacOutputCalculator() {
  const [hr, setHr] = useState(70)
  const [sv, setSv] = useState(70)
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(hr, 30, 220)
    const s = clamp(sv, 20, 200)
    const w = clamp(weight, 30, 300)
    const ht = clamp(height, 100, 250)

    const co = r2(h * s / 1000)                               // L/min
    const bsa = Math.sqrt((ht * w) / 3600)
    const ci = r2(co / bsa)                                   // cardiac index

    let coStatus: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (co < 4) coStatus = "warning"
    else if (co <= 8) coStatus = "good"
    else coStatus = "warning"

    let ciStatus: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (ci < 2.5) ciStatus = "warning"
    else if (ci <= 4.0) ciStatus = "good"
    else ciStatus = "normal"

    setResult({
      primaryMetric: { label: "Cardiac Output", value: co, unit: "L/min", status: coStatus, description: `${h} bpm × ${s} mL/beat stroke volume` },
      metrics: [
        { label: "Cardiac Output (CO)", value: co, unit: "L/min", status: coStatus },
        { label: "Cardiac Index (CI)", value: ci, unit: "L/min/m²", status: ciStatus },
        { label: "Heart Rate", value: h, unit: "bpm", status: "normal" },
        { label: "Stroke Volume", value: s, unit: "mL/beat", status: "normal" },
        { label: "BSA", value: r2(bsa), unit: "m²", status: "normal" },
        { label: "Oxygen Delivery (est.)", value: r0(co * 200), unit: "mL O₂/min", status: "normal" }
      ],
      recommendations: [
        { title: "Normal Values", description: `Normal CO: 4-8 L/min. Your CO = ${co} L/min (${co >= 4 && co <= 8 ? "Normal" : "Outside normal range"}). Normal CI: 2.5-4.0 L/min/m². Your CI = ${ci} L/min/m² (${ci >= 2.5 && ci <= 4.0 ? "Normal" : "Outside normal range"}).`, priority: "high", category: "Clinical" },
        { title: "Cardiac Reserve", description: `During exercise, CO can increase to 20-40 L/min in trained athletes. Increasing stroke volume through endurance training is the most efficient way to improve cardiac function.`, priority: "medium", category: "Physiology" }
      ],
      detailedBreakdown: { "HR × SV": `${h} × ${s}`, "Cardiac Output": `${co} L/min`, "Cardiac Index": `${ci} L/min/m²`, "BSA": `${r2(bsa)} m²` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cardiac-output-calculator" title="Cardiac Output Calculator"
      description="Estimate cardiac output and cardiac index from heart rate and stroke volume. Includes oxygen delivery estimation."
      icon={Heart} calculate={calculate} onClear={() => { setHr(70); setSv(70); setWeight(70); setHeight(170); setResult(null) }}
      values={[hr, sv, weight, height]} result={result}
      seoContent={<SeoContentGenerator title="Cardiac Output Calculator" description="Estimate cardiac output from stroke volume and heart rate." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Heart Rate" val={hr} set={setHr} min={30} max={220} suffix="bpm" />
          <NumInput label="Stroke Volume" val={sv} set={setSv} min={20} max={200} suffix="mL/beat" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
        </div>
      </div>} />
  )
}

// ─── 6. Heart Age Calculator ──────────────────────────────────────────────────
export function HeartAgeCalculator() {
  const [age, setAge] = useState(40)
  const [gender, setGender] = useState("male")
  const [systolic, setSystolic] = useState(120)
  const [smoker, setSmoker] = useState("no")
  const [diabetic, setDiabetic] = useState("no")
  const [bmi, setBmi] = useState(25)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 80)
    let riskPoints = 0
    if (systolic >= 130 && systolic < 140) riskPoints += 1
    if (systolic >= 140 && systolic < 160) riskPoints += 2
    if (systolic >= 160) riskPoints += 4
    if (smoker === "yes") riskPoints += 4
    if (diabetic === "yes") riskPoints += 3
    if (bmi >= 25 && bmi < 30) riskPoints += 1
    if (bmi >= 30) riskPoints += 2

    const heartAge = a + riskPoints * 2
    const diff = heartAge - a

    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    let message = ""
    if (diff <= 0) { status = "good"; message = "Your heart appears younger than your actual age." }
    else if (diff <= 5) { status = "normal"; message = "Your heart age is slightly above your actual age." }
    else if (diff <= 10) { status = "warning"; message = "Your heart age is moderately above your actual age. Consider lifestyle changes." }
    else { status = "danger"; message = "Your heart age is significantly above your actual age. Consult a doctor." }

    setResult({
      primaryMetric: { label: "Estimated Heart Age", value: heartAge, unit: "years", status, description: message },
      metrics: [
        { label: "Actual Age", value: a, unit: "years", status: "normal" },
        { label: "Estimated Heart Age", value: heartAge, unit: "years", status },
        { label: "Heart Age Gap", value: diff > 0 ? `+${diff}` : diff, unit: "years", status: diff > 0 ? (diff > 5 ? "danger" : "warning") : "good" },
        { label: "Risk Points", value: riskPoints, status: riskPoints > 5 ? "danger" : riskPoints > 2 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Reducing Heart Age", description: `You can reduce your heart age by: Quitting smoking (-8 years), controlling blood pressure (-2-4 years), managing diabetes (-6 years), reducing BMI (-2-4 years). Each healthy change reduces your cardiovascular risk.`, priority: "high", category: "Prevention" },
        { title: "Heart Age vs Real Age", description: `Heart age of ${heartAge} vs actual age of ${a}. ${diff > 0 ? `Reducing the ${diff}-year gap significantly lowers your risk of heart attack and stroke.` : "Your heart is healthy — maintain current habits!"}`, priority: "medium", category: "Risk Assessment" }
      ],
      detailedBreakdown: { "Actual Age": a, "Heart Age": heartAge, "Smoking": smoker === "yes" ? "Yes (+4 pts)" : "No", "Diabetic": diabetic === "yes" ? "Yes (+3 pts)" : "No", "BMI": bmi, "Systolic BP": systolic }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="heart-age-calculator" title="Heart Age Calculator"
      description="Estimate your heart age based on key cardiovascular risk factors. Find how to reduce your heart age and risk."
      icon={Heart} calculate={calculate} onClear={() => { setAge(40); setSystolic(120); setSmoker("no"); setDiabetic("no"); setBmi(25); setResult(null) }}
      values={[age, gender, systolic, smoker, diabetic, bmi]} result={result}
      seoContent={<SeoContentGenerator title="Heart Age Calculator" description="Estimate heart age using basic risk factors." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={80} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Systolic BP" val={systolic} set={setSystolic} min={80} max={220} suffix="mmHg" />
        <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={60} step={0.1} />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Smoker?" val={smoker} set={setSmoker} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Diabetic?" val={diabetic} set={setDiabetic} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 7. Blood Volume Calculator ───────────────────────────────────────────────
export function BloodVolumeCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 300)
    const h = clamp(height, 100, 250)
    const male = gender === "male"

    // Nadler's formula
    const bsaNadler = 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425)
    const bvNadler = male
      ? (0.3669 * Math.pow(h / 100, 3) + 0.03219 * w + 0.6041) * 1000
      : (0.3561 * Math.pow(h / 100, 3) + 0.03308 * w + 0.1833) * 1000
    const bvSimple = male ? w * 70 : w * 65

    setResult({
      primaryMetric: { label: "Blood Volume (Nadler)", value: r0(bvNadler), unit: "mL", status: "good", description: `≈ ${(bvNadler / 1000).toFixed(2)} L of blood in your body` },
      metrics: [
        { label: "Blood Volume (Nadler)", value: r0(bvNadler), unit: "mL", status: "good" },
        { label: "Blood Volume (Simple est.)", value: r0(bvSimple), unit: "mL", status: "normal" },
        { label: "Plasma Volume (est.)", value: r0(bvNadler * 0.55), unit: "mL", status: "normal" },
        { label: "Red Cell Volume (est.)", value: r0(bvNadler * 0.45), unit: "mL", status: "normal" },
        { label: "Average Hematocrit", value: male ? "42-54%" : "37-47%", status: "normal" },
        { label: "Approximate Donations", value: r1(bvNadler / 450), unit: "units whole blood", status: "normal" }
      ],
      recommendations: [
        { title: "Blood Volume Facts", description: `Adults have approximately ${(bvNadler / 1000).toFixed(1)} L of blood. Blood volume represents about ${r1(bvNadler / (w * 1000) * 100)}% of your body weight. Losing just 10-15% can cause symptoms of shock.`, priority: "high", category: "Physiology" },
        { title: "Exercise & Blood Volume", description: "Endurance training increases blood volume by 10-15% in 4-8 weeks, improving oxygen delivery and cardiac output. This is one of the primary physiological adaptations to aerobic exercise.", priority: "medium", category: "Exercise Science" }
      ],
      detailedBreakdown: { "Gender": gender, "Weight": `${w} kg`, "Height": `${h} cm`, "Blood Volume": `${r0(bvNadler)} mL (${(bvNadler / 1000).toFixed(2)} L)` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="blood-volume-calculator" title="Blood Volume Calculator"
      description="Estimate total blood volume using Nadler's formula based on gender, height, and weight. Includes plasma and red cell estimates."
      icon={Droplets} calculate={calculate} onClear={() => { setWeight(70); setHeight(170); setGender("male"); setResult(null) }}
      values={[weight, height, gender]} result={result}
      seoContent={<SeoContentGenerator title="Blood Volume Calculator" description="Estimate blood volume based on body metrics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
        </div>
      </div>} />
  )
}

// ─── 8. Oxygen Saturation Interpreter ─────────────────────────────────────────
export function OxygenSaturationInterpreter() {
  const [spo2, setSpo2] = useState(98)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(spo2, 50, 100)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal", action = ""
    if (s >= 95) { category = "Normal"; status = "good"; action = "Normal range. No action required." }
    else if (s >= 90) { category = "Mild Hypoxemia"; status = "warning"; action = "Below normal. Consult a doctor if persistent. May need supplemental oxygen." }
    else if (s >= 85) { category = "Moderate Hypoxemia"; status = "danger"; action = "Seek medical attention promptly. Likely needs supplemental oxygen." }
    else { category = "Severe Hypoxemia"; status = "danger"; action = "Emergency — seek immediate medical care." }

    const pao2Approx = s >= 95 ? 80 + (s - 95) * 4 : s >= 90 ? 60 + (s - 90) * 4 : 40 + (s - 80) * 2

    setResult({
      primaryMetric: { label: `SpO₂: ${s}%`, value: category, status, description: action },
      metrics: [
        { label: "SpO₂ Reading", value: s, unit: "%", status },
        { label: "Category", value: category, status },
        { label: "Approx. PaO₂ (est.)", value: r0(pao2Approx), unit: "mmHg", status: pao2Approx > 70 ? "good" : "warning" },
        { label: "Oxygen Content (est.)", value: `${r1(s / 100 * 1.34 * 14)} mL/dL`, status: "normal" }
      ],
      recommendations: [
        { title: "SpO₂ Reference Ranges", description: "95-100%: Normal | 90-94%: Below normal — see a doctor | 85-89%: Medical concern — seek care | <85%: Emergency. Altitude reduces SpO₂ by 1-2% per 1,000m above sea level.", priority: "high", category: "Clinical" },
        { title: "Measurement Tips", description: "For accurate pulse oximetry: avoid nail polish, ensure good circulation (warm fingers), stay still during measurement, and compare readings over several minutes rather than a single reading.", priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: { "SpO₂": `${s}%`, "Category": category, "PaO₂ (estimate)": `${r0(pao2Approx)} mmHg`, "Recommended Action": action }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="oxygen-saturation-interpreter" title="Oxygen Saturation Interpreter"
      description="Interpret SpO₂ pulse oximetry readings with clinical categories and estimated arterial oxygen pressure values."
      icon={Wind} calculate={calculate} onClear={() => { setSpo2(98); setResult(null) }}
      values={[spo2]} result={result}
      seoContent={<SeoContentGenerator title="Oxygen Saturation Interpreter" description="Interpret SpO₂ values and ranges." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="SpO₂ Reading" val={spo2} set={setSpo2} min={50} max={100} step={0.1} suffix="%" />
      </div>} />
  )
}

// ─── 9. QT Interval Calculator (QTc) ─────────────────────────────────────────
export function QTIntervalCalculator() {
  const [qt, setQT] = useState(400)
  const [hr, setHr] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const q = clamp(qt, 200, 700)
    const h = clamp(hr, 30, 200)
    const rr = 60000 / h                                      // RR interval in ms
    const qtcBazett = r0(q / Math.sqrt(rr / 1000))
    const qtcFridericia = r0(q / Math.pow(rr / 1000, 1 / 3))
    const qtcFramingham = r0(q + 154 * (1 - 60 / h))

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (qtcBazett > 500) { category = "Very prolonged — High TdP risk"; status = "danger" }
    else if (qtcBazett > 470) { category = "Prolonged — Increased risk"; status = "danger" }
    else if (qtcBazett > 440) { category = "Borderline prolonged"; status = "warning" }
    else if (qtcBazett < 350) { category = "Short QT"; status = "warning" }
    else { category = "Normal"; status = "good" }

    setResult({
      primaryMetric: { label: "QTc (Bazett)", value: qtcBazett, unit: "ms", status, description: `${category}` },
      metrics: [
        { label: "Raw QT Interval", value: q, unit: "ms", status: "normal" },
        { label: "Heart Rate", value: h, unit: "bpm", status: "normal" },
        { label: "RR Interval", value: r0(rr), unit: "ms", status: "normal" },
        { label: "QTc Bazett", value: qtcBazett, unit: "ms", status },
        { label: "QTc Fridericia", value: qtcFridericia, unit: "ms", status: qtcFridericia > 450 ? "warning" : "good" },
        { label: "QTc Framingham", value: qtcFramingham, unit: "ms", status: qtcFramingham > 450 ? "warning" : "good" },
        { label: "Category", value: category, status }
      ],
      recommendations: [
        { title: "QTc Thresholds", description: "Normal QTc: 350-440 ms (men), 350-450 ms (women). Borderline: 440-470. Prolonged: >470 ms (men) or >480 ms (women). >500 ms carries significant risk of Torsades de Pointes (TdP) arrhythmia.", priority: "high", category: "Clinical" },
        { title: "Drug-Induced QT Prolongation", description: "Many medications can prolong QT including certain antibiotics (fluoroquinolones, macrolides), antidepressants, antipsychotics, and antiarrhythmics. Always check crediblemeds.org for drug-QT interactions.", priority: "high", category: "Medications" }
      ],
      detailedBreakdown: { "QT": `${q} ms`, "HR": `${h} bpm`, "QTc (Bazett)": `${qtcBazett} ms`, "QTc (Fridericia)": `${qtcFridericia} ms`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="qt-interval-calculator" title="QT Interval Calculator (QTc)"
      description="Calculate the corrected QT interval using Bazett, Fridericia, and Framingham formulas. Includes arrhythmia risk assessment."
      icon={Activity} calculate={calculate} onClear={() => { setQT(400); setHr(70); setResult(null) }}
      values={[qt, hr]} result={result}
      seoContent={<SeoContentGenerator title="QT Interval Calculator" description="Calculate corrected QT interval (QTc)." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="QT Interval" val={qt} set={setQT} min={200} max={700} suffix="ms" />
          <NumInput label="Heart Rate" val={hr} set={setHr} min={30} max={200} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 10. Stroke Volume Calculator ────────────────────────────────────────────
export function StrokeVolumeCalculator() {
  const [co, setCo] = useState(5.0)
  const [hr, setHr] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(co, 0.5, 40)
    const h = clamp(hr, 30, 220)
    const sv = r0((c * 1000) / h)          // mL
    const ef = r1(sv / 120 * 100)          // assume EDV ~120 mL

    let status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (sv >= 60 && sv <= 100) status = "good"
    else if (sv < 60) status = "warning"
    else status = "normal"

    setResult({
      primaryMetric: { label: "Stroke Volume", value: sv, unit: "mL/beat", status, description: `Cardiac Output / Heart Rate = ${c} / ${h} × 1000` },
      metrics: [
        { label: "Stroke Volume", value: sv, unit: "mL/beat", status },
        { label: "Cardiac Output", value: c, unit: "L/min", status: "normal" },
        { label: "Heart Rate", value: h, unit: "bpm", status: "normal" },
        { label: "Estimated EF (vs 120mL EDV)", value: r1(ef), unit: "%", status: ef >= 50 ? "good" : "warning" },
        { label: "Beats per Day", value: r0(h * 60 * 24).toLocaleString(), status: "normal" },
        { label: "Blood Pumped per Day", value: r0(sv * h * 60 * 24 / 1000).toLocaleString(), unit: "L", status: "normal" }
      ],
      recommendations: [
        { title: "Normal Stroke Volume", description: `Normal SV at rest: 60-100 mL. Trained athletes may have SV of 110-130 mL at rest due to enlarged cardiac chambers. Your estimated SV of ${sv} mL is ${sv >= 60 && sv <= 100 ? "within normal range" : sv < 60 ? "below normal — possible heart failure or dehydration" : "above normal — typical in athletes"}.`, priority: "high", category: "Clinical" }
      ],
      detailedBreakdown: { "CO": `${c} L/min`, "HR": `${h} bpm`, "SV": `${sv} mL`, "EF (est.)": `${r1(ef)}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stroke-volume-calculator" title="Stroke Volume Calculator"
      description="Estimate stroke volume from cardiac output and heart rate. Includes ejection fraction estimation and daily blood output."
      icon={Heart} calculate={calculate} onClear={() => { setCo(5.0); setHr(70); setResult(null) }}
      values={[co, hr]} result={result}
      seoContent={<SeoContentGenerator title="Stroke Volume Calculator" description="Estimate stroke volume from cardiac metrics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cardiac Output" val={co} set={setCo} min={0.5} max={40} step={0.1} suffix="L/min" />
          <NumInput label="Heart Rate" val={hr} set={setHr} min={30} max={220} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 11. Ankle-Brachial Index ─────────────────────────────────────────────────
export function AnkleBrachialIndexCalculator() {
  const [ankleRight, setAnkleRight] = useState(120)
  const [ankleLeft, setAnkleLeft] = useState(118)
  const [brachialRight, setBrachialRight] = useState(130)
  const [brachialLeft, setBrachialLeft] = useState(128)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const aR = clamp(ankleRight, 60, 250)
    const aL = clamp(ankleLeft, 60, 250)
    const bR = clamp(brachialRight, 60, 250)
    const bL = clamp(brachialLeft, 60, 250)

    const highBrachial = Math.max(bR, bL)
    const abiRight = r2(aR / highBrachial)
    const abiLeft = r2(aL / highBrachial)
    const abiMean = r2((abiRight + abiLeft) / 2)

    const interpret = (abi: number) => {
      if (abi > 1.4) return { cat: "Non-compressible arteries (>1.4)", s: "warning" as const }
      if (abi >= 1.0) return { cat: "Normal", s: "good" as const }
      if (abi >= 0.9) return { cat: "Borderline PAD", s: "warning" as const }
      if (abi >= 0.7) return { cat: "Mild PAD", s: "warning" as const }
      if (abi >= 0.5) return { cat: "Moderate PAD", s: "danger" as const }
      return { cat: "Severe PAD", s: "danger" as const }
    }

    const rightInterp = interpret(abiRight)
    const leftInterp = interpret(abiLeft)

    setResult({
      primaryMetric: { label: "ABI (Mean)", value: abiMean, status: interpret(abiMean).s, description: interpret(abiMean).cat },
      metrics: [
        { label: "ABI Right Side", value: abiRight, status: rightInterp.s, description: rightInterp.cat },
        { label: "ABI Left Side", value: abiLeft, status: leftInterp.s, description: leftInterp.cat },
        { label: "Right Ankle BP", value: aR, unit: "mmHg", status: "normal" },
        { label: "Left Ankle BP", value: aL, unit: "mmHg", status: "normal" },
        { label: "Highest Brachial BP", value: highBrachial, unit: "mmHg", status: "normal" },
      ],
      recommendations: [
        { title: "ABI Interpretation", description: ">1.40: Non-compressible arteries (consider Toe-brachial index). 1.00-1.40: Normal. 0.91-0.99: Borderline (repeat test). 0.71-0.90: Mild PAD. 0.41-0.70: Moderate PAD. ≤0.40: Severe PAD, critical limb ischemia.", priority: "high", category: "Vascular" },
        { title: "When ABI is Abnormal", description: "PAD is associated with 3-6× increased risk of MI and stroke. If ABI < 0.9, refer to vascular specialist. Walking programs and CVD risk factor control can slow disease progression.", priority: "high", category: "Management" }
      ],
      detailedBreakdown: { "ABI Right": `${abiRight} (${rightInterp.cat})`, "ABI Left": `${abiLeft} (${leftInterp.cat})`, "Mean ABI": abiMean }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ankle-brachial-index" title="Ankle-Brachial Index (ABI)"
      description="Calculate ABI for peripheral artery disease (PAD) screening. Enter ankle and brachial blood pressures for both sides."
      icon={Activity} calculate={calculate} onClear={() => { setAnkleRight(120); setAnkleLeft(118); setBrachialRight(130); setBrachialLeft(128); setResult(null) }}
      values={[ankleRight, ankleLeft, brachialRight, brachialLeft]} result={result}
      seoContent={<SeoContentGenerator title="Ankle-Brachial Index (ABI)" description="Estimate ABI for circulation assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm text-muted-foreground">Enter systolic blood pressures measured at each location.</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Right Ankle BP" val={ankleRight} set={setAnkleRight} min={60} max={250} suffix="mmHg" />
          <NumInput label="Left Ankle BP" val={ankleLeft} set={setAnkleLeft} min={60} max={250} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Right Brachial BP" val={brachialRight} set={setBrachialRight} min={60} max={250} suffix="mmHg" />
          <NumInput label="Left Brachial BP" val={brachialLeft} set={setBrachialLeft} min={60} max={250} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 12. PaO2/FiO2 Ratio ──────────────────────────────────────────────────────
export function PaO2FiO2RatioCalculator() {
  const [pao2, setPao2] = useState(90)
  const [fio2, setFio2] = useState(0.21)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const p = clamp(pao2, 20, 700)
    const f = clamp(fio2, 0.21, 1.0)
    const ratio = r0(p / f)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (ratio >= 400) { category = "Normal"; status = "good" }
    else if (ratio >= 300) { category = "Mild ARDS / Hypoxemia"; status = "warning" }
    else if (ratio >= 200) { category = "Moderate ARDS"; status = "danger" }
    else { category = "Severe ARDS"; status = "danger" }

    setResult({
      primaryMetric: { label: "P/F Ratio", value: ratio, unit: "mmHg", status, description: `${category} — Berlin ARDS Criteria` },
      metrics: [
        { label: "PaO₂/FiO₂ (P/F Ratio)", value: ratio, unit: "mmHg", status },
        { label: "Category (Berlin)", value: category, status },
        { label: "PaO₂", value: p, unit: "mmHg", status: p >= 60 ? "good" : "danger" },
        { label: "FiO₂", value: (f * 100).toFixed(0), unit: "%", status: "normal" }
      ],
      recommendations: [
        { title: "P/F Ratio Thresholds (Berlin ARDS)", description: "≥400: Normal lung oxygenation. 200-400: Mild ARDS. 100-200: Moderate ARDS. <100: Severe ARDS. A declining P/F ratio despite increasing FiO₂ indicates worsening respiratory failure.", priority: "high", category: "Clinical" },
        { title: "Room Air Baseline", description: `At room air (FiO₂ = 21%), normal PaO₂ is 80-100 mmHg giving P/F of 400-500. Your P/F ratio of ${ratio} at FiO₂ of ${(f * 100).toFixed(0)}% suggests ${category}.`, priority: "medium", category: "Interpretation" }
      ],
      detailedBreakdown: { "PaO₂": `${p} mmHg`, "FiO₂": `${(f * 100).toFixed(0)}%`, "P/F Ratio": ratio, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pao2-fio2-ratio" title="PaO₂/FiO₂ Ratio Calculator"
      description="Calculate the P/F ratio for oxygenation assessment. Identifies ARDS severity using Berlin criteria."
      icon={Wind} calculate={calculate} onClear={() => { setPao2(90); setFio2(0.21); setResult(null) }}
      values={[pao2, fio2]} result={result}
      seoContent={<SeoContentGenerator title="PaO2/FiO2 Ratio" description="Calculate P/F ratio for oxygenation assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="PaO₂ (arterial oxygen)" val={pao2} set={setPao2} min={20} max={700} suffix="mmHg" />
        <NumInput label="FiO₂ (fraction of inspired O₂)" val={fio2} set={setFio2} min={0.21} max={1.0} step={0.01} suffix="0.21–1.0" />
      </div>} />
  )
}

// ─── 13. Tidal Volume Calculator ─────────────────────────────────────────────
export function TidalVolumeCalculator() {
  const [height, setHeight] = useState(170)
  const [gender, setGender] = useState("male")
  const [mode, setMode] = useState("ardsnet")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 100, 250)
    const male = gender === "male"
    // PBW (Predicted Body Weight)
    const pbw = male ? 50 + 0.91 * (h - 152.4) : 45.5 + 0.91 * (h - 152.4)
    const tvLow = r0(pbw * 6)       // ARDSNet low: 6 mL/kg PBW
    const tvHigh = r0(pbw * 8)      // Standard: 8 mL/kg PBW
    const tvNormal = r0(pbw * 7)    // mean

    setResult({
      primaryMetric: { label: "Ideal Tidal Volume (6 mL/kg PBW)", value: tvLow, unit: "mL", status: "good", description: `Predicted Body Weight: ${r0(pbw)} kg` },
      metrics: [
        { label: "Predicted Body Weight (PBW)", value: r0(pbw), unit: "kg", status: "normal" },
        { label: "TV at 6 mL/kg (ARDSNet)", value: tvLow, unit: "mL", status: "good" },
        { label: "TV at 7 mL/kg (Standard)", value: tvNormal, unit: "mL", status: "normal" },
        { label: "TV at 8 mL/kg (Upper limit)", value: tvHigh, unit: "mL", status: "warning" },
        { label: "Minute Ventilation (12 breaths)", value: r0(tvNormal * 12 / 1000), unit: "L/min (est.)", status: "normal" }
      ],
      recommendations: [
        { title: "Lung-Protective Ventilation", description: `ARDSNet protocol recommends 6 mL/kg PBW (${tvLow} mL) for ARDS patients to prevent ventilator-induced lung injury. For normal lungs, 7-8 mL/kg PBW is standard.`, priority: "high", category: "Clinical" },
        { title: "PBW vs Actual Weight", description: "Always use Predicted Body Weight for tidal volume calculations — NOT actual body weight. This is especially important in obese patients where using actual weight would result in injuriously high tidal volumes.", priority: "high", category: "Clinical Safety" }
      ],
      detailedBreakdown: { "Gender": gender, "Height": `${h} cm`, "PBW": `${r0(pbw)} kg`, "6 mL/kg TV": `${tvLow} mL`, "8 mL/kg TV": `${tvHigh} mL` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="tidal-volume-calculator" title="Tidal Volume Calculator"
      description="Calculate ideal tidal volume for mechanical ventilation using ARDSNet protocol. Based on predicted body weight."
      icon={Wind} calculate={calculate} onClear={() => { setHeight(170); setGender("male"); setResult(null) }}
      values={[height, gender, mode]} result={result}
      seoContent={<SeoContentGenerator title="Tidal Volume Calculator" description="Calculate ideal tidal volume for ventilation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
      </div>} />
  )
}
