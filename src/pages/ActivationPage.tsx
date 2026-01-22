import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ActivationPage = () => {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const [activationCode, setActivationCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Check if user is already active
    useEffect(() => {
        if (!authLoading && profile) {
            const now = new Date();
            const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;

            // If admin or active subscription, redirect to home
            if (profile.is_admin || (expiresAt && expiresAt > now)) {
                navigate("/");
            }
        }
    }, [profile, authLoading, navigate]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activationCode.trim()) return;

        setSubmitting(true);
        try {
            // Call the RPC function we created in SQL
            const { data, error } = await supabase.rpc('activate_sub_code', { code_input: activationCode.trim() });

            if (error) throw error;

            if (data && data.success) {
                toast({
                    title: "Compte activé !",
                    description: data.message,
                    className: "bg-green-500 text-white"
                });
                // Force reload/re-fetch profile usually happens automatically via realtime or we can navigate
                // Let's do a hard location reload to be safe and fetch fresh profile
                window.location.reload();
            } else {
                toast({
                    title: "Erreur d'activation",
                    description: data?.message || "Code invalide.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>

            <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl z-10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Activation Requise</CardTitle>
                    <CardDescription>
                        Votre compte a été créé avec succès.<br />
                        Veuillez entrer votre code d'activation pour accéder à la plateforme.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleActivate} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                placeholder="Entrez votre code (ex: LXT-1234)"
                                value={activationCode}
                                onChange={(e) => setActivationCode(e.target.value)}
                                className="text-center text-lg tracking-widest uppercase bg-slate-950 border-slate-700 h-12"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium"
                            disabled={submitting || !activationCode}
                        >
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                            Activer mon accès
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-4">
                        <button
                            onClick={() => signOut()}
                            className="text-sm text-slate-500 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Se déconnecter
                        </button>

                        <button
                            onClick={() => navigate("/")}
                            className="text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2 mx-auto transition-colors"
                        >
                            Retour à l'accueil
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ActivationPage;
