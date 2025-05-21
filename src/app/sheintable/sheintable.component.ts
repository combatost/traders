import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { MatDialog } from '@angular/material/dialog'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { HistoryService } from '../services/history.service'

@Component({
  selector: 'app-sheintable',
  templateUrl: './sheintable.component.html',
  styleUrls: ['./sheintable.component.sass']
})
export class SheintableComponent implements OnInit {
  userForm: FormGroup
  onselect: any[] = []
  pagedData: any[] = []  // current page data
  switch: boolean = false
  showCancelButton: boolean = false
  editId: string | null = null
  userId: string = ''
  filteredData: any[] = [] // data after filtering & sorting
  searchTerm: string = ''
  pageIndex = 0
  pageSize = 5
  displayedColumns = ['client', 'quantity', 'cost', 'discount', 'delivery', 'shippingCost', 'tax', 'choice', 'profit', 'actions']
  editingRowId: string | null = null
  isLoading = true;        // show loader initially
  oldClientName: string = ''


  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private dialog: MatDialog,
    private historyService: HistoryService
  ) {
    this.userForm = this.fb.group({
      client: ['', Validators.required],
      cost: [0, Validators.required],
      delivery: [0, Validators.required],
      discount: [0, Validators.required],
      shippingCost: [0, Validators.required],
      quantity: [1, Validators.required],
      tax: [0, Validators.required],
      choice: ['Pending', Validators.required],
      includeQuantityInProfit: [false]
    })
  }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid
        this.loadData()
      } else {
        this.isLoading = false  // stop loading even if no user
      }
    })
  }

  // In loadData() remove any assignments to showStartScreen:
  loadData(): void {
    this.firestore.collection(`sheinTables/${this.userId}/records`).snapshotChanges().subscribe(snapshot => {
      this.onselect = snapshot.map(doc => {
        const data = doc.payload.doc.data() as any
        return { id: doc.payload.doc.id, ...data }
      })

      this.isLoading = false

      this.applyFilter()
    }, error => {
      console.error('Error loading data:', error)
      this.isLoading = false
    })
  }


  applyFilter(): void {
    const filterValue = this.searchTerm.trim().toLowerCase()

    if (filterValue) {
      // Separate matched and unmatched to put matched on top
      const matched = this.onselect.filter(item => item.client.toLowerCase().includes(filterValue))
      const unmatched = this.onselect.filter(item => !item.client.toLowerCase().includes(filterValue))
      this.filteredData = [...matched, ...unmatched]
    } else {
      this.filteredData = [...this.onselect]
    }

    this.pageIndex = 0  // Reset page to first page on filter change
    this.updatePagedData()
  }

  updatePagedData(): void {
    const start = this.pageIndex * this.pageSize
    this.pagedData = this.filteredData.slice(start, start + this.pageSize)
  }

  clearSearch(): void {
    this.searchTerm = ''
    this.applyFilter()
  }

  nextPage(): void {
    if (this.pageIndex < this.maxPageIndex()) {
      this.pageIndex++
      this.updatePagedData()
    }
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--
      this.updatePagedData()
    }
  }

  maxPageIndex(): number {
    return Math.floor((this.filteredData.length - 1) / this.pageSize)
  }

  // Returns true if the row's client matches the searchTerm, used for highlighting
  isMatch(clientName: string): boolean {
    const filterValue = this.searchTerm.trim().toLowerCase()
    return filterValue ? clientName.toLowerCase().includes(filterValue) : false
  }

  private saveClientNameIfNotExists(clientName: string): void {
    if (!clientName || !this.userId) return;

    const clientRef = this.firestore.collection(`clients/${this.userId}/records`, ref =>
      ref.where('fullName', '==', clientName)
    );

    clientRef.get().subscribe(snapshot => {
      // Do nothing if a matching client already exists
      if (!snapshot.empty) {
        console.log('Client already exists, no need to add');
        return;
      }

      // Create placeholder only if not found
      this.firestore.collection(`clients/${this.userId}/records`).add({
        fullName: clientName,
        OtherPhoneNumber: '',
        address: '',
        address2: '',
        phoneNumber: '',
        location: '',
        orderId: ''
      }).then(() => {
        console.log('Client placeholder added');
      }).catch(err => {
        console.error('Error adding client placeholder:', err);
      });
    });
  }


  onClick(): void {
    if (this.userForm.invalid || !this.userId) return

    const formValue = this.userForm.value
    const sheinRef = this.firestore.collection(`sheinTables/${this.userId}/records`)

    if (this.switch && this.editId) {
      // EDIT existing record
      if (formValue.choice === 'Cancelled') {
        // Your existing cancel logic here (if any)
      } else {
        // Check if client changed
        const newClientName = formValue.client.trim()
        if (newClientName !== this.oldClientName) {
          this.saveClientNameIfNotExists(newClientName)
          this.firestore.collection(`sheinTables/${this.userId}/records`, ref => ref.where('client', '==', this.oldClientName))
            .get().subscribe(snapshot => {
              if (snapshot.empty) {
                this.deleteClientByName(this.oldClientName)
              }
            })
        }
        sheinRef.doc(this.editId).update(formValue).then(() => {
          this.resetForm()
        }).catch(console.error)
      }
    } else {
      // ADD new record
      const newClientName = formValue.client.trim()
      this.saveClientNameIfNotExists(newClientName)

      sheinRef.add(formValue).then(() => {
        this.resetForm()
      }).catch(console.error)
    }
  }

  private deleteClientByName(clientName: string): void {
    this.firestore.collection(`clients/${this.userId}/records`, ref => ref.where('fullName', '==', clientName))
      .get().subscribe(clientSnapshot => {
        if (!clientSnapshot.empty) {
          const clientId = clientSnapshot.docs[0].id
          this.firestore.doc(`clients/${this.userId}/records/${clientId}`).delete().then(() => {
            console.log(`Client ${clientName} deleted as orphan`)
          }).catch(err => {
            console.error('Error deleting client:', err)
          })
        }
      })
  }


  onEdit(index: number): void {
    const item = this.onselect[index]
    if (!item) return
    this.userForm.patchValue(item)
    this.switch = true
    this.editId = item.id
    this.editingRowId = item.id
    this.showCancelButton = true
    this.oldClientName = item.client
  }

  onCancel(): void {
    this.resetForm()
  }

  onClear(): void {
    this.resetForm()
  }

  async onClean(index: number): Promise<void> {
    const item = this.onselect[index]
    if (!item) return

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: `Are you sure you want to delete the order for "${item.client}"?` }
    })

    const result = await dialogRef.afterClosed().toPromise()

    if (result === true && this.userId) {
      try {
        await this.historyService.saveToHistory(this.userId, {
          client: item.client,
          quantity: item.quantity,
          cost: item.cost,
          discount: item.discount,
          delivery: item.delivery,
          shippingCost: item.shippingCost,
          tax: item.tax,
          choice: item.choice,
          profit: this.calculateProfit(item),
          id: item.id
        }, 'sheinTable')

        await this.firestore.doc(`sheinTables/${this.userId}/records/${item.id}`).delete()

        console.log('Deleted successfully')
        this.checkAndDeleteClient(item.client)
      } catch (error) {
        console.error('Error deleting item or saving history:', error)
      }
    }
  }

  private checkAndDeleteClient(clientName: string): void {
    this.firestore.collection(`sheinTables/${this.userId}/records`, ref => ref.where('client', '==', clientName))
      .get().subscribe(snapshot => {
        if (snapshot.empty) {
          this.firestore.collection(`clients/${this.userId}/records`, ref => ref.where('fullName', '==', clientName))
            .get().subscribe(clientSnapshot => {
              if (!clientSnapshot.empty) {
                const clientId = clientSnapshot.docs[0].id
                this.firestore.doc(`clients/${this.userId}/records/${clientId}`).delete().then(() => {
                  console.log('Client deleted')
                }).catch(err => {
                  console.error('Client delete error:', err)
                })
              }
            })
        }
      })
  }

  onQuantityProfitChange(): void {
    // Optional reactive logic here
  }

  calculateProfit(item: any): number {
    const discountProfit = (item.cost * item.discount) / 100
    const afterShipping = discountProfit - (item.shippingCost || 0)
    const afterTax = afterShipping - (item.tax || 0)
    const quantityBonus = item.includeQuantityInProfit ? (item.quantity || 0) : 0
    return +(afterTax + quantityBonus).toFixed(2)
  }

  calculateOverallTotal(): number {
    return this.onselect.reduce((sum, item) => sum + (item.cost + item.tax + item.shippingCost), 0)
  }

  calculateOverallProfit(): number {
    return this.onselect.reduce((sum, item) => sum + this.calculateProfit(item), 0)
  }

  private resetForm(): void {
    this.userForm.reset({
      client: '',
      cost: 0,
      delivery: 0,
      discount: 0,
      shippingCost: 0,
      quantity: 1,
      tax: 0,
      choice: 'Pending',
      includeQuantityInProfit: false
    })
    this.switch = false
    this.editId = null
    this.editingRowId = null
    this.showCancelButton = false
  }
}
