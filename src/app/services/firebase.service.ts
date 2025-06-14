import { Injectable } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { Router } from '@angular/router'
import { AngularFireDatabase } from '@angular/fire/compat/database'
import firebase from 'firebase/compat/app'

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  isLoggedIn = false
  private userUID: string | null = null

  private unreadNotificationsSubject = new BehaviorSubject<any[]>([])
  unreadNotifications$ = this.unreadNotificationsSubject.asObservable()

  constructor(
    public firebaseAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private realtimeDb: AngularFireDatabase,
    private router: Router
  ) {
    this.firebaseAuth.authState.subscribe(user => {
      if (user) {
        this.userUID = user.uid
        this.setupPresence(user.uid)
        this.subscribeToUnreadNotifications()
      } else {
        this.userUID = null
        this.unreadNotificationsSubject.next([])
      }
    })
  }

 async signin(email: string, password: string): Promise<void> {
  try {
    const res = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
    const uid = res.user?.uid;
    if (!uid) throw new Error('Invalid user ID');

    const doc = await this.firestore.collection('users').doc(uid).get().toPromise();
    const userData = doc?.data() as { isActive?: boolean; role?: string } | undefined;

    if (!userData?.isActive) {
      await this.firebaseAuth.signOut();
      throw new Error('Your account has been disabled by an administrator.');
    }

    this.isLoggedIn = true;
    this.userUID = uid;
    localStorage.setItem('user', JSON.stringify(res.user));
    await this.setUserOnlineStatus(true);

    const role = userData.role || 'user';

    if (role === 'admin') {
      await this.router.navigate(['/admin-panel']);
    } else {
      await this.router.navigate(['/sheintable']);
    }
  } catch (error) {
    console.error('Signin error:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Signin failed.');
    } else {
      throw new Error('Signin failed.');
    }
  }
}


  setupPresence(userId: string) {
    const statusDbRef = this.realtimeDb.object(`status/${userId}`)
    const userFsRef = this.firestore.collection('users').doc(userId)

    const isOffline = {
      online: false,
      lastChanged: firebase.database.ServerValue.TIMESTAMP
    }

    const isOnline = {
      online: true,
      lastChanged: firebase.database.ServerValue.TIMESTAMP
    }

    this.realtimeDb.object('.info/connected').valueChanges().subscribe(connected => {
      if (connected === false || connected === null) return

      // Cancel any previous onDisconnects (optional safety)
      firebase.database().ref().onDisconnect().cancel()

      // Setup onDisconnect to mark offline in RealtimeDB
      statusDbRef.query.ref.onDisconnect().set(isOffline).then(() => {
        // Mark online in RealtimeDB
        statusDbRef.set(isOnline)

        // Mark online in Firestore
        userFsRef.update({ online: true }).catch(err =>
          console.error('Error setting user online in Firestore:', err)
        )
      })
    })

    window.addEventListener('beforeunload', async () => {
      try {
        await userFsRef.update({ online: false })
        await this.realtimeDb.object(`status/${userId}`).set(isOffline)
      } catch (e) {
        console.warn('Could not set offline before unload')
      }
    })
  }
  async signup(email: string, password: string, fullName: string, birthDate: string): Promise<void> {
    try {
      const res = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
      this.isLoggedIn = true;
      this.userUID = res.user?.uid || null;
      localStorage.setItem('user', JSON.stringify(res.user));

      const userData = {
        uid: res.user?.uid,
        fullName,
        birthDate,
        email,
        role: 'user',
        isActive: true,
        isLocked: false,   // optional
        online: true,
        createdAt: new Date()
      };

      await this.firestore.collection('users').doc(res.user!.uid).set(userData); // ✅ Save here

      await this.router.navigate(['/sheintable']);
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error('Signup failed. Please try again later.');
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.userUID) {
        await this.realtimeDb.object(`status/${this.userUID}`).set({
          online: false,
          lastChanged: firebase.database.ServerValue.TIMESTAMP
        })
        await this.setUserOnlineStatus(false)
      }
      await this.firebaseAuth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('user')
    this.userUID = null
  }

  getUserUID(): string | null {
    return this.userUID || (JSON.parse(localStorage.getItem('user') || '{}')?.uid || null)
  }

  async saveUserData(data: any): Promise<void> {
    const userUID = this.getUserUID()
    if (!userUID) {
      console.error('User not authenticated')
      throw new Error('User not authenticated')
    }
    try {
      console.log('Saving data for user:', userUID, data)
      await this.firestore.collection('users').doc(userUID).set(data)
      console.log('User data saved successfully!')
    } catch (error) {
      console.error('Error saving user data:', error)
      throw new Error('Failed to save user data.')
    }
  }

  getUserData(): Observable<any> {
    return this.firebaseAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.collection('users').doc(user.uid).valueChanges()
        }
        return of(null)
      })
    )
  }

  addSheinRecord(record: any): Promise<void> {
    const userId = this.getUserUID()
    if (!userId) return Promise.reject('User not logged in.')

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .add(record)
      .then(() => console.log('Shein record added'))
      .catch(err => {
        console.error('Error adding record:', err)
        throw err
      })
  }

  getSheinRecords(): Observable<any[]> {
    const userId = this.getUserUID()
    if (!userId) throw new Error('User not logged in.')

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .valueChanges({ idField: 'id' })
  }

  updateSheinRecord(recordId: string, data: any): Promise<void> {
    const userId = this.getUserUID()
    if (!userId) return Promise.reject('User not logged in.')

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .doc(recordId)
      .update(data)
  }

  deleteSheinRecord(recordId: string): Promise<void> {
    const userId = this.getUserUID()
    if (!userId) return Promise.reject('User not logged in.')

    return this.firestore
      .collection(`sheinTables/${userId}/records`)
      .doc(recordId)
      .delete()
  }

  async getTotalUserCount(): Promise<number> {
    try {
      const snapshot = await this.firestore.collection('users').get().toPromise()
      return snapshot?.size || 0
    } catch (err) {
      console.error('Failed to fetch user count:', err)
      return 0
    }
  }

  setUserOnlineStatus(online: boolean): Promise<void> {
    const userUID = this.getUserUID()
    if (!userUID) return Promise.resolve()

    return this.firestore.collection('users').doc(userUID).update({
      online,
      lastSeen: new Date()
    }).catch(err => {
      console.error('Error updating online status:', err)
    })
  }

  async getOnlineUserCount(): Promise<number> {
    try {
      const snapshot = await this.firestore.collection('users', ref => ref.where('online', '==', true)).get().toPromise()
      return snapshot?.size || 0
    } catch (err) {
      console.error('Failed to fetch online user count:', err)
      return 0
    }
  }

  subscribeToUnreadNotifications(): void {
    const userId = this.getUserUID()
    if (!userId) {
      console.warn('User not logged in, cannot fetch notifications')
      this.unreadNotificationsSubject.next([])
      return
    }

    this.firestore.collection(`notifications/${userId}/messages`, ref =>
      ref.where('read', '==', false).orderBy('timestamp', 'desc')
    )
      .valueChanges({ idField: 'id' })
      .subscribe(
        notifications => {
          console.log(`Unread notifications for user ${userId}:`, notifications)
          this.unreadNotificationsSubject.next(notifications)
        },
        error => {
          console.error('Error fetching notifications:', error)
          this.unreadNotificationsSubject.next([])
        }
      )
  }

  markNotificationAsRead(notificationId: string): Promise<void> {
    const userId = this.getUserUID()
    if (!userId) return Promise.reject('User not logged in')

    return this.firestore
      .collection(`notifications/${userId}/messages`)
      .doc(notificationId)
      .update({ read: true })
      .catch(err => {
        console.error('Failed to mark notification as read:', err)
        throw err
      })
  }
}
