"use client";

import { useState } from "react";
import { MonthlyCashflow } from "@/lib/data/analytics";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface CashflowLineChartProps {
  monthlyData: MonthlyCashflow[];
  year: number;
}

function formatCompactRupiah(num: number): string {
  if (num === 0) return "Rp 0";
  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `Rp ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)} M`;
  }
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `Rp ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)} jt`;
  }
  if (num >= 1_000) {
    return `Rp ${(num / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${num}`;
}

export function CashflowLineChart({ monthlyData, year }: CashflowLineChartProps) {
  // Default hovered month to current month if in current year, otherwise null
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const defaultHover = year === currentYear ? currentMonthIdx : 9; // Oktober default

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(defaultHover);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 290;
  const padTop = 25;
  const padBottom = 45;
  const padLeft = 70;
  const padRight = 30;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Maximum value for scaling Y-axis
  const rawMax = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expense)),
    0
  );

  // Determine a clean Y-max ceiling
  const calculateYMax = (val: number): number => {
    if (val <= 0) return 1_000_000;
    const mag = Math.pow(10, Math.floor(Math.log10(val)));
    const norm = val / mag;
    let ceil = 10;
    if (norm <= 1) ceil = 1.2;
    else if (norm <= 2) ceil = 2.5;
    else if (norm <= 5) ceil = 6;
    else ceil = 12;
    return Math.max(ceil * mag, 1_000_000);
  };

  const maxY = calculateYMax(rawMax);

  // Coordinate helpers
  const getX = (index: number) => padLeft + (index / (monthlyData.length - 1)) * plotWidth;
  const getY = (val: number) => padTop + plotHeight - (Math.min(val, maxY) / maxY) * plotHeight;

  // Points for Income & Expense
  const incomePoints = monthlyData.map((m, i) => ({
    x: getX(i),
    y: getY(m.income),
    val: m.income,
    data: m,
  }));

  const expensePoints = monthlyData.map((m, i) => ({
    x: getX(i),
    y: getY(m.expense),
    val: m.expense,
    data: m,
  }));

  // Smooth Bezier path generator (Catmull-Rom spline to Cubic Bezier)
  const createSmoothPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 5.5;
      const cp1y = p1.y + (p2.y - p0.y) / 5.5;
      const cp2x = p2.x - (p3.x - p1.x) / 5.5;
      const cp2y = p2.y - (p3.y - p1.y) / 5.5;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const incomeLinePath = createSmoothPath(incomePoints);
  const expenseLinePath = createSmoothPath(expensePoints);

  const baselineY = padTop + plotHeight;
  const incomeAreaPath = `${incomeLinePath} L ${incomePoints[incomePoints.length - 1].x.toFixed(1)} ${baselineY} L ${incomePoints[0].x.toFixed(1)} ${baselineY} Z`;
  const expenseAreaPath = `${expenseLinePath} L ${expensePoints[expensePoints.length - 1].x.toFixed(1)} ${baselineY} L ${expensePoints[0].x.toFixed(1)} ${baselineY} Z`;

  // Grid steps (4 horizontal guide lines: 0%, 33%, 66%, 100%)
  const gridSteps = [0, 0.33, 0.66, 1];

  const activeMonth = hoveredIndex !== null ? monthlyData[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {/* Header & Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-card">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-green-light text-starbucks-green flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-house-green">
              Arus Kas Bulanan (12 Bulan)
            </h3>
            <p className="text-xs text-text-black-soft">
              Grafik tren garis pemasukan vs pengeluaran tahun {year}
            </p>
          </div>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-canvas border border-border-card">
            <span className="h-2.5 w-2.5 rounded-full bg-starbucks-green ring-2 ring-starbucks-green/20" />
            <span className="font-semibold text-house-green text-[11px]">Pemasukan</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-canvas border border-border-card">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C87A54] ring-2 ring-[#C87A54]/20" />
            <span className="font-semibold text-[#8B4513] text-[11px]">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* SVG Line Chart Container */}
      <div className="relative w-full overflow-hidden select-none bg-canvas/30 rounded-2xl p-2 sm:p-4 border border-border-card/60">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible font-sans"
        >
          <defs>
            {/* Income Gradient */}
            <linearGradient id="omahIncomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#006241" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#006241" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#006241" stopOpacity="0.00" />
            </linearGradient>

            {/* Expense Gradient */}
            <linearGradient id="omahExpenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C87A54" stopOpacity="0.20" />
              <stop offset="60%" stopColor="#C87A54" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#C87A54" stopOpacity="0.00" />
            </linearGradient>

            {/* Drop Shadow filter for lines */}
            <filter id="lineShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* 1. Horizontal Y-Axis Gridlines & Labels */}
          {gridSteps.map((step, idx) => {
            const val = maxY * step;
            const yPos = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="#E6E0D5"
                  strokeWidth="1"
                  strokeDasharray={idx === 0 ? "none" : "3 3"}
                />
                <text
                  x={padLeft - 10}
                  y={yPos + 3.5}
                  textAnchor="end"
                  fill="#78716C"
                  className="font-caption-mono text-[10px] font-semibold"
                >
                  {formatCompactRupiah(val)}
                </text>
              </g>
            );
          })}

          {/* 2. Gradient Area Under Curves */}
          <path d={incomeAreaPath} fill="url(#omahIncomeGrad)" />
          <path d={expenseAreaPath} fill="url(#omahExpenseGrad)" />

          {/* 3. Smooth Curve Lines */}
          <path
            d={incomeLinePath}
            fill="none"
            stroke="#006241"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineShadow)"
          />

          <path
            d={expenseLinePath}
            fill="none"
            stroke="#C87A54"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineShadow)"
          />

          {/* 4. Active Guideline on Hover */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padTop}
                x2={getX(hoveredIndex)}
                y2={baselineY}
                stroke="#1E3932"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />
            </g>
          )}

          {/* 5. Data Points (Circles) */}
          {monthlyData.map((m, i) => {
            const isHovered = hoveredIndex === i;
            const inc = incomePoints[i];
            const exp = expensePoints[i];

            return (
              <g key={m.monthIndex} className="cursor-pointer">
                {/* Income point */}
                <circle
                  cx={inc.x}
                  cy={inc.y}
                  r={isHovered ? 6 : 4}
                  fill="#006241"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Expense point */}
                <circle
                  cx={exp.x}
                  cy={exp.y}
                  r={isHovered ? 6 : 4}
                  fill="#C87A54"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Month label along X-axis */}
                <text
                  x={getX(i)}
                  y={baselineY + 22}
                  textAnchor="middle"
                  fill={isHovered ? "#006241" : "#57534E"}
                  fontWeight={isHovered ? "bold" : "600"}
                  className="font-caption-mono text-[11px] transition-colors"
                >
                  {m.shortName.toUpperCase()}
                </text>

                {/* Invisible hover hitbox column for easy touch/mouse targeting */}
                <rect
                  x={getX(i) - (plotWidth / 22)}
                  y={padTop}
                  width={plotWidth / 11}
                  height={plotHeight + 35}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onClick={() => setHoveredIndex(i)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Detail Card for Hovered Month */}
      {activeMonth && (
        <div className="p-4 rounded-2xl bg-white border border-border-card shadow-starbucks-card animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-house-green">
                Rincian Arus Kas:
              </span>
              <span className="font-caption-mono text-xs px-2.5 py-0.5 rounded-full bg-green-light font-bold text-starbucks-green">
                {activeMonth.monthName} {year}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-green-light flex items-center justify-center text-starbucks-green">
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-text-black-soft block uppercase font-medium">
                    Pemasukan
                  </span>
                  <span className="font-bold text-starbucks-green">
                    {formatRupiah(activeMonth.income)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-800">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-text-black-soft block uppercase font-medium">
                    Pengeluaran
                  </span>
                  <span className="font-bold text-[#C87A54]">
                    {formatRupiah(activeMonth.expense)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-0 sm:pl-3 border-l-0 sm:border-l border-border-card">
                <div>
                  <span className="text-[10px] text-text-black-soft block uppercase font-medium">
                    Tabungan Bersih (Net)
                  </span>
                  <span
                    className={`font-bold ${
                      activeMonth.net >= 0 ? "text-house-green" : "text-red-600"
                    }`}
                  >
                    {activeMonth.net >= 0 ? "+" : ""}
                    {formatRupiah(activeMonth.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
