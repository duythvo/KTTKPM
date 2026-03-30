# Food Ordering Demo - Event Orchestration

## 1) Mục tiêu

Bản này mô phỏng workflow đặt đơn đồ ăn theo mô hình event orchestration:

- Có `orchestrator-service` trung tâm điều phối flow
- Các service còn lại xử lý command và publish kết quả

## 2) Kiến trúc dịch vụ

- `order-service` (REST API + lưu trạng thái đơn)
- `orchestrator-service` (điều phối workflow)
- `inventory-service`
- `payment-service`
- `kitchen-service`
- `delivery-service`
- RabbitMQ event bus

## 3) Chạy demo

```bash
docker compose up --build
```

PowerShell:

```powershell
docker compose up --build
```

API Order service: `http://localhost:4001`

Web UI (React + Tailwind): `http://localhost:5174`

RabbitMQ UI: `http://localhost:15673` (user/pass: `guest` / `guest`)

UI cho phép:

- Tạo đơn từ trình duyệt
- Xem timeline event theo thời gian thực
- So sánh nhanh choreography và orchestration

Lưu ý mặc định:

- Bản compose hiện để `PAYMENT_FAIL_RATE=0`, `KITCHEN_FAIL_RATE=0`, `DELIVERY_FAIL_RATE=0` để demo success ổn định.
- Khi cần demo tình huống lỗi, bật lại bằng biến môi trường như phần test case bên dưới.

## 4) Tạo đơn hàng

```bash
curl -X POST http://localhost:4001/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sku": "burger", "quantity": 2},
      {"sku": "tea", "quantity": 1}
    ],
    "totalAmount": 120000,
    "address": "123 Nguyễn Trãi, TP.HCM"
  }'
```

PowerShell:

```powershell
$body = @{
  items = @(
    @{ sku = "burger"; quantity = 2 },
    @{ sku = "tea"; quantity = 1 }
  )
  totalAmount = 120000
  address = "123 Nguyễn Trãi, TP.HCM"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST -Uri http://localhost:4001/orders -ContentType "application/json" -Body $body
```

## 5) Xem trạng thái đơn

```bash
curl http://localhost:4001/orders/<orderId>
```

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri http://localhost:4001/orders/<orderId>
```

## 6) Test case cho giảng viên

### 6.1 Success flow

Kỳ vọng log:

- `ORDER_CREATED`
- `INVENTORY_RESERVED`
- `PAYMENT_SUCCESS`
- `KITCHEN_DONE`
- `DELIVERY_DONE`
- `ORDER_COMPLETED`

### 6.2 Inventory fail

```bash
curl -X POST http://localhost:4001/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sku": "pizza", "quantity": 9999}
    ],
    "totalAmount": 999000,
    "address": "Inventory Fail Case"
  }'
```

Kỳ vọng: `INVENTORY_FAILED` -> `ORDER_CANCELLED`

### 6.3 Payment fail

PowerShell:

```powershell
$env:PAYMENT_FAIL_RATE = "1"
docker compose up --build
```

Kỳ vọng: `PAYMENT_FAILED` -> `ORDER_CANCELLED`

### 6.4 Kitchen fail -> refund

PowerShell:

```powershell
$env:KITCHEN_FAIL_RATE = "1"
docker compose up --build
```

Kỳ vọng:

- `KITCHEN_FAILED`
- `PAYMENT_REFUND_REQUEST`
- `PAYMENT_REFUNDED`
- `ORDER_CANCELLED`

### 6.5 Delivery retry 3 lần

PowerShell:

```powershell
$env:DELIVERY_FAIL_RATE = "1"
docker compose up --build
```

Kỳ vọng:

- Orchestrator phát `DELIVERY_START_REQUEST` đến 3 lần
- Nhận `DELIVERY_FAILED` mỗi lần
- Hết retry: `ORDER_CANCELLED`

## 7) Xem log từng service

```bash
docker compose logs -f orchestrator-service
docker compose logs -f order-service
docker compose logs -f inventory-service
docker compose logs -f payment-service
docker compose logs -f kitchen-service
docker compose logs -f delivery-service
```

## 8) Dừng demo

```bash
docker compose down
```
