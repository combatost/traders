import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.sass'],
})
export class HistoryComponent implements OnInit {
  historyRecords: any[] = [];
  filteredRecords: any[] = [];
  noResults: boolean = false;
  userId: string = '';
  history$!: Observable<any[]>;
  pageIndex = 0;
  pageSize = 10;

  selection: { [key: string]: boolean } = {};

  searchTerm: string = '';
  dateRange: { begin: Date | null; end: Date | null } = { begin: null, end: null };

  displayedColumns: string[] = [
    'select',
    'client',
    'quantity',
    'cost',
    'discount',
    'delivery',
    'shippingCost',
    'tax',
    'choice',
    'profit',
    'deletedAt',
  ];

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.history$ = this.firestore
          .collection(`history/${this.userId}/records`, ref => ref.orderBy('deletedAt', 'desc'))
          .valueChanges({ idField: 'id' });

        this.history$.subscribe(data => {
          this.historyRecords = data;
          this.applyFilters();
          this.pageIndex = 0; // reset to first page on new data
          this.selection = {}; // clear selection
        });
      }
    });
  }

  onSearchChange() {
    this.pageIndex = 0;
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.onSearchChange();
  }

  onDateRangeChange() {
    this.pageIndex = 0;
    this.applyFilters();
  }

  applyFilters() {
    let records = [...this.historyRecords];

    // Always apply date range filter if set
    if (this.dateRange.begin && this.dateRange.end) {
      // Ensure begin and end are Date objects
      const start = new Date(this.dateRange.begin as Date);
      const end = new Date(this.dateRange.end as Date);
      // Include the whole end day
      end.setHours(23, 59, 59, 999);

      records = records.filter(record => {
        let deletedAtDate: Date | null = null;
        if (record.deletedAt) {
          // Firestore Timestamp
          if (record.deletedAt instanceof Date) {
            deletedAtDate = record.deletedAt;
          } else if (typeof record.deletedAt.toDate === 'function') {
            deletedAtDate = record.deletedAt.toDate();
          } else if (typeof record.deletedAt === 'string' || typeof record.deletedAt === 'number') {
            deletedAtDate = new Date(record.deletedAt);
          }
        }
        // Only include if deletedAtDate is valid and within range
        return (
          deletedAtDate &&
          !isNaN(deletedAtDate.getTime()) &&
          deletedAtDate >= start &&
          deletedAtDate <= end
        );
      });
    }

    // Apply search filter after date range filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      records = records.filter(record => {
        return (
          (record.client && record.client.toString().toLowerCase().includes(term)) ||
          (record.choice && record.choice.toString().toLowerCase().includes(term)) ||
          (record.delivery && record.delivery.toString().toLowerCase().includes(term)) ||
          (record.quantity && record.quantity.toString().toLowerCase().includes(term)) ||
          (record.cost && record.cost.toString().toLowerCase().includes(term)) ||
          (record.discount && record.discount.toString().toLowerCase().includes(term)) ||
          (record.shippingCost && record.shippingCost.toString().toLowerCase().includes(term)) ||
          (record.tax && record.tax.toString().toLowerCase().includes(term)) ||
          (record.profit && record.profit.toString().toLowerCase().includes(term)) ||
          (record.deletedAt &&
            (
              (typeof record.deletedAt.toDate === 'function'
                ? record.deletedAt.toDate().toLocaleString().toLowerCase()
                : new Date(record.deletedAt).toLocaleString().toLowerCase()
              ).includes(term)
            )
          )
        );
      });
    }

    this.filteredRecords = records;
    this.noResults = this.filteredRecords.length === 0;

    // If date range is set and no results, hide table (filteredRecords will be empty)
    // This is handled in the template by checking filteredRecords.length or noResults
  }

  get pagedRecords() {
    const start = this.pageIndex * this.pageSize;
    return this.filteredRecords.slice(start, start + this.pageSize);
  }

  previousPage() {
    if (this.pageIndex > 0) this.pageIndex--;
  }

  nextPage() {
    if ((this.pageIndex + 1) * this.pageSize < this.filteredRecords.length) this.pageIndex++;
  }

  isAllSelected(): boolean {
    return this.pagedRecords.length > 0 && this.pagedRecords.every(record => this.selection[record.id]);
  }

  toggleSelectAll(checked: boolean) {
    this.pagedRecords.forEach(record => {
      this.selection[record.id] = checked;
    });
  }

  hasSelected(): boolean {
    return Object.values(this.selection).some(selected => selected);
  }

  deleteRecord(id: string) {
    if (!id) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '320px',
      data: {
        title: 'Delete Record',
        message: 'Are you sure you want to delete this record?',
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.firestore
          .collection(`history/${this.userId}/records`)
          .doc(id)
          .delete()
          .then(() => {
            this.historyRecords = this.historyRecords.filter(record => record.id !== id);
            this.applyFilters();
            if (this.pagedRecords.length === 0 && this.pageIndex > 0) this.pageIndex--;
          })
          .catch(err => console.error('Error deleting record:', err));
      }
    });
  }

  deleteSelectedRecords() {
    const idsToDelete = Object.keys(this.selection).filter(id => this.selection[id]);

    if (idsToDelete.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '320px',
      data: {
        title: 'Delete Selected Records',
        message: `Are you sure you want to delete ${idsToDelete.length} selected records?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const batch = this.firestore.firestore.batch();
        idsToDelete.forEach(id => {
          const docRef = this.firestore.collection(`history/${this.userId}/records`).doc(id).ref;
          batch.delete(docRef);
        });

        batch
          .commit()
          .then(() => {
            this.historyRecords = this.historyRecords.filter(record => !idsToDelete.includes(record.id));
            this.selection = {};
            this.applyFilters();
            if (this.pagedRecords.length === 0 && this.pageIndex > 0) this.pageIndex--;
          })
          .catch(err => console.error('Batch delete failed:', err));
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecords.length / this.pageSize));
  }
}
