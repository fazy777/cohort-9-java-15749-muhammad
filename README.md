# 📇 Contact Management System (CMS)

[![GitHub License](https://img.shields.io/github/license/fazy777/cohort-9-dotnet-12574-muhammad?color=blue)](https://github.com/fazy777/cohort-9-dotnet-12574-muhammad/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/fazy777/cohort-9-dotnet-12574-muhammad?color=red)](https://github.com/fazy777/cohort-9-dotnet-12574-muhammad/issues)
[![SonarQube Quality Gate](https://img.shields.io/badge/SonarQube-Passed-brightgreen?style=flat&logo=sonarqube)](#code-quality--sonarqube-integration)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/fazy777/cohort-9-dotnet-12574-muhammad/pulls)

A modern, secure, and responsive full-stack **Contact Management System** built to enable users to organize, manage, and track their contacts efficiently. This repository is developed for **Cohort 9 — .NET Fullstack (.NET+ReactJS)**, based on the official project specifications.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Technology Stack Mapping](#-technology-stack-mapping)
3. [Key Features](#-key-features)
4. [System Architecture & User Flow](#-system-architecture--user-flow)
5. [Database Schema Design](#-database-schema-design)
6. [Application Screens & Components](#-application-screens--components)
7. [Directory Structure](#-directory-structure)
8. [Getting Started & Installation](#-getting-started--installation)
9. [Code Quality & SonarQube Integration](#-code-quality--sonarqube-integration)
10. [Unit Testing](#-unit-testing)

---

## 🔍 Project Overview

The **Contact Management System (CMS)** is a web-based, full-stack application designed to simplify contact management. Users can securely register accounts, log in, and manage their contact books. The system supports full CRUD operations, pagination, robust searching, profiling, logging, error handling, and file import/export.

### Key Objectives
* **Security First:** Robust authentication with secure credentials storage, session handling, and password reset functionality.
* **Modern UX:** A fluid, single-page React frontend featuring interactive modals, dashboards, and smooth pagination.
* **Code Quality:** Adherence to Clean Architecture, high test coverage, and SonarQube code quality gates.

---

## 🛠️ Technology Stack Mapping

To match the requirements of the **Cohort 9 .NET Fullstack** track, the original Java-based proposal stack has been mapped to its **modern .NET equivalents** for implementation:

| Component | Proposal Stack (Java) | Implementation Stack (.NET) | Badges |
| :--- | :--- | :--- | :--- |
| **Backend Language** | Java (OpenJDK) | C# (.NET 8) | ![C#](https://img.shields.io/badge/C%23-239120?style=flat-square&logo=c-sharp&logoColor=white) ![.NET 8](https://img.shields.io/badge/.NET_8.0-512BD4?style=flat-square&logo=.net&logoColor=white) |
| **Web API Framework** | Spring Boot | ASP.NET Core Web API | ![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-512BD4?style=flat-square&logo=.net&logoColor=white) |
| **Data Access / ORM** | Spring Data JPA / Hibernate | Entity Framework Core (EF Core) | ![EF Core](https://img.shields.io/badge/EF_Core-512BD4?style=flat-square&logo=.net&logoColor=white) |
| **Frontend Framework** | React.js | React.js (Vite / TypeScript) | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) |
| **Database Engine** | SQL Server | Microsoft SQL Server | ![MS SQL Server](https://img.shields.io/badge/MS_SQL_Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white) |
| **Application Logging** | SLF4J / Logback | Serilog | ![Serilog](https://img.shields.io/badge/Serilog-3772FF?style=flat-square&logo=logstash&logoColor=white) |
| **Unit Testing & Mocking** | JUnit & Mockito | xUnit & Moq | ![xUnit](https://img.shields.io/badge/xUnit-25A162?style=flat-square&logo=dotnet&logoColor=white) ![Moq](https://img.shields.io/badge/Moq-gray?style=flat-square) |
| **Code Quality Gate** | SonarQube | SonarQube | ![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=flat-square&logo=sonarqube&logoColor=white) |
| **Version Control** | Git | Git (Branch & Merge) | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) |

---

## 🌟 Key Features

### 🔐 1. User Authentication & Authorization
* **Self-Registration:** Allow new users to sign up using either their email address or phone number.
* **Secure Login:** Session token generation (JWT) to authorize subsequent API requests.
* **Password Management:** Secure password hashing (BCrypt/PBKDF2) and in-app password reset features.

### 📇 2. Contacts Management
* **List Pagination:** Paginated contact fetches on the dashboard to prevent client-side performance degradation.
* **Dynamic Search & Filtering:** Quick search on contact lists by First Name or Last Name.
* **Comprehensive Profiles:** Detailed profile views for contacts, supporting:
  * First Name, Last Name, and Job Title.
  * Multiple Email Addresses (labeled as *Work, Personal, etc.*).
  * Multiple Phone Numbers (labeled as *Work, Home, Mobile, etc.*).
* **Full CRUD Operations:** Modals to create, read detail, update data, and securely delete contacts with confirmation dialogues.

### 📝 3. Logging & Exception Handling
* **Enterprise Logging:** Asynchronous logging of transactions, user sessions, error traces, and DB activities using **Serilog**.
* **Global Error Handling:** Global exception middleware to intercept errors and return clean, user-friendly JSON error messages while hiding internal stack traces.

### 🧪 4. Testing & Code Quality
* **Unit Testing:** Comprehensive test suites using **xUnit** and **Moq** covering Web APIs, Services, and Repositories.
* **SonarQube Analysis:** Automated code scanning for code smells, bugs, security vulnerabilities, and coverage metrics.

### 📤 5. Additional Features (Optional)
* **Import/Export:** Export contact books to CSV/JSON files, and bulk-import contacts from external templates.

---

## 🔄 System Architecture & User Flow

```mermaid
graph TD
    A[Guest / Visitor] -->|Access Web App| B(Login / Registration Screen)
    B -->|Submit Credentials| C{Authentication Success?}
    C -->|No (Show Error)| B
    C -->|Yes (Redirect & Set JWT)| D(Contact Management Screen / Dashboard)
    
    D -->|Click Create Contact| E[Create Contact Modal]
    D -->|Click Update Contact| F[Update Contact Modal]
    D -->|Click Delete Contact| G[Delete Confirmation Modal]
    D -->|Search/Filter Input| H[Filtered Paginated List]
    D -->|Click Profile Icon| I(User Profile Screen)
    
    I -->|Click Change Password| J[Change Password Modal]
    I -->|Click Logout| K[Clear JWT & Session]
    K --> B
```

---

## 🗄️ Database Schema Design

The relational SQL Server database structure designed for this application includes relationships linking users to multiple contacts, and contacts to multiple emails and phones:

```mermaid
erDiagram
    USERS {
        int id PK "Identity"
        string email UNIQUE "Nullable if Phone exists"
        string phone UNIQUE "Nullable if Email exists"
        string password_hash "Hashed"
        string first_name
        string last_name
    }
    CONTACTS {
        int id PK "Identity"
        int user_id FK "References USERS.id"
        string first_name
        string last_name
        string title "Job Title"
    }
    CONTACT_EMAILS {
        int id PK "Identity"
        int contact_id FK "References CONTACTS.id"
        string email_address
        string label "e.g., Work, Personal, Other"
    }
    CONTACT_PHONES {
        int id PK "Identity"
        int contact_id FK "References CONTACTS.id"
        string phone_number
        string label "e.g., Work, Home, Mobile, Private"
    }

    USERS ||--o{ CONTACTS : "manages"
    CONTACTS ||--o{ CONTACT_EMAILS : "has"
    CONTACTS ||--o{ CONTACT_PHONES : "has"
```

---

## 🖥️ Application Screens & Components

### 🔑 1. Login & Registration Screen
* **Components:** `LoginForm`, `RegistrationForm`.
* **Operations:** User sign-up (email/phone), login validation, session initiation, and automatic redirection to the dashboard upon authentication success.

### 📋 2. Contact Management Screen (Dashboard)
* **Components:** Paginated Contact List, Search Bar, Modals for CRUD operations.
* **Modals:**
  * **Modal 1 (Update Contact):** Form prepopulated with existing details. Save changes or cancel.
  * **Modal 2 (Create Contact):** Form for adding a contact with multiple email/phone fields.
  * **Modal 3 (Delete Confirmation):** Safe deletion check to prevent accidental loss of data.
* **Operations:** Page navigation, real-time filtering, list refresh, and modal toggles.

### 👤 3. User Profile Screen
* **Components:** User profile card, password update triggers, and log out tools.
* **Modals:**
  * **Modal 4 (Change Password):** Form validation for old and new passwords.
* **Operations:** Display current user's profile details, reset password triggers, and session cleanup on logout.

---

## 📂 Directory Structure

A clean, modular folder layout following standard full-stack development patterns:

```text
cohort-9-dotnet-12574-muhammad/
├── Project Perposal.png              # Reference project design
├── README.md                         # Detailed project documentation
├── .coderabbit.yaml                  # Automated PR reviewer settings
│
├── backend/                          # Backend API (ASP.NET Core Web API)
│   ├── ContactManagement.API/        # Web API controllers & startup configurations
│   ├── ContactManagement.Core/       # Domain entities, value objects, and service interfaces
│   ├── ContactManagement.Infrastructure/ # DB Context, migrations, repositories, and logging
│   └── ContactManagement.Tests/      # xUnit tests & mocking setups
│
└── frontend/                         # Frontend App (React.js + TS + Tailwind/CSS)
    ├── src/
    │   ├── assets/                   # Theme assets & images
    │   ├── components/               # Shared components (Modals, Forms, Buttons)
    │   ├── context/                  # AuthContext and App State
    │   ├── services/                 # Axios-based HTTP clients for API integration
    │   ├── pages/                    # Main views (Login, Dashboard, Profile)
    │   └── App.tsx                   # Routing and Layout setup
    └── package.json                  # Node.js dependencies
```

---

## 🚀 Getting Started & Installation

### 📋 Prerequisites
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js](https://nodejs.org/) (v18+) & `npm`
* [SQL Server](https://www.microsoft.com/en-us/sql-server/) (Express or Developer Edition)

---

### 💻 Backend Setup (ASP.NET Core)

1. **Navigate to the Backend directory:**
   ```bash
   cd backend
   ```
2. **Update Connection String:**
   Open `appsettings.json` in `ContactManagement.API` and update the connection string to point to your MS SQL Server instance:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=YOUR_SERVER_NAME;Database=ContactDb;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```
3. **Apply Database Migrations:**
   ```bash
   dotnet ef database update --project ContactManagement.Infrastructure --startup-project ContactManagement.API
   ```
4. **Run the Application:**
   ```bash
   dotnet run --project ContactManagement.API
   ```
   The backend API will start running (typically on `https://localhost:7001` or `http://localhost:5001`). You can access Swagger documentation at `https://localhost:7001/swagger`.

---

### ⚛️ Frontend Setup (React)

1. **Navigate to the Frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   Create a `.env` file in the root of the frontend folder:
   ```env
   VITE_API_URL=https://localhost:7001/api
   ```
4. **Run in development mode:**
   ```bash
   npm run dev
   ```
   The client application will spin up at `http://localhost:5173`.

---

## 🔍 Code Quality & SonarQube Integration

To run code quality scans locally using SonarQube:

1. Start your local SonarQube instance.
2. Install the dotnet-sonarscanner global tool:
   ```bash
   dotnet tool install --global dotnet-sonarscanner
   ```
3. Run the scan command:
   ```bash
   dotnet sonarscanner begin /k:"ContactManagementSystem" /d:sonar.host.url="http://localhost:9000" /d:sonar.login="YOUR_TOKEN"
   dotnet build backend/
   dotnet sonarscanner end /d:sonar.login="YOUR_TOKEN"
   ```

---

## 🧪 Unit Testing

Unit tests are written to validate core controllers, DB services, and validators.

Run tests using the command line:
```bash
cd backend
dotnet test
```

---

## 📄 License & Contact

* **Author:** Muhammad Faizan
* **Program:** Cohort 9 — .NET Fullstack (.NET+ReactJS)
* **Company / Organization:** 10Pearls

*This project is licensed under the MIT License - see the LICENSE file for details.*
