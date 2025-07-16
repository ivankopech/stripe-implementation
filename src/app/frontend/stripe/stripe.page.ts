import { Component, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment.local';
import { AlertController, NavController } from '@ionic/angular';

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

  constructor(
    private alertController: AlertController,
    private navController: NavController
  ) {}

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
    try {
      const cardElement = this.elements.getElement('card');
      if (!cardElement) throw new Error('Card element not found');

      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        await this.presentAlert(
          'Error',
          error.message ?? 'Payment method error'
        );
        return;
      }

      // Enviar el paymentMethod.id al backend
      const response = await fetch(
        'http://localhost:3000/create-subscription',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'ivankopech@gmail.com', // Puedes obtenerlo dinámicamente
            paymentMethodId: paymentMethod.id,
            priceId: 'price_1RbRn4H1k22o1btLpMrELLGC', // Reemplazar con el ID de precio correcto
          }),
        }
      );
      const result = await response.json();

      console.log('backend result: ', result);

      if (result.error) {
        await this.presentAlert('Error', result.error.message);
        return;
      }

      if (!result.clientSecret) {
        if (result.invoiceStatus === 'paid') {
          await this.presentAlert(
            'Exito',
            '✅ Suscription generated successfully.'
          );
          this.navController.back();
          return;
        } else {
          await this.presentAlert('Error', 'Could not complete payment');
          return;
        }
      }

      if (!result.clientSecret || typeof result.clientSecret !== 'string') {
        await this.presentAlert('Error', 'invalid client secret');
        return;
      }

      console.log('client secret:', result.clientSecret);

      const { error: confirmError } = await this.stripe.confirmCardPayment(
        result.clientSecret
      );

      if (confirmError) {
        await this.presentAlert(
          'Error',
          confirmError.message ?? 'Error while confirming payment'
        );
      } else {
        await this.presentAlert('Error', '✅ Suscription confirmed');
        this.navController.back();
      }
    } catch (err: any) {
      await this.presentAlert(
        'Error',
        err.message ?? 'An unexpected error ocurred'
      );
    } finally {
      this.isProcessing = false;
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
