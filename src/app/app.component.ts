import { Component, HostListener } from '@angular/core';
import { AuthService } from './login/auth.service'; // ✅ correct path to AuthService
import { TranslateService } from '@ngx-translate/core';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  @HostListener('window:beforeunload')
  onUnload() {
    this.firebaseService.setUserOnlineStatus(false);
  }

  title = 'Shein';

  constructor(public authService: AuthService, private translate: TranslateService, private firebaseService: FirebaseService) {
    this.translate.onLangChange.subscribe(event => {
      document.body.dir = event.lang === 'ar' ? 'rtl' : 'ltr';
    });
  }
}
