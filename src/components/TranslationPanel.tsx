import { useState, useCallback } from "react";
import { Copy, Download, Trash2, Loader2, ArrowRight, Check, Languages } from "lucide-react";
import { Client } from "@gradio/client";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  const handleTranslate = useCallback(async () => {
    if (!frenchText.trim()) {
      toast({
        title: "نص فارغ",
        description: "الرجاء إدخال نص فرنسي للترجمة",
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
        title: "تمت الترجمة بنجاح ✓",
        description: "تم ترجمة النص القانوني بنجاح",
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "فشل الترجمة",
        description: "فشل الاتصال بخدمة الترجمة. يرجى المحاولة مرة أخرى.",
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
        title: "تم النسخ!",
        description: "تم نسخ الترجمة العربية",
      });
    } catch (error) {
      toast({
        title: "فشل النسخ",
        description: "فشل نسخ النص إلى الحافظة",
        variant: "destructive",
      });
    }
  }, [arabicText, toast]);

  const downloadPDF = useCallback(() => {
    if (!arabicText) return;

    const doc = new jsPDF();
    
    // Title with Algerian branding
    doc.setFontSize(20);
    doc.setTextColor(34, 87, 54); // Algerian green
    doc.text("LegTrans DZ - الترجمة القانونية", 105, 20, { align: "center" });
    
    // Decorative line
    doc.setDrawColor(206, 17, 38); // Algerian red
    doc.setLineWidth(0.5);
    doc.line(20, 28, 190, 28);
    
    // French section
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Texte Original (Français):", 20, 45);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const frenchLines = doc.splitTextToSize(frenchText, 170);
    doc.text(frenchLines, 20, 55);
    
    // Arabic section
    const arabicY = 55 + frenchLines.length * 5 + 25;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("(الترجمة العربية) Traduction Arabe:", 20, arabicY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const arabicLines = doc.splitTextToSize(arabicText, 170);
    doc.text(arabicLines, 20, arabicY + 10);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("© LegTrans DZ - منصة الترجمة القانونية الجزائرية", 105, 285, { align: "center" });
    
    doc.save("legtrans-dz-translation.pdf");
    
    toast({
      title: "تم التحميل",
      description: "تم حفظ الترجمة كملف PDF",
    });
  }, [frenchText, arabicText, toast]);

  const clearAll = useCallback(() => {
    setFrenchText("");
    setArabicText("");
    toast({
      title: "تم المسح",
      description: "تم مسح جميع النصوص",
    });
  }, [setFrenchText, toast]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
      {/* French Input Panel */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">FR</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Français</h2>
              <p className="text-xs text-muted-foreground">النص الفرنسي</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
            {frenchText.length} حرف
          </span>
        </div>

        <textarea
          value={frenchText}
          onChange={(e) => setFrenchText(e.target.value)}
          placeholder="أدخل النص القانوني الفرنسي هنا...
Entrez le texte juridique français ici..."
          className="w-full h-72 glass-input rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-relaxed"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !frenchText.trim()}
            className="flex-1 btn-primary py-4 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin-slow" />
                <span>جاري الترجمة...</span>
              </>
            ) : (
              <>
                <Languages className="w-6 h-6" />
                <span>ترجم الآن</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={clearAll}
            className="p-4 rounded-xl glass-card hover:bg-destructive/20 transition-all duration-300 group"
            aria-label="مسح الكل"
          >
            <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" />
          </button>
        </div>
      </div>

      {/* Arabic Output Panel */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-foreground">AR</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">العربية</h2>
              <p className="text-xs text-muted-foreground">Arabe</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!arabicText}
              className="p-2.5 rounded-xl hover:bg-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="نسخ"
            >
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground hover:text-primary" />
              )}
            </button>
            <button
              onClick={downloadPDF}
              disabled={!arabicText}
              className="p-2.5 rounded-xl hover:bg-accent/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="تحميل PDF"
            >
              <Download className="w-5 h-5 text-muted-foreground hover:text-accent" />
            </button>
          </div>
        </div>

        <div className="w-full h-72 glass-input rounded-xl p-4 overflow-auto">
          {isTranslating ? (
            <div className="h-full flex flex-col gap-3 animate-pulse">
              <div className="h-5 skeleton-shimmer rounded w-3/4 ml-auto" />
              <div className="h-5 skeleton-shimmer rounded w-full" />
              <div className="h-5 skeleton-shimmer rounded w-5/6 ml-auto" />
              <div className="h-5 skeleton-shimmer rounded w-4/5" />
              <div className="h-5 skeleton-shimmer rounded w-2/3 ml-auto" />
            </div>
          ) : arabicText ? (
            <p className="arabic-text text-foreground text-lg leading-loose">
              {arabicText}
            </p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Languages className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                الترجمة ستظهر هنا...
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                La traduction apparaîtra ici...
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Powered by LegTrans AI Model
          </span>
          <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
            {arabicText.length} حرف
          </span>
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;
