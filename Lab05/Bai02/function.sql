-- ============================================================
--  QUERY 3: FUNCTIONAL PARTITION (Partition Function + Scheme)
--  Database: AdventureWorks2008R2
--  Muc tieu: Partition bang SalesOrderDetail theo SalesOrderID
--            Day la tinh nang NATIVE cua SQL Server
--            Hieu qua nhat cho bang du lieu lon
--  Chay file nay SAU Query 1 va Query 2
-- ============================================================

USE AdventureWorks2008R2;
GO

-- ------------------------------------------------------------
-- BUOC 0: Xem phan bo SalesOrderID de chon boundary hop ly
-- Dung cach tuong thich voi compatibility level 100 (SQL 2008)
-- Khong dung PERCENTILE_CONT (chi co tu level 110 tro len)
-- ------------------------------------------------------------
PRINT '=== BUOC 0: Phan tich phan bo SalesOrderID ===';

-- Thong tin tong quat
SELECT
    MIN(SalesOrderID)       AS ID_NhoNhat,
    MAX(SalesOrderID)       AS ID_LonNhat,
    COUNT(*)                AS TongSoHang,
    COUNT(*) / 4            AS HangMoiPartition_Uoc
FROM Sales.SalesOrderDetail;

-- Tinh tu phan vi bang ROW_NUMBER (tuong thich moi phien ban SQL Server)
-- Chia 121257 hang thanh 4 phan => moi phan ~30314 hang
WITH Ranked AS (
    SELECT
        SalesOrderID,
        ROW_NUMBER() OVER (ORDER BY SalesOrderID)   AS RowNum,
        COUNT(*) OVER ()                            AS TongHang
    FROM Sales.SalesOrderDetail
),
Percentiles AS (
    SELECT DISTINCT
        MAX(CASE WHEN RowNum <= TongHang * 0.25 THEN SalesOrderID END)
            OVER () AS Phan_Vi_25,
        MAX(CASE WHEN RowNum <= TongHang * 0.50 THEN SalesOrderID END)
            OVER () AS Phan_Vi_50,
        MAX(CASE WHEN RowNum <= TongHang * 0.75 THEN SalesOrderID END)
            OVER () AS Phan_Vi_75,
        MAX(SalesOrderID) OVER ()                   AS Phan_Vi_100
    FROM Ranked
)
SELECT TOP 1
    Phan_Vi_25  AS [Boundary P1 (~25%)],
    Phan_Vi_50  AS [Boundary P2 (~50%)],
    Phan_Vi_75  AS [Boundary P3 (~75%)],
    Phan_Vi_100 AS [ID lon nhat]
FROM Percentiles;
-- Ket qua nay cho ban biet nen dat boundary o dau
-- De cac partition co kich thuoc gan bang nhau
GO

-- ------------------------------------------------------------
-- BUOC 1: Don dep neu da ton tai
-- ------------------------------------------------------------
PRINT '=== BUOC 1: Don dep cu ===';

IF OBJECT_ID('Sales.SalesOrderDetail_F', 'U') IS NOT NULL
    DROP TABLE Sales.SalesOrderDetail_F;

IF EXISTS (SELECT * FROM sys.partition_schemes  WHERE name = 'ps_Detail_ByOrderID')
    DROP PARTITION SCHEME ps_Detail_ByOrderID;

IF EXISTS (SELECT * FROM sys.partition_functions WHERE name = 'pf_Detail_ByOrderID')
    DROP PARTITION FUNCTION pf_Detail_ByOrderID;

PRINT 'Don dep hoan tat.';
GO

-- ------------------------------------------------------------
-- BUOC 2: Tao Partition Function
-- Chia SalesOrderID thanh 4 phan gan bang nhau
-- Range: 43659 -> 75123 (du lieu AdventureWorks2008R2)
-- ------------------------------------------------------------
PRINT '=== BUOC 2: Tao Partition Function ===';

CREATE PARTITION FUNCTION pf_Detail_ByOrderID (INT)
AS RANGE LEFT FOR VALUES (
    52500,   -- P1: SalesOrderID <= 52500  (~25% du lieu)
    61000,   -- P2: 52501 -> 61000         (~25% du lieu)
    68000    -- P3: 61001 -> 68000         (~25% du lieu)
);           -- P4: > 68000               (~25% du lieu)

