import { useState, useCallback, useRef } from "react";
import { Upload, Image, FileText, X, Loader2, Key, Sparkles, Send, Edit3, Eye } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onTextExtracted: (text: string) => void;
}

const ImageUploader = ({ onTextExtracted }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [ocrResult, setOcrResult] = useState("");
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const saveApiKey = useCallback(() => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini_api_key", apiKey.trim());
      setShowApiKeyInput(false);
      toast({
        title: "تم حفظ المفتاح",
        description: "تم حفظ مفتاح Gemini API بنجاح",
      });
    }
  }, [apiKey, toast]);

  const processImage = useCallback(async (file: File) => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (!storedKey) {
      setShowApiKeyInput(true);
      toast({
        title: "مفتاح API مطلوب",
        description: "الرجاء إدخال مفتاح Google Gemini API لاستخدام التعرف الضوئي",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    setOcrResult("");
    setShowOcrPanel(false);
    
    // Create image preview
    const previewReader = new FileReader();
    previewReader.onload = () => setImagePreview(previewReader.result as string);
    previewReader.readAsDataURL(file);

    try {
      const genAI = new GoogleGenerativeAI(storedKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };

      // Simple prompt as requested
      const prompt = "extract all text from image";

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const extractedText = response.text();

      if (extractedText && extractedText.trim()) {
        setOcrResult(extractedText);
        setShowOcrPanel(true);
        toast({
          title: "تم استخراج النص بنجاح ✓",
          description: "يمكنك تعديل النص قبل إرساله للترجمة",
        });
      } else {
        toast({
          title: "لم يتم العثور على نص",
          description: "لم يتم الكشف عن أي نص في الصورة المرفوعة",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("OCR error:", error);
      
      // Better error messages
      let errorMessage = "فشل في استخراج النص من الصورة.";
      const errorStr = error?.message || error?.toString() || "";
      
      if (errorStr.includes("API_KEY_INVALID") || errorStr.includes("API key") || errorStr.includes("invalid")) {
        errorMessage = "مفتاح API غير صالح. تحقق من المفتاح وحاول مرة أخرى.";
        localStorage.removeItem("gemini_api_key");
        setShowApiKeyInput(true);
        setApiKey("");
      } else if (errorStr.includes("404") || errorStr.includes("not found")) {
        errorMessage = "خطأ في نموذج الذكاء الاصطناعي. حاول مرة أخرى.";
      } else if (errorStr.includes("quota")) {
        errorMessage = "تم تجاوز حد الاستخدام. حاول مرة أخرى لاحقاً.";
      } else if (errorStr.includes("network") || errorStr.includes("fetch") || errorStr.includes("Failed to fetch")) {
        errorMessage = "خطأ في الاتصال. تحقق من اتصالك بالإنترنت.";
      }
      
      toast({
        title: "فشل التعرف الضوئي",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      processImage(file);
    } else {
      toast({
        title: "ملف غير صالح",
        description: "الرجاء رفع صورة (JPG, PNG) أو ملف PDF",
        variant: "destructive",
      });
    }
  }, [processImage, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setImagePreview(null);
    setOcrResult("");
    setShowOcrPanel(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const sendToTranslation = useCallback(() => {
    if (ocrResult.trim()) {
      onTextExtracted(ocrResult);
      toast({
        title: "تم الإرسال ✓",
        description: "تم إرسال النص لحقل الترجمة",
      });
    }
  }, [ocrResult, onTextExtracted, toast]);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              التعرف الضوئي على المستندات
              <Sparkles className="w-4 h-4 text-accent" />
            </h2>
            <p className="text-xs text-muted-foreground">OCR - Reconnaissance de documents</p>
          </div>
        </div>
        <button
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className={`p-2.5 rounded-xl transition-all duration-300 ${
            showApiKeyInput ? "bg-primary/20" : "hover:bg-primary/20"
          }`}
          aria-label="إعدادات API"
        >
          <Key className={`w-5 h-5 ${showApiKeyInput ? "text-primary" : "text-muted-foreground hover:text-primary"}`} />
        </button>
      </div>

      {showApiKeyInput && (
        <div className="glass-input rounded-xl p-4 space-y-3 animate-scale-in border-2 border-primary/20">
          <p className="text-sm text-muted-foreground text-right">
            أدخل مفتاح Google Gemini API لتفعيل ميزة التعرف الضوئي على النصوص
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="أدخل مفتاح Gemini API..."
              className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            <button
              onClick={saveApiKey}
              className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold"
            >
              حفظ
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            احصل على مفتاح API من{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Google AI Studio ←
            </a>
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`drop-zone rounded-xl p-8 cursor-pointer transition-all duration-300 ${
          isDragging ? "dragging border-primary" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin-slow" />
              <Sparkles className="w-6 h-6 text-accent absolute -top-2 -right-2 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">جاري استخراج النص...</p>
              <p className="text-sm text-muted-foreground">Extraction en cours...</p>
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Image className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-3 rounded-xl hover:bg-destructive/20 transition-all duration-300"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium text-lg">أسقط مستندك هنا</p>
              <p className="text-muted-foreground">
                أو انقر للتصفح
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (JPG, PNG, PDF)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Two-Panel Layout: Image Preview + OCR Result */}
      {(imagePreview || showOcrPanel) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
          {/* Image Preview Panel */}
          {imagePreview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">معاينة الصورة</h3>
                <p className="text-xs text-muted-foreground mr-auto">Aperçu de l'image</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-2 border border-border/50 overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* OCR Result Panel */}
          {showOcrPanel && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">نتيجة OCR</h3>
                <p className="text-xs text-muted-foreground mr-auto">Résultat OCR</p>
              </div>
              <textarea
                value={ocrResult}
                onChange={(e) => setOcrResult(e.target.value)}
                className="w-full h-48 bg-muted/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm leading-relaxed"
                dir="auto"
                placeholder="النص المستخرج سيظهر هنا..."
              />
              <button
                onClick={sendToTranslation}
                className="w-full btn-primary py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                إرسال للترجمة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
