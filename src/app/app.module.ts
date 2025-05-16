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
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http'; // Import necessary HttpClient functions
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
import { SplashComponent } from './splash/splash.component'; // Import your Firebase config

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
    SplashComponent
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



    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,
    HttpClientModule,
    MaterialModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideHttpClient(withFetch()) // Enable fetch API for HttpClient
  ],  
  bootstrap: [AppComponent]
})
export class AppModule { }
