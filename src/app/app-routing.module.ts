import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LoginComponent } from './login/login.component'
import { SheintableComponent } from './sheintable/sheintable.component'
import { ClientComponent } from './client/client.component'
import { AboutmeComponent } from './aboutme/aboutme.component'
import { AnalysicComponent } from './analysic/analysic.component'
import { SettingsComponent } from './settings/settings.component'
import { HistoryComponent } from './history/history.component'
import { AuthGuard } from './login/auth.guard'
import { ClientDetailComponent } from './client-detail/client-detail.component'
import { ListComponent } from './list/list.component'
import { TermsComponent } from './terms/terms.component'
import { AdminPanelComponent } from './admin-panel/admin-panel.component'
import { AdminGuard } from './login/admin.guard'
import { SplashComponent } from './splash/splash.component'
import { NoAuthGuard } from './login/noauth.guard'
import { WindowSplashComponent } from './window-splash/window-splash.component'

const routes: Routes = [
  {
    path: 'window-splash',
    component: WindowSplashComponent
  },

  {
    path: '',
    component: SplashComponent,
    canActivate: [NoAuthGuard], // for non-logged-in users
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard],
  },
  {
    path: 'admin-panel',
    component: AdminPanelComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'shien',
    component: SheintableComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'client',
    component: ClientComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'client-details/:id',
    component: ClientDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'clients',
    component: ListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analysic',
    component: AnalysicComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'aboutme',
    component: AboutmeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'terms',
    component: TermsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
]




@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
