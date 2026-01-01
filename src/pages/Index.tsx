import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import TranslationPanel from "@/components/TranslationPanel";
import ImageUploader from "@/components/ImageUploader";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/hooks/useTranslations";
import { Loader2, Star } from "lucide-react";

const Index = () => {
  const [frenchText, setFrenchText] = useState("");
  const { user, loading } = useAuth();
  const { saveTranslation } = useTranslations();

  const handleTextExtracted = useCallback((text: string) => {
    setFrenchText(text);
  }, []);

  const handleTranslationComplete = useCallback(async (french: string, arabic: string) => {
    await saveTranslation(french, arabic);
  }, [saveTranslation]);

  const handleSelectFromHistory = useCallback((french: string, _arabic: string) => {
    setFrenchText(french);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center algerian-pattern">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden algerian-pattern">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

        {/* Subtle star decorations */}
        <Star className="absolute top-32 right-20 w-4 h-4 text-secondary/20 fill-secondary/20" />
        <Star className="absolute bottom-40 left-32 w-3 h-3 text-secondary/15 fill-secondary/15" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        <Header />

        <main className="space-y-8">
          {/* Hero section */}
          <div className="text-center py-6 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              منصة الترجمة القانونية الجزائرية
            </h2>
            <p className="text-muted-foreground">
              Plateforme de traduction juridique algérienne • French ↔ Arabic
            </p>
          </div>

          <TranslationPanel
            frenchText={frenchText}
            setFrenchText={setFrenchText}
            onTranslationComplete={handleTranslationComplete}
          />


          <div className="w-full">
            <ImageUploader onTextExtracted={handleTextExtracted} />
          </div>
        </main>

        <footer className="mt-16 pb-8 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
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
        </footer>
      </div>
    </div>
  );
};

export default Index;
