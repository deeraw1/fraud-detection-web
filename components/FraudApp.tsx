'use client'
import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fraud-detection-api-b339.onrender.com'

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

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

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
  amount: '', hour: '14', day_of_week: '1',
  distance_from_home: '', distance_from_last_txn: '',
  ratio_to_median: '1', txn_count_1h: '1',
  merchant_category: 'groceries',
  repeat_retailer: true, used_chip: true, used_pin: true, online_order: false,
}

function decisionColor(d: string) {
  if (d === 'FRAUD')  return '#e74c3c'
  if (d === 'REVIEW') return '#f59e0b'
  return '#17c082'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function KV({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0',
      borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>{k}</span>
      <span style={{ fontWeight: 600, color: color ?? 'var(--text)', fontSize: '0.9rem' }}>{v}</span>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
        fontSize: '0.86rem', fontWeight: 600, transition: 'all 0.15s',
        background: checked ? 'rgba(23,192,130,0.1)' : 'transparent',
        border: checked ? '1px solid rgba(23,192,130,0.35)' : '1px solid var(--border2)',
        color: checked ? '#17c082' : 'var(--muted)',
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%',
        background: checked ? '#17c082' : 'var(--faint)', flexShrink: 0 }} />
      {label}
    </button>
  )
}

export default function FraudApp() {
  const [txn,     setTxn]     = useState<TxnInput>(defaultTxn)
  const [result,  setResult]  = useState<FraudResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(key: keyof TxnInput, val: string | boolean) {
    setTxn(prev => ({ ...prev, [key]: val })); setResult(null)
  }

  async function analyse() {
    setError(''); setResult(null); setLoading(true)
    try {
      const payload = {
        amount:                 parseFloat(txn.amount) || 0,
        hour:                   parseInt(txn.hour),
        day_of_week:            parseInt(txn.day_of_week),
        distance_from_home:     parseFloat(txn.distance_from_home) || 0,
        distance_from_last_txn: parseFloat(txn.distance_from_last_txn) || 0,
        ratio_to_median:        parseFloat(txn.ratio_to_median) || 1,
        txn_count_1h:           parseInt(txn.txn_count_1h) || 1,
        merchant_category:      txn.merchant_category,
        repeat_retailer:        txn.repeat_retailer ? 1 : 0,
        used_chip:              txn.used_chip ? 1 : 0,
        used_pin:               txn.used_pin ? 1 : 0,
        online_order:           txn.online_order ? 1 : 0,
      }
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'API error')
      }
      const data = await res.json()
      setResult(data)
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  const dColor = result ? decisionColor(result.decision) : '#17c082'
  const pct    = result ? Math.round(result.fraud_probability * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1020, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#12060a 0%,#200a10 55%,#3a0d18 100%)',
          borderRadius: 16, padding: '48px 52px', marginBottom: 36, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 40, top: -10, fontSize: 180,
            opacity: 0.05, color: '#fff', lineHeight: 1, userSelect: 'none' }}>◆</div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Fraud Detection Engine
          </h1>
          <p style={{ color: '#f0a0b0', fontSize: '1rem', maxWidth: 560 }}>
            Real-time transaction fraud scoring powered by XGBoost ML.
            Trained on 150,000 transactions — instant fraud probability, risk level, and explainable risk factors.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['XGBoost Model', '150k Training Records', 'Real-time Scoring', 'Explainable Risk Factors', 'FRAUD · REVIEW · CLEAR'].map(t => (
              <span key={t} className="tag" style={{
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.25)', color: '#f08090',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Input + Result grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Input */}
          <div className="card">
            <div className="section-label" style={{ color: '#e74c3c' }}>Transaction Details</div>
            <div className="section-title">Enter Transaction Information</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <Field label="Amount ($)">
                <input type="number" value={txn.amount} min="0" step="0.01" placeholder="e.g. 250.00"
                  onChange={e => set('amount', e.target.value)} />
              </Field>
              <Field label="Merchant Category">
                <select value={txn.merchant_category} onChange={e => set('merchant_category', e.target.value)}>
                  {MERCHANT_CATEGORIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Hour of Day (0–23)">
                <input type="number" value={txn.hour} min="0" max="23"
                  onChange={e => set('hour', e.target.value)} />
              </Field>
              <Field label="Day of Week">
                <select value={txn.day_of_week} onChange={e => set('day_of_week', e.target.value)}>
                  {DAYS.map((d, i) => <option key={i} value={String(i)}>{d}</option>)}
                </select>
              </Field>
              <Field label="Distance from Home (km)">
                <input type="number" value={txn.distance_from_home} min="0" placeholder="e.g. 5"
                  onChange={e => set('distance_from_home', e.target.value)} />
              </Field>
              <Field label="Distance from Last Txn (km)">
                <input type="number" value={txn.distance_from_last_txn} min="0" placeholder="e.g. 2"
                  onChange={e => set('distance_from_last_txn', e.target.value)} />
              </Field>
              <Field label="Ratio to Median Spend">
                <input type="number" value={txn.ratio_to_median} min="0" step="0.1" placeholder="1.0"
                  onChange={e => set('ratio_to_median', e.target.value)} />
              </Field>
              <Field label="Transactions in Last Hour">
                <input type="number" value={txn.txn_count_1h} min="0" max="50"
                  onChange={e => set('txn_count_1h', e.target.value)} />
              </Field>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label className="field-label" style={{ marginBottom: 10 }}>Transaction Flags</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Toggle label="Repeat Retailer" checked={txn.repeat_retailer} onChange={v => set('repeat_retailer', v)} />
                <Toggle label="Chip Used"        checked={txn.used_chip}       onChange={v => set('used_chip', v)} />
                <Toggle label="PIN Used"         checked={txn.used_pin}        onChange={v => set('used_pin', v)} />
                <Toggle label="Online Order"     checked={txn.online_order}    onChange={v => set('online_order', v)} />
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%',
              background: loading || !txn.amount ? undefined : '#e74c3c' }}
              onClick={analyse} disabled={loading || !txn.amount}>
              {loading ? 'Analysing Transaction...' : 'Analyse Transaction'}
            </button>
            {error && <p style={{ color: '#e74c3c', fontSize: '0.82rem', marginTop: 10 }}>{error}</p>}
          </div>

          {/* Result */}
          <div id="result">
            {!result && !loading && (
              <div className="card" style={{ textAlign: 'center', padding: '60px 22px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Enter transaction details and click<br />
                  <strong style={{ color: 'var(--text)' }}>Analyse Transaction</strong> to get fraud score
                </p>
              </div>
            )}
            {loading && (
              <div className="card" style={{ textAlign: 'center', padding: '60px 22px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Running fraud model...</p>
              </div>
            )}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Decision banner */}
                <div style={{
                  background: `${dColor}18`, border: `1px solid ${dColor}55`,
                  borderRadius: 12, padding: '24px 28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase',
                      letterSpacing: '1.5px', marginBottom: 6 }}>Decision</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: dColor }}>
                      {result.decision}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>
                      Risk Level: <span style={{ color: dColor }}>{result.risk_level}</span>
                      {' · '}Confidence: {result.confidence}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: dColor, lineHeight: 1 }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                      Fraud Probability
                    </div>
                    {/* Probability bar */}
                    <div style={{ width: 120, height: 6, background: 'var(--border2)', borderRadius: 4, marginTop: 8 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: dColor, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="card">
                  <div className="section-label" style={{ color: '#e74c3c' }}>Risk Factors</div>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.risk_factors.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ marginTop: 5, width: 7, height: 7, borderRadius: '50%',
                          background: dColor, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="card">
                  <div className="section-label" style={{ color: '#e74c3c' }}>Score Breakdown</div>
                  <div style={{ marginTop: 14 }}>
                    <KV k="Fraud Probability"   v={`${(result.fraud_probability * 100).toFixed(2)}%`} color={dColor} />
                    <KV k="Model Confidence"    v={result.confidence} />
                    <KV k="Risk Classification" v={result.risk_level} color={dColor} />
                    <KV k="Recommended Action"  v={result.decision === 'FRAUD' ? 'Block & Alert' : result.decision === 'REVIEW' ? 'Manual Review' : 'Approve'} color={dColor} />
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Stats footer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 32 }}>
          {[
            { label: 'Training Records', value: '150,000' },
            { label: 'Model Architecture', value: 'XGBoost' },
            { label: 'Fraud Rate (Train)', value: '3.5%' },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e74c3c' }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
