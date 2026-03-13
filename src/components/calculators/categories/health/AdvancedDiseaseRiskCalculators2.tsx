"use client"

import { useState } from "react"
import { Activity, Heart, Brain, AlertCircle, Thermometer, Scale, Droplets, Shield } from "lucide-react"
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

// ─── 3. Stroke Risk Calculator ────────────────────────────────────────────────
export function StrokeRiskCalculator() {
  const [age, setAge] = useState(55)
  const [systolicBP, setSystolicBP] = useState(140)
  const [smoking, setSmoking] = useState("no")
  const [diabetes, setDiabetes] = useState("no")
  const [cholesterol, setCholesterol] = useState(220)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 90)
    const bp = clamp(systolicBP, 80, 220)
    const chol = clamp(cholesterol, 100, 400)

    let score = 0
    if (a >= 65) score += 3; else if (a >= 55) score += 2; else if (a >= 45) score += 1
    if (bp >= 160) score += 3; else if (bp >= 140) score += 2; else if (bp >= 130) score += 1
    if (smoking === "yes") score += 2
    if (diabetes === "yes") score += 2
    if (chol >= 280) score += 2; else if (chol >= 240) score += 1

    const maxScore = 12
    const riskPct = r1(clamp((score / maxScore) * 35, 1, 35))
    const cerebrovascularScore = r0(clamp(score * 8, 0, 100))
    const hyperInteraction = bp >= 140 && diabetes === "yes" ? "High — hypertension + diabetes synergy" : bp >= 140 ? "Moderate — hypertension present" : "Low"

    const classification = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : score <= 9 ? "High Risk" : "Very High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "10-Year Stroke Risk", value: `${riskPct}%`, status, description: `${classification} — Score: ${score}/${maxScore}` },
      healthScore: Math.max(5, r0(100 - cerebrovascularScore)),
      metrics: [
        { label: "Stroke Risk", value: riskPct, unit: "%", status },
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Classification", value: classification, status },
        { label: "Age Factor", value: a >= 65 ? "High" : a >= 55 ? "Moderate" : "Low", status: a >= 65 ? "danger" : a >= 55 ? "warning" : "good" },
        { label: "Blood Pressure", value: bp, unit: "mmHg", status: bp < 130 ? "good" : bp < 140 ? "warning" : "danger" },
        { label: "Cholesterol", value: chol, unit: "mg/dL", status: chol < 200 ? "good" : chol < 240 ? "warning" : "danger" },
        { label: "Hypertension Interaction", value: hyperInteraction, status: hyperInteraction.startsWith("High") ? "danger" : hyperInteraction.startsWith("Moderate") ? "warning" : "good" },
        { label: "Cerebrovascular Score", value: cerebrovascularScore, unit: "/100", status }
      ],
      recommendations: [
        { title: "Stroke Risk Assessment", description: `10-year risk: ${riskPct}% (${classification}). ${score > 6 ? "URGENT: Consult physician for stroke prevention strategy. " : ""}Key risk factors: ${bp >= 140 ? "HIGH blood pressure (strongest modifiable risk factor). " : ""}${smoking === "yes" ? "Smoking doubles stroke risk. " : ""}${diabetes === "yes" ? "Diabetes increases risk 2-4x. " : ""}${chol >= 240 ? "High cholesterol accelerates atherosclerosis. " : ""}`, priority: "high", category: "Assessment" },
        { title: "Prevention Checklist", description: `1) Blood pressure control (<130/80 target). 2) ${smoking === "yes" ? "QUIT SMOKING — single best modifiable action." : "Maintain non-smoking status."} 3) ${diabetes === "yes" ? "Strict glucose control (HbA1c <7%)." : "Monitor glucose annually."} 4) Cholesterol management (statin if indicated). 5) Regular exercise (150+ min/week). 6) Mediterranean diet. 7) Limit alcohol. 8) Antiplatelet therapy if indicated by physician.`, priority: "high", category: "Prevention" },
        { title: "Warning Signs", description: "FAST recognition: Face drooping, Arm weakness, Speech difficulty, Time to call emergency. Also: sudden numbness, confusion, vision problems, severe headache, dizziness. Stroke is a medical emergency — every minute counts.", priority: "medium", category: "Emergency" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Score": `${score}/${maxScore}`, "BP": `${bp} mmHg`, "Chol": `${chol} mg/dL`, "Smoking": smoking, "Diabetes": diabetes }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stroke-risk-calculator" title="Stroke Risk Calculator"
      description="Estimate 10-year stroke probability based on blood pressure, cholesterol, smoking, diabetes status, and age."
      icon={Brain} calculate={calculate} onClear={() => { setAge(55); setSystolicBP(140); setSmoking("no"); setDiabetes("no"); setCholesterol(220); setResult(null) }}
      values={[age, systolicBP, smoking, diabetes, cholesterol]} result={result}
      seoContent={<SeoContentGenerator title="Stroke Risk Calculator" description="Estimate 10-year stroke risk with cerebrovascular scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={90} suffix="years" />
          <NumInput label="Systolic Blood Pressure" val={systolicBP} set={setSystolicBP} min={80} max={220} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Smoking Status" val={smoking} set={setSmoking} options={[{ value: "no", label: "Non-smoker" }, { value: "yes", label: "Current Smoker" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <NumInput label="Total Cholesterol" val={cholesterol} set={setCholesterol} min={100} max={400} suffix="mg/dL" />
      </div>} />
  )
}

