import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Phone, Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, PhoneOff } from "lucide-react";
import "./VideoCall.css";

// Connect to the single backend server on port 8000
const socket = io("http://localhost:8000");

export default function VideoCall({ sessionId, collaboratorName }) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [remoteOffline, setRemoteOffline] = useState(true);
  const [emojis, setEmojis] = useState([]);

  const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  const roomId = sessionId;

  const joinMeeting = async () => {
    try {
      // Create PeerConnection and handlers before acquiring media to avoid race conditions
      peerConnection.current = new RTCPeerConnection(servers);

      peerConnection.current.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setRemoteOffline(false);
        }
      };

      peerConnection.current.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice-candidate", { roomId, candidate: e.candidate });
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current?.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setRemoteOffline(true);
        }
      };

      peerConnection.current.onnegotiationneeded = async () => {
        try {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer });
        } catch (err) {
          console.error('Negotiation error:', err);
        }
      };

      // Request media after handlers are set
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        // Ensure playback starts (some browsers require a play() call)
        try {
          await localVideoRef.current.play();
        } catch (err) {
          // play() may reject due to autoplay policies; ignore
          console.debug('local video play() rejected', err);
        }
      }

      // Add tracks to peer connection
      localStream.getTracks().forEach((track) => {
        try {
          peerConnection.current.addTrack(track, localStream);
        } catch (err) {
          console.warn('Failed to add track', err);
        }
      });

  socket.emit('join-room', roomId, auth?.currentUser?.uid || null);
      setJoined(true);
    } catch (error) {
      console.error("Error joining meeting:", error);
      alert("Could not start video call. Please check camera/microphone permissions.");
    }
  };

  useEffect(() => {
    socket.on("user-joined", async ({ userId, socketId } = {}) => {
      // Another user joined the room. Ensure we have a PeerConnection and local media,
      // then create and send an offer so the new user can answer.
      try {
        if (!peerConnection.current) {
          // create pc and handlers
          peerConnection.current = new RTCPeerConnection(servers);
          peerConnection.current.ontrack = (e) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = e.streams[0];
              try { remoteVideoRef.current.play().catch(() => {}); } catch (err) {}
              setRemoteOffline(false);
            }
          };
          peerConnection.current.onicecandidate = (e) => {
            if (e.candidate) socket.emit('ice-candidate', { roomId, candidate: e.candidate });
          };
        }

        // ensure local media available
        if (!localStreamRef.current) {
          const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = localStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            try { await localVideoRef.current.play(); } catch (e) { console.debug('local play rejected', e); }
          }
          localStream.getTracks().forEach((t) => peerConnection.current.addTrack(t, localStream));
        }

        // create and send offer to the room so the newcomer receives it
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer, from: auth?.currentUser?.uid || null });
      } catch (err) {
        console.error('Error handling user-joined:', err);
      }
    });

    socket.on("offer", async ({ offer }) => {
      try {
        if (!peerConnection.current) {
          // If we don't have a pc yet, create one and set handlers
          peerConnection.current = new RTCPeerConnection(servers);
          peerConnection.current.ontrack = (e) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = e.streams[0];
              // attempt to play remote automatically
              try {
                remoteVideoRef.current.play().catch(() => {});
              } catch (err) {}
              setRemoteOffline(false);
            }
          };
          peerConnection.current.onicecandidate = (e) => {
            if (e.candidate) socket.emit('ice-candidate', { roomId, candidate: e.candidate });
          };
        }

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

        // Ensure local media exists
        if (!localStreamRef.current) {
          const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = localStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            try { await localVideoRef.current.play(); } catch (e) { console.debug('local play rejected', e); }
          }
          localStream.getTracks().forEach((t) => peerConnection.current.addTrack(t, localStream));
        }

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socket.on("answer", async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on("user-left", () => {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        remoteVideoRef.current.srcObject = null;
      }
      setRemoteOffline(true);
    });

    socket.on("emoji-reaction", ({ icon }) => {
      showEmoji(icon);
    });

    // Clean up on component unmount
    return () => {
      endCall(false); // Don't emit leave-room on unmount, only on explicit end call
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("emoji-reaction");
    };
  }, [roomId]);

  const toggleShare = async () => {
    if (!peerConnection.current) return;
    if (!sharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          // if no sender found, add track
          peerConnection.current.addTrack(screenTrack, screenStream);
        }
  screenStreamRef.current = screenStream;
  localVideoRef.current.srcObject = screenStream;
  try { await localVideoRef.current.play(); } catch (e) { console.debug('screen play rejected', e); }
  setSharing(true);
  screenTrack.onended = () => stopShare();
      } catch (err) {
        console.error('Error starting screen share', err);
      }
    } else {
      stopShare();
    }
  };

  const stopShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
      if (localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnection.current?.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && camTrack) {
        try { sender.replaceTrack(camTrack); } catch (err) { console.warn('replaceTrack failed', err); }
      } else if (camTrack) {
        try { peerConnection.current.addTrack(camTrack, localStreamRef.current); } catch (err) { console.warn('addTrack failed', err); }
      }
      localVideoRef.current.srcObject = localStreamRef.current;
      try { await localVideoRef.current.play(); } catch (e) { console.debug('local play rejected', e); }
    }
    setSharing(false);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCameraOn((c) => !c);
  };

  const endCall = (emitLeave = true) => {
    if (emitLeave) {
      socket.emit("leave-room", roomId);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setJoined(false);
    setMuted(false);
    setCameraOn(true);
    setSharing(false);
    setRemoteOffline(true);
  };

  const showEmoji = (icon, send = false) => {
    const id = Date.now();
    setEmojis((prev) => [...prev, { id, icon }]);
    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
    if (send) socket.emit("emoji-reaction", { roomId, icon });
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <Phone className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
        <div>
          <p className="font-semibold mb-2">Ready to start?</p>
          <p className="text-sm text-muted-foreground mb-4">Click the button below to join the video call</p>
          <Button onClick={joinMeeting} size="lg" className="gap-2">
            <Video className="h-4 w-4" />
            Join Video Call
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-container">
      <div className="video-grid">
        <div className="video-wrapper">
          <video ref={localVideoRef} autoPlay playsInline muted></video>
          <div className="name-tag">
            You {sharing ? "(Sharing)" : ""}
          </div>
          {emojis.map((e) => (
            <div key={e.id} className="emoji-float">
              {e.icon}
            </div>
          ))}
        </div>

        <div className="video-wrapper">
          {remoteOffline ? (
            <div className="offline-placeholder">Waiting for peer...</div>
          ) : (
            <video ref={remoteVideoRef} autoPlay playsInline></video>
          )}
          <div className="name-tag">{collaboratorName || "Peer"}</div>
        </div>
      </div>

      <div className="control-bar">
        <Button onClick={toggleMute} title="Mute / Unmute" variant="outline" size="icon" className="control-btn">
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button onClick={toggleCamera} title="Toggle Camera" variant="outline" size="icon" className="control-btn">
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button onClick={toggleShare} title="Share Screen" variant={sharing ? "secondary" : "outline"} size="icon" className="control-btn">
          {sharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
        </Button>
        <Button onClick={() => showEmoji("👍", true)} title="Thumbs Up" variant="outline" size="icon" className="control-btn">
          👍
        </Button>
        <Button onClick={() => showEmoji("👏", true)} title="Clap" variant="outline" size="icon" className="control-btn">
          👏
        </Button>
        <Button onClick={() => showEmoji("😂", true)} title="Laugh" variant="outline" size="icon" className="control-btn">
          😂
        </Button>
        <Button onClick={() => endCall(true)} title="End Call" variant="destructive" size="icon" className="control-btn end">
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}