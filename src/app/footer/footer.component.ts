import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.sass']
})
export class FooterComponent {
  currentLang: 'en' | 'ar' = 'en';
  currentSection: string = 'home';

  translations = {
    en: {
      home: 'Home',
      about: 'About Us',
      settings: 'Settings',
      languageLabel: 'Language',
      brand: ' SheinTraders | Powered by Ali Amhaz',
      copyright: '© 2025 YourCompany Inc. All rights reserved.'
    },
    ar: {
      home: 'الرئيسية',
      about: 'معلومات عنا',
      settings: 'الإعدادات',
      languageLabel: 'اللغة',
      brand: '🌍 عالم التجارة الإلكترونية | مدعوم بالتقنية المستقبلية',
      copyright: '© 2025 شركتك. جميع الحقوق محفوظة.'
    }
  };

  constructor(private router: Router) {
    // Update currentSection on route change
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Example routes: '/', '/about', '/settings'
        const url = event.urlAfterRedirects;
        if (url.startsWith('/about')) this.currentSection = 'about';
        else if (url.startsWith('/settings')) this.currentSection = 'settings';
        else this.currentSection = 'home';
      }
    });
  }

  onLanguageChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.currentLang = selectElement.value as 'en' | 'ar';
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