// ─── 4. Metabolic Syndrome Calculator ─────────────────────────────────────────
export function MetabolicSyndromeCalculator() {
  const [waist, setWaist] = useState(38)
  const [glucose, setGlucose] = useState(105)
  const [triglycerides, setTriglycerides] = useState(160)
  const [hdl, setHdl] = useState(38)
  const [systolic, setSystolic] = useState(135)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(waist, 20, 60)
    const glu = clamp(glucose, 50, 300)
    const trig = clamp(triglycerides, 30, 600)
    const h = clamp(hdl, 15, 100)
    const bp = clamp(systolic, 80, 220)

    const waistThreshold = gender === "male" ? 40 : 35
    const hdlThreshold = gender === "male" ? 40 : 50

    let criteria = 0
    const c1 = w >= waistThreshold; if (c1) criteria++
    const c2 = glu >= 100; if (c2) criteria++
    const c3 = trig >= 150; if (c3) criteria++
    const c4 = h < hdlThreshold; if (c4) criteria++
    const c5 = bp >= 130; if (c5) criteria++

    const diagnosed = criteria >= 3
    const cardiometabolicScore = r0(clamp(criteria * 20, 0, 100))
    const diabetesProgProb = r0(clamp(criteria * 12 + (glu > 125 ? 20 : glu > 100 ? 10 : 0), 0, 80))

    const status: 'good' | 'warning' | 'danger' = criteria < 2 ? "good" : criteria < 3 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Metabolic Syndrome", value: diagnosed ? `YES (${criteria}/5 criteria)` : `No (${criteria}/5 criteria)`, status, description: diagnosed ? "≥3 criteria met — Metabolic Syndrome diagnosed" : `${3 - criteria} more criteria for diagnosis` },
      healthScore: Math.max(5, r0(100 - cardiometabolicScore)),
      metrics: [
        { label: "Criteria Met", value: `${criteria}/5`, status },
        { label: "Diagnosis", value: diagnosed ? "Metabolic Syndrome" : "Not Met", status: diagnosed ? "danger" : "good" },
        { label: `Waist (≥${waistThreshold}″)`, value: `${w}″ ${c1 ? "✗" : "✓"}`, status: c1 ? "danger" : "good" },
        { label: "Glucose (≥100)", value: `${glu} ${c2 ? "✗" : "✓"}`, unit: "mg/dL", status: c2 ? "danger" : "good" },
        { label: "Triglycerides (≥150)", value: `${trig} ${c3 ? "✗" : "✓"}`, unit: "mg/dL", status: c3 ? "danger" : "good" },
        { label: `HDL (<${hdlThreshold})`, value: `${h} ${c4 ? "✗" : "✓"}`, unit: "mg/dL", status: c4 ? "danger" : "good" },
        { label: "BP (≥130)", value: `${bp} ${c5 ? "✗" : "✓"}`, unit: "mmHg", status: c5 ? "danger" : "good" },
        { label: "Cardiometabolic Score", value: cardiometabolicScore, unit: "/100", status },
        { label: "Diabetes Progression", value: diabetesProgProb, unit: "%", status: diabetesProgProb < 20 ? "good" : diabetesProgProb < 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Metabolic Syndrome", description: `${diagnosed ? "DIAGNOSED: " + criteria + "/5 criteria met. Metabolic syndrome dramatically increases heart disease (2x), diabetes (5x), and stroke risk. Requires aggressive lifestyle intervention." : criteria + "/5 criteria. Not yet diagnosed but monitor closely."} Failed criteria: ${[c1 && "waist", c2 && "glucose", c3 && "triglycerides", c4 && "HDL", c5 && "BP"].filter(Boolean).join(", ") || "none"}.`, priority: "high", category: "Diagnosis" },
        { title: "Treatment Priority", description: `${c1 ? "1) Waist reduction — target <" + waistThreshold + "″ through caloric deficit + exercise. " : ""}${c2 ? "2) Glucose control — limit refined carbs, increase fiber. " : ""}${c3 ? "3) Lower triglycerides — reduce sugar/alcohol, omega-3 fatty acids. " : ""}${c4 ? "4) Raise HDL — exercise, healthy fats (olive oil, nuts, avocado). " : ""}${c5 ? "5) Blood pressure — DASH diet, reduce sodium <2300mg, exercise. " : ""}`, priority: "high", category: "Treatment" },
        { title: "Diabetes Risk", description: `Progression probability: ${diabetesProgProb}%. ${glu >= 100 ? "Fasting glucose already elevated (pre-diabetic range if 100-125). " : ""}Metabolic syndrome is the #1 precursor to type 2 diabetes. Weight loss of 5-10% can reverse metabolic syndrome in many cases.`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Criteria": `${criteria}/5`, "Waist": `${w}″`, "Glucose": glu, "Trig": trig, "HDL": h, "BP": bp, "Diabetes %": diabetesProgProb }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="metabolic-syndrome-calculator" title="Metabolic Syndrome Calculator"
      description="Evaluate metabolic syndrome diagnostic criteria. Assesses waist, glucose, triglycerides, HDL, and blood pressure."
      icon={Activity} calculate={calculate} onClear={() => { setWaist(38); setGlucose(105); setTriglycerides(160); setHdl(38); setSystolic(135); setGender("male"); setResult(null) }}
      values={[waist, glucose, triglycerides, hdl, systolic, gender]} result={result}
      seoContent={<SeoContentGenerator title="Metabolic Syndrome Calculator" description="Diagnose metabolic syndrome using clinical criteria." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Waist Circumference" val={waist} set={setWaist} min={20} max={60} step={0.5} suffix="inches" />
          <NumInput label="Fasting Glucose" val={glucose} set={setGlucose} min={50} max={300} suffix="mg/dL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Triglycerides" val={triglycerides} set={setTriglycerides} min={30} max={600} suffix="mg/dL" />
          <NumInput label="HDL Cholesterol" val={hdl} set={setHdl} min={15} max={100} suffix="mg/dL" />
        </div>
        <NumInput label="Systolic Blood Pressure" val={systolic} set={setSystolic} min={80} max={220} suffix="mmHg" />
      </div>} />
  )
}

// ─── 5. Bone Density Calculator ───────────────────────────────────────────────
export function BoneDensityCalculator() {
  const [age, setAge] = useState(60)
  const [gender, setGender] = useState("female")
  const [calciumIntake, setCalciumIntake] = useState("moderate")
  const [vitaminD, setVitaminD] = useState("adequate")
  const [familyHistory, setFamilyHistory] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 90)

    let tScore = 0
    // Age-based baseline
    if (a < 40) tScore = 0.5
    else if (a < 50) tScore = 0
    else if (a < 60) tScore = -0.8
    else if (a < 70) tScore = -1.5
    else tScore = -2.2

    if (gender === "female") tScore -= 0.4
    if (calciumIntake === "low") tScore -= 0.5; else if (calciumIntake === "high") tScore += 0.2
    if (vitaminD === "deficient") tScore -= 0.6; else if (vitaminD === "optimal") tScore += 0.2
    if (familyHistory === "yes") tScore -= 0.5

    tScore = r1(clamp(tScore, -4.5, 2))

    const classification = tScore >= -1 ? "Normal" : tScore >= -2.5 ? "Osteopenia" : "Osteoporosis"
    const fractureRisk = r0(clamp(tScore < -2.5 ? 40 : tScore < -1 ? 15 + Math.abs(tScore + 1) * 10 : 5, 2, 60))
    const progressionProb = r0(clamp((a > 60 ? 20 : 10) + (tScore < -1.5 ? 25 : 0) + (calciumIntake === "low" ? 15 : 0) + (vitaminD === "deficient" ? 15 : 0), 5, 80))

    const status: 'good' | 'warning' | 'danger' = classification === "Normal" ? "good" : classification === "Osteopenia" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Estimated T-Score", value: `${tScore}`, status, description: classification },
      healthScore: Math.max(5, r0(clamp((tScore + 3) * 25, 5, 95))),
      metrics: [
        { label: "T-Score Estimate", value: tScore, status },
        { label: "Classification", value: classification, status },
        { label: "Fracture Risk", value: fractureRisk, unit: "%", status: fractureRisk < 15 ? "good" : fractureRisk < 30 ? "warning" : "danger" },
        { label: "Progression Risk", value: progressionProb, unit: "%", status: progressionProb < 25 ? "good" : progressionProb < 50 ? "warning" : "danger" },
        { label: "Age Factor", value: a > 65 ? "High" : a > 50 ? "Moderate" : "Low", status: a > 65 ? "danger" : a > 50 ? "warning" : "good" },
        { label: "Calcium Status", value: calciumIntake, status: calciumIntake === "high" ? "good" : calciumIntake === "moderate" ? "warning" : "danger" },
        { label: "Vitamin D Status", value: vitaminD, status: vitaminD === "optimal" ? "good" : vitaminD === "adequate" ? "warning" : "danger" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive" : "None", status: familyHistory === "yes" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Bone Health", description: `Estimated T-score: ${tScore} (${classification}). ${classification === "Osteoporosis" ? "HIGH RISK — consult physician for DEXA scan and treatment options (bisphosphonates, denosumab)." : classification === "Osteopenia" ? "Bone loss detected — preventive action needed." : "Bone density appears normal."} Fracture risk: ${fractureRisk}%. This is an estimate — a DEXA scan provides definitive T-score.`, priority: "high", category: "Assessment" },
        { title: "Prevention", description: `1) Calcium: ${calciumIntake === "low" ? "INCREASE to 1000-1200mg/day (dairy, fortified foods, supplements)." : "Maintain 1000-1200mg/day."} 2) Vitamin D: ${vitaminD === "deficient" ? "INCREASE — 1000-2000 IU/day, sunlight 15 min daily." : "Maintain adequate levels (30-50 ng/mL)."} 3) Weight-bearing exercise (walking, jogging, resistance training) — strongest bone-building stimulus. 4) Avoid smoking and excessive alcohol.`, priority: "high", category: "Prevention" },
        { title: "Screening", description: `${a >= 65 || (gender === "female" && a >= 50) ? "DEXA scan recommended at your age/gender. Repeat every 2 years if osteopenia detected." : "DEXA scan recommended after age 65 (earlier if risk factors present)."} Falls prevention is critical — most fractures occur from falls, not spontaneous. Balance training, home safety modifications.`, priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "T-Score": tScore, "Class": classification, "Fracture": `${fractureRisk}%`, "Progression": `${progressionProb}%`, "Calcium": calciumIntake, "Vit D": vitaminD }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bone-density-calculator" title="Bone Density Calculator"
      description="Estimate bone health T-score and fracture risk. Evaluates osteoporosis risk from age, calcium, vitamin D, and family history."
      icon={Shield} calculate={calculate} onClear={() => { setAge(60); setGender("female"); setCalciumIntake("moderate"); setVitaminD("adequate"); setFamilyHistory("no"); setResult(null) }}
      values={[age, gender, calciumIntake, vitaminD, familyHistory]} result={result}
      seoContent={<SeoContentGenerator title="Bone Density Calculator" description="Estimate bone density T-score and osteoporosis risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Calcium Intake" val={calciumIntake} set={setCalciumIntake} options={[{ value: "low", label: "Low (<600mg/day)" }, { value: "moderate", label: "Moderate (600-1000mg)" }, { value: "high", label: "High (>1000mg)" }]} />
          <SelectInput label="Vitamin D" val={vitaminD} set={setVitaminD} options={[{ value: "deficient", label: "Deficient (<20 ng/mL)" }, { value: "adequate", label: "Adequate (20-30 ng/mL)" }, { value: "optimal", label: "Optimal (>30 ng/mL)" }]} />
        </div>
        <SelectInput label="Family History of Osteoporosis" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      </div>} />
  )
}

// ─── 6. Kidney Function Calculator ────────────────────────────────────────────
export function KidneyFunctionCalculator() {
  const [creatinine, setCreatinine] = useState(1.1)
  const [age, setAge] = useState(55)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cr = clamp(creatinine, 0.3, 10)
    const a = clamp(age, 18, 90)

    // CKD-EPI 2021 equation (race-free)
    let egfr: number
    if (gender === "male") {
      if (cr <= 0.9) egfr = 142 * Math.pow(cr / 0.9, -0.302) * Math.pow(0.9938, a)
      else egfr = 142 * Math.pow(cr / 0.9, -1.200) * Math.pow(0.9938, a)
    } else {
      if (cr <= 0.7) egfr = 142 * Math.pow(cr / 0.7, -0.241) * Math.pow(0.9938, a) * 1.012
      else egfr = 142 * Math.pow(cr / 0.7, -1.200) * Math.pow(0.9938, a) * 1.012
    }
    egfr = r0(clamp(egfr, 5, 150))

    const stage = egfr >= 90 ? "G1 — Normal" : egfr >= 60 ? "G2 — Mildly Decreased" : egfr >= 45 ? "G3a — Mild-Moderate" : egfr >= 30 ? "G3b — Moderate-Severe" : egfr >= 15 ? "G4 — Severe" : "G5 — Kidney Failure"
    const ckdProgProb = r0(clamp(egfr < 30 ? 60 : egfr < 45 ? 35 : egfr < 60 ? 15 : 5, 5, 70))

    const status: 'good' | 'warning' | 'danger' = egfr >= 60 ? "good" : egfr >= 30 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "eGFR", value: `${egfr} mL/min/1.73m²`, status, description: stage },
      healthScore: r0(clamp(egfr, 5, 100)),
      metrics: [
        { label: "eGFR", value: egfr, unit: "mL/min", status },
        { label: "CKD Stage", value: stage, status },
        { label: "Creatinine", value: cr, unit: "mg/dL", status: cr < 1.2 ? "good" : cr < 1.5 ? "warning" : "danger" },
        { label: "CKD Progression", value: ckdProgProb, unit: "%", status: ckdProgProb < 15 ? "good" : ckdProgProb < 35 ? "warning" : "danger" },
        { label: "Dialysis Risk", value: egfr < 15 ? "High" : egfr < 30 ? "Moderate" : "Low", status: egfr < 15 ? "danger" : egfr < 30 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Kidney Function", description: `eGFR: ${egfr} mL/min (${stage}). ${egfr < 60 ? "Kidney impairment detected — consult nephrologist." : egfr < 90 ? "Mildly reduced — monitor annually." : "Normal kidney function."} CKD-EPI 2021 race-free equation used. Confirmatory testing recommended if eGFR <60 — check urine albumin/creatinine ratio.`, priority: "high", category: "Assessment" },
        { title: "Kidney Protection", description: `1) Blood pressure <130/80 mmHg (ACE inhibitor/ARB if diabetic). 2) ${egfr < 60 ? "LIMIT protein to 0.8g/kg." : "Moderate protein (1.0-1.2g/kg)."} 3) Stay hydrated (2-3L water daily). 4) Avoid NSAIDs. 5) Control diabetes. 6) Limit sodium <2000mg. 7) Avoid nephrotoxic drugs. ${egfr < 30 ? "8) Monitor potassium and phosphorus intake." : ""}`, priority: "high", category: "Prevention" },
        { title: "Monitoring", description: `${egfr < 60 ? "Repeat eGFR every 3-6 months. Full kidney panel including urine albumin." : "Annual screening sufficient."} ${ckdProgProb > 30 ? "Progression risk elevated — aggressive BP and glucose control critical." : ""}`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "eGFR": egfr, "Stage": stage, "Creatinine": cr, "Age": a, "Progression": `${ckdProgProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="kidney-function-calculator" title="Kidney Function Calculator"
      description="Estimate GFR using CKD-EPI 2021 equation. Classifies CKD stage and chronic kidney disease progression risk."
      icon={Droplets} calculate={calculate} onClear={() => { setCreatinine(1.1); setAge(55); setGender("male"); setResult(null) }}
      values={[creatinine, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Kidney Function Calculator" description="Calculate eGFR and kidney disease stage." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Serum Creatinine" val={creatinine} set={setCreatinine} min={0.3} max={10} step={0.1} suffix="mg/dL" />
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 7. Hypertension Risk Estimator ───────────────────────────────────────────
export function HypertensionRiskEstimator() {
  const [age, setAge] = useState(45)
  const [bmi, setBmi] = useState(28)
  const [sodiumIntake, setSodiumIntake] = useState("moderate")
  const [physicalActivity, setPhysicalActivity] = useState("low")
  const [familyHistory, setFamilyHistory] = useState("yes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 90)
    const b = clamp(bmi, 15, 50)

    let score = 0
    if (a >= 60) score += 3; else if (a >= 45) score += 2; else if (a >= 35) score += 1
    if (b >= 30) score += 3; else if (b >= 25) score += 2; else if (b >= 23) score += 1
    if (sodiumIntake === "high") score += 2; else if (sodiumIntake === "moderate") score += 1
    if (physicalActivity === "low") score += 2; else if (physicalActivity === "moderate") score += 1
    if (familyHistory === "yes") score += 2

    const maxScore = 12
    const riskPct = r0(clamp((score / maxScore) * 60, 3, 60))
    const lifestyleIndex = r0(clamp(score * 8, 0, 100))
    const strokeCorrelation = r0(clamp(riskPct * 0.35, 1, 25))

    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : score <= 9 ? "High Risk" : "Very High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Hypertension Risk", value: `${riskPct}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - lifestyleIndex)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Risk Percentage", value: riskPct, unit: "%", status },
        { label: "Classification", value: label, status },
        { label: "Lifestyle Index", value: lifestyleIndex, unit: "/100", status },
        { label: "Stroke Correlation", value: strokeCorrelation, unit: "%", status: strokeCorrelation < 8 ? "good" : strokeCorrelation < 15 ? "warning" : "danger" },
        { label: "BMI Factor", value: b >= 30 ? "Obese" : b >= 25 ? "Overweight" : "Normal", status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Sodium Factor", value: sodiumIntake, status: sodiumIntake === "low" ? "good" : sodiumIntake === "moderate" ? "warning" : "danger" },
        { label: "Activity Factor", value: physicalActivity, status: physicalActivity === "high" ? "good" : physicalActivity === "moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Hypertension Risk", description: `${riskPct}% risk (${label}). ${score > 6 ? "HIGH RISK — lifestyle changes urgently needed. Regular BP monitoring essential." : "Modifiable risk factors can significantly reduce risk."} Uncontrolled hypertension is the #1 preventable cause of cardiovascular death.`, priority: "high", category: "Risk" },
        { title: "Lifestyle Modifications", description: `DASH diet principles: 1) ${sodiumIntake !== "low" ? "REDUCE sodium to <2300mg (ideally <1500mg)." : "Sodium intake is good."} 2) ${physicalActivity === "low" ? "INCREASE exercise — 150+ min/week aerobic." : "Activity level adequate."} 3) ${b >= 25 ? "Weight loss — each kg lost reduces BP by 1-2 mmHg." : "BMI is healthy."} 4) Limit alcohol. 5) Increase potassium (bananas, spinach, beans). 6) Manage stress. 7) Quit smoking (if applicable).`, priority: "high", category: "Lifestyle" },
        { title: "Monitoring", description: `Check BP regularly: ${score > 6 ? "weekly at home" : score > 3 ? "monthly" : "at annual checkup"}. Normal: <120/80. Elevated: 120-129/<80. Stage 1: 130-139/80-89. Stage 2: ≥140/≥90. Stroke correlation: ${strokeCorrelation}%.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Score": `${score}/${maxScore}`, "Risk": `${riskPct}%`, "BMI": b, "Sodium": sodiumIntake, "Activity": physicalActivity, "Stroke": `${strokeCorrelation}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hypertension-risk-calculator" title="Hypertension Risk Estimator"
      description="Estimate future high blood pressure risk from age, BMI, sodium intake, activity level, and family history."
      icon={Heart} calculate={calculate} onClear={() => { setAge(45); setBmi(28); setSodiumIntake("moderate"); setPhysicalActivity("low"); setFamilyHistory("yes"); setResult(null) }}
      values={[age, bmi, sodiumIntake, physicalActivity, familyHistory]} result={result}
      seoContent={<SeoContentGenerator title="Hypertension Risk Estimator" description="Estimate high blood pressure risk with lifestyle factors." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={90} suffix="years" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={50} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Sodium Intake" val={sodiumIntake} set={setSodiumIntake} options={[{ value: "low", label: "Low (<1500mg/day)" }, { value: "moderate", label: "Moderate (1500-3000mg)" }, { value: "high", label: "High (>3000mg)" }]} />
          <SelectInput label="Physical Activity" val={physicalActivity} set={setPhysicalActivity} options={[{ value: "low", label: "Low (<2 days/week)" }, { value: "moderate", label: "Moderate (3-4 days)" }, { value: "high", label: "High (5+ days)" }]} />
        </div>
        <SelectInput label="Family History of Hypertension" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      </div>} />
  )
}

// ─── 8. Sleep Apnea Risk Estimator ────────────────────────────────────────────
export function SleepApneaRiskEstimator() {
  const [neck, setNeck] = useState(16)
  const [bmi, setBmi] = useState(30)
  const [snoring, setSnoring] = useState("frequent")
  const [sleepiness, setSleepiness] = useState("moderate")
  const [age, setAge] = useState(50)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const n = clamp(neck, 10, 25)
    const b = clamp(bmi, 15, 60)
    const a = clamp(age, 18, 90)

    // STOP-BANG inspired
    let score = 0
    if (snoring === "frequent" || snoring === "every_night") score += 1  // S
    if (sleepiness === "moderate" || sleepiness === "severe") score += 1  // T
    if (a > 50) score += 1  // A
    if (n > (gender === "male" ? 17 : 16)) score += 1  // N
    if (b > 35) score += 1  // B
    if (gender === "male") score += 1  // G
    if (b > 30) score += 1  // extra BMI
    if (snoring === "every_night") score += 1  // extra snoring

    const maxScore = 8
    const apneaProb = r0(clamp(score * 12, 5, 90))
    const label = score <= 2 ? "Low Risk" : score <= 4 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 2 ? "good" : score <= 4 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Sleep Apnea Risk", value: `${apneaProb}%`, status, description: `${label} — STOP-BANG: ${score}/${maxScore}` },
      healthScore: Math.max(5, r0(100 - apneaProb)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Apnea Probability", value: apneaProb, unit: "%", status },
        { label: "Classification", value: label, status },
        { label: "Neck Size", value: n, unit: "inches", status: n > (gender === "male" ? 17 : 16) ? "danger" : "good" },
        { label: "BMI", value: b, status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Snoring", value: snoring.replace("_", " "), status: snoring === "never" ? "good" : snoring === "occasional" ? "warning" : "danger" },
        { label: "Daytime Sleepiness", value: sleepiness, status: sleepiness === "none" ? "good" : sleepiness === "mild" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Sleep Apnea Screening", description: `STOP-BANG score: ${score}/8 (${label}). Probability: ${apneaProb}%. ${score >= 5 ? "HIGH RISK — sleep study (polysomnography) strongly recommended." : score >= 3 ? "Moderate risk — discuss with physician." : "Low risk but monitor symptoms."} OSA causes repeated breathing cessation during sleep → oxygen drops → cardiovascular strain.`, priority: "high", category: "Screening" },
        { title: "Risk Factors", description: `${b > 30 ? "BMI " + b + " — weight loss is the most effective treatment (even 10% loss significantly reduces severity). " : ""}${n > 17 ? "Large neck circumference indicates airway fat deposition. " : ""}${snoring !== "never" ? "Snoring is the most common symptom — partner may notice breathing pauses. " : ""}Untreated OSA increases heart attack risk 2-3x, stroke risk 2-4x, and driving accident risk 6x.`, priority: "high", category: "Factors" },
        { title: "Treatment Options", description: "1) CPAP therapy (gold standard). 2) Weight loss (can cure mild OSA). 3) Positional therapy (sleep on side). 4) Oral appliance (mandibular advancement). 5) Avoid alcohol/sedatives before bed. 6) Surgery (UPPP) for anatomical causes. Get diagnosis first — home sleep test or lab polysomnography.", priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "STOP-BANG": `${score}/8`, "Probability": `${apneaProb}%`, "Neck": `${n}″`, "BMI": b, "Snoring": snoring, "Sleepiness": sleepiness }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-apnea-risk-calculator" title="Sleep Apnea Risk Estimator"
      description="Estimate obstructive sleep apnea probability using STOP-BANG scoring. Evaluates neck size, BMI, snoring, and sleepiness."
      icon={AlertCircle} calculate={calculate} onClear={() => { setNeck(16); setBmi(30); setSnoring("frequent"); setSleepiness("moderate"); setAge(50); setGender("male"); setResult(null) }}
      values={[neck, bmi, snoring, sleepiness, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Apnea Risk Estimator" description="STOP-BANG sleep apnea risk assessment tool." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Neck Circumference" val={neck} set={setNeck} min={10} max={25} step={0.5} suffix="inches" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={60} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Snoring" val={snoring} set={setSnoring} options={[{ value: "never", label: "Never" }, { value: "occasional", label: "Occasional" }, { value: "frequent", label: "Frequent" }, { value: "every_night", label: "Every Night" }]} />
          <SelectInput label="Daytime Sleepiness" val={sleepiness} set={setSleepiness} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ─── 9. Fatty Liver Risk Estimator ────────────────────────────────────────────
export function FattyLiverRiskEstimator() {
  const [bmi, setBmi] = useState(29)
  const [waist, setWaist] = useState(38)
  const [triglycerides, setTriglycerides] = useState(180)
  const [alcoholIntake, setAlcoholIntake] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const b = clamp(bmi, 15, 55)
    const w = clamp(waist, 20, 60)
    const trig = clamp(triglycerides, 30, 600)

    let score = 0
    if (b >= 30) score += 3; else if (b >= 25) score += 2; else if (b >= 23) score += 1
    if (w >= 40) score += 3; else if (w >= 35) score += 2
    if (trig >= 200) score += 3; else if (trig >= 150) score += 2; else if (trig >= 100) score += 1
    if (alcoholIntake === "heavy") score += 3; else if (alcoholIntake === "moderate") score += 1

    const riskPct = r0(clamp(score * 7, 5, 85))
    const fatAccumProb = r0(clamp(score * 8, 5, 90))
    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : score <= 9 ? "High Risk" : "Very High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Fatty Liver Risk", value: `${riskPct}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/12`, status },
        { label: "NAFLD Risk", value: riskPct, unit: "%", status },
        { label: "Fat Accumulation", value: fatAccumProb, unit: "%", status: fatAccumProb < 25 ? "good" : fatAccumProb < 50 ? "warning" : "danger" },
        { label: "BMI", value: b, status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Waist", value: w, unit: "inches", status: w < 35 ? "good" : w < 40 ? "warning" : "danger" },
        { label: "Triglycerides", value: trig, unit: "mg/dL", status: trig < 150 ? "good" : trig < 200 ? "warning" : "danger" },
        { label: "Alcohol", value: alcoholIntake, status: alcoholIntake === "none" ? "good" : alcoholIntake === "light" ? "good" : alcoholIntake === "moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Fatty Liver Assessment", description: `NAFLD risk: ${riskPct}% (${label}). NAFLD = fat accumulation in liver cells (>5% fat). Prevalence: 25% of adults globally. ${riskPct > 40 ? "High risk — liver ultrasound recommended. " : ""}Can progress to NASH → fibrosis → cirrhosis if untreated.`, priority: "high", category: "Assessment" },
        { title: "Management", description: `1) ${b >= 25 ? "Weight loss — 7-10% body weight loss can reverse NAFLD." : "Maintain healthy weight."} 2) ${alcoholIntake !== "none" ? "Reduce alcohol — even moderate drinking worsens fatty liver." : "Good — no alcohol."} 3) Reduce sugar/fructose (corn syrup, soda). 4) Mediterranean diet. 5) Exercise 150+ min/week. 6) Avoid hepatotoxic medications.`, priority: "high", category: "Management" },
        { title: "Monitoring", description: `${riskPct > 40 ? "Get liver function tests (ALT, AST, GGT), liver ultrasound, and FibroScan. Repeat every 6-12 months." : "Annual liver function tests at routine checkup."} Key marker: ALT elevation (>40 IU/L in men, >31 in women) suggests liver inflammation.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "BMI": b, "Waist": `${w}″`, "Trig": trig, "Alcohol": alcoholIntake, "Fat Acc": `${fatAccumProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fatty-liver-risk-calculator" title="Fatty Liver Risk Estimator"
      description="Estimate non-alcoholic fatty liver disease risk from BMI, waist, triglycerides, and alcohol intake."
      icon={Activity} calculate={calculate} onClear={() => { setBmi(29); setWaist(38); setTriglycerides(180); setAlcoholIntake("moderate"); setResult(null) }}
      values={[bmi, waist, triglycerides, alcoholIntake]} result={result}
      seoContent={<SeoContentGenerator title="Fatty Liver Risk Estimator" description="Assess NAFLD risk with metabolic markers." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={55} step={0.1} />
          <NumInput label="Waist Circumference" val={waist} set={setWaist} min={20} max={60} step={0.5} suffix="inches" />
        </div>
        <NumInput label="Triglycerides" val={triglycerides} set={setTriglycerides} min={30} max={600} suffix="mg/dL" />
        <SelectInput label="Alcohol Intake" val={alcoholIntake} set={setAlcoholIntake} options={[{ value: "none", label: "None" }, { value: "light", label: "Light (1-2/week)" }, { value: "moderate", label: "Moderate (3-7/week)" }, { value: "heavy", label: "Heavy (daily/binge)" }]} />
      </div>} />
  )
}

// ─── 10. Anemia Risk Estimator ────────────────────────────────────────────────
export function AnemiaRiskEstimator() {
  const [hemoglobin, setHemoglobin] = useState(11.5)
  const [ironIntake, setIronIntake] = useState("moderate")
  const [menstrualStatus, setMenstrualStatus] = useState("regular")
  const [gender, setGender] = useState("female")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hb = clamp(hemoglobin, 4, 20)
    const threshold = gender === "male" ? 13 : 12

    const classification = hb >= threshold ? "Normal" : hb >= threshold - 2 ? "Mild Anemia" : hb >= threshold - 4 ? "Moderate Anemia" : "Severe Anemia"
    const ironDefProb = r0(clamp(
      (hb < threshold ? 40 : 10) + (ironIntake === "low" ? 25 : ironIntake === "moderate" ? 10 : 0) +
      (menstrualStatus === "heavy" ? 20 : menstrualStatus === "regular" ? 5 : 0), 5, 90
    ))

    const status: 'good' | 'warning' | 'danger' = classification === "Normal" ? "good" : classification === "Mild Anemia" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Hemoglobin", value: `${hb} g/dL`, status, description: `${classification} — Threshold: ${threshold} g/dL` },
      healthScore: r0(clamp(hb / threshold * 100, 10, 100)),
      metrics: [
        { label: "Hemoglobin", value: hb, unit: "g/dL", status },
        { label: "Classification", value: classification, status },
        { label: "Iron Deficiency Probability", value: ironDefProb, unit: "%", status: ironDefProb < 25 ? "good" : ironDefProb < 50 ? "warning" : "danger" },
        { label: "Threshold", value: threshold, unit: "g/dL", status: "normal" },
        { label: "Iron Intake", value: ironIntake, status: ironIntake === "high" ? "good" : ironIntake === "moderate" ? "warning" : "danger" },
        { label: "Menstrual Factor", value: menstrualStatus === "none" ? "N/A" : menstrualStatus, status: menstrualStatus === "heavy" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Anemia Assessment", description: `Hemoglobin: ${hb} g/dL (${classification}). Normal: ≥${threshold} g/dL for ${gender}. ${hb < threshold ? "Anemia detected — CBC and iron studies recommended (serum ferritin, TIBC, serum iron). " : "Hemoglobin in normal range. "}Iron deficiency probability: ${ironDefProb}%. Iron deficiency is the most common nutritional deficiency worldwide.`, priority: "high", category: "Assessment" },
        { title: "Iron-Rich Diet", description: `${ironIntake !== "high" ? "INCREASE iron intake: red meat, liver, spinach, lentils, beans, fortified cereals. " : "Good iron intake. "}Vitamin C with iron foods increases absorption 3-6x. Avoid tea/coffee with meals (tannins block iron). ${hb < threshold - 2 ? "Iron supplementation likely needed — consult physician for dosage." : "Dietary changes may be sufficient."}`, priority: "high", category: "Nutrition" },
        { title: "Symptoms & Follow-up", description: `Common symptoms: fatigue, weakness, pale skin, shortness of breath, cold hands/feet, headache, dizziness. ${menstrualStatus === "heavy" ? "Heavy menstruation is major cause — discuss management with gynecologist." : ""} Recheck hemoglobin in 4-8 weeks after starting treatment. Target response: +1-2 g/dL per month.`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "Hb": `${hb} g/dL`, "Class": classification, "Iron Def": `${ironDefProb}%`, "Intake": ironIntake, "Menstrual": menstrualStatus }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="anemia-risk-calculator" title="Anemia Risk Estimator"
      description="Assess iron deficiency and anemia risk from hemoglobin levels, dietary iron intake, and menstrual status."
      icon={Droplets} calculate={calculate} onClear={() => { setHemoglobin(11.5); setIronIntake("moderate"); setMenstrualStatus("regular"); setGender("female"); setResult(null) }}
      values={[hemoglobin, ironIntake, menstrualStatus, gender]} result={result}
      seoContent={<SeoContentGenerator title="Anemia Risk Estimator" description="Assess anemia risk and iron deficiency probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Hemoglobin" val={hemoglobin} set={setHemoglobin} min={4} max={20} step={0.1} suffix="g/dL" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Iron Intake" val={ironIntake} set={setIronIntake} options={[{ value: "low", label: "Low (vegetarian/poor diet)" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (red meat, iron-rich)" }]} />
          <SelectInput label="Menstrual Status" val={menstrualStatus} set={setMenstrualStatus} options={[{ value: "none", label: "N/A" }, { value: "light", label: "Light" }, { value: "regular", label: "Regular" }, { value: "heavy", label: "Heavy" }]} />
        </div>
      </div>} />
  )
}
