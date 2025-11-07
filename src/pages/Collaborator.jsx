import { useState, useEffect } from "react"
import { Link, useParams, useLocation } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Star, MessageSquare, Calendar, Award, ThumbsUp } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function CollaboratorProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSent, setRequestSent] = useState(false);
  const [collaborator, setCollaborator] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [endorsements, setEndorsements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (location.state?.collaborator) {
        // If collaborator data is passed from the dashboard, use it directly.
        setCollaborator(location.state.collaborator);
      } else {
        // Fallback to fetching from Firestore if the page is accessed directly.
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          setCollaborator(userDoc.data());
        } else {
          console.error("CollaboratorProfilePage: No collaborator found with ID:", id);
        }
      }
    };

    fetchData();
  }, [id, location.state]);

  useEffect(() => {
    if (!collaborator) return;
    // Fetch sub-collections once collaborator data is available.
    const fetchSubCollections = async () => {
      const certsCollection = await getDocs(collection(db, "users", id, "certifications"));
      setCertifications(certsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const endorsementsCollection = await getDocs(collection(db, "users", id, "endorsements"));
      setEndorsements(endorsementsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const feedbacksCollection = await getDocs(collection(db, "users", id, "feedbacks"));
      setFeedbacks(feedbacksCollection.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchSubCollections();
  }, [collaborator, id]);

  useEffect(() => {
    if (!user || !collaborator) return;

    const checkRequestExists = async () => {
      const requestsQuery = query(
        collection(db, "sessionRequests"),
        where("requesterId", "==", user.uid),
        where("recipientId", "==", id),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(requestsQuery);
      if (!snapshot.empty) {
        setRequestSent(true);
      }
    };
    checkRequestExists();
  }, [user, collaborator, id]);

  const handleRequestSession = async () => {
    if (!user || !collaborator) {
      alert("You must be logged in to request a session.");
      return;
    }
    setIsRequesting(true);
    try {
      await addDoc(collection(db, "sessionRequests"), {
        requesterId: user.uid,
        requesterName: user.displayName || "Anonymous",
        recipientId: id,
        recipientName: collaborator.name,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestSent(true);
    } catch (error) {
      console.error("Error sending session request:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!collaborator) {
    return <div>Loading...</div>; // Or a proper loader
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary text-4xl font-bold flex-shrink-0">
              {collaborator.name.charAt(0)}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{collaborator.name}</h1>
                  <p className="text-muted-foreground">{collaborator.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <span className="font-bold">{collaborator.rating || 0}</span>
                    <span className="text-muted-foreground">({collaborator.totalReviews || 0} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">{collaborator.bio}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-2xl font-bold text-primary">{collaborator.totalSessions || 0}</p>
                  <p className="text-xs text-muted-foreground">Sessions Completed</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-2xl font-bold text-primary">{collaborator.totalSessions || 0}</p>
                  <p className="text-xs text-muted-foreground">Sessions Taught</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-2xl font-bold text-primary">{collaborator.totalReviews || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={handleRequestSession} disabled={isRequesting || requestSent} className="gap-2 w-full sm:w-auto">
                  <Calendar className="h-4 w-4" />
                  {requestSent ? "Request Sent" : isRequesting ? "Sending..." : "Request Session"}
                </Button>
                <Button size="lg" variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Qualification</h4>
                  <p className="text-muted-foreground">{collaborator.qualification}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                    >
                      <img
                        src={cert.image || "/placeholder.svg"}
                        alt={cert.name}
                        className="w-full h-24 object-cover rounded mb-3"
                      />
                      <p className="font-semibold text-sm mb-1">{cert.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{cert.issuer}</p>
                      <p className="text-xs text-muted-foreground">Issued: {cert.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Skills Known</h4>
                  <div className="flex flex-wrap gap-2">
                    {(collaborator.skillsKnown || []).map((skill) => (
                      <span
                        key={skill}
                        className="inline-block rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Wants to Learn</h4>
                  <div className="flex flex-wrap gap-2">
                    {(collaborator.skillsToLearn || []).map((skill) => (
                      <span
                        key={skill}
                        className="inline-block rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Endorsements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {endorsements.map((endorsement) => (
                    <div
                      key={endorsement.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                        {endorsement.endorsedBy.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{endorsement.endorsedBy}</p>
                        <p className="text-xs text-muted-foreground">endorsed for</p>
                      </div>
                      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary flex-shrink-0">
                        {endorsement.skill}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feedbacks */}
            <Card>
              <CardHeader>
                <CardTitle>Feedbacks & Reviews</CardTitle>
                <CardDescription>{feedbacks.length} reviews from collaborators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedbacks.map((feedback, idx) => (
                  <div key={idx} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{feedback.author}</p>
                        <p className="text-xs text-muted-foreground">{feedback.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(feedback.rating) ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{feedback.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Personal Info */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium">{collaborator.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Age</p>
                  <p className="font-medium">{collaborator.age}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                  <p className="font-medium text-sm break-all">{collaborator.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {(collaborator.languages || []).map((lang) => (
                      <span key={lang} className="inline-block rounded-full bg-secondary/10 px-2 py-1 text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Available From</p>
                  <p className="font-medium text-sm">{collaborator.availabilityDate}</p>
                  <p className="font-medium text-sm">{collaborator.availabilityTime}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
