
export default function NovotelInvoiceFooter({ 
  invoice, 
  totalDebit, 
  totalCredit, 
  totalUSD 
}) {
  return (
    <div style={{ marginTop: '8px', fontSize: '10px' }}>
      <div style={{ borderTop: '1px solid #000', paddingTop: '0.5px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* Left - USD */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: '200px'
              }}
            >
              <span>USD Exch. Rate:</span>
              <span>
                {(invoice.exchangeRate || 2.85).toFixed(2)}{' '}
                {invoice.currency}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: '200px'
              }}
            >
              <span>Total in USD:</span>
              <span>{totalUSD} USD</span>
            </div>
          </div>

       {/* Right - Totals and taxes */}
          <div>
            {/* Total Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                borderBottom: '1px solid #000',
                paddingBottom: '0.5px',
                marginBottom: '2px'
              }}
            >
              <span style={{ marginRight: '37px', fontSize: '11px' }}>Total</span>
              <span style={{ textAlign: 'right', width: '260px', fontSize:'12px' }}>
                {totalDebit.toFixed(3)}
              </span>
              <span style={{ textAlign: 'right', width: '80px', fontSize:'12px' }}>
                {totalCredit.toFixed(3)}
              </span>
            </div>

            {/* Balance Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '12px',
                paddingRight: '225px'
              }}
            >
              <span style={{ marginRight: '37px', fontSize: '11px' }}>Balance</span>
              <span style={{ textAlign: 'right', width: '100px',fontSize:'11px' }}>
                {totalDebit.toFixed(3)} {invoice.currency}
              </span>
            </div>

            {/* Tax breakdown - Widened container (260px) and increased marginRight (40px) */}
            <div style={{ marginLeft: 'auto', width: '300px', lineHeight: '1.4' }}>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>Net Taxable</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  {Number(invoice.netTaxable || 0).toFixed(3)} {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>FDCST 1 %</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  {Number(invoice.fdsct || 0).toFixed(3)} {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>VAT 7%</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  {Number(invoice.vat7Total || 0).toFixed(3)} {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>VAT 19%</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  0.000 {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>City Tax</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  {Number(invoice.cityTaxTotal || 0).toFixed(3)} {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>Stamp Tax</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  {Number(invoice.stampTaxTotal || 0).toFixed(3)} {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>Non Revenue</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  0.000 {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>Paid Out</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  0.000 {invoice.currency}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ flex: 1, textAlign: 'right', marginRight: '105px' }}>Total Gross</span>
                <span style={{ width: '90px', textAlign: 'right' }}>
                  {Number(invoice.grossTotal || 0).toFixed(3)} {invoice.currency}
                </span>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
