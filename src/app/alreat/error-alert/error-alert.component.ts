import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  templateUrl: './error-alert.component.html',
  styleUrl: './error-alert.component.css'
})
export class ErrorAlertComponent {

  @Input() message: string = '';
  visible: boolean = true;

  close() {
    this.visible = false;
  }
}
