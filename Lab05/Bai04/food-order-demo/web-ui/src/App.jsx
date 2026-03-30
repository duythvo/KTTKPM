import { useEffect, useMemo, useState } from "react";

const initialOrder = {
  itemsText: '[{"sku":"burger","quantity":2},{"sku":"tea","quantity":1}]',
  totalAmount: 120000,
  address: "123 Nguyễn Trãi, TP.HCM",
};

const eventColor = {
  ORDER_CREATED: "bg-brand-100 text-brand-700",
  INVENTORY_RESERVED: "bg-emerald-100 text-emerald-700",
  INVENTORY_FAILED: "bg-red-100 text-red-700",
  PAYMENT_SUCCESS: "bg-emerald-100 text-emerald-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  KITCHEN_DONE: "bg-emerald-100 text-emerald-700",
  KITCHEN_FAILED: "bg-red-100 text-red-700",
  PAYMENT_REFUNDED: "bg-amber-100 text-amber-700",
  DELIVERY_DONE: "bg-emerald-100 text-emerald-700",
  DELIVERY_FAILED: "bg-red-100 text-red-700",
  ORDER_COMPLETED: "bg-moss/15 text-moss",
  ORDER_CANCELLED: "bg-coral/15 text-coral",
};

function normalizeApiUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "");
}

function toOrderPayload(form) {
  return {
    items: JSON.parse(form.itemsText),
    totalAmount: Number(form.totalAmount),
    address: form.address,
  };
}

function statusClass(status) {
  return eventColor[status] || "bg-slate-100 text-slate-700";
}

