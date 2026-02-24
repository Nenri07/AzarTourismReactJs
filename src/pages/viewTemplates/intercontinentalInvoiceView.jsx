import React from 'react';
import logo from '../../../public/intercontinental-logo.png'
// Dummy data simulating your future API response
const dummyData = {
  hotel: {
    logo: "/intercontinental-logo.png", // Replace with actual asset path
  },
  guest: {
    name: "Mr. ISMAEIL HURAMA",
    ihgRewardsNo: "",
    companyAgent: "Azar Tourism",
    addressLine1: "Azar Tourism",
    addressLine2: "Algeria Square Building Number 12 First Floor, Tripoli",
    addressLine3: "1254 Tripoli Lebanon"
  },
  info: {
    roomNumber: "1855",
    arrivalDate: "06-01-26",
    departureDate: "10-01-26",
    cashier: "BAHGATP",
    date: "10-01-26",
    pageNo: "1 of 1",
    invoiceNo: "1535687",
    time: "10:10"
  },
  items: [
    { id: 1, date: "06-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
    { id: 2, date: "07-01-26", desc: "Laundry", subDesc: "", charges: "13,460.22", credits: "" },
    { id: 3, date: "07-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
    { id: 4, date: "08-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
    { id: 5, date: "09-01-26", desc: "Laundry", subDesc: "", charges: "13,398.18", credits: "" },
    { id: 6, date: "09-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
  ],
  totals: {
    charges: "85,287.20",
    credits: "85,287.20",
    creditsUsd: "1,810.00 USD"
  },
  footer: {
    vatRate: "10,234.46",
    exchangeRate: "1 USD = 47.12 EGP."
  }
};

const IntercontinentalInvoiceView = () => {
  return (
    <div style={{ backgroundColor: '#e6e6e6', padding: '20px', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{__html: `
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .page-container {
            width: 210mm;
            min-height: 297mm;
            background-color: #fff;
            padding: 40px 35px;
            position: relative;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #000;
        }

        .logo-section {
            text-align: center;
            margin-bottom:15px;
            display: flex;
            justify-content: center;
        }

        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            line-height: 1.4;
        }

        .left-info {
            width: 55%;
        }

        .right-info {
            width: 40%;
            position: relative;
        }

        .info-grid-left, .info-grid-right {
            display: grid;
            row-gap: 5px;
        }

        .info-grid-left {
            grid-template-columns: 125px 1fr;
        }

        .info-grid-right {
            grid-template-columns: 110px 1fr;
        }

        .label {
            color: #000;
        }

        .info-grid-right .label {
            text-align: right;
            padding-right: 10px;
        }

        .value {
            font-weight: bold;
        }

        .value.normal-weight {
            font-weight: normal;
        }

        .floating-time {
            position: absolute;
            right: 15px;
            top: 72px;
            font-weight: bold;
        }

        .invoice-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
            margin-top: 25px;
            padding-left: 20px;
        }

        table.invoice-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .invoice-table th, 
        .invoice-table td {
            vertical-align: top;
            padding: 6px 5px;
        }

        .col-date { width: 14%; }
        .col-desc { width: 56%; }
        .col-charges { width: 15%; }
        .col-credits { width: 15%; }

        .border-right {
            border-right: 1px solid #000;
        }

        .border-top {
            border-top: 1px solid #000;
        }
        
        .border-bottom {
            border-bottom: 1px solid #000;
        }

        .invoice-table thead th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            font-weight: normal;
            text-align: left;
            padding: 8px 5px;
        }

        .desc-inner {
            display: flex;
            justify-content: space-between;
            padding-right: 50px;
        }

        .total-row td {
            font-weight: bold;
            padding: 8px 5px;
        }

        .footer-spacer {
            height: 30px;
        }

        .vat-exchange {
            margin-top: 10px;
            line-height: 1.5;
            padding-left: 5px;
        }

        @media print {
            body, div {
                background-color: transparent !important;
            }
            .page-container {
                box-shadow: none;
                margin: 0;
                padding: 0;
                width: 100%;
            }
        }
      `}} />

      <div className="page-container">
        <div className="logo-section">
          <img src={logo} alt="InterContinental Logo" />
        </div>

        <div className="info-section">
          <div className="left-info">
            <div className="info-grid-left">
              <div className="label">Guest Name.</div>
              <div className="value">{dummyData.guest.name}</div>

              <div className="label">IHG® Rewards No.:</div>
              <div className="value">{dummyData.guest.ihgRewardsNo}</div>

              <div className="label">Address.</div>
              <div className="value normal-weight" style={{ lineHeight: 1.2 }}>
                {dummyData.guest.addressLine1}<br />
                {dummyData.guest.addressLine2}<br />
                {dummyData.guest.addressLine3}
              </div>
            </div>
            
            <div className="info-grid-left" style={{ marginTop: '15px' }}>
              <div className="label">Company/Agent:</div>
              <div className="value normal-weight">{dummyData.guest.companyAgent}</div>
            </div>
          </div>

          <div className="right-info">
            <div className="info-grid-right">
              <div className="label">Room Number:</div>
              <div className="value">{dummyData.info.roomNumber}</div>

              <div className="label">Arriva Date:</div>
              <div className="value normal-weight">{dummyData.info.arrivalDate}</div>

              <div className="label">Departure Date:</div>
              <div className="value normal-weight">{dummyData.info.departureDate}</div>

              <div className="label">Cashier:</div>
              <div className="value normal-weight">{dummyData.info.cashier}</div>

              <div className="label">Date:</div>
              <div className="value normal-weight">{dummyData.info.date}</div>

              <div className="label">Page No.:</div>
              <div className="value normal-weight">{dummyData.info.pageNo}</div>

              <div className="label">Invoice No.:</div>
              <div className="value normal-weight">{dummyData.info.invoiceNo}</div>
            </div>
            <div className="floating-time">{dummyData.info.time}</div>
          </div>
        </div>

        <div className="invoice-title">INFORMATION INVOICE</div>

        <table className="invoice-table">
          <colgroup>
            <col className="col-date" />
            <col className="col-desc" />
            <col className="col-charges" />
            <col className="col-credits" />
          </colgroup>
          
          <thead>
            <tr>
              <th className="border-right" style={{ paddingLeft: '10px' }}>Date</th>
              <th className="border-right" style={{ textAlign: 'center' }}>Descriptions</th>
              <th className="border-right" style={{ textAlign: 'center' }}>Charges EGP.</th>
              <th style={{ textAlign: 'center' }}>Credits EGP.</th>
            </tr>
          </thead>
          
          <tbody style={{ lineHeight: 1.6 }}>
            {dummyData.items.map((item) => (
              <tr key={item.id}>
                <td className="border-right">{item.date}</td>
                <td className="border-right">
                  {item.subDesc ? (
                    <div className="desc-inner">
                      <span>{item.desc}</span>
                      <span>{item.subDesc}</span>
                    </div>
                  ) : (
                    item.desc
                  )}
                </td>
                <td className="border-right" style={{ textAlign: 'right' }}>{item.charges}</td>
                <td>{item.credits}</td>
              </tr>
            ))}
            {/* Empty spacer row to push the footer down if needed */}
            <tr>
              <td className="border-right" style={{ height: '380px' }}></td>
              <td className="border-right"></td>
              <td className="border-right"></td>
              <td></td>
            </tr>
          </tbody>

          <tbody>
            <tr className="total-row">
              <td className="border-top border-bottom border-right">Total</td>
              <td className="border-top border-bottom border-right"></td>
              <td className="border-top border-bottom border-right" style={{ textAlign: 'right' }}>{dummyData.totals.charges}</td>
              <td className="border-top border-bottom" style={{ textAlign: 'right' }}>
                {dummyData.totals.credits}
                <div style={{ marginTop: '10px' }}>{dummyData.totals.creditsUsd}</div>
              </td>
            </tr>
          </tbody>

          <tbody>
            <tr>
              <td colSpan="4" className="footer-spacer"></td>
            </tr>
            <tr>
              <td rowSpan="3" className="border-top border-right" style={{ paddingTop: '10px' }}>Approved by</td>
              <td className="border-top" style={{ height: '35px' }}></td>
              <td colSpan="2" className="border-top"></td>
            </tr>
            <tr>
              <td className="border-top border-bottom border-right" style={{ padding: '8px 5px' }}>Company / Travel Agency</td>
              <td colSpan="2" className="border-top border-bottom" style={{ padding: '8px 5px' }}>Account Receivable No..</td>
            </tr>
            <tr>
              <td style={{ paddingTop: '10px', textAlign: 'center' }}>Signature</td>
              <td colSpan="2" style={{ paddingTop: '10px', paddingLeft: '5px' }}>Address</td>
            </tr>
          </tbody>
        </table>

        <div className="vat-exchange">
          Vat Rate = {dummyData.footer.vatRate}<br />
          Exchange Rate {dummyData.footer.exchangeRate}
        </div>

      </div>
    </div>
  );
};

export default IntercontinentalInvoiceView;