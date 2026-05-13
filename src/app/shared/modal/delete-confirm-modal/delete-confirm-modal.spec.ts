import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteConfirmModalComponent } from './delete-confirm-modal';

describe('DeleteConfirmModalComponent', () => {
  let component: DeleteConfirmModalComponent;
  let fixture: ComponentFixture<DeleteConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmModalComponent);
    fixture.componentRef.setInput('isOpen', true);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
