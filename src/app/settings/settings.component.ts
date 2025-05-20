import { Component, OnInit } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component'
import firebase from 'firebase/compat/app'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
})
export class SettingsComponent implements OnInit {
  user: any = null

  userData: any = {
    fullName: '',
    birthDate: '',
    bio: '',
    photoURL: '',
  }

  isEditMode = false
  originalUserData: any = {}

  // Password change fields
  showPasswordForm = false
  oldPassword = ''
  newPassword = ''
  confirmPassword = ''
  passwordChangeMessage = ''

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe((user) => {
      this.user = user
      if (user?.uid) {
        this.loadUserData(user.uid)
      }
    })
  }

  loadUserData(uid: string): void {
    this.afs
      .collection('users')
      .doc(uid)
      .valueChanges()
      .subscribe((data: any) => {
        if (data) {
          this.userData = { ...data }
          this.originalUserData = { ...data }
          if (data.birthDate?.toDate) {
            this.userData.birthDate = data.birthDate.toDate()
            this.originalUserData.birthDate = this.userData.birthDate
          }
          this.isEditMode = false
        }
      })
  }

  enableEdit(): void {
    this.isEditMode = true
  }

  cancelEdit(): void {
    this.userData = { ...this.originalUserData }
    this.isEditMode = false
  }

  async confirmDialog(message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '320px',
      data: { message },
    })
    return await dialogRef.afterClosed().toPromise()
  }

  async saveUserData(): Promise<void> {
    if (!this.user?.uid) return

    try {
      await this.afs.collection('users').doc(this.user.uid).update({
        fullName: this.userData.fullName || '',
        birthDate: this.userData.birthDate || '',
        bio: this.userData.bio || '',
        photoURL: this.userData.photoURL || '',
      })
      await this.confirmDialog('Profile updated successfully.')
      this.originalUserData = { ...this.userData }
      this.isEditMode = false
    } catch (err: any) {
      await this.confirmDialog('Error saving profile: ' + err.message)
    }
  }

  openPasswordChangeForm(): void {
    this.showPasswordForm = true
  }

  cancelPasswordChange(): void {
    this.showPasswordForm = false
    this.oldPassword = ''
    this.newPassword = ''
    this.confirmPassword = ''
    this.passwordChangeMessage = ''
  }

  async changePassword(): Promise<void> {
    if (this.newPassword !== this.confirmPassword) {
      this.passwordChangeMessage = 'Passwords do not match!'
      return
    }

    if (this.newPassword.length < 8) {
      this.passwordChangeMessage = 'Password must be at least 8 characters.'
      return
    }

    const user = await this.afAuth.currentUser
    if (!user || !user.email) {
      this.passwordChangeMessage = 'User not authenticated'
      return
    }

    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      this.oldPassword
    )

    try {
      await user.reauthenticateWithCredential(credential)
      await user.updatePassword(this.newPassword)
      this.passwordChangeMessage = 'Password changed successfully!'
      setTimeout(() => this.cancelPasswordChange(), 2000)
    } catch (err: any) {
      this.passwordChangeMessage = `Error: ${err.message}`
    }
  }

  async deleteAccount(): Promise<void> {
    const confirmed = await this.confirmDialog(
      'Are you sure you want to delete your account? This action is irreversible.'
    )
    if (!confirmed) return

    const uid = this.user?.uid
    if (!uid) return

    const user = await this.afAuth.currentUser
    try {
      await this.afs.collection('users').doc(uid).delete()
      await user?.delete()
      await this.confirmDialog('Account deleted successfully.')
      this.router.navigate(['/login'])
    } catch (err: any) {
      await this.confirmDialog(`Error: ${err.message}`)
    }
  }

  logout(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login'])
    })
  }
}
