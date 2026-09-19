import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './styles.css';
import MetricCard from './components/MetricCard';
import SectionHeader from './components/SectionHeader';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import EmptyState from './components/EmptyState';
import InsightCard from './components/InsightCard';
import AboutData from './components/AboutData';

const API = 'https://data.cityofnewyork.us/resource/2nwg-uqyg.json';
const LATEST_EXTRACT_QUERY = new URLSearchParams({ '$select': 'max(extract_date) as latest_extract_date' }).toString();

function modZctaQuery(extractDate) {
  return new URLSearchParams({
    '$select': 'mod_zcta', '$where': `extract_date='${extractDate}'`, '$group': 'mod_zcta', '$order': 'mod_zcta', '$limit': '500'
  }).toString();
}

function dailyQuery(extractDate, modZcta = '') {
  const where = [`extract_date='${extractDate}'`];
  if (modZcta) where.push(`mod_zcta='${modZcta.replaceAll("'", "''")}'`);
  return new URLSearchParams({
    '$select': 'date,sum(total_ed_visits) as total_ed_visits,sum(ili_pne_visits) as ili_pne_visits,sum(ili_pne_admissions) as ili_pne_admissions',
    '$where': where.join(' AND '), '$group': 'date', '$order': 'date', '$limit': '2000'
  }).toString();
}

async function fetchWithTimeout(url, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { signal: controller.signal }); } finally { clearTimeout(timer); }
}

function readableError(e) {
  return e?.name === 'AbortError' ? 'The NYC Open Data request took longer than 45 seconds. Try again.' : (e?.message || 'Unknown data-loading error.');
}

