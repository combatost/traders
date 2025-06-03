import { Component } from '@angular/core';

@Component({
  selector: 'app-blocked-user-card',
  templateUrl: './blocked-user-card.component.html',
  styleUrls: ['./blocked-user-card.component.sass']  // fix typo from styleUrl to styleUrls
})
export class BlockedUserCardComponent {
 paySubscription() {
    window.open('https://whish.money/pay/2yuXKc95D', '_blank');
  }
}
