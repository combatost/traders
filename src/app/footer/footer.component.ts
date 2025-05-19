import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.sass']
})
export class FooterComponent implements OnInit {
  currentLang: 'en' | 'ar' = 'en';
  currentSection: string = 'home';
  currentYear: number = new Date().getFullYear();
  isScrolled: boolean = false;

  constructor(private router: Router, private translate: TranslateService) {
    const savedLang = (localStorage.getItem('selectedLanguage') as 'en' | 'ar') || 'en';
    this.translate.setDefaultLang(savedLang);
    this.translate.use(savedLang);
    this.currentLang = savedLang;
    this.setDirection(savedLang);

    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang as 'en' | 'ar';
      this.setDirection(this.currentLang);
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        if (url.startsWith('/aboutme')) this.currentSection = 'aboutme';
        else if (url.startsWith('/settings')) this.currentSection = 'settings';
        else this.currentSection = 'home';
      }
    });
  }

  ngOnInit(): void {}

  onLanguageChange(event: Event) {
    const lang = (event.target as HTMLSelectElement).value as 'en' | 'ar';
    this.translate.use(lang);
    localStorage.setItem('selectedLanguage', lang);
    this.setDirection(lang);
  }

  setDirection(lang: 'en' | 'ar') {
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 10;
  }
}
