"use client"

import { useState } from "react"
import { Activity, AlertCircle, Thermometer, Shield, Droplets, Zap, Heart } from "lucide-react"
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

// ─── 11. Thyroid Risk Calculator ──────────────────────────────────────────────
export function ThyroidRiskCalculator() {
  const [age, setAge] = useState(40)
  const [gender, setGender] = useState("female")
  const [familyHistory, setFamilyHistory] = useState("no")
  const [fatigue, setFatigue] = useState("moderate")
  const [weightChange, setWeightChange] = useState("gain")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 18, 90)

    let score = 0
    if (gender === "female") score += 2  // 5-8x more common in women
    if (a >= 60) score += 2; else if (a >= 40) score += 1
    if (familyHistory === "yes") score += 2
    if (fatigue === "severe") score += 2; else if (fatigue === "moderate") score += 1
    if (weightChange === "gain" || weightChange === "loss") score += 1

    const maxScore = 9
    const riskPct = r0(clamp(score * 9, 5, 80))
    const hypothyroidRisk = weightChange === "gain" ? r0(riskPct * 0.7) : r0(riskPct * 0.3)
    const hyperthyroidRisk = weightChange === "loss" ? r0(riskPct * 0.6) : r0(riskPct * 0.2)

    const label = score <= 2 ? "Low Risk" : score <= 5 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 2 ? "good" : score <= 5 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Thyroid Risk", value: `${riskPct}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Overall Risk", value: riskPct, unit: "%", status },
        { label: "Hypothyroid Risk", value: hypothyroidRisk, unit: "%", status: hypothyroidRisk < 20 ? "good" : hypothyroidRisk < 40 ? "warning" : "danger" },
        { label: "Hyperthyroid Risk", value: hyperthyroidRisk, unit: "%", status: hyperthyroidRisk < 15 ? "good" : hyperthyroidRisk < 30 ? "warning" : "danger" },
        { label: "Gender Factor", value: gender === "female" ? "Higher Risk" : "Standard", status: gender === "female" ? "warning" : "good" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive" : "None", status: familyHistory === "yes" ? "warning" : "good" },
        { label: "Fatigue Level", value: fatigue, status: fatigue === "none" ? "good" : fatigue === "mild" ? "good" : fatigue === "moderate" ? "warning" : "danger" },
        { label: "Weight Pattern", value: weightChange === "gain" ? "Gaining (hypo)" : weightChange === "loss" ? "Losing (hyper)" : "Stable", status: weightChange === "stable" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Thyroid Risk", description: `Risk: ${riskPct}% (${label}). ${gender === "female" ? "Women are 5-8x more likely to develop thyroid disease. " : ""}${familyHistory === "yes" ? "Family history significantly increases risk. " : ""}Hypothyroid risk: ${hypothyroidRisk}% (weight gain, fatigue, cold intolerance). Hyperthyroid risk: ${hyperthyroidRisk}% (weight loss, anxiety, heat intolerance).`, priority: "high", category: "Assessment" },
        { title: "Screening", description: `Get TSH blood test — single best screening test. Normal: 0.4-4.0 mIU/L. ${riskPct > 30 ? "TSH testing recommended NOW given elevated risk." : "Annual screening recommended."} If TSH abnormal: free T4, free T3, thyroid antibodies (TPO Ab for Hashimoto's, TSI for Graves'). ${a > 60 ? "After 60, screening every 1-2 years recommended." : ""}`, priority: "high", category: "Screening" },
        { title: "Symptoms to Watch", description: `Hypothyroid: fatigue, weight gain, constipation, dry skin, hair loss, cold sensitivity, brain fog, depression. Hyperthyroid: weight loss, anxiety, tremor, rapid heartbeat, heat intolerance, diarrhea, insomnia. ${fatigue === "severe" ? "Severe fatigue is a hallmark thyroid symptom — test TSH urgently." : ""} Thyroid disease is highly treatable once diagnosed.`, priority: "medium", category: "Symptoms" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Hypo": `${hypothyroidRisk}%`, "Hyper": `${hyperthyroidRisk}%`, "Score": `${score}/${maxScore}`, "Gender": gender }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="thyroid-risk-calculator" title="Thyroid Risk Calculator"
      description="Estimate thyroid disorder probability. Evaluates hypo/hyperthyroidism risk from symptoms, gender, age, and family history."
      icon={Thermometer} calculate={calculate} onClear={() => { setAge(40); setGender("female"); setFamilyHistory("no"); setFatigue("moderate"); setWeightChange("gain"); setResult(null) }}
      values={[age, gender, familyHistory, fatigue, weightChange]} result={result}
      seoContent={<SeoContentGenerator title="Thyroid Risk Calculator" description="Assess hypothyroid and hyperthyroid risk factors." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Family History (Thyroid)" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Fatigue Level" val={fatigue} set={setFatigue} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe" }]} />
        </div>
        <SelectInput label="Unexplained Weight Change" val={weightChange} set={setWeightChange} options={[{ value: "stable", label: "Stable" }, { value: "gain", label: "Gaining Weight" }, { value: "loss", label: "Losing Weight" }]} />
      </div>} />
  )
}

// ─── 13. Kidney Stone Risk Calculator ─────────────────────────────────────────
export function KidneyStoneRiskCalculator() {
  const [waterIntake, setWaterIntake] = useState("moderate")
  const [sodiumIntake, setSodiumIntake] = useState("high")
  const [proteinIntake, setProteinIntake] = useState("high")
  const [familyHistory, setFamilyHistory] = useState("no")
  const [priorStones, setPriorStones] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (waterIntake === "low") score += 3; else if (waterIntake === "moderate") score += 1
    if (sodiumIntake === "high") score += 2; else if (sodiumIntake === "moderate") score += 1
    if (proteinIntake === "high") score += 2; else if (proteinIntake === "moderate") score += 1
    if (familyHistory === "yes") score += 2
    if (priorStones === "yes") score += 3; else if (priorStones === "once") score += 2

    const maxScore = 12
    const riskPct = r0(clamp(score * 7, 3, 80))
    const recurrenceRate = priorStones !== "no" ? r0(clamp(50 + score * 3, 30, 85)) : 0
    
    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Kidney Stone Risk", value: `${riskPct}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Stone Risk", value: riskPct, unit: "%", status },
        { label: "Classification", value: label, status },
        { label: "Recurrence Rate", value: priorStones !== "no" ? `${recurrenceRate}%` : "N/A", status: recurrenceRate > 60 ? "danger" : recurrenceRate > 40 ? "warning" : "good" },
        { label: "Hydration", value: waterIntake, status: waterIntake === "high" ? "good" : waterIntake === "moderate" ? "warning" : "danger" },
        { label: "Sodium", value: sodiumIntake, status: sodiumIntake === "low" ? "good" : sodiumIntake === "moderate" ? "warning" : "danger" },
        { label: "Protein", value: proteinIntake, status: proteinIntake === "moderate" ? "good" : proteinIntake === "low" ? "good" : "warning" },
        { label: "Prior Stones", value: priorStones === "yes" ? "Multiple" : priorStones === "once" ? "Once" : "None", status: priorStones === "no" ? "good" : "danger" }
      ],
      recommendations: [
        { title: "Stone Risk", description: `Risk: ${riskPct}% (${label}). ${priorStones !== "no" ? "PRIOR STONES — recurrence rate: " + recurrenceRate + "%. 50% of stone formers have recurrence within 5-10 years." : ""} Most common types: calcium oxalate (80%), uric acid (10%), struvite (5%).`, priority: "high", category: "Risk" },
        { title: "Prevention", description: `1) ${waterIntake !== "high" ? "INCREASE water to 2.5-3L/day — urine should be pale yellow. Single most important prevention." : "Good hydration — maintain it."} 2) ${sodiumIntake !== "low" ? "REDUCE sodium <2300mg — sodium increases calcium excretion." : "Good sodium intake."} 3) ${proteinIntake === "high" ? "Moderate protein — excess animal protein increases uric acid and calcium." : "Protein intake OK."} 4) Lemon water (citrate prevents stone formation). 5) Adequate calcium (paradoxically, dietary calcium PREVENTS stones).`, priority: "high", category: "Prevention" },
        { title: "When to See Doctor", description: "Seek immediate care for: severe flank/back pain, blood in urine (hematuria), fever with pain (possible infection), inability to urinate. 24-hour urine analysis recommended for recurrent stone formers — identifies specific metabolic abnormalities for targeted prevention.", priority: "medium", category: "Emergency" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Score": `${score}/${maxScore}`, "Water": waterIntake, "Sodium": sodiumIntake, "Protein": proteinIntake, "Prior": priorStones }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="kidney-stone-risk" title="Kidney Stone Risk Calculator"
      description="Estimate kidney stone formation and recurrence risk from hydration, diet, sodium, and stone history."
      icon={AlertCircle} calculate={calculate} onClear={() => { setWaterIntake("moderate"); setSodiumIntake("high"); setProteinIntake("high"); setFamilyHistory("no"); setPriorStones("no"); setResult(null) }}
      values={[waterIntake, sodiumIntake, proteinIntake, familyHistory, priorStones]} result={result}
      seoContent={<SeoContentGenerator title="Kidney Stone Risk Calculator" description="Assess kidney stone risk and prevention strategies." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Water Intake" val={waterIntake} set={setWaterIntake} options={[{ value: "low", label: "Low (<1.5L/day)" }, { value: "moderate", label: "Moderate (1.5-2.5L)" }, { value: "high", label: "High (>2.5L)" }]} />
          <SelectInput label="Sodium Intake" val={sodiumIntake} set={setSodiumIntake} options={[{ value: "low", label: "Low (<1500mg)" }, { value: "moderate", label: "Moderate (1500-3000mg)" }, { value: "high", label: "High (>3000mg)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Protein Intake" val={proteinIntake} set={setProteinIntake} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (meat-heavy)" }]} />
          <SelectInput label="Family History (Stones)" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <SelectInput label="Prior Kidney Stones" val={priorStones} set={setPriorStones} options={[{ value: "no", label: "Never" }, { value: "once", label: "Once" }, { value: "yes", label: "Multiple Times" }]} />
      </div>} />
  )
}

// ─── 14. Liver Function Score Calculator ──────────────────────────────────────
export function LiverFunctionScoreCalculator() {
  const [alt, setAlt] = useState(45)
  const [ast, setAst] = useState(40)
  const [bilirubin, setBilirubin] = useState(1.2)
  const [albumin, setAlbumin] = useState(3.8)
  const [alcoholUse, setAlcoholUse] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(alt, 5, 500)
    const s = clamp(ast, 5, 500)
    const bil = clamp(bilirubin, 0.1, 15)
    const alb = clamp(albumin, 1.5, 5.5)

    let score = 0
    if (a > 56) score += 3; else if (a > 40) score += 2; else if (a > 33) score += 1
    if (s > 48) score += 3; else if (s > 35) score += 2; else if (s > 25) score += 1
    if (bil > 2.0) score += 3; else if (bil > 1.2) score += 2; else if (bil > 0.8) score += 1
    if (alb < 2.8) score += 3; else if (alb < 3.5) score += 2; else if (alb < 4.0) score += 1
    if (alcoholUse === "heavy") score += 3; else if (alcoholUse === "moderate") score += 1

    const maxScore = 15
    const liverScore = r0(clamp(100 - (score / maxScore) * 80, 10, 100))
    const astAltRatio = r2(s / a)
    const deRitisInterpretation = astAltRatio > 2 ? "Alcoholic liver disease likely" : astAltRatio > 1 ? "Possible cirrhosis/advanced fibrosis" : "Hepatocellular pattern (NAFLD, viral)"

    const label = score <= 4 ? "Normal" : score <= 8 ? "Mild Impairment" : score <= 11 ? "Moderate Impairment" : "Severe Impairment"
    const status: 'good' | 'warning' | 'danger' = score <= 4 ? "good" : score <= 8 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Liver Function Score", value: `${liverScore}/100`, status, description: label },
      healthScore: liverScore,
      metrics: [
        { label: "Liver Score", value: liverScore, unit: "/100", status },
        { label: "Classification", value: label, status },
        { label: "ALT", value: a, unit: "IU/L", status: a < 33 ? "good" : a < 56 ? "warning" : "danger" },
        { label: "AST", value: s, unit: "IU/L", status: s < 25 ? "good" : s < 48 ? "warning" : "danger" },
        { label: "Bilirubin", value: bil, unit: "mg/dL", status: bil < 1.2 ? "good" : bil < 2.0 ? "warning" : "danger" },
        { label: "Albumin", value: alb, unit: "g/dL", status: alb >= 3.5 ? "good" : alb >= 2.8 ? "warning" : "danger" },
        { label: "AST/ALT Ratio", value: astAltRatio, status: astAltRatio > 2 ? "danger" : astAltRatio > 1 ? "warning" : "good" },
        { label: "De Ritis", value: deRitisInterpretation, status: astAltRatio > 2 ? "danger" : astAltRatio > 1 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Liver Function", description: `Score: ${liverScore}/100 (${label}). AST/ALT (De Ritis) ratio: ${astAltRatio} — ${deRitisInterpretation}. ${score > 8 ? "ABNORMAL — gastroenterologist/hepatologist referral recommended." : score > 4 ? "Mild abnormalities — monitor and address causes." : "Values within normal range."}`, priority: "high", category: "Assessment" },
        { title: "Liver Protection", description: `1) ${alcoholUse !== "none" ? "REDUCE alcohol — primary cause of preventable liver disease. " : ""}2) Maintain healthy weight (NAFLD is leading cause). 3) Avoid acetaminophen overuse (max 3g/day). 4) Hepatitis B/C screening if not done. 5) ${bil > 1.2 ? "Elevated bilirubin — rule out Gilbert syndrome, hemolysis, or obstruction. " : ""}6) ${alb < 3.5 ? "Low albumin suggests impaired liver synthesis — assess for chronic disease." : ""}`, priority: "high", category: "Management" },
        { title: "Further Testing", description: `${score > 4 ? "Recommended: complete hepatic panel, viral hepatitis screen (HBsAg, anti-HCV), liver ultrasound." : "Routine monitoring at annual checkup."} ${astAltRatio > 2 ? "ALD suspected — GGT, CDT, and MCV may help confirm." : ""} FibroScan or FIB-4 index for fibrosis staging if chronic elevation.`, priority: "medium", category: "Testing" }
      ],
      detailedBreakdown: { "Score": `${liverScore}/100`, "ALT": a, "AST": s, "Bilirubin": bil, "Albumin": alb, "De Ritis": astAltRatio }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="liver-function-score" title="Liver Function Score Calculator"
      description="Evaluate liver health from ALT, AST, bilirubin, albumin, and alcohol use. Includes AST/ALT De Ritis ratio analysis."
      icon={Activity} calculate={calculate} onClear={() => { setAlt(45); setAst(40); setBilirubin(1.2); setAlbumin(3.8); setAlcoholUse("moderate"); setResult(null) }}
      values={[alt, ast, bilirubin, albumin, alcoholUse]} result={result}
      seoContent={<SeoContentGenerator title="Liver Function Score Calculator" description="Assess liver health with ALT, AST, bilirubin, and albumin." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="ALT" val={alt} set={setAlt} min={5} max={500} suffix="IU/L" />
          <NumInput label="AST" val={ast} set={setAst} min={5} max={500} suffix="IU/L" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Bilirubin" val={bilirubin} set={setBilirubin} min={0.1} max={15} step={0.1} suffix="mg/dL" />
          <NumInput label="Albumin" val={albumin} set={setAlbumin} min={1.5} max={5.5} step={0.1} suffix="g/dL" />
        </div>
        <SelectInput label="Alcohol Use" val={alcoholUse} set={setAlcoholUse} options={[{ value: "none", label: "None" }, { value: "light", label: "Light (1-2/week)" }, { value: "moderate", label: "Moderate (3-7/week)" }, { value: "heavy", label: "Heavy (daily)" }]} />
      </div>} />
  )
}

// ─── 15. Immune Score Calculator ──────────────────────────────────────────────
export function ImmuneScoreCalculator() {
  const [sleepHours, setSleepHours] = useState(6)
  const [stressLevel, setStressLevel] = useState("high")
  const [exercise, setExercise] = useState("low")
  const [diet, setDiet] = useState("moderate")
  const [illness, setIllness] = useState("sometimes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sleep = clamp(sleepHours, 3, 12)

    let score = 50  // base immune score

    // Sleep: 7-9h optimal
    if (sleep >= 7 && sleep <= 9) score += 15; else if (sleep >= 6) score += 5; else score -= 10

    // Stress
    if (stressLevel === "low") score += 15; else if (stressLevel === "moderate") score += 5; else score -= 10

    // Exercise
    if (exercise === "high") score += 15; else if (exercise === "moderate") score += 10; else score -= 5

    // Diet
    if (diet === "excellent") score += 15; else if (diet === "good") score += 10; else if (diet === "moderate") score += 0; else score -= 10

    // Illness frequency
    if (illness === "rarely") score += 10; else if (illness === "sometimes") score -= 5; else score -= 15

    score = r0(clamp(score, 10, 100))
    const innateImmunity = r0(clamp(score + (exercise === "high" ? 5 : 0), 10, 100))
    const adaptiveImmunity = r0(clamp(score + (sleep >= 7 ? 5 : -5), 10, 100))
    const infectionRisk = r0(clamp(100 - score, 5, 90))

    const label = score >= 80 ? "Strong" : score >= 60 ? "Moderate" : score >= 40 ? "Weak" : "Compromised"
    const status: 'good' | 'warning' | 'danger' = score >= 70 ? "good" : score >= 50 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Immune Score", value: `${score}/100`, status, description: `${label} Immune Function` },
      healthScore: score,
      metrics: [
        { label: "Immune Score", value: score, unit: "/100", status },
        { label: "Classification", value: label, status },
        { label: "Innate Immunity", value: innateImmunity, unit: "/100", status: innateImmunity >= 70 ? "good" : innateImmunity >= 50 ? "warning" : "danger" },
        { label: "Adaptive Immunity", value: adaptiveImmunity, unit: "/100", status: adaptiveImmunity >= 70 ? "good" : adaptiveImmunity >= 50 ? "warning" : "danger" },
        { label: "Infection Risk", value: infectionRisk, unit: "%", status: infectionRisk < 30 ? "good" : infectionRisk < 50 ? "warning" : "danger" },
        { label: "Sleep Quality", value: sleep >= 7 ? "Adequate" : "Insufficient", status: sleep >= 7 ? "good" : "danger" },
        { label: "Stress Impact", value: stressLevel, status: stressLevel === "low" ? "good" : stressLevel === "moderate" ? "warning" : "danger" },
        { label: "Illness Frequency", value: illness, status: illness === "rarely" ? "good" : illness === "sometimes" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Immune Assessment", description: `Immune score: ${score}/100 (${label}). Infection susceptibility: ${infectionRisk}%. ${score < 50 ? "WEAK immune function — multiple lifestyle changes needed." : score < 70 ? "Room for improvement in immune resilience." : "Good immune function — maintain current habits."} Innate: ${innateImmunity}, Adaptive: ${adaptiveImmunity}.`, priority: "high", category: "Assessment" },
        { title: "Immune Boosting", description: `Priority actions: 1) ${sleep < 7 ? "SLEEP 7-9 hours — sleep deprivation reduces natural killer cells by 70%." : "Sleep is adequate."} 2) ${stressLevel === "high" ? "REDUCE stress — cortisol suppresses immune cell function." : "Stress management adequate."} 3) ${exercise === "low" ? "Exercise 150min/week — boosts immune cell circulation." : "Exercise level good."} 4) ${diet !== "excellent" && diet !== "good" ? "Improve diet — fruits, vegetables, zinc, vitamin C, vitamin D." : "Diet is good."} 5) Stay hydrated. 6) Maintain healthy gut (probiotics, fiber).`, priority: "high", category: "Lifestyle" },
        { title: "Supplements & Prevention", description: `Key nutrients for immunity: Vitamin D (2000 IU/day if deficient), Vitamin C (500mg/day), Zinc (15mg/day), Elderberry. ${illness !== "rarely" ? "Frequent illness suggests immune deficiency — consider CBC with differential and immunoglobulin levels." : ""} Vaccines: ensure up-to-date (flu shot annually). Hand hygiene is simplest immune protection.`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Score": `${score}/100`, "Innate": innateImmunity, "Adaptive": adaptiveImmunity, "Infection": `${infectionRisk}%`, "Sleep": `${sleep}h`, "Stress": stressLevel }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="immune-score-calculator" title="Immune Score Calculator"
      description="Evaluate immune system strength from sleep, stress, exercise, diet, and illness frequency."
      icon={Shield} calculate={calculate} onClear={() => { setSleepHours(6); setStressLevel("high"); setExercise("low"); setDiet("moderate"); setIllness("sometimes"); setResult(null) }}
      values={[sleepHours, stressLevel, exercise, diet, illness]} result={result}
      seoContent={<SeoContentGenerator title="Immune Score Calculator" description="Assess immune system health and infection susceptibility." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sleep Hours" val={sleepHours} set={setSleepHours} min={3} max={12} step={0.5} suffix="hours/night" />
          <SelectInput label="Stress Level" val={stressLevel} set={setStressLevel} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Exercise" val={exercise} set={setExercise} options={[{ value: "low", label: "Low (<2 days/week)" }, { value: "moderate", label: "Moderate (3-4 days)" }, { value: "high", label: "High (5+ days)" }]} />
          <SelectInput label="Diet Quality" val={diet} set={setDiet} options={[{ value: "poor", label: "Poor (processed foods)" }, { value: "moderate", label: "Moderate" }, { value: "good", label: "Good" }, { value: "excellent", label: "Excellent (whole foods)" }]} />
        </div>
        <SelectInput label="How Often Do You Get Sick?" val={illness} set={setIllness} options={[{ value: "rarely", label: "Rarely (1-2x/year)" }, { value: "sometimes", label: "Sometimes (3-5x)" }, { value: "frequently", label: "Frequently (6+)" }]} />
      </div>} />
  )
}

// ─── 16. Vitamin Deficiency Risk Calculator ───────────────────────────────────
export function VitaminDeficiencyCalculator() {
  const [diet, setDiet] = useState("mixed")
  const [sunExposure, setSunExposure] = useState("low")
  const [fatigue, setFatigue] = useState("moderate")
  const [dairyIntake, setDairyIntake] = useState("low")
  const [fruitVegIntake, setFruitVegIntake] = useState("low")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    // Vitamin D risk
    let vitDRisk = 20
    if (sunExposure === "low") vitDRisk += 30; else if (sunExposure === "moderate") vitDRisk += 10
    if (dairyIntake === "low") vitDRisk += 15; else if (dairyIntake === "moderate") vitDRisk += 5
    if (diet === "vegan") vitDRisk += 10
    vitDRisk = r0(clamp(vitDRisk, 5, 90))

    // Vitamin B12 risk
    let b12Risk = 10
    if (diet === "vegan") b12Risk += 45; else if (diet === "vegetarian") b12Risk += 25
    if (fatigue === "severe") b12Risk += 15; else if (fatigue === "moderate") b12Risk += 5
    b12Risk = r0(clamp(b12Risk, 5, 85))

    // Iron deficiency risk
    let ironRisk = 15
    if (diet === "vegan") ironRisk += 20; else if (diet === "vegetarian") ironRisk += 15
    if (fruitVegIntake === "low") ironRisk += 10
    if (fatigue === "severe") ironRisk += 10
    ironRisk = r0(clamp(ironRisk, 5, 80))

    // Vitamin C risk
    let vitCRisk = 10
    if (fruitVegIntake === "low") vitCRisk += 30; else if (fruitVegIntake === "moderate") vitCRisk += 10
    vitCRisk = r0(clamp(vitCRisk, 5, 60))

    const overallRisk = r0(clamp((vitDRisk + b12Risk + ironRisk + vitCRisk) / 4, 5, 85))
    const label = overallRisk < 25 ? "Low Risk" : overallRisk < 45 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = overallRisk < 25 ? "good" : overallRisk < 45 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Deficiency Risk", value: `${overallRisk}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - overallRisk)),
      metrics: [
        { label: "Overall Risk", value: overallRisk, unit: "%", status },
        { label: "Vitamin D Risk", value: vitDRisk, unit: "%", status: vitDRisk < 25 ? "good" : vitDRisk < 50 ? "warning" : "danger" },
        { label: "Vitamin B12 Risk", value: b12Risk, unit: "%", status: b12Risk < 20 ? "good" : b12Risk < 40 ? "warning" : "danger" },
        { label: "Iron Deficiency Risk", value: ironRisk, unit: "%", status: ironRisk < 25 ? "good" : ironRisk < 45 ? "warning" : "danger" },
        { label: "Vitamin C Risk", value: vitCRisk, unit: "%", status: vitCRisk < 15 ? "good" : vitCRisk < 30 ? "warning" : "danger" },
        { label: "Diet Type", value: diet, status: diet === "mixed" ? "good" : diet === "vegetarian" ? "warning" : diet === "vegan" ? "danger" : "good" },
        { label: "Sun Exposure", value: sunExposure, status: sunExposure === "high" ? "good" : sunExposure === "moderate" ? "warning" : "danger" },
        { label: "Fruit/Veg Intake", value: fruitVegIntake, status: fruitVegIntake === "high" ? "good" : fruitVegIntake === "moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Deficiency Overview", description: `Overall risk: ${overallRisk}%. Top concerns: ${vitDRisk >= b12Risk && vitDRisk >= ironRisk ? `Vitamin D (${vitDRisk}%)` : b12Risk >= ironRisk ? `B12 (${b12Risk}%)` : `Iron (${ironRisk}%)`}. ${diet === "vegan" ? "Vegan diet significantly increases B12 and iron risk — supplementation essential." : diet === "vegetarian" ? "Vegetarian diet increases B12 and iron risk." : "Mixed diet provides most nutrients."} Blood test recommended to confirm actual levels.`, priority: "high", category: "Assessment" },
        { title: "Vitamin D", description: `Risk: ${vitDRisk}%. ${sunExposure === "low" ? "LOW SUN EXPOSURE — major cause of deficiency. Get 15-20 min direct sunlight daily or supplement 1000-2000 IU/day." : "Adequate sun exposure but supplement in winter."} ${dairyIntake === "low" ? "Low dairy — fortified foods or supplements recommended." : ""} Target blood level: 30-50 ng/mL. Test: 25-hydroxy vitamin D.`, priority: "high", category: "Vitamin D" },
        { title: "B12, Iron & Other", description: `B12 risk: ${b12Risk}%. ${b12Risk > 30 ? "B12 supplementation recommended (2.4 mcg/day). Sources: meat, eggs, dairy, fortified foods." : "B12 likely adequate."} Iron risk: ${ironRisk}%. ${ironRisk > 30 ? "Iron-rich foods: red meat, spinach, lentils, fortified cereals. Pair with vitamin C for absorption." : "Iron likely adequate."} Vitamin C risk: ${vitCRisk}%. ${fruitVegIntake === "low" ? "Eat more fruits/vegetables — aim for 5+ servings/day." : "Produce intake adequate."}`, priority: "medium", category: "Nutrients" }
      ],
      detailedBreakdown: { "Overall": `${overallRisk}%`, "Vit D": `${vitDRisk}%`, "B12": `${b12Risk}%`, "Iron": `${ironRisk}%`, "Vit C": `${vitCRisk}%`, "Diet": diet }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vitamin-deficiency-check" title="Vitamin Deficiency Risk Calculator"
      description="Check risk of common vitamin and mineral deficiencies based on diet, sun exposure, and food intake patterns."
      icon={Zap} calculate={calculate} onClear={() => { setDiet("mixed"); setSunExposure("low"); setFatigue("moderate"); setDairyIntake("low"); setFruitVegIntake("low"); setResult(null) }}
      values={[diet, sunExposure, fatigue, dairyIntake, fruitVegIntake]} result={result}
      seoContent={<SeoContentGenerator title="Vitamin Deficiency Risk Calculator" description="Assess risk of vitamin D, B12, iron, and vitamin C deficiencies." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Diet Type" val={diet} set={setDiet} options={[{ value: "mixed", label: "Mixed (omnivore)" }, { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" }]} />
          <SelectInput label="Sun Exposure" val={sunExposure} set={setSunExposure} options={[{ value: "low", label: "Low (mostly indoors)" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (outdoor daily)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Dairy/Fortified Foods" val={dairyIntake} set={setDairyIntake} options={[{ value: "low", label: "Low (rarely)" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (daily)" }]} />
          <SelectInput label="Fruit/Vegetable Intake" val={fruitVegIntake} set={setFruitVegIntake} options={[{ value: "low", label: "Low (<3 servings)" }, { value: "moderate", label: "Moderate (3-5)" }, { value: "high", label: "High (5+)" }]} />
        </div>
        <SelectInput label="Fatigue Level" val={fatigue} set={setFatigue} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe" }]} />
      </div>} />
  )
}
