require("dotenv").config({ path: "../../../.env" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Stripe = require("stripe");

const app = express();
console.log("Stripe Secret Key:", process.env.SECRET_KEY);
const stripe = Stripe(process.env.SECRET_KEY);

app.use(cors({ origin: "http://localhost:8100" })); // Ionic default port
app.use(bodyParser.json());

app.post("/create-subscription", async (req, res) => {
  const { email, paymentMethodId, priceId } = req.body;

  try {
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (err) {
    res.status(400).send({ error: { message: err.message } });
  }
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
