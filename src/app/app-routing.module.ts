import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SheintableComponent } from './sheintable/sheintable.component';
import { ClientComponent } from './client/client.component';
import { AboutmeComponent } from './aboutme/aboutme.component';
import { AnalysicComponent } from './analysic/analysic.component';
import { SettingsComponent } from './settings/settings.component';
import { HistoryComponent } from './history/history.component';
import { AuthGuard } from './login/auth.guard';

const routes: Routes = [
  // 🔐 Public route
  { path: 'login', component: LoginComponent },

  // 🏠 Protected Home route
  { path: 'sheintable', component: SheintableComponent, canActivate: [AuthGuard] },

  // 👥 Protected Client route
  { path: 'client', component: ClientComponent, canActivate: [AuthGuard] },

  // 📊 Protected Analytics route
  { path: 'analysic', component: AnalysicComponent, canActivate: [AuthGuard] },

  // 👤 Protected About page
  { path: 'aboutme', component: AboutmeComponent, canActivate: [AuthGuard] },

  // ⚙️ Protected Settings
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },

  // 🕓 Protected History
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },

  // 🚪 Default route redirects to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ❗ Catch-all route to handle unknown paths
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })], // Enables scroll to top on route change
  exports: [RouterModule]
})
export class AppRoutingModule { }
