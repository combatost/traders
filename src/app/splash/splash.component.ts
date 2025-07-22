import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '../login/auth.service' // adjust path if needed
import { take } from 'rxjs/operators'


@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.sass']
})
export class SplashComponent implements OnInit {
  @ViewChild('videoRef') videoElement!: ElementRef<HTMLVideoElement>;

  constructor(private router: Router, private authService: AuthService) { }

  ngAfterViewInit() {
    this.videoElement.nativeElement.muted = true;
  }
  ngOnInit(): void {
    this.authService.isAuthenticated$
      .pipe(take(1)) // only once on init
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          // Redirect to your main page if already logged in
          this.router.navigate(['/shien']); // or your main route
        }
      });
  }
  goToWindowSplash() {
    this.router.navigate(['/window-splash']);
  }

  goToLogin() {
    this.router.navigate(['/window-splash']);
  }
}
