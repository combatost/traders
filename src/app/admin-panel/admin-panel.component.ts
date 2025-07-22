import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs'
import { map, switchMap, catchError, finalize, tap } from 'rxjs/operators'
import firebase from 'firebase/compat/app'
import { Router } from '@angular/router'

interface User {
  id: string
  fullName: string
  email: string
  online: boolean
  isLocked: boolean
  isAdmin?: boolean
  unlockSince?: any
}

interface ViewModel {
  users: User[]
  onlineCount: number
  loading: boolean
  error: string
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPanelComponent implements OnInit {
  vm$!: Observable<ViewModel>
  private loadingSubject = new BehaviorSubject<boolean>(true)
  private errorSubject = new BehaviorSubject<string>('')
  protected currentAdminId = 'admin-id-placeholder'
  private currentUserId: string | null = null

  displayedColumns: string[] = ['user', 'locked', 'unlockSince', 'online', 'role', 'actions']

  constructor(
    protected firestore: AngularFirestore,
    protected router: Router,
    protected afAuth: AngularFireAuth,
    private cdr: ChangeDetectorRef
  ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid
        this.setOnlineStatus(user.uid, true)
        window.addEventListener('beforeunload', () => {
          this.setOnlineStatus(user.uid, false)
        })
      } else {
        this.currentUserId = null
      }
    })
  }

  ngOnInit(): void {
    this.vm$ = this.loadingSubject.pipe(
      switchMap(() => {
        this.errorSubject.next('')
        return this.firestore
          .collection<User>('users')
          .valueChanges({ idField: 'id' })
          .pipe(
            map(users => users.filter(user => user.email !== 'alikamlion@gmail.com')),
            map(users => {
              const onlineCount = users.filter(u => u.online).length
              return {
                users,
                onlineCount,
                loading: false,
                error: ''
              } as ViewModel
            }),
            catchError(err => {
              this.errorSubject.next('Failed to load users.')
              return of({
                users: [],
                onlineCount: 0,
                loading: false,
                error: 'Failed to load users.'
              } as ViewModel)
            }),
            finalize(() => {
              this.loadingSubject.next(false)
              this.cdr.markForCheck()
            })
          )
      })
    )
  }

  setOnlineStatus(uid: string, status: boolean) {
    this.firestore.collection('users').doc(uid).update({ online: status })
      .catch(err => console.error('Failed to update online status:', err))
  }

  toggleLock(user: User): void {
    const newStatus = !user.isLocked
    const updateData: Partial<User> = {
      isLocked: newStatus,
      unlockSince: newStatus
        ? null
        : firebase.firestore.FieldValue.serverTimestamp()
    }

    this.firestore
      .collection('users')
      .doc(user.id)
      .update(updateData)
      .then(() => {
        this.logActivity(user.id, newStatus ? 'locked' : 'unlocked')
        this.sendSystemNotification(user.id, newStatus ? 'locked' : 'unlocked')
      })
      .catch(err => alert('Error updating lock status: ' + err.message))
  }

  protected logActivity(userId: string, action: string): void {
    this.firestore
      .collection('users')
      .doc(userId)
      .collection('activityLogs')
      .add({
        action,
        timestamp: new Date(),
        adminId: this.currentAdminId,
        details: `User ${action} by admin`
      })
  }

  protected sendSystemNotification(userId: string, action: string): void {
    const message = action === 'locked'
      ? 'Your account has been locked by the admin.'
      : 'Your account has been unlocked by the admin.'

    this.firestore
      .collection(`notifications/${userId}/messages`)
      .add({
        message,
        read: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        adminId: this.currentAdminId
      })
  }

  deleteUser(user: User): void {
    const confirmed = confirm(
      `Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.`
    )
    if (!confirmed) return

    this.firestore
      .collection('users')
      .doc(user.id)
      .delete()
      .then(() => {
        this.loadingSubject.next(true) // trigger reload
      })
      .catch(err => alert('Error deleting user: ' + err.message))
  }

  logout() {
    if (this.currentUserId) {
      this.setOnlineStatus(this.currentUserId, false)
    }
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login'])
    })
  }

  goToSheinTable(): void {
    this.router.navigate(['/sheintable'])
  }
}
