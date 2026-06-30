import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MessageSquare, Shield, Database, Cloud, Clock, FileText,
  GitBranch, Palette, Server, ArrowDown, ArrowRight, User, Check,
  Lock, Key, Cpu, BrainCircuit, AppWindow, Terminal,
  Monitor, Warehouse, Globe,
} from "lucide-react";

const supportedPlatforms = [
  {
    icon: Monitor,
    title: "Local PostgreSQL",
    description: "Connect directly to PostgreSQL databases running on your local machine. Ideal for development, testing, and internal deployments.",
    badge: "Local",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
  },
  {
    icon: Cloud,
    title: "Amazon RDS PostgreSQL",
    description: "Connect securely to PostgreSQL databases hosted on Amazon RDS. Supports cloud-hosted production databases.",
    badge: "Cloud",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
  },
  {
    icon: Database,
    title: "Supabase PostgreSQL",
    description: "Supports PostgreSQL databases hosted on Supabase.",
    badge: "Managed PostgreSQL",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
  {
    icon: Globe,
    title: "Neon PostgreSQL",
    description: "Connect to serverless PostgreSQL databases hosted on Neon.",
    badge: "Serverless",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
  },
  {
    icon: Cloud,
    title: "Railway PostgreSQL",
    description: "Supports PostgreSQL databases deployed on Railway.",
    badge: "Cloud",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
  },
  {
    icon: Cloud,
    title: "Azure PostgreSQL",
    description: "Supports PostgreSQL databases hosted on Microsoft Azure.",
    badge: "Cloud",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400",
    badgeColor: "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300",
  },
  {
    icon: Cloud,
    title: "Google Cloud SQL",
    description: "Supports PostgreSQL databases hosted on Google Cloud.",
    badge: "Cloud",
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400",
    badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300",
  },
  {
    icon: Server,
    title: "Self-Hosted PostgreSQL",
    description: "Supports PostgreSQL installed on Linux, Windows, Docker containers, Kubernetes, virtual machines, or private servers.",
    badge: "Self Hosted",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300",
  },
];

const features = [
  { icon: Database, title: "PostgreSQL Compatible" },
  { icon: Monitor, title: "Local PostgreSQL Support" },
  { icon: Cloud, title: "Cloud PostgreSQL Support" },
  { icon: Cloud, title: "AWS RDS Support" },
  { icon: GitBranch, title: "Schema Visualization" },
  { icon: BrainCircuit, title: "AI SQL Generation" },
  { icon: Shield, title: "Read-only Query Execution" },
  { icon: Database, title: "Multi-Database Connections" },
  { icon: User, title: "Role-Based Access Control" },
  { icon: Clock, title: "Query History" },
  { icon: FileText, title: "Audit Logs" },
  { icon: Palette, title: "Dark / Light Mode" },
];

const platforms = [
  "Local PostgreSQL",
  "AWS RDS",
  "Supabase",
  "Neon",
  "Railway",
  "Azure",
  "Google Cloud",
];

const exampleHosts = [
  "localhost",
  "sales-db.xxxxxx.rds.amazonaws.com",
  "db.xxxxx.supabase.co",
  "ep-example.us-east-1.aws.neon.tech",
  "containers-us-west.railway.app",
];

export function AboutPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 px-8 py-16 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI SQL Assistant
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
            Enterprise AI-powered SQL Assistant for PostgreSQL-compatible databases.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-blue-200">
            Connect to any PostgreSQL database, whether it is running locally, hosted on a cloud provider,
            or deployed as a managed PostgreSQL service. Generate SQL using natural language, securely
            execute read-only queries, explore database schemas, and analyze data with AI.
          </p>
          <div className="mt-12 flex flex-col items-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 backdrop-blur-sm">
              <User className="h-4 w-4" /> <span>User</span>
            </div>
            <ArrowDown className="h-5 w-5 text-blue-300" />
            <div className="flex items-center gap-2 rounded-full bg-blue-500/30 px-5 py-2 backdrop-blur-sm ring-1 ring-blue-400/50">
              <BrainCircuit className="h-4 w-4" /> <span>AI SQL Assistant</span>
            </div>
            <ArrowDown className="h-5 w-5 text-blue-300" />
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 backdrop-blur-sm">
              <Server className="h-4 w-4" /> <span>PostgreSQL Database</span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported PostgreSQL Platforms */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">Supported PostgreSQL Platforms</h2>
          <p className="mt-2 text-muted-foreground">
            The AI SQL Assistant supports any PostgreSQL-compatible database using standard PostgreSQL connection parameters.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {supportedPlatforms.map((platform) => (
            <Card key={platform.title} className="group transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${platform.color}`}>
                  <platform.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{platform.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {platform.description}
                </p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${platform.badgeColor}`}>
                  {platform.badge}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Universal PostgreSQL Compatibility */}
      <section className="rounded-2xl bg-muted/50 p-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Universal PostgreSQL Compatibility</h2>
          <p className="mb-8 text-muted-foreground">
            The AI SQL Assistant is designed around the PostgreSQL protocol rather than a specific hosting provider.
            If a PostgreSQL connection can be established using Host, Port, Database Name, Username, and Password,
            the application can securely connect, retrieve metadata, generate SQL, and execute read-only queries.
            No application changes are required when switching between local databases and cloud-hosted PostgreSQL services.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 text-sm">
          {platforms.map((name, i) => (
            <div key={name} className="flex flex-col items-center">
              <div className="rounded-lg border bg-card px-5 py-2.5 font-medium shadow-sm transition-all hover:shadow-md">
                {name}
              </div>
              {i < platforms.length && <ArrowDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
          <div className="rounded-xl border-2 border-blue-500/50 bg-blue-50 px-6 py-3 font-semibold text-blue-700 shadow-sm dark:bg-blue-950/40 dark:text-blue-300">
            AI SQL Assistant
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            All connected using the same PostgreSQL protocol.
          </p>
        </div>
      </section>

      {/* Connection Guide */}
      <section>
        <h2 className="mb-2 text-2xl font-bold">Connect a Database</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          The same connection form works for every PostgreSQL deployment.
          No database-type selection is required because every supported platform uses the PostgreSQL protocol.
        </p>
        <Card>
          <CardContent className="p-6">
            <ol className="space-y-4">
              {[
                "Navigate to Database Connections.",
                'Click "Add Database".',
                "Fill in Connection Name, Host, Port, Database Name, Username, and Password.",
                "Click Test Connection.",
                "Click Create.",
                "Start asking questions in natural language.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Example Connections */}
      <section>
        <h2 className="mb-8 text-2xl font-bold">Example Connections</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Local PostgreSQL",
              fields: [
                { label: "Host", value: "localhost" },
                { label: "Port", value: "5432" },
                { label: "Database", value: "postgres" },
                { label: "Username", value: "postgres" },
              ],
              color: "border-l-blue-500",
            },
            {
              title: "AWS RDS",
              fields: [
                { label: "Host", value: "sales-db.xxxxxxxxx.us-east-1.rds.amazonaws.com" },
                { label: "Port", value: "5432" },
                { label: "Database", value: "postgres" },
                { label: "Username", value: "postgres" },
              ],
              color: "border-l-orange-500",
            },
            {
              title: "Cloud PostgreSQL",
              fields: [
                { label: "Host", value: "db.example.com" },
                { label: "Port", value: "5432" },
                { label: "Database", value: "company_db" },
                { label: "Username", value: "admin" },
              ],
              color: "border-l-emerald-500",
            },
          ].map((example) => (
            <Card key={example.title} className={`border-l-4 ${example.color} transition-all hover:shadow-lg`}>
              <CardHeader>
                <CardTitle className="text-base">{example.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {example.fields.map((field) => (
                  <div key={field.label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{field.label}</span>
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                      {field.value}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="mb-8 text-2xl font-bold">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="group transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="rounded-2xl bg-muted/50 p-8">
        <h2 className="mb-8 text-center text-2xl font-bold">Architecture</h2>
        <div className="flex flex-col items-center gap-2 text-sm">
          {[
            "React Frontend",
            "FastAPI Backend",
            "Authentication",
            "Connection Manager",
            "Metadata Extraction",
            "AI SQL Engine",
            "SQL Validator",
            "PostgreSQL Connector",
          ].map((item, i) => (
            <div key={item} className="flex flex-col items-center">
              <div className="rounded-lg border bg-card px-5 py-2.5 font-medium shadow-sm transition-all hover:shadow-md">
                {item}
              </div>
              {i < 7 && <ArrowDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              "Local PostgreSQL",
              "Amazon RDS PostgreSQL",
              "Supabase PostgreSQL",
              "Neon PostgreSQL",
              "Railway PostgreSQL",
              "Azure PostgreSQL",
              "Google Cloud SQL PostgreSQL",
              "Self-Hosted PostgreSQL",
            ].map((item) => (
              <div key={item} className="rounded-lg border bg-card px-3 py-2 text-center text-xs font-medium shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Detection */}
      <section>
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Automatic Platform Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              The application connects using standard PostgreSQL connection parameters.
              The hosting provider does not affect functionality. The backend communicates
              directly using the PostgreSQL protocol.
            </p>
            <div>
              <p className="mb-2 font-medium">Example hostnames:</p>
              <div className="flex flex-wrap gap-2">
                {exampleHosts.map((host) => (
                  <code key={host} className="rounded bg-muted px-3 py-1.5 font-mono text-xs">
                    {host}
                  </code>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">These are examples only.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Security */}
      <section>
        <h2 className="mb-8 text-2xl font-bold">Security First</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Read-only SQL Execution",
              icon: Shield,
              items: ["No INSERT", "No UPDATE", "No DELETE", "No DROP", "No ALTER"],
            },
            {
              title: "Enterprise Security",
              icon: Lock,
              items: ["Encrypted credentials", "Secure authentication", "Role-based access", "Audit logging"],
            },
          ].map((item) => (
            <Card key={item.title} className="transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {item.items.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="rounded-2xl bg-muted/50 p-8">
        <h2 className="mb-8 text-center text-2xl font-bold">How AI SQL Assistant Works</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {[
            { icon: User, label: "User" },
            { icon: MessageSquare, label: "Natural Language" },
            { icon: BrainCircuit, label: "LLM" },
            { icon: Database, label: "SQL Generation" },
            { icon: Shield, label: "Read-only Validation" },
            { icon: Server, label: "PostgreSQL" },
            { icon: AppWindow, label: "Results" },
            { icon: Palette, label: "Dashboard" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-sm transition-all hover:shadow-md">
                <step.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{step.label}</span>
              </div>
              {i < 7 && (
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          <p>
            The application retrieves the database schema, sends only metadata
            (table names, column names, relationships) to the AI model, generates
            optimized SQL, validates that the SQL is read-only, executes it on
            PostgreSQL, and returns the results.
          </p>
          <p className="mt-2 font-medium text-foreground">
            No database records are sent to the AI model.
          </p>
        </div>
      </section>

      {/* Supported Technologies */}
      <section>
        <h2 className="mb-8 text-center text-2xl font-bold">Supported Technologies</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: "React", icon: Cpu },
            { name: "FastAPI", icon: Server },
            { name: "PostgreSQL", icon: Database },
            { name: "SQLAlchemy", icon: Database },
            { name: "JWT", icon: Key },
            { name: "OpenAI GPT-5.1 Codex Mini", icon: BrainCircuit },
            { name: "Tailwind CSS", icon: Palette },
          ].map((tech) => (
            <div
              key={tech.name}
              className="flex items-center gap-3 rounded-xl border bg-card px-5 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <tech.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Terminal className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">AI SQL Assistant</span>
        </div>
        <p className="mb-1">Enterprise AI SQL Platform for PostgreSQL-Compatible Databases</p>
        <p className="mb-2">Supports Local, Cloud, Managed, and Self-Hosted PostgreSQL Deployments.</p>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <span>Built with:</span>
          <span className="font-medium text-foreground">React</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-foreground">FastAPI</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-foreground">PostgreSQL</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-foreground">SQLAlchemy</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-foreground">JWT</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-foreground">OpenAI GPT-5.1 Codex Mini</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium text-foreground">Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}
