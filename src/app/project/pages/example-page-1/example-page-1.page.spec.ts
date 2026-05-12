import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExamplePage1Page } from './example-page-1.page';

describe('ExamplePage1Page', () => {
  let component: ExamplePage1Page;
  let fixture: ComponentFixture<ExamplePage1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExamplePage1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