function Timeline({ title, order, loading, error }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {loading ? (
          <span className="badge bg-slate-100 text-slate-700">
            Đang làm mới...
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {!order ? (
        <p className="text-sm text-slate-600">
          Chưa có đơn hàng. Hãy tạo đơn để xem timeline.
        </p>
      ) : null}
      {order ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <div>
              <strong>Order ID:</strong> {order.id}
            </div>
            <div>
              <strong>Trạng thái hiện tại:</strong>{" "}
              <span className={`badge ${statusClass(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
          <ol className="space-y-2">
            {order.history.map((h, idx) => (
              <li
                key={`${h.status}-${idx}`}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span className={`badge ${statusClass(h.status)}`}>
                  {h.status}
                </span>
                <div className="text-sm text-slate-700">
                  <div>{h.note || "Sự kiện đã được xử lý"}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(h.at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function ArchitectureCard({ title, subtitle, color, nodes }) {
  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mb-4 text-sm text-slate-600">{subtitle}</p>
      <div className="grid gap-2">
        {nodes.map((line) => (
          <div
            key={line}
            className={`rounded-lg border-l-4 ${color} bg-slate-50 px-3 py-2 text-sm text-slate-700`}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const defaultChoreoApi =
    import.meta.env.VITE_CHOREO_API || "http://localhost:3001";
  const defaultOrchApi =
    import.meta.env.VITE_ORCH_API || "http://localhost:4001";

  const [choreoApi, setChoreoApi] = useState(defaultChoreoApi);
  const [orchApi, setOrchApi] = useState(defaultOrchApi);
  const [form, setForm] = useState(initialOrder);
  const [message, setMessage] = useState("");

  const [choreoOrderId, setChoreoOrderId] = useState("");
  const [orchOrderId, setOrchOrderId] = useState("");

  const [choreoOrder, setChoreoOrder] = useState(null);
  const [orchOrder, setOrchOrder] = useState(null);

  const [loadingChoreo, setLoadingChoreo] = useState(false);
  const [loadingOrch, setLoadingOrch] = useState(false);
  const [choreoError, setChoreoError] = useState("");
  const [orchError, setOrchError] = useState("");

  const canCreate = useMemo(() => {
    try {
      const payload = toOrderPayload(form);
      return (
        Array.isArray(payload.items) &&
        payload.items.length > 0 &&
        payload.totalAmount > 0 &&
        !!payload.address
      );
    } catch {
      return false;
    }
  }, [form]);

  async function createOrder(api, target) {
    try {
      setMessage("");
      const payload = toOrderPayload(form);
      const res = await fetch(`${normalizeApiUrl(api)}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Tạo đơn thất bại");
      }
      if (target === "choreo") {
        setChoreoOrderId(data.id);
        setChoreoOrder(data);
      } else {
        setOrchOrderId(data.id);
        setOrchOrder(data);
      }
      setMessage(
        `Tạo đơn thành công trên ${target === "choreo" ? "choreography" : "orchestration"}: ${data.id}`,
      );
    } catch (err) {
      setMessage(`Lỗi tạo đơn (${target}): ${err.message}`);
    }
  }

  async function fetchOrder(api, id, setter, setError, setLoading) {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${normalizeApiUrl(api)}/orders/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không đọc được trạng thái đơn");
      }
      setter(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setInterval(() => {
      fetchOrder(
        choreoApi,
        choreoOrderId,
        setChoreoOrder,
        setChoreoError,
        setLoadingChoreo,
      );
      fetchOrder(
        orchApi,
        orchOrderId,
        setOrchOrder,
        setOrchError,
        setLoadingOrch,
      );
    }, 2000);
    return () => clearInterval(t);
  }, [choreoApi, orchApi, choreoOrderId, orchOrderId]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="card overflow-hidden">
          <div className="grid gap-4 bg-gradient-to-r from-brand-600 to-moss p-6 text-white md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">
                Bảng Điều Khiển Workflow Đặt Món Ăn
              </h1>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Tạo đơn, theo dõi timeline sự kiện theo thời gian thực, và so
                sánh trực quan Event Choreography với Event Orchestration.
              </p>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-sm">
              <div>
                <strong>Choreography API:</strong> {normalizeApiUrl(choreoApi)}
              </div>
              <div>
                <strong>Orchestration API:</strong> {normalizeApiUrl(orchApi)}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-display text-xl font-bold text-ink">
              Tạo Đơn Hàng
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Dùng cùng payload để benchmark 2 kiến trúc trên cùng workflow.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">
                  URL API Choreography
                </span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={choreoApi}
                  onChange={(e) => setChoreoApi(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold">
                  URL API Orchestration
                </span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={orchApi}
                  onChange={(e) => setOrchApi(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-semibold">JSON Món Ăn</span>
                <textarea
                  className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                  value={form.itemsText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, itemsText: e.target.value }))
                  }
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-semibold">Tổng Tiền</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      totalAmount: Number(e.target.value),
                    }))
                  }
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-semibold">Địa Chỉ Giao</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canCreate}
                onClick={() => createOrder(choreoApi, "choreo")}
              >
                Tạo Trên Choreography
              </button>
              <button
                className="rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canCreate}
                onClick={() => createOrder(orchApi, "orch")}
              >
                Tạo Trên Orchestration
              </button>
            </div>

            {message ? (
              <p className="mt-3 text-sm text-slate-700">{message}</p>
            ) : null}
          </div>

          <div className="card p-5">
            <h2 className="font-display text-xl font-bold text-ink">
              So Sánh Nhanh
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <strong>Choreography:</strong> Mỗi service tự phát sự kiện cho
                bước tiếp theo.
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <strong>Orchestration:</strong> Orchestrator ra lệnh từng bước.
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <strong>Debug:</strong> Orchestration dễ trace luồng hơn.
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <strong>Tự chủ dịch vụ:</strong> Choreography cao hơn.
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <strong>Workflow phức tạp:</strong> Orchestration dễ maintain
                hơn.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Timeline
            title="Timeline Choreography"
            order={choreoOrder}
            loading={loadingChoreo}
            error={choreoError}
          />
          <Timeline
            title="Timeline Orchestration"
            order={orchOrder}
            loading={loadingOrch}
            error={orchError}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ArchitectureCard
            title="Event Choreography"
            subtitle="Không có trung tâm điều phối, mỗi service phát sự kiện bước tiếp theo"
            color="border-brand-500"
            nodes={[
              "Order Service -> ORDER_CREATED",
              "Inventory Service -> INVENTORY_RESERVED/FAILED",
              "Payment Service -> PAYMENT_SUCCESS/FAILED",
              "Kitchen Service -> KITCHEN_DONE/FAILED",
              "Delivery Service -> DELIVERY_DONE/FAILED",
            ]}
          />
          <ArchitectureCard
            title="Event Orchestration"
            subtitle="Orchestrator điều khiển command và nhận kết quả"
            color="border-moss"
            nodes={[
              "Orchestrator -> INVENTORY_CHECK_REQUEST",
              "Orchestrator -> PAYMENT_CHARGE_REQUEST",
              "Orchestrator -> KITCHEN_PREPARE_REQUEST",
              "Orchestrator -> DELIVERY_START_REQUEST (retry)",
              "Orchestrator -> ORDER_COMPLETED / ORDER_CANCELLED",
            ]}
          />
        </section>
      </div>
    </div>
  );
}
