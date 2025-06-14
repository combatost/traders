import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { LoginModeService } from '../services/login-mode.service';

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
  isClientsDropdownOpen = false;
  isLoading = false;

  selectedClientLabel = 'NAV.CLIENTS';
  selectedSettingsLabel = 'NAV.SETTINGS';
  loginModeTitle = 'SHEINTRADERS';

  private routerSubscription?: Subscription;
  private loginModeSubscription?: Subscription;

  constructor(
    private el: ElementRef,
    public firebaseServices: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public afAuth: AngularFireAuth,
    private loginModeService: LoginModeService
  ) {}

  ngOnInit(): void {
    this.updateCurrentSectionFromUrl(this.router.url);

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentSectionFromUrl(event.urlAfterRedirects);
        // Removed this.closeAllMenus() per your comment
      }
    });

    this.loginModeSubscription = this.loginModeService.currentMode$.subscribe(mode => {
      this.loginModeTitle = mode === 'shein' ? 'SHEINTRADERS' : 'TRADERS';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.loginModeSubscription?.unsubscribe();
  }

  private updateCurrentSectionFromUrl(url: string): void {
    if (url.startsWith('/sheintable')) {
      this.currentSection = 'home';
    } else if (url.startsWith('/client')) {
      this.currentSection = 'client';
      this.selectedClientLabel = 'NAV.CLIENTS';
    } else if (url.startsWith('/clients')) {
      this.currentSection = 'clientsList';
      this.selectedClientLabel = 'NAV.CLIENTS_LIST'; // add this key in your translations
    } else if (url.startsWith('/analysic')) {
      this.currentSection = 'analytics';
    } else if (url.startsWith('/aboutme')) {
      this.currentSection = 'about';
    } else if (url.startsWith('/settings')) {
      this.currentSection = 'settings';
      this.selectedSettingsLabel = 'NAV.SETTINGS';
    } else if (url.startsWith('/history')) {
      this.currentSection = 'history';
      this.selectedSettingsLabel = 'NAV.HISTORY';
    } else {
      this.currentSection = '';
    }
    this.cdr.detectChanges();
  }

  // Navigation methods
  navigateToHome(): void {
    this.router.navigate(['/sheintable']);
    this.closeAllMenus();
  }

  navigateToClient(): void {
    this.currentSection = 'client';
    this.selectedClientLabel = 'NAV.CLIENTS';
    this.isClientsDropdownOpen = false;
    this.cdr.detectChanges(); // force immediate UI update
    this.router.navigate(['/client']);
  }

  navigateToList(): void {
    this.currentSection = 'clientsList';
    this.selectedClientLabel = 'NAV.CLIENTS_LIST'; // make sure this key exists in translations
    this.isClientsDropdownOpen = false;
    this.cdr.detectChanges(); // force immediate UI update
    this.router.navigate(['/clients']);
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/analysic']);
    this.closeAllMenus();
  }

  navigateToAbout(): void {
    this.router.navigate(['/aboutme']);
    this.closeAllMenus();
  }

  navigateToSettings(): void {
    this.currentSection = 'settings';
    this.selectedSettingsLabel = 'NAV.SETTINGS';
    this.isDropdownOpen = false;
    this.cdr.detectChanges(); // Force immediate UI update
    this.router.navigate(['/settings']);
  }

  navigateToHistory(): void {
    this.currentSection = 'history';
    this.selectedSettingsLabel = 'NAV.HISTORY';
    this.isDropdownOpen = false;
    this.cdr.detectChanges(); // Force immediate UI update
    this.router.navigate(['/history']);
  }

  private setClientSection(section: string, label: string): void {
    this.currentSection = section;
    this.selectedClientLabel = label;
    this.isClientsDropdownOpen = false;
    this.cdr.markForCheck();
  }

  private setSettingsSection(section: string, label: string): void {
    this.currentSection = section;
    this.selectedSettingsLabel = label;
    this.isDropdownOpen = false;
    this.cdr.markForCheck();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.isClientsDropdownOpen = false;
    }
  }

  toggleClientsDropdown(): void {
    this.isClientsDropdownOpen = !this.isClientsDropdownOpen;
    if (this.isClientsDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  toggleMenu(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  logout(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
      this.isLogout.emit();
    });
  }

  private closeAllMenus(): void {
    this.isNavbarOpen = false;
    this.isDropdownOpen = false;
    this.isClientsDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeDropdowns();
    }
  }

  closeDropdowns(): void {
    this.isDropdownOpen = false;
    this.isClientsDropdownOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    this.isNavbarHidden = currentScroll > this.lastScrollTop && currentScroll > 100;
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;

    // Update currentSection based on visible section in viewport
    const sections = this.el.nativeElement.ownerDocument.querySelectorAll('section[id]');
    for (const section of sections) {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionId = section.getAttribute('id');
      if (sectionId && sectionTop <= 150 && sectionTop >= -150) {
        this.currentSection = sectionId;
        break;
      }
    }
  }

  ngAfterViewInit(): void {}
}
