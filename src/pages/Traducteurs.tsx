import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data - In a real app, this would come from Supabase
const MOCK_TRANSLATORS = [
    {
        id: 1,
        name: "Ahmed Benali",
        title: "Traducteur Agréé",
        location: "Alger, Centre",
        languages: ["Arabe", "Français", "Anglais"],
        specialties: ["Juridique", "Technique"],
        verified: true,
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
    },
    {
        id: 2,
        name: "Sarah Touati",
        title: "Traductrice Assermentée",
        location: "Oran, Es-Senia",
        languages: ["Arabe", "Français"],
        specialties: ["Juridique", "Médical"],
        verified: true,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    },
    {
        id: 3,
        name: "Karim Meziant",
        title: "Expert Traducteur",
        location: "Constantine",
        languages: ["Arabe", "Français", "Espagnol"],
        specialties: ["Juridique", "Finance"],
        verified: true,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
        id: 4,
        name: "Cabinet Amrani",
        title: "Bureau de Traduction",
        location: "Blida",
        languages: ["Arabe", "Français", "Anglais", "Chinois"],
        specialties: ["Juridique", "Commercial", "Technique"],
        verified: true,
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=400&fit=crop"
    },
    {
        id: 5,
        name: "Nadia Belkacem",
        title: "Traductrice Officielle",
        location: "Setif",
        languages: ["Arabe", "Français", "Italien"],
        specialties: ["Juridique", "Administratif"],
        verified: true,
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop"
    },
    {
        id: 6,
        name: "Yacine Derbal",
        title: "Traducteur Expert",
        location: "Annaba",
        languages: ["Arabe", "Français", "Russe"],
        specialties: ["Juridique", "Scientifique"],
        verified: true,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    }
];

const Traducteurs = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState("all");

    const filteredTranslators = MOCK_TRANSLATORS.filter(translator => {
        const matchesSearch = translator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            translator.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

        if (selectedCity !== "all") {
            return matchesSearch && translator.location.includes(selectedCity);
        }
        return matchesSearch;
    });

    const cities = ["Alger", "Oran", "Constantine", "Blida", "Setif", "Annaba"];

    return (
        <div className="min-h-screen bg-background text-foreground algerian-pattern">
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-border/40 glass-card sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2 group">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Button>
                            <span className="font-semibold text-lg hidden sm:block">Retour</span>
                        </Link>

                        <h1 className="text-xl md:text-2xl font-bold font-display gradient-text">
                            Annuaire des Traducteurs
                        </h1>

                        <div className="w-10" /> {/* Spacer for centering */}
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Search & Filters */}
                    <div className="mb-12 space-y-4">
                        <div className="text-center mb-8 animate-fade-in">
                            <h2 className="text-3xl font-bold mb-4 font-display">Trouvez votre expert</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Accédez au plus grand réseau de traducteurs officiels et assermentés en Algérie.
                                Recherchez par nom, spécialité ou wilaya.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto animate-slide-up">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom, spécialité..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full glass-input rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
                                />
                            </div>
                            <div className="relative md:w-64">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <select
                                    className="w-full glass-input rounded-xl py-4 pl-12 pr-10 text-foreground appearance-none cursor-pointer"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                >
                                    <option value="all">Toutes les wilayas</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTranslators.map((translator, index) => (
                            <div
                                key={translator.id}
                                className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 animate-slide-up group"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img
                                                src={translator.image}
                                                alt={translator.name}
                                                className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20"
                                            />
                                            {translator.verified && (
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg" title="Vérifié">
                                                    <Star className="w-3 h-3 fill-current" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                {translator.name}
                                            </h3>
                                            <p className="text-sm text-primary font-medium">{translator.title}</p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {translator.location}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {translator.languages.map((lang, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-md bg-secondary/10 text-secondary border border-secondary/20">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {translator.specialties.map((spec, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <Button variant="outline" className="w-full glass-input hover:bg-primary hover:text-white transition-colors">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Appeler
                                    </Button>
                                    <Button className="w-full btn-gold">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Contact
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredTranslators.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Aucun résultat trouvé</h3>
                            <p className="text-muted-foreground">
                                Essayez de modifier vos critères de recherche
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Traducteurs;
