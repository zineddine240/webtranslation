import { useState, useCallback } from "react";
import { Copy, Download, Trash2, Loader2, ArrowRight, Check } from "lucide-react";
import { Client } from "@gradio/client";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface TranslationPanelProps {
  frenchText: string;
  setFrenchText: (text: string) => void;
  onTranslationComplete: (french: string, arabic: string) => void;
}

const TranslationPanel = ({ frenchText, setFrenchText, onTranslationComplete }: TranslationPanelProps) => {
  const [arabicText, setArabicText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleTranslate = useCallback(async () => {
    if (!frenchText.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter some French text to translate.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    setArabicText("");

    try {
      const client = await Client.connect("3ltranslate/legaltranslator");
      const result = await client.predict("/predict", { text: frenchText });
      
      const translatedText = result.data as string;
      setArabicText(translatedText);
      onTranslationComplete(frenchText, translatedText);
      
      toast({
        title: "Translation Complete",
        description: "Your text has been successfully translated.",
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: "Failed to connect to the translation service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  }, [frenchText, toast, onTranslationComplete]);

  const copyToClipboard = useCallback(async () => {
    if (!arabicText) return;
    
    try {
      await navigator.clipboard.writeText(arabicText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Arabic translation copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  }, [arabicText, toast]);

  const downloadPDF = useCallback(() => {
    if (!arabicText) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 95);
    doc.text("LegTrans - Legal Translation", 20, 20);
    
    // French section
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("French (Original):", 20, 40);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const frenchLines = doc.splitTextToSize(frenchText, 170);
    doc.text(frenchLines, 20, 50);
    
    // Arabic section
    const arabicY = 50 + frenchLines.length * 5 + 20;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Arabic (Translation):", 20, arabicY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    // Note: jsPDF has limited Arabic support, but this will work for basic text
    const arabicLines = doc.splitTextToSize(arabicText, 170);
    doc.text(arabicLines, 20, arabicY + 10);
    
    doc.save("legtrans-translation.pdf");
    
    toast({
      title: "PDF Downloaded",
      description: "Your translation has been saved as a PDF.",
    });
  }, [frenchText, arabicText, toast]);

  const clearAll = useCallback(() => {
    setFrenchText("");
    setArabicText("");
    toast({
      title: "Cleared",
      description: "All text has been cleared.",
    });
  }, [setFrenchText, toast]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
      {/* French Input Panel */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">FR</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">French</h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {frenchText.length} characters
          </span>
        </div>

        <textarea
          value={frenchText}
          onChange={(e) => setFrenchText(e.target.value)}
          placeholder="Enter French legal text here..."
          className="w-full h-64 glass-input rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !frenchText.trim()}
            className="flex-1 btn-gradient py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin-slow" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <span>Translate</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={clearAll}
            className="p-3 rounded-xl glass-card hover:bg-destructive/20 transition-all duration-300 group"
            aria-label="Clear all"
          >
            <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" />
          </button>
        </div>
      </div>

      {/* Arabic Output Panel */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent-foreground">AR</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Arabic</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!arabicText}
              className="p-2 rounded-lg hover:bg-accent/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground hover:text-accent" />
              )}
            </button>
            <button
              onClick={downloadPDF}
              disabled={!arabicText}
              className="p-2 rounded-lg hover:bg-accent/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Download PDF"
            >
              <Download className="w-4 h-4 text-muted-foreground hover:text-accent" />
            </button>
          </div>
        </div>

        <div className="w-full h-64 glass-input rounded-xl p-4 overflow-auto">
          {isTranslating ? (
            <div className="h-full flex flex-col gap-3">
              <div className="h-4 skeleton-shimmer rounded w-3/4 ml-auto" />
              <div className="h-4 skeleton-shimmer rounded w-full" />
              <div className="h-4 skeleton-shimmer rounded w-5/6 ml-auto" />
              <div className="h-4 skeleton-shimmer rounded w-4/5" />
              <div className="h-4 skeleton-shimmer rounded w-2/3 ml-auto" />
            </div>
          ) : arabicText ? (
            <p className="arabic-text text-foreground font-arabic text-lg leading-relaxed">
              {arabicText}
            </p>
          ) : (
            <p className="text-muted-foreground text-center h-full flex items-center justify-center">
              Translation will appear here...
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <span className="text-sm text-muted-foreground">
            {arabicText.length} characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;
