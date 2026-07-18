# 📇 Contact Management System (CMS)

[![GitHub License](https://img.shields.io/github/license/fazy777/cohort-9-dotnet-12574-muhammad?color=blue)](https://github.com/fazy777/cohort-9-dotnet-12574-muhammad/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/fazy777/cohort-9-dotnet-12574-muhammad?color=red)](https://github.com/fazy777/cohort-9-dotnet-12574-muhammad/issues)
[![SonarQube Quality Gate](https://img.shields.io/badge/SonarQube-Passed-brightgreen?style=flat&logo=sonarqube)](#code-quality--sonarqube-integration)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/fazy777/cohort-9-dotnet-12574-muhammad/pulls)

A modern, secure, and responsive full-stack **Contact Management System** built using the Java and React technology stacks as defined in the project proposal.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
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
* **Code Quality:** Clean Java package architecture, high unit test coverage, and SonarQube code quality gates.

---

## 🛠️ Technology Stack

The application is implemented strictly using the proposed technologies and tools:

| Component | Technology | Badges |
| :--- | :--- | :--- |
| **Backend Language** | Java (OpenJDK) | ![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white) |
| **Backend Framework** | Spring Boot | ![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=spring-boot&logoColor=white) |
| **Data Access / ORM** | Spring Data JPA / Hibernate | ![Hibernate](https://img.shields.io/badge/Hibernate-59666C?style=flat-square&logo=hibernate&logoColor=white) |
| **Frontend Framework** | React.js | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) |
| **Database Engine** | SQL Server | ![MS SQL Server](https://img.shields.io/badge/MS_SQL_Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white) |
| **Application Logging** | SLF4J / Logback | ![SLF4J](https://img.shields.io/badge/SLF4J-gray?style=flat-square) ![Logback](https://img.shields.io/badge/Logback-gray?style=flat-square) |
| **Unit Testing & Mocking** | JUnit & Mockito | ![JUnit](https://img.shields.io/badge/JUnit5-25A162?style=flat-square&logo=junit5&logoColor=white) ![Mockito](https://img.shields.io/badge/Mockito-gray?style=flat-square) |
| **Code Quality Gate** | SonarQube | ![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=flat-square&logo=sonarqube&logoColor=white) |
| **Version Control** | Git | ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) |

---

## 🌟 Key Features

### 🔐 1. User Authentication & Authorization
* **Self-Registration:** Allow new users to sign up using either their email address or phone number.
* **Secure Login:** Session token generation (JWT/Spring Security) to authorize subsequent API requests.
* **Password Management:** Secure password hashing (BCrypt) and in-app password reset features.

### 📇 2. Contacts Management
* **List Pagination:** Paginated contact fetches on the dashboard to prevent client-side performance degradation.
* **Dynamic Search & Filtering:** Quick search on contact lists by First Name or Last Name.
* **Comprehensive Profiles:** Detailed profile views for contacts, supporting:
  * First Name, Last Name, and Job Title.
  * Multiple Email Addresses (labeled as *Work, Personal, etc.*).
  * Multiple Phone Numbers (labeled as *Work, Home, Mobile, etc.*).
* **Full CRUD Operations:** Modals to create, read detail, update data, and securely delete contacts with confirmation dialogues.

### 📝 3. Logging & Exception Handling
* **Enterprise Logging:** Asynchronous logging of transactions, user sessions, error traces, and DB activities using **SLF4J** & **Logback**.
* **Global Exception Handling:** Global Exception Handler (`@ControllerAdvice` & `@ExceptionHandler`) to intercept errors and return clean, user-friendly JSON error messages while hiding internal stack traces.

### 🧪 4. Testing & Code Quality
* **Unit Testing:** Comprehensive test suites using **JUnit** and **Mockito** covering Controllers, Services, and Repositories.
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
        string password_hash "BCrypt"
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
├── backend/                          # Backend API (Java + Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/cms/ # Java controllers, services, repositories, configurations
│   │   │   └── resources/            # application.properties (configurations)
│   │   └── test/                     # JUnit and Mockito test files
│   ├── pom.xml                       # Maven dependencies configurations
│   └── mvnw                          # Maven wrapper
│
└── frontend/                         # Frontend App (React.js + JS)
    ├── src/
    │   ├── assets/                   # Theme assets & images
    │   ├── components/               # Shared components (Modals, Forms, Buttons)
    │   ├── context/                  # AuthContext and App State
    │   ├── services/                 # Axios-based API services
    │   ├── pages/                    # Main views (Login, Dashboard, Profile)
    │   └── App.jsx                   # Routing and layout setup
    └── package.json                  # Node.js dependencies
```

---

## 🚀 Getting Started & Installation

### 📋 Prerequisites
* [Java Development Kit (JDK) 17 or higher](https://www.oracle.com/java/technologies/downloads/)
* [Maven](https://maven.apache.org/) (or use the included Maven wrapper `mvnw`)
* [Node.js](https://nodejs.org/) (v18+) & `npm`
* [SQL Server](https://www.microsoft.com/en-us/sql-server/) (Express or Developer Edition)

---

### 💻 Backend Setup (Spring Boot)

1. **Navigate to the Backend directory:**
   ```bash
   cd backend
   ```
2. **Update Connection String:**
   Open `src/main/resources/application.properties` (or `application.yml`) and update connection configuration to match your MS SQL Server credentials:
   ```properties
   spring.datasource.url=jdbc:sqlserver://YOUR_SERVER_NAME;databaseName=ContactDb;encrypt=true;trustServerCertificate=true;
   spring.datasource.username=YOUR_DB_USERNAME
   spring.datasource.password=YOUR_DB_PASSWORD
   spring.jpa.hibernate.ddl-auto=update
   ```
3. **Run the Application:**
   Using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend API will start running (typically on `http://localhost:8080`).

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
   REACT_APP_API_URL=http://localhost:8080/api
   ```
4. **Run in development mode:**
   ```bash
   npm start
   ```
   The client application will spin up at `http://localhost:3000`.

---

## 🔍 Code Quality & SonarQube Integration

To run code quality scans locally using SonarQube and Maven:

1. Start your local SonarQube server (typically at `http://localhost:9000`).
2. Run the Maven goal with your token:
   ```bash
   cd backend
   ./mvnw clean verify sonar:sonar \
     -Dsonar.projectKey=ContactManagementSystem \
     -Dsonar.host.url=http://localhost:9000 \
     -Dsonar.login=YOUR_SONAR_TOKEN
   ```

---

## 🧪 Unit Testing

Unit tests are written using JUnit 5 and Mockito.

Run tests using the Maven wrapper:
```bash
cd backend
./mvnw test
```

---

## 📄 License & Contact

* **Author:** Muhammad Faizan
* **Company / Organization:** 10Pearls

*This project is licensed under the MIT License - see the LICENSE file for details.*
