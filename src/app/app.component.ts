import { Component } from '@angular/core';
import { AuthService } from './login/auth.service'; // ✅ correct path to AuthService
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Shein';

  constructor(public authService: AuthService, private translate: TranslateService) {
    this.translate.onLangChange.subscribe(event => {
    document.body.dir = event.lang === 'ar' ? 'rtl' : 'ltr';
  });
  }
}
