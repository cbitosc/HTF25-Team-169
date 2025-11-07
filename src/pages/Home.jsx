import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, BookOpen, MessageSquare } from "lucide-react"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                PL
              </div>
              <span className="text-xl font-bold">PeerLearn</span>
            </div>
            <div className="flex items-center gap-4">
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
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                  Learn Together, Grow Together
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg text-pretty">
                  Connect with peers, share expertise, and learn new skills through meaningful one-on-one
                  collaborations. Build your network while mastering what matters to you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border flex items-center justify-center">
              <div className="text-center space-y-4">
                <Users className="h-16 w-16 mx-auto text-primary opacity-50" />
                <p className="text-muted-foreground">Peer Learning Community</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8 bg-card/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">Why Choose PeerLearn?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                className="rounded-xl border border-border bg-background p-6 hover:border-primary/50 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            {[
              { number: "5K+", label: "Active Learners" },
              { number: "500+", label: "Skills Available" },
              { number: "10K+", label: "Sessions Completed" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Start Learning?</h2>
            <p className="text-lg opacity-90">Join our community of peer learners and unlock your potential today</p>
          </div>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Create Your Profile <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12 sm:px-6 lg:px-8 bg-card/50">
        <div className="mx-auto max-w-7xl">
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
                    <li key={linkIdx}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 PeerLearn. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
