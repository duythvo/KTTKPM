param(
    [ValidateSet("smoke", "backlog", "flow")]
    [string]$Mode = "smoke",
    [int]$Count = 20,
    [int]$NotifyCount = 3,
    [int]$FlowDelaySeconds = 2,
    [string]$ProducerBase = "http://localhost:4000",
    [string]$ConsumerBase = "http://localhost:4001",
    [string]$KafkaContainer = "eda-kafka",
    [string]$ConsumerGroup = "eda-demo-group",
    [int]$SettleSeconds = 3
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "\n==> $Message" -ForegroundColor Cyan
}

function Get-Json {
    param([string]$Url)
    return Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 8
}

function Post-Json {
    param(
        [string]$Url,
        [hashtable]$Body
    )

    $json = $Body | ConvertTo-Json -Depth 6
    return Invoke-RestMethod -Method Post -Uri $Url -ContentType "application/json" -Body $json -TimeoutSec 8
}

function Get-KafkaLag {
    param(
        [string]$Container,
        [string]$Group
    )

    try {
        $output = docker exec $Container kafka-consumer-groups --bootstrap-server kafka:29092 --describe --group $Group 2>&1
        if (-not $output) {
            return [pscustomobject]@{ TotalLag = $null; Raw = "No output from kafka-consumer-groups" }
        }

        $rawText = ($output | Out-String).Trim()
        $totalLag = 0
        $hasLagLine = $false

        foreach ($line in ($rawText -split "`n")) {
            $trimmed = $line.Trim()
            if (-not $trimmed) { continue }
            if ($trimmed -match "^GROUP\s+TOPIC\s+PARTITION") { continue }
            if ($trimmed -match "^TOPIC\s+PARTITION") { continue }
            if ($trimmed -match "Error:") { continue }

            if ($trimmed -match "has no active members") {
                continue
            }

            $parts = $trimmed -split "\s+"
            if ($parts.Count -ge 5) {
                $lag = $parts[5]
                if ($lag -match "^\d+$") {
                    $totalLag += [int]$lag
                    $hasLagLine = $true
                }
            }
        }

        if (-not $hasLagLine) {
            return [pscustomobject]@{ TotalLag = $null; Raw = $rawText }
        }

        return [pscustomobject]@{ TotalLag = $totalLag; Raw = $rawText }
    }
    catch {
        return [pscustomobject]@{ TotalLag = $null; Raw = $_.Exception.Message }
    }
}

Write-Host "EDA quick test" -ForegroundColor Green
Write-Host "Mode: $Mode"
Write-Host "Producer: $ProducerBase"
Write-Host "Consumer: $ConsumerBase"
Write-Host "Kafka container: $KafkaContainer"
Write-Host "Consumer group: $ConsumerGroup"

Write-Step "Checking health endpoints"
$producerHealth = Get-Json "$ProducerBase/api/health"
Write-Host ("Producer status: " + ($producerHealth.status))

$consumerHealthy = $true
$consumerHealth = $null
try {
    $consumerHealth = Get-Json "$ConsumerBase/api/health"
    Write-Host ("Consumer status: " + ($consumerHealth.status))
}
catch {
    $consumerHealthy = $false
    Write-Host "Consumer health check failed (possibly stopped)." -ForegroundColor Yellow
}

if ($Mode -eq "smoke") {
    if (-not $consumerHealthy) {
        throw "Smoke mode requires Consumer API running on $ConsumerBase"
    }

    Write-Step "Reading baseline stats"
    $beforeStats = Get-Json "$ConsumerBase/api/stats"
    Write-Host ("Before stats: " + ($beforeStats | ConvertTo-Json -Compress))

    Write-Step "Publishing 1 order + 1 payment + 1 notification"
    $orderResp = Post-Json "$ProducerBase/api/events/order" @{
        customerName = "Smoke User"
        product = "Smoke Product"
        amount = 199
    }

    $orderEventId = $orderResp.event.eventId
    Write-Host "Order eventId: $orderEventId"

    [void](Post-Json "$ProducerBase/api/events/payment" @{
        orderId = $orderEventId
        amount = 199
        method = "credit"
    })

    [void](Post-Json "$ProducerBase/api/events/notify" @{
        userId = "smoke-user-01"
        message = "Smoke test notification"
        channel = "email"
    })

    Write-Step "Waiting $SettleSeconds seconds for consumer processing"
    Start-Sleep -Seconds $SettleSeconds

    Write-Step "Reading post stats and latest events"
    $afterStats = Get-Json "$ConsumerBase/api/stats"
    $events = Get-Json "$ConsumerBase/api/events"

    $deltaOrders = [int]$afterStats.totalOrders - [int]$beforeStats.totalOrders
    $deltaPayments = [int]$afterStats.totalPayments - [int]$beforeStats.totalPayments
    $deltaNotifications = [int]$afterStats.totalNotifications - [int]$beforeStats.totalNotifications

    Write-Host ("After stats:  " + ($afterStats | ConvertTo-Json -Compress))
    Write-Host "Delta orders: $deltaOrders"
    Write-Host "Delta payments: $deltaPayments"
    Write-Host "Delta notifications: $deltaNotifications"

    if ($deltaOrders -ge 1 -and $deltaPayments -ge 1 -and $deltaNotifications -ge 1) {
        Write-Host "SMOKE TEST PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "SMOKE TEST FAILED: Stats did not increase as expected." -ForegroundColor Red
        exit 1
    }

    if ($events.Count -gt 0) {
        Write-Host ("Latest event topic: " + $events[0].topic)
    }

    exit 0
}

