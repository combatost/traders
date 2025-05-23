import { Component, OnInit, HostListener, OnDestroy } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { FirebaseService } from '../services/firebase.service'
import { VersionAlertComponent } from '../version-alert/version-alert.component'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.sass']
})
export class FooterComponent implements OnInit, OnDestroy {
  currentLang: 'en' | 'ar' = 'en'
  currentSection: string = 'home'
  currentYear: number = new Date().getFullYear()
  isScrolled: boolean = false
  userCount: number = 0
  version = VersionAlertComponent.appVersion

  private langChangeSub?: Subscription
  private routerEventsSub?: Subscription

  constructor(
    private router: Router,
    private translate: TranslateService,
    private firebaseService: FirebaseService
  ) {
    const savedLang = (localStorage.getItem('selectedLanguage') as 'en' | 'ar') || 'en'
    this.translate.setDefaultLang(savedLang)
    this.translate.use(savedLang)
    this.currentLang = savedLang
    this.setDirection(savedLang)

    this.langChangeSub = this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang as 'en' | 'ar'
      this.setDirection(this.currentLang)
    })

    this.routerEventsSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects
        if (url.startsWith('/aboutme')) this.currentSection = 'aboutme'
        else if (url.startsWith('/settings')) this.currentSection = 'settings'
        else this.currentSection = 'home'
      }
    })
  }

  ngOnInit(): void {
    this.loadUserCounts()
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe()
    this.routerEventsSub?.unsubscribe()
  }

  async loadUserCounts() {
    try {
      this.userCount = await this.firebaseService.getTotalUserCount()
    } catch (error) {
      console.error('Error loading user count:', error)
    }
  }

  onLanguageChange(event: Event) {
    const lang = (event.target as HTMLSelectElement).value as 'en' | 'ar'
    this.translate.use(lang)
    localStorage.setItem('selectedLanguage', lang)
    this.setDirection(lang)
  }

  setDirection(lang: 'en' | 'ar') {
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  navigate(route: string) {
    this.router.navigate([route])
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 10
  }
}
