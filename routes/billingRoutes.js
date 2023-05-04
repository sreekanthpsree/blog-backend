require("dotenv").config();
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
// ...



const User = require("../models/Users");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY,{
   timeout: 300000});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
module.exports = (app) => {
  const plans = new Map([
    [1, { price: 40, name: "4 Featured psot", credit: 4 }],
    [2, { price: 80, name: "10 Featured post", credit: 10 }],
    [3, { price: 120, name: "15 Featured post", credit: 15 }],
    [4, { price: 200, name: "30 Featured post", credit: 30 }],
  ]);
  app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
  
  
  app.post("/buyplan", async (req, res) => {
    const userID = req.body.id;
    const selectedPlan = req.body.items;
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        metadata: {
          userId: `${userID}`,
          planId: `${selectedPlan[0].id}`,
        },
        line_items: selectedPlan.map((item) => {
          const storeItem = plans.get(item.id);
          return {
            price_data: {
              currency: "inr",
              product_data: {
                name: storeItem.name,
              },
              unit_amount: storeItem.price * 100,
            },
            quantity: item.quantity,
          };
        }),
        mode: "payment",
        success_url: `${process.env.SERVER_URL}/`,
        cancel_url: `${process.env.SERVER_URL}/`,
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
  app.post("/webhook", express.raw({type: 'application/json'}), async (req, res) => {
    let event;

    try {
      event = req.body;
   if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }
       
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent
        );
        const plan = plans.get(+session.metadata.planId);
        const user = await User.findByIdAndUpdate(
          session.metadata.userId,
          { $inc: { credit: plan.credit } },
          { new: true }
        );
        res.status(200).json(user);
      }
    } catch (err) {
      console.error(err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
};
