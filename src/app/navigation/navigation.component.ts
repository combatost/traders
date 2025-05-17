import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  Renderer2,
  AfterViewInit,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent implements AfterViewInit, OnInit, OnDestroy {
  @Output() isLogout = new EventEmitter<void>();

  currentSection = '';
  isNavbarOpen = false;
  isNavbarHidden = false;
  lastScrollTop = 0;
  isDropdownOpen = false;
  isLoading = false;


  private routerSubscription!: Subscription;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    public firebaseServices: FirebaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Update currentSection on initial load & every route change
    this.updateCurrentSectionFromUrl(this.router.url);

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentSectionFromUrl(event.urlAfterRedirects);
        // Close menus on navigation
        this.isNavbarOpen = false;
        this.isDropdownOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  updateCurrentSectionFromUrl(url: string): void {
    // Define simple mapping url path to section name (adjust as per your routes)
    if (url.startsWith('/sheintable')) this.currentSection = 'home';
    else if (url.startsWith('/client')) this.currentSection = 'client';
    else if (url.startsWith('/analysic')) this.currentSection = 'analytics';
    else if (url.startsWith('/aboutme')) this.currentSection = 'about';
    else if (url.startsWith('/settings')) this.currentSection = 'settings';
    else if (url.startsWith('/history')) this.currentSection = 'history';
    else this.currentSection = ''; // default fallback
  }

  // Navigation methods
  navigateToHome(): void {
    this.router.navigate(['/sheintable']);
  }

  navigateToClient(): void {
    this.router.navigate(['/client']);
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/analysic']);
  }

  navigateToAbout(): void {
    this.router.navigate(['/aboutme']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

 logout(): void {
  this.isLoading = true;

  setTimeout(() => {
    this.firebaseServices.logout();
    this.isLogout.emit();
    this.router.navigate(['/login']);
    this.isLoading = false;
  }, 1000); // Optional delay for visual feedback
}


  toggleMenu(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > this.lastScrollTop && currentScroll > 100) {
      this.isNavbarHidden = true;
    } else {
      this.isNavbarHidden = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

    // Optional: Update section based on scroll (if your page has matching <section id="..."> elements)
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionId = section.getAttribute('id');
      if (sectionTop <= 150 && sectionTop >= -150 && sectionId) {
        this.currentSection = sectionId;
      }
    });
  }

  ngAfterViewInit(): void {}
}
