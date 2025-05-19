import { Component, OnInit } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Observable, forkJoin, of } from 'rxjs'
import { switchMap, map, catchError } from 'rxjs/operators'
import { Router } from '@angular/router'

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
  }> = []

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
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
          // Map clients and fetch order counts for each
          const clientsData = clientSnapshots.map(snap => {
            const id = snap.payload.doc.id
            const client = snap.payload.doc.data() as Client
            return { id, client }
          })

          if (clientsData.length === 0) return of([])

          // For each client, get order count from sheinTables collection
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
        this.clientsWithOrderCount = results
      })
  }

  goToClientDetail(clientId: string) {
    this.router.navigate(['/client-details', clientId])
  }
}
