import { useState, useRef, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import { useDocumentData, useDocumentDataOnce } from "react-firebase-hooks/firestore"
import { auth, db, rtdb } from "@/lib/firebase"
import { doc } from "firebase/firestore"
import { ref, onValue, off, push, serverTimestamp } from "firebase/database"
import io from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send } from "lucide-react"
import VideoCall from "@/components/VideoCall"

const socket = io("http://localhost:8000");

const Message = ({ message, isUser }) => (
  <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
    <div
      className={`max-w-xs rounded-lg px-4 py-2 ${
        isUser
          ? "bg-primary text-primary-foreground rounded-br-none"
          : "bg-muted text-muted-foreground rounded-bl-none"
      }`}
    >
      {!isUser && <p className="text-xs font-semibold mb-1 opacity-75">{message.senderName}</p>}
      <p className="text-sm break-words">{message.text}</p>
      <sub className="text-xs opacity-70 mt-1 block text-right">
        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Sending..."}
      </sub>
    </div>
  </div>
)

export default function CollaborationPage() {
  const { sessionId } = useParams();
  const [user] = useAuthState(auth);

  // Fetch session data from Firestore
  const sessionRef = doc(db, "sessions", sessionId);
  const [session, sessionLoading] = useDocumentData(sessionRef);

  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null)

  // Dynamically find the other participant's ID
  const collaboratorId = session?.participants?.find(id => id !== user?.uid);
  
  // Fetch the collaborator's profile data
  const collaboratorRef = collaboratorId ? doc(db, "users", collaboratorId) : null;
  const [collaborator] = useDocumentData(collaboratorRef);
  
  // Fetch the current user's profile data once
  const currentUserRef = user ? doc(db, "users", user.uid) : null;
  const [currentUserProfile, currentUserLoading] = useDocumentDataOnce(currentUserRef);

  // Create a consistent room ID by sorting the UIDs
  const roomId = user && collaboratorId ? [user.uid, collaboratorId].sort().join('_') : null;

  useEffect(() => {
    if (!roomId || !user?.uid) return;

    const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);

    // Listener for new messages
    const handleNewMessage = (snapshot) => {
      const messagesData = snapshot.val();
      const messagesList = [];
      if (messagesData) {
        for (const key in messagesData) {
          messagesList.push({ id: key, ...messagesData[key] });
        }
        messagesList.sort((a, b) => a.createdAt - b.createdAt);
      }
      setMessages(messagesList);
    };

    // Join socket room and set up listener
    socket.emit("join-room", roomId, user.uid);
    onValue(messagesRef, handleNewMessage);

    // Cleanup on component unmount
    return () => {
      off(messagesRef, "value", handleNewMessage);
      socket.emit("leave-room", roomId, user.uid);
    };
  }, [roomId, user?.uid]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 0)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !user || !currentUserProfile || !roomId) {
      return
    }

    const messageData = {
      senderId: user.uid,
      senderName: currentUserProfile.name || "Anonymous",
      text: newMessage.trim(),
      createdAt: serverTimestamp(), // Firebase RTDB server timestamp
    };

    try {
      // Send message to server to be broadcasted and stored
      socket.emit("send-message", { roomId, message: messageData });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  }

  if (sessionLoading || currentUserLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Session...</div>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <h1 className="font-semibold">Learning Session with {collaborator?.name || "Collaborator"}</h1>
            <p className="text-sm text-muted-foreground">{session?.skill || "..."}</p>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        {/* Video/Call Section */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Video Container */}
          <Card className="flex-1 bg-black/5 border-2 border-border overflow-hidden flex flex-col min-h-0">
            <CardContent className="flex-1 p-0 relative">
              <VideoCall sessionId={sessionId} collaboratorName={collaborator?.name} />
            </CardContent>
          </Card>

        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-80 flex flex-col border border-border rounded-lg bg-card overflow-hidden min-h-0 lg:min-h-96">
          {/* Chat Header */}
          <div className="border-b border-border p-4 flex-shrink-0">
            <h2 className="font-semibold">Session Chat</h2>
            <p className="text-xs text-muted-foreground">with {collaborator?.name || "Collaborator"}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg, index) => (
              <Message key={msg.id || index} message={msg} isUser={msg.senderId === user?.uid} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4 space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                disabled={currentUserLoading || !collaborator}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={newMessage.trim() === "" || currentUserLoading || !collaborator}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Press Enter to send</p>
          </div>
        </div>
      </div>
    </div>
  )
}