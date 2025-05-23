import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router'; // Import Router
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  isLoggedIn = false;
  private userUID: string | null = null;

  constructor(
    public firebaseAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private realtimeDb: AngularFireDatabase,
    private router: Router
  ) {
    this.firebaseAuth.authState.subscribe(user => {
      if (user) {
        this.userUID = user.uid;
        this.setupPresence(user.uid)
      } else {
        this.userUID = null;
      }
    });
  }

  async signin(email: string, password: string): Promise<void> {
    try {
      const res = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      this.isLoggedIn = true;
      this.userUID = res.user?.uid || null;
      localStorage.setItem('user', JSON.stringify(res.user));
      await this.setUserOnlineStatus(true);

      // Navigate to home page after successful login
      this.router.navigate(['/sheintable']);  // Adjust route as needed
    } catch (error) {
      console.error('Signin error:', error);
      throw new Error('Signin failed. Please check your credentials.');
    }
  }
  setupPresence(userId: string) {
    const statusRef = this.realtimeDb.object(`status/${userId}`)

    const isOfflineForDatabase = {
      online: false,
      lastChanged: firebase.database.ServerValue.TIMESTAMP
    };
    const isOnlineForDatabase = {
      online: true,
      lastChanged: firebase.database.ServerValue.TIMESTAMP
    };


    // Get Realtime Database special '.info/connected' ref that indicates connection state
    const connectedRef = this.realtimeDb.object('.info/connected').valueChanges();

    connectedRef.subscribe(connected => {
      if (!connected) {
        // We're offline, do nothing
        return;
      }
      // On disconnect set offline status
      statusRef.query.ref.onDisconnect().set(isOfflineForDatabase).then(() => {
        statusRef.update(isOnlineForDatabase);
      });
    });
  }

  async signup(email: string, password: string, fullName: string, birthDate: string): Promise<void> {
    try {
      const res = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
      this.isLoggedIn = true;
      this.userUID = res.user?.uid || null;
      localStorage.setItem('user', JSON.stringify(res.user));

      // Add additional user data like fullName and birthDate
      const userData = {
        fullName: fullName,
        birthDate: birthDate,
        data: []  // Initialize an empty array for `data`
      };
      await this.saveUserData(userData);

      // Navigate to the home page
      this.router.navigate(['/sheintable']);
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error('Signup failed. Please try again later.');
    }
  }

  logout(): void {
    this.firebaseAuth.signOut().catch(error => {
      console.error('Logout error:', error);
    });
    localStorage.removeItem('user');
    this.userUID = null;  // Clear cached user UID
    this.setUserOnlineStatus(false);

  }

  getUserUID(): string | null {
    return this.userUID || (JSON.parse(localStorage.getItem('user') || '{}')?.uid || null);
  }

  async saveUserData(data: any): Promise<void> {
    const userUID = this.getUserUID();
    if (userUID) {
      try {
        console.log('Saving data for user:', userUID, data); // Log data being saved
        await this.firestore.collection('users').doc(userUID).set(data);
        console.log('User data saved successfully!');
      } catch (error) {
        console.error('Error saving user data:', error);
        throw new Error('Failed to save user data.');
      }
    } else {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
  }

  getUserData(): Observable<any> {
    return this.firebaseAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.collection('users').doc(user.uid).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  addSheinRecord(record: any): Promise<void> {
    const userId = this.getUserUID();
    if (!userId) throw new Error('User not logged in.');

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .add(record)
      .then(() => console.log('Shein record added'))
      .catch(err => {
        console.error('Error adding record:', err);
        throw err;
      });
  }

  getSheinRecords(): Observable<any[]> {
    const userId = this.getUserUID();
    if (!userId) throw new Error('User not logged in.');

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .valueChanges({ idField: 'id' });
  }

  updateSheinRecord(recordId: string, data: any): Promise<void> {
    const userId = this.getUserUID();
    if (!userId) throw new Error('User not logged in.');

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .doc(recordId)
      .update(data);
  }

  deleteSheinRecord(recordId: string): Promise<void> {
    const userId = this.getUserUID();
    if (!userId) throw new Error('User not logged in.');

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .doc(recordId)
      .delete();
  }

  getTotalUserCount(): Promise<number> {
    return this.firestore
      .collection('users')
      .get()
      .toPromise()
      .then(snapshot => snapshot?.size || 0)
      .catch(err => {
        console.error('Failed to fetch user count:', err)
        return 0
      })
  }

  setUserOnlineStatus(online: boolean): void {
    const userUID = this.getUserUID();
    if (!userUID) return;

    this.firestore.collection('users').doc(userUID).update({
      online: online,
      lastSeen: new Date()
    }).catch(err => console.error('Error updating online status:', err));
  }
  getOnlineUserCount(): Promise<number> {
    return this.firestore.collection('users', ref => ref.where('online', '==', true))
      .get()
      .toPromise()
      .then(snapshot => snapshot?.size || 0)
      .catch(err => {
        console.error('Failed to fetch online user count:', err);
        return 0;
      });
  }

}
