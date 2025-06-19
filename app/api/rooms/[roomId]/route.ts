import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { Database } from '@/lib/database';

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const { roomId } = params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { action, participantId, isRecordingAllowed } = await request.json();

    // Find meeting
    let meeting = await Database.getMeetingById(roomId);

    if (action === 'checkExists') {
      return NextResponse.json({ exists: !!meeting });
    }

    if (action === 'join') {
      if (!meeting) {
        // Meeting doesn't exist
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }

      // Check if user is already in meeting
      const existingParticipant = meeting.participants.find(p => p.id === decoded.userId);
      
      if (!existingParticipant) {
        // Add participant
        await Database.addParticipantToMeeting(roomId, {
          id: decoded.userId,
          name: decoded.email,
          role: meeting.participants.length === 0 ? 'host' : 'guest',
          isRecordingAllowed: true,
          isMuted: false,
          isVideoOff: false,
          isHost: meeting.participants.length === 0,
          joinedAt: new Date().toISOString(),
        });
        
        // Get updated meeting
        meeting = await Database.getMeetingById(roomId);
      }

      return NextResponse.json({ meeting });
    }

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user is in the meeting
    const participant = meeting.participants.find(p => p.id === decoded.userId);
    if (!participant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (action === 'toggleRecording') {
      // Only host can toggle recording
      if (!participant.isHost) {
        return NextResponse.json({ error: 'Only host can control recording' }, { status: 403 });
      }

      await Database.updateMeeting(roomId, { isRecording: !meeting.isRecording });
      const updatedMeeting = await Database.getMeetingById(roomId);
      return NextResponse.json({ isRecording: updatedMeeting?.isRecording });
    }

    if (action === 'updateParticipantPermission') {
      // Only host can update permissions
      if (!participant.isHost) {
        return NextResponse.json({ error: 'Only host can update permissions' }, { status: 403 });
      }

      await Database.updateParticipant(roomId, participantId, { isRecordingAllowed });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling room action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}