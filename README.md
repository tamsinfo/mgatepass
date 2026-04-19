# Material Gatepass Management System

A full-lifecycle material gatepass solution for manufacturing and industrial facilities. Manages the end-to-end flow of materials entering or leaving premises — from gatepass creation and multi-level approval through weighbridge recording and gate exit.

## Overview

The system digitises the traditionally paper-based gatepass process, providing real-time visibility into material movements, enforcing approval workflows, and maintaining a complete audit trail for compliance.

### Key Capabilities

- **Gatepass Creation** — Supports inward/outward passes with returnable, non-returnable, and against-RGP types
- **Configurable Approval Workflows** — Rule-based approval routing per process type and gatepass type
- **Weighbridge Integration** — Entry and exit weight capture with net weight calculation
- **Gate Operations** — Entry and exit gate tracking with configurable gate assignments
- **Audit Trail** — Full history of every status transition, approval, and action
- **Print Slips** — Formatted gatepass slips with QR codes, company branding, and all relevant details
- **Role-Based Access** — Separate interfaces for gate operators, approvers, weighbridge operators, and administrators

### Applications

| App | Purpose |
|-----|---------|
| Entry | Create and manage gatepasses, send for approval or finalise directly |
| Approval | Review, approve or reject pending gatepasses |
| Weighbridge | Record entry and exit weights for passes requiring weighbridge |
| Gate Exit | Assign exit gates and perform gate exit |
| Config | Manage gates, vehicle types, approval rules, and system settings |

## Tech Stack

- **Backend:** SAP Cloud Application Programming Model (CAP) with Node.js and TypeScript
- **Frontend:** SAPUI5 with TypeScript
- **Database:** SAP HANA Cloud
- **Deployment:** SAP BTP Cloud Foundry
- **SAP Integration:** Purchase Orders, Billing Documents, Material Documents via OData

## Project Structure

```
db/             CDS data model and schema definitions
srv/            CAP service definitions, handlers, and business logic
srv/external/   External SAP service definitions (OData)
srv/templates/  Handlebars templates (print slips)
app/            SAPUI5 frontend applications
  entry-app/      Gatepass creation and management
  approval-app/   Approval workflow
  weighbridge-app/ Weight recording
  exit-app/       Gate exit operations
  config-app/     System configuration
```

## License

This is proprietary software. The source code is publicly visible for transparency purposes only.

**You may not** fork, copy, modify, distribute, or use this software — in whole or in part — without a written licence agreement from [TAMS Infotech](https://github.com/tamsinfo).

See [LICENSE](LICENSE) for full terms.
