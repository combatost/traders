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

  public static appVersion = '3.0.2' // update on new release
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
          <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20 8l-1.4-1.4z"/>
        </svg>`,
        text: 'Added mandatory terms acceptance'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>
        </svg>`,
        text: 'Redirect new users after acceptance'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`,
        text: 'Show acceptance status for returning users'
      },
      {
        svg: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.9 12a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5 5 5 0 0 1-5 5H8.9a5 5 0 0 1-5-5zm2 0a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3 3 3 0 0 0-3-3H8.9a3 3 0 0 0-3 3z"/>
          <path d="M10 12h4v2h-4z"/>
        </svg>`,
        text: 'Footer terms link updated with acceptance info'
      }
    ]

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
