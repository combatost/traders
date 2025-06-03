import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';  // <-- Added
import { Router } from '@angular/router';

interface UserData {
  isLocked?: boolean;
  // add more user properties if needed
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent {
  isSignedIn = false;
  isSignup = false;
  isLoading = false;
  passwordVisible = false;
  showForgotPasswordLink = true;

  // Alert state
  showSuccess = false;
  showError = false;
  successMessage = '';
  errorMessage = '';

  // Form fields
  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  birthDate = '';

  private passwordResetIntervalId: any = null;

  constructor(
    public firebaseServices: FirebaseService,
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,  // <-- Added
    private router: Router
  ) { }

  ngOnInit() {
    this.auth.authState.subscribe(async (user) => {
      if (user) {
        this.isSignedIn = true;
        const email = user.email?.toLowerCase();

        // Check if user is admin or not
        if (email === 'alikamlion@gmail.com') {
          this.router.navigate(['/admin-panel'], { replaceUrl: true });
        } else {
          this.router.navigate(['/sheintable'], { replaceUrl: true });
        }
      } else {
        this.isSignedIn = false;
      }
    });
  }


  async onSignup(email: string, password: string, confirmPassword: string) {
    this.resetAlerts();

    if (!this.isValidEmail(email)) {
      return this.showErrorAlert('Please enter a valid email address.');
    }

    if (password !== confirmPassword) {
      return this.showErrorAlert('Passwords do not match.');
    }

    if (!this.fullName || !this.birthDate) {
      return this.showErrorAlert('Please fill in all the fields.');
    }

    try {
      this.isLoading = true;
      await this.firebaseServices.signup(email, password, this.fullName, this.birthDate);
      this.isLoading = false;

      if (this.firebaseServices.isLoggedIn) {
        this.isSignedIn = true;
        this.router.navigate(['/sheintable']);
        this.showSuccessAlert('Account created successfully!');
      } else {
        this.showErrorAlert('Signup failed. Please try again.');
      }
    } catch (error: any) {
      this.isLoading = false;
      if (error.code === 'auth/email-already-in-use') {
        this.showErrorAlert('Email address is already in use.');
      } else {
        this.showErrorAlert('Error during signup.');
      }
    }
  }

  async onSignin(email: string, password: string) {
    this.resetAlerts();

    if (!this.isValidEmail(email)) {
      return this.showErrorAlert('Please enter a valid email address.');
    }

    try {
      this.isLoading = true;

      // Sign in via FirebaseService (or you can directly use AngularFireAuth)
      const cred = await this.auth.signInWithEmailAndPassword(email, password);

      if (!cred.user) {
        this.isLoading = false;
        return this.showErrorAlert('Login failed. Please try again.');
      }

      // Check if user is locked in Firestore
      const docSnap = await this.firestore.collection('users').doc<UserData>(cred.user.uid).get().toPromise();

      let userData: UserData | null = null;
      if (docSnap && docSnap.exists) {
        userData = docSnap.data() ?? null;
      }

      if (userData?.isLocked) {
        await this.auth.signOut();
        this.isLoading = false;
        return this.showErrorAlert('Your account has been locked. Please contact support.');
      }

      this.isSignedIn = true;
      this.isLoading = false;

      if (email.trim().toLowerCase() === 'alikamlion@gmail.com') {
        this.router.navigate(['/admin-panel']);
      } else {
        this.router.navigate(['/sheintable']);
      }
    } catch (err: any) {
      this.isLoading = false;
      console.error('Login error:', err);
      this.showErrorAlert('Please check your email or password.');
    }
  }

  onForgotPassword(email: string) {
    this.resetAlerts();

    if (!email) {
      return this.showErrorAlert('Please enter your email address first.');
    }

    const lastTime = +localStorage.getItem('passwordResetLastRequestTime')!;
    const now = Date.now();

    if (lastTime && now - lastTime < 60000) {
      this.startCountdown(lastTime);
    } else {
      this.auth.sendPasswordResetEmail(email).then(() => {
        localStorage.setItem('passwordResetLastRequestTime', now.toString());
        this.showSuccessAlert('Password reset email sent successfully');
        this.startCountdown(now);
      }).catch(error => {
        this.showErrorAlert(`Error sending reset email: ${error.message}`);
      });
    }
  }

  private startCountdown(start: number) {
    if (this.passwordResetIntervalId) clearInterval(this.passwordResetIntervalId);

    this.passwordResetIntervalId = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.ceil((60000 - (now - start)) / 1000);
      if (secondsLeft > 0) {
        this.showErrorAlert(`Please wait ${secondsLeft} seconds before retrying.`);
      } else {
        clearInterval(this.passwordResetIntervalId);
        this.passwordResetIntervalId = null;
        this.resetAlerts();
        localStorage.removeItem('passwordResetLastRequestTime');
      }
    }, 1000);
  }

  toggleSignup() {
    this.isSignup = !this.isSignup;
    this.resetAlerts();
    this.passwordVisible = false;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  handleLogout() {
    this.firebaseServices.logout();
    this.isSignedIn = false;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showSuccessAlert(message: string) {
    this.successMessage = message;
    this.showSuccess = true;
    setTimeout(() => (this.showSuccess = false), 3000);
  }

  private showErrorAlert(message: string) {
    this.errorMessage = message;
    this.showError = true;
    setTimeout(() => (this.showError = false), 3000);
  }

  private resetAlerts() {
    this.successMessage = '';
    this.errorMessage = '';
    this.showSuccess = false;
    this.showError = false;
    if (this.passwordResetIntervalId) {
      clearInterval(this.passwordResetIntervalId);
      this.passwordResetIntervalId = null;
    }
  }
}
