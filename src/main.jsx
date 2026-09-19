import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './styles.css';

const API = '/nyc-open-data/resource/2nwg-uqyg.json';
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
    <header><p className="eyebrow">NYC OPEN DATA</p><h1>Influenza-like Illness &amp; Pneumonia<br/>Emergency Department Trends</h1><p className="lede">Explore daily ILI/pneumonia emergency department visits across NYC or focus on a single modified ZIP Code Tabulation Area (MODZCTA). The dashboard uses the latest Department of Health and Mental Hygiene extraction to avoid counting repeated historical snapshots.</p></header>

    <section className="controls" aria-label="Dashboard filters"><label htmlFor="geography">Geography</label><select id="geography" value={selectedModZcta} onChange={changeGeography} disabled={!extractDate || !modZctas.length || status==='loading'}><option value="">All NYC</option>{modZctas.map(z => <option key={z} value={z}>MODZCTA {z}</option>)}</select><p>{modZctas.length ? `${modZctas.length} MODZCTAs available` : 'Loading geographic options…'}</p></section>

    <section className="card"><div className="cardHead"><div><h2>Visits over time</h2><p>{geographyLabel} · March 2020–December 2022{extractDate && <> · Latest extraction: {extractDate}</>}</p></div>{peak && status==='ready' && <div className="stat"><span>Peak daily total</span><strong>{peak.visits.toLocaleString()}</strong><small>{peak.date}</small></div>}</div>
      {status==='loading' && <div className="state">Loading {geographyLabel} data…</div>}
      {status==='error' && <div className="state error"><div><strong>Couldn’t load the data.</strong><br/>{error}<div><button type="button" onClick={retry}>Try again</button></div></div></div>}
      {status==='ready' && <div className="chart"><ResponsiveContainer width="100%" height={430}><LineChart data={rows} margin={{top:12,right:20,left:10,bottom:12}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" minTickGap={55}/><YAxis width={70}/><Tooltip formatter={v => [Number(v).toLocaleString(),'ILI/pneumonia visits']}/><Line type="monotone" dataKey="visits" stroke="currentColor" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>}
    </section>

    {status==='ready' && <section className="contextSection">
      <div className="sectionIntro"><h2>How much ED activity involved ILI/pneumonia?</h2><p>These rates add context to the visit count above. They use the same geography and latest extraction.</p></div>
      <div className="metrics"><div className="metric"><span>Share of all ED visits</span><strong>{summary.iliShare.toFixed(1)}%</strong><p>ILI/pneumonia visits ÷ total ED visits</p></div><div className="metric"><span>Admission rate</span><strong>{summary.admissionRate.toFixed(1)}%</strong><p>ILI/pneumonia admissions ÷ ILI/pneumonia visits</p></div></div>
      <div className="card contextCard"><div className="cardHead"><div><h2>7-day average rates over time</h2><p>{geographyLabel} · Rolling 7-day rates reduce day-to-day volatility, especially in smaller MODZCTAs.</p></div></div><div className="chart"><ResponsiveContainer width="100%" height={360}><LineChart data={rollingRows} margin={{top:8,right:20,left:0,bottom:12}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" minTickGap={55}/><YAxis width={62} tickFormatter={v => `${v}%`}/><Tooltip formatter={(v,name) => [`${Number(v).toFixed(1)}%`, name === 'iliShare7d' ? '7-day ILI/pneumonia share' : '7-day admission rate']}/><Legend formatter={v => v === 'iliShare7d' ? '7-day ILI/pneumonia share of ED visits' : '7-day admission rate among ILI/pneumonia visits'}/><Line type="monotone" dataKey="iliShare7d" stroke="currentColor" strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="admissionRate7d" stroke="currentColor" strokeWidth={2} strokeDasharray="7 5" dot={false}/></LineChart></ResponsiveContainer></div></div>
    </section>}

    {status==='ready' && story && <section className="storySection" aria-labelledby="story-heading">
      <div className="sectionIntro"><h2 id="story-heading">What stands out?</h2><p>A few descriptive takeaways from the current geography. These summarize the data without assigning a cause to the changes.</p></div>
      <div className="storyGrid">
        <article className="storyItem"><span>Highest daily visit count</span><strong>{peak.visits.toLocaleString()}</strong><p>{peak.date}. This is the highest ILI/pneumonia visit total in the selected series.</p></article>
        <article className="storyItem"><span>Highest 7-day ILI/pneumonia share</span><strong>{story.maxShare.iliShare7d.toFixed(1)}%</strong><p>Seven-day rate ending {story.maxShare.date}.</p></article>
        <article className="storyItem"><span>Recent 30-day visit average</span><strong>{story.recent.toFixed(1)}</strong><p>{Math.abs(story.change).toFixed(1)}% {story.change >= 0 ? 'higher' : 'lower'} than the preceding 30 days.</p></article>
      </div>
      <p className="interpretationNote"><strong>How to read this:</strong> spikes and percentage changes describe patterns in this dataset. They do not by themselves explain why those patterns occurred.</p>
    </section>}

    <footer><span>Source: NYC Open Data · Emergency Department Visits and Admissions for Influenza-like Illness and/or Pneumonia</span><span>Latest extraction used: {extractDate || 'loading'}</span></footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
