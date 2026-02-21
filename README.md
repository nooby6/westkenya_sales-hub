# West Kenya – Sales Management System

A centralized, role-based Sales Management System designed to digitize and unify sales, inventory, logistics, and reporting operations for Kabras Sugar.

Developed and maintained by **Whrite Inc. LTD**.

---

##  Overview

The Kabras Sugar Sales Management System replaces fragmented and manual sales workflows with a single, secure, and scalable digital platform.

The system provides end-to-end visibility and control over:
- Sales orders  
- Inventory across multiple depots  
- Shipping and delivery operations  
- Reporting and analytics  
- Role-based access control  

It is built for operational accuracy, transparency, and long-term scalability.

---

##  Core Features

### Sales Management
- Create, edit, and track sales orders  
- Automatic validation against inventory and pricing rules  
- Real-time order status updates  

### Inventory Management
- Live stock tracking across multiple depots  
- Automated inventory adjustments  
- Low-stock and overstock visibility  

### Shipping & Logistics
- Shipment tracking from dispatch to delivery  
- Driver verification per shipment:
  - Full name  
  - ID number  
  - Vehicle number plate  
  - Driver photo  
- Delivery status updates and proof of delivery  

### Reporting & Visualizations
- Role-based dashboards with charts and tables  
- Sales trends, inventory turnover, and fulfillment metrics  
- Exportable reports:
  - **PDF** (daily, weekly, monthly, custom date ranges)  
  - **Excel** (sales, inventory, shipments)  

### Role-Based Access Control (RBAC)
- Driver  
- Sales Representative  
- Supervisor  
- Manager  
- CEO  

Each role has strictly enforced permissions.

---

##  User Roles Summary

| Role | Access Scope |
|-----|------------|
| Driver | Assigned deliveries only |
| Sales Representative | Orders, stock (read-only), delivery scheduling |
| Supervisor | Order corrections, reporting, user management |
| Manager | Full operational visibility and control |
| CEO | Complete system access and strategic oversight |

All sensitive actions are logged for audit purposes.

---

##  Techn Stack (Indicative)

- **Backend:** Node.js / Python (FastAPI) / Go  
- **Frontend:** React / Vue.js  
- **Database:** PostgreSQL / MySQL  
- **Storage:** Secure object storage for images and documents  
- **Authentication:** Role-based access with secure authentication  
- **Reporting:** PDF and Excel generation  

---

##  Deployment

The system supports:
- Cloud or on-premise deployment  
- Horizontal scaling  
- Multi-depot expansion  
- Future ERP and accounting integrations  

---

##  Security & Compliance

- Strict role-based access enforcement  
- Immutable audit logs for sensitive actions  
- Controlled data exposure per user role  
- Secure handling of personally identifiable information (PII)  

---

##  Legal & Regulatory Considerations (Kenya)

This system is designed to operate within the Kenyan legal environment, including compliance with:

- **Kenya Data Protection Act, 2019**

Key considerations:
- Personal data (e.g. driver ID details and photos) is processed lawfully  
- Data access is limited strictly by role  
- Data is used solely for operational and business purposes  

System operators are responsible for ensuring ongoing compliance with:
- Kenya Data Protection Act  
- Internal company data governance policies  
- Industry regulations applicable to sugar manufacturing and distribution  

---

##  Licensing

### Software License

This project is licensed under the **MIT License**, permitting commercial use, modification, distribution, and private use under the license terms.

See the `LICENSE` file for full details.

---

### Intellectual Property

All source code, system architecture, and documentation are:

© **Whrite Inc. LTD**, Kenya.  
All rights reserved unless otherwise stated under the MIT License.

Client-specific data, branding, and configurations remain the property of their respective owners.

---

## 🏢 Attribution

Developed by:

**Whrite Inc. LTD**  
Software Engineering & Digital Systems  
Kenya

---

## 🛠 Support & Maintenance

Ongoing maintenance, feature enhancements, and integrations are provided by **Whrite Inc. LTD** under a separate agreement.
