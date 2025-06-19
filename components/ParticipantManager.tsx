'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Crown, Shield, UserX, Volume2, VolumeX } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'guest' | 'producer';
  isRecordingAllowed: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHost: boolean;
  joinedAt: string;
}

interface ParticipantManagerProps {
  participants: Participant[];
  currentUserId: string;
  isCurrentUserHost: boolean;
  onToggleRecording: (participantId: string, allowed: boolean) => void;
  onMuteParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
}

export default function ParticipantManager({
  participants,
  currentUserId,
  isCurrentUserHost,
  onToggleRecording,
  onMuteParticipant,
  onRemoveParticipant,
}: ParticipantManagerProps) {
  return (
    <div className="space-y-3">
      {participants.map((participant) => (
        <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-600 text-white text-sm">
                {participant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">
                {participant.name}
                {participant.id === currentUserId && ' (You)'}
              </p>
              <div className="flex items-center space-x-1">
                {participant.isHost && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Host
                  </Badge>
                )}
                {participant.role === 'producer' && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Producer
                  </Badge>
                )}
                {participant.isMuted && (
                  <Badge variant="destructive" className="text-xs">
                    Muted
                  </Badge>
                )}
                {!participant.isRecordingAllowed && (
                  <Badge variant="outline" className="text-xs">
                    Not Recorded
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {isCurrentUserHost && participant.id !== currentUserId && (
            <div className="flex items-center space-x-2">
              {/* Recording Permission Toggle */}
              <div className="flex items-center space-x-1">
                <Switch
                  checked={participant.isRecordingAllowed}
                  onCheckedChange={(checked) => onToggleRecording(participant.id, checked)}
                  className="scale-75"
                />
                <span className="text-xs text-gray-400">Record</span>
              </div>
              
              {/* Mute/Unmute Button */}
              {onMuteParticipant && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMuteParticipant(participant.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {participant.isMuted ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {/* Remove Participant Button */}
              {onRemoveParticipant && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveParticipant(participant.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}