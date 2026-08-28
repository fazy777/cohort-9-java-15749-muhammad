-- ============================================================================
-- Contact Management System (CMS)
-- Microsoft SQL Server Database Schema Definition
-- ============================================================================

-- Create Database if it does not exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'ContactDB')
BEGIN
    CREATE DATABASE ContactDB;
END
GO

USE ContactDB;
GO

-- ============================================================================
-- Table: users
-- Stores registered user accounts with credentials, phone/email, and token version
-- ============================================================================
IF OBJECT_ID(N'dbo.contact_phones', N'U') IS NOT NULL DROP TABLE dbo.contact_phones;
IF OBJECT_ID(N'dbo.contact_emails', N'U') IS NOT NULL DROP TABLE dbo.contact_emails;
IF OBJECT_ID(N'dbo.contacts', N'U') IS NOT NULL DROP TABLE dbo.contacts;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL DROP TABLE dbo.users;
GO

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
GO

-- Filtered Unique Indexes to allow nullable unique fields in SQL Server
CREATE UNIQUE NONCLUSTERED INDEX UQ_users_email
ON dbo.users (email ASC)
WHERE email IS NOT NULL;
GO

CREATE UNIQUE NONCLUSTERED INDEX UQ_users_phone
ON dbo.users (phone ASC)
WHERE phone IS NOT NULL;
GO

-- ============================================================================
-- Table: contacts
-- Stores individual contacts owned by a user
-- ============================================================================
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
GO

-- Indexes for efficient pagination and user-scoped contact filtering
CREATE NONCLUSTERED INDEX IX_contacts_user_id 
ON dbo.contacts (user_id ASC);
GO

CREATE NONCLUSTERED INDEX IX_contacts_user_search 
ON dbo.contacts (user_id ASC, first_name ASC, last_name ASC);
GO

-- ============================================================================
-- Table: contact_emails
-- Stores labeled email addresses (Work, Personal, Other) for each contact
-- ============================================================================
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
GO

CREATE NONCLUSTERED INDEX IX_contact_emails_contact_id 
ON dbo.contact_emails (contact_id ASC);
GO

-- ============================================================================
-- Table: contact_phones
-- Stores labeled phone numbers (Work, Home, Mobile, etc.) for each contact
-- ============================================================================
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
GO

CREATE NONCLUSTERED INDEX IX_contact_phones_contact_id 
ON dbo.contact_phones (contact_id ASC);
GO
