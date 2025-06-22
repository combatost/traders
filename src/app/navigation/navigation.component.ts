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

// Helper class for route-section mapping
class NavigationHelper {
  static getSectionFromUrl(url: string): string {
    const segments = url.split('?')[0].split('/');
    const path = segments[1] || '';

    switch (path) {
      case 'sheintable':
        return 'home';
      case 'client':
        return 'client';
      case 'clients':
        return 'clientsList';
      case 'analysic':
        return 'analytics';
      case 'aboutme':
        return 'about';
      case 'settings':
        return 'settings';
      case 'history':
        return 'history';
      default:
        return '';
    }
  }

}

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() isLogout = new EventEmitter<void>();

  currentSection = '';
  isNavbarOpen = false;
  isNavbarHidden = false;
  isDropdownOpen = false;
  isClientsDropdownOpen = false;
  isLoading = false;

  lastScrollTop = 0;

  selectedClientLabel = 'NAV.CLIENTS';
  selectedSettingsLabel = 'NAV.SETTINGS';
  loginModeTitle = 'SHEINTRADERS';
  userName = '';

  private routerSubscription?: Subscription;
  private loginModeSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private el: ElementRef,
    public firebaseServices: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public afAuth: AngularFireAuth,
    private loginModeService: LoginModeService
  ) { }

  ngOnInit(): void {
    this.enforceSSL();
    this.updateCurrentSectionFromUrl(this.router.url);

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateCurrentSectionFromUrl(event.urlAfterRedirects);
        this.closeAllMenus();
      }
    });

    this.loginModeSubscription = this.loginModeService.currentMode$.subscribe(mode => {
      this.loginModeTitle = mode === 'shein' ? 'SHEINTRADERS' : 'TRADERS';
      this.cdr.detectChanges();
    });

    this.authSubscription = this.afAuth.authState.subscribe(user => {
      if (user?.uid) {
        this.firebaseServices.getUserData().subscribe(userData => {
          this.userName =
            userData?.fullName ||
            user.displayName?.trim() ||
            user.email?.split('@')[0] ||
            'User';
          this.cdr.detectChanges();
        });
      } else {
        this.userName = '';
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.loginModeSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  private enforceSSL(): void {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      window.location.href = 'https://' + window.location.host + window.location.pathname;
    }
  }

  private updateCurrentSectionFromUrl(url: string): void {
    this.currentSection = NavigationHelper.getSectionFromUrl(url);

    switch (this.currentSection) {
      case 'client':
        this.selectedClientLabel = 'NAV.CLIENTS';
        break;
      case 'clientsList':
        this.selectedClientLabel = 'NAV.CLIENTS_LIST';
        break;
      case 'settings':
        this.selectedSettingsLabel = 'NAV.SETTINGS';
        break;
      case 'history':
        this.selectedSettingsLabel = 'NAV.HISTORY';
        break;
    }

    this.cdr.detectChanges();
  }

  // Navigation actions
  navigateToHome(): void {
    this.router.navigate(['/sheintable']);
  }

  navigateToClient(): void {
    this.router.navigate(['/client']);
    this.currentSection = 'client';
    this.selectedClientLabel = 'NAV.CLIENTS';
    this.closeAllMenus();
  }

  navigateToList(): void {
    this.router.navigate(['/clients']);
    this.currentSection = 'clientsList';
    this.selectedClientLabel = 'NAV.CLIENTS_LIST';
    this.closeAllMenus();
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
    this.router.navigate(['/settings']);
    this.currentSection = 'settings';
    this.selectedSettingsLabel = 'NAV.SETTINGS';
    this.closeAllMenus();
  }

  navigateToHistory(): void {
    this.router.navigate(['/history']);
    this.currentSection = 'history';
    this.selectedSettingsLabel = 'NAV.HISTORY';
    this.closeAllMenus();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) this.isClientsDropdownOpen = false;
  }

  toggleClientsDropdown(): void {
    this.isClientsDropdownOpen = !this.isClientsDropdownOpen;
    if (this.isClientsDropdownOpen) this.isDropdownOpen = false;
  }

  toggleMenu(): void {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  logout(): void {
    this.isLoading = true;
    this.afAuth.signOut().then(() => {
      this.isLogout.emit();
      setTimeout(() => {
        this.router.navigate(['/']);
        this.isLoading = false;
        this.cdr.detectChanges();
      }, 100);
    });
  }

  private closeAllMenus(): void {
    this.isNavbarOpen = false;
    this.isDropdownOpen = false;
    this.isClientsDropdownOpen = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeDropdowns();
    }
  }

  closeDropdowns(): void {
    this.isDropdownOpen = false;
    this.isClientsDropdownOpen = false;
    this.cdr.detectChanges();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    this.isNavbarHidden = scrollTop > this.lastScrollTop && scrollTop > 100;
    this.lastScrollTop = Math.max(scrollTop, 0);

    const sections = this.el.nativeElement.ownerDocument.querySelectorAll('section[id]');
    for (const section of Array.from(sections)) {
      const sectionElement = section as HTMLElement;
      const sectionTop = sectionElement.getBoundingClientRect().top;
      const sectionId = sectionElement.getAttribute('id');
      if (sectionId && sectionTop <= 150 && sectionTop >= -150) {
        this.currentSection = sectionId;
        break;
      }
    }


    this.cdr.detectChanges();
  }
}
