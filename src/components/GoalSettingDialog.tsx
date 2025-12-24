import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { Target } from "lucide-react";

export function GoalSettingDialog({ trigger }: { trigger?: React.ReactNode }) {
    const { userStats, setDailyGoal, setWeeklyGoal } = useBookmarks();
    const [isOpen, setIsOpen] = useState(false);

    const [localDaily, setLocalDaily] = useState(10);
    const [localWeekly, setLocalWeekly] = useState(70);

    useEffect(() => {
        if (isOpen) {
            setLocalDaily(userStats.dailyGoal || 10);
            setLocalWeekly(userStats.weeklyGoal || 70);
        }
    }, [isOpen, userStats.dailyGoal, userStats.weeklyGoal]);

    const handleSave = async () => {
        // We can execute these in parallel
        await Promise.all([
            setDailyGoal(localDaily),
            setWeeklyGoal(localWeekly)
        ]);
        setIsOpen(false);
    };

    const DAILY_PRESETS = [30, 83, 96, 209];
    const WEEKLY_PRESETS = [288, 320, 581, 1463];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Target className="w-4 h-4" />
                        Set Goals
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Reading Goals</DialogTitle>
                    <DialogDescription>
                        Set your daily and weekly reading targets in Ayahs.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily">Daily Goal</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly Goal</TabsTrigger>
                    </TabsList>

                    {/* Daily Goal Tab */}
                    <TabsContent value="daily" className="space-y-4 pt-4">
                        <div className="flex flex-col space-y-2">
                            <Label>Daily Target (Ayahs)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={localDaily}
                                    onChange={(e) => setLocalDaily(parseInt(e.target.value) || 0)}
                                    className="text-lg font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {DAILY_PRESETS.map((preset) => (
                                <Button
                                    key={preset}
                                    variant={localDaily === preset ? "default" : "outline"}
                                    onClick={() => setLocalDaily(preset)}
                                    size="sm"
                                    className="flex-1"
                                >
                                    {preset}
                                </Button>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            Consistency is key! Start small if needed.
                        </p>
                    </TabsContent>

                    {/* Weekly Goal Tab */}
                    <TabsContent value="weekly" className="space-y-4 pt-4">
                        <div className="flex flex-col space-y-2">
                            <Label>Weekly Target (Ayahs)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={localWeekly}
                                    onChange={(e) => setLocalWeekly(parseInt(e.target.value) || 0)}
                                    className="text-lg font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {WEEKLY_PRESETS.map((preset) => (
                                <Button
                                    key={preset}
                                    variant={localWeekly === preset ? "default" : "outline"}
                                    onClick={() => setLocalWeekly(preset)}
                                    size="sm"
                                    className="flex-1"
                                >
                                    {preset}
                                </Button>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            Challenge yourself to read more over the week.
                        </p>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
