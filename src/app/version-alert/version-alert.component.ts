import { Component, OnInit, OnDestroy } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Subscription, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'

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

  public static appVersion = '2.8.4' // update on new release

  version = VersionAlertComponent.appVersion

  versionMessage: string[] = [
    '🚀 New features and improvements',
    '🔒 Enhanced security measures',
    '🐛 Bug fixes and performance enhancements',
    '📱 Improved mobile experience',

  ]

  firebaseService: any

  constructor(private afs: AngularFirestore, private auth: AngularFireAuth) { }

  ngOnInit() {
    this.auth.user.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid

        this.subscribeToUserState(user.uid)

        this.firebaseService.subscribeToUnreadNotifications()

        this.firebaseService.unreadNotifications$.subscribe((notifications: Notification[]) => {
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
