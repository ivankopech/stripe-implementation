import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

@Component({
  selector: 'app-stripe',
  templateUrl: 'stripe.page.html',
  styleUrls: ['stripe.page.scss'],
  standalone: false,
})
export class StripePage implements OnInit {
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;

  async ngOnInit() {
    this.stripe = await loadStripe('pk_test'); // insert public key

    if (!this.stripe) {
      console.error('Stripe failed to load');
      return;
    }

    // initialize elements
    this.elements = this.stripe.elements();

    // create and mount the card element
    const cardElement = this.elements.create('card');
    cardElement.mount('#card-element');
  }

  handleDummyPayment() {
    alert('processing payment');
  }
}
