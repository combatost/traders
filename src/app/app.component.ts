import { Component, HostListener } from '@angular/core';
import { AuthService } from './login/auth.service'; // adjust path
import { TranslateService } from '@ngx-translate/core';
import { FirebaseService } from './services/firebase.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLocked = false;
  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);

  @HostListener('window:beforeunload')
  onUnload() {
    this.firebaseService.setUserOnlineStatus(false);
  }

  constructor(
    public authService: AuthService,
    private translate: TranslateService,
    private firebaseService: FirebaseService
  ) {
    this.translate.onLangChange.subscribe(event => {
      document.body.dir = event.lang === 'ar' ? 'rtl' : 'ltr';
    });

    this.authService.appUser$.subscribe(user => {
      this.isLocked = !!user?.isLocked;
    });
  }

   setLoggedIn(isLoggedIn: boolean) {
    this._isLoggedIn$.next(isLoggedIn);
  }
}

