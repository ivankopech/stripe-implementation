import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StripePage } from './stripe.page';
import { RouterModule } from '@angular/router';
import { ExploreContainerComponentModule } from '../../frontend/explore-container/explore-container.module';

import { StripePageRoutingModule } from './stripe-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    StripePageRoutingModule,
    RouterModule.forChild([{ path: '', component: StripePage }]),
  ],
  declarations: [StripePage],
})
export class StripePageModule {}
