import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { ClusterComponent } from './cluster/cluster.component';
import { DestinationComponent } from './destination/destination.component';
import {CommonModule} from "@angular/common"
import { FormsModule } from '@angular/forms';
@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    CommonModule
  ],
  declarations: [
    AppComponent,
    MapComponent,
    ClusterComponent,
    DestinationComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
