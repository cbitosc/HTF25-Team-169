import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, X } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, collection, addDoc, getDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const [user, authLoading, authError] = useAuthState(auth)
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    certification: "",
    qualification: "",
    bio: "",
    skillsKnown: [],
    skillsToLearn: [],
    languages: [],
    availabilityDate: "",
    availabilityTime: "",
    gender: "",
    age: "",
    email: "",
  })

  const [newSkillKnown, setNewSkillKnown] = useState("")
  const [newSkillToLearn, setNewSkillToLearn] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return // Wait until auth state is loaded
    if (!user) {
      navigate("/login") // Redirect if not logged in
      return
    }

    const fetchUserProfile = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // If profile exists, load it into the form for editing
        setFormData(userDocSnap.data());
      } else {
        // If no profile, pre-fill form for initial setup
        setFormData((prev) => ({
          ...prev,
          name: user.displayName || "",
          email: user.email || "",
          // Generate a unique ID only for a new user
          id: prev.id || "PL-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        }));
      }
    };

    fetchUserProfile();

  }, [user, authLoading, navigate])


  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addSkillKnown = () => {
    if (newSkillKnown.trim()) {
      setFormData((prev) => ({
        ...prev,
        skillsKnown: [...prev.skillsKnown, newSkillKnown.trim()],
      }))
      setNewSkillKnown("")
    }
  }

  const removeSkillKnown = (index) => {
    setFormData((prev) => ({
      ...prev,
      skillsKnown: prev.skillsKnown.filter((_, i) => i !== index),
    }))
  }

  const addSkillToLearn = () => {
    if (newSkillToLearn.trim()) {
      setFormData((prev) => ({
        ...prev,
        skillsToLearn: [...prev.skillsToLearn, newSkillToLearn.trim()],
      }))
      setNewSkillToLearn("")
    }
  }

  const removeSkillToLearn = (index) => {
    setFormData((prev) => ({
      ...prev,
      skillsToLearn: prev.skillsToLearn.filter((_, i) => i !== index),
    }))
  }

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()],
      }))
      setNewLanguage("")
    }
  }

  const removeLanguage = (index) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("No authenticated user found")
      }

      // Prepare the user data with additional fields
      const userData = {
        ...formData,
        userId: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isProfileComplete: true,
        rating: 0,
        totalSessions: 0,
        totalHours: 0,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }

      // The certification field is a string, but the profile page expects a sub-collection.
      // For simplicity, this will add a new certification on each save if the field is filled.
      const { certification, ...profileDataToSave } = userData;

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), profileDataToSave)

      // Store the user's UID in session storage for use across the app
      sessionStorage.setItem("uid", user.uid);

      // If a certification was entered, add it to the sub-collection
      if (certification) {
        const certsCollectionRef = collection(db, "users", user.uid, "certifications");
        await addDoc(certsCollectionRef, {
          name: certification,
          issuer: "Self-declared", // Or some default value
          date: new Date().toLocaleDateString(),
          image: "/placeholder.svg"
        });
      }
      
      // Navigate to dashboard after successful setup
      navigate("/profile") // Navigate back to the profile page to see changes
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Profile Setup Form */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Help other learners get to know you and find the perfect match for collaboration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your essential profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="id" className="text-sm font-medium">
                      Profile ID (Auto-generated)
                    </label>
                    <Input id="id" name="id" value={formData.id} disabled className="bg-muted" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email (Read-only)
                    </label>
                    <Input id="email" name="email" value={formData.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="age" className="text-sm font-medium">
                      Age
                    </label>
                    <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Education & Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Education & Credentials</CardTitle>
                <CardDescription>Your qualifications and certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="qualification" className="text-sm font-medium">
                    Qualification
                  </label>
                  <Input
                    id="qualification"
                    name="qualification"
                    placeholder="e.g., Bachelor's in Computer Science"
                    value={formData.qualification}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="certification" className="text-sm font-medium">
                    Certification
                  </label>
                  <Input
                    id="certification"
                    name="certification"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={formData.certification}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>About You</CardTitle>
                <CardDescription>Tell others about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="bio" className="text-sm font-medium">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    placeholder="Share your background, interests, and what you're passionate about..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>What you know and what you want to learn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skills Known */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Skills You Know</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., Python, Design)"
                      value={newSkillKnown}
                      onChange={(e) => setNewSkillKnown(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkillKnown())}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSkillKnown}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsKnown.map((skill, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillKnown(idx)}
                          className="text-primary hover:text-primary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills to Learn */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Skills You Want to Learn</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., Machine Learning, Design)"
                      value={newSkillToLearn}
                      onChange={(e) => setNewSkillToLearn(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkillToLearn())}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSkillToLearn}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsToLearn.map((skill, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillToLearn(idx)}
                          className="text-accent hover:text-accent/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Languages & Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Languages & Availability</CardTitle>
                <CardDescription>Languages you speak and when you're available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Languages */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Languages Known</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a language (e.g., English, Spanish)"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addLanguage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((lang, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeLanguage(idx)}
                          className="text-secondary hover:text-secondary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="availabilityDate" className="text-sm font-medium">
                      Available From (Date)
                    </label>
                    <Input
                      id="availabilityDate"
                      name="availabilityDate"
                      type="date"
                      value={formData.availabilityDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="availabilityTime" className="text-sm font-medium">
                      Preferred Time
                    </label>
                    <Input
                      id="availabilityTime"
                      name="availabilityTime"
                      type="time"
                      value={formData.availabilityTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" size="lg" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving Profile..." : "Save Profile"}
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <Link to="/dashboard">Skip for Now</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
