import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { take, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      take(1),
      map(user => {
        if (user && user.email === 'alikamlion@gmail.com') {
          // ✅ Only allow this one email
          return true;
        } else {
          // ❌ Block access and redirect others
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
