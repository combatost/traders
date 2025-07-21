import { Component, forwardRef } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'app-location-input',
  templateUrl: './location-input.component.html',
  styleUrls: ['./location-input.component.sass'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationInputComponent),
      multi: true
    }
  ]
})
export class LocationInputComponent implements ControlValueAccessor {
  value: string = ''
  isDisabled: boolean = false

  onChange = (value: any) => {}
  onTouched = () => {}

  writeValue(value: any): void {
    this.value = value || ''
  }

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled
  }

  updateValue(event: Event) {
    const newValue = (event.target as HTMLInputElement).value
    this.value = newValue
    this.onChange(newValue)
    this.onTouched()
  }
}
