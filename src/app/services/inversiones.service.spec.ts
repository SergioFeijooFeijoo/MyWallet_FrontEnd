import { TestBed } from '@angular/core/testing';

import { InversionesService } from './inversiones.service';

describe('InversionesService', () => {
  let service: InversionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InversionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
