"use client"

import { useState } from "react"
import { Activity, Brain, AlertCircle, Shield, Zap } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
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

// ─── 28. Gout Risk Calculator ─────────────────────────────────────────────────
export function GoutRiskCalculator() {
  const [uricAcid, setUricAcid] = useState(7.5)
  const [bmi, setBmi] = useState(29)
  const [alcoholIntake, setAlcoholIntake] = useState("moderate")
  const [dietPattern, setDietPattern] = useState("high_purine")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ua = clamp(uricAcid, 2, 15)
    const b = clamp(bmi, 15, 50)

    let score = 0
    if (ua > 9) score += 4; else if (ua > 7) score += 3; else if (ua > 6) score += 2; else if (ua > 5) score += 1
    if (b >= 30) score += 2; else if (b >= 25) score += 1
    if (alcoholIntake === "heavy") score += 3; else if (alcoholIntake === "moderate") score += 2; else if (alcoholIntake === "light") score += 1
    if (dietPattern === "high_purine") score += 2; else if (dietPattern === "moderate_purine") score += 1

    const maxScore = 11
    const riskPct = r0(clamp(score * 8, 5, 85))
    const purineRisk = dietPattern === "high_purine" ? "High" : dietPattern === "moderate_purine" ? "Moderate" : "Low"
    const flareProb = r0(clamp(ua > 7 ? 30 + (ua - 7) * 10 : 10, 5, 80))

    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Gout Risk", value: `${riskPct}%`, status, description: `${label} — Uric Acid: ${ua} mg/dL` },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "Gout Risk", value: riskPct, unit: "%", status },
        { label: "Flare Probability", value: flareProb, unit: "%", status: flareProb < 25 ? "good" : flareProb < 50 ? "warning" : "danger" },
        { label: "Uric Acid", value: ua, unit: "mg/dL", status: ua < 6 ? "good" : ua < 7 ? "warning" : "danger" },
        { label: "BMI", value: b, status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Purine Intake Risk", value: purineRisk, status: purineRisk === "Low" ? "good" : purineRisk === "Moderate" ? "warning" : "danger" },
        { label: "Alcohol Impact", value: alcoholIntake, status: alcoholIntake === "none" ? "good" : alcoholIntake === "light" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Gout Risk", description: `Risk: ${riskPct}% (${label}). Uric acid: ${ua} mg/dL (target <6.0 for gout prevention, <5.0 if tophaceous). ${ua > 7 ? "HYPERURICEMIA — uric acid crystals deposit in joints when >6.8 mg/dL." : ""} Acute flare probability: ${flareProb}%. Gout is the most common inflammatory arthritis in men.`, priority: "high", category: "Assessment" },
        { title: "Dietary Management", description: `${dietPattern === "high_purine" ? "REDUCE HIGH-PURINE FOODS: organ meats (liver, kidney), red meat, shellfish, anchovies, sardines, beer. " : ""}${alcoholIntake !== "none" ? "REDUCE ALCOHOL — beer and spirits are worst (beer has purines + alcohol). Wine is least harmful. " : ""}INCREASE: cherries/cherry juice (lowers urate), low-fat dairy, vegetables, whole grains. HYDRATION: 2-3L water daily reduces crystal formation. Vitamin C 500mg/day may help.`, priority: "high", category: "Diet" },
        { title: "Treatment", description: `${ua > 9 || score > 6 ? "Urate-lowering therapy (ULT) may be indicated: allopurinol (start low, titrate to target) or febuxostat." : "Lifestyle modifications may be sufficient."} Acute flare: NSAIDs, colchicine, or corticosteroids. Do NOT start/stop ULT during acute flare. Comorbidity check: gout associates with metabolic syndrome, CKD, hypertension — screen for all.`, priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "UA": `${ua} mg/dL`, "BMI": b, "Alcohol": alcoholIntake, "Diet": dietPattern, "Flare": `${flareProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="gout-risk" title="Gout Risk Calculator"
      description="Estimate gout arthritis risk from uric acid level, BMI, alcohol intake, and purine-rich diet patterns."
      icon={Zap} calculate={calculate} onClear={() => { setUricAcid(7.5); setBmi(29); setAlcoholIntake("moderate"); setDietPattern("high_purine"); setResult(null) }}
      values={[uricAcid, bmi, alcoholIntake, dietPattern]} result={result}
      seoContent={<SeoContentGenerator title="Gout Risk Calculator" description="Assess gout risk with uric acid and lifestyle factors." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Uric Acid Level" val={uricAcid} set={setUricAcid} min={2} max={15} step={0.1} suffix="mg/dL" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={50} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Alcohol Intake" val={alcoholIntake} set={setAlcoholIntake} options={[{ value: "none", label: "None" }, { value: "light", label: "Light (1-2/week)" }, { value: "moderate", label: "Moderate (3-7/week)" }, { value: "heavy", label: "Heavy (daily)" }]} />
          <SelectInput label="Diet Pattern" val={dietPattern} set={setDietPattern} options={[{ value: "low_purine", label: "Low purine" }, { value: "moderate_purine", label: "Moderate purine" }, { value: "high_purine", label: "High purine (red meat, seafood)" }]} />
        </div>
      </div>} />
  )
}

// ─── 29. Osteoarthritis Risk Estimator ────────────────────────────────────────
export function OsteoarthritisRiskCalculator() {
  const [age, setAge] = useState(55)
  const [bmi, setBmi] = useState(28)
  const [jointInjury, setJointInjury] = useState("no")
  const [physicalActivity, setPhysicalActivity] = useState("low")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 90)
    const b = clamp(bmi, 15, 50)

    let score = 0
    if (a >= 65) score += 3; else if (a >= 55) score += 2; else if (a >= 45) score += 1
    if (b >= 30) score += 3; else if (b >= 25) score += 2
    if (jointInjury === "yes") score += 3; else if (jointInjury === "minor") score += 1
    if (physicalActivity === "low") score += 1; else if (physicalActivity === "excessive") score += 2

    const maxScore = 11
    const riskPct = r0(clamp(score * 8, 5, 85))
    const mobilityRisk = r0(clamp(riskPct * 0.7, 5, 65))
    const jointDegen = r0(clamp(score * 9, 5, 90))

    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Osteoarthritis Risk", value: `${riskPct}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - riskPct)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "OA Risk", value: riskPct, unit: "%", status },
        { label: "Joint Degeneration", value: jointDegen, unit: "%", status: jointDegen < 25 ? "good" : jointDegen < 50 ? "warning" : "danger" },
        { label: "Mobility Limitation", value: mobilityRisk, unit: "%", status: mobilityRisk < 20 ? "good" : mobilityRisk < 40 ? "warning" : "danger" },
        { label: "Age Factor", value: a >= 65 ? "High" : a >= 45 ? "Moderate" : "Low", status: a >= 65 ? "danger" : a >= 45 ? "warning" : "good" },
        { label: "BMI Impact", value: b >= 30 ? "Obese" : b >= 25 ? "Overweight" : "Normal", status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Prior Injury", value: jointInjury === "yes" ? "Major" : jointInjury === "minor" ? "Minor" : "None", status: jointInjury === "yes" ? "danger" : jointInjury === "minor" ? "warning" : "good" },
        { label: "Activity Level", value: physicalActivity, status: physicalActivity === "moderate" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "OA Risk Assessment", description: `Risk: ${riskPct}% (${label}). Joint degeneration probability: ${jointDegen}%. Mobility limitation risk: ${mobilityRisk}%. ${jointInjury === "yes" ? "Prior joint injury is strongest predictor — damaged cartilage accelerates degeneration." : ""} OA is the most common joint disease worldwide, affecting 240+ million people.`, priority: "high", category: "Assessment" },
        { title: "Joint Protection", description: `1) ${b >= 25 ? "WEIGHT LOSS — each kg lost reduces knee load by 4kg per step. Greatest modifiable risk factor." : "Maintain healthy weight."} 2) ${physicalActivity === "low" ? "Regular exercise — strengthening prevents OA. Focus on quadriceps, low-impact (swimming, cycling, walking)." : physicalActivity === "excessive" ? "Reduce high-impact activities — long-distance running on hard surfaces increases knee OA risk." : "Activity level is appropriate."} 3) Glucosamine/chondroitin (evidence mixed but safe to try). 4) Omega-3 fatty acids for inflammation.`, priority: "high", category: "Prevention" },
        { title: "Management", description: `${riskPct > 40 ? "If symptoms develop: 1) Topical NSAIDs first-line. 2) Acetaminophen as adjunct. 3) Physical therapy (as effective as surgery for many). 4) Intra-articular injections (corticosteroid for flares, hyaluronic acid for maintenance). 5) Total joint replacement if severe and refractory." : "Focus on prevention at this stage."} X-ray if joint pain persistent >6 weeks.`, priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "Risk": `${riskPct}%`, "Degen": `${jointDegen}%`, "Mobility": `${mobilityRisk}%`, "BMI": b, "Age": a, "Injury": jointInjury }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="osteoarthritis-risk" title="Osteoarthritis Risk Estimator"
      description="Estimate joint degeneration and mobility limitation risk from age, BMI, injury history, and activity level."
      icon={Activity} calculate={calculate} onClear={() => { setAge(55); setBmi(28); setJointInjury("no"); setPhysicalActivity("low"); setResult(null) }}
      values={[age, bmi, jointInjury, physicalActivity]} result={result}
      seoContent={<SeoContentGenerator title="Osteoarthritis Risk Estimator" description="Assess osteoarthritis and joint degeneration risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={90} suffix="years" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={50} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Joint Injury History" val={jointInjury} set={setJointInjury} options={[{ value: "no", label: "None" }, { value: "minor", label: "Minor injury" }, { value: "yes", label: "Major injury/surgery" }]} />
          <SelectInput label="Physical Activity" val={physicalActivity} set={setPhysicalActivity} options={[{ value: "low", label: "Low (sedentary)" }, { value: "moderate", label: "Moderate (regular)" }, { value: "excessive", label: "Excessive (heavy labor/sports)" }]} />
        </div>
      </div>} />
  )
}

// ─── 30. Rheumatoid Arthritis Risk Estimator ──────────────────────────────────
export function RheumatoidArthritisRiskCalculator() {
  const [familyHistory, setFamilyHistory] = useState("no")
  const [smoking, setSmoking] = useState("no")
  const [jointPain, setJointPain] = useState("moderate")
  const [morningStiffness, setMorningStiffness] = useState("yes")
  const [gender, setGender] = useState("female")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    if (familyHistory === "yes") score += 3
    if (smoking === "yes") score += 2; else if (smoking === "former") score += 1
    if (jointPain === "severe") score += 3; else if (jointPain === "moderate") score += 2; else if (jointPain === "mild") score += 1
    if (morningStiffness === "yes") score += 2
    if (gender === "female") score += 1

    const maxScore = 11
    const raProbability = r0(clamp(score * 7, 5, 75))
    const inflammatoryLikelihood = r0(clamp(score * 8, 5, 85))

    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "RA Risk", value: `${raProbability}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - raProbability)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "RA Probability", value: raProbability, unit: "%", status },
        { label: "Inflammatory Likelihood", value: inflammatoryLikelihood, unit: "%", status: inflammatoryLikelihood < 30 ? "good" : inflammatoryLikelihood < 55 ? "warning" : "danger" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive (+3)" : "None", status: familyHistory === "yes" ? "danger" : "good" },
        { label: "Smoking", value: smoking === "yes" ? "Current" : smoking === "former" ? "Former" : "Never", status: smoking === "yes" ? "danger" : smoking === "former" ? "warning" : "good" },
        { label: "Joint Pain", value: jointPain, status: jointPain === "none" ? "good" : jointPain === "mild" ? "warning" : "danger" },
        { label: "Morning Stiffness", value: morningStiffness === "yes" ? ">30 min" : "<30 min", status: morningStiffness === "yes" ? "danger" : "good" },
        { label: "Gender Factor", value: gender === "female" ? "Female (3x risk)" : "Male", status: gender === "female" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "RA Risk", description: `Probability: ${raProbability}% (${label}). Inflammatory arthritis likelihood: ${inflammatoryLikelihood}%. ${morningStiffness === "yes" ? "Morning stiffness >30 min is hallmark of inflammatory arthritis (vs <15 min in OA)." : ""} ${familyHistory === "yes" ? "First-degree family history increases risk 3-5x." : ""} ${gender === "female" ? "Women are 3x more likely to develop RA." : ""} RA affects 0.5-1% of population.`, priority: "high", category: "Assessment" },
        { title: "Diagnostic Steps", description: `${raProbability > 30 ? "Recommended testing: RF (rheumatoid factor), anti-CCP antibodies (most specific), ESR, CRP, CBC. X-rays of hands/feet for baseline. Anti-CCP positive + symptoms = high probability RA." : "Monitor symptoms. Seek rheumatologist if symmetric joint pain, morning stiffness >30 min, or joint swelling persists >6 weeks."} ${smoking === "yes" ? "QUIT SMOKING — doubles RA risk and worsens disease severity." : ""}`, priority: "high", category: "Diagnosis" },
        { title: "Early Treatment", description: "RA requires EARLY treatment — 'window of opportunity' in first 3-6 months. DMARDs (methotrexate first-line) started early can prevent joint destruction. Biologics (anti-TNF, IL-6 inhibitors) if inadequate response. Physical therapy preserves function. Regular rheumatology follow-up essential.", priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "RA": `${raProbability}%`, "Inflam": `${inflammatoryLikelihood}%`, "Score": `${score}/${maxScore}`, "Family": familyHistory, "Smoking": smoking }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="rheumatoid-arthritis" title="Rheumatoid Arthritis Risk Estimator"
      description="Evaluate autoimmune joint disease risk from family history, smoking, joint pain symptoms, and morning stiffness."
      icon={AlertCircle} calculate={calculate} onClear={() => { setFamilyHistory("no"); setSmoking("no"); setJointPain("moderate"); setMorningStiffness("yes"); setGender("female"); setResult(null) }}
      values={[familyHistory, smoking, jointPain, morningStiffness, gender]} result={result}
      seoContent={<SeoContentGenerator title="Rheumatoid Arthritis Risk Estimator" description="Assess RA probability and inflammatory arthritis risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Family History (RA)" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Smoking Status" val={smoking} set={setSmoking} options={[{ value: "no", label: "Never" }, { value: "former", label: "Former" }, { value: "yes", label: "Current" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Joint Pain Symptoms" val={jointPain} set={setJointPain} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe (symmetric)" }]} />
          <SelectInput label="Morning Stiffness >30 min" val={morningStiffness} set={setMorningStiffness} options={[{ value: "no", label: "No (<30 min)" }, { value: "yes", label: "Yes (>30 min)" }]} />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 31. Lupus Risk Estimator ─────────────────────────────────────────────────
export function LupusRiskCalculator() {
  const [autoimmuneHistory, setAutoimmuneHistory] = useState("no")
  const [skinSymptoms, setSkinSymptoms] = useState("rash")
  const [fatigue, setFatigue] = useState("moderate")
  const [jointPain, setJointPain] = useState("moderate")
  const [gender, setGender] = useState("female")
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 70)

    let score = 0
    if (autoimmuneHistory === "yes") score += 3; else if (autoimmuneHistory === "family") score += 2
    if (skinSymptoms === "butterfly_rash") score += 3; else if (skinSymptoms === "photosensitivity") score += 2; else if (skinSymptoms === "rash") score += 1
    if (fatigue === "severe") score += 2; else if (fatigue === "moderate") score += 1
    if (jointPain === "severe") score += 2; else if (jointPain === "moderate") score += 1
    if (gender === "female") score += 2
    if (a >= 15 && a <= 45) score += 1  // peak incidence

    const maxScore = 13
    const lupusProb = r0(clamp(score * 6, 5, 75))
    const autoimmuneRisk = r0(clamp(score * 7, 5, 85))

    const label = score <= 4 ? "Low Risk" : score <= 7 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 4 ? "good" : score <= 7 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Lupus Risk Score", value: `${lupusProb}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - lupusProb)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "SLE Probability", value: lupusProb, unit: "%", status },
        { label: "Autoimmune Risk", value: autoimmuneRisk, unit: "%", status: autoimmuneRisk < 30 ? "good" : autoimmuneRisk < 55 ? "warning" : "danger" },
        { label: "Autoimmune History", value: autoimmuneHistory === "yes" ? "Personal" : autoimmuneHistory === "family" ? "Family" : "None", status: autoimmuneHistory === "yes" ? "danger" : autoimmuneHistory === "family" ? "warning" : "good" },
        { label: "Skin Symptoms", value: skinSymptoms === "butterfly_rash" ? "Butterfly Rash" : skinSymptoms === "photosensitivity" ? "Photosensitive" : skinSymptoms === "rash" ? "Rash" : "None", status: skinSymptoms === "butterfly_rash" ? "danger" : skinSymptoms === "none" ? "good" : "warning" },
        { label: "Fatigue", value: fatigue, status: fatigue === "none" ? "good" : fatigue === "mild" ? "warning" : "danger" },
        { label: "Joint Pain", value: jointPain, status: jointPain === "none" ? "good" : jointPain === "mild" ? "warning" : "danger" },
        { label: "Demographics", value: `${gender === "female" ? "Female" : "Male"}, ${a} yo`, status: gender === "female" && a <= 45 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Lupus Assessment", description: `SLE probability: ${lupusProb}% (${label}). ${skinSymptoms === "butterfly_rash" ? "BUTTERFLY (MALAR) RASH is highly suggestive of SLE — urgent rheumatology referral." : ""} ${gender === "female" ? "Women are 9x more likely to develop SLE, peak onset 15-45." : ""} Lupus is a multi-system autoimmune disease affecting skin, joints, kidneys, brain, heart.`, priority: "high", category: "Assessment" },
        { title: "Diagnostic Testing", description: `${lupusProb > 30 ? "Recommended: ANA (antinuclear antibody — > 95% sensitivity), anti-dsDNA (specific for SLE), complement levels (C3, C4), CBC, urinalysis (kidney involvement), ESR/CRP. ACR/EULAR classification criteria: ≥10 points with positive ANA." : "Monitor symptoms. ANA screening if new symptoms develop."} ${autoimmuneHistory !== "no" ? "Autoimmune history increases risk — lower threshold for testing." : ""}`, priority: "high", category: "Diagnosis" },
        { title: "SLE Management", description: "If diagnosed: 1) Hydroxychloroquine (ALL SLE patients — reduces flares 50%). 2) Sun protection (UV triggers flares). 3) NSAIDs for mild joint pain. 4) Corticosteroids for flares. 5) Immunosuppressants (mycophenolate, azathioprine) for organ involvement. 6) Belimumab (biologic) for refractory disease. 7) Regular monitoring (kidney, CBC, complement). Pregnancy planning essential.", priority: "medium", category: "Treatment" }
      ],
      detailedBreakdown: { "SLE": `${lupusProb}%`, "Autoimmune": `${autoimmuneRisk}%`, "Score": `${score}/${maxScore}`, "Skin": skinSymptoms, "Gender": gender }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="lupus-risk" title="Lupus Risk Estimator"
      description="Estimate systemic lupus erythematosus (SLE) risk from autoimmune history, skin symptoms, fatigue, and joint pain."
      icon={Shield} calculate={calculate} onClear={() => { setAutoimmuneHistory("no"); setSkinSymptoms("rash"); setFatigue("moderate"); setJointPain("moderate"); setGender("female"); setAge(30); setResult(null) }}
      values={[autoimmuneHistory, skinSymptoms, fatigue, jointPain, gender, age]} result={result}
      seoContent={<SeoContentGenerator title="Lupus Risk Estimator" description="Assess SLE autoimmune disease risk and probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Autoimmune History" val={autoimmuneHistory} set={setAutoimmuneHistory} options={[{ value: "no", label: "None" }, { value: "family", label: "Family history" }, { value: "yes", label: "Personal autoimmune disease" }]} />
          <SelectInput label="Skin Symptoms" val={skinSymptoms} set={setSkinSymptoms} options={[{ value: "none", label: "None" }, { value: "rash", label: "General rash" }, { value: "photosensitivity", label: "Photosensitivity" }, { value: "butterfly_rash", label: "Butterfly (malar) rash" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Fatigue" val={fatigue} set={setFatigue} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe/debilitating" }]} />
          <SelectInput label="Joint Pain" val={jointPain} set={setJointPain} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe (multiple joints)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <NumInput label="Age" val={age} set={setAge} min={15} max={70} suffix="years" />
        </div>
      </div>} />
  )
}

