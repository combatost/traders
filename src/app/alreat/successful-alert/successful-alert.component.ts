import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-successful-alert',
  templateUrl: './successful-alert.component.html',
  styleUrl: './successful-alert.component.css'
})
export class SuccessfulAlertComponent {
  @Input() message: string = '';
  visible: boolean = true;

  close() {
    this.visible = false;
  }
}
