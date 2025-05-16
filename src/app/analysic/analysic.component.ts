import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-analysic',
  templateUrl: './analysic.component.html',
  styleUrls: ['./analysic.component.sass']
})
export class AnalysicComponent implements OnInit {
  filteredSalesData: any[] = [];
  salesData: any[] = [];
  statusFilter: string = 'All';

  totalSales: number = 0;
  totalProfit: number = 0;
  totalItems: number = 0;
  uniqueClientsCount: number = 0;
  totalDeliveryCost: number = 0;
  totalTaxCost: number = 0;
  pendingCount: number = 0;
  doneCount: number = 0;

  userId: string = '';

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;

        this.firestore.collection(`sheinTables/${this.userId}/records`, ref => ref.orderBy('client'))
          .valueChanges({ idField: 'id' })
          .subscribe((data: any[]) => {
            this.salesData = data;
            this.updateStats();
            this.filterByStatus(this.statusFilter);
          });
      }
    });
  }

  updateStats(): void {
    const clients = new Set<string>();
    this.totalSales = 0;
    this.totalProfit = 0;
    this.totalItems = 0;
    this.totalDeliveryCost = 0;
    this.totalTaxCost = 0;
    this.pendingCount = 0;
    this.doneCount = 0;

    this.salesData.forEach(order => {
      this.totalSales += order.cost || 0;
      this.totalProfit += this.calculateProfit(order);
      this.totalItems += order.quantity || 0;
      this.totalDeliveryCost += order.shippingCost || 0;
      this.totalTaxCost += order.tax || 0;

      if (order.choice === 'Pending') this.pendingCount++;
      if (order.choice === 'Done') this.doneCount++;

      if (order.client) clients.add(order.client);
    });

    this.uniqueClientsCount = clients.size;
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    if (status === 'All') {
      this.filteredSalesData = [...this.salesData];
    } else {
      this.filteredSalesData = this.salesData.filter(order => order.choice === status);
    }
  }

  calculateProfit(order: any): number {
    const discountProfit = (order.cost * order.discount) / 100;
    const afterShipping = discountProfit - (order.shippingCost || 0);
    const afterTax = afterShipping - (order.tax || 0);
    const quantityBonus = order.includeQuantityInProfit ? (order.quantity || 0) : 0;
    return +(afterTax + quantityBonus).toFixed(2);
  }

  onClean(index: number): void {
    const order = this.filteredSalesData[index];
    if (!this.userId || !order?.id) return;

    this.firestore.doc(`sheinTables/${this.userId}/records/${order.id}`).delete().then(() => {
      console.log('Order deleted');
    }).catch(error => {
      console.error('Delete failed:', error);
    });
  }
}
