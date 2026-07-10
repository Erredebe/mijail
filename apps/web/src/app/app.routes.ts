import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog.component';
import { ChatComponent } from './features/chat/chat.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'catalog',
    component: CatalogComponent,
  },
  {
    path: 'chat',
    component: ChatComponent,
  },
];
