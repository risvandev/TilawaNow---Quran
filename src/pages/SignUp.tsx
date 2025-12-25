import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const SignUp = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

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

    if (emailSent) {
        return (
            <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/5" />
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />

                <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                    <div className="glass-card p-8 md:p-10 border border-white/5 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-4">Check Your Email</h1>
                        <p className="text-muted-foreground mb-8 text-lg">
                            We have sent a verification link to <span className="font-semibold text-foreground">{formData.email}</span>.
                            Please verify your email to continue.
                        </p>

                        <div className="space-y-4">
                            <Button asChild variant="outline" size="lg" className="w-full">
                                <Link to="/login">Go to Login</Link>
                            </Button>
                            <button
                                onClick={() => setEmailSent(false)}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Use a different email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-accent/5" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Back Link */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="glass-card p-8 md:p-10 border border-white/5 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <img src="/quran-logo.svg" alt="TilawaNow" className="w-8 h-8 opacity-90" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
                        <p className="text-muted-foreground">Start your spiritual journey today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Your name"
                                    className="pl-10 h-11 bg-secondary/50 border-white/10 focus:bg-background/80 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 h-11 bg-secondary/50 border-white/10 focus:bg-background/80 transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    className="pl-10 h-11 bg-secondary/50 border-white/10 focus:bg-background/80 transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 font-medium bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
