import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, MapPin, FileText, CheckCircle2, Upload, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ALGERIA_WILAYAS } from "./Traducteurs";

const LANGUAGES_LIST = [
    "Arabe", "Français", "Anglais", "Chinois", "Espagnol", "Coréen", "Turc", "Finnois"
];

const JoinTranslator = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        office_address: "",
        wilaya: "",
        accreditation_number: "", // Internal use only
        languages: [] as string[],
        specialties: [] as string[], // We will use this to store PAIRS for now to match schema
        bio: ""
    });

    const [pair, setPair] = useState({ source: "", target: "" });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addPair = () => {
        if (!pair.source || !pair.target) return;
        if (pair.source === pair.target) {
            toast({ title: "Erreur", description: "Les langues doivent être différentes", variant: "destructive" });
            return;
        }
        const newPair = `${pair.source} ↔ ${pair.target}`;
        if (!formData.specialties.includes(newPair)) {
            setFormData(prev => ({
                ...prev,
                specialties: [...prev.specialties, newPair], // Storing pairs in 'specialties' column
                languages: Array.from(new Set([...prev.languages, pair.source, pair.target]))
            }));
        }
        setPair({ source: "", target: "" });
    };

    const removePair = (pairToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.filter(p => p !== pairToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                title: "Connexion requise",
                description: "Veuillez vous connecter pour créer un profil traducteur.",
                variant: "destructive"
            });
            navigate("/auth");
            return;
        }

        if (!formData.wilaya || !formData.first_name || !formData.last_name || !formData.accreditation_number) {
            toast({
                title: "Champs manquants",
                description: "Veuillez remplir tous les champs obligatoires (*)",
                variant: "destructive"
            });
            return;
        }

        if (formData.specialties.length === 0) {
            toast({
                title: "Langues requises",
                description: "Veuillez ajouter au moins une paire de langues.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            console.log("Starting submission...");
            console.log("User ID:", user.id);
            console.log("Form Data:", formData);

            // Check if profile already exists
            const { data: existing, error: checkError } = await supabase
                .from('translators')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle(); // Changed from .single() to handle no results gracefully

            if (checkError) {
                console.error("Check Error:", checkError);
            }

            if (existing) {
                console.log("Profile already exists:", existing);
                toast({
                    title: "Profil existant",
                    description: "Vous avez déjà un profil de traducteur.",
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            console.log("Inserting new translator...");

            const { data: insertData, error: insertError } = await supabase
                .from('translators')
                .insert({
                    user_id: user.id,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email || user.email,
                    phone: formData.phone,
                    office_address: formData.office_address,
                    wilaya: formData.wilaya,
                    accreditation_number: formData.accreditation_number,
                    languages: formData.languages,
                    specialties: formData.specialties,
                    bio: formData.bio,
                    verified: false
                })
                .select();

            if (insertError) {
                console.error("Insert Error Detailed:", insertError); // CRITICAL: This will show the exact SQL error
                throw insertError;
            }

            console.log("Insert Success:", insertData);

            toast({
                title: "Inscription réussie !",
                description: "Votre profil a été créé et est en attente de validation.",
            });

            navigate("/traducteurs");

        } catch (error: any) {
            console.error("CATCH BLOCK ERROR:", error);
            toast({
                title: "Erreur",
                description: error.message || "Une erreur est survenue lors de l'inscription.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen algerian-pattern py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link to="/traducteurs" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à l'annuaire
                </Link>

                <div className="glass-card rounded-2xl p-8 md:p-12 animate-slide-up">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg mx-auto mb-4">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold font-display gradient-text mb-2">Inscription Traducteur</h1>
                        <p className="text-muted-foreground">Rejoignez le réseau officiel des traducteurs agréés en Algérie</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Information Personnelle */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Information Personnelle
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom *</label>
                                    <input
                                        name="last_name"
                                        placeholder="Votre nom de famille"
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Prénom *</label>
                                    <input
                                        name="first_name"
                                        placeholder="Votre prénom"
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email professionnel</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="contact@example.com"
                                            className="w-full glass-input rounded-xl pl-10 pr-4 py-3"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Téléphone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            name="phone"
                                            placeholder="0550 12 34 56"
                                            className="w-full glass-input rounded-xl pl-10 pr-4 py-3"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Information Professionnelle */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" /> Information Professionnelle
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Wilaya *</label>
                                    <select
                                        name="wilaya"
                                        className="w-full glass-input rounded-xl px-4 py-3 appearance-none cursor-pointer"
                                        value={formData.wilaya}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Sélectionner votre wilaya</option>
                                        {ALGERIA_WILAYAS.map(wilaya => (
                                            <option key={wilaya} value={wilaya}>{wilaya}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Numéro d'agrément *</label>
                                    <input
                                        name="accreditation_number"
                                        placeholder="Numéro officiel (Confidentiel)"
                                        className="w-full glass-input rounded-xl px-4 py-3"
                                        value={formData.accreditation_number}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Ce numéro ne sera pas affiché publiquement.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Adresse du bureau</label>
                                <input
                                    name="office_address"
                                    placeholder="Cité 1200 Logements, Batiment A..."
                                    className="w-full glass-input rounded-xl px-4 py-3"
                                    value={formData.office_address}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </section>

                        {/* Compétences Linguistiques */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" /> Paires de Langues
                            </h2>

                            <div className="glass-input rounded-xl p-4 space-y-4">
                                <div className="flex flex-col md:flex-row gap-3 items-end">
                                    <div className="w-full">
                                        <label className="text-xs text-muted-foreground mb-1 block">Langue Source</label>
                                        <select
                                            className="w-full glass-input rounded-lg p-2"
                                            value={pair.source}
                                            onChange={(e) => setPair(p => ({ ...p, source: e.target.value }))}
                                        >
                                            <option value="">Choisir...</option>
                                            {LANGUAGES_LIST.map(l => <option key={`src-${l}`} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div className="pb-3 text-muted-foreground">↔</div>
                                    <div className="w-full">
                                        <label className="text-xs text-muted-foreground mb-1 block">Langue Cible</label>
                                        <select
                                            className="w-full glass-input rounded-lg p-2"
                                            value={pair.target}
                                            onChange={(e) => setPair(p => ({ ...p, target: e.target.value }))}
                                        >
                                            <option value="">Choisir...</option>
                                            {LANGUAGES_LIST.map(l => <option key={`tgt-${l}`} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <Button type="button" onClick={addPair} className="w-full md:w-auto btn-secondary">
                                        Ajouter
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {formData.specialties.map((p, i) => (
                                        <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            <span className="text-sm font-medium">{p}</span>
                                            <button
                                                type="button"
                                                onClick={() => removePair(p)}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {formData.specialties.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">Aucune paire de langues ajoutée</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Bio / Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Biographie courte</label>
                            <textarea
                                name="bio"
                                placeholder="Présentez votre expérience..."
                                className="w-full glass-input rounded-xl px-4 py-3 min-h-[100px]"
                                value={formData.bio}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="pt-4">
                            <Button disabled={loading} type="submit" className="w-full btn-primary py-6 text-lg rounded-xl">
                                {loading ? "Traitement en cours..." : "Soumettre ma candidature"}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground mt-4">
                                En soumettant ce formulaire, vous certifiez que les informations sont exactes.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinTranslator;
