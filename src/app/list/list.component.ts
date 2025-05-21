import { Component, OnInit } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Observable, forkJoin, of } from 'rxjs'
import { switchMap, map, catchError } from 'rxjs/operators'
import { Router } from '@angular/router'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import { MatDialog } from '@angular/material/dialog'

interface Client {
  fullName: string
  phoneNumber: string
  location: string
  // add other fields as needed
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.sass'],
})
export class ListComponent implements OnInit {
  userId = ''
  clientsWithOrderCount: Array<{
    id: string
    client: Client
    orderCount: number
    selected?: boolean
  }> = []

  masterSelected = false

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private dialog: MatDialog // ✅ Add this
  ) {}

  ngOnInit(): void {
    this.afAuth.authState
      .pipe(
        switchMap(user => {
          if (!user) return of([])
          this.userId = user.uid
          // Get all clients for user
          return this.firestore
            .collection<Client>(`clients/${this.userId}/records`)
            .snapshotChanges()
        }),
        switchMap(clientSnapshots => {
          const clientsData = clientSnapshots.map(snap => {
            const id = snap.payload.doc.id
            const client = snap.payload.doc.data() as Client
            return { id, client }
          })

          if (clientsData.length === 0) return of([])

          const observables = clientsData.map(({ id, client }) =>
            this.firestore
              .collection(`sheinTables/${this.userId}/records`, ref =>
                ref.where('client', '==', client.fullName)
              )
              .get()
              .pipe(
                map(snapshot => ({
                  id,
                  client,
                  orderCount: snapshot.size,
                })),
                catchError(() => of({ id, client, orderCount: 0 }))
              )
          )

          return forkJoin(observables)
        })
      )
      .subscribe(results => {
        this.clientsWithOrderCount = results.map(client => ({
          ...client,
          selected: false,
        }))
        this.masterSelected = false
      })
  }

  goToClientDetail(clientId: string) {
    this.router.navigate(['/client-details', clientId])
  }

  selectAllClients(event: any) {
    const checked = event.checked
    this.clientsWithOrderCount.forEach(client => (client.selected = checked))
  }

  checkIfAllSelected() {
    this.masterSelected =
      this.clientsWithOrderCount.every(client => client.selected === true) &&
      this.clientsWithOrderCount.length > 0
  }

  anySelected(): boolean {
    return this.clientsWithOrderCount.some(client => client.selected)
  }

 deleteSelectedClients(): void {
  const toDelete = this.clientsWithOrderCount.filter(c => c.selected);
  if (toDelete.length === 0) return;

  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    width: '320px',
    data: {
      title: 'Delete Clients',
      message: `Are you sure you want to delete ${toDelete.length} client(s)?`
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      const batch = this.firestore.firestore.batch();

      toDelete.forEach(client => {
        const docRef = this.firestore
          .collection(`clients/${this.userId}/records`)
          .doc(client.id).ref;
        batch.delete(docRef);
      });

      batch
        .commit()
        .then(() => {
          this.clientsWithOrderCount = this.clientsWithOrderCount.filter(
            c => !c.selected
          );
          this.masterSelected = false;
        })
        .catch(err => {
          console.error('Error deleting clients:', err);
          // Optionally open an error dialog here
        });
    }
  });
}
}