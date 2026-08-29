-- ============================================================================
-- Contact Management System (CMS)
-- DEVELOPMENT-ONLY Reset Script (DESTRUCTIVE - DROPS ALL TABLES & DATA)
-- ============================================================================
-- WARNING: DO NOT RUN THIS SCRIPT IN PRODUCTION OR STAGING ENVIRONMENTS.
-- This script completely tears down and drops all database tables for local dev reset.
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

USE ContactDB;
GO

-- Drop all foreign keys and tables in reverse dependency order
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.contact_phones', N'U') IS NOT NULL DROP TABLE dbo.contact_phones;
    IF OBJECT_ID(N'dbo.contact_emails', N'U') IS NOT NULL DROP TABLE dbo.contact_emails;
    IF OBJECT_ID(N'dbo.contacts', N'U') IS NOT NULL DROP TABLE dbo.contacts;
    IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL DROP TABLE dbo.users;
    IF OBJECT_ID(N'dbo.schema_migrations', N'U') IS NOT NULL DROP TABLE dbo.schema_migrations;

    COMMIT TRANSACTION;
    PRINT N'Development database tables reset successfully. Run schema-sqlserver.sql to rebuild the schema.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    -- Re-throw the original error to alert the deployment pipeline
    THROW;
END CATCH;
GO
