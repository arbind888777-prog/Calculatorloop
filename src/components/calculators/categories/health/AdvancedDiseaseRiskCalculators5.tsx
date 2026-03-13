"use client"

import { useState } from "react"
import { Activity, Heart, AlertCircle, Shield, Droplets, Zap } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

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

function NumInput({ label, val, set, min, max, step, suffix }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}{suffix && <span className="text-muted-foreground ml-1">({suffix})</span>}</label>
      <input type="number" value={val} onChange={e => set(Number(e.target.value))} min={min} max={max} step={step ?? 1}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

// ─── 23. CHA₂DS₂-VASc Score ──────────────────────────────────────────────────
export function CHADS2VASCScoreCalculator() {
  const [chf, setChf] = useState("no")
  const [hypertension, setHypertension] = useState("yes")
  const [age, setAge] = useState("65_74")
  const [diabetes, setDiabetes] = useState("no")
  const [strokeHistory, setStrokeHistory] = useState("no")
  const [vascularDisease, setVascularDisease] = useState("no")
  const [sex, setSex] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (chf === "yes") score += 1             // C
    if (hypertension === "yes") score += 1    // H
    if (age === "75_plus") score += 2         // A₂
    else if (age === "65_74") score += 1      // A
    if (diabetes === "yes") score += 1        // D
    if (strokeHistory === "yes") score += 2   // S₂
    if (vascularDisease === "yes") score += 1 // V
    if (sex === "female") score += 1          // Sc

    // Annual stroke risk % based on score
    const strokeRates: Record<number, number> = { 0: 0, 1: 1.3, 2: 2.2, 3: 3.2, 4: 4.0, 5: 6.7, 6: 9.8, 7: 9.6, 8: 12.5, 9: 15.2 }
    const annualStrokeRisk = r1(strokeRates[clamp(score, 0, 9)] ?? 15)

    const anticoag = score === 0 ? "No anticoagulation needed" : score === 1 ? (sex === "male" ? "Consider anticoagulation (OAC preferred)" : "No anticoagulation (score 1 from female sex alone)") : "Oral anticoagulation recommended"

    const status: 'good' | 'warning' | 'danger' = score === 0 ? "good" : score <= 2 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "CHA₂DS₂-VASc Score", value: `${score}/9`, status, description: `Annual Stroke Risk: ${annualStrokeRisk}%` },
      healthScore: Math.max(5, r0(100 - score * 11)),
      metrics: [
        { label: "Score", value: `${score}/9`, status },
        { label: "Annual Stroke Risk", value: annualStrokeRisk, unit: "%", status: annualStrokeRisk < 2 ? "good" : annualStrokeRisk < 5 ? "warning" : "danger" },
        { label: "Anticoagulation", value: anticoag, status: score >= 2 ? "danger" : score === 0 ? "good" : "warning" },
        { label: "CHF (+1)", value: chf === "yes" ? "Yes ✗" : "No ✓", status: chf === "yes" ? "danger" : "good" },
        { label: "Hypertension (+1)", value: hypertension === "yes" ? "Yes ✗" : "No ✓", status: hypertension === "yes" ? "danger" : "good" },
        { label: "Age", value: age === "75_plus" ? "≥75 (+2)" : age === "65_74" ? "65-74 (+1)" : "<65 (+0)", status: age === "75_plus" ? "danger" : age === "65_74" ? "warning" : "good" },
        { label: "Diabetes (+1)", value: diabetes === "yes" ? "Yes ✗" : "No ✓", status: diabetes === "yes" ? "danger" : "good" },
        { label: "Stroke/TIA (+2)", value: strokeHistory === "yes" ? "Yes ✗" : "No ✓", status: strokeHistory === "yes" ? "danger" : "good" },
        { label: "Vascular Disease (+1)", value: vascularDisease === "yes" ? "Yes ✗" : "No ✓", status: vascularDisease === "yes" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Stroke Risk in AF", description: `CHA₂DS₂-VASc: ${score}/9. Annual stroke risk: ${annualStrokeRisk}%. ${score >= 2 ? "ORAL ANTICOAGULATION RECOMMENDED (DOAC preferred over warfarin): apixaban, rivaroxaban, edoxaban, or dabigatran." : score === 1 ? "Consider OAC — benefit likely outweighs bleeding risk." : "Low risk — no anticoagulation needed. Reassess annually."}`, priority: "high", category: "Treatment" },
        { title: "DOAC vs Warfarin", description: `${score >= 2 ? "Direct oral anticoagulants (DOACs) preferred: fewer drug interactions, no INR monitoring, lower intracranial bleeding risk. Warfarin only if mechanical valve or moderate-severe mitral stenosis." : ""} ${strokeHistory === "yes" ? "Prior stroke/TIA is highest risk factor (+2 points) — anticoagulation is mandatory." : ""} Bleeding risk: assess with HAS-BLED score concurrently.`, priority: "high", category: "Clinical" },
        { title: "AF Management", description: "Rate control (beta-blocker/CCB) vs rhythm control (ablation, antiarrhythmics) is independent decision from anticoagulation. Anticoagulation is based on stroke risk, NOT symptoms. Even paroxysmal AF carries same stroke risk. Screen for modifiable risk factors: BP control, weight management, sleep apnea treatment, alcohol reduction.", priority: "medium", category: "Management" }
      ],
      detailedBreakdown: { "Score": `${score}/9`, "Stroke/yr": `${annualStrokeRisk}%`, "CHF": chf, "HTN": hypertension, "DM": diabetes, "Stroke Hx": strokeHistory, "Vasc": vascularDisease }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="chads2-vasc-score" title="CHA₂DS₂-VASc Score Calculator"
      description="Calculate stroke risk in atrial fibrillation patients. Guides anticoagulation therapy decisions."
      icon={Heart} calculate={calculate} onClear={() => { setChf("no"); setHypertension("yes"); setAge("65_74"); setDiabetes("no"); setStrokeHistory("no"); setVascularDisease("no"); setSex("male"); setResult(null) }}
      values={[chf, hypertension, age, diabetes, strokeHistory, vascularDisease, sex]} result={result}
      seoContent={<SeoContentGenerator title="CHA₂DS₂-VASc Score" description="Stroke risk calculator for atrial fibrillation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Congestive Heart Failure" val={chf} set={setChf} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Hypertension" val={hypertension} set={setHypertension} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Age" val={age} set={setAge} options={[{ value: "under_65", label: "<65 years (+0)" }, { value: "65_74", label: "65-74 years (+1)" }, { value: "75_plus", label: "≥75 years (+2)" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Stroke/TIA History" val={strokeHistory} set={setStrokeHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+2)" }]} />
          <SelectInput label="Vascular Disease" val={vascularDisease} set={setVascularDisease} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <SelectInput label="Sex" val={sex} set={setSex} options={[{ value: "male", label: "Male (+0)" }, { value: "female", label: "Female (+1)" }]} />
      </div>} />
  )
}

