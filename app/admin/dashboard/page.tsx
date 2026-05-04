// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

/* ---- Tiny inline icon components ---- */
const IcoPackage  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IcoUsers    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoTarget   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IcoBag      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IcoCrown    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>;
const IcoStar     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoSparkle  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const IcoArrowUp  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>;
const IcoArrowDn  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>;

/* ---- Data ---- */
const stats = [
  { label: "Total Pesanan",    value: "1,284",   trend: "+12%", positive: true,  accent: "#60a5fa", Icon: IcoPackage },
  { label: "Pengunjung Unik",  value: "42.5k",   trend: "+18%", positive: true,  accent: "#c084fc", Icon: IcoUsers   },
  { label: "Tingkat Konversi", value: "3.48%",   trend: "-2%",  positive: false, accent: "#ffd700", Icon: IcoTarget  },
  { label: "Rata-rata Order",  value: "Rp 240k", trend: "+5%",  positive: true,  accent: "#4ade80", Icon: IcoBag     },
];

const topProducts = [
  { name: "Keris Sengketa",     sales: "432", price: "Rp 120k", Icon: IcoStar    },
  { name: "Batik Mega Mendung", sales: "310", price: "Rp 250k", Icon: IcoSparkle },
  { name: "Wayang Kulit Pro",   sales: "215", price: "Rp 500k", Icon: IcoCrown   },
];

const transactions = [
  { id: "#TRX-001", customer: "Budi Santoso",  product: "Keris Sengketa",     amount: "Rp 120k", status: "Selesai",  pos: true  },
  { id: "#TRX-002", customer: "Siti Rahayu",   product: "Batik Mega Mendung", amount: "Rp 250k", status: "Proses",   pos: null  },
  { id: "#TRX-003", customer: "Agus Wijaya",   product: "Wayang Kulit Pro",   amount: "Rp 500k", status: "Selesai",  pos: true  },
  { id: "#TRX-004", customer: "Dewi Lestari",  product: "Keris Sengketa",     amount: "Rp 120k", status: "Dibatal",  pos: false },
  { id: "#TRX-005", customer: "Rudi Hartono",  product: "Batik Mega Mendung", amount: "Rp 250k", status: "Proses",   pos: null  },
];

/* ---- Reusable style objects ---- */
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "24px",
};

