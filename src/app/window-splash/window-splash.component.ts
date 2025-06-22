import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-window-splash',
  templateUrl: './window-splash.component.html',
  styleUrls: ['./window-splash.component.sass']
})
export class WindowSplashComponent implements OnInit {
  constructor(private router: Router) {}

ngOnInit(): void {
  setTimeout(() => {
    this.router.navigate(['/login']); // redirect to SplashComponent after 5 seconds
  }, 3000);
}

}
