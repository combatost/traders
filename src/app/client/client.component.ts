import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { MatDialog } from '@angular/material/dialog'
import { Client } from '../models/client.model'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { Router } from '@angular/router'

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.sass']
})
export class ClientComponent implements OnInit {

  public userForm: FormGroup
  public paginatedClients: Client[] = []
  public searchQuery: string = ''
  public pageSize: number = 5
  public pageIndex: number = 0
  public isShowed: boolean = false
  public selectedClient: Client | null = null

  private clients: Client[] = []
  private filteredClients: Client[] = []
  private userId: string = ''

  constructor(
    private readonly fb: FormBuilder,
    private readonly firestore: AngularFirestore,
    private readonly afAuth: AngularFireAuth,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      OtherPhoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      location: ['', Validators.required],
      address: ['', Validators.required],
      address2: ['', Validators.required]
    })
  }

  public ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid
        this.subscribeClients()
      }
    })
  }

  // Subscribe to clients collection and update filtered list
  private subscribeClients(): void {
    this.firestore.collection<Client>(`clients/${this.userId}/records`).snapshotChanges().subscribe(snapshot => {
      this.clients = snapshot.map(doc => {
        const data = doc.payload.doc.data() as Client
        return { id: doc.payload.doc.id, ...data }
      })
      this.filterClients()
    })
  }

  // Filter clients based on search query
  public filterClients(): void {
    const query = this.searchQuery.trim().toLowerCase()
    this.filteredClients = this.clients.filter(client =>
      client.fullName.toLowerCase().includes(query) ||
      client.phoneNumber.includes(query) ||
      client.OtherPhoneNumber.includes(query) ||
      client.location.toLowerCase().includes(query) ||
      client.address.toLowerCase().includes(query) ||
      client.address2.toLowerCase().includes(query)
    )
    this.pageIndex = 0
    this.updatePagination()
  }

  public clearSearch(): void {
    this.searchQuery = ''
    this.filterClients()
  }

  // Show form populated with selected client data for editing
  public onEdit(client: Client): void {
    this.selectedClient = client
    this.userForm.patchValue({
      fullName: client.fullName,
      phoneNumber: client.phoneNumber,
      OtherPhoneNumber: client.OtherPhoneNumber,
      location: client.location,
      address: client.address,
      address2: client.address2
    })
    this.isShowed = true
  }

  // Submit new or updated client data
  public async onSubmit(): Promise<void> {
    if (this.userForm.invalid || !this.userId) return

    const formValue = this.userForm.value
    const clientRef = this.firestore.collection(`clients/${this.userId}/records`)

    try {
      if (this.selectedClient) {
        await clientRef.doc(this.selectedClient.id).update(formValue)
        console.log('Client updated successfully')
        this.selectedClient = null
      } else {
        await clientRef.add(formValue)
        console.log('Client added successfully')
      }
      this.userForm.reset()
      this.isShowed = false
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  // Cancel editing and reset form
  public cancelEdit(): void {
    this.isShowed = false
    this.selectedClient = null
    this.userForm.reset()
  }

  // Delete client with confirmation dialog
  public async onDelete(clientId: string): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: 'Are you sure you want to delete this client?' }
    })

    const result = await dialogRef.afterClosed().toPromise()
    if (result && this.userId) {
      try {
        await this.firestore.doc(`clients/${this.userId}/records/${clientId}`).delete()
        console.log('Client deleted successfully')
      } catch (error) {
        console.error('Error deleting client:', error)
      }
    }
  }

  // Update paginated clients for current page
  private updatePagination(): void {
    const startIndex = this.pageIndex * this.pageSize
    const endIndex = startIndex + this.pageSize
    this.paginatedClients = this.filteredClients.slice(startIndex, endIndex)
  }

  public onNextPage(): void {
    const totalPages = Math.ceil(this.filteredClients.length / this.pageSize)
    if (this.pageIndex < totalPages - 1) {
      this.pageIndex++
      this.updatePagination()
    }
  }

  public onPrevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--
      this.updatePagination()
    }
  }

  public openClientDetails(clientId: string): void {
    console.log('Navigating to client details:', clientId)
    this.router.navigate(['/client-details', clientId])
  }

  public get totalPages(): number {
  return Math.ceil(this.filteredClients.length / this.pageSize);
}

}
