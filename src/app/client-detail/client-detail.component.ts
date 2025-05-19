import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { ImageStorageService } from '../services/image-storage.service';

interface Client {
  fullName: string;
  phoneNumber: string;
  OtherPhoneNumber?: string;
  location: string;
  address: string;
  address2?: string;
}

interface Order {
  id: string;
  client: string; // matches fullName in Client
  cost: number;
  quantity: number;
  discount: number;
  delivery: number;
  shippingCost: number;
  tax: number;
  choice: string;
  profit?: number;
}

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.sass'],
})
export class ClientDetailComponent implements OnInit {
  userId: string = '';
  clientId: string = '';
  client$: Observable<Client | null> = of(null);
  orders$: Observable<Order[]> = of([]);
  clientImages: { url: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private imageStorage: ImageStorageService
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.clientId = this.route.snapshot.paramMap.get('id') || '';

        if (!this.userId || !this.clientId) {
          console.error('Missing userId or clientId');
          return;
        }

        this.loadImages();

        // Load client info
        this.client$ = this.firestore
          .doc<Client>(`clients/${this.userId}/records/${this.clientId}`)
          .valueChanges()
          .pipe(
            map(client => client ?? null),
            catchError(() => of(null))
          );

        // Load orders where client name matches client fullName
        this.orders$ = this.client$.pipe(
          switchMap(client => {
            if (!client) return of([]);
            return this.firestore
              .collection<Order>(`sheinTables/${this.userId}/records`, ref =>
                ref.where('client', '==', client.fullName)
              )
              .snapshotChanges()
              .pipe(
                map(actions =>
                  actions.map(a => {
                    const data = a.payload.doc.data() as Order;
                    const id = a.payload.doc.id;
                    const { id: _id, ...rest } = data;
                    return { id, ...rest };
                  })
                ),
                catchError(() => of([]))
              );
          })
        );
      }
    });
  }

  calculateProfit(order: Order): number {
    const discountProfit = (order.cost * order.discount) / 100;
    const afterShipping = discountProfit - (order.shippingCost || 0);
    const afterTax = afterShipping - (order.tax || 0);
    const quantityBonus = 0; // You can add quantity based logic if needed
    return +(afterTax + quantityBonus).toFixed(2);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      await this.imageStorage.saveImage(this.clientId, base64Image);
      this.loadImages(); // reload
    };
    reader.readAsDataURL(file);
  }
async deleteImage(index: number): Promise<void> {
  // Assuming your ImageStorageService has a deleteImage method accepting clientId and index
  await this.imageStorage.deleteImage(this.clientId, index);
  this.loadImages(); // Reload images after delete
}

  async loadImages(): Promise<void> {
    this.clientImages = await this.imageStorage.getImagesForClient(this.clientId);
  }
}