if ($Mode -eq "backlog") {
    Write-Step "Backlog mode: publishing $Count order events"
    if ($consumerHealthy) {
        Write-Host "Consumer is currently running. Backlog may stay low." -ForegroundColor Yellow
        Write-Host "Tip: stop consumer first, run this script, then start consumer to watch lag drain." -ForegroundColor Yellow
    }

    for ($i = 1; $i -le $Count; $i++) {
        [void](Post-Json "$ProducerBase/api/events/order" @{
            customerName = "BacklogUser$i"
            product = "BacklogProduct$i"
            amount = (50 + $i)
        })
    }
    Write-Host "Published $Count events." -ForegroundColor Green

    Write-Step "Checking Kafka consumer group lag"
    $lag = Get-KafkaLag -Container $KafkaContainer -Group $ConsumerGroup

    if ($null -ne $lag.TotalLag) {
        Write-Host "Total lag: $($lag.TotalLag)"
        if ($lag.TotalLag -gt 0) {
            Write-Host "Backlog detected in Kafka." -ForegroundColor Green
        }
        else {
            Write-Host "Lag is 0. Consumer may be actively draining messages." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Could not parse lag automatically. Raw output:" -ForegroundColor Yellow
        Write-Host $lag.Raw
    }

    Write-Step "Done"
    exit 0
}

if ($Mode -eq "flow") {
    if (-not $consumerHealthy) {
        throw "Flow mode requires Consumer API running on $ConsumerBase"
    }

    Write-Step "Reading baseline stats"
    $beforeStats = Get-Json "$ConsumerBase/api/stats"
    Write-Host ("Before stats: " + ($beforeStats | ConvertTo-Json -Compress))

    Write-Step "Step 1/3: Creating order event"
    $orderResp = Post-Json "$ProducerBase/api/events/order" @{
        customerName = "Flow User"
        product = "Flow Product"
        amount = 299
    }
    $orderEventId = $orderResp.event.eventId
    Write-Host "Created order eventId: $orderEventId" -ForegroundColor Green

    Start-Sleep -Seconds $FlowDelaySeconds
    $stats1 = Get-Json "$ConsumerBase/api/stats"
    $lag1 = Get-KafkaLag -Container $KafkaContainer -Group $ConsumerGroup
    Write-Host ("After order stats: " + ($stats1 | ConvertTo-Json -Compress))
    if ($null -ne $lag1.TotalLag) {
        Write-Host "Current lag: $($lag1.TotalLag)"
    }

    Write-Step "Step 2/3: Creating payment event"
    [void](Post-Json "$ProducerBase/api/events/payment" @{
        orderId = $orderEventId
        amount = 299
        method = "credit"
    })
    Write-Host "Payment event published for orderId: $orderEventId" -ForegroundColor Green

    Start-Sleep -Seconds $FlowDelaySeconds
    $stats2 = Get-Json "$ConsumerBase/api/stats"
    $lag2 = Get-KafkaLag -Container $KafkaContainer -Group $ConsumerGroup
    Write-Host ("After payment stats: " + ($stats2 | ConvertTo-Json -Compress))
    if ($null -ne $lag2.TotalLag) {
        Write-Host "Current lag: $($lag2.TotalLag)"
    }

    Write-Step "Step 3/3: Sending $NotifyCount notification events with delay"
    for ($i = 1; $i -le $NotifyCount; $i++) {
        [void](Post-Json "$ProducerBase/api/events/notify" @{
            userId = "flow-user-01"
            message = "Thong bao thu $i cho don $orderEventId"
            channel = "email"
        })
        Write-Host "Notification $i/$NotifyCount published"
        Start-Sleep -Seconds $FlowDelaySeconds
    }

    Write-Step "Reading final stats and latest events"
    $afterStats = Get-Json "$ConsumerBase/api/stats"
    $deltaOrders = [int]$afterStats.totalOrders - [int]$beforeStats.totalOrders
    $deltaPayments = [int]$afterStats.totalPayments - [int]$beforeStats.totalPayments
    $deltaNotifications = [int]$afterStats.totalNotifications - [int]$beforeStats.totalNotifications
    $lagFinal = Get-KafkaLag -Container $KafkaContainer -Group $ConsumerGroup
    $events = Get-Json "$ConsumerBase/api/events"

    Write-Host ("Final stats: " + ($afterStats | ConvertTo-Json -Compress))
    Write-Host "Delta orders: $deltaOrders"
    Write-Host "Delta payments: $deltaPayments"
    Write-Host "Delta notifications: $deltaNotifications"

    if ($null -ne $lagFinal.TotalLag) {
        Write-Host "Final lag: $($lagFinal.TotalLag)"
    }

    Write-Host "Latest 5 topics in event_log:" -ForegroundColor Cyan
    $events | Select-Object -First 5 | ForEach-Object {
        Write-Host ("- " + $_.topic + " | eventId=" + $_.eventId + " | processedAt=" + $_.processedAt)
    }

    if ($deltaOrders -ge 1 -and $deltaPayments -ge 1 -and $deltaNotifications -ge $NotifyCount) {
        Write-Host "FLOW TEST PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "FLOW TEST FAILED: event flow did not complete as expected." -ForegroundColor Red
        exit 1
    }

    Write-Step "Done"
    exit 0
}
