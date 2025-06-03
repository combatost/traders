import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return of(false);
        }

        const uid = user.uid;

        return this.firestore.collection('users').doc(uid).get().pipe(
          map(snapshot => {
            interface UserData {
              isLocked?: boolean;
              [key: string]: any;
            }
            const userData = snapshot.data() as UserData;

            if (userData?.isLocked) {
              // User is locked — just block route (or optionally redirect to a locked info page)
              // No alert, no sign out — UI handles locked state via your card component
              return false;
            }

            return true;
          })
        );
      })
    );
  }
}