// ─── 32. Multiple Sclerosis Risk Estimator ────────────────────────────────────
export function MultipleSclerosisRiskCalculator() {
  const [age, setAge] = useState(30)
  const [vitaminD, setVitaminD] = useState("low")
  const [familyHistory, setFamilyHistory] = useState("no")
  const [neuroSymptoms, setNeuroSymptoms] = useState("some")
  const [gender, setGender] = useState("female")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 70)

    let score = 0
    if (a >= 20 && a <= 40) score += 2  // peak onset
    else if (a >= 15 && a <= 50) score += 1
    if (vitaminD === "deficient") score += 3; else if (vitaminD === "low") score += 2; else if (vitaminD === "adequate") score += 1
    if (familyHistory === "yes") score += 3
    if (neuroSymptoms === "multiple") score += 3; else if (neuroSymptoms === "some") score += 2; else if (neuroSymptoms === "mild") score += 1
    if (gender === "female") score += 1

    const maxScore = 12
    const msProb = r0(clamp(score * 6, 3, 70))
    const demyelinationRisk = r0(clamp(score * 7, 5, 80))

    const label = score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk"
    const status: 'good' | 'warning' | 'danger' = score <= 3 ? "good" : score <= 6 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "MS Risk", value: `${msProb}%`, status, description: label },
      healthScore: Math.max(5, r0(100 - msProb)),
      metrics: [
        { label: "Risk Score", value: `${score}/${maxScore}`, status },
        { label: "MS Probability", value: msProb, unit: "%", status },
        { label: "Demyelination Risk", value: demyelinationRisk, unit: "%", status: demyelinationRisk < 25 ? "good" : demyelinationRisk < 50 ? "warning" : "danger" },
        { label: "Age Factor", value: a >= 20 && a <= 40 ? "Peak Risk (20-40)" : "Lower Risk", status: a >= 20 && a <= 40 ? "warning" : "good" },
        { label: "Vitamin D", value: vitaminD, status: vitaminD === "optimal" ? "good" : vitaminD === "adequate" ? "warning" : "danger" },
        { label: "Family History", value: familyHistory === "yes" ? "Positive" : "None", status: familyHistory === "yes" ? "danger" : "good" },
        { label: "Neurological Symptoms", value: neuroSymptoms === "multiple" ? "Multiple" : neuroSymptoms === "some" ? "Some" : neuroSymptoms === "mild" ? "Mild" : "None", status: neuroSymptoms === "none" ? "good" : neuroSymptoms === "mild" ? "warning" : "danger" },
        { label: "Gender Factor", value: gender === "female" ? "Female (2-3x)" : "Male", status: gender === "female" ? "warning" : "good" }
      ],
      recommendations: [
        { title: "MS Risk Assessment", description: `MS probability: ${msProb}% (${label}). Demyelination risk: ${demyelinationRisk}%. ${neuroSymptoms !== "none" ? "NEUROLOGICAL SYMPTOMS present — MRI of brain and spinal cord recommended if not already done." : ""} ${familyHistory === "yes" ? "First-degree relative with MS increases risk 20-40x." : ""} MS affects 2.8 million people worldwide, peak onset 20-40 years.`, priority: "high", category: "Assessment" },
        { title: "Key Symptoms", description: `Watch for: 1) Optic neuritis (vision loss, eye pain). 2) Numbness/tingling in limbs. 3) Lhermitte's sign (electric shock down spine with neck flexion). 4) Fatigue (most common MS symptom). 5) Balance/coordination problems. 6) Bladder dysfunction. 7) Cognitive fog. ${neuroSymptoms === "multiple" ? "Multiple symptoms suggest higher suspicion — urgent MRI and neurologist referral." : "Single intermittent symptom may need monitoring."}`, priority: "high", category: "Symptoms" },
        { title: "Prevention & Diagnosis", description: `${vitaminD !== "optimal" ? "VITAMIN D: Strong epidemiological evidence links deficiency to MS risk. Supplement 2000-4000 IU/day if deficient. Target: >30 ng/mL." : ""} Diagnosis requires MRI (demyelinating lesions), often with lumbar puncture (oligoclonal bands) and evoked potentials. McDonald criteria: dissemination in space AND time. Early treatment with disease-modifying therapy (DMT) significantly reduces disability progression.`, priority: "medium", category: "Diagnosis" }
      ],
      detailedBreakdown: { "MS": `${msProb}%`, "Demyelin": `${demyelinationRisk}%`, "Score": `${score}/${maxScore}`, "VitD": vitaminD, "Family": familyHistory, "Symptoms": neuroSymptoms }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="multiple-sclerosis" title="Multiple Sclerosis Risk Estimator"
      description="Estimate MS development risk from age, vitamin D levels, family history, and neurological symptoms."
      icon={Brain} calculate={calculate} onClear={() => { setAge(30); setVitaminD("low"); setFamilyHistory("no"); setNeuroSymptoms("some"); setGender("female"); setResult(null) }}
      values={[age, vitaminD, familyHistory, neuroSymptoms, gender]} result={result}
      seoContent={<SeoContentGenerator title="Multiple Sclerosis Risk Estimator" description="Assess MS risk and demyelination probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={15} max={70} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Vitamin D Level" val={vitaminD} set={setVitaminD} options={[{ value: "deficient", label: "Deficient (<20 ng/mL)" }, { value: "low", label: "Low (20-30 ng/mL)" }, { value: "adequate", label: "Adequate (30-50)" }, { value: "optimal", label: "Optimal (>50)" }]} />
          <SelectInput label="Family History (MS)" val={familyHistory} set={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <SelectInput label="Neurological Symptoms" val={neuroSymptoms} set={setNeuroSymptoms} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild (occasional tingling)" }, { value: "some", label: "Some (numbness, vision issues)" }, { value: "multiple", label: "Multiple (numbness + vision + balance)" }]} />
      </div>} />
  )
}
