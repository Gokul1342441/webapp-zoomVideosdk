import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MeetingRoomComponent } from './component/meeting-room/meeting-room.component';

const routes: Routes = [
  { path: 'meets', component: MeetingRoomComponent }  // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
