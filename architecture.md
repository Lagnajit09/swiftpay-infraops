# SwiftPay System Architecture & Request Flows

This document details the architectural design and request handling patterns of the SwiftPay microservices ecosystem.

## 1. High-Level Architecture

The system follows a BFF (Backend-For-Frontend) pattern where the **Main Service** acts as a gateway and orchestrator for all client requests.

```mermaid
graph TD
    %% Nodes
    Client(["Client (Web/Mobile)"])

    subgraph "BFF Layer"
        MainService["Main Service (API Gateway)"]
    end

    subgraph "Core Services"
        AuthService["Auth Service"]
        TransactionService["Transaction Service"]
        WalletService["Wallet Service"]
        PaymentService["Payment Service"]
    end

    ExternalGateway[("External Payment Gateway<br/>(Bank/UPI)")]

    %% Interactions
    Client ==>|"/api"| MainService
    MainService -->|"/api/auth"| AuthService
    MainService -->|"/api/wallet"| WalletService
    MainService -->|"/api/transaction"| TransactionService

    %% S2S Connections
    TransactionService -->|"Process Payment"| PaymentService
    TransactionService -->|"Update Ledger"| WalletService
    PaymentService -.->|"External Call"| ExternalGateway
```

---

## 2. Request Handling & BFF Orchestration

Every request goes through the **Main Service** (BFF), which handles cross-cutting concerns before proxying to backend services.

### General Request Lifecycle

This sequence diagram demonstrates how a standard authenticated request is processed.

```mermaid
sequenceDiagram
    participant Client
    participant Main as Main Service (BFF)
    participant Auth as Auth Service
    participant Redis as Redis Store
    participant Service as Target Service (e.g., Wallet)

    Note over Client, Main: 1. Request Initiation
    Client->>Main: HTTP Request (Cookie: session_id)

    Note over Main: 2. Gateway Processing
    Main->>Main: Rate Limit Check
    Main->>Main: Input Validation (Zod)

    Note over Main, Auth: 3. Authentication Check
    Main->>Auth: Verify Session (cookie)
    Auth->>Redis: GET session:{id}
    Redis-->>Auth: Refresh Token / User ID
    Auth-->>Main: User ID + Role

    Note over Main, Service: 4. Request Proxying (S2S)
    Main->>Service: Forward Request
    Note right of Main: Headers added:<br/>x-user-id: 123<br/>x-service-id: main-service<br/>x-service-secret: ***

    Note over Service: 5. Business Logic
    Service->>Service: Validate Permissions
    Service->>Service: Process Logic / DB Query
    Service-->>Main: JSON Response

    Note over Main, Client: 6. Response Standardization
    Main->>Main: Format Response Envelope
    Main-->>Client: { success: true, data: ... }
```

---

## 3. Complex Transaction Flows

### 3.1 P2P Transfer Orchestration

Peer-to-Peer transfers require coordination between **Transaction Service** (orchestrator) and **Wallet Service** (ledger).

```mermaid
sequenceDiagram
    autonumber
    actor User as Sender
    participant Main as Main Service
    participant Auth as Auth Service
    participant Txn as Transaction Service
    participant Wallet as Wallet Service
    participant DB as Database

    User->>Main: POST /api/transaction/p2p

    %% Authentication Check
    Main->>Auth: Verify Session Header
    Auth-->>Main: User Context (ID, Role)

    %% Orchestration Start
    Main->>Txn: Proxy Request
    Note right of Main: headers: x-user-id, x-service-id

    Txn->>Txn: Create Transaction Record (PENDING)

    %% S2S Call to Wallet
    Txn->>Wallet: POST /api/wallet/p2p
    Note right of Txn: payload: { sender, recipient, amount }

    %% Atomic Wallet Operation
    activate Wallet
    Wallet->>DB: Start Transaction
    Wallet->>DB: Check Sender Balance (SELECT FOR UPDATE)
    Wallet->>DB: Debit Sender Wallet
    Wallet->>DB: Credit Recipient Wallet
    Wallet->>DB: Create Ledger Entries
    Wallet->>DB: Commit Transaction
    Wallet-->>Txn: Success { ledgerEntryIds }
    deactivate Wallet

    %% Finalize
    Txn->>Txn: Update Transaction Status (SUCCESS)
    Txn-->>Main: Transaction Complete
    Main-->>User: 200 OK (Transfer Successful)
```

### 3.2 On-Ramp (Deposit) Flow

Deposits involve the **Payment Service** for gateway interaction and **Wallet Service** for crediting funds.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Main as Main Service
    participant Auth as Auth Service
    participant Txn as Transaction Service
    participant Pay as Payment Service
    participant Bank as External Gateway
    participant Wallet as Wallet Service

    User->>Main: POST /api/transaction/add-money

    %% Authentication
    Main->>Auth: Verify Session Header
    Auth-->>Main: User Context (ID, Role)

    Main->>Txn: Input Forwarding
    Note right of Main: headers: x-user-id, x-service-id

    %% Step 1: Process Payment
    Txn->>Pay: POST /api/payment/on-ramp

    activate Pay
    Pay->>Pay: Create Payment Record
    Pay->>Bank: Charge Request (API Call)
    Bank-->>Pay: Payment Success
    Pay->>Pay: Update Status: SUCCESS
    Pay-->>Txn: Return Payment Details
    deactivate Pay

    %% Step 2: Credit Wallet
    Txn->>Wallet: POST /api/wallet/credit
    Note right of Txn: headers: x-service-id: transaction-service

    activate Wallet
    Wallet->>Wallet: Idempotency Check
    Wallet->>Wallet: Update Balance (+Amount)
    Wallet-->>Txn: Wallet Updated
    deactivate Wallet

    %% Finalize
    Txn->>Txn: Mark Transaction SUCCESS
    Txn-->>Main: Success Response
    Main-->>User: Money Added Successfully
```

## 4. Service-to-Service (S2S) Security

Communication between services is secured using internal headers:

- **`x-service-id`**: Identifies the calling service (e.g., `main-service`, `transaction-service`).
- **`x-service-secret`**: A shared secret key to verify the caller's identity.
- **`x-user-id`**: Propagates the authenticated user's ID context downstream.

This ensures that only authorized microservices can invoke internal APIs (like `wallet-service` operations), preventing direct unauthorized access.
