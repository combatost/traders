import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.sass'
})
export class LoaderComponent {
  @Input() isLoading: boolean = true;
  @Input() message: string = 'Loading...';
}
