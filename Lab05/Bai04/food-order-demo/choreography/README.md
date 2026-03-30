# Food Ordering Demo - Event Choreography

## 1) Mục tiêu

Bản này mô phỏng workflow đặt đơn đồ ăn theo mô hình event choreography:

- Không có orchestrator trung tâm
- Mỗi service tự lắng nghe event, xử lý, và phát event tiếp theo

## 2) Kiến trúc dịch vụ

- `order-service` (REST API + lưu trạng thái đơn)
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

API Order service: `http://localhost:3001`

Web UI (React + Tailwind): `http://localhost:5173`

RabbitMQ UI: `http://localhost:15672` (user/pass: `guest` / `guest`)

UI cho phép:

- Tạo đơn từ trình duyệt
- Xem timeline event theo thời gian thực
- So sánh nhanh choreography và orchestration

Lưu ý mặc định:

- Bản compose hiện để `PAYMENT_FAIL_RATE=0`, `KITCHEN_FAIL_RATE=0`, `DELIVERY_FAIL_RATE=0` để demo success ổn định.
- Khi cần demo tình huống lỗi, bật lại bằng biến môi trường như phần test case bên dưới.

## 4) Tạo đơn hàng

```bash
curl -X POST http://localhost:3001/orders \
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

Invoke-RestMethod -Method POST -Uri http://localhost:3001/orders -ContentType "application/json" -Body $body
```

## 5) Xem trạng thái đơn

```bash
curl http://localhost:3001/orders/<orderId>
```

PowerShell:

```powershell
Invoke-RestMethod -Method GET -Uri http://localhost:3001/orders/<orderId>
```

## 6) Test case bắt buộc

### 6.1 Success flow

- Dùng payload hợp lệ và thử lại đến khi không random fail.

Kỳ vọng log:

- `ORDER_CREATED`
- `INVENTORY_RESERVED`
- `PAYMENT_SUCCESS`
- `KITCHEN_DONE`
- `DELIVERY_DONE`
- `ORDER_COMPLETED`

### 6.2 Inventory fail

Gửi số lượng lớn hơn tồn kho:

```bash
curl -X POST http://localhost:3001/orders \
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

### 6.3 Payment fail (30% random)

Mặc định `PAYMENT_FAIL_RATE=0.3`.

Để demo fail chắc chắn, chạy lại với env:

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
- `PAYMENT_REFUNDED`
- `ORDER_CANCELLED`

### 6.5 Delivery retry 3 lần

Mặc định `DELIVERY_MAX_RETRY=3`, `DELIVERY_FAIL_RATE=0.4`.

Để dễ thấy retry, đặt fail rate cao hơn:

PowerShell:

```powershell
$env:DELIVERY_FAIL_RATE = "0.9"
docker compose up --build
```

Kỳ vọng: log `Delivery attempt` đến 3 lần, sau đó `DELIVERY_FAILED` -> `ORDER_CANCELLED`.

## 7) Xem log từng service

```bash
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
