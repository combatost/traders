import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ChartData, ChartOptions } from 'chart.js/dist/types/index';
import { combineLatest } from 'rxjs';
import { LoginModeService } from '../services/login-mode.service';


@Component({
  selector: 'app-analysic',
  templateUrl: './analysic.component.html',
  styleUrls: ['./analysic.component.sass']
})
export class AnalysicComponent implements OnInit {
  filteredSalesData: any[] = [];
  salesData: any[] = [];
  cancelledHistoryOrders: any[] = [];
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
  cancelledCount: number = 0;
  profitRate: number = 0;
  totalprof: number = 0;
  maxItems: number = 100;           // max value for items, adjust to your logic
  maxClients: number = 50;          // max number of clients, adjust to your logic
  totalOrders: number = 120;        // total number of orders, adjust accordingly
  loginMode: string = 'shein';

  userId: string = '';

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private loginModeService: LoginModeService 
  ) { }

    ngOnInit(): void {
    // Subscribe to login mode changes
    this.loginModeService.currentMode$.subscribe(mode => {
      this.loginMode = mode;
    });

    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;

        const shein$ = this.firestore
          .collection(`sheinTables/${this.userId}/records`, ref => ref.orderBy('client'))
          .valueChanges({ idField: 'id' });

        const history$ = this.firestore
          .collection(`history/${this.userId}/records`, ref => ref.orderBy('deletedAt', 'desc'))
          .valueChanges({ idField: 'id' });

        combineLatest([shein$, history$]).subscribe(([sheinData, historyData]: [any[], any[]]) => {
          this.salesData = sheinData || [];
          this.cancelledHistoryOrders = historyData || [];
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

  // Count cancelled orders from both sources
  const cancelledActiveCount = this.salesData.filter(order => order.choice === 'Cancelled').length;
  const cancelledHistoryCount = this.cancelledHistoryOrders.length;
  this.cancelledCount = cancelledActiveCount + cancelledHistoryCount;

  // Weekly data (Mon–Sun)
  const weeklyTotals = new Array(7).fill(0);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  this.salesData.forEach(order => {
    this.totalSales += order.cost || 0;
    this.totalProfit += this.calculateProfit(order);
    this.totalItems += order.quantity || 0;
    this.totalDeliveryCost += order.shippingCost || 0;
    this.totalTaxCost += order.tax || 0;

    if (order.choice === 'Pending') this.pendingCount++;
    if (order.choice === 'Done') this.doneCount++;

    if (order.client) clients.add(order.client);

    if (order.date) {
      const dateObj = new Date(order.date);
      dateObj.setHours(0, 0, 0, 0); // normalize time
      if (dateObj >= startOfWeek) {
        const dayIndex = (dateObj.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        weeklyTotals[dayIndex] += order.cost || 0;
      }
    }
  });

  // Count unique clients from history
  this.cancelledHistoryOrders.forEach(order => {
    if (order.client) clients.add(order.client);
  });

  this.uniqueClientsCount = clients.size;

  this.profitRate = this.totalSales > 0
    ? +((this.totalProfit / this.totalSales) * 100).toFixed(2)
    : 0;

  this.weeklySalesData.datasets[0].data = weeklyTotals;
  this.weeklySalesData = { ...this.weeklySalesData };

  this.orderStatusData.datasets[0].data = [
    this.pendingCount,
    this.doneCount,
    this.cancelledCount
  ];
  this.orderStatusData = { ...this.orderStatusData };
}


filterByStatus(status: string): void {
  this.statusFilter = status;
  if (status === 'All') {
    this.filteredSalesData = [...this.salesData];
  } else {
    this.filteredSalesData = this.salesData.filter(order => order.choice === status);
  }

  // Sort so 'Done' rows go to the bottom
  this.filteredSalesData.sort((a, b) => {
    if (a.choice === 'Done' && b.choice !== 'Done') return 1  // a after b
    if (a.choice !== 'Done' && b.choice === 'Done') return -1 // a before b
    return 0 // keep order if both same
  });
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
weeklySalesLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

weeklySalesData: ChartData<'bar'> = {
  labels: this.weeklySalesLabels,
  datasets: [
    {
      label: 'Weekly Sales',
      data: new Array(7).fill(0),
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
