// // src/app/api/stripe/create-checkout/route.ts
// import { NextRequest } from 'next/server';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

// export async function POST(request: NextRequest) {
//   try {
//     const { uid, email } = await request.json();

//     if (!uid || !email) {
//       return Response.json({ error: 'uid and email are required' }, { status: 400 });
//     }

//     const session = await stripe.checkout.sessions.create({
//       mode: 'subscription',
//       payment_method_types: ['card'], // card covers Visa, Mastercard, Amex etc
//       customer_email: email,
//       line_items: [
//         {
//           price: process.env.STRIPE_PRICE_ID!, // your $9/month price ID
//           quantity: 1,
//         },
//       ],
//       metadata: { uid }, // we read this in the webhook to find the user
//       success_url: `${process.env.NEXT_PUBLIC_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url:  `${process.env.NEXT_PUBLIC_URL}/?cancelled=true`,
//     });

//     return Response.json({ url: session.url });

//   } catch (error: unknown) {
//     console.error('Stripe checkout error:', error);
//     return Response.json({ error: 'Failed to create checkout session.' }, { status: 500 });
//   }
// }

export {};
