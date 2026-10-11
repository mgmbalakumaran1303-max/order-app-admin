import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../../utils/format';

// Lightweight SVG charts: no chart dependency is installed in this project.
// Each chart has a hover tooltip and a visually-hidden data table so the
// values are available without relying on colour or pointer input.

function useWidth(fallback = 560) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceMax(value) {
  if (value <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function SrTable({ caption, rows, valueLabel }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Label</th>
          <th scope="col">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{formatNumber(r.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const AXIS_W = 36;
const PAD_B = 24;
const PAD_T = 8;

function YAxis({ max, height, width }) {
  const ticks = [4, 5, 2].find((t) => Number.isInteger(max / t)) ?? 4;
  const plotH = height - PAD_B - PAD_T;
  return Array.from({ length: ticks + 1 }, (_, i) => {
    const v = (max / ticks) * i;
    const y = PAD_T + plotH - (v / max) * plotH;
    return (
      <g key={i}>
        <line x1={AXIS_W} x2={width} y1={y} y2={y} className="chart__grid" />
        <text x={AXIS_W - 6} y={y + 3} textAnchor="end" className="chart__tick">
          {v >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.round(v)}
        </text>
      </g>
    );
  });
}

function xLabelEvery(count, width) {
  return Math.max(1, Math.ceil(count / Math.max(2, Math.floor((width - AXIS_W) / 52))));
}

export function BarChart({ data, height = 200, label, valueLabel = 'Orders' }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const plotW = width - AXIS_W;
  const plotH = height - PAD_B - PAD_T;
  const slot = plotW / data.length;
  const barW = Math.max(2, slot - 2);
  const every = xLabelEvery(data.length, width);

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={label}>
        <YAxis max={max} height={height} width={width} />
        {data.map((d, i) => {
          const h = (d.value / max) * plotH;
          const x = AXIS_W + i * slot + 1;
          const y = PAD_T + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={AXIS_W + i * slot} y={PAD_T} width={slot} height={plotH} fill="transparent" />
              <path
                className={`chart__bar ${hover === i ? 'is-hover' : ''}`}
                d={`M${x},${PAD_T + plotH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${PAD_T + plotH} Z`}
              />
              {i % every === 0 && (
                <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="chart__tick">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart__tooltip" style={{ left: Math.min(AXIS_W + hover * slot + slot / 2, width - 70), top: 4 }}>
          <strong>{formatNumber(data[hover].value)}</strong> {valueLabel.toLowerCase()}
          <span>{data[hover].label}</span>
        </div>
      )}
      <SrTable caption={label} rows={data} valueLabel={valueLabel} />
    </div>
  );
}

export function LineChart({ data, height = 180, label, valueLabel = 'Value' }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const plotW = width - AXIS_W - 8;
  const plotH = height - PAD_B - PAD_T;
  const x = (i) => AXIS_W + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v) => PAD_T + plotH - (v / max) * plotH;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');
  const area = `${path} L${x(data.length - 1)},${PAD_T + plotH} L${x(0)},${PAD_T + plotH} Z`;
  const every = xLabelEvery(data.length, width);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - AXIS_W;
    const i = Math.round((rel / plotW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={label} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <YAxis max={max} height={height} width={width} />
        <path d={area} className="chart__area" />
        <path d={path} className="chart__line" />
        {data.map((d, i) =>
          i % every === 0 ? (
            <text key={d.label} x={x(i)} y={height - 6} textAnchor="middle" className="chart__tick">
              {d.label}
            </text>
          ) : null
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH} className="chart__crosshair" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r={5} className="chart__marker" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart__tooltip" style={{ left: Math.min(x(hover), width - 70), top: 4 }}>
          <strong>{formatNumber(data[hover].value)}</strong> {valueLabel.toLowerCase()}
          <span>{data[hover].label}</span>
        </div>
      )}
      <SrTable caption={label} rows={data} valueLabel={valueLabel} />
    </div>
  );
}

/** segments: [{ key, label, value, colorVar }] — colours follow the entity, never rank. */
export function DonutChart({ segments, centerLabel = 'Total', label, size = 150 }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - 10;
  const stroke = 18;
  const c = 2 * Math.PI * r;
  const gap = segments.length > 1 ? 2 : 0;
  let offset = 0;

  return (
    <div className="donut">
      <div className="donut__figure" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={label}>
          <circle cx={size / 2} cy={size / 2} r={r} className="donut__track" strokeWidth={stroke} fill="none" />
          {segments.map((s) => {
            const len = total ? (s.value / total) * c : 0;
            const dash = Math.max(0, len - gap);
            const el = (
              <circle
                key={s.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={hover === s.key ? stroke + 4 : stroke}
                style={{ stroke: `var(${s.colorVar})` }}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="donut__center">
          {hover ? (
            <>
              <strong>{formatNumber(segments.find((s) => s.key === hover).value)}</strong>
              <span>{segments.find((s) => s.key === hover).label}</span>
            </>
          ) : (
            <>
              <strong>{formatNumber(total)}</strong>
              <span>{centerLabel}</span>
            </>
          )}
        </div>
      </div>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.key} onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)} className={hover === s.key ? 'is-hover' : ''}>
            <span className="legend__swatch" style={{ background: `var(${s.colorVar})` }} aria-hidden="true" />
            <span className="legend__label">{s.label}</span>
            <span className="legend__value">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHANNEL_SERIES = { direct: '--series-1', lieferando: '--series-2', wolt: '--series-3', uber_eats: '--series-4', whatsapp: '--series-5' };
export const channelColorVar = (channel) => CHANNEL_SERIES[channel] ?? '--series-other';
