import { useState, useRef, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db, rtdb } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ref, onValue, off, push, set } from "firebase/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send } from "lucide-react"
import VideoCall from "@/components/VideoCall"

export default function CollaborationPage() {
  const { sessionId } = useParams();
  const [user] = useAuthState(auth)
  const [session, setSession] = useState(null)
  const [collaborator, setCollaborator] = useState(null)

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isCallActive, setIsCallActive] = useState(false)
  const messagesEndRef = useRef(null)

  // Load session and collaborator info
  useEffect(() => {
    if (!sessionId) return

    const load = async () => {
      try {
        const sessionSnap = await getDoc(doc(db, "sessions", sessionId))
        if (sessionSnap.exists()) {
          const s = sessionSnap.data()
          setSession(s)

          // Determine collaborator id (other participant)
          if (user && Array.isArray(s.participants)) {
            const otherId = s.participants.find((pid) => pid !== user.uid)
            if (otherId) {
              const userSnap = await getDoc(doc(db, "users", otherId))
              if (userSnap.exists()) setCollaborator(userSnap.data())
            }
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err)
      }
    }

    load()
  }, [sessionId, user])

  // Build a roomId (stable for two participants) — fallback to sessionId
  const roomId = (user && collaborator) ? [user.uid, collaborator.userId || collaborator.userId || collaborator.uid || ""].sort().join("_") : sessionId

  // Listen for messages in RTDB
  useEffect(() => {
    if (!roomId) return
    const messagesRef = ref(rtdb, `rooms/${roomId}/messages`)

    const handleValue = (snapshot) => {
      const data = snapshot.val()
      const list = []
      if (data) {
        for (const key of Object.keys(data)) {
          list.push({ id: key, ...data[key] })
        }
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      }
      setMessages(list)
    }

    onValue(messagesRef, handleValue)

    return () => {
      off(messagesRef, 'value', handleValue)
    }
  }, [roomId])

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
    if (!newMessage.trim() || !user) return
    try {
      const messagesRef = ref(rtdb, `rooms/${roomId}/messages`)
      await push(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email || 'You',
        text: newMessage.trim(),
        createdAt: Date.now(),
      })
      setNewMessage("")
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const handleStartCall = async () => {
    if (!user || !roomId) {
      setIsCallActive(true)
      return
    }
    setIsCallActive(true)
    try {
      const participantRef = ref(rtdb, `rooms/${roomId}/participants/${user.uid}`)
      await set(participantRef, { joinedAt: Date.now(), name: user.displayName || user.email })
    } catch (err) {
      console.error('Error joining room presence:', err)
    }
  }

  const handleEndCall = async () => {
    setIsCallActive(false)
    if (user && roomId) {
      try {
        const participantRef = ref(rtdb, `rooms/${roomId}/participants/${user.uid}`)
        await set(participantRef, null)
      } catch (err) {
        console.error('Error leaving room presence:', err)
      }
    }
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
            <h1 className="font-semibold">Learning Session with {collaborator?.name || 'Collaborator'}</h1>
            <p className="text-sm text-muted-foreground">{session?.skill || '...'}</p>
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
              <VideoCall sessionId={sessionId} collaboratorName={collaborator?.name} isActive={isCallActive} />
              <div className="p-4">
                {!isCallActive ? (
                  <Button onClick={handleStartCall}>Join Session</Button>
                ) : (
                  <Button variant="destructive" onClick={handleEndCall}>Leave Session</Button>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-80 flex flex-col border border-border rounded-lg bg-card overflow-hidden min-h-0 lg:min-h-96">
          {/* Chat Header */}
          <div className="border-b border-border p-4 flex-shrink-0">
            <h2 className="font-semibold">Session Chat</h2>
            <p className="text-xs text-muted-foreground">with {collaborator?.name || 'Collaborator'}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.senderId === user?.uid
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  }`}
                >
                  {message.senderId !== user?.uid && (
                    <p className="text-xs font-semibold mb-1 opacity-75">{message.senderName}</p>
                  )}
                  <p className="text-sm break-words">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4 space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
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
                disabled={newMessage.trim().length === 0}
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
