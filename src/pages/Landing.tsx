import { Link } from "react-router-dom";
import {
    Scale,
    Star,
    Users,
    FileText,
    Languages,
    Shield,
    ArrowRight,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
    const features = [
        {
            icon: Languages,
            title: "Traduction Juridique",
            description: "Traduction spécialisée français-arabe pour documents légaux"
        },
        {
            icon: FileText,
            title: "OCR Intelligent",
            description: "Extraction de texte depuis vos documents scannés"
        },
        {
            icon: Shield,
            title: "Sécurisé",
            description: "Vos documents sont traités en toute confidentialité"
        },
        {
            icon: Users,
            title: "Annuaire Professionnel",
            description: "Trouvez des traducteurs assermentés dans toute l'Algérie"
        }
    ];

    const stats = [
        { value: "58", label: "Wilayas couvertes" },
        { value: "9+", label: "Paires de langues" },
        { value: "100%", label: "Made in Algeria" }
    ];

    return (
        <div className="min-h-screen algerian-pattern overflow-hidden">
            {/* Decorative elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
                <Star className="absolute top-32 right-20 w-4 h-4 text-secondary/20 fill-secondary/20" />
                <Star className="absolute bottom-40 left-32 w-3 h-3 text-secondary/15 fill-secondary/15" />
            </div>

            <div className="relative z-10">
                {/* Header/Navigation */}
                <header className="container mx-auto px-4 py-6 max-w-7xl">
                    <nav className="glass-card rounded-2xl px-6 py-4 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl crescent-glow">
                                    <Scale className="w-6 h-6 text-foreground" />
                                </div>
                                <Star className="absolute -top-1 -right-1 w-4 h-4 text-secondary fill-secondary animate-pulse-soft" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold font-display gradient-text">LegTrans DZ</h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">Traduction Juridique</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to="/traducteurs">
                                <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    Annuaire
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button className="btn-primary">
                                    Se connecter
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
                    <div className="text-center max-w-4xl mx-auto animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Plateforme de traduction juridique algérienne
                        </div>

                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-foreground mb-6 leading-tight">
                            Traduisez vos documents{" "}
                            <span className="gradient-text">juridiques</span>{" "}
                            en toute confiance
                        </h2>

                        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            La première plateforme algérienne dédiée à la traduction juridique français-arabe.
                            Rapide, précise et sécurisée.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Link to="/auth">
                                <Button size="lg" className="btn-primary text-lg px-8 py-6 w-full sm:w-auto">
                                    Commencer gratuitement
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/traducteurs">
                                <Button size="lg" variant="outline" className="glass-input text-lg px-8 py-6 w-full sm:w-auto">
                                    <Users className="w-5 h-5 mr-2" />
                                    Trouver un traducteur
                                </Button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="text-center mb-12 animate-fade-in">
                        <h3 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
                            Tout ce dont vous avez besoin
                        </h3>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Une plateforme complète pour tous vos besoins de traduction juridique
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-foreground" />
                                </div>
                                <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="glass-card rounded-3xl p-8 md:p-12 text-center animate-fade-in">
                        <div className="max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 text-primary mb-4">
                                <Star className="w-5 h-5 fill-secondary text-secondary" />
                                <span className="text-sm font-medium">100% Algérien</span>
                                <Star className="w-5 h-5 fill-secondary text-secondary" />
                            </div>

                            <h3 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
                                Prêt à commencer ?
                            </h3>

                            <p className="text-muted-foreground mb-8">
                                Rejoignez des milliers de professionnels qui font confiance à LegTrans DZ
                                pour leurs traductions juridiques.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/auth">
                                    <Button size="lg" className="btn-gold text-lg px-8">
                                        Créer un compte gratuit
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <span>Gratuit pour commencer</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <span>Aucune carte requise</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <span>Données sécurisées</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center gap-3 text-muted-foreground mb-3">
                            <span className="text-secondary">★</span>
                            <span className="text-sm">صنع في الجزائر 🇩🇿</span>
                            <span className="text-primary">☪</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} LegTrans DZ. جميع الحقوق محفوظة.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tous droits réservés • All rights reserved
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Landing;
