import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { take, map } from 'rxjs/operators'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuth) => {
        if (isAuth) {
          this.router.navigate(['/shien'])
          return false
        } else {
          return true
        }
      })
    )
  }
}
