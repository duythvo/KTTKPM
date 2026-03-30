# Food Order Demo

Project gồm 2 phiên bản workflow đặt đồ ăn theo kiến trúc hướng sự kiện:

- `choreography/`: không có orchestrator trung tâm
- `orchestration/`: có `orchestrator-service` điều phối trung tâm

## Cấu trúc

```text
food-order-demo/
  choreography/
    docker-compose.yml
    order-service/
    inventory-service/
    payment-service/
    kitchen-service/
    delivery-service/
    README.md
    evidence.md
  orchestration/
    docker-compose.yml
    orchestrator-service/
    order-service/
    inventory-service/
    payment-service/
    kitchen-service/
    delivery-service/
    README.md
    evidence.md
```

## Chạy nhanh

Choreography:

```bash
cd choreography
docker compose up --build
```

Orchestration:

```bash
cd orchestration
docker compose up --build
```

Hướng dẫn demo chi tiết, test case bằng curl, mô phỏng failure, retry và so sánh kiến trúc nằm trong:

- `choreography/README.md`
- `choreography/evidence.md`
- `orchestration/README.md`
- `orchestration/evidence.md`

## Web UI React + Tailwind

Web UI đã được tích hợp vào cả 2 compose:

- Chạy choreography stack -> UI tại `http://localhost:5173`
- Chạy orchestration stack -> UI tại `http://localhost:5174`

Tính năng UI:

- Tạo đơn hàng cho choreography và orchestration
- Theo dõi timeline sự kiện theo `orderId`
- So sánh trực quan 2 kiến trúc ngay trên dashboard
