# Contact Management System (CMS)

[![GitHub License](https://img.shields.io/github/license/fazy777/cohort-9-java-15749-muhammad?color=blue)](https://github.com/fazy777/cohort-9-java-15749-muhammad/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/fazy777/cohort-9-java-15749-muhammad?color=red)](https://github.com/fazy777/cohort-9-java-15749-muhammad/issues)
[![SonarQube Quality Gate](https://img.shields.io/badge/SonarQube-Quality%20Gate-4E9BCD?style=flat&logo=sonarqube)](#code-quality--sonarqube-integration)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/fazy777/cohort-9-java-15749-muhammad/pulls)

A modern, secure, and responsive full-stack **Contact Management System** built using Java Spring Boot and React technology stack.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Key Features](#key-features)
4. [System Architecture & User Flow](#system-architecture--user-flow)
5. [Database Schema Design](#database-schema-design)
6. [Application Screens & Components](#application-screens--components)
7. [Directory Structure](#directory-structure)
8. [Getting Started & Installation](#getting-started--installation)
9. [Code Quality & SonarQube Integration](#code-quality--sonarqube-integration)
10. [Unit Testing](#unit-testing)

---

## Project Overview

The **Contact Management System (CMS)** is a web-based, full-stack application designed to simplify contact management. Users can securely register accounts, log in, and manage their contact books. The system supports full CRUD operations, pagination, robust searching, profiling, logging, error handling, and file import/export.

### Key Objectives
* **Security First:** Robust authentication with secure credentials storage, session handling, token versioning for instant revocation upon password change, and BCrypt hashing.
* **Modern UX:** A fluid, single-page React frontend featuring interactive modals, dashboards, and smooth pagination.
* **Code Quality:** Clean Java package architecture, high unit test coverage, and SonarQube code quality gates.

---

## Technology Stack

The application is implemented strictly using the proposed technologies and tools:

| Component | Technology | Badges |
| :--- | :--- | :--- |
| **Backend Language** | Java (OpenJDK 21) | ![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white) |
| **Backend Framework** | Spring Boot 3 | ![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=spring-boot&logoColor=white) |
| **Data Access / ORM** | Spring Data JPA / Hibernate | ![Hibernate](https://img.shields.io/badge/Hibernate-59666C?style=flat-square&logo=hibernate&logoColor=white) |
| **Frontend Framework** | React.js 19 + Vite 8 | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) |
| **Database Engine** | SQL Server (Prod) / H2 (Dev & Tests) | ![MS SQL Server](https://img.shields.io/badge/MS_SQL_Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white) |
| **Application Logging** | SLF4J / Logback | ![SLF4J](https://img.shields.io/badge/SLF4J-gray?style=flat-square) ![Logback](https://img.shields.io/badge/Logback-gray?style=flat-square) |
| **Unit Testing & Mocking** | JUnit 5 & Mockito | ![JUnit](https://img.shields.io/badge/JUnit5-25A162?style=flat-square&logo=junit5&logoColor=white) ![Mockito](https://img.shields.io/badge/Mockito-gray?style=flat-square) |
| **Code Quality Gate** | SonarQube | ![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=flat-square&logo=sonarqube&logoColor=white) |
| **Version Control** | Git | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) |

---

## Key Features

### 1. User Authentication & Authorization
* **Self-Registration:** Allow new users to sign up using either their email address or phone number.
* **Secure Cookie Authentication:** Issues `HttpOnly`, `Secure`, and `SameSite=Lax` JWT authentication cookies, protecting sessions against XSS token exfiltration.
* **CSRF Defense:** Double-Submit Cookie CSRF protection (`XSRF-TOKEN` / `X-XSRF-TOKEN`) for all mutating API requests.
* **Token Invalidation:** User token versioning invalidates old JWTs immediately upon password reset.
* **Password Management:** Secure password hashing (BCrypt) and in-app password change features.

### 2. Contacts Management
* **List Pagination & Sorting:** Paginated contact fetches with validated sort parameters.
* **Dynamic Search & Filtering:** Quick search on contact lists across first name, last name, title, email, and phone.
* **Comprehensive Profiles:** Detailed profile views for contacts, supporting:
  * First Name, Last Name, and Job Title.
  * Multiple Email Addresses (labeled as *Work, Personal, etc.*).
  * Multiple Phone Numbers (labeled as *Work, Home, Mobile, etc.*).
* **Full CRUD Operations:** Modals to create, read detail, update data, and securely delete contacts with confirmation dialogues.

### 3. Logging & Exception Handling
* **Enterprise Logging:** Structured logging using **SLF4J** & **Logback** with finite history retention and total size caps.
* **Global Exception Handling:** Global Exception Handler (`@RestControllerAdvice`) returning standardized `ErrorResponse` while masking internal server details.

### 4. Testing & Code Quality
* **Unit Testing:** Comprehensive test suites using **JUnit 5** and **Mockito** covering Controllers, Services, and Repositories.
* **SonarQube Analysis:** Automated code scanning for code smells, bugs, security vulnerabilities, and coverage metrics.

### 5. Additional Features
* **Import/Export:** Export contact books to RFC 4180-compliant CSV (with formula injection defense) and JSON files, and bulk-import contacts.

---

## System Architecture & User Flow

```mermaid
graph TD
    A[Guest / Visitor] -->|Access Web App| B(Login / Registration Screen)
    B -->|Submit Credentials| C{Authentication Success?}
    C -->|No (Show Error)| B
    C -->|Yes (Set HttpOnly Cookie & Redirect)| D(Contact Management Screen / Dashboard)
    
    D -->|Click Create Contact| E[Create Contact Modal]
    D -->|Click Update Contact| F[Update Contact Modal]
    D -->|Click Delete Contact| G[Delete Confirmation Modal]
    D -->|Search/Filter Input| H[Filtered Paginated List]
    D -->|Click Profile Icon| I(User Profile Screen)
    
    I -->|Click Change Password| J[Change Password Modal]
    I -->|Click Logout| K[Clear HttpOnly Cookie & Session]
    K --> B
```

---

## Database Schema Design

The relational SQL Server database structure designed for this application includes relationships linking users to multiple contacts, and contacts to multiple emails and phones:

```mermaid
erDiagram
    USERS {
        int id PK "Identity"
        string email UNIQUE "Nullable if Phone exists"
        string phone UNIQUE "Nullable if Email exists"
        string password_hash "BCrypt"
        string first_name
        string last_name
        int token_version "Token invalidation tracker"
    }
    CONTACTS {
        int id PK "Identity"
        int user_id FK "References USERS.id"
        string first_name
        string last_name
        string title "Job Title"
        string notes "Notes"
    }
    CONTACT_EMAILS {
        int id PK "Identity"
        int contact_id FK "References CONTACTS.id"
        string email
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

## Application Screens & Components

### 1. Login & Registration Screen
* **Components:** `AuthForm` (switching between Login and Sign Up).
* **Operations:** User sign-up (email/phone), login validation, session initiation, and automatic redirection to the dashboard upon authentication success.

### 2. Contact Management Screen (Dashboard)
* **Components:** `ContactTable`, Search & Pagination controls, Action Buttons.
* **Modals:**
  * **ContactFormModal (Create / Update):** Form for creating or editing contacts with dynamic email and phone rows.
  * **ContactDetailModal:** Comprehensive view of all contact details.
  * **DeleteConfirmModal:** Safe deletion confirmation dialogue.
  * **ImportExportModal:** CSV and JSON export and bulk file import.

### 3. User Profile Screen
* **Components:** `UserProfileModal`, `Navbar`.
* **Modals:**
  * **Change Password Modal:** Form validation for current and new passwords with token invalidation.

---

## Directory Structure

A clean, modular folder layout following standard full-stack development patterns:

```text
cohort-9-java-15749-muhammad/
├── Project Perposal.png              # Reference project design
├── README.md                         # Detailed project documentation
├── .coderabbit.yaml                  # Automated PR reviewer settings
│
├── Backend/                          # Backend API (Java + Spring Boot)
│   └── contact_managment_system/
│       └── main_application/
│           ├── src/
│           │   ├── main/
│           │   │   ├── java/com/contact_managment/main_application/ # Controllers, Services, Repositories, Security, Entities, DTOs
│           │   │   └── resources/                                   # application.properties, application-dev.properties, logback-spring.xml
│           │   └── test/                                            # JUnit 5 & Mockito test files
│           ├── pom.xml                                              # Maven dependencies configurations
│           └── mvnw / mvnw.cmd                                      # Maven wrapper
│
└── Frontend/                         # Frontend App (React.js + Vite)
    └── contact_managment_system/
        ├── src/
        │   ├── components/           # UI components (Modals, Forms, Tables, Navbar, Toast)
        │   ├── context/              # AuthContext (Authentication & Session State)
        │   ├── services/             # Fetch-based API client (api.js)
        │   ├── utils/                # Utility helpers (safeStorage)
        │   ├── App.jsx               # Main application container
        │   ├── main.jsx              # React entrypoint & root rendering
        │   └── index.css             # Glassmorphic UI stylesheet
        ├── package.json              # Node.js dependencies & scripts
        └── vite.config.js            # Vite build configuration
```

---

## Getting Started & Installation

### Prerequisites
* [Java Development Kit (JDK) 21 or higher](https://www.oracle.com/java/technologies/downloads/)
* [Maven](https://maven.apache.org/) (or use the included Maven wrapper `mvnw`)
* [Node.js](https://nodejs.org/) (^20.19.0 || ^22.13.0 || >=24) & `npm`
* [SQL Server](https://www.microsoft.com/en-us/sql-server/) (Production) or H2 (included for local development)

---

### Backend Setup (Spring Boot)

1. **Navigate to the Backend directory:**
   ```bash
   cd Backend/contact_managment_system/main_application
   ```

2. **Configure Environment / Properties:**
   For local development, run the application with the `dev` profile to use the in-memory H2 database.
   For production with MS SQL Server, configure the database connection and JWT secret:
   ```properties
   spring.datasource.url=jdbc:sqlserver://YOUR_SERVER_NAME:1433;databaseName=ContactDB;encrypt=true;trustServerCertificate=false
   spring.datasource.username=YOUR_DB_USERNAME
   spring.datasource.password=YOUR_DB_PASSWORD
   jwt.secret=YOUR_SECURE_256BIT_SECRET_KEY
   ```
   *(Note: Set `trustServerCertificate=true` only for isolated local testing if CA certificates are not installed).*

3. **Run the Application:**
   ```bash
   # On Linux/macOS
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

   # On Windows
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   The backend API starts on `http://localhost:8080`.

---

### Frontend Setup (React)

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend/contact_managment_system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (Optional):**
   Copy `.env.example` to `.env` and set `VITE_API_URL` if backend is on a non-default host/port.

4. **Run in development mode:**
   ```bash
   npm run dev
   ```
   The client application will run at `http://localhost:5173`.

---

## Code Quality & SonarQube Integration

> [!IMPORTANT]
> ### 📌 Note for Teacher / Evaluator (Sir Saad)
> **SonarQube Token & CI/CD Analysis Status:**
> * **Reason for Incomplete CI Analysis on PRs:** The SonarQube analysis token (`SONAR_TOKEN`) is configured as a repository secret. By design, GitHub Actions security policies do not expose secrets to `pull_request` workflows originating from forked repositories. Consequently, fork-based pull requests skip SonarQube authentication.
> * **Connection After Merging (Push Events):** Once a pull request is merged, subsequent `push` events to `main`, `master`, or `develop` can utilize a `SONAR_TOKEN` configured in the target repository's **Settings → Secrets and variables → Actions** to execute authenticated scans.
> * **Local & Independent Verification:** The backend is fully tested with high coverage via JUnit 5, Mockito, and JaCoCo (`mvn clean verify`). You can execute the SonarQube analysis locally at any time using the instructions below.
> * **To Enable in CI/CD:** If required, add `SONAR_TOKEN` and `SONAR_HOST_URL` to the target repository's **Settings → Secrets and variables → Actions** (`SONAR_HOST_URL` must be configured with `https://` for self-hosted Sonar scans or SonarCloud).

To run code quality scans locally using SonarQube and Maven:

1. Start your local SonarQube server with HTTPS enabled (e.g., `https://localhost:9000` via a local TLS reverse proxy or certificate).
   > [!NOTE]
   > **TLS / HTTPS Certificate Trust:** When connecting via HTTPS with a self-signed certificate or private CA, the certificate must be trusted by the JVM and scanner. You can import the certificate into the JVM truststore (`$JAVA_HOME/lib/security/cacerts`) using `keytool`:
   > ```bash
   > keytool -importcert -alias sonarqube -keystore "$JAVA_HOME/lib/security/cacerts" -file /path/to/server.crt -storepass changeit -noprompt
   > ```
   > or pass the truststore parameters directly via Maven JVM properties (`-Djavax.net.ssl.trustStore=/path/to/truststore.p12 -Djavax.net.ssl.trustStorePassword=changeit`).

2. Export your token and run the Maven goal:
   ```bash
   cd Backend/contact_managment_system/main_application
   export SONAR_TOKEN="YOUR_SONAR_TOKEN"
   ./mvnw clean verify sonar:sonar \
     -Dsonar.projectKey=contact-management-system-backend \
     -Dsonar.host.url=https://localhost:9000
   ```

To run SonarQube scanner for the Frontend (React):
```bash
cd Frontend/contact_managment_system
export SONAR_TOKEN="YOUR_SONAR_TOKEN"
sonar-scanner \
  -Dsonar.projectKey=contact-management-system-frontend \
  -Dsonar.sources=src \
  -Dsonar.host.url=https://localhost:9000
```

> [!NOTE]
> **Frontend Scanner CLI Truststore:** SonarScanner CLI (v5+) includes its own embedded JRE and may not read `$JAVA_HOME/lib/security/cacerts`. When using HTTPS with custom certificates, configure truststore parameters directly via `-Dsonar.scanner.truststorePath=/path/to/truststore.p12 -Dsonar.scanner.truststorePassword=changeit` or via `SONAR_SCANNER_OPTS="-Djavax.net.ssl.trustStore=/path/to/truststore.p12 -Djavax.net.ssl.trustStorePassword=changeit"`.

---

## Unit Testing

Unit tests are written using JUnit 5 and Mockito.

Run tests using the Maven wrapper:
```bash
cd Backend/contact_managment_system/main_application
./mvnw test
```

---

## License & Contact

* **Author:** Muhammad Faizan
* **Company / Organization:** 10Pearls

*This project is licensed under the MIT License - see the LICENSE file for details.*

