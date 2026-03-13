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

// ─── 27. Arterial Compliance Calculator (Vascular Elasticity Engine) ─────────
export function ArterialComplianceCalculator() {
  const [sbp, setSbp] = useState(130)
  const [dbp, setDbp] = useState(80)
  const [strokeVolume, setStrokeVolume] = useState(70)
  const [age, setAge] = useState(50)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(sbp, 80, 240)
    const d = clamp(dbp, 40, 160)
    const sv = clamp(strokeVolume, 20, 150)
    const a = clamp(age, 18, 90)

    const pp = s - d
    const compliance = r2(sv / pp) // mL/mmHg

    // Elasticity index (normalized 0-100)
    const elasticityIndex = r0(Math.min(100, compliance * 50))

    // Arterial stiffness proxy (inverse of compliance, higher = stiffer)
    const stiffnessProxy = r2(pp / sv)

    // Age-adjusted percentile
    const expectedCompliance = r2(2.0 - (a - 20) * 0.015) // declines with age
    const percentile = r0(Math.min(99, Math.max(1, 50 + (compliance - expectedCompliance) * 30)))

    // Atherosclerosis probability
    let atheroProb = 0
    if (a > 60) atheroProb += 20
    else if (a > 45) atheroProb += 10
    if (pp > 60) atheroProb += 25
    else if (pp > 50) atheroProb += 10
    if (compliance < 1.0) atheroProb += 20
    else if (compliance < 1.4) atheroProb += 10
    atheroProb = r0(Math.min(65, atheroProb))

    // 5-year vascular aging projection
    const annualDecline = a > 60 ? 0.025 : a > 45 ? 0.018 : 0.012
    const compliance5yr = r2(Math.max(0.3, compliance - annualDecline * 5))
    const agingProjection = `${compliance} → ${compliance5yr} mL/mmHg (est. −${r1(annualDecline * 5 * 100 / compliance)}%)`

    // Risk classification
    let riskLevel = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (compliance >= 1.8) { riskLevel = "🟢 Elastic Arteries"; status = "good" }
    else if (compliance >= 1.3) { riskLevel = "🟡 Mild Stiffness"; status = "warning" }
    else if (compliance >= 0.8) { riskLevel = "🔴 High Stiffness"; status = "danger" }
    else { riskLevel = "🟣 Severe Vascular Rigidity"; status = "danger" }

    // Hypertension progression alert
    const htnAlert = pp > 60 && compliance < 1.2 ? "⚠️ HIGH RISK: Wide pulse pressure + low compliance = accelerated hypertension progression. Isolated systolic hypertension likely within 2-3 years." :
                     pp > 50 ? "Monitor — pulse pressure trending high" : ""

    setResult({
      primaryMetric: { label: "Arterial Compliance", value: `${compliance} mL/mmHg`, status, description: riskLevel },
      healthScore: elasticityIndex,
      metrics: [
        { label: "Compliance (SV/PP)", value: compliance, unit: "mL/mmHg", status },
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status: pp < 40 ? "good" : pp < 60 ? "warning" : "danger" },
        { label: "Elasticity Index", value: elasticityIndex, unit: "/100", status: elasticityIndex >= 70 ? "good" : elasticityIndex >= 50 ? "warning" : "danger" },
        { label: "Stiffness Proxy", value: stiffnessProxy, status: stiffnessProxy < 0.6 ? "good" : stiffnessProxy < 0.9 ? "warning" : "danger" },
        { label: "Age-Adjusted Percentile", value: `${percentile}th`, status: percentile >= 50 ? "good" : percentile >= 25 ? "warning" : "danger" },
        { label: "Atherosclerosis Probability", value: atheroProb, unit: "%", status: atheroProb < 15 ? "good" : atheroProb < 30 ? "warning" : "danger" },
        { label: "5-Year Projection", value: agingProjection, status: compliance5yr >= 1.3 ? "good" : compliance5yr >= 0.8 ? "warning" : "danger" },
        { label: "Stroke Volume", value: sv, unit: "mL", status: "normal" },
        { label: "SBP / DBP", value: `${s}/${d}`, unit: "mmHg", status: s < 130 ? "good" : s < 140 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Vascular Elasticity Assessment", description: `Compliance: ${compliance} mL/mmHg (${riskLevel}). Pulse pressure: ${pp} mmHg. ${compliance < 1.0 ? "🔴 Significantly reduced compliance indicates arterial wall remodeling with collagen deposition replacing elastin. This is the hemodynamic hallmark of vascular aging and drives isolated systolic hypertension." : compliance < 1.5 ? "🟡 Mild stiffness — early intervention can slow progression. Arterial compliance declines ~15% per decade after age 40." : "🟢 Good arterial elasticity. Pulse pressure within healthy range."} ${htnAlert}`, priority: "high", category: "Assessment" },
        { title: "Atherosclerosis & Aging", description: `Atherosclerosis probability: ${atheroProb}%. 5-year projection: ${agingProjection}. ${atheroProb > 25 ? "Arterial calcification and plaque reduce compliance. Consider carotid intima-media thickness (CIMT) test or coronary calcium score." : ""} Key modifiable factors: BP control (most impactful), exercise (aerobic reduces arterial stiffness by 15-25%), omega-3 fatty acids, avoiding smoking, sodium restriction.`, priority: "high", category: "Prevention" },
        { title: "Improving Compliance", description: `1) Aerobic exercise 150+ min/week (reduces pulse wave velocity 8-15%). 2) BP control to <130/80 (ACEi/ARBs preferred — improve arterial compliance). 3) Mediterranean diet. 4) Reduce sodium (<2g/day). 5) Avoid smoking (acute arterial stiffening). 6) Manage diabetes (HbA1c <7%: prevents glycation-induced stiffness).`, priority: "medium", category: "Intervention" }
      ],
      detailedBreakdown: { "SV": `${sv} mL`, "PP": `${pp} mmHg`, "Compliance": `${compliance} mL/mmHg`, "Stiffness": stiffnessProxy, "Percentile": `${percentile}th`, "Athero": `${atheroProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="arterial-compliance" title="Arterial Compliance Calculator"
      description="Evaluate arterial wall elasticity with compliance scoring, vascular stiffness proxy, atherosclerosis probability, and 5-year aging projection."
      icon={Heart} calculate={calculate} onClear={() => { setSbp(130); setDbp(80); setStrokeVolume(70); setAge(50); setResult(null) }}
      values={[sbp, dbp, strokeVolume, age]} result={result}
      seoContent={<SeoContentGenerator title="Arterial Compliance Calculator" description="Assess arterial elasticity and vascular health." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={80} max={240} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={dbp} set={setDbp} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stroke Volume" val={strokeVolume} set={setStrokeVolume} min={20} max={150} suffix="mL" />
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
        </div>
      </div>} />
  )
}

// ─── 28. Vascular Age Calculator (Biological Artery Age Model) ───────────────
export function VascularAgeCalculator() {
  const [age, setAge] = useState(50)
  const [sbp, setSbp] = useState(135)
  const [dbp, setDbp] = useState(85)
  const [cholesterol, setCholesterol] = useState(220)
  const [smoking, setSmoking] = useState("no")
  const [bmi, setBmi] = useState(27)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 85)
    const s = clamp(sbp, 80, 240)
    const d = clamp(dbp, 40, 160)
    const chol = clamp(cholesterol, 100, 400)
    const b = clamp(bmi, 15, 55)
    const smk = smoking === "yes"
    const pp = s - d

    // Vascular age estimation
    let vascAge = a
    vascAge += (s - 120) * 0.15
    vascAge += (pp - 40) * 0.2
    if (chol > 240) vascAge += 5
    else if (chol > 200) vascAge += 2
    if (smk) vascAge += 8
    if (b > 30) vascAge += 4
    else if (b > 25) vascAge += 1.5
    vascAge = r0(Math.max(a - 10, Math.min(a + 30, vascAge)))

    const ageGap = vascAge - a

    // Reversal projection with intervention
    let reversalPotential = 0
    if (ageGap > 0) {
      if (s > 140) reversalPotential += 3 // BP control
      if (smk) reversalPotential += 5 // quit smoking
      if (chol > 200) reversalPotential += 2 // statin/diet
      if (b > 25) reversalPotential += 2 // weight loss
      reversalPotential += 2 // exercise
    }
    reversalPotential = r0(Math.min(ageGap, reversalPotential))
    const projectedAge = vascAge - reversalPotential

    let status: 'good' | 'warning' | 'danger' | 'normal' = ageGap <= 0 ? "good" : ageGap <= 5 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Vascular Age", value: `${vascAge} years`, status, description: `Chronological: ${a} | Gap: ${ageGap > 0 ? "+" : ""}${ageGap} years` },
      healthScore: r0(Math.max(0, 100 - ageGap * 6)),
      metrics: [
        { label: "Vascular Age", value: vascAge, unit: "years", status },
        { label: "Chronological Age", value: a, unit: "years", status: "normal" },
        { label: "Age Gap", value: `${ageGap > 0 ? "+" : ""}${ageGap}`, unit: "years", status },
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status: pp < 40 ? "good" : pp < 60 ? "warning" : "danger" },
        { label: "BP", value: `${s}/${d}`, unit: "mmHg", status: s < 130 ? "good" : s < 140 ? "warning" : "danger" },
        { label: "Total Cholesterol", value: chol, unit: "mg/dL", status: chol < 200 ? "good" : chol < 240 ? "warning" : "danger" },
        { label: "BMI", value: b, status: b < 25 ? "good" : b < 30 ? "warning" : "danger" },
        { label: "Smoking", value: smk ? "Yes (+8 yrs)" : "No", status: smk ? "danger" : "good" },
        { label: "Reversal Potential", value: `−${reversalPotential}`, unit: "years", status: reversalPotential > 0 ? "good" : "normal" },
        { label: "Projected with Intervention", value: projectedAge, unit: "years", status: projectedAge <= a ? "good" : projectedAge <= a + 5 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Vascular Age Interpretation", description: `Vascular age: ${vascAge} vs chronological age: ${a} = ${ageGap > 0 ? "+" : ""}${ageGap} years. ${ageGap > 10 ? "🔴 SIGNIFICANT: Arteries are >10 years older than you. This dramatically increases stroke and MI risk. Aggressive intervention needed." : ageGap > 5 ? "🟡 Your arteries are aging faster than you. Modifiable risk factors are driving premature vascular aging." : ageGap <= 0 ? "🟢 Excellent — your arteries are as young or younger than your age." : "🟡 Mild vascular aging — addressable with lifestyle changes."}`, priority: "high", category: "Assessment" },
        { title: "Age Reversal Strategy", description: `Reversal potential: −${reversalPotential} years → projected: ${projectedAge} years. ${smk ? "Quitting smoking: −5 vascular years within 2-5 years. Single most impactful change. " : ""}${s > 140 ? "BP control to <130/80: −3 vascular years. " : ""}${chol > 200 ? "Cholesterol management: −2 vascular years. " : ""}Exercise 150 min/week: −2 vascular years. Combined interventions can reverse 5-15 years of vascular aging.`, priority: "high", category: "Reversal" },
        { title: "Monitoring", description: `Track vascular age annually. Key biomarkers: pulse pressure trend, carotid intima-media thickness (CIMT), coronary artery calcium (CAC) score. Pulse wave velocity (PWV) is the gold standard for arterial stiffness measurement — ask your cardiologist.`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Vasc Age": `${vascAge} yrs`, "Real Age": `${a} yrs`, "Gap": `${ageGap > 0 ? "+" : ""}${ageGap}`, "PP": `${pp} mmHg`, "Reversal": `−${reversalPotential} yrs`, "Projected": `${projectedAge} yrs` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vascular-age" title="Vascular Age Calculator"
      description="Estimate your biological artery age vs chronological age with reversal projection and intervention modeling."
      icon={TrendingUp} calculate={calculate} onClear={() => { setAge(50); setSbp(135); setDbp(85); setCholesterol(220); setSmoking("no"); setBmi(27); setResult(null) }}
      values={[age, sbp, dbp, cholesterol, smoking, bmi]} result={result}
      seoContent={<SeoContentGenerator title="Vascular Age Calculator" description="Estimate your biological vascular age." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={85} suffix="years" />
          <NumInput label="BMI" val={bmi} set={setBmi} min={15} max={55} step={0.1} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={80} max={240} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={dbp} set={setDbp} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={cholesterol} set={setCholesterol} min={100} max={400} suffix="mg/dL" />
          <SelectInput label="Current Smoker" val={smoking} set={setSmoking} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 29. Framingham Heart Age Calculator (Population Risk Model) ─────────────
export function FraminghamHeartAgeCalculator() {
  const [age, setAge] = useState(55)
  const [gender, setGender] = useState("male")
  const [sbp, setSbp] = useState(140)
  const [totalChol, setTotalChol] = useState(220)
  const [hdl, setHdl] = useState(50)
  const [smoking, setSmoking] = useState("no")
  const [diabetes, setDiabetes] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 30, 79)
    const s = clamp(sbp, 80, 240)
    const tc = clamp(totalChol, 100, 400)
    const h = clamp(hdl, 15, 100)
    const male = gender === "male"
    const smk = smoking === "yes"
    const dm = diabetes === "yes"

    // Simplified Framingham 10-year CVD risk (based on published coefficients)
    let risk10 = 0
    if (male) {
      let pts = 0
      if (a >= 70) pts += 14; else if (a >= 65) pts += 12; else if (a >= 60) pts += 11; else if (a >= 55) pts += 10; else if (a >= 50) pts += 8; else if (a >= 45) pts += 6; else if (a >= 40) pts += 3; else if (a >= 35) pts += 1
      if (tc >= 280) pts += 3; else if (tc >= 240) pts += 2; else if (tc >= 200) pts += 1
      if (h < 35) pts += 2; else if (h < 45) pts += 1; else if (h >= 60) pts -= 1
      if (s >= 160) pts += 3; else if (s >= 140) pts += 2; else if (s >= 130) pts += 1
      if (dm) pts += 2
      if (smk) pts += 2
      risk10 = Math.min(35, Math.max(1, r1(pts * 1.5)))
    } else {
      let pts = 0
      if (a >= 75) pts += 16; else if (a >= 70) pts += 14; else if (a >= 65) pts += 12; else if (a >= 60) pts += 10; else if (a >= 55) pts += 8; else if (a >= 50) pts += 6; else if (a >= 45) pts += 4; else if (a >= 40) pts += 2
      if (tc >= 280) pts += 3; else if (tc >= 240) pts += 2; else if (tc >= 200) pts += 1
      if (h < 35) pts += 2; else if (h < 45) pts += 1; else if (h >= 60) pts -= 1
      if (s >= 160) pts += 3; else if (s >= 140) pts += 2; else if (s >= 130) pts += 1
      if (dm) pts += 4
      if (smk) pts += 2
      risk10 = Math.min(30, Math.max(0.5, r1(pts * 1.2)))
    }

    // Equivalent heart age
    let heartAge = a
    if (risk10 > 20) heartAge = Math.min(85, a + r0((risk10 - 10) * 1.5))
    else if (risk10 > 10) heartAge = a + r0((risk10 - 5) * 1.0)
    else heartAge = a + r0(risk10 * 0.3 - 1)
    heartAge = r0(Math.max(a - 5, Math.min(a + 25, heartAge)))

    const heartAgeGap = heartAge - a

    // Lifetime risk (simplified)
    const lifetimeRisk = r0(Math.min(50, risk10 * 2.5 + (dm ? 8 : 0) + (smk ? 5 : 0)))

    // Medication eligibility
    let medEligibility = ""
    if (risk10 >= 20) medEligibility = "High-intensity statin + aspirin recommended (ASCVD ≥20%)"
    else if (risk10 >= 7.5) medEligibility = "Moderate-intensity statin recommended (ASCVD 7.5-20%)"
    else if (risk10 >= 5) medEligibility = "Statin discussion warranted (borderline risk)"
    else medEligibility = "Lifestyle modification primary approach"

    const status: 'good' | 'warning' | 'danger' | 'normal' = risk10 < 7.5 ? "good" : risk10 < 20 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "10-Year CVD Risk", value: `${risk10}%`, status, description: `Heart Age: ${heartAge} (${heartAgeGap > 0 ? "+" : ""}${heartAgeGap} years)` },
      healthScore: r0(Math.max(0, 100 - risk10 * 3)),
      metrics: [
        { label: "10-Year CVD Risk", value: risk10, unit: "%", status },
        { label: "Heart Age", value: heartAge, unit: "years", status: heartAgeGap <= 0 ? "good" : heartAgeGap <= 5 ? "warning" : "danger" },
        { label: "Heart Age Gap", value: `${heartAgeGap > 0 ? "+" : ""}${heartAgeGap}`, unit: "years", status: heartAgeGap <= 0 ? "good" : heartAgeGap <= 5 ? "warning" : "danger" },
        { label: "Lifetime CVD Risk", value: lifetimeRisk, unit: "%", status: lifetimeRisk < 25 ? "normal" : lifetimeRisk < 40 ? "warning" : "danger" },
        { label: "SBP", value: s, unit: "mmHg", status: s < 130 ? "good" : s < 140 ? "warning" : "danger" },
        { label: "Total Cholesterol", value: tc, unit: "mg/dL", status: tc < 200 ? "good" : tc < 240 ? "warning" : "danger" },
        { label: "HDL", value: h, unit: "mg/dL", status: h >= 60 ? "good" : h >= 40 ? "normal" : "danger" },
        { label: "Medication Eligibility", value: medEligibility, status: risk10 >= 20 ? "danger" : risk10 >= 7.5 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Framingham Risk Assessment", description: `10-year CVD risk: ${risk10}%. Heart age: ${heartAge} years (${heartAgeGap > 0 ? "+" + heartAgeGap + " years older" : "younger"} than chronological age ${a}). ${risk10 >= 20 ? "🔴 HIGH RISK (≥20%): ACC/AHA recommends high-intensity statin, aspirin 81mg, BP target <130/80. Consider coronary calcium score for further risk stratification." : risk10 >= 7.5 ? "🟡 INTERMEDIATE RISK (7.5-20%): Statin therapy recommended. Coronary calcium score can help decide treatment intensity." : "🟢 Lower risk. Focus on lifestyle optimization."}`, priority: "high", category: "Assessment" },
        { title: "Risk Reduction Modeling", description: `Medication eligibility: ${medEligibility}. Lifetime risk: ${lifetimeRisk}%. ${smk ? "Smoking cessation alone reduces 10-year risk by 40-50% within 5 years. " : ""}${s >= 140 ? "Each 10 mmHg SBP reduction decreases CVD events by 20%. " : ""}${tc >= 240 ? "Statin therapy reduces LDL 30-50%, CVD events by 25-35%. " : ""}${dm ? "Diabetes doubles CV risk — tight glycemic control (HbA1c <7%) reduces microvascular events 30%." : ""}`, priority: "high", category: "Intervention" },
        { title: "Monitoring Protocol", description: `Repeat Framingham assessment annually. Track: lipids, BP, HbA1c. If risk 7.5-20%, coronary artery calcium (CAC) score can reclassify risk (CAC=0 may allow statin deferral). Exercise stress testing if symptoms develop.`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "10yr Risk": `${risk10}%`, "Heart Age": `${heartAge}`, "Gap": `${heartAgeGap > 0 ? "+" : ""}${heartAgeGap}`, "Lifetime": `${lifetimeRisk}%`, "Meds": medEligibility }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="framingham-heart-age" title="Framingham Heart Age Calculator"
      description="Calculate your 10-year CVD risk and biological heart age using the Framingham model with medication eligibility and lifetime risk projection."
      icon={Heart} calculate={calculate} onClear={() => { setAge(55); setGender("male"); setSbp(140); setTotalChol(220); setHdl(50); setSmoking("no"); setDiabetes("no"); setResult(null) }}
      values={[age, gender, sbp, totalChol, hdl, smoking, diabetes]} result={result}
      seoContent={<SeoContentGenerator title="Framingham Heart Age Calculator" description="Calculate heart age using Framingham risk model." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={30} max={79} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Systolic BP" val={sbp} set={setSbp} min={80} max={240} suffix="mmHg" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Cholesterol" val={totalChol} set={setTotalChol} min={100} max={400} suffix="mg/dL" />
          <NumInput label="HDL Cholesterol" val={hdl} set={setHdl} min={15} max={100} suffix="mg/dL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Current Smoker" val={smoking} set={setSmoking} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
          <SelectInput label="Diabetes" val={diabetes} set={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
      </div>} />
  )
}

// ─── 30. Vital Signs Summary (Integrated Vital Intelligence Dashboard) ───────
export function VitalSignsSummaryCalculator() {
  const [sbp, setSbp] = useState(125)
  const [dbp, setDbp] = useState(80)
  const [hr, setHr] = useState(76)
  const [spo2, setSpo2] = useState(97)
  const [temp, setTemp] = useState(37.0)
  const [rr, setRr] = useState(16)
  const [hrv, setHrv] = useState(38)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(sbp, 70, 240); const d = clamp(dbp, 40, 160)
    const h = clamp(hr, 30, 180); const sp = clamp(spo2, 60, 100)
    const t = clamp(temp, 34, 42); const r = clamp(rr, 5, 50)
    const hv = clamp(hrv, 5, 200)

    // Individual scores (0-20 each, higher = better)
    const bpScore = s < 120 && d < 80 ? 20 : s < 130 ? 16 : s < 140 ? 12 : s < 160 ? 6 : 2
    const hrScore = h >= 60 && h <= 85 ? 20 : h >= 50 && h <= 100 ? 14 : 6
    const spScore = sp >= 97 ? 20 : sp >= 94 ? 15 : sp >= 90 ? 8 : 2
    const tempScore = t >= 36.1 && t <= 37.2 ? 20 : t >= 35.5 && t <= 38.0 ? 12 : 4
    const rrScore = r >= 12 && r <= 20 ? 20 : r >= 10 && r <= 25 ? 14 : 6

    const compositeScore = r0((bpScore + hrScore + spScore + tempScore + rrScore) * 100 / 100)

    // Instability index (0-100, lower is better)
    const instabilityIndex = r0(100 - compositeScore)

    // Early deterioration flag
    let deteriorationFlags: string[] = []
    if (s >= 160 || s < 90) deteriorationFlags.push("BP critical")
    if (h > 120 || h < 50) deteriorationFlags.push("HR critical")
    if (sp < 92) deteriorationFlags.push("Hypoxia")
    if (t > 38.5) deteriorationFlags.push("Fever significant")
    if (t < 35.5) deteriorationFlags.push("Hypothermia")
    if (r > 25 || r < 10) deteriorationFlags.push("Respiratory distress")

    const deterioration = deteriorationFlags.length > 0 ? `⚠️ ${deteriorationFlags.join(", ")}` : "None"

    // Sepsis early warning (qSOFA-inspired: SBP≤100, RR≥22, altered mentation — we use HR>100 as proxy)
    let sepsisScore = 0
    if (s <= 100) sepsisScore++
    if (r >= 22) sepsisScore++
    if (h > 100 && t > 38.3) sepsisScore++
    const sepsisAlert = sepsisScore >= 2 ? "🔴 qSOFA ≥2: HIGH SEPSIS SUSPICION — urgent evaluation needed" :
                        sepsisScore === 1 ? "🟡 One qSOFA criterion met — monitor closely" : "Not indicated"

    const status: 'good' | 'warning' | 'danger' | 'normal' = compositeScore >= 80 ? "good" : compositeScore >= 60 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Vital Stability Score", value: `${compositeScore}/100`, status, description: `Instability: ${instabilityIndex} | Flags: ${deteriorationFlags.length}` },
      healthScore: compositeScore,
      metrics: [
        { label: "Composite Stability Score", value: compositeScore, unit: "/100", status },
        { label: "Instability Index", value: instabilityIndex, unit: "/100", status: instabilityIndex < 20 ? "good" : instabilityIndex < 40 ? "warning" : "danger" },
        { label: "BP", value: `${s}/${d}`, unit: "mmHg", status: bpScore >= 16 ? "good" : bpScore >= 12 ? "warning" : "danger" },
        { label: "Heart Rate", value: h, unit: "bpm", status: hrScore >= 16 ? "good" : hrScore >= 12 ? "normal" : "warning" },
        { label: "SpO₂", value: sp, unit: "%", status: spScore >= 16 ? "good" : spScore >= 10 ? "warning" : "danger" },
        { label: "Temperature", value: t, unit: "°C", status: tempScore >= 16 ? "good" : tempScore >= 10 ? "warning" : "danger" },
        { label: "Respiration Rate", value: r, unit: "/min", status: rrScore >= 16 ? "good" : rrScore >= 12 ? "normal" : "warning" },
        { label: "HRV (RMSSD)", value: hv, unit: "ms", status: hv >= 40 ? "good" : hv >= 25 ? "normal" : "warning" },
        { label: "Deterioration Flags", value: deterioration, status: deteriorationFlags.length === 0 ? "good" : "danger" },
        { label: "Sepsis Alert (qSOFA)", value: sepsisAlert, status: sepsisScore >= 2 ? "danger" : sepsisScore === 1 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Vital Signs Dashboard", description: `Composite score: ${compositeScore}/100. ${compositeScore >= 80 ? "🟢 All vitals within acceptable range. Continue routine monitoring." : compositeScore >= 60 ? "🟡 Some vitals outside optimal range. Increase monitoring frequency. " + (deterioration !== "None" ? "Flags: " + deterioration : "") : "🔴 Multiple vitals abnormal. " + deterioration + ". Consider urgent evaluation."}`, priority: "high", category: "Summary" },
        { title: "Sepsis Screening", description: `qSOFA score: ${sepsisScore}/3. ${sepsisAlert}. ${sepsisScore >= 2 ? "qSOFA ≥2 has 67% specificity for in-hospital mortality in infection. Check: blood lactate, blood cultures, CBC, procalcitonin. Start Sepsis Bundle within 1 hour if confirmed." : "No current sepsis concern."} Criteria: SBP≤100, RR≥22, altered mental status.`, priority: sepsisScore >= 2 ? "high" : "medium", category: "Sepsis" },
        { title: "Early Warning System", description: `This summary mimics the National Early Warning Score (NEWS2) used in hospitals. Score breakdown: BP ${bpScore}/20, HR ${hrScore}/20, SpO₂ ${spScore}/20, Temp ${tempScore}/20, RR ${rrScore}/20. Track daily to detect trends. A declining composite score over 24-48h warrants medical attention.`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "BP": `${s}/${d} (${bpScore}/20)`, "HR": `${h} (${hrScore}/20)`, "SpO₂": `${sp}% (${spScore}/20)`, "Temp": `${t}°C (${tempScore}/20)`, "RR": `${r} (${rrScore}/20)`, "Total": `${compositeScore}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vital-signs-summary" title="Vital Signs Summary Dashboard"
      description="Unified vital signs assessment with composite stability score, sepsis screening (qSOFA), early deterioration flagging, and multi-vital trend analysis."
      icon={Activity} calculate={calculate} onClear={() => { setSbp(125); setDbp(80); setHr(76); setSpo2(97); setTemp(37.0); setRr(16); setHrv(38); setResult(null) }}
      values={[sbp, dbp, hr, spo2, temp, rr, hrv]} result={result}
      seoContent={<SeoContentGenerator title="Vital Signs Summary" description="Comprehensive vital signs dashboard with stability scoring." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={70} max={240} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={dbp} set={setDbp} min={40} max={160} suffix="mmHg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Heart Rate" val={hr} set={setHr} min={30} max={180} suffix="bpm" />
          <NumInput label="SpO₂" val={spo2} set={setSpo2} min={60} max={100} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Temperature" val={temp} set={setTemp} min={34} max={42} step={0.1} suffix="°C" />
          <NumInput label="Respiration Rate" val={rr} set={setRr} min={5} max={50} suffix="/min" />
        </div>
        <NumInput label="HRV (RMSSD)" val={hrv} set={setHrv} min={5} max={200} suffix="ms" />
      </div>} />
  )
}

// ─── 31. Hydration & Vitals Estimator (Hemodynamic Balance Model) ────────────
export function HydrationVitalsEstimator() {
  const [fluidIntake, setFluidIntake] = useState(1500)
  const [weight, setWeight] = useState(70)
  const [hr, setHr] = useState(82)
  const [sbp, setSbp] = useState(118)
  const [dbp, setDbp] = useState(75)
  const [temp, setTemp] = useState(37.0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const fl = clamp(fluidIntake, 0, 8000)
    const w = clamp(weight, 30, 200)
    const h = clamp(hr, 40, 180)
    const s = clamp(sbp, 70, 240)
    const d = clamp(dbp, 40, 160)
    const t = clamp(temp, 35, 42)

    const requirement = r0(w * 35 + (t > 37.5 ? (t - 37) * 300 : 0))
    const deficitPct = r1(Math.max(0, (requirement - fl) / requirement * 100))

    // HR compensation index (HR rises ~7 bpm per 1L deficit)
    const deficitML = Math.max(0, requirement - fl)
    const hrCompIndex = r0(Math.min(100, deficitML / 1000 * 7 * 5))

    // Hypotension risk
    let hypotensionRisk = "Low"
    if (s < 90) hypotensionRisk = "🔴 CURRENT HYPOTENSION"
    else if (s < 100 && deficitPct > 3) hypotensionRisk = "High — dehydration + low BP"
    else if (deficitPct > 5) hypotensionRisk = "Moderate — volume depletion"

    // Heat illness probability
    let heatProb = 0
    if (t > 38.5) heatProb += 25
    else if (t > 37.5) heatProb += 10
    if (deficitPct > 5) heatProb += 25
    else if (deficitPct > 3) heatProb += 10
    if (h > 100) heatProb += 15
    heatProb = r0(Math.min(60, heatProb))

    // Hemodynamic interaction score
    const hemoScore = r0(Math.max(0, 100 - deficitPct * 8 - (h > 100 ? 10 : 0) - (s < 110 ? 10 : 0)))

    const status: 'good' | 'warning' | 'danger' | 'normal' = deficitPct < 2 ? "good" : deficitPct < 5 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Hydration-Vital Interaction", value: `${hemoScore}/100`, status, description: `Fluid deficit: ${deficitPct}% | HR comp: ${hrCompIndex}` },
      healthScore: hemoScore,
      metrics: [
        { label: "Hemodynamic Score", value: hemoScore, unit: "/100", status: hemoScore >= 70 ? "good" : hemoScore >= 50 ? "warning" : "danger" },
        { label: "Fluid Requirement", value: requirement, unit: "mL/day", status: "normal" },
        { label: "Fluid Intake", value: fl, unit: "mL", status: fl >= requirement ? "good" : fl >= requirement * 0.8 ? "warning" : "danger" },
        { label: "Deficit %", value: deficitPct, unit: "%", status },
        { label: "HR Compensation Index", value: hrCompIndex, unit: "/100", status: hrCompIndex < 20 ? "good" : hrCompIndex < 50 ? "warning" : "danger" },
        { label: "Heart Rate", value: h, unit: "bpm", status: h <= 85 ? "good" : h <= 100 ? "warning" : "danger" },
        { label: "Blood Pressure", value: `${s}/${d}`, unit: "mmHg", status: s >= 110 && s < 130 ? "good" : "warning" },
        { label: "Temperature", value: t, unit: "°C", status: t <= 37.2 ? "good" : t <= 38 ? "warning" : "danger" },
        { label: "Hypotension Risk", value: hypotensionRisk, status: hypotensionRisk === "Low" ? "good" : hypotensionRisk.includes("Moderate") ? "warning" : "danger" },
        { label: "Heat Illness Probability", value: heatProb, unit: "%", status: heatProb < 10 ? "good" : heatProb < 25 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Hydration-Hemodynamic Link", description: `Deficit: ${deficitPct}%. Requirement: ${requirement} mL. ${deficitPct > 5 ? "🔴 >5% deficit causes significant hemodynamic compromise: reduced cardiac output, compensatory tachycardia (" + h + " bpm), hypotension risk. Each 1% body weight lost to dehydration reduces plasma volume ~2.5% and raises HR ~7 bpm." : deficitPct > 2 ? "🟡 Mild-moderate deficit. Early cardiovascular compensation present." : "🟢 Adequate hydration. Hemodynamics stable."}`, priority: "high", category: "Assessment" },
        { title: "Cardiovascular Impact", description: `HR compensation: ${hrCompIndex}/100. BP: ${s}/${d}. ${hypotensionRisk !== "Low" ? "Hypotension risk: " + hypotensionRisk + ". Orthostatic BP check recommended. Tilt test if symptomatic." : "Hemodynamics within compensatory range."} ${h > 100 ? "Tachycardia suggests sympathetic activation — likely compensating for reduced stroke volume." : ""}`, priority: "high", category: "Cardiovascular" },
        { title: "Heat Safety", description: `Heat illness probability: ${heatProb}%. ${heatProb > 20 ? "Monitor for: headache, nausea, confusion, cessation of sweating (heat stroke). Cool environment, electrolyte replacement, reduce activity." : "Low heat risk."} Rehydration: ${deficitPct > 3 ? "Oral rehydration solution (ORS) preferred over plain water. Target 150% of deficit over 4-6 hours." : "Sip water throughout the day. Target pale yellow urine."}`, priority: "medium", category: "Heat Safety" }
      ],
      detailedBreakdown: { "Fluid": `${fl}/${requirement} mL`, "Deficit": `${deficitPct}%`, "HR": `${h} bpm`, "BP": `${s}/${d}`, "Temp": `${t}°C`, "Heat": `${heatProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hydration-vitals-estimator" title="Hydration & Vitals Estimator"
      description="Assess hydration impact on cardiovascular function with hemodynamic interaction scoring, hypotension risk, and heat illness probability."
      icon={Droplets} calculate={calculate} onClear={() => { setFluidIntake(1500); setWeight(70); setHr(82); setSbp(118); setDbp(75); setTemp(37.0); setResult(null) }}
      values={[fluidIntake, weight, hr, sbp, dbp, temp]} result={result}
      seoContent={<SeoContentGenerator title="Hydration & Vitals Estimator" description="Assess hydration impact on vital signs." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Fluid Intake (24h)" val={fluidIntake} set={setFluidIntake} min={0} max={8000} suffix="mL" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Heart Rate" val={hr} set={setHr} min={40} max={180} suffix="bpm" />
          <NumInput label="Temperature" val={temp} set={setTemp} min={35} max={42} step={0.1} suffix="°C" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={70} max={240} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={dbp} set={setDbp} min={40} max={160} suffix="mmHg" />
        </div>
      </div>} />
  )
}

// ─── 32. QRS Duration Calculator (ECG Conduction Integrity) ──────────────────
export function QRSDurationCalculator() {
  const [qrs, setQrs] = useState(95)
  const [age, setAge] = useState(55)
  const [symptoms, setSymptoms] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const q = clamp(qrs, 40, 300)
    const a = clamp(age, 18, 90)

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (q < 80) { category = "Narrow (Normal)"; status = "good" }
    else if (q < 120) { category = "Normal Range"; status = "good" }
    else if (q < 150) { category = "Prolonged — Incomplete BBB"; status = "warning" }
    else if (q < 200) { category = "Wide — Complete BBB / Pathological"; status = "danger" }
    else { category = "Severely Wide — Emergent"; status = "danger" }

    // Conduction delay flag
    const conductionDelay = q >= 120 ? "Yes — widened QRS indicates conduction abnormality" : "No"

    // Bundle branch block suspicion
    let bbbSuspicion = "None"
    if (q >= 120 && q < 150) bbbSuspicion = "Incomplete bundle branch block likely"
    else if (q >= 150) bbbSuspicion = "Complete bundle branch block (RBBB or LBBB)"

    // Cardiomyopathy risk
    let cmRisk = "Low"
    if (q >= 150 && symptoms !== "none") cmRisk = "Elevated — wide QRS + symptoms suggests structural heart disease"
    else if (q >= 150) cmRisk = "Moderate — wide QRS warrants echo"
    else if (q >= 120) cmRisk = "Mild — monitor"

    // CRT eligibility (QRS ≥150 + HF)
    const crtNote = q >= 150 ? "QRS ≥150ms: If heart failure present, may be eligible for Cardiac Resynchronization Therapy (CRT)." : ""

    setResult({
      primaryMetric: { label: "QRS Duration", value: `${q} ms`, status, description: category },
      healthScore: r0(Math.max(0, q < 120 ? 95 : q < 150 ? 65 : q < 200 ? 35 : 10)),
      metrics: [
        { label: "QRS Duration", value: q, unit: "ms", status },
        { label: "Classification", value: category, status },
        { label: "Conduction Delay", value: conductionDelay, status: q < 120 ? "good" : "danger" },
        { label: "BBB Suspicion", value: bbbSuspicion, status: bbbSuspicion === "None" ? "good" : bbbSuspicion.includes("Incomplete") ? "warning" : "danger" },
        { label: "Cardiomyopathy Risk", value: cmRisk, status: cmRisk === "Low" ? "good" : cmRisk.startsWith("Mild") ? "normal" : cmRisk.startsWith("Moderate") ? "warning" : "danger" },
        { label: "Symptoms", value: symptoms === "none" ? "None" : symptoms.replace("-", " "), status: symptoms === "none" ? "good" : "warning" },
        { label: "Age", value: a, unit: "years", status: "normal" }
      ],
      recommendations: [
        { title: "QRS Interpretation", description: `QRS: ${q} ms (${category}). Normal QRS: 80-120 ms. ${q >= 150 ? "🔴 WIDE QRS (≥150ms): Indicates significant ventricular conduction delay. Differential: complete LBBB, complete RBBB, ventricular paced rhythm, ventricular tachycardia, hyperkalemia, sodium channel blocker toxicity. 12-lead ECG essential for morphology analysis." : q >= 120 ? "🟡 Prolonged QRS (120-149ms): Incomplete BBB, fascicular block, or early conduction disease. Compare with prior ECGs." : "🟢 Normal QRS duration — ventricular conduction intact."}`, priority: "high", category: "Assessment" },
        { title: "Clinical Implications", description: `${bbbSuspicion !== "None" ? "BBB: " + bbbSuspicion + ". LBBB is more concerning than RBBB — associated with underlying structural disease. New LBBB should be evaluated urgently." : ""} ${crtNote} ${cmRisk !== "Low" ? "Cardiomyopathy: " + cmRisk + ". Echocardiogram recommended to assess LV function." : ""}`, priority: "high", category: "Clinical" },
        { title: "Monitoring", description: `${q >= 120 ? "Serial ECGs to track QRS progression. Progressive widening suggests worsening conduction disease. If QRS widens > 20ms over time, cardiology referral warranted. Check electrolytes (K+, Mg2+) and medication review (antiarrhythmics, TCAs)." : "Routine monitoring. No urgent intervention needed."}`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "QRS": `${q} ms`, "Category": category, "BBB": bbbSuspicion, "CM Risk": cmRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="qrs-duration-calculator" title="QRS Duration Calculator"
      description="Assess ventricular conduction from QRS duration with bundle branch block detection, cardiomyopathy risk scoring, and CRT eligibility assessment."
      icon={Zap} calculate={calculate} onClear={() => { setQrs(95); setAge(55); setSymptoms("none"); setResult(null) }}
      values={[qrs, age, symptoms]} result={result}
      seoContent={<SeoContentGenerator title="QRS Duration Calculator" description="Assess QRS duration for conduction abnormalities." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="QRS Duration" val={qrs} set={setQrs} min={40} max={300} suffix="ms" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={90} suffix="years" />
          <SelectInput label="Symptoms" val={symptoms} set={setSymptoms} options={[{ value: "none", label: "None" }, { value: "syncope", label: "Syncope / Near-syncope" }, { value: "palpitations", label: "Palpitations" }, { value: "dyspnea", label: "Dyspnea / Heart failure" }, { value: "chest-pain", label: "Chest pain" }]} />
        </div>
      </div>} />
  )
}

// ─── 33. QT Interval Calculator (Repolarization Safety Monitor) ──────────────
export function AdvancedQTIntervalCalculator() {
  const [qt, setQt] = useState(420)
  const [hr, setHr] = useState(72)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const qtMs = clamp(qt, 200, 700)
    const h = clamp(hr, 30, 200)
    const male = gender === "male"

    const rr = 60 / h
    const qtcBazett = r0(qtMs / Math.sqrt(rr))
    const qtcFridericia = r0(qtMs / Math.pow(rr, 1 / 3))

    // Risk classification
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    const threshold = male ? 450 : 460
    if (qtcBazett < threshold - 30) { category = "Normal"; status = "good" }
    else if (qtcBazett < threshold) { category = "Borderline"; status = "warning" }
    else if (qtcBazett < 500) { category = "Prolonged"; status = "danger" }
    else { category = "Severely Prolonged — High Arrhythmia Risk"; status = "danger" }

    // Torsades de pointes risk
    let torsadesRisk = "Low"
    if (qtcBazett >= 500) torsadesRisk = "🔴 HIGH — QTc ≥500ms is strongest predictor of TdP"
    else if (qtcBazett >= threshold) torsadesRisk = "Moderate — QTc prolonged"

    // Short QT
    const shortQT = qtcBazett < 340 ? "⚠️ Short QT syndrome suspected (QTc <340ms) — associated with sudden death" : ""

    // Medication interaction alert
    const medAlert = qtcBazett >= 450 ? "⚠️ Avoid QT-prolonging drugs: macrolides, fluoroquinolones, antipsychotics, methadone, ondansetron, antiarrhythmics (Class IA/III). Check CredibleMeds.org for complete list." : ""

    setResult({
      primaryMetric: { label: "QTc (Bazett)", value: `${qtcBazett} ms`, status, description: category },
      healthScore: r0(Math.max(0, qtcBazett < threshold ? 90 : qtcBazett < 500 ? 50 : 15)),
      metrics: [
        { label: "QTc (Bazett)", value: qtcBazett, unit: "ms", status },
        { label: "QTc (Fridericia)", value: qtcFridericia, unit: "ms", status: qtcFridericia < threshold ? "good" : qtcFridericia < 500 ? "warning" : "danger" },
        { label: "Measured QT", value: qtMs, unit: "ms", status: "normal" },
        { label: "Heart Rate", value: h, unit: "bpm", status: "normal" },
        { label: "RR Interval", value: r2(rr), unit: "sec", status: "normal" },
        { label: "Risk Category", value: category, status },
        { label: "Torsades Risk", value: torsadesRisk, status: torsadesRisk === "Low" ? "good" : torsadesRisk.includes("Moderate") ? "warning" : "danger" },
        { label: "Gender Threshold", value: `${threshold} ms (${gender})`, status: "normal" }
      ],
      recommendations: [
        { title: "QTc Interpretation", description: `QTc (Bazett): ${qtcBazett} ms. QTc (Fridericia): ${qtcFridericia} ms. Normal: <${threshold} ms (${male ? "male" : "female"}). ${qtcBazett >= 500 ? "🔴 CRITICAL: QTc ≥500ms is the strongest ECG predictor of Torsades de Pointes. Immediate review of medications, electrolytes (K+, Mg2+, Ca2+). Cardiac monitoring. Consider IV Mg2+ prophylaxis." : qtcBazett >= threshold ? "🟡 Prolonged QTc. Review medications, check electrolytes." : "🟢 Normal QTc."} ${shortQT} Bazett overestimates at high HR and underestimates at low HR — Fridericia is preferred when HR is <60 or >100.`, priority: "high", category: "Assessment" },
        { title: "Drug Safety & Medications", description: `${medAlert || "QTc within safe range for most medications."} Common QT-prolonging drugs: azithromycin, ciprofloxacin, haloperidol, methadone, amiodarone, sotalol, TCAs. Risk increases with: hypokalemia, hypomagnesemia, bradycardia, structural heart disease, female sex, congenital LQTS.`, priority: "high", category: "Drug Safety" },
        { title: "Electrolyte Targets", description: `Maintain: K+ ≥4.0 mEq/L, Mg2+ ≥2.0 mg/dL. Hypokalemia and hypomagnesemia independently prolong QT. ${qtcBazett >= 470 ? "Check genetics for congenital Long QT Syndrome (LQTS) if no acquired cause identified. Family screening recommended." : ""}`, priority: "medium", category: "Management" }
      ],
      detailedBreakdown: { "QT": `${qtMs} ms`, "HR": `${h} bpm`, "RR": `${r2(rr)} s`, "QTc Bazett": `${qtcBazett} ms`, "QTc Frider.": `${qtcFridericia} ms`, "Torsades": torsadesRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="qt-interval-calculator" title="QT Interval Calculator"
      description="Calculate QTc using Bazett and Fridericia formulas with Torsades de Pointes risk assessment and medication interaction alerts."
      icon={Zap} calculate={calculate} onClear={() => { setQt(420); setHr(72); setGender("male"); setResult(null) }}
      values={[qt, hr, gender]} result={result}
      seoContent={<SeoContentGenerator title="QT Interval Calculator" description="Calculate corrected QT interval for arrhythmia risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="QT Interval" val={qt} set={setQt} min={200} max={700} suffix="ms" />
          <NumInput label="Heart Rate" val={hr} set={setHr} min={30} max={200} suffix="bpm" />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male (normal <450ms)" }, { value: "female", label: "Female (normal <460ms)" }]} />
      </div>} />
  )
}

// ─── 34. Stroke Volume Calculator (Pump Efficiency Metric) ───────────────────
export function AdvancedStrokeVolumeCalculator() {
  const [co, setCo] = useState(5.0)
  const [hr, setHr] = useState(72)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(co, 1, 15)
    const h = clamp(hr, 30, 200)

    const sv = r1(c * 1000 / h) // mL per beat

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (sv >= 60 && sv <= 100) { category = "Normal"; status = "good" }
    else if (sv >= 50 && sv < 60) { category = "Mildly Reduced"; status = "warning" }
    else if (sv >= 100) { category = "Elevated (athlete/high output)"; status = "good" }
    else if (sv >= 35) { category = "Moderately Reduced"; status = "danger" }
    else { category = "Severely Reduced — Heart Failure Concern"; status = "danger" }

    // Exercise adaptation score
    const exerciseAdapt = sv >= 80 ? "Excellent — well-conditioned heart" : sv >= 60 ? "Good — adequate pump function" : sv >= 45 ? "Below average — limited exercise capacity" : "Poor — significant pump limitation"

    // HF suspicion
    const hfSuspicion = sv < 40 ? "⚠️ HIGH: SV <40mL strongly suggests systolic heart failure. Echo + BNP urgently recommended." :
                        sv < 50 ? "Moderate: Reduced SV may indicate early HF or volume depletion" : "Low"

    // SV index (normalized for typical BSA ~1.8)
    const svIndex = r1(sv / 1.8)

    setResult({
      primaryMetric: { label: "Stroke Volume", value: `${sv} mL`, status, description: `${category} — SV Index: ${svIndex} mL/m²` },
      healthScore: r0(Math.min(100, sv >= 60 ? 90 : sv * 1.5)),
      metrics: [
        { label: "Stroke Volume", value: sv, unit: "mL", status },
        { label: "SV Index (est.)", value: svIndex, unit: "mL/m²", status: svIndex >= 33 ? "good" : svIndex >= 25 ? "warning" : "danger" },
        { label: "Cardiac Output", value: c, unit: "L/min", status: c >= 4 && c <= 8 ? "good" : "warning" },
        { label: "Heart Rate", value: h, unit: "bpm", status: h >= 60 && h <= 100 ? "good" : "warning" },
        { label: "Classification", value: category, status },
        { label: "Exercise Adaptation", value: exerciseAdapt, status: sv >= 60 ? "good" : sv >= 45 ? "warning" : "danger" },
        { label: "HF Suspicion", value: hfSuspicion, status: hfSuspicion === "Low" ? "good" : hfSuspicion.includes("Moderate") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Stroke Volume Assessment", description: `SV = CO / HR = ${c} L/min / ${h} bpm = ${sv} mL. Normal: 60-100 mL/beat. ${sv < 50 ? "🔴 Reduced SV indicates the heart ejects less blood per beat. Causes: systolic HF (reduced EF), valve disease, cardiomyopathy, hypovolemia, tamponade." : sv > 100 ? "Elevated SV seen in athletes, high-output states (anemia, thyrotoxicosis, sepsis)." : "🟢 Normal pump efficiency."}`, priority: "high", category: "Assessment" },
        { title: "Heart Failure Evaluation", description: `${hfSuspicion}. ${sv < 50 ? "Recommended workup: echocardiogram (EF%), BNP/NT-proBNP, chest X-ray. Heart failure with reduced EF (HFrEF) if EF <40% — guideline-directed therapy includes ACEi/ARBi, beta-blocker, MRA, and SGLT2i." : "Continue monitoring."}`, priority: sv < 50 ? "high" : "medium", category: "Clinical" },
        { title: "Improving Stroke Volume", description: `Aerobic training increases SV by 10-20% over 12-16 weeks (Frank-Starling mechanism + cardiac remodeling). Athletes may have SV >110 mL. ${sv < 60 ? "If pathological: optimize preload (hydration), reduce afterload (BP control), improve contractility (medications)." : ""}`, priority: "medium", category: "Optimization" }
      ],
      detailedBreakdown: { "CO": `${c} L/min`, "HR": `${h} bpm`, "SV": `${sv} mL`, "SV Index": `${svIndex} mL/m²`, "Exercise": exerciseAdapt, "HF": hfSuspicion }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stroke-volume-calculator" title="Stroke Volume Calculator"
      description="Calculate stroke volume from cardiac output and heart rate with exercise adaptation scoring and heart failure risk assessment."
      icon={Heart} calculate={calculate} onClear={() => { setCo(5.0); setHr(72); setResult(null) }}
      values={[co, hr]} result={result}
      seoContent={<SeoContentGenerator title="Stroke Volume Calculator" description="Calculate heart stroke volume for pump efficiency." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cardiac Output" val={co} set={setCo} min={1} max={15} step={0.1} suffix="L/min" />
          <NumInput label="Heart Rate" val={hr} set={setHr} min={30} max={200} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 35. Ejection Fraction Estimator (Systolic Function Model) ───────────────
export function EjectionFractionCalculator() {
  const [edv, setEdv] = useState(120)
  const [esv, setEsv] = useState(50)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ed = clamp(edv, 30, 400)
    const es = clamp(esv, 10, 350)

    const ef = r1((ed - es) / ed * 100)
    const sv = r0(ed - es)

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (ef >= 55) { category = "Normal (HFpEF excluded)"; status = "good" }
    else if (ef >= 41) { category = "Mildly Reduced (HFmrEF)"; status = "warning" }
    else if (ef >= 30) { category = "Reduced (HFrEF)"; status = "danger" }
    else { category = "Severely Reduced"; status = "danger" }

    // HF classification
    let hfClass = ""
    if (ef >= 50) hfClass = "If symptomatic: HFpEF (Heart Failure with Preserved EF)"
    else if (ef >= 41) hfClass = "HFmrEF (Mildly Reduced EF) — emerging treatment category"
    else hfClass = "HFrEF (Reduced EF) — guideline-directed medical therapy indicated"

    // Treatment implications
    let treatment = ""
    if (ef < 40) treatment = "Quadruple therapy: ACEi/ARNi + Beta-blocker + MRA + SGLT2i. Consider ICD if EF ≤35% and symptomatic."
    else if (ef < 50) treatment = "SGLT2i + diuretics for symptoms. Consider ARNi. Limited evidence for other HF drugs."
    else treatment = "Treat underlying cause (HTN, valve disease). SGLT2i if HFpEF. Diuretics for congestion."

    setResult({
      primaryMetric: { label: "Ejection Fraction", value: `${ef}%`, status, description: category },
      healthScore: r0(Math.min(100, ef >= 55 ? 95 : ef * 1.5)),
      metrics: [
        { label: "Ejection Fraction", value: ef, unit: "%", status },
        { label: "End-Diastolic Volume", value: ed, unit: "mL", status: ed <= 150 ? "good" : ed <= 200 ? "warning" : "danger" },
        { label: "End-Systolic Volume", value: es, unit: "mL", status: es <= 60 ? "good" : es <= 90 ? "warning" : "danger" },
        { label: "Stroke Volume", value: sv, unit: "mL", status: sv >= 60 ? "good" : sv >= 40 ? "warning" : "danger" },
        { label: "HF Classification", value: hfClass, status: ef >= 55 ? "good" : ef >= 41 ? "warning" : "danger" },
        { label: "Treatment Focus", value: treatment, status: ef >= 55 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Ejection Fraction Interpretation", description: `EF = (EDV − ESV) / EDV × 100 = (${ed} − ${es}) / ${ed} × 100 = ${ef}%. Normal ≥55%. ${ef < 40 ? "🔴 SIGNIFICANTLY REDUCED: EF <40% defines HFrEF with >50% 5-year mortality. Immediate cardiology referral. Start/optimize quadruple therapy." : ef < 50 ? "🟡 Mildly reduced: HFmrEF. This category benefits from SGLT2 inhibitors and has improving evidence for neurohormonal therapy." : "🟢 Normal systolic function."}`, priority: "high", category: "Assessment" },
        { title: "Heart Failure Management", description: `${hfClass}. ${treatment} ${ef <= 35 ? "ICD consideration: EF ≤35% after 3+ months of optimal medical therapy → primary prevention ICD reduces sudden cardiac death by 50-60%. CRT if QRS ≥150ms." : ""}`, priority: "high", category: "Treatment" },
        { title: "Monitoring & Prognosis", description: `Repeat echo in 3-6 months to assess treatment response. EF can improve 5-15% with optimal medical therapy in HFrEF. ${ed > 200 ? "Dilated LV (EDV " + ed + "mL) suggests remodeling — volume overload or cardiomyopathy." : ""} Key prognostic markers: EF trend, BNP trend, exercise capacity, NYHA class.`, priority: "medium", category: "Follow-up" }
      ],
      detailedBreakdown: { "EDV": `${ed} mL`, "ESV": `${es} mL`, "SV": `${sv} mL`, "EF": `${ef}%`, "Class": category, "HF": hfClass }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ejection-fraction-estimate" title="Ejection Fraction Estimator"
      description="Calculate left ventricular ejection fraction with heart failure classification (HFrEF/HFmrEF/HFpEF) and guideline-directed treatment recommendations."
      icon={Heart} calculate={calculate} onClear={() => { setEdv(120); setEsv(50); setResult(null) }}
      values={[edv, esv]} result={result}
      seoContent={<SeoContentGenerator title="Ejection Fraction Calculator" description="Calculate heart ejection fraction for pump function." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="End-Diastolic Volume (EDV)" val={edv} set={setEdv} min={30} max={400} suffix="mL" />
          <NumInput label="End-Systolic Volume (ESV)" val={esv} set={setEsv} min={10} max={350} suffix="mL" />
        </div>
      </div>} />
  )
}

// ─── 36. Cardiac Index Calculator (Body-Adjusted Pump Metric) ────────────────
export function CardiacIndexCalculator() {
  const [co, setCo] = useState(5.0)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(co, 1, 15)
    const h = clamp(height, 100, 230)
    const w = clamp(weight, 30, 200)

    // BSA (Du Bois formula)
    const bsa = r2(0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425))
    const ci = r2(c / bsa)

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (ci >= 2.5 && ci <= 4.0) { category = "Normal"; status = "good" }
    else if (ci >= 2.2 && ci < 2.5) { category = "Mildly Low"; status = "warning" }
    else if (ci >= 1.8 && ci < 2.2) { category = "Low — Borderline Shock"; status = "danger" }
    else if (ci < 1.8) { category = "Cardiogenic Shock"; status = "danger" }
    else { category = "High Output State"; status = "warning" }

    // Shock risk
    let shockRisk = "Low"
    if (ci < 1.8) shockRisk = "🔴 CARDIOGENIC SHOCK — CI <1.8 L/min/m². Immediate intervention required."
    else if (ci < 2.2) shockRisk = "High — end-organ perfusion may be compromised"
    else if (ci > 4.5) shockRisk = "Distributive (septic) or high-output state suspected"

    // Perfusion assessment
    const perfusion = ci >= 2.5 ? "Adequate" : ci >= 2.0 ? "Marginal" : "Inadequate — tissue hypoperfusion likely"

    setResult({
      primaryMetric: { label: "Cardiac Index", value: `${ci} L/min/m²`, status, description: `${category} — BSA: ${bsa} m²` },
      healthScore: r0(Math.max(0, ci >= 2.5 ? 90 : ci * 36)),
      metrics: [
        { label: "Cardiac Index", value: ci, unit: "L/min/m²", status },
        { label: "Cardiac Output", value: c, unit: "L/min", status: c >= 4 && c <= 8 ? "good" : "warning" },
        { label: "BSA (Du Bois)", value: bsa, unit: "m²", status: "normal" },
        { label: "Category", value: category, status },
        { label: "Perfusion Status", value: perfusion, status: perfusion === "Adequate" ? "good" : perfusion === "Marginal" ? "warning" : "danger" },
        { label: "Shock Risk", value: shockRisk, status: shockRisk === "Low" ? "good" : shockRisk.includes("High") ? "danger" : shockRisk.includes("Distributive") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Cardiac Index Interpretation", description: `CI = CO / BSA = ${c} / ${bsa} = ${ci} L/min/m². Normal: 2.5-4.0 L/min/m². ${ci < 2.2 ? "🔴 LOW CI: End-organ hypoperfusion likely. Check: mental status (brain), urine output (kidneys), lactate (tissue), extremity temperature (peripheral). " + (ci < 1.8 ? "CARDIOGENIC SHOCK: Inotropes (dobutamine/milrinone), vasopressors if needed. Mechanical support (IABP/Impella) consideration." : "") : ci > 4.5 ? "🟡 HIGH OUTPUT: Consider sepsis (vasodilatory), anemia, thyrotoxicosis, AV fistula, Paget's disease." : "🟢 Normal cardiac index — adequate tissue perfusion."}`, priority: "high", category: "Assessment" },
        { title: "Shock Classification", description: `${shockRisk}. Shock subtypes by hemodynamic profile: Cardiogenic (low CI, high SVR), Distributive/Septic (high CI, low SVR), Hypovolemic (low CI, high SVR, low CVP), Obstructive (low CI, high CVP — tamponade/PE).`, priority: "high", category: "Clinical" },
        { title: "Monitoring", description: `CI is the gold standard for perfusion assessment in ICU. Track with: PA catheter, non-invasive cardiac output monitors, or echocardiographic estimation. Target CI ≥2.5 in most clinical scenarios. DO2 (oxygen delivery) = CI × CaO2 × 10 — ensure DO2 >400 mL/min/m².`, priority: "medium", category: "Critical Care" }
      ],
      detailedBreakdown: { "CO": `${c} L/min`, "BSA": `${bsa} m²`, "CI": `${ci} L/min/m²`, "Perfusion": perfusion, "Shock": shockRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cardiac-index-calculator" title="Cardiac Index Calculator"
      description="Calculate cardiac index (CO/BSA) with perfusion assessment, shock risk detection, and critical care monitoring guidance."
      icon={Heart} calculate={calculate} onClear={() => { setCo(5.0); setHeight(170); setWeight(70); setResult(null) }}
      values={[co, height, weight]} result={result}
      seoContent={<SeoContentGenerator title="Cardiac Index Calculator" description="Calculate body-adjusted cardiac pump metric." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Cardiac Output" val={co} set={setCo} min={1} max={15} step={0.1} suffix="L/min" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={100} max={230} suffix="cm" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 37. Systemic Vascular Resistance (Afterload Estimator) ──────────────────
export function SystemicVascularResistanceCalculator() {
  const [map, setMap] = useState(90)
  const [rap, setRap] = useState(5)
  const [co, setCo] = useState(5.0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const m = clamp(map, 40, 180)
    const r = clamp(rap, 0, 30)
    const c = clamp(co, 1, 15)

    const svr = r0((m - r) / c * 80) // dyne·sec/cm⁵
    const svrWoodUnits = r1((m - r) / c) // Wood units

    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (svr >= 800 && svr <= 1200) { category = "Normal"; status = "good" }
    else if (svr > 1200 && svr <= 1600) { category = "Elevated (Vasoconstriction)"; status = "warning" }
    else if (svr > 1600) { category = "High — Hypertension / Shock / HF"; status = "danger" }
    else if (svr >= 600 && svr < 800) { category = "Low — Vasodilation"; status = "warning" }
    else { category = "Very Low — Vasodilatory/Septic Shock"; status = "danger" }

    // Shock subtype classification
    let shockType = ""
    if (svr < 600 && c > 6) shockType = "Distributive (Septic/Anaphylactic): Low SVR + High CO"
    else if (svr > 1500 && c < 4) shockType = "Cardiogenic/Hypovolemic: High SVR + Low CO"
    else if (svr > 1200) shockType = "Possible compensated shock or hypertension"
    else shockType = "Normal hemodynamic profile"

    // Afterload assessment
    const afterload = svr > 1400 ? "High afterload — increases myocardial work" : svr < 700 ? "Low afterload — may indicate pathological vasodilation" : "Normal afterload"

    setResult({
      primaryMetric: { label: "SVR", value: `${svr} dyne·s/cm⁵`, status, description: `${category} — Wood units: ${svrWoodUnits}` },
      healthScore: r0(Math.max(0, svr >= 800 && svr <= 1200 ? 90 : 90 - Math.abs(svr - 1000) / 15)),
      metrics: [
        { label: "SVR", value: svr, unit: "dyne·s/cm⁵", status },
        { label: "SVR (Wood units)", value: svrWoodUnits, unit: "WU", status: "normal" },
        { label: "Category", value: category, status },
        { label: "MAP", value: m, unit: "mmHg", status: m >= 65 && m <= 100 ? "good" : m < 65 ? "danger" : "warning" },
        { label: "Right Atrial Pressure", value: r, unit: "mmHg", status: r <= 8 ? "good" : r <= 12 ? "warning" : "danger" },
        { label: "Cardiac Output", value: c, unit: "L/min", status: c >= 4 && c <= 8 ? "good" : "warning" },
        { label: "Shock Subtype", value: shockType, status: shockType.includes("Normal") ? "good" : shockType.includes("Possible") ? "warning" : "danger" },
        { label: "Afterload", value: afterload, status: afterload.includes("Normal") ? "good" : "warning" }
      ],
      recommendations: [
        { title: "SVR Interpretation", description: `SVR = (MAP − RAP) / CO × 80 = (${m} − ${r}) / ${c} × 80 = ${svr} dyne·s/cm⁵. Normal: 800-1200. ${svr > 1600 ? "🔴 HIGH SVR: Causes: hypovolemia (compensation), cardiogenic shock (compensation), essential HTN, vasoconstrictors. Treatment: vasodilators (nitroprusside, nitroglycerin), ACE inhibitors, volume if hypovolemic." : svr < 600 ? "🔴 LOW SVR: Vasodilatory shock. Causes: sepsis (#1), anaphylaxis, neurogenic, hepatic failure. Treatment: vasopressors (norepinephrine first-line), fluid resuscitation, source control if septic." : "🟢 Normal vascular resistance."}`, priority: "high", category: "Assessment" },
        { title: "Shock Algorithm", description: `Hemodynamic profile: SVR ${svr} + CO ${c} = ${shockType}. In shock: 1) Assess perfusion (lactate, urine, cap refill). 2) Identify type (distributive vs cardiogenic vs hypovolemic). 3) Treat cause. 4) Optimize MAP ≥65 mmHg. SVR guides vasopressor vs vasodilator choice.`, priority: "high", category: "Clinical" },
        { title: "Afterload Management", description: `${afterload}. ${svr > 1400 ? "Reducing afterload improves cardiac output in HF patients (afterload mismatch). ACE inhibitors, hydralazine, or nitroprusside." : svr < 700 ? "Low afterload with adequate CO may not need treatment. Low afterload + low CO = mortality risk — add vasopressors." : "No intervention needed."}`, priority: "medium", category: "Management" }
      ],
      detailedBreakdown: { "MAP": `${m} mmHg`, "RAP": `${r} mmHg`, "CO": `${c} L/min`, "SVR": `${svr} dyne·s/cm⁵`, "Wood": `${svrWoodUnits} WU`, "Shock": shockType }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="systemic-vascular-resistance" title="Systemic Vascular Resistance Calculator"
      description="Calculate SVR with shock subtype classification, afterload assessment, and hemodynamic profile analysis for critical care."
      icon={Activity} calculate={calculate} onClear={() => { setMap(90); setRap(5); setCo(5.0); setResult(null) }}
      values={[map, rap, co]} result={result}
      seoContent={<SeoContentGenerator title="SVR Calculator" description="Calculate systemic vascular resistance for hemodynamics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Mean Arterial Pressure (MAP)" val={map} set={setMap} min={40} max={180} suffix="mmHg" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Right Atrial Pressure (RAP/CVP)" val={rap} set={setRap} min={0} max={30} suffix="mmHg" />
          <NumInput label="Cardiac Output" val={co} set={setCo} min={1} max={15} step={0.1} suffix="L/min" />
        </div>
      </div>} />
  )
}

// ─── 38. Pulse Oximetry Tracker (Oxygen Stability Monitor) ──────────────────
export function PulseOximetryTracker() {
  const [spo2Avg, setSpo2Avg] = useState(96)
  const [spo2Min, setSpo2Min] = useState(92)
  const [spo2Max, setSpo2Max] = useState(98)
  const [altitude, setAltitude] = useState("sea-level")
  const [activity, setActivity] = useState("rest")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const avg = clamp(spo2Avg, 60, 100)
    const mn = clamp(spo2Min, 60, 100)
    const mx = clamp(spo2Max, 60, 100)

    const range = mx - mn
    const desatFreq = mn < 90 ? "Significant desaturation detected" : mn < 94 ? "Mild desaturation" : "None"

    // Altitude adjustment
    let altAdj = 0
    if (altitude === "moderate") altAdj = -2
    else if (altitude === "high") altAdj = -4
    else if (altitude === "very-high") altAdj = -8
    const adjustedAvg = avg - altAdj // normalize to sea-level equivalent

    // Hypoxia episodes
    let hypoxiaEpisodes = ""
    if (mn < 88) hypoxiaEpisodes = "🔴 Severe hypoxia episode (SpO₂ <88%)"
    else if (mn < 90) hypoxiaEpisodes = "🟡 Moderate hypoxia episode (SpO₂ <90%)"
    else if (mn < 94) hypoxiaEpisodes = "Mild desaturation"
    else hypoxiaEpisodes = "None"

    // Sleep apnea suspicion
    const apneaSuspicion = range >= 6 && mn < 92 ? "⚠️ HIGH: SpO₂ variability + desaturation pattern consistent with obstructive sleep apnea. Polysomnography recommended." :
                           range >= 4 && mn < 94 ? "Moderate — periodic desaturation pattern. Consider sleep study." : "Low"

    // Respiratory instability index
    const instability = r0(Math.min(100, (100 - avg) * 5 + range * 3 + (mn < 90 ? 20 : 0)))

    const status: 'good' | 'warning' | 'danger' | 'normal' = avg >= 96 && mn >= 94 ? "good" : avg >= 94 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Avg SpO₂", value: `${avg}%`, status, description: `Range: ${mn}–${mx}% | Instability: ${instability}/100` },
      healthScore: r0(Math.max(0, avg * 1.1 - 10)),
      metrics: [
        { label: "Average SpO₂", value: avg, unit: "%", status },
        { label: "Minimum SpO₂", value: mn, unit: "%", status: mn >= 94 ? "good" : mn >= 90 ? "warning" : "danger" },
        { label: "Maximum SpO₂", value: mx, unit: "%", status: mx >= 96 ? "good" : "normal" },
        { label: "Range (variability)", value: range, unit: "%", status: range < 3 ? "good" : range < 6 ? "warning" : "danger" },
        { label: "Altitude Adjustment", value: altAdj === 0 ? "None (sea level)" : `${altAdj}% expected reduction`, status: "normal" },
        { label: "Sea-Level Equivalent", value: adjustedAvg, unit: "%", status: adjustedAvg >= 96 ? "good" : adjustedAvg >= 94 ? "warning" : "danger" },
        { label: "Hypoxia Episodes", value: hypoxiaEpisodes, status: hypoxiaEpisodes === "None" ? "good" : hypoxiaEpisodes.includes("Mild") ? "warning" : "danger" },
        { label: "Desaturation Frequency", value: desatFreq, status: desatFreq === "None" ? "good" : desatFreq.includes("Mild") ? "warning" : "danger" },
        { label: "Sleep Apnea Suspicion", value: apneaSuspicion, status: apneaSuspicion === "Low" ? "good" : apneaSuspicion.includes("Moderate") ? "warning" : "danger" },
        { label: "Respiratory Instability", value: instability, unit: "/100", status: instability < 15 ? "good" : instability < 35 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Oxygen Stability Assessment", description: `Average: ${avg}%, Min: ${mn}%, Range: ${range}%. ${avg < 94 ? "🔴 Persistent hypoxemia. Causes: COPD, pneumonia, PE, ILD, congenital heart disease. Supplemental O₂ if resting SpO₂ <88-90% consistently. ABG recommended for accurate assessment." : mn < 90 ? "🟡 Intermittent desaturation detected. Pattern analysis: nocturnal only = sleep apnea/COPD overlap, exertional only = early lung disease/cardiac shunt." : "🟢 Stable oxygenation."} ${altitude !== "sea-level" ? "Altitude adjustment: expected " + altAdj + "% lower." : ""}`, priority: "high", category: "Assessment" },
        { title: "Sleep Apnea Screening", description: `${apneaSuspicion}. ${range >= 4 ? "SpO₂ variability of " + range + "% suggests periodic breathing pattern. STOP-BANG questionnaire can further stratify risk. If positive, home sleep apnea test (HSAT) or in-lab polysomnography for diagnosis." : "SpO₂ pattern does not suggest sleep-disordered breathing."}`, priority: "high", category: "Sleep" },
        { title: "Monitoring Protocol", description: `Daily SpO₂: measure at rest, same time, same finger, warm hands. For exercise monitoring: check before, during peak, and 5 min post. ${mn < 90 ? "Consider continuous pulse oximetry (overnight) to quantify desaturation episodes. O₂ desaturation index (ODI) ≥5/hr is clinically significant." : "Routine spot-checks sufficient."}`, priority: "medium", category: "Monitoring" }
      ],
      detailedBreakdown: { "Avg": `${avg}%`, "Min": `${mn}%`, "Max": `${mx}%`, "Range": `${range}%`, "Instability": `${instability}/100`, "Apnea": apneaSuspicion }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pulse-oximetry-tracker" title="Pulse Oximetry Tracker"
      description="Track SpO₂ readings with hypoxia detection, sleep apnea screening, altitude adjustment, and respiratory instability index."
      icon={Wind} calculate={calculate} onClear={() => { setSpo2Avg(96); setSpo2Min(92); setSpo2Max(98); setAltitude("sea-level"); setActivity("rest"); setResult(null) }}
      values={[spo2Avg, spo2Min, spo2Max, altitude, activity]} result={result}
      seoContent={<SeoContentGenerator title="Pulse Oximetry Tracker" description="Track oxygen saturation levels and detect hypoxia." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average SpO₂" val={spo2Avg} set={setSpo2Avg} min={60} max={100} suffix="%" />
          <NumInput label="Minimum SpO₂" val={spo2Min} set={setSpo2Min} min={60} max={100} suffix="%" />
        </div>
        <NumInput label="Maximum SpO₂" val={spo2Max} set={setSpo2Max} min={60} max={100} suffix="%" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Altitude" val={altitude} set={setAltitude} options={[{ value: "sea-level", label: "Sea Level (0-500m)" }, { value: "moderate", label: "Moderate (1500-2500m)" }, { value: "high", label: "High (2500-3500m)" }, { value: "very-high", label: "Very High (>3500m)" }]} />
          <SelectInput label="Activity During Reading" val={activity} set={setActivity} options={[{ value: "rest", label: "At Rest" }, { value: "walking", label: "Walking" }, { value: "exercise", label: "Exercise" }, { value: "sleep", label: "During Sleep" }]} />
        </div>
      </div>} />
  )
}

// ─── 39. Arterial Stiffness Index (Vascular Aging Marker) ───────────────────
export function ArterialStiffnessIndexCalculator() {
  const [age, setAge] = useState(55)
  const [sbp, setSbp] = useState(135)
  const [dbp, setDbp] = useState(80)
  const [hr, setHr] = useState(72)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 20, 90)
    const s = clamp(sbp, 80, 240)
    const d = clamp(dbp, 40, 160)
    const h = clamp(hr, 40, 150)

    const pp = s - d

    // Stiffness score (pulse pressure ratio × age factor)
    // Higher PP at older age = higher stiffness
    const ppRatio = pp / d // augmentation proxy
    const stiffnessScore = r1(ppRatio * (1 + (a - 30) * 0.015) * 50)

    // Age-adjusted percentile
    const expectedPP = 30 + (a - 20) * 0.4 // PP naturally rises with age
    const percentile = r0(Math.min(99, Math.max(1, 50 + (expectedPP - pp) * 1.5)))

    // Cardiovascular event probability (5-year simplified)
    let cvEventProb5yr = 0
    if (pp > 60) cvEventProb5yr += 15
    else if (pp > 50) cvEventProb5yr += 8
    if (stiffnessScore > 50) cvEventProb5yr += 12
    else if (stiffnessScore > 35) cvEventProb5yr += 5
    if (a > 65) cvEventProb5yr += 8
    else if (a > 50) cvEventProb5yr += 3
    cvEventProb5yr = r0(Math.min(40, cvEventProb5yr))

    // Vascular health score (0-100)
    const vascularHealth = r0(Math.max(0, 100 - stiffnessScore * 1.5 - (pp > 50 ? 10 : 0)))

    let riskLevel = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (stiffnessScore < 25) { riskLevel = "🟢 Healthy Vascular Elasticity"; status = "good" }
    else if (stiffnessScore < 40) { riskLevel = "🟡 Mild Stiffening"; status = "warning" }
    else if (stiffnessScore < 55) { riskLevel = "🔴 Significant Stiffness"; status = "danger" }
    else { riskLevel = "🟣 Severe Arterial Rigidity"; status = "danger" }

    // PWV estimation proxy (simplified: PWV correlates with PP/d ratio)
    const pwvEstimate = r1(5 + ppRatio * 4 + a * 0.05) // m/s rough proxy

    setResult({
      primaryMetric: { label: "Stiffness Score", value: `${stiffnessScore}`, status, description: `${riskLevel} — Vascular Health: ${vascularHealth}/100` },
      healthScore: vascularHealth,
      metrics: [
        { label: "Stiffness Score", value: stiffnessScore, status },
        { label: "Vascular Health Score", value: vascularHealth, unit: "/100", status: vascularHealth >= 70 ? "good" : vascularHealth >= 50 ? "warning" : "danger" },
        { label: "Pulse Pressure", value: pp, unit: "mmHg", status: pp < 40 ? "good" : pp < 60 ? "warning" : "danger" },
        { label: "PP/DBP Ratio", value: r2(ppRatio), status: ppRatio < 0.5 ? "good" : ppRatio < 0.7 ? "warning" : "danger" },
        { label: "Age-Adjusted Percentile", value: `${percentile}th`, status: percentile >= 50 ? "good" : percentile >= 25 ? "warning" : "danger" },
        { label: "PWV Estimate", value: pwvEstimate, unit: "m/s (proxy)", status: pwvEstimate < 8 ? "good" : pwvEstimate < 10 ? "warning" : "danger" },
        { label: "5-Year CV Event Risk", value: cvEventProb5yr, unit: "%", status: cvEventProb5yr < 10 ? "good" : cvEventProb5yr < 20 ? "warning" : "danger" },
        { label: "BP", value: `${s}/${d}`, unit: "mmHg", status: "normal" },
        { label: "Heart Rate", value: h, unit: "bpm", status: "normal" }
      ],
      recommendations: [
        { title: "Arterial Stiffness Assessment", description: `Stiffness score: ${stiffnessScore}. ${riskLevel}. Pulse pressure: ${pp} mmHg (expected for age ${a}: ~${r0(expectedPP)} mmHg). ${stiffnessScore > 50 ? "🔴 SEVERE: Arterial stiffness is the #1 driver of isolated systolic hypertension in older adults. Each 10 mmHg increase in PP above 50 raises stroke risk by 11% and MI risk by 17%." : stiffnessScore > 35 ? "🟡 Progressive arterial wall remodeling. Elastin degradation and collagen deposition are accelerating." : "🟢 Healthy arteries with preserved elasticity."}`, priority: "high", category: "Assessment" },
        { title: "Pulse Wave Velocity", description: `PWV estimate: ${pwvEstimate} m/s. ${pwvEstimate > 10 ? "PWV >10 m/s is an independent cardiovascular risk marker (ESC guidelines). " : ""}Gold standard: carotid-femoral PWV measurement. PP/DBP ratio of ${r2(ppRatio)} is a clinical proxy. Confirmed PWV assessment available at specialized vascular labs.`, priority: "high", category: "Vascular" },
        { title: "5-Year Risk & Intervention", description: `CV event probability: ${cvEventProb5yr}%. ${cvEventProb5yr > 15 ? "Aggressive risk factor management needed. " : ""}Reducing stiffness: 1) BP control (ACEi/ARBs reduce arterial stiffness beyond BP lowering). 2) Aerobic exercise 150+ min/week (−1-2 m/s PWV). 3) Sodium restriction. 4) Weight loss. 5) Statin therapy (pleiotropic vascular effects). Track annually.`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Stiffness": stiffnessScore, "Vasc Health": `${vascularHealth}/100`, "PP": `${pp} mmHg`, "PP/DBP": r2(ppRatio), "PWV est.": `${pwvEstimate} m/s`, "5yr Risk": `${cvEventProb5yr}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="arterial-stiffness-index" title="Arterial Stiffness Index Calculator"
      description="Estimate arterial stiffness with pulse pressure analysis, pulse wave velocity proxy, cardiovascular event probability, and vascular health scoring."
      icon={TrendingUp} calculate={calculate} onClear={() => { setAge(55); setSbp(135); setDbp(80); setHr(72); setResult(null) }}
      values={[age, sbp, dbp, hr]} result={result}
      seoContent={<SeoContentGenerator title="Arterial Stiffness Index" description="Assess arterial stiffness and vascular aging." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={20} max={90} suffix="years" />
          <NumInput label="Heart Rate" val={hr} set={setHr} min={40} max={150} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Systolic BP" val={sbp} set={setSbp} min={80} max={240} suffix="mmHg" />
          <NumInput label="Diastolic BP" val={dbp} set={setDbp} min={40} max={160} suffix="mmHg" />
        </div>
      </div>} />
  )
}
