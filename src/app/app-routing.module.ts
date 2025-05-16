import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SheintableComponent } from './sheintable/sheintable.component';
import { AboutmeComponent } from './aboutme/aboutme.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './login/auth.guard'; // Import the AuthGuard
import { SettingsComponent } from './settings/settings.component';
import { AnalysicComponent } from './analysic/analysic.component';
import { ClientComponent } from './client/client.component';
import { HistoryComponent } from './history/history.component';

const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },  // Redirect to login if no path
    { path: 'login', component: LoginComponent },
    { path: 'sheintable', component: SheintableComponent, canActivate: [AuthGuard] }, 
    { path: 'client', component: ClientComponent, canActivate: [AuthGuard] },  // Guarded route
    { path: 'aboutme', component: AboutmeComponent, canActivate: [AuthGuard] },  // Guarded route
    { path: 'analysic', component: AnalysicComponent, canActivate: [AuthGuard] },  // Guarded route
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
    { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '/login' }  // Catch-all route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Configure routes
  exports: [RouterModule] // Export the configured router module
})
export class AppRoutingModule { }
