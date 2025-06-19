'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Video, VideoOff, Mic, MicOff, Phone, Users, Settings, SwordIcon as Record, Square, UserX, Volume2, VolumeX, Crown, Shield } from 'lucide-react';
import { 
  FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, 
  FaCircle, FaPhoneSlash, FaDesktop, FaSmile, FaThLarge, 
  FaUser, FaColumns, FaCog, FaUsers, FaEye, FaEyeSlash 
} from 'react-icons/fa';

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

interface MeetingState {
  id: string;
  title: string;
  isRecording: boolean;
  participants: Participant[];
  startTime: string;
  status: 'active' | 'ended';
}

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const [meeting, setMeeting] = useState<MeetingState | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight' | 'sidebar'>('grid');
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [hiddenParticipants, setHiddenParticipants] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
      
      // Define joinMeeting inside useEffect to avoid dependency issues
      const joinMeeting = async () => {
        try {
          // In a real implementation, this would make an API call to join the meeting
          // For demo purposes, we'll create a fake meeting state
          
          // Create demo meeting data
          const demoMeeting = {
            id: roomId,
            title: `Meeting ${roomId}`,
            isRecording: false,
            participants: [
              { 
                id: parsedUser.id, 
                name: parsedUser.name, 
                role: 'host' as const, 
                isRecordingAllowed: true,
                isMuted: !isAudioOn,
                isVideoOff: !isVideoOn,
                isHost: true,
                joinedAt: new Date().toISOString()
              },
              { 
                id: '1', 
                name: 'Jane Doe', 
                role: 'guest' as const, 
                isRecordingAllowed: false,
                isMuted: false,
                isVideoOff: false,
                isHost: false,
                joinedAt: new Date().toISOString()
              },
              { 
                id: '2', 
                name: 'John Smith', 
                role: 'guest' as const, 
                isRecordingAllowed: false,
                isMuted: true,
                isVideoOff: false,
                isHost: false,
                joinedAt: new Date().toISOString()
              },
              { 
                id: '3', 
                name: 'Alice Johnson', 
                role: 'producer' as const, 
                isRecordingAllowed: false,
                isMuted: false,
                isVideoOff: true,
                isHost: false,
                joinedAt: new Date().toISOString()
              },
            ],
            startTime: new Date().toISOString(),
            status: 'active' as const
          };
          
          setMeeting(demoMeeting);
        } catch (error) {
          console.error('Failed to join meeting:', error);
          router.push('/dashboard');
        }
      };
      
      joinMeeting();
      
      // Enumerate available devices and initialize local stream
      const initMedia = async () => {
        await enumerateDevices();
        await initializeLocalStream();
      };
      
      initMedia().catch(error => {
        console.error('Error initializing media:', error);
      });
    } catch (error) {
      console.error('Error initializing meeting:', error);
      router.push('/dashboard');
    }
    
    // Cleanup function to stop all streams when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, router, localStream, screenStream, isAudioOn, isVideoOn]);
  
  const initializeLocalStream = async () => {
    try {
      // Get user media with audio and video
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setLocalStream(stream);
      
      // Set the stream to the video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Update state based on initial tracks
      setIsAudioOn(!stream.getAudioTracks()[0]?.muted);
      setIsVideoOn(stream.getVideoTracks()[0]?.enabled);
      
      console.log('Local stream initialized successfully');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setIsAudioOn(false);
      setIsVideoOn(false);
    }
  };
  
  const enumerateDevices = async () => {
    try {
      // Request permission for media devices
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioIn = devices.filter(device => device.kind === 'audioinput');
      const audioOut = devices.filter(device => device.kind === 'audiooutput');
      const videoIn = devices.filter(device => device.kind === 'videoinput');
      
      setAudioInputs(audioIn);
      setAudioOutputs(audioOut);
      setVideoInputs(videoIn);
      
      // Set defaults
      if (audioIn.length > 0) setSelectedAudioInput(audioIn[0].deviceId);
      if (audioOut.length > 0) setSelectedAudioOutput(audioOut[0].deviceId);
      if (videoIn.length > 0) setSelectedVideoInput(videoIn[0].deviceId);
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  };



  const toggleRecording = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ action: 'toggleRecording' }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMeeting(prev => prev ? { ...prev, isRecording: data.isRecording } : null);
      }
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  };

  const toggleParticipantRecording = async (participantId: string, allowed: boolean) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ 
          action: 'updateParticipantPermission',
          participantId,
          isRecordingAllowed: allowed
        }),
      });

      if (response.ok) {
        setMeeting(prev => {
          if (!prev) return null;
          return {
            ...prev,
            participants: prev.participants.map(p => 
              p.id === participantId ? { ...p, isRecordingAllowed: allowed } : p
            )
          };
        });
      }
    } catch (error) {
      console.error('Failed to update participant permission:', error);
    }
  };

  const leaveMeeting = () => {
    router.push('/dashboard');
  };
  
  const toggleScreenSharing = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {

          },
          audio: false
        });
        
        // Handle the case when user cancels the screen share dialog
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
        
        setScreenStream(stream);
        setIsScreenSharing(true);
        console.log('Screen sharing started');
      } else {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }
        setIsScreenSharing(false);
        console.log('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setIsScreenSharing(false);
    }
  };
  
  const sendEmoji = (emoji: string) => {
    // In a real implementation, this would send the emoji to all participants
    console.log('Emoji sent:', emoji);
    setShowEmojiPicker(false);
  };
  
  const changeLayout = (mode: 'grid' | 'spotlight' | 'sidebar') => {
    setLayoutMode(mode);
  };
  
  const toggleParticipantVisibility = (participantId: string) => {
    setHiddenParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        return [...prev, participantId];
      }
    });
  };
  
  const changeAudioInput = async (deviceId: string) => {
    try {
      setSelectedAudioInput(deviceId);
      
      // Stop current audio tracks
      if (localStream) {
        localStream.getAudioTracks().forEach(track => track.stop());
      }
      
      // Get new audio track with selected device
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      // Replace the audio track in the local stream
      if (localStream) {
        const audioTrack = newStream.getAudioTracks()[0];
        const oldAudioTracks = localStream.getAudioTracks();
        
        if (oldAudioTracks.length > 0) {
          localStream.removeTrack(oldAudioTracks[0]);
        }
        
        localStream.addTrack(audioTrack);
        setIsAudioOn(true);
      }
      
      console.log('Audio input changed to:', deviceId);
    } catch (error) {
      console.error('Error changing audio input:', error);
    }
  };
  
  const changeAudioOutput = (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    
    // Set audio output device if the browser supports it
    if (localVideoRef.current && 'setSinkId' in HTMLMediaElement.prototype) {
      try {
        // TypeScript doesn't recognize setSinkId by default
        (localVideoRef.current as any).setSinkId(deviceId);
        console.log('Audio output changed to:', deviceId);
      } catch (error) {
        console.error('Error changing audio output:', error);
      }
    } else {
      console.warn('Audio output device selection not supported by this browser');
    }
  };
  
  const changeVideoInput = async (deviceId: string) => {
    try {
      setSelectedVideoInput(deviceId);
      
      // Stop current video tracks
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
      }
      
      // Get new video track with selected device
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Replace the video track in the local stream
      if (localStream) {
        const videoTrack = newStream.getVideoTracks()[0];
        const oldVideoTracks = localStream.getVideoTracks();
        
        if (oldVideoTracks.length > 0) {
          localStream.removeTrack(oldVideoTracks[0]);
        }
        
        localStream.addTrack(videoTrack);
        
        // Update the video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
        setIsVideoOn(true);
      }
      
      console.log('Video input changed to:', deviceId);
    } catch (error) {
      console.error('Error changing video input:', error);
    }
  };

  const isCurrentUserHost = () => {
    if (!meeting || !currentUser) return false;
    const participant = meeting.participants.find(p => p.id === currentUser.id);
    return participant?.isHost || false;
  };

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Joining meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">{meeting.title}</h1>
            <Badge variant={meeting.isRecording ? "destructive" : "secondary"}>
              {meeting.isRecording ? (
                <>
                  <Record className="h-3 w-3 mr-1 animate-pulse" />
                  Recording
                </>
              ) : (
                'Not Recording'
              )}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Room ID: {roomId}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Users className="h-4 w-4 mr-2" />
              {meeting.participants.length}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className={`
              ${layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
              ${layoutMode === 'spotlight' ? 'grid grid-cols-1' : ''}
              ${layoutMode === 'sidebar' ? 'flex flex-row' : ''}
              gap-4 h-full
            `}>
              {meeting.participants
                .filter(participant => !hiddenParticipants.includes(participant.id))
                .map((participant, index) => (
                  <Card 
                    key={participant.id} 
                    className={`
                      bg-gray-800 border-gray-700 relative
                      ${layoutMode === 'spotlight' && index === 0 ? 'col-span-full row-span-2' : ''}
                      ${layoutMode === 'sidebar' ? (index === 0 ? 'w-3/4' : 'w-1/4') : ''}
                    `}
                  >
                    <CardContent className="p-4 h-full flex items-center justify-center">
                      {participant.id === currentUser?.id ? (
                        <div className="w-full h-full bg-black">
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <Avatar className="w-16 h-16 mx-auto mb-2">
                            <AvatarFallback className="bg-gray-600 text-white">
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{participant.name}</p>
                          <div className="flex items-center justify-center space-x-1 mt-2">
                            {participant.isHost && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                            {participant.role === 'producer' && (
                              <Shield className="h-3 w-3 text-blue-500" />
                            )}
                            {participant.isMuted && (
                              <MicOff className="h-3 w-3 text-red-500" />
                            )}
                            {participant.isVideoOff && (
                              <VideoOff className="h-3 w-3 text-red-500" />
                            )}
                            {isScreenSharing && participant.id === currentUser?.id && (
                              <FaDesktop className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 rounded-lg">
              {/* Audio control */}
              <button
                onClick={() => {
                  if (localStream) {
                    const audioTracks = localStream.getAudioTracks();
                    if (audioTracks.length > 0) {
                      audioTracks[0].enabled = !isAudioOn;
                      setIsAudioOn(!isAudioOn);
                    }
                  }
                }}
                className={`p-3 rounded-full ${isAudioOn ? 'bg-green-500' : 'bg-red-500'}`}
                title={isAudioOn ? 'Mute' : 'Unmute'}
              >
                {isAudioOn ? (
                  <FaMicrophone className="text-white" />
                ) : (
                  <FaMicrophoneSlash className="text-white" />
                )}
              </button>
              
              {/* Video control */}
              <button
                onClick={() => {
                  if (localStream) {
                    const videoTracks = localStream.getVideoTracks();
                    if (videoTracks.length > 0) {
                      videoTracks[0].enabled = !isVideoOn;
                      setIsVideoOn(!isVideoOn);
                    }
                  }
                }}
                className={`p-3 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-red-500'}`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoOn ? (
                  <FaVideo className="text-white" />
                ) : (
                  <FaVideoSlash className="text-white" />
                )}
              </button>
              
              {/* Screen sharing */}
              <button
                onClick={toggleScreenSharing}
                className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-500' : 'bg-gray-600'}`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <FaDesktop className="text-white" />
              </button>
              
              {/* Emoji reactions */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-3 rounded-full ${showEmojiPicker ? 'bg-yellow-500' : 'bg-gray-600'}`}
                title="Emoji reactions"
              >
                <FaSmile className="text-white" />
              </button>
              
              {/* Layout options */}
              <div className="relative">
                <button
                  onClick={() => setLayoutMode(layoutMode === 'grid' ? 'spotlight' : layoutMode === 'spotlight' ? 'sidebar' : 'grid')}
                  className="p-3 rounded-full bg-gray-600"
                  title="Change layout"
                >
                  {layoutMode === 'grid' ? (
                    <FaThLarge className="text-white" />
                  ) : layoutMode === 'spotlight' ? (
                    <FaUser className="text-white" />
                  ) : (
                    <FaColumns className="text-white" />
                  )}
                </button>
              </div>
              
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-full ${showSettings ? 'bg-blue-500' : 'bg-gray-600'}`}
                title="Settings"
              >
                <FaCog className="text-white" />
              </button>
              
              {/* Participants list */}
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-3 rounded-full ${showParticipants ? 'bg-blue-500' : 'bg-gray-600'}`}
                title="Participants"
              >
                <FaUsers className="text-white" />
              </button>
              
              {/* Recording (host only) */}
              {isCurrentUserHost() && (
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-full ${meeting?.isRecording ? 'bg-red-500' : 'bg-gray-600'}`}
                  title={meeting?.isRecording ? 'Stop recording' : 'Start recording'}
                >
                  <FaCircle className="text-white" />
                </button>
              )}
              
              {/* Leave meeting */}
              <button
                onClick={leaveMeeting}
                className="p-3 rounded-full bg-red-500"
                title="Leave meeting"
              >
                <FaPhoneSlash className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg z-10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Send Emoji</h3>
              <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {['👍', '👏', '❤️', '😂', '😮', '😢', '🎉', '👋', '🙏', '🔥', '💯', '⭐'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendEmoji(emoji)}
                  className="text-2xl p-2 hover:bg-gray-700 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute bottom-24 right-4 bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg z-10 w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Microphone settings */}
              <div>
                <label className="block text-sm font-medium mb-2">Microphone</label>
                <select 
                  value={selectedAudioInput} 
                  onChange={(e) => changeAudioInput(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
                >
                  {audioInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${audioInputs.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Speaker settings */}
              <div>
                <label className="block text-sm font-medium mb-2">Speaker</label>
                <select 
                  value={selectedAudioOutput} 
                  onChange={(e) => changeAudioOutput(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
                >
                  {audioOutputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Speaker ${audioOutputs.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Camera settings */}
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <select 
                  value={selectedVideoInput} 
                  onChange={(e) => changeVideoInput(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm"
                >
                  {videoInputs.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${videoInputs.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">Participants ({meeting.participants.length})</h3>
            <div className="space-y-3">
              {meeting.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-600 text-white text-sm">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{participant.name}</p>
                      <div className="flex items-center space-x-1">
                        {participant.isHost && (
                          <Badge variant="secondary" className="text-xs">Host</Badge>
                        )}
                        {participant.role === 'producer' && (
                          <Badge variant="outline" className="text-xs">Producer</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Toggle participant visibility */}
                    <button
                      onClick={() => toggleParticipantVisibility(participant.id)}
                      className="p-1 rounded-full bg-gray-700 hover:bg-gray-600"
                      title={hiddenParticipants.includes(participant.id) ? 'Show participant' : 'Hide participant'}
                    >
                      {hiddenParticipants.includes(participant.id) ? (
                        <FaEyeSlash className="h-4 w-4 text-white" />
                      ) : (
                        <FaEye className="h-4 w-4 text-white" />
                      )}
                    </button>
                    
                    {/* Toggle recording permission (host only) */}
                    {isCurrentUserHost() && participant.id !== currentUser.id && (
                      <div className="flex items-center space-x-1">
                        <Switch
                          checked={participant.isRecordingAllowed}
                          onCheckedChange={(checked) => toggleParticipantRecording(participant.id, checked)}
                          className="scale-75"
                        />
                        <span className="text-xs text-gray-400">Record</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}