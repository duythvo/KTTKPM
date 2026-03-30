# Minh Chung Demo Service-Based Architecture

## 1. Mo ta kien truc

- API Gateway: cong 3000
- Order Service: cong 3001
- Payment Service: cong 3002
- Shipping Service: cong 3003
- SQLite dung chung: `database.db`

## 2. Luong nghiep vu demo

1. Tao order tu frontend
2. Gateway route sang Order Service
3. Order Service tao order va goi Payment Service tao payment
4. Confirm payment tu frontend
5. Payment Service cap nhat payment = paid va goi Shipping Service tao shipment
6. Mark shipped tu frontend
7. Shipping Service cap nhat shipment = shipped

## 3. Cac endpoint chinh

- Gateway:
  - GET /api/orders
  - POST /api/orders
  - GET /api/payments
  - POST /api/payments
  - PUT /api/payments/:id/confirm
  - GET /api/shippings
  - POST /api/shippings
  - PUT /api/shippings/:id/ship
  - GET /health

## 4. Log minh hoa

- [GATEWAY] Routing POST /api/orders -> http://localhost:3001/orders
- [ORDER SERVICE] POST /orders
- [ORDER SERVICE] Calling Payment Service to create payment...
- [PAYMENT SERVICE] POST /payments
- [PAYMENT SERVICE] PUT /payments/1/confirm
- [PAYMENT SERVICE] Calling Shipping Service to create shipment...
- [SHIPPING SERVICE] POST /shippings
- [SHIPPING SERVICE] PUT /shippings/1/ship

## 5. Lenh chay

1. npm install
2. node start.js
3. Mo trinh duyet: http://localhost:3000
