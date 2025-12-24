import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function InviteDialog() {
    const [email, setEmail] = useState("");
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const inviteLink = window.location.origin + "/signup";

    const handleEmailInvite = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple mailto implementation directly opens the user's email client
        const subject = encodeURIComponent("You’re Invited to Join Tadabbur");
        const body = encodeURIComponent(`Assalamu alaikum,

I hope this message finds you well.

I’d like to invite you to explore Tadabbur, a platform designed to help you read, listen to, and understand the Qur’an with clarity and ease.

You can get started by visiting the link below:

👉 ${inviteLink}

If you have any questions or need help getting started, feel free to reach out.

Looking forward to having you with us.

Best regards,
Tadabbur Team`);

        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

        toast({
            title: "Email Client Opened",
            description: "Please send the invite from your email app.",
        });
        setEmail("");
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Link Copied",
            description: "Invite link copied to clipboard.",
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 h-8 px-2 md:h-10 md:px-4 text-xs md:text-sm">
                    <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="md:hidden">Invite</span>
                    <span className="hidden md:inline">Invite Friends</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-card border-white/10">
                <DialogHeader>
                    <DialogTitle>Invite Friends</DialogTitle>
                    <DialogDescription>
                        Share the journey with your loved ones.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={inviteLink}
                            readOnly
                            className="bg-secondary/50 border-white/10"
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={copyLink}>
                        <span className="sr-only">Copy</span>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or send email</span>
                    </div>
                </div>

                <form onSubmit={handleEmailInvite} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Friend's Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="friend@example.com"
                                className="pl-9 bg-secondary/50 border-white/10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="submit" variant="hero" className="w-full">
                            Open Email App
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
