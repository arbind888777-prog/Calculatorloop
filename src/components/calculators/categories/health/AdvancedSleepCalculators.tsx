"use client"

import { useState } from "react"
import { Moon, Coffee, Clock, Sun, Activity } from "lucide-react"
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

// ─── 1. Sleep Cycle Calculator ─────────────────────────────────────────────────
export function SleepCycleCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [sleepDelay, setSleepDelay] = useState(14)
  const [mode, setMode] = useState("bedtime")
  const [bedtime, setBedtime] = useState("23:00")
  const [result, setResult] = useState<HealthResult | null>(null)

  const fmtTime = (h: number, m: number) => {
    const hh = ((h % 24) + 24) % 24
    return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const calculate = () => {
    const cycleMin = 90
    const delayMin = clamp(sleepDelay, 0, 60)

    if (mode === "wakeup") {
      const [wh, wm] = wakeTime.split(":").map(Number)
      const wakeMinutes = wh * 60 + wm
      const cycles = [5, 6, 7, 8, 9]
      const bedtimes = cycles.map(c => {
        const sleepOnset = wakeMinutes - c * cycleMin
        const bedtimeMinutes = sleepOnset - delayMin
        return { cycles: c, time: fmtTime(Math.floor(((bedtimeMinutes % 1440) + 1440) / 60), ((bedtimeMinutes % 1440) + 1440) % 60), duration: r1(c * cycleMin / 60) }
      })
      setResult({
        primaryMetric: { label: "Ideal Bedtimes", value: bedtimes[2].time + " or " + bedtimes[3].time, status: "good", description: `Based on wake time: ${wakeTime}, 90-min sleep cycles` },
        metrics: bedtimes.map(b => ({
          label: `${b.cycles} cycles (${b.duration} hrs)`, value: b.time, status: b.cycles === 6 || b.cycles === 7 ? "good" : "normal" as "good" | "normal"
        })),
        recommendations: [
          { title: "Sleep Cycle Science", description: "Each sleep cycle is ~90 minutes: N1 (light), N2, N3 (deep/slow-wave), REM. Waking at end of a cycle (rather than mid-cycle) reduces sleep inertia and grogginess. 5-6 cycles (7.5-9 hours) is optimal for most adults.", priority: "high", category: "Sleep Science" },
          { title: "Pre-Sleep Routine", description: `Allow ${delayMin} minutes to fall asleep. Start your wind-down routine 30-60 minutes before bedtime: dim lights, avoid screens, no caffeine after 2 PM, cool room temperature (16-20°C).`, priority: "high", category: "Sleep Hygiene" }
        ],
        detailedBreakdown: { "Wake Time": wakeTime, "Fall Asleep Delay": `${delayMin} min`, "Best Bedtimes": bedtimes.filter(b => b.cycles >= 5 && b.cycles <= 7).map(b => b.time).join(", ") }
      })
    } else {
      const [bh, bm] = bedtime.split(":").map(Number)
      const bedMinutes = bh * 60 + bm
      const cycles = [4, 5, 6, 7, 8]
      const wakeOptions = cycles.map(c => {
        const wakeMinutes = bedMinutes + delayMin + c * cycleMin
        return { cycles: c, time: fmtTime(Math.floor(wakeMinutes / 60), wakeMinutes % 60), duration: r1(c * cycleMin / 60) }
      })
      setResult({
        primaryMetric: { label: "Ideal Wake Times", value: wakeOptions[2].time + " or " + wakeOptions[3].time, status: "good", description: `Based on bedtime: ${bedtime}, 90-min cycles` },
        metrics: wakeOptions.map(w => ({
          label: `${w.cycles} cycles (${w.duration} hrs)`, value: w.time, status: w.cycles === 5 || w.cycles === 6 ? "good" : "normal" as "good" | "normal"
        })),
        recommendations: [
          { title: "Best Wake Times", description: `For bedtime ${bedtime} with ${delayMin} min to fall asleep: Top choice is ${wakeOptions[2].time} (6 cycles, 9 hrs) or ${wakeOptions[1].time} (5 cycles, 7.5 hrs). These times align with natural end of REM sleep for minimizing grogginess.`, priority: "high", category: "Recommendation" },
          { title: "Sleep Duration by Age", description: "Teens (14-17): 8-10 hrs. Adults (18-64): 7-9 hrs. Older Adults (65+): 7-8 hrs. Less than 7 hours consistently is associated with increased risk of obesity, diabetes, heart disease, and impaired immune function.", priority: "medium", category: "Guidelines" }
        ],
        detailedBreakdown: { "Bedtime": bedtime, "Fall Asleep": `${delayMin} min`, "Best Wake Times": wakeOptions.filter(w => w.cycles >= 5 && w.cycles <= 6).map(w => w.time).join(", ") }
      })
    }
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-cycle-calculator" title="Sleep Cycle Calculator"
      description="Find optimal bedtimes or wake times based on 90-minute sleep cycles to minimize grogginess and maximize sleep quality."
      icon={Moon} calculate={calculate} onClear={() => { setWakeTime("07:00"); setSleepDelay(14); setMode("wakeup"); setResult(null) }}
      values={[wakeTime, sleepDelay, mode, bedtime]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Cycle Calculator" description="Calculate optimal sleep and wake times by sleep cycles." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Calculate" val={mode} set={setMode} options={[{ value: "wakeup", label: "When should I go to bed? (I must wake at...)" }, { value: "bedtime", label: "When should I wake up? (I will sleep at...)" }]} />
        {mode === "wakeup"
          ? <div className="space-y-1"><label className="text-sm font-medium">Wake Up Time</label><input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" /></div>
          : <div className="space-y-1"><label className="text-sm font-medium">Bedtime</label><input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" /></div>
        }
        <NumInput label="Avg. time to fall asleep" val={sleepDelay} set={setSleepDelay} min={0} max={60} suffix="minutes" />
      </div>} />
  )
}

