import { Component, OnInit } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Observable } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.sass']
})
export class HistoryComponent implements OnInit {
  historyRecords: any[] = []
  userId: string = ''
  history$!: Observable<any[]>
  pageIndex = 0
  pageSize = 5

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid
        this.history$ = this.firestore.collection(`history/${this.userId}/records`, ref => ref.orderBy('deletedAt', 'desc'))
          .valueChanges({ idField: 'id' })

        this.history$.subscribe(data => {
          this.historyRecords = data
          this.pageIndex = 0 // reset to first page on new data
        })
      }
    })
  }

  get pagedRecords() {
    const start = this.pageIndex * this.pageSize
    return this.historyRecords.slice(start, start + this.pageSize)
  }

  previousPage() {
    if (this.pageIndex > 0) this.pageIndex--
  }

  nextPage() {
    if ((this.pageIndex + 1) * this.pageSize < this.historyRecords.length) this.pageIndex++
  }

  deleteRecord(id: string) {
    if (!id) return

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '320px',
      data: {
        title: 'Delete Record',
        message: 'Are you sure you want to delete this record?'
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.firestore.collection(`history/${this.userId}/records`).doc(id).delete()
          .then(() => {
            console.log('Record deleted:', id)
            this.historyRecords = this.historyRecords.filter(record => record.id !== id)
            // Optional: Adjust pageIndex if current page becomes empty
            if (this.pagedRecords.length === 0 && this.pageIndex > 0) this.pageIndex--
          })
          .catch(err => {
            console.error('Error deleting record:', err)
          })
      }
    })
  }
}
