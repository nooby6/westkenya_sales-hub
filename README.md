# West Kenya Sales Hub

A role-based sales and logistics management platform built for field operations, bringing sales, inventory, shipping, delivery tracking, reporting, and operational visibility into one system.

Developed by **Whrite Inc. LTD**.

## What it solves

Sales and distribution teams often work across disconnected spreadsheets, messages, and manual reporting workflows. West Kenya Sales Hub centralizes those workflows so teams can work from the same operational data.

The system is designed around the day-to-day lifecycle of a sale:

**Order → Stock → Dispatch → Delivery → Reporting**

## Core capabilities

### Sales
- Create and manage sales orders
- Track order status
- Validate orders against operational data
- Maintain visibility across sales activity

### Inventory
- Track stock across depots
- Monitor stock movement
- Surface low-stock and overstock conditions
- Connect inventory data to sales and fulfillment workflows

### Shipping & delivery
- Track shipments from dispatch through delivery
- Assign deliveries to drivers
- Maintain driver identification details
- Record vehicle information
- Track delivery status and proof of delivery

### Reporting
- Operational dashboards
- Sales and inventory visualizations
- Shipment and fulfillment metrics
- PDF reports
- Excel-compatible reporting workflows
- Date-based reporting

### Role-based access

The application is structured around operational roles with different access scopes:

| Role | Primary access |
| --- | --- |
| Driver | Assigned deliveries |
| Sales Representative | Orders, stock visibility, delivery scheduling |
| Supervisor | Operational corrections, reporting, user management |
| Manager | Full operational visibility |
| CEO | Complete system access |

Sensitive operations are intended to remain restricted to the roles that need them.

## Technology

The current application is a modern TypeScript frontend backed by Supabase services.

- **Frontend:** React
- **Language:** TypeScript
- **Build:** Vite
- **Backend services / data:** Supabase
- **Database:** PostgreSQL
- **UI:** Tailwind CSS, Radix UI, Lucide
- **Forms & validation:** React Hook Form, Zod
- **Data fetching:** TanStack Query
- **Maps:** Leaflet / React Leaflet
- **Reporting:** jsPDF and AutoTable
- **Testing:** Vitest, Testing Library

## Engineering focus

The project is organized around real operational requirements rather than a generic CRUD demonstration:

- Role-aware workflows
- Relational operational data
- Inventory and fulfillment state
- Delivery tracking
- Reporting and exports
- Authentication and access control
- Operational dashboards
- Extensible integrations

## Project status

This repository contains the application used to demonstrate the system's architecture and workflows. Client-specific data, credentials, branding, and deployment configuration are not included.

## Ownership

Developed by **Whrite Inc. LTD**, Kenya.

Client-specific information and configurations remain the property of their respective owners.

