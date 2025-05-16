import { Component } from '@angular/core';
import { AuthService } from './login/auth.service'; // ✅ correct path to AuthService

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Shein';

  constructor(public authService: AuthService) {}
}
