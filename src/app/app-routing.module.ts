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
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ListComponent } from './list/list.component';


const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // { path: 'window', component: WindowComponent, canActivate: [AuthGuard] }, 
  { path: 'sheintable', component: SheintableComponent, canActivate: [AuthGuard] },
  { path: 'client', component: ClientComponent, canActivate: [AuthGuard] },
  { path: 'client-details/:id', component: ClientDetailComponent, canActivate: [AuthGuard] },
  { path: 'clients', component: ListComponent, canActivate: [AuthGuard] },
  { path: 'analysic', component: AnalysicComponent, canActivate: [AuthGuard] },
  { path: 'aboutme', component: AboutmeComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })], // Enables scroll to top on route change
  exports: [RouterModule]
})
export class AppRoutingModule { }
