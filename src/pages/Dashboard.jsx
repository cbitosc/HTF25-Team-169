import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, LogOut, User, MessageSquare, Check, X, Bell, Trash2 } from "lucide-react"
import { auth, db } from "../lib/firebase";
import { collection, getDocs, getDoc, query, where, doc, updateDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkills, setSelectedSkills] = useState({})
  const [collaborators, setCollaborators] = useState([])
  const [filteredCollaborators, setFilteredCollaborators] = useState([])
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [sessionRequests, setSessionRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [initialCollaborators, setInitialCollaborators] = useState([]); // To store the default list

useEffect(() => {
    const fetchData = async () => {
      console.log("Dashboard: Starting to fetch data...");
      const user = auth.currentUser;
      const uid = sessionStorage.getItem("uid");
      // IMPORTANT: Need to ensure user is available for getIdToken()
      if (uid && user) { 
        // Fetch current user's data
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          console.log("Dashboard: Current user data found.", userDoc.data());
          setCurrentUser(userDoc.data());
        }

        // Fetch incoming session requests
        const requestsQuery = query(
          collection(db, "sessionRequests"),
          where("recipientId", "==", uid),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        setSessionRequests(requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch notifications for the current user
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("userId", "==", uid)
          // orderBy("createdAt", "desc") // This requires a composite index.
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort on the client side to avoid needing a composite index
        notificationsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setNotifications(notificationsData);

        // --- NEW: Fetch Ranked Collaborators from the new API ---
        try {
          const idToken = await user.getIdToken();
          // Fetch from your new API endpoint
          const response = await fetch('/api/v1/match/collaborators', { 
            headers: {
              'Authorization': `Bearer ${idToken}`, // Pass the token for authMiddleware
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const rankedData = await response.json();
            console.log("Dashboard: Fetched ranked collaborators successfully.", rankedData);
            setInitialCollaborators(rankedData); // Store the initial ranked list
            setFilteredCollaborators(rankedData);
          } else {
            console.error("Failed to fetch ranked collaborators:", response.statusText);
            // Handle 404: Profile not initialized (for new users)
            if (response.status === 404) {
                 alert("Please complete your profile setup to enable matchmaking.");
            }
          }
        } catch (error) {
          console.error("Network or authentication error fetching ranked collaborators:", error);
        }

        // Fetch skills
        const skillsDoc = await getDocs(collection(db, "skills"));
        if (!skillsDoc.empty) {
          setSkillSuggestions(skillsDoc.docs[0].data().list);
        }

        // Fetch recent sessions
        const sessionsCollection = await getDocs(query(collection(db, "sessions"), where("student", "==", uid)));
        const sessionsData = sessionsCollection.docs.map(doc => doc.data());
        setRecentSessions(sessionsData);
      }
    };

    // Need to wait for the auth state to load before calling fetch
    const unsubscribe = auth.onAuthStateChanged((userState) => {
        if (userState) {
            fetchData();
        } else if (sessionStorage.getItem("uid")) {
            // If logged out but uid in session, manually load data for speed (if possible)
            fetchData(); 
        }
    });

    return () => unsubscribe();
  }, []); 

  const handleSkillSelect = (skill, type) => {
    setSelectedSkills((prev) => ({
      ...prev,
      [skill]: prev[skill] === type ? null : type,
    }))
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    const query = searchQuery.trim();
    if (!query) {
      setFilteredCollaborators(initialCollaborators); // Reset to default list if search is empty
      return;
    }

    setIsSearching(true);
    console.log(`Dashboard: Submitting search for "${query}"`);

    try {
      const user = auth.currentUser;
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/v1/match/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (response.ok) {
        const searchResults = await response.json();
        console.log("Dashboard: Received search results:", searchResults);
        setFilteredCollaborators(searchResults);
      } else {
        console.error("Search failed:", response.statusText);
        alert("Search request failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestResponse = async (requestId, accepted) => {
    const request = sessionRequests.find(r => r.id === requestId);
    if (!request || !currentUser) return;

    const requestRef = doc(db, "sessionRequests", requestId);
    try {
      if (accepted) {
        // Create a new session document
        const sessionRef = await addDoc(collection(db, "sessions"), {
          participants: [request.requesterId, request.recipientId],
          skill: "General Session", // Placeholder, can be improved
          createdAt: serverTimestamp(),
          status: "scheduled",
        });
        // Update request status
        await updateDoc(requestRef, { status: "accepted", sessionId: sessionRef.id });

        // Create notification for requester
        await addDoc(collection(db, "notifications"), {
          userId: request.requesterId,
          message: `${currentUser.name} accepted your session request.`,
          type: "request_accepted",
          relatedSessionId: sessionRef.id,
          isRead: false,
          createdAt: serverTimestamp(),
        });

        // Navigate to the new collaboration room
        navigate(`/collaboration/${sessionRef.id}`);
      } else {
        // Just update the status to declined
        await updateDoc(requestRef, { status: "declined" });
        // Create notification for requester
        await addDoc(collection(db, "notifications"), {
          userId: request.requesterId,
          message: `${currentUser.name} declined your session request.`,
          type: "request_declined",
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
      // Remove the request from the local state
      setSessionRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error("Error handling request response:", error);
      alert("Failed to respond to request. Please try again.");
    }
  };

  const handleDismissNotification = async (notificationId) => {
    const notificationRef = doc(db, "notifications", notificationId);
    try {
      await updateDoc(notificationRef, { isRead: true });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                PL
              </div>
              <span className="text-xl font-bold">PeerLearn</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Welcome Back, {currentUser?.name}!</h1>
          <p className="text-muted-foreground">Find peers to learn from and share your expertise</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for skills, people, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Sidebar - Skills & Filters */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Suggested Skills</CardTitle>
                <CardDescription>Select skills to learn or teach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {skillSuggestions.map((skill) => (
                  <div key={skill} className="space-y-2">
                    <div className="text-sm font-medium">{skill}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedSkills[skill] === "learn" ? "default" : "outline"}
                        onClick={() => handleSkillSelect(skill, "learn")}
                        className="flex-1 text-xs"
                      >
                        Learn
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedSkills[skill] === "teach" ? "default" : "outline"}
                        onClick={() => handleSkillSelect(skill, "teach")}
                        className="flex-1 text-xs"
                      >
                        Teach
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Collaborators */}
          <div className="lg:col-span-2 space-y-6">
            {/* Matching Collaborators */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Matching Collaborators</h2>
              <div className="grid gap-4">
                {filteredCollaborators.filter(c => c.userId !== currentUser?.userId).length > 0 ? (
                  filteredCollaborators.filter(c => c.userId !== currentUser?.userId).map((collaborator) => (
                    <Card key={collaborator.userId} className="hover:border-primary/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
                            {collaborator.name.charAt(0)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{collaborator.name}</h3>
                                <p className="text-sm text-muted-foreground">{collaborator.bio?.substring(0, 50) || "Peer Learner"}...</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-lg font-bold text-primary">{collaborator.matchScore}%</div>
                                <p className="text-xs text-muted-foreground">Match Score</p>
                                <p className="text-xs text-muted-foreground">Rating: {collaborator.rating || 0}</p>
                              </div>
                            </div>

                            {/* <p className="text-sm text-muted-foreground mb-3">{collaborator.bio}</p> */}

                            {/* Skills */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Skills Known:</p>
                              <div className="flex flex-wrap gap-2">
                                {collaborator.skillsKnown.map((skill) => (
                                  <span
                                    key={skill}
                                    className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Wants to Learn */}
                            <div className="mb-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Wants to Learn:</p>
                              <div className="flex flex-wrap gap-2">
                                {collaborator.skillsToLearn.map((skill) => (
                                  <span
                                    key={skill}
                                    className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Link to={`/collaborator/${collaborator.userId}`} state={{ collaborator }}>
                                <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                  <User className="h-4 w-4" />
                                  View Profile
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      {isSearching 
                        ? "Searching for the best matches..." 
                        : "No matching collaborators found. Try a different search term or clear the search to see all suggestions."}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Notifications */}
            {notifications.filter(n => !n.isRead).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Notifications</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {notifications.filter(n => !n.isRead).map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <Bell className={`h-5 w-5 ${notification.type === 'request_accepted' ? 'text-green-500' : 'text-red-500'}`} />
                            <div>
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {notification.createdAt?.toDate().toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {notification.type === 'request_accepted' && (
                              <Button asChild size="sm" variant="outline" className="gap-1"><Link to={`/collaboration/${notification.relatedSessionId}`}>Join</Link></Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => handleDismissNotification(notification.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Session Requests */}
            {sessionRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Session Requests</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {sessionRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="font-medium">
                              <Link to={`/collaborator/${request.requesterId}`} className="hover:underline">
                                {request.requesterName}
                              </Link>
                            </p>
                            <p className="text-sm text-muted-foreground">wants to start a session.</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleRequestResponse(request.id, true)}>
                              <Check className="h-4 w-4" /> Accept
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleRequestResponse(request.id, false)}>
                              <X className="h-4 w-4" /> Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Previous Sessions */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Session Requests</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentSessions.map((request, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="font-medium">{request.teacher}</p>
                          <p className="text-sm text-muted-foreground">{request.skill}</p>
                          <p className="text-xs text-muted-foreground mt-1">{request.date}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === "accepted"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            {request.status === "accepted" ? "Accepted" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
