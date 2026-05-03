# Backend Data Schema & Integration Guide

This document contains the data structures and business logic discovered from the Front-End code to ensure naming consistency between FE and BE.

## 1. Core Data Structures

### A. Sales & Transactions (`transactions`)
Captured during the checkout process in `Transactions.tsx`.

| FE Field Name | BE Field Name (Suggested) | Type | Description |
|:---|:---|:---|:---|
| `id` | `transaction_id` | String (PK) | Unique ID (e.g., TRX-1714654321) |
| `cashier` | `cashier_id` | UUID (FK) | Reference to `users.id` |
| `memberId` | `member_id` | UUID (FK, Null) | Reference to `members.id` |
| `orderType` | `order_type` | Enum | `dine-in`, `take-away`, `delivery` |
| `tableNumber` | `table_number` | String (Null) | Table identifier |
| `deliveryPlatform` | `delivery_platform`| String (Null) | GoFood, GrabFood, etc. |
| `paymentMethod` | `payment_method` | Enum | `CASH`, `QRIS` |
| `subtotal` | `subtotal` | Decimal | Total before discount & tax |
| `memberDiscount` | `discount_amount` | Decimal | Calculated discount (FE: 5%) |
| `tax` | `tax_amount` | Decimal | Calculated tax (FE: 10% PB1) |
| `total` | `total_amount` | Decimal | Final payable amount |
| `received` | `received_amount` | Decimal | Cash received from customer |
| `change` | `change_amount` | Decimal | Change given back |
| `items` | (Relation) | Array | Linked to `transaction_items` |

### B. Shift Management (`shifts`)
Manages cash drawer reconciliation.

| FE Field Name | BE Field Name | Type | Description |
|:---|:---|:---|:---|
| `id` | `shift_id` | String (PK) | e.g., SH-1714654321 |
| `cashierName` | `user_id` | UUID (FK) | Reference to the user |
| `startTime` | `start_time` | DateTime | When shift opened |
| `endTime` | `end_time` | DateTime (Null) | When shift closed |
| `initialCash` | `initial_cash` | Decimal | Opening drawer balance |
| `finalCash` | `final_cash` | Decimal | Actual physical cash counted |
| `expectedCash` | `expected_cash` | Decimal | `initial_cash` + cash sales |
| `status` | `status` | Enum | `open`, `closed` |

### C. Inventory & Products
Used for stock deduction logic.

**Product Table:**
- `id`: Unique ID (e.g., p-1)
- `name`: Product name
- `category`: Coffee, Bakery, etc.
- `sellingPrice`: Current price
- `hpp`: Cost of Goods Sold (Total of ingredients + labor + overhead)
- `emoji`: Visual icon for FE

**Ingredient Table:**
- `id`: Unique ID (e.g., ing-1)
- `name`: Ingredient name
- `unit`: gr, ml, pcs
- `stock`: Current quantity
- `minStock`: Reorder point
- `avgCost`: Unit price for HPP calculation

**Recipe Table (Pivot):**
- `product_id` (FK)
- `ingredient_id` (FK)
- `quantity`: Amount used per product unit

---

## 2. Synchronization & Authority Model

To ensure consistency, we use a **Manager-Centric Authority** model:
- **Master Data (Downstream)**: `Products`, `Ingredients`, `Recipes`, and `Users` are created/edited in the **Central PostgreSQL (Manager)**. Outlets pull this data.
- **Operational Data (Upstream)**: `Transactions`, `Shifts`, and `Audit Logs` are created in **Local SQLite (Outlet)** and pushed to Central.

### A. Sync Metadata Fields
Every table must include these fields for synchronization:

| Field | Type | Description |
|:---|:---|:---|
| `outlet_id` | UUID | Identifies the branch. |
| `updated_at` | Timestamp | Latest modification time. |
| `is_synced` | Boolean | (SQLite only) `true` if local change is pushed to central. |

---

## 3. Database Schema (SQL - Authority Focused)

```sql
-- MASTER DATA: Managed at Central, Read at Local
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    outlet_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE units (
    id VARCHAR(20) PRIMARY KEY, -- pcs, gr, ml, box
    name VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    outlet_id UUID NOT NULL,
    category_id VARCHAR(50) REFERENCES categories(id),
    unit_id VARCHAR(20) REFERENCES units(id),
    name VARCHAR(100) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    hpp DECIMAL(12,2),
    emoji VARCHAR(10),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
    product_id VARCHAR(50) REFERENCES products(id),
    ingredient_id VARCHAR(50) REFERENCES ingredients(id),
    quantity DECIMAL(12,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, ingredient_id)
);

-- OPERATIONAL DATA: Created at Local, Synced to Central
CREATE TABLE stock_logs (
    id SERIAL PRIMARY KEY,
    outlet_id UUID NOT NULL,
    ingredient_id VARCHAR(50) REFERENCES ingredients(id),
    change_amount DECIMAL(12,2) NOT NULL, -- positive for restock, negative for sales
    type VARCHAR(20), -- 'SALE', 'ADJUSTMENT', 'RESTOCK', 'OPNAME'
    reference_id VARCHAR(50), -- Transaction ID or Opname ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER MANAGEMENT: Mandatory Feature support
CREATE TABLE roles (
    id VARCHAR(20) PRIMARY KEY, -- admin, manager, cashier
    permissions JSONB, -- List of allowed feature IDs
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY,
    outlet_id UUID NOT NULL,
    cashier_id UUID,
    member_id UUID,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_synced BOOLEAN DEFAULT FALSE -- SQLite only
);
```

---

## 4. API Contract (The Sync Agent Flow)

