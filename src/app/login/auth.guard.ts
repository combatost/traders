import { Injectable } from '@angular/core'
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { Observable, of } from 'rxjs'
import { switchMap, map, take } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.afAuth.authState.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          // Not logged in, redirect to login
          this.router.navigate(['/login'])
          return of(false)
        }

        const uid = user.uid

        return this.firestore.collection('users').doc(uid).get().pipe(
          map(snapshot => {
            interface UserData {
              isLocked?: boolean
              [key: string]: any
            }
            const userData = snapshot.data() as UserData

            if (userData?.isLocked) {
              // Allow login route always (so locked users can sign in)
              if (state.url === '/login') {
                return true
              }

              // Redirect locked users to blocked-user-card page
              this.router.navigate(['/blocked-user-card'])
              return false
            }

            // Not locked, allow navigation anywhere
            return true
          })
        )
      })
    )
  }
}
