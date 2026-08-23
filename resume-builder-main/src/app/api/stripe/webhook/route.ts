// // src/app/api/stripe/webhook/route.ts
// // Stripe sends events here after payment — we update Firestore isPro flag

// import { NextRequest } from 'next/server';
// import Stripe from 'stripe';
// import { setUserPro } from '@/lib/userStore';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

// export async function POST(request: NextRequest) {
//   const body = await request.text();
//   const sig  = request.headers.get('stripe-signature')!;

//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
//   } catch (err) {
//     console.error('Webhook signature failed:', err);
//     return new Response('Webhook Error', { status: 400 });
//   }

//   const session = event.data.object as Stripe.Checkout.Session & Stripe.Subscription;

//   switch (event.type) {

//     case 'checkout.session.completed': {
//       // Payment succeeded — mark user as Pro
//       const uid = session.metadata?.uid;
//       if (uid) {
//         await setUserPro(
//           uid,
//           true,
//           session.subscription as string,
//           session.customer as string,
//         );
//       }
//       break;
//     }

//     case 'customer.subscription.deleted':
//     case 'customer.subscription.updated': {
//       // Subscription cancelled or payment failed
//       const sub = event.data.object as Stripe.Subscription;
//       if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'past_due') {
//         const customerId = sub.customer as string;
//         // Look up user by stripeCustomerId — query Firestore
//         const { collection, query, where, getDocs } = await import('firebase/firestore');
//         const { db } = await import('@/lib/firebase');
//         const q = query(collection(db, 'users'), where('stripeCustomerId', '==', customerId));
//         const snap = await getDocs(q);
//         if (!snap.empty) {
//           const uid = snap.docs[0].id;
//           await setUserPro(uid, false);
//         }
//       }
//       break;
//     }
//   }

//   return new Response('ok', { status: 200 });
// }

// // Stripe requires raw body — disable Next.js body parsing
// export const config = { api: { bodyParser: false } };

export {};
