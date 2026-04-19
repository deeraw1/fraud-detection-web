'use client'
import { useState } from 'react'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fraud-detection-api-b339.onrender.com'

const ACCENT   = '#ef4444'
const SAFE     = '#22c55e'
const WARN     = '#f59e0b'

const MERCHANT_CATEGORIES = [
  { value: 'groceries',      label: 'Groceries' },
  { value: 'gas_station',    label: 'Gas Station' },
  { value: 'online_retail',  label: 'Online Retail' },
  { value: 'travel',         label: 'Travel' },
  { value: 'restaurants',    label: 'Restaurants' },
  { value: 'electronics',    label: 'Electronics' },
  { value: 'atm_withdrawal', label: 'ATM Withdrawal' },
  { value: 'other',          label: 'Other' },
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface TxnInput {
  amount: string
  hour: string
  day_of_week: string
  distance_from_home: string
  distance_from_last_txn: string
  ratio_to_median: string
  txn_count_1h: string
  merchant_category: string
  repeat_retailer: boolean
  used_chip: boolean
  used_pin: boolean
  online_order: boolean
}

interface FraudResult {
  fraud_probability: number
  decision: string
  risk_level: string
  risk_factors: string[]
  confidence: string
}

const defaultTxn: TxnInput = {
  amount: '',
  hour: '14',
  day_of_week: '1',
  distance_from_home: '',
  distance_from_last_txn: '',
  ratio_to_median: '1',
  txn_count_1h: '1',
  merchant_category: 'groceries',
  repeat_retailer: true,
  used_chip: true,
  used_pin: true,
  online_order: false,
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <span className="text-xs text-gray-600">{hint}</span>}
    </div>
  )
}

