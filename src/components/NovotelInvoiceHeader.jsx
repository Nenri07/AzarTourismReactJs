export default function NovotelInvoiceHeader({ 
  logoUrl, 
  invoice, 
  pageNum, 
  totalPages 
}) {
  return (
    <>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <img
          src={logoUrl}
          width="220"
          alt="Novotel"
          style={{ margin: '6px auto', height: '62px' }}
        />
      </div>

      {/* Header - Two columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '16px',
          fontSize: '11px',
          lineHeight: '1.4'
        }}
      >
        <div>
          <div>Name : {invoice.guestName}</div>
          <div>Person(s) : {invoice.persons}</div>
          <div>Room No. : {invoice.roomNo}</div>
          <div>Arrival : {invoice.arrival}</div>
          <div>Departure : {invoice.departure}</div>
          <div>Novotel Tunis Lac,</div>
          <div>The {invoice.issueDate}</div>
        </div>
        <div>
          <div>Company : {invoice.companyName}</div>
          <div>Address : {invoice.companyAddress}</div>
          <div style={{ marginTop: '4px' }}>Account NO : {invoice.accountNo}</div>
          <div>VAT No : {invoice.vatNo}</div>
          <div>Invoice No: {invoice.invoiceNo}</div>
          <div>Cashier : {invoice.cashier}</div>
          <div>
            Pages : {pageNum} of {totalPages}
          </div>
        </div>
      </div>
    </>
  );
}
