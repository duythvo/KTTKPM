-- ============================================================
--  QUERY 2: VERTICAL PARTITION (Chia theo COT - Column)
--  Database: AdventureWorks2008R2
--  Muc tieu: Tach bang Product rong thanh 2 bang hep hon
--            Bang Core: cac cot THUONG XUYEN truy van
--            Bang Extended: cac cot IT DUNG / du lieu lon
-- ============================================================

USE AdventureWorks2008R2;
GO

-- ------------------------------------------------------------
-- BUOC 0: Xem cau truc bang goc de hieu ly do tach
-- ------------------------------------------------------------
PRINT '=== BUOC 0: Thong tin bang goc Production.Product ===';

SELECT
    c.column_id,
    c.name                   AS TenCot,
    t.name                   AS KieuDuLieu,
    c.max_length             AS DoDaiMax,
    c.is_nullable            AS ChoPhepNull
FROM sys.columns c
JOIN sys.types   t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Production.Product')
ORDER BY c.column_id;

-- Nhan xet: Bang co 25 cot, nhieu cot it dung (Description, ModifiedDate...)
-- => Moi query SELECT * doc qua nhieu du lieu khong can thiet
GO

-- ------------------------------------------------------------
-- BUOC 1: Don dep neu da ton tai
-- ------------------------------------------------------------
PRINT '=== BUOC 1: Don dep cu ===';

IF OBJECT_ID('Production.Product_Extended', 'U') IS NOT NULL
    DROP TABLE Production.Product_Extended;

IF OBJECT_ID('Production.Product_Core', 'U') IS NOT NULL
    DROP TABLE Production.Product_Core;

PRINT 'Don dep hoan tat.';
GO

-- ------------------------------------------------------------
-- BUOC 2: Tao bang CORE (cot thuong xuyen truy van)
-- ------------------------------------------------------------
PRINT '=== BUOC 2: Tao bang Product_Core ===';

CREATE TABLE Production.Product_Core (
    ProductID               INT            NOT NULL PRIMARY KEY,
    Name                    NVARCHAR(50)   NOT NULL,
    ProductNumber           NVARCHAR(25)   NOT NULL,
    Color                   NVARCHAR(15)   NULL,
    ListPrice               MONEY          NOT NULL,
    StandardCost            MONEY          NOT NULL,
    Size                    NVARCHAR(5)    NULL,
    Weight                  DECIMAL(8,2)   NULL,
    ProductSubcategoryID    INT            NULL,
    ProductModelID          INT            NULL,
    SellStartDate           DATETIME       NOT NULL,
    SellEndDate             DATETIME       NULL,
    DiscontinuedDate        DATETIME       NULL
);

PRINT 'Bang Product_Core tao thanh cong (13 cot thuong dung).';
GO

-- ------------------------------------------------------------
-- BUOC 3: Tao bang EXTENDED (cot it dung / metadata)
-- ------------------------------------------------------------
PRINT '=== BUOC 3: Tao bang Product_Extended ===';

CREATE TABLE Production.Product_Extended (
    ProductID               INT            NOT NULL PRIMARY KEY,
    -- Cac cot it duoc truy van trong bao cao hang ngay
    MakeFlag                BIT            NOT NULL,
    FinishedGoodsFlag       BIT            NOT NULL,
    SafetyStockLevel        SMALLINT       NOT NULL,
    ReorderPoint            SMALLINT       NOT NULL,
    DaysToManufacture       INT            NOT NULL,
    ProductLine             NCHAR(2)       NULL,
    Class                   NCHAR(2)       NULL,
    Style                   NCHAR(2)       NULL,
    SizeUnitMeasureCode     NCHAR(3)       NULL,
    WeightUnitMeasureCode   NCHAR(3)       NULL,
    rowguid                 UNIQUEIDENTIFIER NOT NULL,
    ModifiedDate            DATETIME       NOT NULL,
    -- Khoa ngoai tham chieu bang Core
    CONSTRAINT FK_ProductExtended_Core
        FOREIGN KEY (ProductID)
        REFERENCES Production.Product_Core(ProductID)
);

