import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent {
  isSignedIn = false;
  isSignup = false;
  isLoading = false;
  signupMessage = '';
  message = '';
  passwordVisible = false;
  showForgotPasswordLink = true;
  email = '';
  password = '';
  confirmPassword = '';
  fullName = '';
  birthDate = '';

  constructor(public firebaseServices: FirebaseService, private auth: AngularFireAuth) {}

  ngOnInit() {
    this.auth.authState.subscribe(user => {
      this.isSignedIn = !!user;
    });
  }

  async onSignup(email: string, password: string, confirmPassword: string) {
    if (!this.isValidEmail(email)) {
      this.signupMessage = 'Please enter a valid email address.';
      return;
    }

    if (password !== confirmPassword) {
      this.signupMessage = 'Passwords do not match.';
      return;
    }

    if (!this.fullName || !this.birthDate) {
      this.signupMessage = 'Please fill in all the fields.';
      return;
    }

    try {
      this.isLoading = true;
      // Pass fullName and birthDate along with email and password
      await this.firebaseServices.signup(email, password, this.fullName, this.birthDate);  
      this.isLoading = false;

      if (this.firebaseServices.isLoggedIn) {
        this.isSignedIn = true;
        this.signupMessage = 'Account created successfully!';
        setTimeout(() => (this.signupMessage = ''), 3000);
      } else {
        this.signupMessage = 'Signup failed. Please try again.';
      }
    } catch (error: any) {
      this.isLoading = false;
      if (error.code === 'auth/email-already-in-use') {
        this.signupMessage = 'Email address is already in use.';
      } else {
        this.signupMessage = 'Error during signup.';
      }
    }
  }

  async onSignin(email: string, password: string) {
    if (!this.isValidEmail(email)) {
      this.signupMessage = 'Please enter a valid email address.';
      return;
    }

    try {
      this.isLoading = true;
      await this.firebaseServices.signin(email, password);

      setTimeout(() => {
        this.isLoading = false;
        this.isSignedIn = this.firebaseServices.isLoggedIn;
        if (!this.isSignedIn) {
          this.signupMessage = 'Login failed. Please try again.';
        }
      }, 3000);
    } catch {
      this.isLoading = false;
      this.signupMessage = 'Please check your email or password';
      setTimeout(() => (this.signupMessage = ''), 2000);
    }
  }

  toggleSignup() {
    this.isSignup = !this.isSignup;
    this.signupMessage = '';
    this.passwordVisible = false;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onForgotPassword(email: string) {
    if (!email) {
      this.message = 'Please enter your email address first.';
      return;
    }

    const lastTime = +localStorage.getItem('passwordResetLastRequestTime')!;
    const now = Date.now();

    if (lastTime && now - lastTime < 60000) {
      this.displayCountdown(lastTime);
    } else {
      this.auth.sendPasswordResetEmail(email).then(() => {
        localStorage.setItem('passwordResetLastRequestTime', now.toString());
        this.message = 'Password reset email sent successfully';
      }).catch(error => {
        this.message = `Error sending reset email: ${error.message}`;
      });
    }
  }

  private displayCountdown(start: number) {
    const interval = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.ceil((60000 - (now - start)) / 1000);
      if (secondsLeft > 0) {
        this.message = `Please wait ${secondsLeft} seconds before retrying.`;
      } else {
        clearInterval(interval);
        this.message = '';
        localStorage.removeItem('passwordResetLastRequestTime');
      }
    }, 1000);
  }

  handleLogout() {
    this.firebaseServices.logout();
    this.isSignedIn = false;
  }

  signupWithGoogle() {
    // TODO: Call FirebaseService for Google signup
    alert('Google Sign Up not implemented yet.');
  }

  signupWithApple() {
    // TODO: Implement Apple Sign-In if needed
    alert('Apple Sign Up not implemented yet.');
  }
}