function App() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [extractDate, setExtractDate] = useState('');
  const [modZctas, setModZctas] = useState([]);
  const [selectedModZcta, setSelectedModZcta] = useState('');

  const loadSeries = useCallback(async (latestExtract, modZcta = '') => {
    const response = await fetchWithTimeout(`${API}?${dailyQuery(latestExtract, modZcta)}`);
    if (!response.ok) throw new Error(`NYC Open Data returned HTTP ${response.status}.`);
    const json = await response.json();
    if (!Array.isArray(json) || json.length === 0) throw new Error('NYC Open Data returned no rows for this selection.');
    const parsed = json.filter(d => d.date && d.ili_pne_visits != null).map(d => {
      const total = Number(d.total_ed_visits), visits = Number(d.ili_pne_visits), admissions = Number(d.ili_pne_admissions);
      return {
        date: d.date.slice(0, 10), total, visits, admissions,
        iliShare: total > 0 ? (visits / total) * 100 : 0,
        admissionRate: visits > 0 ? (admissions / visits) * 100 : 0
      };
    }).filter(d => [d.total,d.visits,d.admissions].every(Number.isFinite));
    if (!parsed.length) throw new Error('The API response did not contain usable visit data.');
    return parsed;
  }, []);

  const loadInitialData = useCallback(async () => {
    setStatus('loading'); setError('');
    try {
      const extractResponse = await fetchWithTimeout(`${API}?${LATEST_EXTRACT_QUERY}`);
      if (!extractResponse.ok) throw new Error(`NYC Open Data returned HTTP ${extractResponse.status}.`);
      const extractJson = await extractResponse.json();
      const latestExtract = extractJson?.[0]?.latest_extract_date;
      if (!latestExtract) throw new Error('Could not determine the latest dataset extraction.');
      const [zctaResponse, citywideRows] = await Promise.all([
        fetchWithTimeout(`${API}?${modZctaQuery(latestExtract)}`), loadSeries(latestExtract, '')
      ]);
      if (!zctaResponse.ok) throw new Error(`NYC Open Data returned HTTP ${zctaResponse.status}.`);
      const zctaJson = await zctaResponse.json();
      const zctas = Array.isArray(zctaJson) ? zctaJson.map(d => d.mod_zcta).filter(Boolean) : [];
      if (!zctas.length) throw new Error('Could not load the MODZCTA list.');
      setExtractDate(latestExtract.slice(0,10)); setModZctas(zctas); setRows(citywideRows); setStatus('ready');
    } catch (e) { setError(readableError(e)); setStatus('error'); }
  }, [loadSeries]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const changeGeography = async (event) => {
    const next = event.target.value; setSelectedModZcta(next); setStatus('loading'); setError('');
    try { setRows(await loadSeries(`${extractDate}T00:00:00.000`, next)); setStatus('ready'); }
    catch (e) { setError(readableError(e)); setStatus('error'); }
  };

  const retry = () => {
    if (!extractDate) return loadInitialData();
    setStatus('loading'); setError('');
    loadSeries(`${extractDate}T00:00:00.000`, selectedModZcta).then(r => { setRows(r); setStatus('ready'); }).catch(e => { setError(readableError(e)); setStatus('error'); });
  };

  const peak = useMemo(() => rows.reduce((a,b) => b.visits > (a?.visits ?? -1) ? b : a, null), [rows]);
  const summary = useMemo(() => {
    const sums = rows.reduce((a,d) => ({ total:a.total+d.total, visits:a.visits+d.visits, admissions:a.admissions+d.admissions }), {total:0,visits:0,admissions:0});
    return {
      iliShare: sums.total ? sums.visits / sums.total * 100 : 0,
      admissionRate: sums.visits ? sums.admissions / sums.visits * 100 : 0
    };
  }, [rows]);
  const geographyLabel = selectedModZcta ? `MODZCTA ${selectedModZcta}` : 'All NYC';
  const rollingRows = useMemo(() => rows.map((row, index) => {
    const start = Math.max(0, index - 6);
    const window = rows.slice(start, index + 1);
    const sums = window.reduce((a, d) => ({
      total: a.total + d.total,
      visits: a.visits + d.visits,
      admissions: a.admissions + d.admissions
    }), { total: 0, visits: 0, admissions: 0 });
    return {
      ...row,
      iliShare7d: sums.total > 0 ? (sums.visits / sums.total) * 100 : 0,
      admissionRate7d: sums.visits > 0 ? (sums.admissions / sums.visits) * 100 : 0
    };
  }), [rows]);

  const story = useMemo(() => {
    if (!rows.length || !rollingRows.length) return null;
    const maxShare = rollingRows.reduce((a, b) => b.iliShare7d > a.iliShare7d ? b : a, rollingRows[0]);
    const maxAdmission = rollingRows.reduce((a, b) => b.admissionRate7d > a.admissionRate7d ? b : a, rollingRows[0]);
    const avgVisits = slice => slice.length ? slice.reduce((sum, d) => sum + d.visits, 0) / slice.length : 0;
    const recent = avgVisits(rows.slice(-30));
    const prior = avgVisits(rows.slice(-60, -30));
    const change = prior > 0 ? ((recent - prior) / prior) * 100 : 0;
    return { maxShare, maxAdmission, recent, change };
  }, [rows, rollingRows]);

  return <main>
    <header>
      <p className="eyebrow">NYC OPEN DATA</p>
      <h1>Influenza-like Illness &amp; Pneumonia<br/>Emergency Department Trends</h1>
      <p className="lede">Explore daily ILI/pneumonia emergency department visits across NYC or focus on a single modified ZIP Code Tabulation Area (MODZCTA). The dashboard uses the latest Department of Health and Mental Hygiene extraction to avoid counting repeated historical snapshots.</p>
    </header>

    <section className="controls" aria-label="Dashboard filters">
      <label htmlFor="geography">Geography</label>
      <select 
        id="geography" 
        value={selectedModZcta} 
        onChange={changeGeography} 
        disabled={!extractDate || !modZctas.length || status==='loading'}
        aria-describedby="geography-help"
      >
        <option value="">All NYC</option>
        {modZctas.map(z => <option key={z} value={z}>MODZCTA {z}</option>)}
      </select>
      <p id="geography-help">{modZctas.length ? `${modZctas.length} MODZCTAs available` : 'Loading geographic options…'}</p>
    </section>

    <section className="card primary-chart-card">
      <div className="cardHead">
        <div>
          <h2>Visits over time</h2>
          <p>{geographyLabel} · March 2020–December 2022{extractDate && <> · Latest extraction: {extractDate}</>}</p>
        </div>
        {peak && status==='ready' && (
          <MetricCard 
            label="Peak daily total" 
            value={peak.visits.toLocaleString()} 
            explanation={peak.date}
            size="small"
          />
        )}
      </div>
      
      {status==='loading' && <LoadingState message={`Loading ${geographyLabel} data…`} />}
      {status==='error' && <ErrorState message={error} onRetry={retry} />}
      {status==='ready' && !rows.length && <EmptyState />}
      {status==='ready' && rows.length > 0 && (
        <div className="chart">
          <ResponsiveContainer width="100%" height={430}>
            <LineChart data={rows} margin={{top:12,right:20,left:10,bottom:12}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef3"/>
              <XAxis 
                dataKey="date" 
                minTickGap={55}
                tick={{fill: '#6b7784', fontSize: 12}}
                axisLine={{stroke: '#dde3e8'}}
              />
              <YAxis 
                width={70}
                tick={{fill: '#6b7784', fontSize: 12}}
                axisLine={{stroke: '#dde3e8'}}
                tickFormatter={v => v.toLocaleString()}
              />
              <Tooltip 
                formatter={(value, name) => [Number(value).toLocaleString(), 'ILI/pneumonia visits']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #dde3e8',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="#2667a8" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{r: 5, fill: '#2667a8', stroke: '#fff', strokeWidth: 2}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>

    {status==='ready' && rows.length > 0 && (
      <section className="contextSection">
        <SectionHeader 
          title="How much ED activity involved ILI/pneumonia?" 
          description="These rates add context to the visit count above. They use the same geography and latest extraction."
          level={2}
        />
        <div className="metrics">
          <MetricCard 
            label="Share of all ED visits" 
            value={`${summary.iliShare.toFixed(1)}%`} 
            explanation="ILI/pneumonia visits ÷ total ED visits"
          />
          <MetricCard 
            label="Admission rate" 
            value={`${summary.admissionRate.toFixed(1)}%`} 
            explanation="ILI/pneumonia admissions ÷ ILI/pneumonia visits"
          />
        </div>
        <div className="card contextCard">
          <div className="cardHead">
            <div>
              <h2>7-day average rates over time</h2>
              <p>{geographyLabel} · Rolling 7-day rates reduce day-to-day volatility, especially in smaller MODZCTAs.</p>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={rollingRows} margin={{top:8,right:20,left:0,bottom:12}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef3"/>
                <XAxis 
                  dataKey="date" 
                  minTickGap={55}
                  tick={{fill: '#6b7784', fontSize: 12}}
                  axisLine={{stroke: '#dde3e8'}}
                />
                <YAxis 
                  width={62} 
                  tickFormatter={v => `${v}%`}
                  tick={{fill: '#6b7784', fontSize: 12}}
                  axisLine={{stroke: '#dde3e8'}}
                />
                <Tooltip 
                  formatter={(v,name) => [`${Number(v).toFixed(1)}%`, name === 'iliShare7d' ? '7-day ILI/pneumonia share' : '7-day admission rate']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dde3e8',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '13px'
                  }}
                />
                <Legend 
                  formatter={v => v === 'iliShare7d' ? '7-day ILI/pneumonia share of ED visits' : '7-day admission rate among ILI/pneumonia visits'}
                  iconType="plainline"
                />
                <Line 
                  type="monotone" 
                  dataKey="iliShare7d" 
                  stroke="#2667a8" 
                  strokeWidth={2.5} 
                  dot={false}
                  name="iliShare7d"
                />
                <Line 
                  type="monotone" 
                  dataKey="admissionRate7d" 
                  stroke="#6b7784" 
                  strokeWidth={2} 
                  strokeDasharray="6 4" 
                  dot={false}
                  name="admissionRate7d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    )}

    {status==='ready' && rows.length > 0 && story && (
      <section className="storySection" aria-labelledby="story-heading">
        <SectionHeader 
          title="What stands out?" 
          description="A few descriptive takeaways from the current geography. These summarize the data without assigning a cause to the changes."
          id="story-heading"
          level={2}
        />
        <div className="storyGrid">
          <InsightCard 
            label="Highest daily visit count"
            value={peak.visits.toLocaleString()}
            description={`${peak.date}. This is the highest ILI/pneumonia visit total in the selected series.`}
          />
          <InsightCard 
            label="Highest 7-day ILI/pneumonia share"
            value={`${story.maxShare.iliShare7d.toFixed(1)}%`}
            description={`Seven-day rate ending ${story.maxShare.date}.`}
          />
          <InsightCard 
            label="Recent 30-day visit average"
            value={story.recent.toFixed(1)}
            description={`${Math.abs(story.change).toFixed(1)}% ${story.change >= 0 ? 'higher' : 'lower'} than the preceding 30 days.`}
          />
        </div>
        <p className="interpretationNote"><strong>How to read this:</strong> spikes and percentage changes describe patterns in this dataset. They do not by themselves explain why those patterns occurred.</p>
      </section>
    )}

    <AboutData />

    <footer>
      <span>Source: NYC Open Data · Emergency Department Visits and Admissions for Influenza-like Illness and/or Pneumonia</span>
      <span>Latest extraction used: {extractDate || 'loading'}</span>
    </footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);