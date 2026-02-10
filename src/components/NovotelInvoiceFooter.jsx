
export default function NovotelInvoiceFooter({ 
  invoice, 
  totalDebit, 
  totalCredit, 
  totalUSD 
}) {
  return (
    <div style={{ marginTop: '8px', fontSize: '10px' }}>
      <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid #000',
                paddingBottom: '4px',
                marginBottom: '4px'
              }}
            >
              <span style={{ marginLeft: 'auto', marginRight: '80px' }}>
                Total
              </span>
              <span style={{ textAlign: 'right', width: '80px' }}>
                {totalDebit.toFixed(3)}
              </span>
              <span style={{ textAlign: 'right', width: '80px' }}>
                {totalCredit.toFixed(3)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}
            >
              <span style={{ marginLeft: 'auto', marginRight: '80px' }}>
                Balance
              </span>
              <span style={{ textAlign: 'center', width: '160px' }}>
                {totalDebit.toFixed(3)} {invoice.currency}
              </span>
            </div>

            <div style={{ textAlign: 'right', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Net Taxable</span>
                <span>
                  {Number(invoice.netTaxable || 0).toFixed(3)}{' '}
                  {invoice.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>FDCST 1 %</span>
                <span>
                  {Number(invoice.fdsct || 0).toFixed(3)}{' '}
                  {invoice.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>VAT 7%</span>
                <span>
                  {Number(invoice.vat7Total || 0).toFixed(3)}{' '}
                  {invoice.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>VAT 19%</span>
                <span>0.000 {invoice.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>City Tax</span>
                <span>
                  {Number(invoice.cityTaxTotal || 0).toFixed(3)}{' '}
                  {invoice.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stamp Tax</span>
                <span>
                  {Number(invoice.stampTaxTotal || 0).toFixed(3)}{' '}
                  {invoice.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Non Revenue</span>
                <span>0.000 {invoice.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid Out</span>
                <span>0.000 {invoice.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Gross</span>
                <span>
                  {Number(invoice.grossTotal || 0).toFixed(3)}{' '}
                  {invoice.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
