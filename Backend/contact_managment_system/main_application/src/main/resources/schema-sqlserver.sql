-- ============================================================================
-- Contact Management System (CMS)
-- Microsoft SQL Server Deployable Migration Script (Non-Destructive & Versioned)
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Ensure Database exists (if run at server level)
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'ContactDB')
BEGIN
    CREATE DATABASE ContactDB;
END
GO

USE ContactDB;
GO

-- ============================================================================
-- Schema Version Tracking Table
-- Tracks applied schema version migrations safely
-- ============================================================================
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.schema_migrations', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.schema_migrations (
            version NVARCHAR(50) NOT NULL CONSTRAINT PK_schema_migrations PRIMARY KEY,
            description NVARCHAR(255) NOT NULL,
            installed_on DATETIME2 NOT NULL CONSTRAINT DF_schema_migrations_installed_on DEFAULT (SYSUTCDATETIME()),
            execution_time_ms BIGINT NOT NULL,
            success BIT NOT NULL
        );
    END

    COMMIT TRANSACTION;
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

-- ============================================================================
-- Migration V1.0.0: Initial Relational Schema
-- Preserves existing data, creates missing objects idempotently, handles errors safely.
-- ============================================================================
BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @MigrationVersion NVARCHAR(50) = N'1.0.0';
    DECLARE @StartTime DATETIME2 = SYSUTCDATETIME();

    IF NOT EXISTS (SELECT 1 FROM dbo.schema_migrations WHERE version = @MigrationVersion AND success = 1)
    BEGIN
        -- 1. Table: users
        IF OBJECT_ID(N'dbo.users', N'U') IS NULL
        BEGIN
            CREATE TABLE dbo.users (
                id BIGINT IDENTITY(1,1) NOT NULL,
                first_name NVARCHAR(100) NOT NULL,
                last_name NVARCHAR(100) NOT NULL,
                email NVARCHAR(150) NULL,
                phone NVARCHAR(30) NULL,
                password NVARCHAR(255) NOT NULL,
                token_version BIGINT NOT NULL CONSTRAINT DF_users_token_version DEFAULT (1),
                version BIGINT NULL,
                created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME()),
                updated_at DATETIME2 NULL,
                CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id ASC),
                CONSTRAINT CK_users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
            );
        END

        -- Filtered Unique Indexes for users table
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_users_email' AND object_id = OBJECT_ID(N'dbo.users'))
        BEGIN
            CREATE UNIQUE NONCLUSTERED INDEX UQ_users_email
            ON dbo.users (email ASC)
            WHERE email IS NOT NULL;
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_users_phone' AND object_id = OBJECT_ID(N'dbo.users'))
        BEGIN
            CREATE UNIQUE NONCLUSTERED INDEX UQ_users_phone
            ON dbo.users (phone ASC)
            WHERE phone IS NOT NULL;
        END

        -- 2. Table: contacts
        IF OBJECT_ID(N'dbo.contacts', N'U') IS NULL
        BEGIN
            CREATE TABLE dbo.contacts (
                id BIGINT IDENTITY(1,1) NOT NULL,
                user_id BIGINT NOT NULL,
                first_name NVARCHAR(100) NOT NULL,
                last_name NVARCHAR(100) NOT NULL,
                title NVARCHAR(100) NULL,
                notes NVARCHAR(500) NULL,
                created_at DATETIME2 NOT NULL CONSTRAINT DF_contacts_created_at DEFAULT (SYSUTCDATETIME()),
                updated_at DATETIME2 NULL,
                CONSTRAINT PK_contacts PRIMARY KEY CLUSTERED (id ASC),
                CONSTRAINT FK_contacts_users FOREIGN KEY (user_id) 
                    REFERENCES dbo.users (id) 
                    ON DELETE CASCADE
            );
        END

        -- Indexes for contacts table
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_contacts_user_id' AND object_id = OBJECT_ID(N'dbo.contacts'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_contacts_user_id 
            ON dbo.contacts (user_id ASC);
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_contacts_user_search' AND object_id = OBJECT_ID(N'dbo.contacts'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_contacts_user_search 
            ON dbo.contacts (user_id ASC, first_name ASC, last_name ASC);
        END

        -- 3. Table: contact_emails
        IF OBJECT_ID(N'dbo.contact_emails', N'U') IS NULL
        BEGIN
            CREATE TABLE dbo.contact_emails (
                id BIGINT IDENTITY(1,1) NOT NULL,
                contact_id BIGINT NOT NULL,
                email NVARCHAR(150) NOT NULL,
                label NVARCHAR(50) NOT NULL CONSTRAINT DF_contact_emails_label DEFAULT (N'WORK'),
                CONSTRAINT PK_contact_emails PRIMARY KEY CLUSTERED (id ASC),
                CONSTRAINT FK_contact_emails_contacts FOREIGN KEY (contact_id) 
                    REFERENCES dbo.contacts (id) 
                    ON DELETE CASCADE
            );
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_contact_emails_contact_id' AND object_id = OBJECT_ID(N'dbo.contact_emails'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_contact_emails_contact_id 
            ON dbo.contact_emails (contact_id ASC);
        END

        -- 4. Table: contact_phones
        IF OBJECT_ID(N'dbo.contact_phones', N'U') IS NULL
        BEGIN
            CREATE TABLE dbo.contact_phones (
                id BIGINT IDENTITY(1,1) NOT NULL,
                contact_id BIGINT NOT NULL,
                phone_number NVARCHAR(30) NOT NULL,
                label NVARCHAR(50) NOT NULL CONSTRAINT DF_contact_phones_label DEFAULT (N'WORK'),
                CONSTRAINT PK_contact_phones PRIMARY KEY CLUSTERED (id ASC),
                CONSTRAINT FK_contact_phones_contacts FOREIGN KEY (contact_id) 
                    REFERENCES dbo.contacts (id) 
                    ON DELETE CASCADE
            );
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_contact_phones_contact_id' AND object_id = OBJECT_ID(N'dbo.contact_phones'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_contact_phones_contact_id 
            ON dbo.contact_phones (contact_id ASC);
        END

        -- Record migration execution
        DECLARE @DurationMs BIGINT = DATEDIFF(MILLISECOND, @StartTime, SYSUTCDATETIME());
        INSERT INTO dbo.schema_migrations (version, description, installed_on, execution_time_ms, success)
        VALUES (@MigrationVersion, N'Initial Relational Schema (Users, Contacts, Emails, Phones)', SYSUTCDATETIME(), @DurationMs, 1);
    END

    COMMIT TRANSACTION;
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
