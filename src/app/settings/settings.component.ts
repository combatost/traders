import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
})
export class SettingsComponent implements OnInit {
  user: any = null;
  userData: any = null;
  newPassword: string = '';
  confirmPassword: string = '';
  showPasswordForm: boolean = false;
  passwordChangeMessage: string = '';

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user from Firebase Auth
    this.afAuth.authState.subscribe((user) => {
      this.user = user;
      if (user?.uid) {
        this.loadUserData(user.uid);
      }
    });
  }

  // Load additional user data from Firestore: users/{uid}
  loadUserData(uid: string): void {
    this.afs
      .collection('users')
      .doc(uid)
      .valueChanges()
      .subscribe((data) => {
        this.userData = data;
      });
  }

  // Show password form
  openPasswordChangeForm(): void {
    this.showPasswordForm = true;
  }

  // Cancel password form
  cancelPasswordChange(): void {
    this.showPasswordForm = false;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // Update Firebase password
  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    this.afAuth.currentUser
      .then((user) => {
        if (user) {
          return user.updatePassword(this.newPassword);
        } else {
          throw new Error('User not found');
        }
      })
      .then(() => {
        this.passwordChangeMessage = 'Password changed successfully!';
        setTimeout(() => {
          this.passwordChangeMessage = '';
          this.cancelPasswordChange();
        }, 2000);
      })
      .catch((err) => {
        alert(`Error: ${err.message}`);
      });
  }

  // Delete account and remove user from Firestore
  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account? This action is irreversible.')) return;

    const uid = this.user?.uid;
    if (!uid) return;

    this.afAuth.currentUser
      .then((user) => {
        // Delete user document from Firestore
        return this.afs.collection('users').doc(uid).delete().then(() => user?.delete());
      })
      .then(() => {
        alert('Account deleted successfully.');
        this.router.navigate(['/login']);
      })
      .catch((err) => alert(`Error: ${err.message}`));
  }

  // Sign out user
  logout(): void {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
