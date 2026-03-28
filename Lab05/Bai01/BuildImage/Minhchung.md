# Ví Dụ Docker Multi-stage (4 Stage)

Mục tiêu: build từ image nền nặng, sau đó giảm mạnh dung lượng image runtime.

## 1. Cấu trúc các stage

1. deps: dùng golang:1.24-bookworm để tải dependencies.
2. test: chạy unit test trong môi trường build.
3. build: compile binary và strip symbol với -ldflags="-s -w".
4. runtime: chỉ copy binary sang image nhẹ distroless.

## 2. Chạy từng bước để build và so sánh

Mở terminal tại thư mục BuildImage rồi chạy theo đúng thứ tự dưới đây.

### Bước 1: Dọn container/image cũ (nếu có)

```powershell
docker rm -f demo-ms-run 2>$null
docker rmi demo-naive:1.0 demo-multistage:1.0 2>$null
```

### Bước 2: Build bản naive (1 stage, dung lượng lớn)

```powershell
docker build -f Dockerfile.naive -t demo-naive:1.0 .
```

### Bước 3: Build bản multi-stage (4 stage, dung lượng nhỏ)

```powershell
docker build -t demo-multistage:1.0 .
```

### Bước 4: So sánh dung lượng 2 image

```powershell
docker image ls --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Select-String "demo-naive|demo-multistage|REPOSITORY"
```

Kết quả mẫu:

- demo-naive: 946MB
- demo-multistage: 7.6MB

## 3. Chạy thử image tối ưu

### Bước 1: Chạy container từ image multi-stage

```powershell
docker run --name demo-ms-run -p 8088:8080 -d demo-multistage:1.0
```

### Bước 2: Kiểm tra endpoint health

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8088/health
```

Kỳ vọng: response chứa chuỗi ok - multi-stage image is running.

## 4. Vì sao giảm được dung lượng

- Không mang compiler và toolchain vào runtime image.
- Không copy source code vào runtime image.
- Binary đã được strip symbol bằng -ldflags="-s -w".
- Dùng runtime base image tối giản (distroless).
