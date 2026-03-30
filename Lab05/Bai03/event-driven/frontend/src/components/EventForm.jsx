import { useState } from "react";

const PRODUCER_BASE = "http://localhost:4000";

const initialForm = {
  order: { customerName: "", product: "", amount: "" },
  payment: { orderId: "", amount: "", method: "credit" },
  notify: { userId: "", message: "", channel: "email" },
};

export default function EventForm({ onToast, onPulse }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState({
    order: false,
    payment: false,
    notify: false,
  });

  async function publish(path, body, type) {
    try {
      setSubmitting((prev) => ({ ...prev, [type]: true }));
      const response = await fetch(`${PRODUCER_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gửi event thất bại");
      }

      onToast?.("Đã gửi event thành công!");
      onPulse?.();
      setForm((prev) => ({ ...prev, [type]: initialForm[type] }));
    } catch (error) {
      onToast?.(error.message, "error");
    } finally {
      setSubmitting((prev) => ({ ...prev, [type]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Bảng Gửi Event</h2>

      <section className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-300">
          Event Đơn Hàng
        </h3>
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-violet-400"
            placeholder="Tên khách hàng"
            value={form.order.customerName}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                order: { ...p.order, customerName: e.target.value },
              }))
            }
          />
          <input
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-violet-400"
            placeholder="Sản phẩm"
            value={form.order.product}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                order: { ...p.order, product: e.target.value },
              }))
            }
          />
          <input
            type="number"
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-violet-400"
            placeholder="Số tiền"
            value={form.order.amount}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                order: { ...p.order, amount: e.target.value },
              }))
            }
          />
          <button
            type="button"
            disabled={submitting.order}
            onClick={() =>
              publish(
                "/api/events/order",
                { ...form.order, amount: Number(form.order.amount) },
                "order",
              )
            }
            className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
          >
            Gửi Event Đơn Hàng
          </button>
        </div>
      </section>

      <section className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Event Thanh Toán
        </h3>
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            placeholder="Mã đơn hàng (eventId từ order.created)"
            value={form.payment.orderId}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                payment: { ...p.payment, orderId: e.target.value },
              }))
            }
          />
          <input
            type="number"
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            placeholder="Số tiền"
            value={form.payment.amount}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                payment: { ...p.payment, amount: e.target.value },
              }))
            }
          />
          <select
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            value={form.payment.method}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                payment: { ...p.payment, method: e.target.value },
              }))
            }
          >
            <option value="credit">Thẻ tín dụng</option>
            <option value="debit">Thẻ ghi nợ</option>
            <option value="crypto">Tiền mã hóa</option>
          </select>
          <button
            type="button"
            disabled={submitting.payment}
            onClick={() =>
              publish(
                "/api/events/payment",
                { ...form.payment, amount: Number(form.payment.amount) },
                "payment",
              )
            }
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            Gửi Event Thanh Toán
          </button>
        </div>
      </section>

      <section className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-300">
          Event Thông Báo
        </h3>
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder="Mã người dùng"
            value={form.notify.userId}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                notify: { ...p.notify, userId: e.target.value },
              }))
            }
          />
          <input
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder="Nội dung thông báo"
            value={form.notify.message}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                notify: { ...p.notify, message: e.target.value },
              }))
            }
          />
          <select
            className="w-full rounded-lg border border-white/15 bg-gray-900/80 px-3 py-2 text-sm outline-none focus:border-amber-400"
            value={form.notify.channel}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                notify: { ...p.notify, channel: e.target.value },
              }))
            }
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
          </select>
          <button
            type="button"
            disabled={submitting.notify}
            onClick={() => publish("/api/events/notify", form.notify, "notify")}
            className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-gray-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            Gửi Event Thông Báo
          </button>
        </div>
      </section>
    </div>
  );
}
