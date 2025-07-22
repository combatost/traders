import { Component, OnInit, OnDestroy } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Subscription, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'

export interface Notification {
  id: string
  title?: string
  message: string
  read: boolean
  timestamp: any
}

@Component({
  selector: 'app-version-alert',
  templateUrl: './version-alert.component.html',
  styleUrls: ['./version-alert.component.sass'],
})
export class VersionAlertComponent implements OnInit, OnDestroy {
  showPopup = false
  dismissed = false
  notifications: Notification[] = []
  lockedMessage: string | null = null
  currentUserId: string | null = null

  private notifSub?: Subscription
  private lockSub?: Subscription

  public static appVersion = '3.7.0' // update on new release
  version = VersionAlertComponent.appVersion

  versionMessage: { svg: SafeHtml; text: string }[]

  firebaseService: any // keep your existing service if needed

  constructor(
    private afs: AngularFirestore,
    private auth: AngularFireAuth,
    private sanitizer: DomSanitizer
  ) {
    // Raw SVG + text messages
    const rawMessages = [
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/>
    </svg>`,
        text: 'Vewewrsion popup redesigned with modern animation and style'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 10.5V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4.5L5 13v1h14v-1l-2-2.5zM9 6h6v4H9V6z"/>
    </svg>`,
        text: 'All video sections now use modern HTML5 players with poster and controls'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a6 6 0 0 1 6 6c0 4.5-6 10-6 10S6 12.5 6 8a6 6 0 0 1 6-6zm0 8a2 2 0 1 0-2-2 2 2 0 0 0 2 2z"/>
    </svg>`,
        text: 'Notification bell now glows with animation for new alerts'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14a1 1 0 0 1 1 1v14l-4-4H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
    </svg>`,
        text: 'Dialogs now styled with premium animated design, no Angular Material used'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
    </svg>`,
        text: 'History and section titles now use modern bold style with animation'
      }
    ];


    // Sanitize SVG strings for safe innerHTML usage
    this.versionMessage = rawMessages.map(msg => ({
      svg: this.sanitizer.bypassSecurityTrustHtml(msg.svg),
      text: msg.text
    }))
  }

  ngOnInit() {
    this.auth.user.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid

        this.subscribeToUserState(user.uid)

        this.firebaseService?.subscribeToUnreadNotifications()

        this.firebaseService?.unreadNotifications$.subscribe((notifications: Notification[]) => {
          console.log('Unread notifications:', notifications)
          this.notifications = notifications
        })
      }
    })

    if (typeof window !== 'undefined' && window.localStorage) {
      const savedVersion = localStorage.getItem('appVersion')
      const dismissedVersion = localStorage.getItem('versionDismissed')

      if (savedVersion !== VersionAlertComponent.appVersion) {
        this.dismissed = false
        localStorage.setItem('appVersion', VersionAlertComponent.appVersion)
        localStorage.removeItem('versionDismissed')
      } else if (dismissedVersion === VersionAlertComponent.appVersion) {
        this.dismissed = true
      }
    }
  }

  subscribeToUserState(userId: string) {
    this.notifSub?.unsubscribe()
    this.lockSub?.unsubscribe()

    this.lockSub = this.afs.doc<{ isLocked: boolean }>(`users/${userId}`).valueChanges().pipe(
      switchMap(userDoc => {
        if (userDoc?.isLocked) {
          return this.afs.collection<Notification>(`notifications`, ref =>
            ref.where('userId', '==', userId)
              .orderBy('timestamp', 'desc')
              .limit(1)
          ).valueChanges()
        } else {
          return of([])
        }
      })
    ).subscribe(notifs => {
      console.log('Locked notifications:', notifs)
      if (notifs.length > 0 && notifs[0].message) {
        this.lockedMessage = notifs[0].message
        this.showPopup = true
      } else {
        this.lockedMessage = null
        this.showPopup = false
      }
    })

    this.notifSub = this.afs.collection<Notification>(`notifications/${userId}/messages`, ref =>
      ref.where('read', '==', false).orderBy('timestamp', 'desc')
    ).valueChanges({ idField: 'id' }).subscribe(notifs => {
      console.log('Unread notifications:', notifs)
      this.notifications = notifs
      if (!this.lockedMessage) {
        this.showPopup = this.notifications.length > 0
      }
    })
  }

  markAsRead(notificationId: string) {
    if (!this.currentUserId) return

    this.afs.doc(`notifications/${this.currentUserId}/messages/${notificationId}`).update({
      read: true
    })
  }

  close() {
    this.showPopup = false
    this.dismissed = true
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('versionDismissed', VersionAlertComponent.appVersion)
    }
  }

  ngOnDestroy() {
    this.notifSub?.unsubscribe()
    this.lockSub?.unsubscribe()
  }

  togglePopup() {
    this.showPopup = !this.showPopup
  }
}
