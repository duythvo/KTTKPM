import { useEffect, useMemo, useState } from "react";

function AnimatedNumber({ value, formatter }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 480;
    const startedAt = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      const next = start + (end - start) * eased;
      setDisplay(next);
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{formatter ? formatter(display) : Math.round(display)}</span>;
}

function StatCard({ label, value, tone, formatMoney = false }) {
  const formatter = useMemo(() => {
    if (!formatMoney) return (num) => Math.round(num).toLocaleString("vi-VN");
    return (num) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(num);
  }, [formatMoney]);

  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>
        <AnimatedNumber value={Number(value || 0)} formatter={formatter} />
      </p>
    </div>
  );
}

export default function StatsPanel({ stats, loading, pulse }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Thống Kê & Kiến Trúc</h2>

      {loading ? (
        <div className="grid gap-3">
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="grid gap-3">
          <StatCard
            label="Tổng Đơn Hàng"
            value={stats.totalOrders}
            tone="text-violet-300"
          />
          <StatCard
            label="Tổng Thanh Toán"
            value={stats.totalPayments}
            tone="text-emerald-300"
          />
          <StatCard
            label="Tổng Thông Báo"
            value={stats.totalNotifications}
            tone="text-amber-300"
          />
          <StatCard
            label="Tổng Doanh Thu"
            value={stats.totalRevenue}
            tone="text-cyan-300"
            formatMoney
          />
        </div>
      )}

      <div className="glass-card p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cyan-200">
          Sơ Đồ Luồng Kiến Trúc
        </h3>

        <div className="relative space-y-3">
          {[
            { name: "Giao Diện React", color: "bg-blue-500/20 text-blue-200" },
            { name: "Producer API", color: "bg-violet-500/20 text-violet-200" },
            { name: "Kafka", color: "bg-rose-500/20 text-rose-200" },
            {
              name: "Consumer API",
              color: "bg-emerald-500/20 text-emerald-200",
            },
            {
              name: "Cơ Sở Dữ Liệu SQLite",
              color: "bg-cyan-500/20 text-cyan-200",
            },
          ].map((node, index, arr) => (
            <div key={node.name} className="relative">
              <div
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${node.color}`}
              >
                {node.name}
              </div>
              {index < arr.length - 1 && (
                <div className="mx-auto h-6 w-1">
                  <div
                    className={`h-full w-full rounded ${pulse ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" : "bg-white/15"} transition`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
