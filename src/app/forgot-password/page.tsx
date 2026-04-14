"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Include reference to where to redirect after clicking the email link
            // For now, we just redirect to a page where they can update password, or just home
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Request failed",
                    description: error.message,
                });
            } else {
                setIsSubmitted(true);
                toast({
                    title: "Check your email",
                    description: "We sent you a password reset link.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Back Link */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <div className="glass-card p-8 md:p-10 border border-white/5 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Forgot Password?</h1>
                        <p className="text-muted-foreground">
                            {isSubmitted
                                ? "Check your inbox for a reset link."
                                : "Enter your email to receive a reset link."}
                        </p>
                    </div>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10 h-11 bg-secondary/50 border-white/10 focus:bg-background/80 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-secondary/50 p-4 rounded-lg text-sm text-muted-foreground text-center border border-white/5">
                                If an account exists for <strong>{email}</strong>, you will receive an email instructions to reset your password.
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-11"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Try another email
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
