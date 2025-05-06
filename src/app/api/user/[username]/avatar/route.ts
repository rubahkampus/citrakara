// File: src/app/api/user/[username]/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findUserPublicProfileByUsername } from '@/lib/db/repositories/user.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = await params;
  try {
    const user = await findUserPublicProfileByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', url: null },
        { status: 404 }
      );
    }

    // Return the profile picture URL (or null if not set)
    const url = user.profilePicture || null;
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('GET /api/user/[username]/avatar error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', url: null },
      { status: 500 }
    );
  }
}
