# Event-Driven Architecture Demo (Kafka + Express + React)

Demo gồm 3 phần chính:

- Producer API (Express, port 4000): nhận request và publish event lên Kafka.
- Consumer API (Express + WebSocket + SQLite, port 4001): consume event, xử lý, lưu DB, broadcast realtime.
- Frontend (React + Vite + Tailwind, port 5173): dashboard realtime để publish và theo dõi event.

## 1) Cấu trúc thư mục

```text
eda-demo/
├── docker-compose.yml
├── producer/
│   ├── index.js
│   └── package.json
├── consumer/
│   ├── index.js
│   ├── db.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── styles.css
│   │   ├── components/
│   │   │   ├── EventForm.jsx
│   │   │   ├── EventStream.jsx
│   │   │   └── StatsPanel.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 2) Bước chạy project

### Bước 1 - Khởi động Kafka + Zookeeper

```bash
docker-compose up -d
```

Đợi 20-30 giây để Kafka sẵn sàng.

### Bước 2 - Chạy Consumer API

```bash
cd consumer
npm install
node index.js
```

### Bước 3 - Chạy Producer API

Mở terminal mới:

```bash
cd producer
npm install
node index.js
```

### Bước 4 - Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Mở browser tại: `http://localhost:5173`

## 3) Ports

- Kafka broker: `9092`
- Zookeeper: `2181`
- Producer API: `4000`
- Consumer API + WebSocket: `4001`
- Frontend (Vite): `5173`

## 4) API nhanh

### Producer

- `POST /api/events/order`
- `POST /api/events/payment`
- `POST /api/events/notify`
- `GET /api/health`

### Consumer

- `GET /api/events` (50 event gần nhất)
- `GET /api/stats`
- `GET /api/health`

## 5) Test nhanh bằng curl (không cần UI)

### Publish order event

```bash
curl -X POST http://localhost:4000/api/events/order \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Alice","product":"MacBook","amount":1200}'
```

### Publish payment event

`orderId` nên là `eventId` trả về từ request order ở trên.

```bash
curl -X POST http://localhost:4000/api/events/payment \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_EVENT_ID>","amount":1200,"method":"credit"}'
```

### Publish notification event

```bash
curl -X POST http://localhost:4000/api/events/notify \
  -H "Content-Type: application/json" \
  -d '{"userId":"u-001","message":"Order paid successfully","channel":"email"}'
```

### Kiểm tra dữ liệu đã xử lý

```bash
curl http://localhost:4001/api/events
curl http://localhost:4001/api/stats
```

## 6) Luồng hoạt động

1. Frontend gửi request đến Producer API.
2. Producer publish event lên Kafka topic tương ứng.
3. Consumer subscribe các topic và nhận event.
4. Consumer xử lý event, lưu vào SQLite (`orders`, `payments`, `notifications`, `event_log`).
5. Consumer broadcast realtime qua WebSocket cho frontend.
6. Frontend cập nhật Live Event Stream + Stats gần realtime.

## 7) Test nhanh bằng script PowerShell

File script: `scripts/test-eda.ps1`

### Chế độ 1 - Smoke test (end-to-end)

Yêu cầu: Producer + Consumer + Kafka đang chạy.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-eda.ps1 -Mode smoke
```

Script sẽ:

- Check health Producer/Consumer.
- Gửi 3 event (`order`, `payment`, `notify`).
- Đợi vài giây rồi đọc lại `/api/stats`.
- In kết quả PASS/FAIL.

### Chế độ 2 - Backlog test (kiểm tra queue lag)

Mục tiêu: mô phỏng event chờ trong Kafka.

1. Dừng Consumer trước (Ctrl+C ở terminal consumer).
2. Chạy script backlog để bắn nhiều event.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-eda.ps1 -Mode backlog -Count 50
```

3. Script sẽ in `Total lag` của consumer group `eda-demo-group`.
4. Bật lại Consumer và chạy lại lệnh backlog hoặc lệnh describe để thấy lag giảm về 0.

### Chế độ 3 - Flow demo (tạo đơn -> thanh toán -> thông báo từ từ)

Mục tiêu: mô phỏng đúng luồng nghiệp vụ để thấy Kafka xử lý tuần tự theo event.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-eda.ps1 -Mode flow -NotifyCount 5 -FlowDelaySeconds 2
```

Script sẽ làm lần lượt:

- Gửi `order.created`
- Đợi `FlowDelaySeconds`
- Gửi `payment.processed`
- Gửi `notification.sent` nhiều lần theo `NotifyCount`, mỗi lần đều có delay
- In stats/lạg sau từng bước và in 5 event mới nhất trong `event_log`

Gợi ý quan sát trực quan:

1. Mở UI ở `http://localhost:5173`
2. Chạy mode `flow` ở terminal
3. Nhìn cột Live Event Stream: event sẽ xuất hiện theo nhịp, giúp thấy rõ kiến trúc Kafka + Consumer xử lý bất đồng bộ

### Tùy chọn thêm

```powershell
# Đổi URL Producer/Consumer nếu cần
powershell -ExecutionPolicy Bypass -File .\scripts\test-eda.ps1 -Mode smoke -ProducerBase "http://localhost:4000" -ConsumerBase "http://localhost:4001"

# Đổi tên Kafka container / Consumer group
powershell -ExecutionPolicy Bypass -File .\scripts\test-eda.ps1 -Mode backlog -KafkaContainer "eda-kafka" -ConsumerGroup "eda-demo-group"

# Chạy flow demo với 3 thông báo, cách nhau 1 giây
powershell -ExecutionPolicy Bypass -File .\scripts\test-eda.ps1 -Mode flow -NotifyCount 3 -FlowDelaySeconds 1
```
