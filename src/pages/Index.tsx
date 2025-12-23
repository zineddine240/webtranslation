import { useState, useCallback } from "react";
import Header from "@/components/Header";
import TranslationPanel from "@/components/TranslationPanel";
import ImageUploader from "@/components/ImageUploader";
import TranslationHistory from "@/components/TranslationHistory";

const Index = () => {
  const [frenchText, setFrenchText] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleTextExtracted = useCallback((text: string) => {
    setFrenchText(text);
  }, []);

  const handleTranslationComplete = useCallback((french: string, arabic: string) => {
    // Save to history
    const historyItem = {
      id: crypto.randomUUID(),
      french,
      arabic,
      timestamp: Date.now(),
    };

    const stored = localStorage.getItem("translation_history");
    let history = [];
    try {
      history = stored ? JSON.parse(stored) : [];
    } catch {
      history = [];
    }

    // Add new item at the beginning and limit to 20 items
    history = [historyItem, ...history].slice(0, 20);
    localStorage.setItem("translation_history", JSON.stringify(history));
    
    // Trigger history refresh
    setHistoryRefresh((prev) => prev + 1);
  }, []);

  const handleSelectFromHistory = useCallback((french: string, _arabic: string) => {
    setFrenchText(french);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <Header />

        <main className="space-y-8">
          <TranslationPanel
            frenchText={frenchText}
            setFrenchText={setFrenchText}
            onTranslationComplete={handleTranslationComplete}
          />

          <div className="grid lg:grid-cols-2 gap-6">
            <ImageUploader onTextExtracted={handleTextExtracted} />
            <TranslationHistory
              refreshTrigger={historyRefresh}
              onSelectTranslation={handleSelectFromHistory}
            />
          </div>
        </main>

        <footer className="mt-16 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LegTrans. Professional Legal Translation Services.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
