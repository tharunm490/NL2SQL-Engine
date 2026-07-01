import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Brain, Shield, Database, BarChart3, Zap, GitBranch,
  Terminal, Lock, Users, Server, Cloud, BookOpen,
  ArrowRight, CheckCircle, ChevronRight, Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI SQL Generation",
    description: "Describe what you need in plain English and get production-ready SQL instantly. Powered by advanced LLMs.",
  },
  {
    icon: Shield,
    title: "SQL Validation",
    description: "Every query is validated against your schema. Only safe SELECT statements pass through — no mutations allowed.",
  },
  {
    icon: BarChart3,
    title: "Schema Visualization",
    description: "Explore your database structure with interactive ER diagrams. Understand relationships at a glance.",
  },
  {
    icon: GitBranch,
    title: "ER Diagram Generation",
    description: "Auto-generate entity-relationship diagrams from your connected databases for documentation and analysis.",
  },
  {
    icon: Zap,
    title: "Redis Performance Cache",
    description: "Schema metadata and connection statuses are cached in Redis for lightning-fast responses.",
  },
  {
    icon: Cloud,
    title: "Cloud PostgreSQL Support",
    description: "Connect to RDS, Neon, Railway, Supabase, Azure, GCP Cloud SQL, or any PostgreSQL-compatible database.",
  },
  {
    icon: Terminal,
    title: "Audit Logs",
    description: "Every query, login, and action is tracked with full audit trails for enterprise compliance.",
  },
  {
    icon: BookOpen,
    title: "Query History",
    description: "Browse and reuse past queries. Track execution times, row counts, and performance trends.",
  },
  {
    icon: Lock,
    title: "Secure Authentication",
    description: "JWT-based authentication with role-based access control. Admin and analyst roles with granular permissions.",
  },
];

const databases = [
  { name: "PostgreSQL", icon: Database },
  { name: "AWS RDS", icon: Server },
  { name: "Neon", icon: Server },
  { name: "Railway", icon: Server },
  { name: "Supabase", icon: Database },
  { name: "Azure PostgreSQL", icon: Cloud },
  { name: "Google Cloud SQL", icon: Cloud },
  { name: "MySQL (Read-only)", icon: Database },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Terminal className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            AI SQL Assistant
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? "Dashboard" : "Sign in"}
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-Powered SQL Assistant
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI SQL Assistant
            </h1>
            <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
              Query Your Database Using Natural Language.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Describe your data needs in plain English and let AI generate optimized SQL queries for you.
              Explore your schema, validate queries, visualize relationships — all with enterprise-grade
              security and read-only safety.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/login">
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/register">
                      Create Account
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-b py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to query with confidence
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From AI-powered SQL generation to enterprise audit trails — a complete toolkit for
              modern data teams.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Supported Databases
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect to any PostgreSQL-compatible database or MySQL for read-only analytical queries.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {databases.map((db) => (
              <div
                key={db.name}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <db.icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-sm font-medium">{db.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Supports PostgreSQL-compatible databases and MySQL for read-only analytical queries.
          </p>
        </div>
      </section>

      <section className="border-b py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Architecture
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A modern, scalable architecture built for performance and security.
            </p>
          </div>
          <div className="mt-12">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-8 sm:gap-16">
                <div className="rounded-xl border bg-card px-4 py-3 text-center sm:px-6 sm:py-4">
                  <Terminal className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <span className="text-xs font-medium sm:text-sm">React Frontend</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                <div className="rounded-xl border bg-card px-4 py-3 text-center sm:px-6 sm:py-4">
                  <Server className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <span className="text-xs font-medium sm:text-sm">FastAPI Backend</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">PostgreSQL</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Redis Cache</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">LLM / OpenAI</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-3">
                <Cloud className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  External Databases: RDS · Neon · Railway · Supabase · Azure · GCP Cloud SQL
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">
              About the Project
            </h2>
            <div className="mt-12 space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  What problem does it solve?
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Data analysts and engineers spend hours writing complex SQL queries. AI SQL Assistant
                  bridges the gap between natural language and database queries, allowing anyone on your
                  team to extract insights without deep SQL expertise — while ensuring every query is
                  safe, validated, and audited.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Users className="h-5 w-5 text-primary" />
                  Enterprise Use Cases
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Perfect for data teams, business analysts, and executives who need quick answers from
                  databases. Use it for ad-hoc reporting, data exploration, onboarding new team members,
                  and reducing the bottleneck between business questions and SQL queries.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Shield className="h-5 w-5 text-primary" />
                  Read-Only Safety
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Every generated SQL passes through a multi-layered validation pipeline. SQLGlot
                  parses and verifies the query structure, schema-aware checks ensure column and table
                  names are valid, and only SELECT statements are allowed. Your data is never at risk
                  of mutation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to simplify your data queries?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join the future of database interaction. No complex SQL required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">AI SQL Assistant</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">v1.0.0</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <span>MIT License</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AI SQL Assistant. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
