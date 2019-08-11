import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'sns-discord-formatter'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('sns-discord-formatter');
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('SNS Discord Formatter');
  });

  it('normalizeDates', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentRef.instance;

    const testData = [
      {
        input: '83/11/29',
        output: '831129',
      },
      {
        input: '1983/11/29',
        output: '19831129',
      },
      {
        input: '1983.11.29',
        output: '19831129',
      },
      {
        input: '83.11.29',
        output: '831129',
      },
      {
        input: '29.11.1983',
        output: '19831129',
      },
      {
        input: '29/11/1983',
        output: '19831129',
      },
      {
        input: '83-11-29',
        output: '831129',
      },
      {
        input: '29-11-1983',
        output: '19831129',
      },
    ];

    testData.forEach(testEntry => {
      const result = component.normalizeDate(testEntry.input);
      expect(result).toBe(testEntry.output);
    });
  })
});
