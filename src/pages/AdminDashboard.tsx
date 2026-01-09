
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, FileText, CheckCircle, XCircle, ShieldCheck, Trash2, Copy, Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [codes, setCodes] = useState<any[]>([]);

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

            if (profilesError) {
                console.error("Profiles Error:", profilesError);
            } else {
                setProfiles(profilesData || []);
            }

            // Fetch Translators
            const { data: translatorsData, error: translatorsError } = await supabase
                .from('translators')
                .select('*')
                .order('created_at', { ascending: false });

            if (translatorsError) {
                console.error("Translators Error:", translatorsError);
            } else {
                setTranslators(translatorsData || []);
            }

            // Fetch Codes
            const { data: codesData, error: codesError } = await supabase
                .from('activation_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (codesError) {
                console.error("Codes Error:", codesError);
                // Don't throw here, just log, so page loads partially at least
            } else {
                setCodes(codesData || []);
            }

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

    const generateCode = async () => {
        const randomStr = "LXT-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

        const { data, error } = await supabase.from('activation_codes').insert({
            code: randomStr,
            duration_days: 30
        }).select().single();

        if (error) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } else {
            setCodes([data, ...codes]);
            toast({ title: "Code généré", description: `Code: ${randomStr}` });
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: "Copié !", description: "Le code a été copié dans le presse-papier." });
    };

    const handleGenerateUserCode = async (userEmail: string) => {
        // Generate a code linked to the user's name/email
        const randomStr = "LXT-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

        // Use the secure RPC that invalidates old codes for this email automatically
        const { data, error } = await supabase.rpc('generate_and_reserve_code', {
            new_code_str: randomStr,
            target_email: userEmail,
            duration_days_input: 30
        });

        if (error) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } else {
            // Show the code immediately to the admin
            window.prompt(`Code généré pour ${userEmail} \n(Les anciens codes de cet utilisateur ont été désactivés)\n\nCopiez ce code :`, randomStr);
            toast({ title: "Nouveau Code généré", description: `Code créé pour ${userEmail}` });

            // Refresh the codes list to see changes
            fetchData();
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
                        <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-8 glass-card p-1">
                            <TabsTrigger value="translators" className="data-[state=active]:bg-primary/20">Candidatures ({translators.length})</TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">Utilisateurs ({profiles.length})</TabsTrigger>
                            <TabsTrigger value="codes" className="data-[state=active]:bg-primary/20">Codes d'Activation</TabsTrigger>
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
                                                    <TableHead className="text-primary">Nom</TableHead>
                                                    <TableHead className="text-primary">Email</TableHead>
                                                    <TableHead className="text-primary">Abonnement</TableHead>
                                                    <TableHead className="text-right text-primary">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {profiles.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    profiles.map((profile) => {
                                                        const isExpired = !profile.subscription_expires_at || new Date(profile.subscription_expires_at) < new Date();
                                                        const expiresDate = profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : null;

                                                        return (
                                                            <TableRow key={profile.id} className="hover:bg-white/5 border-white/10 transition-colors">
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                            {profile.display_name?.charAt(0).toUpperCase() || <Users className="w-4 h-4" />}
                                                                        </div>
                                                                        <span>{profile.display_name || "Utilisateur Anonyme"}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                                                                <TableCell>
                                                                    {isExpired ? (
                                                                        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">
                                                                            Inactif
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
                                                                            Actif (Jusqu'au {expiresDate})
                                                                        </Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right flex items-center justify-end gap-2">
                                                                    {isExpired && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 border-primary/50 text-primary hover:bg-primary/20 hover:text-white"
                                                                            onClick={() => handleGenerateUserCode(profile.email || profile.display_name)}
                                                                        >
                                                                            <Key className="w-3 h-3 mr-1" /> Code
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                        onClick={() => handleDeleteUser(profile.user_id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="codes" className="animate-slide-up">
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle>Codes d'Activation</CardTitle>
                                    <CardDescription>Générez et gérez les codes d'activation pour les abonnements.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-end items-center mb-6">
                                        <Button onClick={generateCode} className="gap-2">
                                            <Plus className="w-4 h-4" /> Générer Code (1 Mois)
                                        </Button>
                                    </div>

                                    <div className="rounded-md border border-white/10 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-white/5">
                                                <TableRow className="hover:bg-transparent border-white/10">
                                                    <TableHead className="text-primary">Code</TableHead>
                                                    <TableHead className="text-primary">Réservé pour</TableHead>
                                                    <TableHead className="text-primary">Statut</TableHead>
                                                    <TableHead className="text-primary">Créé le</TableHead>
                                                    <TableHead className="text-right text-primary">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {codes.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun code trouvé.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    codes.map((code) => (
                                                        <TableRow key={code.id} className="hover:bg-white/5 border-white/10">
                                                            <TableCell className="font-mono text-lg tracking-wider">{code.code}</TableCell>
                                                            <TableCell className="text-muted-foreground text-sm">
                                                                {code.reserved_for_email || "-"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={`px-2 py-1 rounded-full text-xs ${code.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                                        code.status === 'used' ? 'bg-blue-500/20 text-blue-400' :
                                                                            'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {code.status === 'active' ? 'Actif' : code.status === 'used' ? 'Utilisé' : 'Expiré'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">{new Date(code.created_at).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-right">
                                                                {code.status === 'active' && (
                                                                    <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                                                                        <Copy className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
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

