import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MatDialog } from '@angular/material/dialog';
import { Client } from '../models/client.model';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.sass']
})
export class ClientComponent implements OnInit {
  userForm: FormGroup;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  paginatedClients: Client[] = [];
  selectedClient: Client | null = null;
  pageSize: number = 5;
  pageIndex: number = 0;
  userId: string = '';
  searchQuery: string = '';

  constructor(
    private fb: FormBuilder,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private dialog: MatDialog
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      OtherPhoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      location: ['', Validators.required],
      address: ['', Validators.required],
      address2: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.firestore.collection(`clients/${this.userId}/records`).snapshotChanges().subscribe(snapshot => {
          this.clients = snapshot.map(doc => {
            const data = doc.payload.doc.data() as Client;
            return { id: doc.payload.doc.id, ...data };
          });
          this.filterClients();
        });
      }
    });
  }

  filterClients(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredClients = this.clients.filter(client =>
      client.fullName.toLowerCase().includes(query) ||
      client.phoneNumber.includes(query) ||
      client.OtherPhoneNumber.includes(query) ||
      client.location.toLowerCase().includes(query) ||
      client.address.toLowerCase().includes(query) ||
      client.address2.toLowerCase().includes(query)
    );
    this.pageIndex = 0;
    this.updatePagination();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterClients();
  }

  onEdit(client: Client): void {
    this.selectedClient = client;
    this.userForm.patchValue({
      fullName: client.fullName,
      phoneNumber: client.phoneNumber,
      OtherPhoneNumber: client.OtherPhoneNumber,
      location: client.location,
      address: client.address,
      address2: client.address2
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid || !this.userId) return;

    const formValue = this.userForm.value;
    const clientRef = this.firestore.collection(`clients/${this.userId}/records`);

    if (this.selectedClient) {
      clientRef.doc(this.selectedClient.id).update(formValue).then(() => {
        console.log('Client updated successfully');
        this.selectedClient = null;
        this.userForm.reset();
      }).catch(err => console.error('Error updating client:', err));
    } else {
      clientRef.add(formValue).then(() => {
        console.log('Client added successfully');
        this.userForm.reset();
      }).catch(err => console.error('Error adding client:', err));
    }
  }

  onDelete(clientId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: 'Are you sure you want to delete this client?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.userId) {
        this.firestore.doc(`clients/${this.userId}/records/${clientId}`).delete().then(() => {
          console.log('Client deleted successfully');
        }).catch(err => console.error('Error deleting client:', err));
      }
    });
  }

  updatePagination(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedClients = this.filteredClients.slice(startIndex, endIndex);
  }

  onNextPage(): void {
    const totalPages = Math.ceil(this.filteredClients.length / this.pageSize);
    if (this.pageIndex < totalPages - 1) {
      this.pageIndex++;
      this.updatePagination();
    }
  }

  onPrevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePagination();
    }
  }
}