// ─── 2. Sleep Debt Calculator ─────────────────────────────────────────────────
export function SleepDebtCalculator() {
  const [needed, setNeeded] = useState(8)
  const [mon, setMon] = useState(6.5)
  const [tue, setTue] = useState(7)
  const [wed, setWed] = useState(6)
  const [thu, setThu] = useState(5.5)
  const [fri, setFri] = useState(6)
  const [sat, setSat] = useState(9)
  const [sun, setSun] = useState(7.5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const target = clamp(needed, 4, 12)
    const actual = [mon, tue, wed, thu, fri, sat, sun].map(h => clamp(h, 0, 16))
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const totalActual = actual.reduce((a, b) => a + b, 0)
    const totalNeeded = target * 7
    const debt = r1(totalNeeded - totalActual)
    const avgActual = r1(totalActual / 7)

    setResult({
      primaryMetric: { label: "Weekly Sleep Debt", value: debt > 0 ? debt : 0, unit: "hours", status: debt <= 0 ? "good" : debt <= 5 ? "warning" : "danger", description: debt <= 0 ? "No sleep debt this week!" : `You need ${debt} hours more sleep this week` },
      healthScore: Math.max(0, Math.min(100, r0(100 - debt * 10))),
      metrics: [
        { label: "Average Daily Sleep", value: avgActual, unit: "hrs/night", status: avgActual >= 7 ? "good" : avgActual >= 6 ? "warning" : "danger" },
        { label: "Weekly Sleep Goal", value: target, unit: "hrs/night × 7", status: "normal" },
        { label: "Total Sleep This Week", value: r1(totalActual), unit: "hours", status: "normal" },
        { label: "Deficit/Surplus", value: debt > 0 ? `-${debt}` : `+${Math.abs(debt)}`, unit: "hrs", status: debt <= 0 ? "good" : "warning" },
        ...days.map((d, i) => ({ label: d, value: actual[i], unit: "hrs", status: (actual[i] < target - 1 ? "warning" : actual[i] >= target ? "good" : "normal") as "good" | "normal" | "warning" | "danger" }))
      ],
      recommendations: [
        { title: "Impact of Your Sleep Debt", description: debt <= 0 ? "Excellent! No sleep debt. Consistent sleep schedule is the key to cognitive performance, immune function, and metabolic health." : debt <= 5 ? `Moderate sleep debt of ${debt} hours. Even 5 days of 6-hour sleep causes cognitive impairment equivalent to 24 hours without sleep. Aim to add 30-60 min/night.` : `Severe sleep debt of ${debt} hours. This significantly impairs memory, reaction time, emotional regulation, and increases cardiovascular and metabolic risk.`, priority: "high", category: "Impact" },
        { title: "Recovery", description: "Recovery from sleep restriction cannot be fully accomplished in one weekend. To recover from chronic sleep debt: add 1-2 hours per night for 2-3 weeks. Avoid sleeping in more than 1-2 hours on weekends to prevent social jet lag.", priority: "medium", category: "Recovery" }
      ],
      detailedBreakdown: { "Nightly Goal": `${target} hours`, "Weekly Total": `${r1(totalActual)} hrs`, "Needed": `${totalNeeded} hrs`, "Debt": `${debt > 0 ? debt : 0} hrs`, "Average": `${avgActual} hrs/night` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-debt-calculator" title="Sleep Debt Calculator"
      description="Track your weekly sleep debt by comparing actual vs. recommended sleep each night. Includes impact assessment and recovery tips."
      icon={Moon} calculate={calculate} onClear={() => { setNeeded(8); setMon(6.5); setTue(7); setWed(6); setThu(5.5); setFri(6); setSat(9); setSun(7.5); setResult(null) }}
      values={[needed, mon, tue, wed, thu, fri, sat, sun]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Debt Calculator" description="Calculate your weekly sleep debt and recovery needs." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Your Sleep Need (recommended)" val={needed} set={setNeeded} min={4} max={12} step={0.25} suffix="hours/night" />
        <p className="text-sm text-muted-foreground">Enter actual hours slept each night:</p>
        <div className="grid grid-cols-2 gap-3">
          {([["Monday", mon, setMon], ["Tuesday", tue, setTue], ["Wednesday", wed, setWed], ["Thursday", thu, setThu], ["Friday", fri, setFri], ["Saturday", sat, setSat], ["Sunday", sun, setSun]] as [string, number, (n: number) => void][]).map(([day, val, set]) => (
            <NumInput key={day} label={day} val={val} set={set} min={0} max={16} step={0.25} suffix="hrs" />
          ))}
        </div>
      </div>} />
  )
}

// ─── 3. Sleep Efficiency Calculator ──────────────────────────────────────────
export function SleepEfficiencyCalculator() {
  const [timeInBed, setTimeInBed] = useState(8.0)
  const [totalSleep, setTotalSleep] = useState(6.5)
  const [wakeUps, setWakeUps] = useState(2)
  const [wakeTime, setWakeTime] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const tib = clamp(timeInBed, 1, 16)
    const ts = clamp(totalSleep, 0, tib)
    const efficiency = r1(ts / tib * 100)
    const wt = clamp(wakeTime, 0, 120)

    let status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    let category = ""
    if (efficiency >= 85) { category = "Good sleep efficiency"; status = "good" }
    else if (efficiency >= 75) { category = "Borderline efficiency — CBT-I may help"; status = "warning" }
    else { category = "Poor sleep efficiency — clinical evaluation recommended"; status = "danger" }

    setResult({
      primaryMetric: { label: "Sleep Efficiency", value: efficiency, unit: "%", status, description: `${category}` },
      healthScore: Math.min(100, r0(efficiency)),
      metrics: [
        { label: "Sleep Efficiency", value: efficiency, unit: "%", status },
        { label: "Time in Bed", value: tib, unit: "hours", status: "normal" },
        { label: "Actual Sleep", value: ts, unit: "hours", status: ts >= 7 ? "good" : "warning" },
        { label: "Wake-ups Per Night", value: wakeUps, status: wakeUps <= 1 ? "good" : wakeUps <= 3 ? "warning" : "danger" },
        { label: "Total Wake After Sleep Onset", value: wt, unit: "minutes", status: wt <= 20 ? "good" : wt <= 30 ? "warning" : "danger" },
        { label: "Category", value: category, status }
      ],
      recommendations: [
        { title: "CBT-I: First-Line Insomnia Treatment", description: "If efficiency <85%, Cognitive Behavioral Therapy for Insomnia (CBT-I) is more effective than sleep medication long-term. Key techniques: sleep restriction (brief), stimulus control (bed = sleep only), sleep hygiene, relaxation techniques.", priority: "high", category: "Treatment" },
        { title: "Improve Sleep Efficiency", description: "1. Get out of bed if awake >20 min (stimulus control). 2. Restrict time in bed to match actual sleep (sleep restriction). 3. Wake up same time every day. 4. Use bed only for sleep. 5. Avoid clocks watching at night.", priority: "high", category: "Techniques" },
        { title: "Monitoring Tip", description: "Track sleep efficiency with a sleep diary or wearable for 2 weeks to identify patterns. Good triggers: late caffeine, alcohol, irregular schedule, blue light exposure, bedroom temperature.", priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Time in Bed": `${tib} hrs`, "Actual Sleep": `${ts} hrs`, "Efficiency": `${efficiency}%`, "Wake-ups": wakeUps, "WASO": `${wt} min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="sleep-efficiency-calculator" title="Sleep Efficiency Calculator"
      description="Calculate your sleep efficiency and identify insomnia indicators. Based on evidence-based CBT-I criteria."
      icon={Moon} calculate={calculate} onClear={() => { setTimeInBed(8); setTotalSleep(6.5); setWakeUps(2); setWakeTime(20); setResult(null) }}
      values={[timeInBed, totalSleep, wakeUps, wakeTime]} result={result}
      seoContent={<SeoContentGenerator title="Sleep Efficiency Calculator" description="Measure sleep quality with efficiency calculation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Time in Bed" val={timeInBed} set={setTimeInBed} min={1} max={16} step={0.25} suffix="hours" />
          <NumInput label="Actual Sleep Time" val={totalSleep} set={setTotalSleep} min={0} max={16} step={0.25} suffix="hours" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Number of Wake-ups" val={wakeUps} set={setWakeUps} min={0} max={20} />
          <NumInput label="Total Awake Time" val={wakeTime} set={setWakeTime} min={0} max={120} suffix="minutes" />
        </div>
      </div>} />
  )
}

// ─── 4. Caffeine Intake / Half-Life Daily Tracker ─────────────────────────────
export function CaffeineDailyTrackerCalculator() {
  const [morningCoffee, setMorningCoffee] = useState(2)
  const [afternoonCoffee, setAfternoonCoffee] = useState(1)
  const [morningTime, setMorningTime] = useState(8)
  const [afternoonTime, setAfternoonTime] = useState(14)
  const [bedtimeHour, setBedtimeHour] = useState(23)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const caffPerCup = 100   // avg mg per cup
    const morningMg = clamp(morningCoffee, 0, 20) * caffPerCup
    const afternoonMg = clamp(afternoonCoffee, 0, 20) * caffPerCup
    const halfLife = 5       // hours average

    const morningRemain = r0(morningMg * Math.pow(0.5, (bedtimeHour - morningTime) / halfLife))
    const afternoonRemain = r0(afternoonMg * Math.pow(0.5, (bedtimeHour - afternoonTime) / halfLife))
    const totalRemain = morningRemain + afternoonRemain
    const totalCaffeine = morningMg + afternoonMg

    const cutoffHour = r0(bedtimeHour - halfLife * Math.log2(4))   // when to cut off to have <25mg at bedtime

    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (totalRemain > 100) status = "danger"
    else if (totalRemain > 50) status = "warning"

    setResult({
      primaryMetric: { label: "Caffeine at Bedtime", value: totalRemain, unit: "mg", status, description: `${status === "good" ? "Low caffeine — minimal sleep impact" : status === "warning" ? "Moderate caffeine — may delay sleep onset" : "High caffeine — likely to delay sleep by 1-2 hours"}` },
      metrics: [
        { label: "Total Daily Caffeine", value: totalCaffeine, unit: "mg", status: totalCaffeine > 400 ? "danger" : totalCaffeine > 200 ? "warning" : "good" },
        { label: "Caffeine at Bedtime (est.)", value: totalRemain, unit: "mg", status },
        { label: "From Morning Coffee", value: morningRemain, unit: "mg remaining", status: morningRemain < 25 ? "good" : "normal" },
        { label: "From Afternoon Coffee", value: afternoonRemain, unit: "mg remaining", status: afternoonRemain < 50 ? "normal" : "warning" },
        { label: "Last Caffeine Cutoff", value: `${cutoffHour}:00`, status: cutoffHour > 14 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Caffeine & Sleep", description: `Caffeine has a ~5-hour half-life. Caffeine remaining at bedtime (${bedtimeHour}:00): ${totalRemain} mg. >50 mg at bedtime significantly reduces deep sleep (N3) by up to 10-20%. Ideal: <25 mg at bedtime. Stop caffeine by ${cutoffHour}:00.`, priority: "high", category: "Sleep Impact" },
        { title: "Safe Daily Limits", description: "FDA and most health agencies consider up to 400 mg/day safe for healthy adults. Pregnant women: <200 mg/day. Individual sensitivity varies widely due to CYP1A2 enzyme genetics.", priority: "medium", category: "Safety" }
      ],
      detailedBreakdown: { "Total Caffeine": `${totalCaffeine} mg`, "At Bedtime": `${totalRemain} mg`, "Cutoff Time": `${cutoffHour}:00` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="caffeine-sleep-calculator" title="Caffeine & Sleep Calculator"
      description="Calculate how much caffeine remains in your system at bedtime. Find the ideal caffeine cutoff time to protect sleep quality."
      icon={Coffee} calculate={calculate} onClear={() => { setMorningCoffee(2); setAfternoonCoffee(1); setMorningTime(8); setAfternoonTime(14); setBedtimeHour(23); setResult(null) }}
      values={[morningCoffee, afternoonCoffee, morningTime, afternoonTime, bedtimeHour]} result={result}
      seoContent={<SeoContentGenerator title="Caffeine Sleep Calculator" description="Track caffeine at bedtime and sleep impact timing." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Morning Cups" val={morningCoffee} set={setMorningCoffee} min={0} max={20} suffix="cups (~100mg each)" />
          <NumInput label="Morning Time" val={morningTime} set={setMorningTime} min={4} max={14} suffix="hour (e.g. 8 = 8am)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Afternoon Cups" val={afternoonCoffee} set={setAfternoonCoffee} min={0} max={20} suffix="cups (~100mg each)" />
          <NumInput label="Afternoon Time" val={afternoonTime} set={setAfternoonTime} min={10} max={22} suffix="hour (e.g. 14 = 2pm)" />
        </div>
        <NumInput label="Bedtime" val={bedtimeHour} set={setBedtimeHour} min={18} max={30} suffix="hour (e.g. 23 = 11pm)" />
      </div>} />
  )
}

// ─── 5. Jet Lag Calculator ───────────────────────────────────────────────────
export function JetLagCalculator() {
  const [timeZoneChange, setTimeZoneChange] = useState(6)
  const [direction, setDirection] = useState("east")
  const [age, setAge] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const tz = clamp(Math.abs(timeZoneChange), 1, 14)
    const a = clamp(age, 10, 90)

    // Recovery: ~1 day per hour for eastward, 1 day per 1.5h westward
    const recoveryDays = direction === "east"
      ? r1(tz * 1.0 * (1 + (a > 50 ? 0.2 : 0)))
      : r1(tz * 0.67 * (1 + (a > 50 ? 0.2 : 0)))

    const symptoms = []
    if (tz >= 2) symptoms.push("Difficulty sleeping or staying awake")
    if (tz >= 4) symptoms.push("Daytime fatigue, poor concentration")
    if (tz >= 6) symptoms.push("Gastrointestinal disturbance")
    if (tz >= 8) symptoms.push("Mood disturbance, irritability")

    setResult({
      primaryMetric: { label: "Recovery Time", value: r0(recoveryDays), unit: "days", status: recoveryDays > 7 ? "warning" : "normal", description: `${direction === "east" ? "Eastward" : "Westward"} travel: ${tz} time zones` },
      metrics: [
        { label: "Time Zones Crossed", value: tz, status: "normal" },
        { label: "Travel Direction", value: direction === "east" ? "Eastward (harder)" : "Westward (easier)", status: direction === "east" ? "warning" : "normal" },
        { label: "Recovery Time (est.)", value: r0(recoveryDays), unit: "days", status: recoveryDays > 7 ? "warning" : "good" },
        { label: "Circadian Shift Needed", value: tz, unit: "hours", status: "normal" }
      ],
      recommendations: [
        { title: "Light Exposure Strategy", description: direction === "east"
          ? `For eastward travel (${tz} zones): Seek bright light in the morning at the destination, avoid light in the evening. This advances your circadian clock. Move bedtime 1 hour earlier per day starting 2 days before departure.`
          : `For westward travel (${tz} zones): Seek bright light in the evening at destination, avoid morning light. This delays your circadian clock. Westward travel is generally easier to adapt to.`, priority: "high", category: "Light Therapy" },
        { title: "Melatonin Timing", description: direction === "east"
          ? "Take 0.5-3mg melatonin at the destination's bedtime (first 3-5 days) to accelerate adaptation. Low doses (0.5mg) are often as effective as higher doses."
          : "Melatonin is less critical for westward travel. Take at local bedtime only if you have trouble initiating sleep.", priority: "medium", category: "Melatonin" },
        { title: "Nutrition & Hydration", description: "Airplane cabins have low humidity — drink 250mL water per hour of flight. Avoid alcohol and excess caffeine during travel. Eat meals at the destination timezone's schedule to help shift your gut circadian clock.", priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Zones": tz, "Direction": direction, "Recovery": `${r0(recoveryDays)} days`, "Difficulty": direction === "east" ? "Harder (advancing clock)" : "Easier (delaying clock)" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="jet-lag-calculator" title="Jet Lag Calculator"
      description="Calculate jet lag recovery time based on time zones crossed and direction of travel. Includes light therapy and melatonin timing."
      icon={Sun} calculate={calculate} onClear={() => { setTimeZoneChange(6); setDirection("east"); setAge(35); setResult(null) }}
      values={[timeZoneChange, direction, age]} result={result}
      seoContent={<SeoContentGenerator title="Jet Lag Calculator" description="Estimate jet lag duration and recovery strategy." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Time Zones Crossed" val={timeZoneChange} set={setTimeZoneChange} min={1} max={14} />
        <SelectInput label="Direction of Travel" val={direction} set={setDirection} options={[{ value: "east", label: "Eastward (harder)" }, { value: "west", label: "Westward (easier)" }]} />
        <NumInput label="Your Age" val={age} set={setAge} min={10} max={90} suffix="years" />
      </div>} />
  )
}

// ─── 6. Smoke-Free Savings Calculator ────────────────────────────────────────
export function SmokeFreeCalculator() {
  const [cigarettesPerDay, setCigarettesPerDay] = useState(15)
  const [pricePerPack, setPricePerPack] = useState(300)
  const [daysQuit, setDaysQuit] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cpd = clamp(cigarettesPerDay, 1, 100)
    const ppp = clamp(pricePerPack, 1, 2000)
    const dq = clamp(daysQuit, 0, 36500)

    const pricePer = ppp / 20    // per cigarette
    const dailyCost = cpd * pricePer
    const savedSoFar = r0(dailyCost * dq)
    const savedYear = r0(dailyCost * 365)
    const saved5Year = r0(savedYear * 5)
    const cigarettesAvoided = cpd * dq

    // Health timeline after quitting
    const healthTimeline = [
      { time: "20 minutes", benefit: "Heart rate and blood pressure drop" },
      { time: "12 hours", benefit: "Carbon monoxide levels normalize" },
      { time: "2-12 weeks", benefit: "Circulation and lung function improve" },
      { time: "1-9 months", benefit: "Coughing decreases, lung cilia recover" },
      { time: "1 year", benefit: "Heart attack risk drops by 50%" },
      { time: "5 years", benefit: "Stroke risk equals non-smoker" },
      { time: "10 years", benefit: "Lung cancer risk drops by 50%" },
      { time: "15 years", benefit: "Heart disease risk equals non-smoker" }
    ]

    const nextMilestone = dq < 0.014 ? healthTimeline[0]
      : dq < 0.5 ? healthTimeline[1]
      : dq < 90 ? healthTimeline[2]
      : dq < 270 ? healthTimeline[3]
      : dq < 365 ? healthTimeline[4]
      : dq < 1825 ? healthTimeline[5]
      : dq < 3650 ? healthTimeline[6]
      : healthTimeline[7]

    setResult({
      primaryMetric: { label: "Money Saved", value: savedSoFar.toLocaleString(), unit: "₹", status: "good", description: dq > 0 ? `${dq} days smoke-free. ${cigarettesAvoided.toLocaleString()} cigarettes avoided.` : "Start tracking savings from day 1" },
      healthScore: Math.min(100, r0(dq / 365 * 50 + 50)),
      metrics: [
        { label: "Saved So Far", value: `₹${savedSoFar.toLocaleString()}`, status: "good" },
        { label: "Daily Spend (avoided)", value: `₹${r0(dailyCost)}`, status: "normal" },
        { label: "Annual Savings", value: `₹${savedYear.toLocaleString()}`, status: "good" },
        { label: "5-Year Savings", value: `₹${saved5Year.toLocaleString()}`, status: "good" },
        { label: "Cigarettes Avoided", value: cigarettesAvoided.toLocaleString(), status: "good" },
        { label: "Next Health Milestone", value: nextMilestone.benefit, status: "good" }
      ],
      recommendations: [
        { title: "Health Timeline Progress", description: `At ${dq} days smoke-free: ${dq >= 1 ? "12-hour milestone: CO normalized. " : ""}${dq >= 14 ? "Circulation improving. " : ""}${dq >= 365 ? "1-year milestone: Heart attack risk reduced 50%!" : ""}${dq === 0 ? "Start today. Even stopping for 20 minutes starts health recovery." : ""}`, priority: "high", category: "Health Recovery" },
        { title: "Withdrawal Management", description: "Peak nicotine cravings last 3-5 minutes. Strategies: 4-7-8 breathing, drink cold water, 5-minute walk, text a support person. NRT (patches, gum) doubles quit success rates. Combine with behavioral support for best results.", priority: "high", category: "Quitting Tips" }
      ],
      detailedBreakdown: { "Cigarettes/Day": cpd, "Pack Price": `₹${ppp}`, "Daily Cost": `₹${r0(dailyCost)}`, "Days Quit": dq, "Saved": `₹${savedSoFar.toLocaleString()}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="smoke-free-savings-calculator" title="Smoke-Free Savings Calculator"
      description="Track money saved and health benefits of quitting smoking. Includes complete health recovery timeline after quitting."
      icon={Activity} calculate={calculate} onClear={() => { setCigarettesPerDay(15); setPricePerPack(300); setDaysQuit(0); setResult(null) }}
      values={[cigarettesPerDay, pricePerPack, daysQuit]} result={result}
      seoContent={<SeoContentGenerator title="Smoke Free Savings Calculator" description="Track money and health gains from quitting smoking." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cigarettes Per Day" val={cigarettesPerDay} set={setCigarettesPerDay} min={1} max={100} />
          <NumInput label="Price Per Pack (20 cigs)" val={pricePerPack} set={setPricePerPack} min={1} max={2000} suffix="₹" />
        </div>
        <NumInput label="Days Smoke-Free (0 if still smoking)" val={daysQuit} set={setDaysQuit} min={0} max={36500} />
      </div>} />
  )
}

// ─── 7. Nap Calculator ────────────────────────────────────────────────────────
export function NapCalculator() {
  const [currentTime, setCurrentTime] = useState("14:00")
  const [napDuration, setNapDuration] = useState(20)
  const [bedtimeHour, setBedtimeHour] = useState(23)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const [ch, cm] = currentTime.split(":").map(Number)
    const nowMin = ch * 60 + cm
    const dur = clamp(napDuration, 5, 120)
    const bed = clamp(bedtimeHour, 16, 32)

    const wakeTime = nowMin + dur
    const wakeH = Math.floor(wakeTime / 60) % 24
    const wakeM = wakeTime % 60
    const wakeStr = `${String(wakeH).padStart(2, "0")}:${String(wakeM).padStart(2, "0")}`

    const hoursBeforeBed = (bed * 60 - (nowMin + dur)) / 60

    let napType = "", benefits = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (dur <= 10) { napType = "Power nap (5-10 min)"; benefits = "Alertness boost without grogginess. Ideal before a task." }
    else if (dur <= 25) { napType = "N1-N2 nap (10-25 min)"; benefits = "NASA recommended 26-min nap improves alertness by 54%, performance by 34%." }
    else if (dur <= 60) { napType = "N2-N3 nap (30-60 min)"; benefits = "Includes light deep sleep. May cause sleep inertia for 30 min after waking." }
    else { napType = "Full cycle nap (90 min)"; benefits = "Complete sleep cycle including REM. Minimizes grogginess, boosts creativity and memory." }

    if (hoursBeforeBed < 4) status = "warning"

    setResult({
      primaryMetric: { label: "Wake from Nap At", value: wakeStr, status, description: `${napType} — ${hoursBeforeBed < 4 ? "Too close to bedtime" : `${r1(hoursBeforeBed)} hours before bedtime`}` },
      metrics: [
        { label: "Nap Start", value: currentTime, status: "normal" },
        { label: "Nap End (Wake at)", value: wakeStr, status },
        { label: "Duration", value: dur, unit: "minutes", status: dur <= 25 || dur === 90 ? "good" : "normal" },
        { label: "Nap Type", value: napType, status: "normal" },
        { label: "Hours Before Bedtime", value: r1(hoursBeforeBed), unit: "hours", status: hoursBeforeBed >= 4 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Optimal Nap Times", description: "Best nap times: 1-3 PM (natural circadian dip). Avoid napping after 4 PM if bedtime is before 11 PM — it will interfere with night sleep. Afternoon nap restores alertness and improves performance equivalent to caffeine without tolerance.", priority: "high", category: "Timing" },
        { title: "Benefits", description: benefits, priority: "medium", category: "Science" }
      ],
      detailedBreakdown: { "Nap Start": currentTime, "Duration": `${dur} min`, "Wake At": wakeStr, "Type": napType, "Hours to Bed": r1(hoursBeforeBed) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="nap-calculator" title="Nap Calculator"
      description="Plan the ideal nap duration and timing. Avoid sleep inertia, protect nighttime sleep, and maximize nap benefits."
      icon={Moon} calculate={calculate} onClear={() => { setCurrentTime("14:00"); setNapDuration(20); setBedtimeHour(23); setResult(null) }}
      values={[currentTime, napDuration, bedtimeHour]} result={result}
      seoContent={<SeoContentGenerator title="Nap Calculator" description="Plan the perfect nap for maximum alertness." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="space-y-1"><label className="text-sm font-medium">Current Time</label><input type="time" value={currentTime} onChange={e => setCurrentTime(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" /></div>
        <NumInput label="Planned Nap Duration" val={napDuration} set={setNapDuration} min={5} max={120} suffix="minutes" />
        <NumInput label="Bedtime (hour, e.g. 23 = 11pm)" val={bedtimeHour} set={setBedtimeHour} min={16} max={32} suffix="hour" />
      </div>} />
  )
}

// ─── 8. Alcohol Calorie Calculator ────────────────────────────────────────────
export function AlcoholCalorieCalculator() {
  const [weight, setWeight] = useState(70)
  const [gender, setGender] = useState("male")
  const [drinks, setDrinks] = useState(3)
  const [abv, setAbv] = useState(5)
  const [volume, setVolume] = useState(330)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 300)
    const d = clamp(drinks, 1, 50)
    const a = clamp(abv, 0.5, 60)
    const v = clamp(volume, 50, 1000)

    const alcoholGrams = d * v * a / 100 * 0.789    // grams of alcohol
    const alcoholCalories = r0(alcoholGrams * 7)
    const totalCalories = r0(alcoholCalories)
    const bac = r2(alcoholGrams / (w * (gender === "male" ? 0.68 : 0.55) * 10) - 0.015)
    const standardDrinks = r1(alcoholGrams / 10)

    let bacStatus: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (bac > 0.08) bacStatus = "danger"
    else if (bac > 0.05) bacStatus = "warning"

    setResult({
      primaryMetric: { label: "Alcohol Calories", value: totalCalories, unit: "kcal", status: "normal", description: `${standardDrinks} standard drinks — est. BAC: ${Math.max(0, bac).toFixed(3)}%` },
      metrics: [
        { label: "Total Alcohol Calories", value: totalCalories, unit: "kcal", status: "normal" },
        { label: "Grams of Alcohol", value: r1(alcoholGrams), unit: "g", status: alcoholGrams > 120 ? "danger" : alcoholGrams > 60 ? "warning" : "normal" },
        { label: "Standard Drinks", value: standardDrinks, status: standardDrinks > 4 ? "danger" : standardDrinks > 2 ? "warning" : "good" },
        { label: "Estimated BAC", value: Math.max(0, bac).toFixed(3), unit: "%", status: bacStatus },
        { label: "Caloric Equivalent", value: `≈ ${r0(totalCalories / 400)} slices of pizza`, status: "normal" },
        { label: "Liver processing time", value: r0(alcoholGrams / 10), unit: "hours approx.", status: "normal" }
      ],
      recommendations: [
        { title: "Alcohol & Health", description: "Each gram of alcohol contains 7 kcal. Heavy drinking triples liver disease risk, increases cancer risk for 7 types, disrupts deep sleep (N3), and depletes B-vitamins. Weekly limit: ≤14 standard drinks (men), ≤7 (women — WHO).", priority: "high", category: "Health Impact" },
        { title: "Alcohol & Weight", description: `These ${d} drinks contain ${totalCalories} kcal — similar to a meal. Alcohol also reduces fat burning by up to 73% as your body prioritizes metabolizing alcohol. Combined with late-night snacking, this creates a large calorie surplus.`, priority: "medium", category: "Weight Management" }
      ],
      detailedBreakdown: { "Drinks": d, "ABV": `${a}%`, "Volume": `${v}mL each`, "Alcohol": `${r1(alcoholGrams)}g`, "Calories": `${totalCalories} kcal`, "BAC (est.)": Math.max(0, bac).toFixed(3) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="alcohol-calorie-calculator" title="Alcohol Calorie Calculator"
      description="Calculate calories from alcoholic drinks and estimated BAC. Includes standard drink count and health impact assessment."
      icon={Activity} calculate={calculate} onClear={() => { setWeight(70); setGender("male"); setDrinks(3); setAbv(5); setVolume(330); setResult(null) }}
      values={[weight, gender, drinks, abv, volume]} result={result}
      seoContent={<SeoContentGenerator title="Alcohol Calorie Calculator" description="Calculate calories in alcohol beverages." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Number of Drinks" val={drinks} set={setDrinks} min={1} max={50} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Alcohol by Volume (ABV)" val={abv} set={setAbv} min={0.5} max={60} step={0.5} suffix="%" />
          <NumInput label="Volume per Drink" val={volume} set={setVolume} min={50} max={1000} suffix="mL" />
        </div>
      </div>} />
  )
}
