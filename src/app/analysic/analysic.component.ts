import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChartData, ChartOptions } from 'chart.js/dist/types/index';

@Component({
  selector: 'app-analysic',
  templateUrl: './analysic.component.html',
  styleUrls: ['./analysic.component.sass']
})
export class AnalysicComponent implements OnInit {
  filteredSalesData: any[] = [];
  salesData: any[] = [];
  statusFilter: string = 'All';
  analyticsSearchQuery: string = '';
  totalSales: number = 0;
  totalProfit: number = 0;
  totalItems: number = 0;
  uniqueClientsCount: number = 0;
  totalDeliveryCost: number = 0;
  totalTaxCost: number = 0;
  pendingCount: number = 0;
  doneCount: number = 0;
  cancelledCount: number = 0; // added

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
    this.cancelledCount = 0;

    // Prepare monthly sales aggregation (index 0 = Jan, 1 = Feb, etc.)
    const monthlyTotals = new Array(12).fill(0);

    this.salesData.forEach(order => {
      this.totalSales += order.cost || 0;
      this.totalProfit += this.calculateProfit(order);
      this.totalItems += order.quantity || 0;
      this.totalDeliveryCost += order.shippingCost || 0;
      this.totalTaxCost += order.tax || 0;

      if (order.choice === 'Pending') this.pendingCount++;
      if (order.choice === 'Done') this.doneCount++;
      if (order.choice === 'Cancelled') this.cancelledCount++;

      if (order.client) clients.add(order.client);

      // Assuming order has a 'date' field in ISO or timestamp format
      // Convert to Date and get month
      if (order.date) {
        const dateObj = order.date instanceof Date ? order.date : new Date(order.date);
        const monthIndex = dateObj.getMonth();
        monthlyTotals[monthIndex] += order.cost || 0;
      }
    });

    this.uniqueClientsCount = clients.size;

    // Update chart data dynamically
    this.monthlySalesData.datasets[0].data = monthlyTotals;
    this.monthlySalesData = { ...this.monthlySalesData }; // trigger change detection

    this.orderStatusData.datasets[0].data = [this.pendingCount, this.doneCount, this.cancelledCount];
    this.orderStatusData = { ...this.orderStatusData }; // trigger change detection
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

  filterSalesData(): void {
    this.filterByStatus(this.statusFilter); // First apply the status filter

    if (this.analyticsSearchQuery) {
      const query = this.analyticsSearchQuery.toLowerCase();
      this.filteredSalesData = this.filteredSalesData.filter(sale =>
        sale.client?.toLowerCase().includes(query)
      );
    }
  }

  clearAnalyticsSearch(): void {
    this.analyticsSearchQuery = '';
    this.filterByStatus(this.statusFilter); // Reset filter
  }

  // Chart config and data

  monthlySalesLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  monthlySalesData: ChartData<'bar'> = {
    labels: this.monthlySalesLabels,
    datasets: [
      {
        label: 'Sales',
        data: new Array(12).fill(0),
        backgroundColor: '#3f51b5',
        borderRadius: 4,
      }
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  orderStatusLabels = ['Pending', 'Completed', 'Cancelled'];

  orderStatusData: ChartData<'doughnut'> = {
    labels: this.orderStatusLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#ff9800', '#4caf50', '#f44336'],
        hoverOffset: 10
      }
    ],
  };

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true }
    }
  };
}
