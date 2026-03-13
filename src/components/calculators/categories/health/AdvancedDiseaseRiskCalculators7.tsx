"use client"

import { useState } from "react"
import { Brain, Eye, Activity, AlertCircle, Heart, Thermometer } from "lucide-react"
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

// ─── 33. Parkinson's Risk Estimator ───────────────────────────────────────────
export function ParkinsonsRiskCalculator() {
  const [age, setAge] = useState(60)
  const [familyHistory, setFamilyHistory] = useState("no")
  const [remSleepDisorder, setRemSleepDisorder] = useState("no")
  const [pesticideExposure, setPesticideExposure] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 30, 90)
    let score = 0
    if (a >= 70) score += 3; else if (a >= 60) score += 2; else if (a >= 50) score += 1
    if (familyHistory === "yes") score += 3
    if (remSleepDisorder === "yes") score += 3
    if (pesticideExposure === "high") score += 2; else if (pesticideExposure === "moderate") score += 1

    const maxScore = 11
    const riskPct = r0(clamp(score * 7, 2, 75))
    const dopamineDecline = r0(clamp(score * 8, 5, 85))
    const neuroProb = r0(clamp(riskPct * 1.1, 3, 80))
    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Parkinson's Risk", value: `${riskPct}%`, status, description: `${label} — Score ${score}/${maxScore}` },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Risk Percentage", value: riskPct, unit: "%", status },
        { label: "Neurodegeneration Prob", value: neuroProb, unit: "%", status: neuroProb < 20 ? "good" : neuroProb < 45 ? "warning" : "danger" },
        { label: "Dopamine Decline Prob", value: dopamineDecline, unit: "%", status: dopamineDecline < 25 ? "good" : dopamineDecline < 50 ? "warning" : "danger" },
        { label: "Age Factor", value: a >= 70 ? "High" : a >= 60 ? "Moderate" : "Low", status: a >= 70 ? "danger" : a >= 60 ? "warning" : "good" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive" : "None", status: familyHistory === "yes" ? "danger" : "good" },
        { label: "REM Sleep Disorder", value: remSleepDisorder === "yes" ? "Present" : "Absent", status: remSleepDisorder === "yes" ? "danger" : "good" },
        { label: "Pesticide Exposure", value: pesticideExposure, status: pesticideExposure === "none" ? "good" : pesticideExposure === "moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Parkinson's Assessment", description: `Risk: ${riskPct}% (${label}). Dopamine neuron decline probability: ${dopamineDecline}%. ${remSleepDisorder === "yes" ? "REM sleep behavior disorder is the strongest prodromal marker — 80% conversion rate over 15 years. " : ""}${familyHistory === "yes" ? "First-degree family history increases risk 2-3x. " : ""}Parkinson's affects 1% of people over 60.`, priority: "high", category: "Assessment" },
        { title: "Prevention", description: `1) ${pesticideExposure !== "none" ? "REDUCE pesticide/herbicide exposure — paraquat, rotenone linked to dopamine neuron death." : "Avoid pesticide exposure."} 2) Regular aerobic exercise — neuroprotective, slows progression. 3) Caffeine consumption may be protective. 4) Mediterranean diet. 5) Adequate vitamin D. ${remSleepDisorder === "yes" ? "6) Neurologist referral for REM sleep disorder workup." : ""}`, priority: "high", category: "Prevention" },
        { title: "Early Signs", description: "Watch for: tremor at rest (pill-rolling), bradykinesia (slow movement), rigidity, postural instability, micrographia (small handwriting), reduced arm swing, anosmia (loss of smell), constipation. Early detection allows dopamine-sparing treatment strategies. DaTscan imaging can detect dopamine transporter loss.", priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Score": `${score}/${maxScore}`, "Dopamine": `${dopamineDecline}%`, "REM": remSleepDisorder, "Pesticide": pesticideExposure }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="parkinsons-risk" title="Parkinson's Risk Estimator"
      description="Estimate Parkinson's disease probability from age, family history, REM sleep disorder, and environmental exposure."
      icon={Brain} calculate={calculate} onClear={() => { setAge(60); setFamilyHistory("no"); setRemSleepDisorder("no"); setPesticideExposure("none"); setResult(null) }}
      values={[age, familyHistory, remSleepDisorder, pesticideExposure]} result={result}
      seoContent={<SeoContentGenerator title="Parkinson's Risk Estimator" description="Neurodegeneration and dopamine decline risk assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={30} max={90} suffix="years" />
          <SelectInput label="Family History" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (first-degree)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="REM Sleep Behavior Disorder" val={remSleepDisorder} set={setRemSleepDisorder} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (act out dreams)" }]} />
          <SelectInput label="Pesticide Exposure" val={pesticideExposure} set={setPesticideExposure} options={[{ value: "none", label: "None" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (occupational)" }]} />
        </div>
      </div>} />
  )
}

// ─── 34. Alzheimer's Risk Estimator ───────────────────────────────────────────
export function AlzheimersRiskCalculator() {
  const [age, setAge] = useState(65)
  const [familyHistory, setFamilyHistory] = useState("no")
  const [apoeGenotype, setApoeGenotype] = useState("unknown")
  const [educationLevel, setEducationLevel] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 40, 95)
    let score = 0
    if (a >= 80) score += 4; else if (a >= 70) score += 3; else if (a >= 65) score += 2; else if (a >= 55) score += 1
    if (familyHistory === "yes") score += 2
    if (apoeGenotype === "e4_homozygous") score += 4; else if (apoeGenotype === "e4_carrier") score += 2
    if (educationLevel === "low") score += 2; else if (educationLevel === "moderate") score += 1

    const maxScore = 12
    const cogDecline = r0(clamp(score * 7, 2, 80))
    const memoryRisk = r0(clamp(cogDecline * 0.85, 2, 70))
    const dementiaProjection = r0(clamp(score * 5, 2, 60))
    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : score <= 9 ? "High Risk" : "Very High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Cognitive Decline Risk", value: `${cogDecline}%`, status, description: `${label} — Score ${score}/${maxScore}` },
      healthScore: Math.max(5, r0(100 - cogDecline)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Cognitive Decline", value: cogDecline, unit: "%", status },
        { label: "Memory Impairment Risk", value: memoryRisk, unit: "%", status: memoryRisk < 20 ? "good" : memoryRisk < 45 ? "warning" : "danger" },
        { label: "10-20yr Dementia Risk", value: dementiaProjection, unit: "%", status: dementiaProjection < 15 ? "good" : dementiaProjection < 35 ? "warning" : "danger" },
        { label: "Age Factor", value: a >= 75 ? "High" : a >= 65 ? "Moderate" : "Low", status: a >= 75 ? "danger" : a >= 65 ? "warning" : "good" },
        { label: "APOE Status", value: apoeGenotype === "e4_homozygous" ? "ε4/ε4 (Very High)" : apoeGenotype === "e4_carrier" ? "ε4 Carrier" : apoeGenotype === "unknown" ? "Unknown" : "ε3/ε3 (Normal)", status: apoeGenotype === "e4_homozygous" ? "danger" : apoeGenotype === "e4_carrier" ? "warning" : "good" },
        { label: "Education", value: educationLevel, status: educationLevel === "high" ? "good" : educationLevel === "moderate" ? "warning" : "danger" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive" : "None", status: familyHistory === "yes" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Alzheimer's Assessment", description: `Cognitive decline risk: ${cogDecline}%. Memory impairment: ${memoryRisk}%. 10-20yr dementia projection: ${dementiaProjection}%. ${apoeGenotype === "e4_homozygous" ? "APOE ε4 homozygous — 15x increased risk vs population." : apoeGenotype === "e4_carrier" ? "APOE ε4 carrier — 3-4x increased risk." : ""} Alzheimer's accounts for 60-80% of all dementia.`, priority: "high", category: "Assessment" },
        { title: "Brain Protection", description: `Cognitive reserve building: 1) ${educationLevel === "low" ? "INCREASE mental stimulation — reading, puzzles, learning new skills." : "Continue cognitive engagement."} 2) Aerobic exercise 150+ min/week (strongest modifiable factor). 3) Mediterranean/MIND diet. 4) Social engagement. 5) Quality sleep 7-8h. 6) Manage cardiovascular risk factors (BP, cholesterol, diabetes). 7) Hearing aids if needed (hearing loss is a risk factor).`, priority: "high", category: "Prevention" },
        { title: "Screening", description: `${a >= 65 ? "Annual cognitive screening recommended (MMSE, MoCA)." : "Continue monitoring for subtle changes."} Early signs: repeating questions, getting lost in familiar places, difficulty managing finances, reduced judgment. ${familyHistory === "yes" ? "Earlier screening advised given family history." : ""} New blood biomarkers (p-tau217) can detect Alzheimer's before symptoms.`, priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "Cognitive": `${cogDecline}%`, "Memory": `${memoryRisk}%`, "Dementia": `${dementiaProjection}%`, "APOE": apoeGenotype, "Education": educationLevel }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="alzheimers-risk" title="Alzheimer's Risk Estimator"
      description="Estimate Alzheimer's disease and cognitive decline risk from age, genetics (APOE), family history, and education level."
      icon={Brain} calculate={calculate} onClear={() => { setAge(65); setFamilyHistory("no"); setApoeGenotype("unknown"); setEducationLevel("moderate"); setResult(null) }}
      values={[age, familyHistory, apoeGenotype, educationLevel]} result={result}
      seoContent={<SeoContentGenerator title="Alzheimer's Risk Estimator" description="Cognitive decline and dementia risk prediction." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={40} max={95} suffix="years" />
          <SelectInput label="Family History" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (first-degree)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="APOE Genotype" val={apoeGenotype} set={setApoeGenotype} options={[{ value: "unknown", label: "Unknown" }, { value: "normal", label: "ε3/ε3 (Normal)" }, { value: "e4_carrier", label: "ε4 Carrier (one copy)" }, { value: "e4_homozygous", label: "ε4/ε4 Homozygous" }]} />
          <SelectInput label="Education Level" val={educationLevel} set={setEducationLevel} options={[{ value: "low", label: "Low (<12 years)" }, { value: "moderate", label: "Moderate (12-16 years)" }, { value: "high", label: "High (>16 years)" }]} />
        </div>
      </div>} />
  )
}

// ─── 35. Dementia Risk Calculator ─────────────────────────────────────────────
export function DementiaRiskCalculator() {
  const [age, setAge] = useState(65)
  const [systolicBP, setSystolicBP] = useState(140)
  const [physicalActivity, setPhysicalActivity] = useState("low")
  const [smoking, setSmoking] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 40, 95)
    const bp = clamp(systolicBP, 80, 220)
    let score = 0
    if (a >= 75) score += 4; else if (a >= 65) score += 3; else if (a >= 55) score += 2; else score += 1
    if (bp >= 160) score += 3; else if (bp >= 140) score += 2; else if (bp >= 130) score += 1
    if (physicalActivity === "low") score += 2; else if (physicalActivity === "moderate") score += 1
    if (smoking === "yes") score += 2

    const maxScore = 11
    const riskPct = r0(clamp(score * 7, 3, 75))
    const brainAging = r0(clamp(a + (score - 4) * 2, a - 5, a + 15))
    const brainAgingIndex = r0(clamp((brainAging / a) * 100, 80, 130))
    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Dementia Risk", value: `${riskPct}%`, status, description: `${label} — Brain Age: ${brainAging} (actual: ${a})` },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Dementia Risk", value: riskPct, unit: "%", status },
        { label: "Brain Age Estimate", value: brainAging, unit: "years", status: brainAging <= a ? "good" : brainAging <= a + 5 ? "warning" : "danger" },
        { label: "Brain Aging Index", value: brainAgingIndex, unit: "%", status: brainAgingIndex <= 100 ? "good" : brainAgingIndex <= 110 ? "warning" : "danger" },
        { label: "Blood Pressure", value: bp, unit: "mmHg", status: bp < 130 ? "good" : bp < 140 ? "warning" : "danger" },
        { label: "Activity Level", value: physicalActivity, status: physicalActivity === "high" ? "good" : physicalActivity === "moderate" ? "warning" : "danger" },
        { label: "Smoking", value: smoking === "yes" ? "Current Smoker" : "Non-smoker", status: smoking === "yes" ? "danger" : "good" }
      ],
      recommendations: [
        { title: "Dementia Risk", description: `Risk: ${riskPct}% (${label}). Brain aging index: ${brainAgingIndex}% (${brainAging > a ? "brain aging FASTER than actual age" : "brain aging appropriately"}). ${bp >= 140 ? "Midlife hypertension is a major modifiable risk factor for dementia." : ""} Dementia is NOT a normal part of aging.`, priority: "high", category: "Assessment" },
        { title: "Brain-Healthy Lifestyle", description: `1) ${physicalActivity === "low" ? "EXERCISE — 150+ min/week, strongest modifiable factor (reduces risk 30-40%)." : "Good activity level."} 2) ${bp >= 140 ? "Control BP (<130/80) — reduces dementia risk 12%." : "BP is adequate."} 3) ${smoking === "yes" ? "QUIT SMOKING — doubles dementia risk." : "Non-smoking maintained."} 4) Mediterranean/MIND diet. 5) Sleep 7-8 hours. 6) Social engagement. 7) Limit alcohol. 8) Manage depression/hearing loss.`, priority: "high", category: "Prevention" },
        { title: "12 Modifiable Factors", description: "Lancet Commission 2020: 40% of dementia is potentially preventable. Key factors: education, hearing loss, traumatic brain injury, hypertension, excessive alcohol, obesity, smoking, depression, social isolation, physical inactivity, air pollution, diabetes. Addressing these now has the greatest impact.", priority: "medium", category: "Research" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Brain Age": brainAging, "Index": `${brainAgingIndex}%`, "BP": bp, "Activity": physicalActivity, "Smoking": smoking }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="dementia-risk" title="Dementia Risk Calculator"
      description="Estimate general dementia probability and brain aging index from age, blood pressure, physical activity, and smoking status."
      icon={Brain} calculate={calculate} onClear={() => { setAge(65); setSystolicBP(140); setPhysicalActivity("low"); setSmoking("no"); setResult(null) }}
      values={[age, systolicBP, physicalActivity, smoking]} result={result}
      seoContent={<SeoContentGenerator title="Dementia Risk Calculator" description="General dementia risk and brain aging assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={40} max={95} suffix="years" />
          <NumInput label="Systolic Blood Pressure" val={systolicBP} set={setSystolicBP} min={80} max={220} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Physical Activity" val={physicalActivity} set={setPhysicalActivity} options={[{ value: "low", label: "Low (<2 days/week)" }, { value: "moderate", label: "Moderate (3-4 days)" }, { value: "high", label: "High (5+ days)" }]} />
          <SelectInput label="Smoking" val={smoking} set={setSmoking} options={[{ value: "no", label: "Non-smoker" }, { value: "yes", label: "Current Smoker" }]} />
        </div>
      </div>} />
  )
}

