import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, source, rating, comment, contactRequested = false } = body ?? {};

    if (!leadId || !source || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'leadId, source, and numeric rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        leadId,
        source,
        rating,
        comment: comment?.trim() || null,
        contactRequested: Boolean(contactRequested),
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'failed to capture feedback' }, { status: 500 });
  }
}
