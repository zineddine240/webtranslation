
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, FileText, CheckCircle, XCircle, ShieldCheck, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [translators, setTranslators] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate("/auth");
            } else if (profile) {
                console.log("DEBUG CHECK:");
                console.log("Logged in User Email:", user.email);
                console.log("Profile Email:", profile.email);
                console.log("Profile is_admin:", profile.is_admin);

                // Allow access if is_admin is true OR if the email matches exactly (hardcoded override for safety)
                const isDesignatedAdmin = user.email === 'achourzineddine16@gmail.com';

                if (!profile.is_admin && !isDesignatedAdmin) {
                    toast({
                        title: "Accès refusé",
                        description: `Compte non administrateur. (Admin: ${profile.is_admin})`,
                        variant: "destructive"
                    });
                    navigate("/");
                } else if (isDesignatedAdmin && !profile.is_admin) {
                    // If email matches but DB says false, we auto-fix it here or just allow it
                    console.log("Email match override active.");
                }
            }
        }
    }, [user, profile, authLoading, navigate, toast]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;
            setProfiles(profilesData || []);

            // Fetch Translators
            const { data: translatorsData, error: translatorsError } = await supabase
                .from('translators')
                .select('*')
                .order('created_at', { ascending: false });

            if (translatorsError) throw translatorsError;
            setTranslators(translatorsData || []);

        } catch (error: any) {
            console.error("Error fetching admin data:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les données: " + error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);



    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return;

        try {
            // Call the powerful Admin function we just created
            // This function checks if YOU are admin, then deletes the target account from Auth system
            const { error } = await supabase.rpc('delete_user_complete', { target_user_id: userId });

            if (error) throw error;

            toast({
                title: "Compte supprimé définitivement",
                description: "L'utilisateur et son accès ont été supprimés avec succès."
            });

            // Remove from UI list
            setProfiles(profiles.filter(p => p.user_id !== userId));

        } catch (error: any) {
            toast({
                title: "Erreur",
                description: "Erreur lors de la suppression: " + error.message,
                variant: "destructive"
            });
        }
    };

    const verifyTranslator = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('translators')
                .update({ verified: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Succès",
                description: `Traducteur ${!currentStatus ? 'validé' : 'dévalidé'} avec succès.`,
            });

            // Refresh local state
            setTranslators(translators.map(t =>
                t.id === id ? { ...t, verified: !currentStatus } : t
            ));

        } catch (error: any) {
            toast({
                title: "Erreur",
                description: "Erreur lors de la mise à jour: " + error.message,
                variant: "destructive"
            });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center algerian-pattern">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden algerian-pattern">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
                <Header />

                <main className="space-y-8 mt-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold font-display gradient-text">Tableau de Bord Admin</h1>
                            <p className="text-muted-foreground">Gérez les utilisateurs et les candidatures</p>
                        </div>
                        <ShieldCheck className="w-10 h-10 text-primary opacity-50" />
                    </div>

                    <Tabs defaultValue="translators" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 glass-card p-1">
                            <TabsTrigger value="translators" className="data-[state=active]:bg-primary/20">Candidatures ({translators.length})</TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">Utilisateurs ({profiles.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="translators" className="animate-slide-up">
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle>Candidatures de Traducteurs</CardTitle>
                                    <CardDescription>Liste des traducteurs inscrits et leur statut de vérification.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border border-white/10 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-white/5">
                                                <TableRow className="hover:bg-transparent border-white/10">
                                                    <TableHead className="text-primary">Nom Complet</TableHead>
                                                    <TableHead className="text-primary">Wilaya</TableHead>
                                                    <TableHead className="text-primary">Spécialités</TableHead>
                                                    <TableHead className="text-primary">Statut</TableHead>
                                                    <TableHead className="text-right text-primary">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {translators.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune candidature trouvée.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    translators.map((translator) => (
                                                        <TableRow key={translator.id} className="hover:bg-white/5 border-white/10 transition-colors">
                                                            <TableCell className="font-medium">
                                                                <div className="flex flex-col">
                                                                    <span>{translator.first_name} {translator.last_name}</span>
                                                                    <span className="text-xs text-muted-foreground">{translator.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{translator.wilaya}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {translator.specialties?.slice(0, 2).map((s: string, i: number) => (
                                                                        <Badge key={i} variant="outline" className="text-xs border-primary/20 bg-primary/5">{s}</Badge>
                                                                    ))}
                                                                    {translator.specialties?.length > 2 && <span className="text-xs text-muted-foreground">+{translator.specialties.length - 2}</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {translator.verified ? (
                                                                    <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">Vérifié</Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50">En attente</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <button
                                                                    onClick={() => verifyTranslator(translator.id, translator.verified)}
                                                                    className={`p-2 rounded-full transition-colors ${translator.verified ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                                                                    title={translator.verified ? "Révoquer" : "Valider"}
                                                                >
                                                                    {translator.verified ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                                </button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="users" className="animate-slide-up">
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle>Utilisateurs Inscrits</CardTitle>
                                    <CardDescription>Liste de tous les utilisateurs enregistrés sur la plateforme.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border border-white/10 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-white/5">
                                                <TableRow className="hover:bg-transparent border-white/10">
                                                    <TableHead className="text-primary">Nom d'affichage</TableHead>
                                                    <TableHead className="text-primary">Date d'inscription</TableHead>
                                                    <TableHead className="text-right text-primary">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {profiles.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    profiles.map((profile) => (
                                                        <TableRow key={profile.id} className="hover:bg-white/5 border-white/10 transition-colors">
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                        {profile.display_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span>{profile.display_name || "Utilisateur Anonyme"}</span>
                                                                        <span className="text-xs text-muted-foreground">{profile.email}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <button
                                                                    onClick={() => handleDeleteUser(profile.user_id)}
                                                                    className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                                                                    title="Supprimer l'utilisateur"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