export default function OverviewPage() {
  const chartRef  = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInst.current?.destroy();
    const data = [3200000, 4800000, 3900000, 6200000, 5500000, 7800000, 9100000];
    const max  = Math.max(...data);
    chartInst.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
        datasets: [{
          label: "Pendapatan",
          data,
          backgroundColor: data.map(v => v === max ? "#ffd700" : "rgba(255,215,0,0.25)"),
          borderRadius: 10,
          barPercentage: 0.55,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a", titleColor: "#ffd700", bodyColor: "#94a3b8",
            borderColor: "rgba(255,215,0,0.15)", borderWidth: 1, padding: 12,
            callbacks: { label: ctx => ctx.parsed.y ? ` Rp ${(ctx.parsed.y / 1_000_000).toFixed(1)}jt` : "" },
          },
        },
        scales: {
          y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b", callback: v => `${(Number(v) / 1_000_000).toFixed(0)}jt` } },
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
        },
      },
    });
    return () => { chartInst.current?.destroy(); };
  }, []);

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-wrapper {
          display: flex; flex-direction: column; gap: 28px;
          padding: 0 32px; max-width: 1400px; margin: 0 auto;
          animation: fadeSlideUp 0.5s ease both;
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
        }
        .stats-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .chart-layout { display: grid; grid-template-columns: 1fr minmax(0, 340px); gap: 20px; }
        .chart-layout > * { min-width: 0; }
        .product-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }
        .product-row  { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .product-info { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
        .trx-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .trx-th { padding: 14px 28px; }
        .trx-td { padding: 16px 28px; }

        @media (max-width: 1024px) {
          .page-wrapper  { padding: 0 20px; gap: 20px; }
          .stats-grid    { grid-template-columns: repeat(2, 1fr); }
          .chart-layout  { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .page-wrapper  { padding: 0 12px; gap: 16px; }
          .stats-grid    { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .chart-layout  { grid-template-columns: 1fr; gap: 14px; }
          .trx-header-bar { padding: 16px; }
          .trx-th        { padding: 10px 10px; font-size: 9px !important; }
          .trx-td        { padding: 12px 10px; font-size: 12px !important; }
          .col-product   { display: none; }
        }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
            Ringkasan Performa
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 0" }}>
            Pantau perkembangan NusaAssets hari ini.
          </p>
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "12px", color: "#64748b",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            padding: "8px 16px", borderRadius: "12px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          Live · Diperbarui barusan
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  padding: "10px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  color: s.accent, display: "flex",
                }}
              >
                <s.Icon />
              </div>
              <span
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "12px", fontWeight: 700,
                  padding: "4px 10px", borderRadius: "10px",
                  background: s.positive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                  color:      s.positive ? "#4ade80"              : "#f87171",
                }}
              >
                {s.positive ? <IcoArrowUp /> : <IcoArrowDn />}
                {s.trend}
              </span>
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>
                {s.label}
              </p>
              <h3 style={{ fontSize: "26px", fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>
                {s.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="chart-layout">

        {/* Chart */}
        <div style={{ ...card, padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "4px", height: "28px", background: "#ffd700", borderRadius: "4px" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "17px", margin: 0 }}>Grafik Pendapatan</h3>
            </div>
            <span
              style={{
                fontSize: "12px", color: "#64748b",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                padding: "6px 14px", borderRadius: "10px",
              }}
            >Minggu ini</span>
          </div>
          <div style={{ height: "280px", width: "100%" }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Top Products */}
        <div style={{ ...card, padding: "28px" }}>
          <h3
            style={{
              color: "#fff", fontWeight: 700, fontSize: "17px",
              margin: "0 0 24px",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <span style={{ color: "#ffd700" }}><IcoCrown /></span> Produk Terlaris
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {topProducts.map((p, i) => (
              <div key={i} className="product-row">
                <div className="product-info">
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155", width: "16px", flexShrink: 0 }}>#{i + 1}</span>
                  <div
                    style={{
                      width: "40px", height: "40px", minWidth: "40px",
                      borderRadius: "14px", background: "rgba(255,215,0,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#ffd700", flexShrink: 0,
                    }}
                  >
                    <p.Icon />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="product-name" style={{ fontWeight: 700, color: "#fff", fontSize: "13px", margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: "11px", color: "#475569", margin: "2px 0 0" }}>{p.sales} terjual</p>
                  </div>
                </div>
                <p style={{ fontWeight: 700, color: "#ffd700", fontSize: "13px", margin: 0, flexShrink: 0 }}>{p.price}</p>
              </div>
            ))}
          </div>
          {/* Progress */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: "11px", color: "#475569", textAlign: "center", margin: "0 0 10px" }}>
              957 unit terjual minggu ini
            </p>
            <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "68%", background: "#ffd700", borderRadius: "99px" }} />
            </div>
            <p style={{ fontSize: "10px", color: "#334155", textAlign: "right", margin: "6px 0 0" }}>68% dari target</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div className="trx-header-bar">
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "17px", margin: 0 }}>Transaksi Terbaru</h3>
          <a
            href="/admin/dashboard/transactions"
            style={{ fontSize: "12px", color: "#ffd700", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
          >
            Lihat semua →
          </a>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["ID", "Pelanggan", "Produk", "Total", "Status"].map(h => (
                  <th
                    key={h}
                    className={`trx-th${h === "Produk" ? " col-product" : ""}`}
                    style={{
                      textAlign: "left", fontSize: "10px", fontWeight: 700,
                      color: "#475569", textTransform: "uppercase", letterSpacing: "1.5px",
                    }}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: i < transactions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <td className="trx-td" style={{ fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>{t.id}</td>
                  <td className="trx-td" style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{t.customer}</td>
                  <td className="trx-td col-product" style={{ fontSize: "13px", color: "#64748b" }}>{t.product}</td>
                  <td className="trx-td" style={{ fontSize: "14px", fontWeight: 700, color: "#ffd700" }}>{t.amount}</td>
                  <td className="trx-td">
                    <span
                      style={{
                        fontSize: "11px", fontWeight: 700,
                        padding: "5px 12px", borderRadius: "10px",
                        background: t.pos === true ? "rgba(74,222,128,0.1)" : t.pos === false ? "rgba(248,113,113,0.1)" : "rgba(255,215,0,0.1)",
                        color:      t.pos === true ? "#4ade80"              : t.pos === false ? "#f87171"              : "#ffd700",
                      }}
                    >{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}