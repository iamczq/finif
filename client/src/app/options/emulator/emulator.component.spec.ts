import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmulatorComponent } from './emulator.component';

describe('EmulatorComponent', () => {
  let component: EmulatorComponent;
  let fixture: ComponentFixture<EmulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmulatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
