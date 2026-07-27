import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export function VerifyEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We have sent a confirmation link to your email address. Please
              check your inbox and follow the link to verify your account.
            </p>
          </div>
          <div className="space-y-4">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600"
            >
              Back to Login
            </Link>
            <Link
              to="/signup"
              className="block text-center text-sm text-primary hover:underline"
            >
              Create a new account instead
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
