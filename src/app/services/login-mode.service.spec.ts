import { TestBed } from '@angular/core/testing';

import { LoginModeService } from './login-mode.service';

describe('LoginModeService', () => {
  let service: LoginModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoginModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
