-- ============================================================
--  QUERY 1: HORIZONTAL PARTITION (Chia theo HÀNG - Row)
--  Database: AdventureWorks2008R2
--  Muc tieu: Chia bang SalesOrderHeader theo nam (2005-2008)

USE AdventureWorks2008R2;
GO

-- ------------------------------------------------------------
-- BUOC 0: Kiem tra du lieu thuc te truoc khi lam
-- ------------------------------------------------------------
PRINT '=== BUOC 0: Kiem tra phan bo du lieu theo nam ===';

SELECT 
    YEAR(OrderDate)  AS Nam,
    COUNT(*)         AS SoDonHang,
    MIN(OrderDate)   AS TuNgay,
    MAX(OrderDate)   AS DenNgay
FROM Sales.SalesOrderHeader
GROUP BY YEAR(OrderDate)
ORDER BY Nam;
GO

-- ------------------------------------------------------------
-- BUOC 1: Don dep neu da ton tai tu lan chay truoc
-- ------------------------------------------------------------
PRINT '=== BUOC 1: Don dep cu ===';

IF OBJECT_ID('Sales.SalesOrderHeader_H', 'U') IS NOT NULL
    DROP TABLE Sales.SalesOrderHeader_H;

IF EXISTS (SELECT * FROM sys.partition_schemes  WHERE name = 'ps_Order_ByYear')
    DROP PARTITION SCHEME ps_Order_ByYear;

IF EXISTS (SELECT * FROM sys.partition_functions WHERE name = 'pf_Order_ByYear')
    DROP PARTITION FUNCTION pf_Order_ByYear;

PRINT 'Don dep hoan tat.';
GO

-- ------------------------------------------------------------
-- BUOC 2: Tao Partition Function
-- Boundary phu hop voi data 2005-2008
-- ------------------------------------------------------------
PRINT '=== BUOC 2: Tao Partition Function ===';

CREATE PARTITION FUNCTION pf_Order_ByYear (DATETIME)
AS RANGE RIGHT FOR VALUES (
    '2006-01-01',   -- P1 : < 2006        => nam 2005
    '2007-01-01',   -- P2 : 2006-01-01 -> 2006-12-31
    '2008-01-01',   -- P3 : 2007-01-01 -> 2007-12-31
    '2009-01-01'    -- P4 : 2008-01-01 -> 2008-12-31
);                  -- P5 : >= 2009       => du phong

PRINT 'Partition Function tao thanh cong: 5 partitions.';
GO

-- ------------------------------------------------------------
-- BUOC 3: Tao Partition Scheme
-- ------------------------------------------------------------
PRINT '=== BUOC 3: Tao Partition Scheme ===';

CREATE PARTITION SCHEME ps_Order_ByYear
AS PARTITION pf_Order_ByYear
ALL TO ([PRIMARY]);

PRINT 'Partition Scheme tao thanh cong.';
GO

-- ------------------------------------------------------------
-- BUOC 4: Tao bang Partitioned
-- ------------------------------------------------------------
PRINT '=== BUOC 4: Tao bang SalesOrderHeader_H ===';

CREATE TABLE Sales.SalesOrderHeader_H (
    SalesOrderID    INT       NOT NULL,
    OrderDate       DATETIME  NOT NULL,
    CustomerID      INT       NOT NULL,
    SalesPersonID   INT       NULL,
    TerritoryID     INT       NULL,
    TotalDue        MONEY     NOT NULL,
    Status          TINYINT   NOT NULL,
    -- Clustered PK phai chua partition key (OrderDate)
    CONSTRAINT PK_SalesOrderHeader_H
        PRIMARY KEY CLUSTERED (SalesOrderID, OrderDate)
        ON ps_Order_ByYear(OrderDate)
) ON ps_Order_ByYear(OrderDate);

PRINT 'Bang SalesOrderHeader_H tao thanh cong.';
GO

-- ------------------------------------------------------------
-- BUOC 5: Nhap du lieu tu bang goc
-- ------------------------------------------------------------
PRINT '=== BUOC 5: Insert du lieu ===';

INSERT INTO Sales.SalesOrderHeader_H
    (SalesOrderID, OrderDate, CustomerID, SalesPersonID,
     TerritoryID, TotalDue, Status)
SELECT
    SalesOrderID, OrderDate, CustomerID, SalesPersonID,
    TerritoryID, TotalDue, Status
FROM Sales.SalesOrderHeader;

PRINT CONCAT('Da insert: ', @@ROWCOUNT, ' hang.');
GO

-- ------------------------------------------------------------
-- BUOC 6: Kiem tra phan bo du lieu vao cac partition
-- ------------------------------------------------------------
PRINT '=== BUOC 6: Ket qua phan bo theo partition ===';

SELECT
    p.partition_number                                  AS [Partition So],
    p.rows                                              AS [So Hang],
    MIN(h.OrderDate)                                    AS [Tu Ngay],
    MAX(h.OrderDate)                                    AS [Den Ngay],
    YEAR(MIN(h.OrderDate))                              AS [Nam]
FROM Sales.SalesOrderHeader_H h
JOIN sys.partitions p
    ON  p.object_id = OBJECT_ID('Sales.SalesOrderHeader_H')
    AND p.index_id  = 1
    AND $PARTITION.pf_Order_ByYear(h.OrderDate) = p.partition_number
GROUP BY p.partition_number, p.rows
ORDER BY p.partition_number;

PRINT '=== QUERY 1 HOAN TAT ===';
GO