import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionYieldsComponent } from './option-yields.component';

describe('OptionYieldsComponent', () => {
  let component: OptionYieldsComponent;
  let fixture: ComponentFixture<OptionYieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptionYieldsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionYieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