-- Giai thich RANGE LEFT vs RANGE RIGHT:
-- RANGE LEFT : gia tri boundary thuoc phan TRAI  (dung cho so nguyen)
-- RANGE RIGHT: gia tri boundary thuoc phan PHAI  (dung cho ngay thang - inclusve start)

PRINT 'Partition Function tao thanh cong: 4 partitions.';
GO

-- ------------------------------------------------------------
-- BUOC 3: Tao Partition Scheme
-- ------------------------------------------------------------
PRINT '=== BUOC 3: Tao Partition Scheme ===';

CREATE PARTITION SCHEME ps_Detail_ByOrderID
AS PARTITION pf_Detail_ByOrderID
ALL TO ([PRIMARY]);
-- Production thuc te: moi partition => 1 filegroup rieng
-- Vi du:
-- TO (FG_Q1, FG_Q2, FG_Q3, FG_Q4, FG_FUTURE)

PRINT 'Partition Scheme tao thanh cong.';
GO

-- ------------------------------------------------------------
-- BUOC 4: Tao bang Partitioned voi index tren partition key
-- ------------------------------------------------------------
PRINT '=== BUOC 4: Tao bang SalesOrderDetail_F ===';

CREATE TABLE Sales.SalesOrderDetail_F (
    SalesOrderID        INT             NOT NULL,
    SalesOrderDetailID  INT             NOT NULL,
    ProductID           INT             NOT NULL,
    OrderQty            SMALLINT        NOT NULL,
    UnitPrice           MONEY           NOT NULL,
    UnitPriceDiscount   MONEY           NOT NULL DEFAULT 0.0,
    LineTotal           NUMERIC(38, 6)  NOT NULL,
    -- Clustered PK phai chua partition key (SalesOrderID)
    CONSTRAINT PK_SalesOrderDetail_F
        PRIMARY KEY CLUSTERED (SalesOrderID, SalesOrderDetailID)
        ON ps_Detail_ByOrderID(SalesOrderID)
) ON ps_Detail_ByOrderID(SalesOrderID);

PRINT 'Bang SalesOrderDetail_F tao thanh cong.';
GO

-- ------------------------------------------------------------
-- BUOC 5: Nhap du lieu
-- ------------------------------------------------------------
PRINT '=== BUOC 5: Insert du lieu ===';

INSERT INTO Sales.SalesOrderDetail_F
    (SalesOrderID, SalesOrderDetailID, ProductID,
     OrderQty, UnitPrice, UnitPriceDiscount, LineTotal)
SELECT
    SalesOrderID, SalesOrderDetailID, ProductID,
    OrderQty, UnitPrice, UnitPriceDiscount, LineTotal
FROM Sales.SalesOrderDetail;

PRINT CONCAT('Da insert: ', @@ROWCOUNT, ' hang.');
GO

-- ------------------------------------------------------------
-- BUOC 6: Kiem tra phan bo du lieu vao cac partition
-- ------------------------------------------------------------
PRINT '=== BUOC 6: Ket qua phan bo Functional Partition ===';

SELECT
    p.partition_number              AS [Partition],
    p.rows                          AS [So Hang],
    MIN(d.SalesOrderID)             AS [OrderID Tu],
    MAX(d.SalesOrderID)             AS [OrderID Den],
    CAST(p.rows * 100.0 /
         SUM(p.rows) OVER()
     AS DECIMAL(5,1))               AS [Phan Tram %]
FROM Sales.SalesOrderDetail_F d
JOIN sys.partitions p
    ON  p.object_id = OBJECT_ID('Sales.SalesOrderDetail_F')
    AND p.index_id  = 1
    AND $PARTITION.pf_Detail_ByOrderID(d.SalesOrderID) = p.partition_number
GROUP BY p.partition_number, p.rows
ORDER BY p.partition_number;

-- ------------------------------------------------------------
-- BUOC 7: Xac nhan Partition Elimination voi $PARTITION
-- ------------------------------------------------------------
PRINT '=== BUOC 7: Xem so hang trong tung partition ===';

SELECT
    $PARTITION.pf_Detail_ByOrderID(SalesOrderID)   AS PartitionNumber,
    COUNT(*)                                        AS SoHang,
    SUM(LineTotal)                                  AS TongDoanhThu
FROM Sales.SalesOrderDetail_F
GROUP BY $PARTITION.pf_Detail_ByOrderID(SalesOrderID)
ORDER BY PartitionNumber;

PRINT '=== QUERY 3 HOAN TAT ===';
GO