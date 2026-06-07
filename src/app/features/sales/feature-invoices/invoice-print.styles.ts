/** Self-contained styles for the isolated invoice print iframe (no app shell). */
export const INVOICE_PRINT_STYLES = `
  @page { size: A4; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Arabic', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { padding: 10mm 8mm 12mm; }

  .invoices-page__a4-card {
    display: flex;
    flex-direction: column;
    inline-size: 100%;
    max-inline-size: 100%;
    min-block-size: calc(297mm - 22mm);
    background: #fff;
    overflow: visible;
  }

  .invoices-page__print-header {
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 55%, #dcfce7 100%);
    border-block-end: 2px solid #16a34a;
    padding: 0.75rem 0.5rem;
  }
  .invoices-page__print-header-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .invoices-page__logo-slot {
    flex-shrink: 0;
    inline-size: 88px;
    block-size: 88px;
  }
  .invoices-page__logo-placeholder {
    inline-size: 100%;
    block-size: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: #fff;
    border: 2px dashed #86efac;
    border-radius: 0.5rem;
    color: #16a34a;
    text-align: center;
    font-size: 0.625rem;
    font-weight: 500;
  }
  .invoices-page__logo-placeholder svg {
    inline-size: 1.75rem;
    block-size: 1.75rem;
    opacity: 0.75;
  }
  .invoices-page__company-info { flex: 1; min-width: 0; text-align: start; }
  .invoices-page__company-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #15803d;
    margin: 0 0 0.25rem;
    line-height: 1.25;
  }
  .invoices-page__company-dept {
    font-size: 0.875rem;
    font-weight: 500;
    color: #16a34a;
    margin: 0 0 0.5rem;
  }
  .invoices-page__company-contact { display: flex; flex-direction: column; gap: 0.25rem; }
  .invoices-page__company-contact-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.8125rem;
    color: #166534;
  }

  .invoices-page__print-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0.75rem 0.5rem 0.5rem;
  }
  .invoices-page__print-body-main { flex: 0 0 auto; }
  .invoices-page__print-footer {
    margin-block-start: auto;
    padding-block-start: 1rem;
    border-block-start: 2px solid #86efac;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .invoices-page__meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem 1rem;
    margin-block-end: 1rem;
    padding: 0.75rem;
    background: #f8fffb;
    border: 1px solid #bbf7d0;
    border-radius: 0.375rem;
  }
  .invoices-page__meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border-radius: 0.25rem;
    border-inline-start: 3px solid #22c55e;
  }
  .invoices-page__meta-label { font-size: 0.6875rem; color: #15803d; font-weight: 500; }
  .invoices-page__meta-value { font-size: 0.8125rem; font-weight: 600; color: #14532d; }

  .invoices-page__items-table {
    inline-size: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin-block: 0.75rem;
    border: 1px solid #86efac;
    font-size: 0.6875rem;
  }
  .invoices-page__items-table th,
  .invoices-page__items-table td {
    border: 1px solid #bbf7d0;
    padding: 0.25rem 0.2rem;
    text-align: center;
    vertical-align: middle;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .invoices-page__items-table thead tr {
    background: linear-gradient(180deg, #ecfdf5 0%, #dcfce7 100%);
  }
  .invoices-page__items-table thead th {
    font-weight: 600;
    line-height: 1.3;
    color: #166534;
  }
  .invoices-page__items-table tbody tr:nth-child(even) { background: #fafdfa; }
  .invoices-page__items-table-total td {
    background: #dcfce7;
    font-weight: 600;
    color: #14532d;
    border-block-start: 2px solid #22c55e;
  }
  .invoices-page__items-table-total td:first-child { text-align: start; }
  .invoices-page__th-main { display: block; }
  .invoices-page__th-unit {
    display: block;
    font-size: 0.625rem;
    font-weight: 400;
    color: #15803d;
  }
  .invoices-page__crop-cell { font-weight: 500; text-align: start; color: #14532d; }
  .invoices-page__total-value { color: #15803d; font-weight: 600; font-size: 0.8125rem; }
  .invoices-page__items-table thead { display: table-header-group; }
  .invoices-page__items-table tr { page-break-inside: avoid; }

  .invoices-page__section-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #15803d;
    margin: 0 0 0.5rem;
    padding-block-end: 0.25rem;
    border-block-end: 1px solid #bbf7d0;
  }
  .invoices-page__collection-block {
    padding: 0.75rem;
    background: #f8fffb;
    border: 1px solid #bbf7d0;
    border-radius: 0.375rem;
    margin-block-end: 0.75rem;
  }
  .invoices-page__collection-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.375rem 1rem;
  }
  .invoices-page__collection-details p {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #14532d;
  }
  .cell-muted { color: #15803d; font-weight: 500; }

  .invoices-page__footer-note {
    text-align: center;
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #16a34a;
  }
  .invoices-page__print-timestamp {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 400;
    color: #6b7280;
    text-align: start;
  }

  .invoices-page__screen-only { display: none !important; }
`;
