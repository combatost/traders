import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavigationComponent } from './navigation/navigation.component';
import { SheintableComponent } from './sheintable/sheintable.component';
import { AboutmeComponent } from './aboutme/aboutme.component';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { LoginComponent } from './login/login.component';
import { HttpClient, HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http'; // Import necessary HttpClient functions
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from './material/material.module';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { SettingsComponent } from './settings/settings.component';
import { AnalysicComponent } from './analysic/analysic.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { firebaseConfig } from './services/firebase-config';
import { ClientComponent } from './client/client.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { HistoryComponent } from './history/history.component';
import { SplashComponent } from './splash/splash.component';
import { FooterComponent } from './footer/footer.component'; // Import your Firebase config
import { Directionality } from '@angular/cdk/bidi';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { SuccessfulAlertComponent } from './alreat/successful-alert/successful-alert.component';
import { ErrorAlertComponent } from './alreat/error-alert/error-alert.component';
import { NgChartsModule } from 'ng2-charts';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgParticlesModule } from "ng-particles";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ListComponent } from './list/list.component';
import { VersionAlertComponent } from './version-alert/version-alert.component';
import { TermsComponent } from './terms/terms.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BlockedUserCardComponent } from './blocked-user-card/blocked-user-card.component';




export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    SheintableComponent,
    AboutmeComponent,
    LoginComponent,
    SettingsComponent,
    AnalysicComponent,
    ConfirmationDialogComponent,
    ClientComponent,
    LoaderComponent,
    HistoryComponent,
    SplashComponent,
    FooterComponent,
    SuccessfulAlertComponent,
    ErrorAlertComponent,
    ClientDetailComponent,
    ListComponent,
    VersionAlertComponent,
    TermsComponent,
    AdminPanelComponent,
    BlockedUserCardComponent,

  ],
  imports: [
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyBordW3FDRtiqFD4VlJXqdl2XrUZzV-j2o",
      authDomain: "loginshein-e7033.firebaseapp.com",
      projectId: "loginshein-e7033",
      storageBucket: "loginshein-e7033.appspot.com",
      messagingSenderId: "435758152351",
      appId: "1:435758152351:web:c13ece8239dc1bf62fc0aa",
      measurementId: "G-20LVKBMFHK"
    }),

    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),


    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,
    HttpClientModule,
    MaterialModule,
    MatButtonToggleModule,
    NgChartsModule,
    MatDatepickerModule,
    NgParticlesModule,
    BrowserAnimationsModule,
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideHttpClient(withFetch()), // Enable fetch API for HttpClient
    { provide: Directionality, useFactory: () => new Directionality('rtl') }

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
