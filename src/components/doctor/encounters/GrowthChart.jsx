import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

// Pediatric Growth Charts — plots the child's weight, height/length and head
// circumference over time, drawn from the pediatric clinical documents
// (Growth & Development Records, Well-Child Visits, progress notes...) in the
// patient's longitudinal AMedix record.
const seriesDef = [
  { key: "weight_kg", label: "Weight (kg)", color: "#0f172a" },
  { key: "height_cm", label: "Height / Length (cm)", color: "#38bdf8" },
  { key: "head_circumference_cm", label: "Head Circumference (cm)", color: "#94a3b8" },
  { key: "bmi", label: "BMI", color: "#14b8a6" },
];

export default function GrowthChart({ documents = [] }) {
  const points = [];
  (documents || []).forEach((d) => {
    const t = d.created_datetime || d.created_date;
    if (!t || !d.data) return;
    const row = { date: new Date(t), label: d.document_type_label || d.document_type, source: d.document_id };
    let has = false;
    seriesDef.forEach((s) => {
      const v = d.data[s.key]?.value;
      if (v !== undefined && v !== null && v !== "") {
        row[s.key] = Number(v);
        has = true;
      }
    });
    if (has && !isNaN(row.date)) points.push(row);
  });
  points.sort((a, b) => a.date - b.date);

  const charts = seriesDef
    .map((s) => ({ def: s, data: points.filter((p) => p[s.key] !== undefined) }))
    .filter((c) => c.data.length >= 2);
  if (charts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <h3 className="font-semibold flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        Growth Charts
      </h3>
      <div className="space-y-6">
        {charts.map(({ def, data }) => (
          <div key={def.key}>
            <p className="text-sm font-medium mb-2">{def.label}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.map((p) => ({ ...p, dateLabel: format(p.date, "MMM d, yyyy") }))} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip
                  formatter={(value) => [value, def.label]}
                  labelFormatter={(label, payload) => {
                    const p = payload && payload[0] && payload[0].payload;
                    return p ? `${label} · ${p.label}` : label;
                  }}
                />
                <Line type="monotone" dataKey={def.key} stroke={def.color} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}