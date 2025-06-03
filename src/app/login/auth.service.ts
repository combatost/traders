import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, switchMap, of } from 'rxjs';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  isLocked: boolean;
  // add other fields as needed
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loading$ = new BehaviorSubject<boolean>(true);
  public isAuthenticated$ = new BehaviorSubject<boolean>(false);

  // Observable of current Firestore user data
  public appUser$ = this.afAuth.authState.pipe(
    switchMap(user => {
      if (user) {
        // Listen to Firestore user doc by uid
        return this.afs.doc<AppUser>(`users/${user.uid}`).valueChanges();
      } else {
        return of(null);
      }
    })
  );

  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
    this.afAuth.authState.subscribe(user => {
      this.isAuthenticated$.next(!!user);
      this.loading$.next(false);
    });
  }

  logout() {
    return this.afAuth.signOut();
  }
}
