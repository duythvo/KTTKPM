import { useEffect, useMemo, useState } from "react";

const topicConfig = {
  "order.created": {
    label: "order.created",
    dot: "bg-violet-400",
    badge: "bg-violet-500/20 text-violet-300",
    icon: "🛒",
  },
  "payment.processed": {
    label: "payment.processed",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
    icon: "💳",
  },
  "notification.sent": {
    label: "notification.sent",
    dot: "bg-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
    icon: "🔔",
  },
};

function relativeTime(input) {
  const value = new Date(input).getTime();
  const diffSec = Math.max(1, Math.floor((Date.now() - value) / 1000));
  if (diffSec < 60) return `${diffSec} giây trước`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  return `${hr} giờ trước`;
}

function EventCard({ item, expanded, onToggle }) {
  const cfg = topicConfig[item.topic] || topicConfig["notification.sent"];
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    setProcessed(false);
    const timer = setTimeout(() => setProcessed(true), 650);
    return () => clearTimeout(timer);
  }, [item.id]);

  return (
    <article className="glass-card animate-slide-in-down p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          <span className="text-lg">{cfg.icon}</span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${cfg.badge}`}
          >
            {cfg.label}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${processed ? "bg-cyan-500/20 text-cyan-300" : "bg-yellow-500/20 text-yellow-200"}`}
        >
          {processed ? "ĐÃ XỬ LÝ" : "ĐANG XỬ LÝ"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>ID: {item.eventId.slice(0, 8)}...</span>
        <span>{relativeTime(item.processedAt || item.event?.timestamp)}</span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-3 w-full rounded-lg border border-white/10 px-3 py-1.5 text-left text-xs text-gray-200 transition hover:bg-white/5"
      >
        {expanded ? "Ẩn payload" : "Xem payload"}
      </button>

      {expanded && (
        <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-gray-900/80 p-3 text-xs text-cyan-200">
          {JSON.stringify(
            item.payload || item.event?.data || item.event,
            null,
            2,
          )}
        </pre>
      )}
    </article>
  );
}

export default function EventStream({ events, loading }) {
  const [expandedId, setExpandedId] = useState(null);

  const normalized = useMemo(
    () =>
      events.map((event, index) => ({
        id:
          event.eventId ||
          event.event?.eventId ||
          `${index}-${event.processedAt}`,
        topic: event.topic || event.event?.topic || event.event?.eventType,
        eventId: event.eventId || event.event?.eventId,
        processedAt: event.processedAt,
        payload: event.payload || event.event,
        event,
      })),
    [events],
  );

  return (
    <div className="h-full min-h-[680px] glass-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Luồng Event Trực Tiếp
        </h2>
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          LIVE
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="scrollbar-thin flex max-h-[620px] flex-col gap-3 overflow-y-auto pr-1">
          {normalized.length === 0 && (
            <p className="text-sm text-gray-400">
              Chưa có event nào. Hãy gửi event từ bảng bên trái.
            </p>
          )}
          {normalized.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === item.id ? null : item.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