// ─── 36. Glaucoma Risk Estimator ──────────────────────────────────────────────
export function GlaucomaRiskCalculator() {
  const [age, setAge] = useState(55)
  const [eyePressure, setEyePressure] = useState(22)
  const [familyHistory, setFamilyHistory] = useState("no")
  const [diabetes, setDiabetes] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 30, 90)
    const iop = clamp(eyePressure, 8, 40)
    let score = 0
    if (a >= 70) score += 3; else if (a >= 60) score += 2; else if (a >= 50) score += 1
    if (iop > 24) score += 3; else if (iop > 21) score += 2; else if (iop > 18) score += 1
    if (familyHistory === "yes") score += 2
    if (diabetes === "yes") score += 1

    const maxScore = 9
    const riskPct = r0(clamp(score * 9, 3, 80))
    const visionLoss = r0(clamp(riskPct * 0.7, 2, 55))
    const label = score <= 2 ? "Low Risk" : score <= 5 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 2 ? "good" : score <= 5 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Glaucoma Risk", value: `${riskPct}%`, status, description: `${label} — IOP: ${iop} mmHg` },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Glaucoma Risk", value: riskPct, unit: "%", status },
        { label: "Vision Loss Risk", value: visionLoss, unit: "%", status: visionLoss < 15 ? "good" : visionLoss < 35 ? "warning" : "danger" },
        { label: "Eye Pressure (IOP)", value: iop, unit: "mmHg", status: iop <= 18 ? "good" : iop <= 21 ? "warning" : "danger" },
        { label: "Age Factor", value: a >= 60 ? "High" : a >= 50 ? "Moderate" : "Low", status: a >= 60 ? "danger" : a >= 50 ? "warning" : "good" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive" : "None", status: familyHistory === "yes" ? "danger" : "good" },
        { label: "Diabetes", value: diabetes === "yes" ? "Present" : "Absent", status: diabetes === "yes" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Glaucoma Risk", description: `Risk: ${riskPct}%. Vision loss probability: ${visionLoss}%. IOP: ${iop} mmHg (normal <21). ${iop > 21 ? "ELEVATED eye pressure — ophthalmologist referral needed for tonometry, optic nerve exam, visual field test." : ""} Glaucoma is the leading cause of irreversible blindness — damage occurs silently before symptoms appear.`, priority: "high", category: "Assessment" },
        { title: "Eye Protection", description: `1) ${iop > 21 ? "IOP-lowering treatment (drops: prostaglandin analogs, beta-blockers)." : "Annual IOP monitoring."} 2) Regular comprehensive eye exams (${a >= 60 ? "every 1-2 years" : "every 2-3 years"}). 3) Protect eyes from trauma. 4) ${diabetes === "yes" ? "Strict glucose control reduces ocular complications." : ""} 5) Exercise (lowers IOP naturally). 6) Avoid excessive caffeine.`, priority: "high", category: "Prevention" },
        { title: "Screening", description: `Types: Open-angle (90%, slow, painless) and Angle-closure (acute, emergency). Tests: tonometry (IOP), gonioscopy, OCT (optic nerve), visual field perimetry. ${familyHistory === "yes" ? "Family history = 4-9x risk — annual screening mandatory." : ""} Early detection + treatment prevents 90% of glaucoma blindness.`, priority: "medium", category: "Screening" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Vision": `${visionLoss}%`, "IOP": `${iop} mmHg`, "Family": familyHistory, "Diabetes": diabetes }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="glaucoma-risk" title="Glaucoma Risk Estimator"
      description="Estimate glaucoma probability and vision loss risk from eye pressure, age, family history, and diabetes status."
      icon={Eye} calculate={calculate} onClear={() => { setAge(55); setEyePressure(22); setFamilyHistory("no"); setDiabetes("no"); setResult(null) }}
      values={[age, eyePressure, familyHistory, diabetes]} result={result}
      seoContent={<SeoContentGenerator title="Glaucoma Risk Estimator" description="Optic nerve damage and glaucoma risk assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={30} max={90} suffix="years" />
          <NumInput label="Eye Pressure (IOP)" val={eyePressure} set={setEyePressure} min={8} max={40} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Family History (Glaucoma)" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 37. CURB-65 Score Calculator ─────────────────────────────────────────────
export function CURB65ScoreCalculator() {
  const [confusion, setConfusion] = useState("no")
  const [urea, setUrea] = useState(6)
  const [respiratoryRate, setRespiratoryRate] = useState(28)
  const [systolicBP, setSystolicBP] = useState(85)
  const [age65, setAge65] = useState("yes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const u = clamp(urea, 1, 30)
    const rr = clamp(respiratoryRate, 8, 50)
    const sbp = clamp(systolicBP, 50, 200)

    let score = 0
    if (confusion === "yes") score += 1      // C
    if (u > 7) score += 1                     // U (>7 mmol/L)
    if (rr >= 30) score += 1                  // R
    if (sbp < 90) score += 1                  // B (SBP <90 or DBP ≤60)
    if (age65 === "yes") score += 1           // 65

    const mortality = score === 0 ? 0.7 : score === 1 ? 2.1 : score === 2 ? 9.2 : score === 3 ? 14.5 : score === 4 ? 40 : 57
    const disposition = score <= 1 ? "Outpatient" : score === 2 ? "Short Inpatient / Supervised Outpatient" : "Inpatient (ICU if ≥4)"
    const label = score <= 1 ? "Low Risk" : score === 2 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 1 ? "good" : score === 2 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "CURB-65 Score", value: `${score}/5`, status, description: `${label} — 30-day mortality: ${mortality}%` },
      healthScore: Math.max(5, r0(100 - mortality * 2)),
      metrics: [
        { label: "CURB-65 Score", value: `${score}/5`, status },
        { label: "30-Day Mortality", value: mortality, unit: "%", status },
        { label: "Disposition", value: disposition, status },
        { label: "C — Confusion", value: confusion === "yes" ? "✗ Present" : "✓ Absent", status: confusion === "yes" ? "danger" : "good" },
        { label: "U — Urea >7", value: `${u} mmol/L ${u > 7 ? "✗" : "✓"}`, status: u > 7 ? "danger" : "good" },
        { label: "R — RR ≥30", value: `${rr}/min ${rr >= 30 ? "✗" : "✓"}`, status: rr >= 30 ? "danger" : "good" },
        { label: "B — SBP <90", value: `${sbp} mmHg ${sbp < 90 ? "✗" : "✓"}`, status: sbp < 90 ? "danger" : "good" },
        { label: "65 — Age ≥65", value: age65 === "yes" ? "✗ Yes" : "✓ No", status: age65 === "yes" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Pneumonia Severity", description: `CURB-65: ${score}/5 (${label}). 30-day mortality: ${mortality}%. Disposition: ${disposition}. ${score >= 3 ? "URGENT — consider ICU admission. Blood cultures, IV antibiotics, respiratory support." : score === 2 ? "Hospital admission recommended for monitoring." : "Consider outpatient management with close follow-up."}`, priority: "high", category: "Assessment" },
        { title: "Management", description: `${score <= 1 ? "Oral antibiotics (amoxicillin or macrolide). Follow-up in 48-72h. Return if worsening." : score === 2 ? "IV antibiotics, oxygen if SpO₂ <94%, fluid resuscitation." : "Broad-spectrum IV antibiotics, ICU monitoring, mechanical ventilation readiness."} Chest X-ray for all. Blood cultures if score ≥2. Consider PCT-guided therapy.`, priority: "high", category: "Treatment" },
        { title: "Follow-up", description: `Repeat CXR in 6 weeks to confirm resolution. ${score >= 3 ? "Daily CURB-65 reassessment. Consider step-down when improving." : ""} Pneumococcal and influenza vaccination after recovery. Smoking cessation if applicable.`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "Score": `${score}/5`, "Mortality": `${mortality}%`, "C": confusion, "U": `${u}`, "R": `${rr}`, "B": `${sbp}`, "65": age65 }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="curb-65-score" title="CURB-65 Score Calculator"
      description="Evaluate community-acquired pneumonia severity. Scores confusion, urea, respiratory rate, blood pressure, and age for mortality risk."
      icon={Activity} calculate={calculate} onClear={() => { setConfusion("no"); setUrea(6); setRespiratoryRate(28); setSystolicBP(85); setAge65("yes"); setResult(null) }}
      values={[confusion, urea, respiratoryRate, systolicBP, age65]} result={result}
      seoContent={<SeoContentGenerator title="CURB-65 Score Calculator" description="Pneumonia severity and mortality risk assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Confusion (new mental confusion)" val={confusion} set={setConfusion} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <NumInput label="Blood Urea" val={urea} set={setUrea} min={1} max={30} step={0.1} suffix="mmol/L" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Respiratory Rate" val={respiratoryRate} set={setRespiratoryRate} min={8} max={50} suffix="/min" />
          <NumInput label="Systolic Blood Pressure" val={systolicBP} set={setSystolicBP} min={50} max={200} suffix="mmHg" />
        </div>
        <SelectInput label="Age ≥ 65?" val={age65} set={setAge65} options={[{ value: "no", label: "No (<65)" }, { value: "yes", label: "Yes (≥65)" }]} />
      </div>} />
  )
}

// ─── 38. SOFA Score Calculator ────────────────────────────────────────────────
export function SOFAScoreCalculator() {
  const [pao2fio2, setPao2fio2] = useState(300)
  const [platelets, setPlatelets] = useState(120)
  const [bilirubin, setBilirubin] = useState(2.5)
  const [map, setMap] = useState(65)
  const [creatinine, setCreatinine] = useState(2.0)
  const [gcs, setGcs] = useState(13)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pf = clamp(pao2fio2, 50, 600)
    const plt = clamp(platelets, 5, 500)
    const bil = clamp(bilirubin, 0.1, 20)
    const m = clamp(map, 30, 120)
    const cr = clamp(creatinine, 0.3, 10)
    const g = clamp(gcs, 3, 15)

    let score = 0
    // Respiration
    if (pf < 100) score += 4; else if (pf < 200) score += 3; else if (pf < 300) score += 2; else if (pf < 400) score += 1
    // Coagulation
    if (plt < 20) score += 4; else if (plt < 50) score += 3; else if (plt < 100) score += 2; else if (plt < 150) score += 1
    // Liver
    if (bil >= 12) score += 4; else if (bil >= 6) score += 3; else if (bil >= 2) score += 2; else if (bil >= 1.2) score += 1
    // Cardiovascular
    if (m < 50) score += 4; else if (m < 60) score += 3; else if (m < 65) score += 2; else if (m < 70) score += 1
    // Renal
    if (cr >= 5.0) score += 4; else if (cr >= 3.5) score += 3; else if (cr >= 2.0) score += 2; else if (cr >= 1.2) score += 1
    // CNS
    if (g < 6) score += 4; else if (g < 10) score += 3; else if (g < 13) score += 2; else if (g < 15) score += 1

    const maxScore = 24
    const mortality = score <= 1 ? 0 : score <= 3 ? 8 : score <= 6 ? 15 : score <= 9 ? 25 : score <= 12 ? 40 : score <= 15 ? 55 : score <= 18 ? 75 : 90
    const label = score <= 6 ? "Low" : score <= 12 ? "Moderate" : "High"
    const status: 'good' | 'warning' | 'danger' = score <= 6 ? "good" : score <= 12 ? "warning" : "danger"
    const sepsisMortality = r0(clamp(mortality * 1.2, 0, 95))

    setResult({
      primaryMetric: { label: "SOFA Score", value: `${score}/${maxScore}`, status, description: `${label} organ dysfunction — Mortality: ~${mortality}%` },
      healthScore: Math.max(5, r0(100 - mortality)),
      metrics: [
        { label: "SOFA Score", value: `${score}/${maxScore}`, status },
        { label: "ICU Mortality", value: mortality, unit: "%", status },
        { label: "Sepsis Mortality", value: sepsisMortality, unit: "%", status: sepsisMortality < 15 ? "good" : sepsisMortality < 40 ? "warning" : "danger" },
        { label: "PaO₂/FiO₂", value: pf, status: pf >= 400 ? "good" : pf >= 200 ? "warning" : "danger" },
        { label: "Platelets", value: plt, unit: "×10³", status: plt >= 150 ? "good" : plt >= 50 ? "warning" : "danger" },
        { label: "Bilirubin", value: bil, unit: "mg/dL", status: bil < 1.2 ? "good" : bil < 6 ? "warning" : "danger" },
        { label: "MAP", value: m, unit: "mmHg", status: m >= 70 ? "good" : m >= 60 ? "warning" : "danger" },
        { label: "Creatinine", value: cr, unit: "mg/dL", status: cr < 1.2 ? "good" : cr < 3.5 ? "warning" : "danger" },
        { label: "GCS", value: g, status: g >= 13 ? "good" : g >= 10 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Organ Dysfunction", description: `SOFA: ${score}/24 (${label}). Estimated ICU mortality: ~${mortality}%. Sepsis mortality: ~${sepsisMortality}%. ${score >= 2 ? "SOFA ≥2 = organ dysfunction = Sepsis-3 criteria met if infection suspected." : "Low organ dysfunction."} ${score >= 11 ? "CRITICAL — multi-organ failure. Aggressive critical care needed." : ""}`, priority: "high", category: "Assessment" },
        { title: "Organ Support", description: `${pf < 200 ? "Resp: mechanical ventilation, lung-protective strategy. " : ""}${plt < 50 ? "Coag: transfuse if bleeding or <10. " : ""}${bil >= 6 ? "Liver: monitor for hepatic failure. " : ""}${m < 65 ? "CV: vasopressors (norepinephrine first-line). " : ""}${cr >= 2 ? "Renal: fluid resuscitation, consider RRT if refractory. " : ""}${g < 13 ? "CNS: neuroprotection, assess ICP if indicated. " : ""}`, priority: "high", category: "Treatment" },
        { title: "Monitoring", description: "Serial SOFA scores every 24h — trend is more important than single value. SOFA increase ≥2 from baseline = acute organ dysfunction. Sepsis bundle: lactate, blood cultures, broad-spectrum abx within 1h, 30mL/kg crystalloid if hypotensive, vasopressors if MAP <65 after fluids.", priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "SOFA": `${score}/24`, "Mortality": `${mortality}%`, "PF": pf, "Plt": plt, "Bil": bil, "MAP": m, "Cr": cr, "GCS": g }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sofa-score-calculator" title="SOFA Score Calculator"
      description="Sequential Organ Failure Assessment for ICU patients. Evaluates respiratory, coagulation, liver, cardiovascular, renal, and neurological function."
      icon={AlertCircle} calculate={calculate} onClear={() => { setPao2fio2(300); setPlatelets(120); setBilirubin(2.5); setMap(65); setCreatinine(2.0); setGcs(13); setResult(null) }}
      values={[pao2fio2, platelets, bilirubin, map, creatinine, gcs]} result={result}
      seoContent={<SeoContentGenerator title="SOFA Score Calculator" description="ICU organ failure assessment and sepsis mortality prediction." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="PaO₂/FiO₂ Ratio" val={pao2fio2} set={setPao2fio2} min={50} max={600} />
          <NumInput label="Platelets" val={platelets} set={setPlatelets} min={5} max={500} suffix="×10³/µL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Bilirubin" val={bilirubin} set={setBilirubin} min={0.1} max={20} step={0.1} suffix="mg/dL" />
          <NumInput label="MAP" val={map} set={setMap} min={30} max={120} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Creatinine" val={creatinine} set={setCreatinine} min={0.3} max={10} step={0.1} suffix="mg/dL" />
          <NumInput label="GCS Score" val={gcs} set={setGcs} min={3} max={15} />
        </div>
      </div>} />
  )
}
