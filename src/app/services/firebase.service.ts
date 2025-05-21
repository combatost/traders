import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router'; // Import Router

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  isLoggedIn = false;
  private userUID: string | null = null;

  constructor(
    public firebaseAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router // Inject Router
  ) {
    // Initialize userUID when the service is created
    this.firebaseAuth.authState.subscribe(user => {
      if (user) {
        this.userUID = user.uid;
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

      // Navigate to home page after successful login
      this.router.navigate(['/sheintable']);  // Adjust route as needed
    } catch (error) {
      console.error('Signin error:', error);
      throw new Error('Signin failed. Please check your credentials.');
    }
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


}
