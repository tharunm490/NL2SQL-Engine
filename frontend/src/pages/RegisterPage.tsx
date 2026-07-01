import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerApi } from "@/api/auth.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Terminal, AlertCircle } from "lucide-react";

const ALLOW_ANALYST_SELF_REGISTRATION =
  import.meta.env.VITE_ALLOW_ANALYST_SELF_REGISTRATION !== "false";

const roleOptions = [
  { value: "analyst", label: "Analyst" },
  ...(ALLOW_ANALYST_SELF_REGISTRATION ? [{ value: "admin", label: "Admin" }] : []),
];

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters"),
    email: z
      .string()
      .email("Invalid email format"),
    password: z
      .string()
      .min(6, "Password is too short")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["admin", "analyst"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "analyst" },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      registerApi({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      }),
    onSuccess: () => {
      toast.success("Account created successfully. Please sign in.", {
        duration: 5000,
      });
      navigate("/login", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message, {
        duration: 5000,
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
              <Terminal className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Register for AI SQL Assistant</p>
          </div>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Choose a username"
                {...register("username")}
                error={errors.username?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register("password")}
                error={errors.password?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
            </div>
            <div className="space-y-2">
              <Select
                id="role"
                label="Role"
                options={roleOptions}
                {...register("role")}
                error={errors.role?.message}
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {mutation.isError && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{mutation.error.message}</p>
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
