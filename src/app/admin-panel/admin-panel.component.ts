import { Component, OnInit } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import firebase from 'firebase/compat/app'
import { Router } from '@angular/router'

interface User {
  id: string
  fullName: string
  email: string
  online: boolean
  isLocked: boolean
  isAdmin?: boolean
  unlockSince?: any // Firestore timestamp
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.sass']
})
export class AdminPanelComponent implements OnInit {
  users$!: Observable<User[]>
  onlineCount$!: Observable<number>
  loading = false
  error = ''
  protected currentAdminId = 'admin-id-placeholder'
  constructor(
    protected firestore: AngularFirestore,
    protected router: Router,
    protected afAuth: AngularFireAuth
  ) {}



  ngOnInit(): void {
    this.loadUsers()
  }

protected loadUsers(): void {
  this.loading = true
  this.error = ''

  this.users$ = this.firestore
    .collection<User>('users')
    .valueChanges({ idField: 'id' })
    .pipe(
      map(users =>
        users.filter(user => user.email !== 'alikamlion@gmail.com')
      )
    )

  this.onlineCount$ = this.users$.pipe(
    map(users => users.filter(u => u.online).length)
  )

  this.loading = false
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
      .catch(err => alert('Error deleting user: ' + err.message))
  }
  logout() {
  this.afAuth.signOut().then(() => {
    this.router.navigate(['/login']); // or your login route
  });
}goToSheinTable(): void {
  this.router.navigate(['/sheintable'])
}

}
