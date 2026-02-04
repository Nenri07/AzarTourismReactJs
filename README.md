# ✈️ Azar Tourism Management Portal (Live Deployment)

A professional-grade, internal ERP solution designed for Azar Tourism to manage guest folios, automate complex tax calculations, and generate high-precision financial invoices.
Project is Officially developed by **Plus92services**

---

## 🌐 Live Demo
The project is currently deployed and active:
**[plus92services.com]**

---

## 🚀 The Mission
Modern travel agencies handle complex billing—varying VAT rates, accommodation taxes, and fluctuating exchange rates. This portal digitizes the "Folio to Invoice" pipeline, ensuring that every cent is accounted for and every document is legally compliant with Turkish financial standards.

## 🛠 Technical Architecture
Our stack is built for speed, security, and data integrity:

* **Frontend:** React.js for a reactive, single-page application experience.
* **Styling:** Tailwind CSS (Customized for high-fidelity print layouts).
* **Backend:** FastAPI (Python) — chosen for its asynchronous performance and automatic documentation.
* **Database:** PostgreSQL — providing robust relational data storage for guest transactions.
* **Security:** JWT-based session management for secure employee access.

---

## ✨ Core Features

### 💎 High-Precision Financial Engine
* **5-Digit Exchange Accuracy:** Precision-engineered to handle rates like `48.97968 TRY` to prevent rounding errors in large-scale transactions.
* **Multi-Tier Tax Logic:** Automatic calculation of 10% VAT (Accommodation), 20% VAT (Services), and the 2% Accommodation Tax.
* **Chronological Folio Sorting:** Transactions are automatically sorted by date and type for a clean guest experience.

### 📄 Intelligent Invoice Generation
* **Pixel-Perfect PDFs:** Utilizes `html2pdf.js` with custom CSS media queries to ensure the digital view matches the printed A4 document exactly.
* **Smart Pagination:** Custom algorithm that splits long guest stays into multiple numbered pages (22 rows per page) while keeping totals and tax summaries on the final page.
* **Multilingual Support:** All headers and fields follow the `Açıklama/Description` bilingual format.

### 🔐 Enterprise Security
* **JWT Session System:** Stateless authentication ensures that employee sessions are secure and scalable.
* **Internal Access Control:** Protected routes prevent unauthorized access to sensitive financial records and guest passport data.

---

## 📈 System Workflow
1.  **Data Ingestion:** Retrieve guest details and transaction history via FastAPI.
2.  **Transformation:** Logic layer converts raw database objects into human-readable folio rows.
3.  **Validation:** Tax totals and exchange rate conversions are verified.
4.  **Distribution:** Invoices are rendered in-browser for review and available for instant PDF download or thermal printing.

---

## 🤝 Contact & Development
This is a collaborative project currently managed as a public deployment for agency use.

**Lead Developers:** [Umer Bashir] & [Muhammad Moin]

