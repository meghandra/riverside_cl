import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { Database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's meetings
    const userMeetings = await Database.getMeetingsByUserId(decoded.userId);

    return NextResponse.json({ meetings: userMeetings });
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { action, title } = await request.json();

    if (action === 'create') {
      const roomId = Date.now().toString();
      const meeting = await Database.createMeeting({

        title: title || 'Untitled Meeting',
        status: 'active',
        isRecording: false,
        participants: [
          {
            id: decoded.userId,
            name: decoded.email, // Use email as name for now
            role: 'host',
            isRecordingAllowed: true,
            isMuted: false,
            isVideoOff: false,
            isHost: true,
            joinedAt: new Date().toISOString(),
          }
        ],
        startTime: new Date().toISOString(),
        maxParticipants: 10,
        hostId: decoded.userId
      });

      return NextResponse.json({ roomId: meeting.id, meeting });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Rooms POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}