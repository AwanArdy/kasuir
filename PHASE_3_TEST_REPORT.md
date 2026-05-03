# Phase 3 Test Report: Local Operational Core

This document records the testing process and results for Phase 3 of the Kasir Backend implementation.

## 1. Local Environment Setup
- **Database**: SQLite (`better-sqlite3`).
- **ORM**: Drizzle ORM (SQLite Core).
- **Architecture**: Standalone Local Backend capable of offline operations.

## 2. Master Data Localization
Verified that local copies of Master Data tables (`categories`, `products`, `ingredients`, `recipes`) are correctly initialized and can be populated.
- **Result**: Tables successfully created and seeded with test data.

## 3. Operational Logic Verification

### A. Shift Management
- **Test**: Open a new shift with `initialCash`.
- **Result**: Shift entry created with status `open` and correct timestamps.

### B. Checkout & Stock Deduction
- **Test**: Perform checkout for a product ("Caffe Latte") that uses "Coffee Beans" (18gr/latte).
- **Initial Stock**: 1000gr.
- **Transaction**: 1 unit sold.
- **Calculated Deduction**: 18gr.
- **Final Stock**: 982gr.
- **Result**: **SUCCESS**.
    - Transaction saved to `transactions` and `transaction_items`.
    - Ingredient stock automatically updated in `ingredients`.
    - Stock change logged in `stock_logs` with type `SALE`.

## 4. Summary of Findings
- **Offline Capability**: The system correctly performs business logic (stock deduction) locally without needing Central BE.
- **Data Integrity**: Transactions and stock changes are wrapped in atomic database transactions.
- **Compliance**: The implementation is fully aligned with the technical requirements in `BACKEND_DATA_SCHEMA.md`.

**Conclusion**: Phase 3 is stable. The Local Operational Core is fully functional and ready for Phase 4 (Synchronization).
