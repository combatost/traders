import { Component, OnInit } from '@angular/core'
import { AngularFirestore } from '@angular/fire/compat/firestore'
import { ActivatedRoute, Router } from '@angular/router'

interface UserData {
  acceptedTerms?: boolean
}

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.sass']
})
export class TermsComponent implements OnInit {
  uid: string = ''
  isAccepted = false
  termsAccepted = false

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.uid = this.route.snapshot.queryParams['uid']
  }

  async ngOnInit() {
    if (this.uid) {
      const userDoc = await this.firestore.collection('users').doc(this.uid).get().toPromise()
      let data: UserData | undefined = undefined
      if (userDoc && typeof userDoc.data === 'function') {
        data = userDoc.data() as UserData | undefined
      }
      this.termsAccepted = data?.acceptedTerms === true
      if (this.termsAccepted) {
        // Optional: auto navigate if already accepted
        this.router.navigate(['/sheintable'])
      }
    }
  }

  async acceptTerms() {
    if (!this.isAccepted || !this.uid) return

    await this.firestore.collection('users').doc(this.uid).update({
      acceptedTerms: true
    })

    this.termsAccepted = true
    // Optional: navigate after acceptance
    this.router.navigate(['/sheintable'])
  }
}
