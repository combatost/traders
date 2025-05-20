import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-version-alert',
  templateUrl: './version-alert.component.html',
  styleUrls: ['./version-alert.component.sass'],
})
export class VersionAlertComponent implements OnInit {
  show = false
  appVersion = '1.0.0' 

  ngOnInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedVersion = localStorage.getItem('appVersion')

      if (savedVersion !== this.appVersion) {
        this.show = true
        localStorage.setItem('appVersion', this.appVersion)

        setTimeout(() => {
          this.show = false
        }, 5000)
      }
    }
  }

  close() {
    this.show = false
  }
}