PRINT 'Bang Product_Extended tao thanh cong (13 cot it dung).';
GO

-- ------------------------------------------------------------
-- BUOC 4: Nhap du lieu vao 2 bang
-- ------------------------------------------------------------
PRINT '=== BUOC 4: Insert du lieu ===';

INSERT INTO Production.Product_Core
    (ProductID, Name, ProductNumber, Color, ListPrice, StandardCost,
     Size, Weight, ProductSubcategoryID, ProductModelID,
     SellStartDate, SellEndDate, DiscontinuedDate)
SELECT
    ProductID, Name, ProductNumber, Color, ListPrice, StandardCost,
    Size, Weight, ProductSubcategoryID, ProductModelID,
    SellStartDate, SellEndDate, DiscontinuedDate
FROM Production.Product;

PRINT CONCAT('Product_Core: da insert ', @@ROWCOUNT, ' hang.');

INSERT INTO Production.Product_Extended
    (ProductID, MakeFlag, FinishedGoodsFlag, SafetyStockLevel,
     ReorderPoint, DaysToManufacture, ProductLine, Class, Style,
     SizeUnitMeasureCode, WeightUnitMeasureCode, rowguid, ModifiedDate)
SELECT
    ProductID, MakeFlag, FinishedGoodsFlag, SafetyStockLevel,
    ReorderPoint, DaysToManufacture, ProductLine, Class, Style,
    SizeUnitMeasureCode, WeightUnitMeasureCode, rowguid, ModifiedDate
FROM Production.Product;

PRINT CONCAT('Product_Extended: da insert ', @@ROWCOUNT, ' hang.');
GO

-- ------------------------------------------------------------
-- BUOC 5: Kiem tra ket qua
-- ------------------------------------------------------------
PRINT '=== BUOC 5: Ket qua Vertical Partition ===';

-- So sanh so cot giua cac bang
SELECT 'Bang goc Production.Product'  AS Bang, COUNT(*) AS SoCot
FROM sys.columns WHERE object_id = OBJECT_ID('Production.Product')
UNION ALL
SELECT 'Product_Core  (thuong dung)', COUNT(*)
FROM sys.columns WHERE object_id = OBJECT_ID('Production.Product_Core')
UNION ALL
SELECT 'Product_Extended (it dung)', COUNT(*)
FROM sys.columns WHERE object_id = OBJECT_ID('Production.Product_Extended');

-- Kiem tra so hang khop nhau
SELECT
    (SELECT COUNT(*) FROM Production.Product)          AS [Bang Goc],
    (SELECT COUNT(*) FROM Production.Product_Core)     AS [Core],
    (SELECT COUNT(*) FROM Production.Product_Extended) AS [Extended];

-- ------------------------------------------------------------
-- BUOC 6: Vi du cach truy van sau khi tach
-- ------------------------------------------------------------
PRINT '=== BUOC 6: Vi du truy van sau Vertical Partition ===';

-- Truong hop 1: Chi can thong tin gia + ten (chi doc bang Core - nhanh)
SELECT TOP 10
    ProductID, Name, ListPrice, StandardCost, Color
FROM Production.Product_Core
WHERE ListPrice > 500
ORDER BY ListPrice DESC;

-- Truong hop 2: Can day du thong tin (JOIN 2 bang)
SELECT TOP 5
    c.ProductID,
    c.Name,
    c.ListPrice,
    e.SafetyStockLevel,
    e.DaysToManufacture,
    e.ModifiedDate
FROM Production.Product_Core     c
JOIN Production.Product_Extended e ON c.ProductID = e.ProductID
WHERE c.ListPrice > 1000;

PRINT '=== QUERY 2 HOAN TAT ===';
GO