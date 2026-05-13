import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrintService {
  printInvoice(_invoiceId?: string): void {
    // Optionally log print operations, update statuses or intercept data
    window.print();
  }
}





