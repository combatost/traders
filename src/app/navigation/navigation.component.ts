import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  Renderer2,
  AfterViewInit
} from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent implements AfterViewInit {
  @Output() isLogout = new EventEmitter<void>();

  currentSection = '';
  isNavbarOpen = false;
  isNavbarHidden = false;
  lastScrollTop = 0;
  isDropdownOpen = false;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    public firebaseServices: FirebaseService,
    private router: Router
  ) {}

  // Navigation
  navigateToHome(): void {
    this.currentSection = 'home';
    this.router.navigate(['/sheintable']);
  }
 navigateToClient(): void {
    this.currentSection = 'client';
    this.router.navigate(['/client']);
  }
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  navigateToHistory(): void {
    this.currentSection = 'history';
    this.router.navigate(['/history']);
  }
  navigateToAbout(): void {
    this.currentSection = 'about';
    this.router.navigate(['/aboutme']);
  }

  navigateToAnalytics(): void {
    this.currentSection = 'analytics';
    this.router.navigate(['/analysic']);
  }

  navigateToSettings(): void {
    this.currentSection = 'settings';
    this.router.navigate(['/settings']);
  }

  // Logout
  logout(): void {
    this.firebaseServices.logout();
    this.isLogout.emit();
    this.router.navigate(['/login']);
  }

  // Toggle menu for mobile
  toggleMenu(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  // Hide navbar on scroll down, show on scroll up
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > this.lastScrollTop && currentScroll > 100) {
      this.isNavbarHidden = true;
    } else {
      this.isNavbarHidden = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

    // Update section highlighting if needed
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionId = section.getAttribute('id');
      if (sectionTop <= 150 && sectionTop >= -150) {
        this.currentSection = sectionId || '';
      }
    });
  }

  ngAfterViewInit(): void {}
}
