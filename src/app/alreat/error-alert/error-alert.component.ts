import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  templateUrl: './error-alert.component.html',
  styleUrls: ['./error-alert.component.css']
})
export class ErrorAlertComponent {
  @Input() message: string = '';
  visible: boolean = true;

  show(message?: string) {
    if (message) this.message = message;
    this.visible = true;
  }

  close() {
    this.visible = false;
  }
}
