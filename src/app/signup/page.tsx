"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";

const SignUp = () => {
    const navigate = useRouter();
    const { toast } = useToast();
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Google Sign-In failed",
                description: "Could not connect to Google. Please try again.",
            });
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    },
                },
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Sign up failed",
                    description: error.message,
                });
            } else {
                setEmailSent(true);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                    title: "Error",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <AuthLayout
                title="Verify Your Email"
                subtitle="We've sent a spiritual key to your inbox."
            >
                <div className="space-y-8 animate-fade-in text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-foreground font-medium text-lg leading-relaxed">
                                A verification link has been sent to <br />
                                <span className="font-bold text-primary">{formData.email}</span>
                            </p>
                        </div>
                    </div>
                    
                    <p className="text-muted-foreground text-base leading-relaxed">
                        Please check your email and click the link to activate your account. 
                        Don't forget to check your spam folder if you don't see it.
                    </p>

                    <div className="space-y-4">
                        <Button asChild size="lg" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20">
                            <Link href="/login">Return to Login</Link>
                        </Button>
                        <button
                            onClick={() => setEmailSent(false)}
                            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Used the wrong email? <span className="text-primary hover:underline">Change it</span>
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join TilawaNow and begin your journey of reflection."
            quote={{
                text: "The best among you are those who learn the Quran and teach it.",
                reference: "Sahih al-Bukhari"
            }}
        >
            <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">
                            Full Name
                        </Label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                className="pl-10 h-12 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">
                            Email Address
                        </Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="pl-10 h-12 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">
                            Password
                        </Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className="pl-10 pr-10 h-12 bg-secondary/30 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all rounded-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-medium tracking-widest">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 border-border/60 hover:bg-secondary/50 transition-all rounded-xl gap-3 text-base"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </Button>
                </form>

                <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground font-medium">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-bold transition-all underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default SignUp;
