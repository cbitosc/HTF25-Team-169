import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, BookOpen, MessageSquare } from "lucide-react"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                PL
              </div>
              <span className="text-xl font-bold">PeerLearn</span>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-6xl">
                  Learn Together, Grow Together
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground">
                  Connect with peers, share expertise, and learn new skills through meaningful one-on-one
                  collaborations. Build your network while mastering what matters to you.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/signup">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative flex h-96 items-center justify-center rounded-2xl border bg-card shadow-sm">
              <div className="space-y-4 text-center">
                <Users className="mx-auto h-16 w-16 text-primary opacity-75" />
                <p className="text-muted-foreground">Peer Learning Community</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/40 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose PeerLearn?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              A platform designed for meaningful skill exchange and professional growth
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Find Your Match",
                description: "Discover peers with complementary skills and learning goals",
              },
              {
                icon: BookOpen,
                title: "Learn & Teach",
                description: "Share your expertise while learning new skills from others",
              },
              {
                icon: MessageSquare,
                title: "Collaborate Seamlessly",
                description: "Chat, schedule sessions, and track your learning progress",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              >
                <feature.icon className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t px-4 py-24 sm:px-6 sm:py-32">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 text-center md:grid-cols-3">
            {[
              { number: "5K+", label: "Active Learners" },
              { number: "500+", label: "Skills Available" },
              { number: "10K+", label: "Sessions Completed" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-lg text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/40 px-4 py-24 sm:px-6 sm:py-32">
        <div className="container mx-auto max-w-4xl space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Start Learning?</h2>
            <p className="text-lg text-muted-foreground">Join our community of peer learners and unlock your potential today</p>
          </div>
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              Create Your Profile <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                  PL
                </div>
                <span className="font-semibold">PeerLearn</span>
              </div>
              <p className="text-sm text-muted-foreground">Learn together, grow together</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Security"] },
              { title: "Company", links: ["About", "Blog", "Careers"] },
              { title: "Resources", links: ["Help", "Community", "Contact"] },
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, linkIdx) => (
                    <li key={linkIdx} className="w-fit">
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row">
            <p>&copy; 2025 PeerLearn. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}