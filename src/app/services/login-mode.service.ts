import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class LoginModeService {
  private storageKey = 'loginMode'
  private modeSource: BehaviorSubject<string>
  currentMode$

  constructor() {
    const mode = this.getStoredMode()
    this.modeSource = new BehaviorSubject<string>(mode)
    this.currentMode$ = this.modeSource.asObservable()
  }

  setMode(mode: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, mode)
    }
    this.modeSource.next(mode)
  }

  getStoredMode(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.storageKey) || 'shein'
    }
    return 'shein'
  }
}
