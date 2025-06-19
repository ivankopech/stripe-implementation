require("dotenv").config({ path: "../../../.env" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.SECRET_KEY);

app.use(cors({ origin: "http://localhost:8100" })); // Ionic default port
app.use(bodyParser.json());

app.post("/create-subscription", async (req, res) => {
  const { email, paymentMethodId, priceId } = req.body;

  try {
    // Crear cliente (opcional, pero bueno para identificar al pagador)
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice", "latest_invoice.payment_intent"],
      collection_method: "charge_automatically",
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    const invoice = subscription.latest_invoice;

    if (invoice.status == "paid") {
      return res.send({
        subscriptionId: subscription.id,
        clientSecret: null,
        invoiceStatus: invoice.status,
        message: "Subscription successful. No confirmation needed.",
      });
    }

    if (!paymentIntent) {
      return res.status(400).send({
        error: {
          message: "No payment intent found. Subscription may be incomplete.",
        },
      });
    }

    return res.send({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      invoiceStatus: invoice.status,
    });
  } catch (err) {
    console.error("Subscription Error:", err);
    res.status(400).send({ error: { message: err.message } });
  }
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
