import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit2, Award, ThumbsUp } from "lucide-react"
import { auth, db } from "../lib/firebase"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

export default function UserProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [endorsements, setEndorsements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const uid = sessionStorage.getItem("uid");
      if (uid) {
        // Fetch user profile
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());

          // Fetch certifications
          const certsCollection = await getDocs(collection(db, "users", uid, "certifications"));
          const certsData = certsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCertifications(certsData);

          // Fetch endorsements
          const endorsementsCollection = await getDocs(collection(db, "users", uid, "endorsements"));
          const endorsementsData = endorsementsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEndorsements(endorsementsData);
        }
      }
    };

    fetchData();
  }, []);

  if (!userProfile) {
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
          <div className="flex flex-col sm:flex-row gap-6 items-start justify-between">
            <div className="flex gap-6 items-start flex-1">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary text-4xl font-bold flex-shrink-0">
                {userProfile.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{userProfile.name}</h1>
                <p className="text-muted-foreground">{userProfile.id}</p>
                <p className="text-sm text-muted-foreground mt-2">{userProfile.email}</p>
              </div>
            </div>
            <Link to="/profile/edit">
              <Button className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">{userProfile.rating || 0}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">{userProfile.totalReviews || 0}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">{userProfile.totalSessions || 0}</p>
              <p className="text-xs text-muted-foreground">Sessions Learned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">{userProfile.totalSessions || 0}</p>
              <p className="text-xs text-muted-foreground">Sessions Taught</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{userProfile.bio}</p>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle>Education & Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">Qualification</p>
                  <p className="text-muted-foreground">{userProfile.qualification}</p>
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
                    {userProfile.skillsKnown.map((skill) => (
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
                    {userProfile.skillsToLearn.map((skill) => (
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Personal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium">{userProfile.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Age</p>
                  <p className="font-medium">{userProfile.age}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.languages.map((lang) => (
                      <span key={lang} className="inline-block rounded-full bg-secondary/10 px-2 py-1 text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
