import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment.local';

@Component({
  selector: 'app-stripe',
  templateUrl: 'stripe.page.html',
  styleUrls: ['stripe.page.scss'],
  standalone: false,
})
export class StripePage implements OnInit {
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  isProcessing = false;

  async ngOnInit() {
    this.stripe = await loadStripe(environment.publicKey);

    if (!this.stripe) {
      console.error('Stripe failed to load');
      return;
    }

    this.elements = this.stripe.elements();
    const cardElement = this.elements.create('card');
    cardElement.mount('#card-element');
  }

  async handlePayment(event: Event) {
    event.preventDefault();
    if (!this.stripe || !this.elements) {
      console.error('Stripe not initialized');
      return;
    }

    this.isProcessing = true;
    const cardElement = this.elements.getElement('card');
    if (!cardElement) {
      console.error('Card element not found');
      this.isProcessing = false;
      return;
    }

    const { paymentMethod, error } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      const errorElement = document.getElementById('card-errors');
      if (errorElement) {
        errorElement.textContent = error.message ?? 'An unknown error ocurred';
      }
      this.isProcessing = false;
      return;
    }

    // Enviar el paymentMethod.id al backend
    const response = await fetch('http://localhost:3000/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ivankopech@gmail.com', // Puedes obtenerlo dinámicamente
        paymentMethodId: paymentMethod.id,
        priceId: 'price_1RbRn4H1k22o1btLpMrELLGC', // Reemplazar con el ID de precio correcto
      }),
    });

    const result = await response.json();
    if (result.error) {
      document.getElementById('card-errors')!.textContent =
        result.error.message;
    } else {
      const { error: confirmError } = await this.stripe.confirmCardPayment(
        result.clientSecret
      );

      if (confirmError) {
        document.getElementById('card-errors')!.textContent =
          confirmError.message ?? 'Confirmation failed';
      } else {
        alert('✅ Subscription started successfully!');
      }
    }

    this.isProcessing = false;
  }
}