function Input({ value, onChange, type = 'number', placeholder = '', min, max, step }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; min?: string; max?: string; step?: string
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      min={min} max={max} step={step}
      onChange={e => onChange(e.target.value)}
      className="bg-[#0d1b2a] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white
                 focus:outline-none focus:border-[#ef4444] transition-colors"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="bg-[#0d1b2a] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white
                 focus:outline-none focus:border-[#ef4444] transition-colors"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-all ${
        checked
          ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
          : 'border-[#1e3a5f] bg-transparent text-gray-500'
      }`}
    >
      <span className={`w-3 h-3 rounded-full ${checked ? 'bg-[#22c55e]' : 'bg-gray-600'}`} />
      {label}
    </button>
  )
}

function FraudGauge({ prob }: { prob: number }) {
  const pct   = Math.round(prob * 100)
  const color = prob >= 0.5 ? ACCENT : prob >= 0.25 ? WARN : SAFE
  const data  = [{ value: pct, fill: color }, { value: 100 - pct, fill: '#1e3a5f' }]
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
            startAngle={90} endAngle={-270} data={data}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={6} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{pct}%</span>
          <span className="text-xs text-gray-500 mt-1">Fraud Probability</span>
        </div>
      </div>
    </div>
  )
}

export default function FraudApp() {
  const [txn, setTxn]       = useState<TxnInput>(defaultTxn)
  const [result, setResult] = useState<FraudResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function set(key: keyof TxnInput, val: string | boolean) {
    setTxn(prev => ({ ...prev, [key]: val }))
  }

  async function analyse() {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const payload = {
        amount:                  parseFloat(txn.amount) || 0,
        hour:                    parseInt(txn.hour),
        day_of_week:             parseInt(txn.day_of_week),
        distance_from_home:      parseFloat(txn.distance_from_home) || 0,
        distance_from_last_txn:  parseFloat(txn.distance_from_last_txn) || 0,
        ratio_to_median:         parseFloat(txn.ratio_to_median) || 1,
        txn_count_1h:            parseInt(txn.txn_count_1h) || 1,
        merchant_category:       txn.merchant_category,
        repeat_retailer:         txn.repeat_retailer ? 1 : 0,
        used_chip:               txn.used_chip ? 1 : 0,
        used_pin:                txn.used_pin ? 1 : 0,
        online_order:            txn.online_order ? 1 : 0,
      }
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'API error')
      }
      setResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const decisionColor = result
    ? result.decision === 'FRAUD' ? ACCENT : result.decision === 'REVIEW' ? WARN : SAFE
    : '#fff'

  return (
    <div className="min-h-screen bg-[#060d16] text-white font-mono">
      {/* Header */}
      <div className="border-b border-[#0f2237] bg-[#060d16]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              <span className="text-[#ef4444]">▲</span> Fraud Detection Engine
            </h1>
            <p className="text-xs text-gray-500">Real-time transaction fraud scoring · XGBoost ML</p>
          </div>
          <div className="flex gap-3 text-xs text-gray-600">
            <span className="border border-[#1e3a5f] px-2 py-1 rounded">XGBoost Model</span>
            <span className="border border-[#1e3a5f] px-2 py-1 rounded">150k Training Records</span>
            <span className="border border-[#1e3a5f] px-2 py-1 rounded">Real-time Scoring</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Transaction Risk Analyser</h2>
          <p className="text-gray-400 max-w-xl text-sm">
            Submit transaction details to get an instant fraud probability score, risk level,
            and explainable risk factors from our ML model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-[#0a1628] border border-[#0f2237] rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Transaction Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount ($)" hint="Transaction value">
                <Input value={txn.amount} onChange={v => set('amount', v)} placeholder="e.g. 250.00" min="0" step="0.01" />
              </Field>
              <Field label="Merchant Category">
                <Select value={txn.merchant_category} onChange={v => set('merchant_category', v)} options={MERCHANT_CATEGORIES} />
              </Field>
              <Field label="Hour of Day" hint="0 = midnight, 23 = 11pm">
                <Input value={txn.hour} onChange={v => set('hour', v)} min="0" max="23" placeholder="0–23" />
              </Field>
              <Field label="Day of Week">
                <Select value={txn.day_of_week} onChange={v => set('day_of_week', v)}
                  options={DAYS.map((d, i) => ({ value: String(i), label: d }))} />
              </Field>
              <Field label="Distance from Home (km)" hint="How far from cardholder's home">
                <Input value={txn.distance_from_home} onChange={v => set('distance_from_home', v)} placeholder="e.g. 5" min="0" />
              </Field>
              <Field label="Distance from Last Txn (km)" hint="Jump from previous transaction">
                <Input value={txn.distance_from_last_txn} onChange={v => set('distance_from_last_txn', v)} placeholder="e.g. 2" min="0" />
              </Field>
              <Field label="Ratio to Median Spend" hint="1.0 = typical amount">
                <Input value={txn.ratio_to_median} onChange={v => set('ratio_to_median', v)} placeholder="e.g. 1.5" min="0" step="0.1" />
              </Field>
              <Field label="Transactions in Last Hour" hint="Velocity indicator">
                <Input value={txn.txn_count_1h} onChange={v => set('txn_count_1h', v)} placeholder="e.g. 1" min="0" max="50" />
              </Field>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Transaction Flags</p>
              <div className="grid grid-cols-2 gap-2">
                <Toggle label="Repeat Retailer"  checked={txn.repeat_retailer} onChange={v => set('repeat_retailer', v)} />
                <Toggle label="Chip Used"         checked={txn.used_chip}       onChange={v => set('used_chip', v)} />
                <Toggle label="PIN Used"          checked={txn.used_pin}        onChange={v => set('used_pin', v)} />
                <Toggle label="Online Order"      checked={txn.online_order}    onChange={v => set('online_order', v)} />
              </div>
            </div>

            <button
              onClick={analyse} disabled={loading || !txn.amount}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40
                         bg-[#ef4444] hover:bg-[#dc2626] text-white"
            >
              {loading ? 'Analysing...' : 'Analyse Transaction'}
            </button>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          {/* Result Panel */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="bg-[#0a1628] border border-[#0f2237] rounded-xl p-8 h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center text-2xl">
                  🔍
                </div>
                <p className="text-gray-500 text-sm">Enter transaction details and click<br/><span className="text-white">Analyse Transaction</span> to get fraud score</p>
              </div>
            )}
            {loading && (
              <div className="bg-[#0a1628] border border-[#0f2237] rounded-xl p-8 h-full flex items-center justify-center">
                <div className="text-gray-400 text-sm animate-pulse">Running fraud model...</div>
              </div>
            )}
            {result && (
              <>
                {/* Decision Banner */}
                <div className="rounded-xl p-5 border flex items-center justify-between"
                  style={{ borderColor: decisionColor, background: `${decisionColor}12` }}>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Decision</p>
                    <p className="text-2xl font-bold" style={{ color: decisionColor }}>{result.decision}</p>
                    <p className="text-xs text-gray-400 mt-1">Risk Level: <span style={{ color: decisionColor }}>{result.risk_level}</span> · Confidence: {result.confidence}</p>
                  </div>
                  <FraudGauge prob={result.fraud_probability} />
                </div>

                {/* Risk Factors */}
                <div className="bg-[#0a1628] border border-[#0f2237] rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    Risk Factors ({result.risk_factors.length})
                  </p>
                  <ul className="space-y-2">
                    {result.risk_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: result.decision === 'CLEAR' ? SAFE : result.decision === 'REVIEW' ? WARN : ACCENT }} />
                        <span className="text-gray-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Score Breakdown */}
                <div className="bg-[#0a1628] border border-[#0f2237] rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Score Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Fraud Probability', value: `${(result.fraud_probability * 100).toFixed(2)}%` },
                      { label: 'Model Confidence', value: result.confidence },
                      { label: 'Risk Classification', value: result.risk_level },
                      { label: 'Recommended Action', value: result.decision === 'FRAUD' ? 'Block & Alert' : result.decision === 'REVIEW' ? 'Manual Review' : 'Approve' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm border-b border-[#0f2237] pb-2 last:border-0 last:pb-0">
                        <span className="text-gray-500">{label}</span>
                        <span className="text-white font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Model Info */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Training Records', value: '150,000' },
            { label: 'Model', value: 'XGBoost' },
            { label: 'Fraud Rate (Train)', value: '3.5%' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0a1628] border border-[#0f2237] rounded-xl p-4">
              <p className="text-xl font-bold text-[#ef4444]">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
