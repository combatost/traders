import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      take(1),  // Wait for Firebase to emit the current auth state
      map(user => {
        if (user) {
          // If user is authenticated, allow access to the route
          return true;
        } else {
          // If user is not authenticated, redirect to login page
          console.log('User not authenticated, redirecting to login...');
          this.router.navigate(['/login']);  // Redirect to login page
          return false;  // Deny access to the route
        }
      })
    );
  }
}