### A. Step 1: Pull Master Data (Central -> Local)
Outlet fetches updates for products, categories, units, and roles.
**Endpoint:** `GET /sync/pull?last_sync=TIMESTAMP`

**Response:**
```json
{
  "categories": [...],
  "units": [...],
  "products": [...],
  "ingredients": [...],
  "recipes": [...],
  "roles": [...],
  "server_time": "2024-05-03T12:00:00Z"
}
```

### B. Step 2: Push Transactions (Local -> Central)
Outlet sends new sales to the manager.
**Endpoint:** `POST /sync/push`

**Request Body:**
```json
{
  "outlet_id": "UUID",
  "transactions": [
    {
      "id": "TRX-101",
      "total_amount": 50000,
      "items": [...]
    }
  ]
}
```

---

## 5. Technical Compatibility (FE-BE Alignment)

To ensure the Backend works with the existing Front-End without modifying FE code, follow these rules:

### A. Naming Convention
- **API Payloads**: Must use **camelCase** (e.g., `sellingPrice`, `orderType`, `totalAmount`) to match React components.
- **Database Columns**: Use **snake_case** (e.g., `selling_price`, `order_type`) as per SQL standards.
- *Transformation layer (DTO) is required in BE to map between these two.*

### B. Authentication & Context
- **JWT Payload**: Should contain `userId`, `role`, and `outletId`.
- **Response Format**: The Login response must match the FE `User` interface:
  ```json
  {
    "user": {
      "id": "UUID",
      "name": "Ahmad Barista",
      "role": "cashier",
      "outletId": "UUID"
    },
    "token": "EYJ..."
  }
  ```

### C. Audit Logs Endpoint
The FE calls `addAuditLog` frequently. BE must provide:
- **Endpoint**: `POST /audit-logs`
- **Request**: `{ "action": string, "details": string, "type": "access" | "create" | "update" | "delete" }`

---

## 6. Recommended Technology Stack (TypeScript)

### A. Central Backend (Manager)
- **Runtime**: Node.js or Bun
- **Framework**: Express.js or Hono (High performance)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma (Excellent for complex relations) or Drizzle (Lightweight/Performant)
- **Documentation**: Swagger/Zod (For type-safe API)

### B. Local Backend (Cashier Outlet)
- **Runtime**: Node.js (can run on cheap hardware like Raspberry Pi or Mini PC)
- **Database**: SQLite
- **ORM**: Same as Central (Prisma/Drizzle both support SQLite)
- **Sync Logic**: `node-cron` or `bullmq` for background sync tasks.

---

## 7. Implementation Roadmap (Phased Order)

To ensure a logical progression where each component has its dependencies met, the backend should be implemented in this order:

### Phase 1: Central Foundation & Auth (Source of Truth) - [COMPLETED]
*   **Central DB Setup**: Initialized PostgreSQL with `drizzle-orm`. Tables: `users`, `roles`, `categories`, `products`, `units`.
*   **DTO Transformation Layer**: Implemented `toCamel` and `toSnake` utilities in `backend/shared/utils.ts`.
*   **Authentication**: Implemented `POST /auth/login` with JWT. Payload: `userId`, `role`, `outletId`.
*   **Seeding**: Created `backend/central/seed.ts` for initial setup.

**To Run & Test:**
```bash
# 1. Push schema to DB
npm run central:push
# 2. Seed initial data (Admin: admin@kasir.com / admin123)
npm run central:seed
# 3. Start dev server
npm run central:dev
```

### Phase 2: Master Data Management (Manager App) - [COMPLETED]
*   **CRUD APIs**: Built Central endpoints for Products, Categories, Units, Ingredients, and Recipes.
*   **Audit Logs**: Implemented `POST /audit-logs` with automatic `outletId` and `userId` tracking.
*   **Authorization**: Added role-based access control (RBAC) middleware.
*   **Schema Relations**: Integrated Drizzle relations for efficient master data retrieval.

### Phase 3: Local Operational Core (Cashier App) - [COMPLETED]
*   **Local DB Setup**: Initialized SQLite with `better-sqlite3`. Tables mirrored for offline operation.
*   **Checkout Logic**: Implemented atomic transaction saving and automatic stock deduction based on recipes.
*   **Shift Management**: Built logic for opening/closing shifts and tracking cash.
*   **Stock Logging**: Automated `SALE` type logging in `stock_logs` for every transaction.

### Phase 4: Synchronization Engine (The Bridge) - [COMPLETED]
*   **Pull Agent (Downstream)**: Endpoint `GET /sync/pull` at Central and the background agent at Local for Master Data.
*   **Push Agent (Upstream)**: Local logic to identify unsynced records and the `POST /sync/push` endpoint at Central.
*   **Data Integrity**: Implemented transactional upserts and UUID validation for cross-platform consistency.
*   **Conflict Handling**: Basic "Last Write Wins" logic implemented via `onConflictDoUpdate`.

### Phase 5: Reporting & Analytics - [COMPLETED]
*   **Sales Summary**: Implemented aggregation API grouped by `outletId`.
*   **Inventory Alerts**: Built "Low Stock" identification logic.
*   **Global History**: Centralized view of transactions from all outlets.
*   **Access Control**: Secured reporting APIs with `admin`/`manager` role requirements.

---

## 8. Final Implementation Notes

1. **Manager Authority**: All "Create/Update" operations for Products/Categories only exist on Central BE.
2. **Local Sync Agent**: A background process in Local BE that:
   - Performs `GET /sync/pull` every 15-30 mins.
   - Performs `POST /sync/push` immediately after a transaction (if online) or every 5 mins.
3. **Paging**: Implement limit/offset for transaction history pages to prevent large data transfers.
