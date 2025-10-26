import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { plan, email, name, amount } = await request.json();

    if (!plan || !email || !name || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a short, unique receipt (max 40 characters)
    const shortEmail = email.split('@')[0].slice(0, 15);
    const uniqueId = uuidv4().slice(0, 8);
    const receipt = `rcpt_${shortEmail}_${uniqueId}`.slice(0, 40);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: parseInt(amount),
      currency: 'INR',
      receipt: receipt,
      notes: { email, name, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: `Razorpay error: ${error.error.description}` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}