// ─── 24. HAS-BLED Score ───────────────────────────────────────────────────────
export function HASBLEDScoreCalculator() {
  const [hypertension, setHypertension] = useState("yes")
  const [renalDisease, setRenalDisease] = useState("no")
  const [liverDisease, setLiverDisease] = useState("no")
  const [strokeHistory, setStrokeHistory] = useState("no")
  const [bleedingHistory, setBleedingHistory] = useState("no")
  const [labileINR, setLabileINR] = useState("no")
  const [age, setAge] = useState("under_65")
  const [alcoholUse, setAlcoholUse] = useState("no")
  const [medications, setMedications] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (hypertension === "yes") score += 1          // H
    if (renalDisease === "yes") score += 1          // A (abnormal renal)
    if (liverDisease === "yes") score += 1          // A (abnormal liver)
    if (strokeHistory === "yes") score += 1         // S
    if (bleedingHistory === "yes") score += 1       // B
    if (labileINR === "yes") score += 1             // L
    if (age === "65_plus") score += 1               // E (elderly)
    if (alcoholUse === "yes") score += 1            // D (drugs/alcohol)
    if (medications === "yes") score += 1           // D (drugs - antiplatelet/NSAIDs)

    const maxScore = 9
    const bleedRates: Record<number, number> = { 0: 1.1, 1: 1.0, 2: 1.9, 3: 3.7, 4: 8.7, 5: 12.5, 6: 12.5, 7: 12.5, 8: 12.5, 9: 12.5 }
    const annualBleedRisk = r1(bleedRates[clamp(score, 0, 9)] ?? 12.5)

    const classification = score <= 2 ? "Low Bleeding Risk" : "High Bleeding Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 1 ? "good" : score <= 2 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "HAS-BLED Score", value: `${score}/${maxScore}`, status, description: `${classification} — Annual Major Bleed: ${annualBleedRisk}%` },
      healthScore: Math.max(5, r0(100 - score * 11)),
      metrics: [
        { label: "Score", value: `${score}/${maxScore}`, status },
        { label: "Annual Bleed Risk", value: annualBleedRisk, unit: "%", status: annualBleedRisk < 2 ? "good" : annualBleedRisk < 5 ? "warning" : "danger" },
        { label: "Classification", value: classification, status: score <= 2 ? "good" : "danger" },
        { label: "Hypertension", value: hypertension === "yes" ? "+1" : "0", status: hypertension === "yes" ? "warning" : "good" },
        { label: "Renal Disease", value: renalDisease === "yes" ? "+1" : "0", status: renalDisease === "yes" ? "danger" : "good" },
        { label: "Liver Disease", value: liverDisease === "yes" ? "+1" : "0", status: liverDisease === "yes" ? "danger" : "good" },
        { label: "Stroke History", value: strokeHistory === "yes" ? "+1" : "0", status: strokeHistory === "yes" ? "danger" : "good" },
        { label: "Bleeding History", value: bleedingHistory === "yes" ? "+1" : "0", status: bleedingHistory === "yes" ? "danger" : "good" },
        { label: "Labile INR", value: labileINR === "yes" ? "+1" : "0", status: labileINR === "yes" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Bleeding Risk", description: `HAS-BLED: ${score}/9 (${classification}). Annual major bleeding: ${annualBleedRisk}%. ${score >= 3 ? "HIGH RISK — does NOT contraindicate anticoagulation, but warrants closer monitoring and addressing modifiable risk factors." : "Acceptable bleeding risk for anticoagulation if indicated."} HAS-BLED is used alongside CHA₂DS₂-VASc to balance stroke vs bleeding risk.`, priority: "high", category: "Assessment" },
        { title: "Modifiable Factors", description: `Address modifiable risks: ${hypertension === "yes" ? "BP control (<160 systolic). " : ""}${renalDisease === "yes" || liverDisease === "yes" ? "Optimize organ function. " : ""}${labileINR === "yes" ? "Improve INR control (consider DOAC instead of warfarin). " : ""}${alcoholUse === "yes" ? "REDUCE alcohol — major modifiable bleeding risk. " : ""}${medications === "yes" ? "Review concurrent antiplatelet/NSAID use — avoid if possible." : ""}`, priority: "high", category: "Management" },
        { title: "Clinical Practice", description: `High HAS-BLED (≥3) means: 1) More frequent monitoring (INR weekly if on warfarin). 2) Prefer DOAC over warfarin (better safety). 3) Avoid concurrent aspirin unless truly indicated. 4) GI protection (PPI if needed). 5) Fall risk assessment. Score should be reassessed regularly as risk factors change.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Score": `${score}/9`, "Bleed Risk": `${annualBleedRisk}%`, "HTN": hypertension, "Renal": renalDisease, "Liver": liverDisease, "Alcohol": alcoholUse }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="has-bled-score" title="HAS-BLED Score Calculator"
      description="Estimate bleeding risk during anticoagulation therapy. Essential companion to CHA₂DS₂-VASc for AF management."
      icon={Droplets} calculate={calculate} onClear={() => { setHypertension("yes"); setRenalDisease("no"); setLiverDisease("no"); setStrokeHistory("no"); setBleedingHistory("no"); setLabileINR("no"); setAge("under_65"); setAlcoholUse("no"); setMedications("no"); setResult(null) }}
      values={[hypertension, renalDisease, liverDisease, strokeHistory, bleedingHistory, labileINR, age, alcoholUse, medications]} result={result}
      seoContent={<SeoContentGenerator title="HAS-BLED Score" description="Bleeding risk assessment for anticoagulation therapy." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Hypertension (>160 systolic)" val={hypertension} set={setHypertension} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Abnormal Renal Function" val={renalDisease} set={setRenalDisease} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Abnormal Liver Function" val={liverDisease} set={setLiverDisease} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Stroke History" val={strokeHistory} set={setStrokeHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Bleeding History" val={bleedingHistory} set={setBleedingHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Labile INR (if on warfarin)" val={labileINR} set={setLabileINR} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Age" val={age} set={setAge} options={[{ value: "under_65", label: "<65 years" }, { value: "65_plus", label: "≥65 years (+1)" }]} />
          <SelectInput label="Alcohol (≥8 drinks/week)" val={alcoholUse} set={setAlcoholUse} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <SelectInput label="Concurrent Antiplatelet/NSAID" val={medications} set={setMedications} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
      </div>} />
  )
}

// ─── 25. Wells Score (DVT) ────────────────────────────────────────────────────
export function WellsScoreDVTCalculator() {
  const [legSwelling, setLegSwelling] = useState("yes")
  const [calfTenderness, setCalfTenderness] = useState("yes")
  const [immobilization, setImmobilization] = useState("no")
  const [cancer, setCancer] = useState("no")
  const [pittingEdema, setPittingEdema] = useState("no")
  const [collateralVeins, setCollateralVeins] = useState("no")
  const [recentSurgery, setRecentSurgery] = useState("no")
  const [altDiagnosis, setAltDiagnosis] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (legSwelling === "yes") score += 1
    if (calfTenderness === "yes") score += 1
    if (immobilization === "yes") score += 1
    if (cancer === "yes") score += 1
    if (pittingEdema === "yes") score += 1
    if (collateralVeins === "yes") score += 1
    if (recentSurgery === "yes") score += 1
    if (altDiagnosis === "yes") score -= 2

    score = clamp(score, -2, 7)
    const probability = score <= 0 ? 5 : score <= 1 ? 17 : score <= 2 ? 17 : score >= 3 ? 53 : 17
    const classification = score <= 0 ? "Low Probability" : score <= 2 ? "Moderate Probability" : "High Probability"
    const status: 'good' | 'warning' | 'danger' = score <= 0 ? "good" : score <= 2 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Wells Score (DVT)", value: `${score}`, status, description: `${classification} — DVT Prevalence: ~${probability}%` },
      healthScore: Math.max(5, r0(100 - probability)),
      metrics: [
        { label: "Wells Score", value: score, status },
        { label: "Classification", value: classification, status },
        { label: "DVT Prevalence", value: probability, unit: "%", status },
        { label: "Leg Swelling", value: legSwelling === "yes" ? "+1" : "0", status: legSwelling === "yes" ? "warning" : "good" },
        { label: "Calf Tenderness", value: calfTenderness === "yes" ? "+1" : "0", status: calfTenderness === "yes" ? "warning" : "good" },
        { label: "Immobilization", value: immobilization === "yes" ? "+1" : "0", status: immobilization === "yes" ? "warning" : "good" },
        { label: "Active Cancer", value: cancer === "yes" ? "+1" : "0", status: cancer === "yes" ? "danger" : "good" },
        { label: "Alt Diagnosis Likely", value: altDiagnosis === "yes" ? "-2" : "0", status: altDiagnosis === "yes" ? "good" : "normal" }
      ],
      recommendations: [
        { title: "DVT Assessment", description: `Wells DVT score: ${score} (${classification}). Expected DVT prevalence: ~${probability}%. ${score >= 3 ? "HIGH PROBABILITY — proceed directly to compression ultrasound." : score >= 1 ? "MODERATE — D-dimer test first. If positive, ultrasound." : "LOW — D-dimer test. If negative, DVT safely excluded."}`, priority: "high", category: "Workup" },
        { title: "Diagnostic Algorithm", description: `${score <= 0 ? "Low risk: D-dimer → if negative, stop (NPV ~99%). If positive → ultrasound." : score <= 2 ? "Moderate risk: D-dimer → if negative, stop. If positive → ultrasound. Consider age-adjusted D-dimer (age × 10 for >50)." : "High risk: Skip D-dimer (too many false negatives). Proceed to duplex ultrasound. If negative but high suspicion → repeat ultrasound in 1 week or CT venography."}`, priority: "high", category: "Algorithm" },
        { title: "DVT Treatment", description: "If DVT confirmed: 1) Anticoagulation: DOAC (rivaroxaban or apixaban) preferred over warfarin. 2) Duration: provoked DVT 3 months, unprovoked 6+ months. 3) Compression stockings for symptom relief. 4) Early ambulation (bed rest NOT recommended). 5) Cancer screening if unprovoked DVT.", priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "Score": score, "Class": classification, "DVT %": `${probability}%`, "Leg": legSwelling, "Calf": calfTenderness, "Cancer": cancer }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="wells-score-dvt" title="Wells Score — DVT"
      description="Calculate deep vein thrombosis probability using Wells criteria. Guides D-dimer and ultrasound decisions."
      icon={Activity} calculate={calculate} onClear={() => { setLegSwelling("yes"); setCalfTenderness("yes"); setImmobilization("no"); setCancer("no"); setPittingEdema("no"); setCollateralVeins("no"); setRecentSurgery("no"); setAltDiagnosis("no"); setResult(null) }}
      values={[legSwelling, calfTenderness, immobilization, cancer, pittingEdema, collateralVeins, recentSurgery, altDiagnosis]} result={result}
      seoContent={<SeoContentGenerator title="Wells Score DVT" description="Deep vein thrombosis probability assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Leg Swelling (>3cm)" val={legSwelling} set={setLegSwelling} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Calf Tenderness" val={calfTenderness} set={setCalfTenderness} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Immobilization/Paralysis" val={immobilization} set={setImmobilization} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Active Cancer" val={cancer} set={setCancer} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Pitting Edema" val={pittingEdema} set={setPittingEdema} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Collateral Veins" val={collateralVeins} set={setCollateralVeins} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Recent Surgery/Bedridden" val={recentSurgery} set={setRecentSurgery} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
          <SelectInput label="Alternative Diagnosis Likely" val={altDiagnosis} set={setAltDiagnosis} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (-2)" }]} />
        </div>
      </div>} />
  )
}

// ─── 26. Wells Score (PE) ─────────────────────────────────────────────────────
export function WellsScorePECalculator() {
  const [dvtSigns, setDvtSigns] = useState("no")
  const [peMoreLikely, setPeMoreLikely] = useState("yes")
  const [heartRate, setHeartRate] = useState("under_100")
  const [immobilization, setImmobilization] = useState("no")
  const [priorDVTPE, setPriorDVTPE] = useState("no")
  const [hemoptysis, setHemoptysis] = useState("no")
  const [cancer, setCancer] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (dvtSigns === "yes") score += 3
    if (peMoreLikely === "yes") score += 3
    if (heartRate === "over_100") score += 1.5
    if (immobilization === "yes") score += 1.5
    if (priorDVTPE === "yes") score += 1.5
    if (hemoptysis === "yes") score += 1
    if (cancer === "yes") score += 1

    const classification = score <= 4 ? "PE Unlikely" : "PE Likely"
    const probability = score <= 1 ? 3 : score <= 4 ? 16 : score <= 6 ? 40 : 67
    const status: 'good' | 'warning' | 'danger' = score <= 4 ? "good" : "danger"

    setResult({
      primaryMetric: { label: "Wells Score (PE)", value: `${r1(score)}`, status, description: `${classification} — Probability: ~${probability}%` },
      healthScore: Math.max(5, r0(100 - probability)),
      metrics: [
        { label: "Wells Score", value: r1(score), status },
        { label: "Classification", value: classification, status },
        { label: "PE Probability", value: probability, unit: "%", status },
        { label: "Clinical DVT Signs (+3)", value: dvtSigns === "yes" ? "Yes" : "No", status: dvtSigns === "yes" ? "danger" : "good" },
        { label: "PE Most Likely Dx (+3)", value: peMoreLikely === "yes" ? "Yes" : "No", status: peMoreLikely === "yes" ? "danger" : "good" },
        { label: "Heart Rate >100 (+1.5)", value: heartRate === "over_100" ? "Yes" : "No", status: heartRate === "over_100" ? "warning" : "good" },
        { label: "Prior DVT/PE (+1.5)", value: priorDVTPE === "yes" ? "Yes" : "No", status: priorDVTPE === "yes" ? "warning" : "good" },
        { label: "Hemoptysis (+1)", value: hemoptysis === "yes" ? "Yes" : "No", status: hemoptysis === "yes" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "PE Assessment", description: `Wells PE score: ${r1(score)} (${classification}). ${score > 4 ? "PE LIKELY — proceed to CT pulmonary angiography (CTPA). Do NOT rely on D-dimer alone." : "PE unlikely — D-dimer first. If negative, PE safely excluded. If positive → CTPA."} PE can be fatal — clinical suspicion is critical.`, priority: "high", category: "Workup" },
        { title: "Diagnostic Pathway", description: `${score <= 4 ? "D-dimer (high-sensitivity): if <500 ng/mL (or age-adjusted: age×10 if >50), PE excluded with >99% NPV. If elevated → CTPA." : "CTPA is test of choice. If contraindicated → V/Q scan. If hemodynamically unstable → bedside echo + empiric anticoagulation."} ${dvtSigns === "yes" ? "Concurrent lower extremity ultrasound recommended." : ""}`, priority: "high", category: "Diagnosis" },
        { title: "PE Treatment", description: "Confirmed PE: 1) Anticoagulation: DOAC (rivaroxaban/apixaban) for stable PE. 2) Massive PE (hypotension): systemic thrombolysis (alteplase). 3) Submassive PE: intensive monitoring, consider catheter-directed therapy. 4) Duration: provoked 3 months, unprovoked indefinite if low bleeding risk. 5) IVC filter only if absolute contraindication to anticoagulation.", priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "Score": r1(score), "Class": classification, "PE %": `${probability}%`, "DVT Signs": dvtSigns, "HR >100": heartRate, "Hemoptysis": hemoptysis }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="wells-score-pe" title="Wells Score — Pulmonary Embolism"
      description="Estimate pulmonary embolism probability using Wells criteria. Guides D-dimer and CTPA decisions."
      icon={AlertCircle} calculate={calculate} onClear={() => { setDvtSigns("no"); setPeMoreLikely("yes"); setHeartRate("under_100"); setImmobilization("no"); setPriorDVTPE("no"); setHemoptysis("no"); setCancer("no"); setResult(null) }}
      values={[dvtSigns, peMoreLikely, heartRate, immobilization, priorDVTPE, hemoptysis, cancer]} result={result}
      seoContent={<SeoContentGenerator title="Wells Score PE" description="Pulmonary embolism probability calculator." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Clinical Signs of DVT" val={dvtSigns} set={setDvtSigns} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+3)" }]} />
          <SelectInput label="PE Most Likely Diagnosis" val={peMoreLikely} set={setPeMoreLikely} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+3)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Heart Rate" val={heartRate} set={setHeartRate} options={[{ value: "under_100", label: "<100 bpm" }, { value: "over_100", label: ">100 bpm (+1.5)" }]} />
          <SelectInput label="Immobilization/Surgery" val={immobilization} set={setImmobilization} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1.5)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Prior DVT/PE" val={priorDVTPE} set={setPriorDVTPE} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1.5)" }]} />
          <SelectInput label="Hemoptysis" val={hemoptysis} set={setHemoptysis} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
        </div>
        <SelectInput label="Active Cancer" val={cancer} set={setCancer} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (+1)" }]} />
      </div>} />
  )
}

// ─── 27. PERC Rule Calculator ─────────────────────────────────────────────────
export function PERCRuleCalculator() {
  const [age, setAge] = useState("under_50")
  const [heartRate, setHeartRate] = useState("under_100")
  const [o2Sat, setO2Sat] = useState("95_plus")
  const [hemoptysis, setHemoptysis] = useState("no")
  const [estrogenUse, setEstrogenUse] = useState("no")
  const [priorDVTPE, setPriorDVTPE] = useState("no")
  const [legSwelling, setLegSwelling] = useState("no")
  const [recentSurgery, setRecentSurgery] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let failed = 0
    if (age === "50_plus") failed++
    if (heartRate === "100_plus") failed++
    if (o2Sat === "under_95") failed++
    if (hemoptysis === "yes") failed++
    if (estrogenUse === "yes") failed++
    if (priorDVTPE === "yes") failed++
    if (legSwelling === "yes") failed++
    if (recentSurgery === "yes") failed++

    const allNeg = failed === 0
    const exclusion = allNeg ? "PE EXCLUDED — No further workup needed" : "PE NOT excluded — Proceed with Wells score and D-dimer"
    const missRate = allNeg ? 1.0 : failed <= 2 ? 8 : 15
    const status: 'good' | 'warning' | 'danger' = allNeg ? "good" : "danger"

    setResult({
      primaryMetric: { label: "PERC Rule", value: allNeg ? "ALL NEGATIVE" : `${failed}/8 POSITIVE`, status, description: exclusion },
      healthScore: allNeg ? 95 : Math.max(20, r0(100 - failed * 12)),
      metrics: [
        { label: "PERC Status", value: allNeg ? "PE Excluded" : "PE Not Excluded", status },
        { label: "Criteria Failed", value: `${failed}/8`, status: failed === 0 ? "good" : "danger" },
        { label: "PE Miss Rate", value: missRate, unit: "%", status: missRate <= 2 ? "good" : "danger" },
        { label: "Age <50", value: age === "under_50" ? "✓" : "✗", status: age === "under_50" ? "good" : "danger" },
        { label: "HR <100", value: heartRate === "under_100" ? "✓" : "✗", status: heartRate === "under_100" ? "good" : "danger" },
        { label: "SpO₂ ≥95%", value: o2Sat === "95_plus" ? "✓" : "✗", status: o2Sat === "95_plus" ? "good" : "danger" },
        { label: "No Hemoptysis", value: hemoptysis === "no" ? "✓" : "✗", status: hemoptysis === "no" ? "good" : "danger" },
        { label: "No Prior DVT/PE", value: priorDVTPE === "no" ? "✓" : "✗", status: priorDVTPE === "no" ? "good" : "danger" },
        { label: "No Estrogen", value: estrogenUse === "no" ? "✓" : "✗", status: estrogenUse === "no" ? "good" : "danger" },
        { label: "No Leg Swelling", value: legSwelling === "no" ? "✓" : "✗", status: legSwelling === "no" ? "good" : "danger" },
        { label: "No Recent Surgery", value: recentSurgery === "no" ? "✓" : "✗", status: recentSurgery === "no" ? "good" : "danger" }
      ],
      recommendations: [
        { title: "PERC Assessment", description: `${allNeg ? "ALL 8 PERC criteria negative. PE can be safely excluded WITHOUT D-dimer or CT. PE miss rate <2% when applied to low clinical suspicion patients." : failed + "/8 criteria positive. PERC rule CANNOT exclude PE — proceed with standard workup (Wells score → D-dimer → CTPA if needed)."} PERC only applies when pre-test probability is LOW (<15%).`, priority: "high", category: "Decision" },
        { title: "Application", description: "PERC is a RULE-OUT tool — only use when clinical gestalt suggests low probability. If physician thinks PE is MORE likely than not, skip PERC and go straight to Wells/D-dimer/CTPA. PERC reduces unnecessary D-dimer testing and CT radiation in truly low-risk patients.", priority: "high", category: "Clinical" },
        { title: "Next Steps", description: `${allNeg ? "No further PE workup needed. Investigate alternative diagnoses for patient's symptoms (musculoskeletal, anxiety, pneumonia, etc.)." : "Calculate Wells PE score. If Wells ≤4: D-dimer. If Wells >4: CTPA. Any hemodynamic instability → immediate treatment."}`, priority: "medium", category: "Algorithm" }
      ],
      detailedBreakdown: { "Result": allNeg ? "Excluded" : "Not Excluded", "Failed": `${failed}/8`, "Miss Rate": `${missRate}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="perc-rule-calculator" title="PERC Rule Calculator"
      description="Pulmonary embolism rule-out criteria for low-risk patients. All 8 criteria must be negative to exclude PE."
      icon={Shield} calculate={calculate} onClear={() => { setAge("under_50"); setHeartRate("under_100"); setO2Sat("95_plus"); setHemoptysis("no"); setEstrogenUse("no"); setPriorDVTPE("no"); setLegSwelling("no"); setRecentSurgery("no"); setResult(null) }}
      values={[age, heartRate, o2Sat, hemoptysis, estrogenUse, priorDVTPE, legSwelling, recentSurgery]} result={result}
      seoContent={<SeoContentGenerator title="PERC Rule Calculator" description="Pulmonary embolism exclusion criteria for low-risk patients." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Age" val={age} set={setAge} options={[{ value: "under_50", label: "<50 years" }, { value: "50_plus", label: "≥50 years" }]} />
          <SelectInput label="Heart Rate" val={heartRate} set={setHeartRate} options={[{ value: "under_100", label: "<100 bpm" }, { value: "100_plus", label: "≥100 bpm" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Oxygen Saturation" val={o2Sat} set={setO2Sat} options={[{ value: "95_plus", label: "≥95%" }, { value: "under_95", label: "<95%" }]} />
          <SelectInput label="Hemoptysis" val={hemoptysis} set={setHemoptysis} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Estrogen Use" val={estrogenUse} set={setEstrogenUse} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Prior DVT/PE" val={priorDVTPE} set={setPriorDVTPE} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Unilateral Leg Swelling" val={legSwelling} set={setLegSwelling} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Surgery/Trauma (last 4 weeks)" val={recentSurgery} set={setRecentSurgery} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}
