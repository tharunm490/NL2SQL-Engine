import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { loginApi, getCurrentUserApi } from "@/api/auth.api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter both username and password."),
  password: z.string().min(1, "Please enter both username and password."),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const tokenRes = await loginApi(data);
      localStorage.setItem("token", tokenRes.access_token);
      try {
        const user = await getCurrentUserApi();
        return { token: tokenRes.access_token, user };
      } catch {
        localStorage.removeItem("token");
        throw new Error("Failed to fetch user profile");
      }
    },
    onSuccess: ({ token, user }) => {
      login(token, user);
      toast.success(`Welcome back, ${user.username}`);
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message, {
        duration: 5000,
      });
    },
  });

  const getFieldError = (field: "username" | "password") => {
    if (errors[field]) {
      return errors[field]?.message;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
              <Terminal className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">AI SQL Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                {...register("username")}
                error={getFieldError("username")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                error={getFieldError("password")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>

          {mutation.isError && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="text-sm text-destructive">
                  <p>{mutation.error.message}</p>
                  {mutation.error.message.includes("No account found") && (
                    <Link
                      to="/register"
                      className="mt-1 inline-block font-medium underline underline-offset-2 hover:text-destructive/80"
                    >
                      Create Account
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
