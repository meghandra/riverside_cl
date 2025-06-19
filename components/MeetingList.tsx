'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Copy, Play } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'guest' | 'producer';
  isRecordingAllowed: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHost: boolean;
  joinedAt: string;
  leftAt?: string;
}

interface Meeting {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'ended';
  participants: Participant[];
  maxParticipants: number;
  createdAt: string;
  scheduledAt?: string;
  duration?: string;
}

interface MeetingListProps {
  meetings: Meeting[];
  onJoinMeeting: (roomId: string) => void;
  onCopyRoomId: (roomId: string) => void;
}

export default function MeetingList({ meetings, onJoinMeeting, onCopyRoomId }: MeetingListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No meetings yet. Create your first meeting to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {meeting.participants.length}/{meeting.maxParticipants}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {meeting.duration || 'No duration'}
                  </span>
                  <span>ID: {meeting.id}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyRoomId(meeting.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {meeting.status === 'active' ? (
                  <Button
                    onClick={() => onJoinMeeting(meeting.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => onJoinMeeting(meeting.id)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}