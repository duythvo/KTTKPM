import { useEffect, useMemo, useState } from "react";
import EventForm from "./components/EventForm";
import EventStream from "./components/EventStream";
import StatsPanel from "./components/StatsPanel";

const CONSUMER_BASE = "http://localhost:4001";

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div className="fixed right-6 top-6 z-50 animate-slide-in-down">
      <div
        className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${isError ? "bg-rose-600 text-white" : "bg-violet-600 text-white"}`}
      >
        {toast.message}
      </div>
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPayments: 0,
    totalNotifications: 0,
    totalRevenue: 0,
  });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [toast, setToast] = useState(null);
  const [pulse, setPulse] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 900);
  };

  useEffect(() => {
    let mounted = true;

    async function loadInitialEvents() {
      try {
        const response = await fetch(`${CONSUMER_BASE}/api/events`);
        const data = await response.json();
        if (mounted) {
          setEvents((data || []).slice(0, 20));
        }
      } catch (_error) {
        if (mounted) showToast("Không tải được sự kiện ban đầu", "error");
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }

    loadInitialEvents();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const response = await fetch(`${CONSUMER_BASE}/api/stats`);
        const data = await response.json();
        if (mounted) {
          setStats(data);
          setLoadingStats(false);
        }
      } catch (_error) {
        if (mounted) setLoadingStats(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4001");

    ws.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data);
        if (parsed.type === "NEW_EVENT") {
          triggerPulse();
          setEvents((prev) => [parsed, ...prev].slice(0, 20));
        }
      } catch (_error) {
        // Ignore malformed message.
      }
    };

    ws.onerror = () => {
      showToast("Mất kết nối WebSocket", "error");
    };

    return () => ws.close();
  }, []);

  const pageTitle = useMemo(
    () => `Demo Event-Driven (${events.length} sự kiện trong luồng)`,
    [events.length],
  );

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 md:px-6">
      <Toast toast={toast} />

      <header className="mb-6">
        <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
          {pageTitle}
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Dashboard realtime với Kafka + Express + SQLite + WebSocket + React
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_1.45fr_1fr]">
        <div className="min-w-0">
          <EventForm onToast={showToast} onPulse={triggerPulse} />
        </div>

        <div className="min-w-0">
          <EventStream events={events} loading={loadingEvents} />
        </div>

        <div className="min-w-0">
          <StatsPanel stats={stats} loading={loadingStats} pulse={pulse} />
        </div>
      </section>
    </main>
  );
}
