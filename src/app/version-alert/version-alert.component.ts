import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-version-alert',
  templateUrl: './version-alert.component.html',
  styleUrls: ['./version-alert.component.sass'],
})
export class VersionAlertComponent implements OnInit {
  showPopup = false
  dismissed = false
  public static appVersion = '2.5.0' // update on new release 

  version = VersionAlertComponent.appVersion

  versionMessage: string[] = [
    '🌟 Redesigned the dashboard with a fresh modern UI',
    '🔒 Improved authentication security',
    '🌐 Enhanced support for Arabic translations',
    '⚙️ Performance optimizations and bug fixes',
  ]

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedVersion = localStorage.getItem('appVersion')
      const dismissedVersion = localStorage.getItem('versionDismissed')
      
      if (savedVersion !== VersionAlertComponent.appVersion) {
        // Don't open popup automatically
        // this.showPopup = true  <--- remove this line
        
        this.dismissed = false
        localStorage.setItem('appVersion', VersionAlertComponent.appVersion)
        localStorage.removeItem('versionDismissed')
      } else if (dismissedVersion === VersionAlertComponent.appVersion) {
        this.dismissed = true
      }
    }
  }

  togglePopup() {
    this.showPopup = !this.showPopup
  }

  close() {
    this.showPopup = false
    this.dismissed = true
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('versionDismissed', VersionAlertComponent.appVersion)
    }
  }
}
