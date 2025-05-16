import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loading$ = new BehaviorSubject<boolean>(true);
  public isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(user => {
      this.isAuthenticated$.next(!!user);
      this.loading$.next(false);
    });
  }
}
