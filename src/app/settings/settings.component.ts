import { Component, OnInit } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { Router } from '@angular/router'

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

  // Password change form controls
  showPasswordForm = false
  newPassword = ''
  confirmPassword = ''
  passwordChangeMessage = ''

  originalUserData: any = {}

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
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
          // Convert Firestore timestamp to JS Date if needed
          if (data.birthDate && data.birthDate.toDate) {
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
    // Reset to original user data when canceling the edit
    this.userData = { ...this.originalUserData }
    this.isEditMode = false
  }

  saveUserData(): void {
    if (!this.user?.uid) return

    this.afs
      .collection('users')
      .doc(this.user.uid)
      .update({
        fullName: this.userData.fullName || '',
        birthDate: this.userData.birthDate || '',
        bio: this.userData.bio || '',
        photoURL: this.userData.photoURL || '',
      })
      .then(() => {
        alert('Profile updated!')
        this.originalUserData = { ...this.userData }
        this.isEditMode = false
      })
      .catch((err) => alert('Error saving profile: ' + err.message))
  }

  openPasswordChangeForm(): void {
    this.showPasswordForm = true
  }

  cancelPasswordChange(): void {
    this.showPasswordForm = false
    this.newPassword = ''
    this.confirmPassword = ''
    this.passwordChangeMessage = ''
  }

  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    if (this.newPassword.length < 8) {
      alert('Password must be at least 8 characters.')
      return
    }

    this.afAuth.currentUser
      .then((user) => {
        if (user) {
          return user.updatePassword(this.newPassword)
        } else {
          throw new Error('User not found')
        }
      })
      .then(() => {
        this.passwordChangeMessage = 'Password changed successfully!'
        setTimeout(() => {
          this.cancelPasswordChange()
        }, 2000)
      })
      .catch((err) => {
        alert(`Error: ${err.message}`)
      })
  }

  deleteAccount(): void {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action is irreversible.'
      )
    )
      return

    const uid = this.user?.uid
    if (!uid) return

    this.afAuth.currentUser
      .then((user) => {
        return this.afs
          .collection('users')
          .doc(uid)
          .delete()
          .then(() => user?.delete())
      })
      .then(() => {
        alert('Account deleted successfully.')
        this.router.navigate(['/login'])
      })
      .catch((err) => alert(`Error: ${err.message}`))
  }

  logout(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login'])
    })
  }
}
