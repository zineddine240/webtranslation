
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

  // Helper function to delay execution
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Models to try in order (fallback mechanism)
  // IMPORTANT: Do NOT use "models/" prefix - the SDK adds it automatically
  // 
  // Available models on free tier (Dec 2024):
  // - gemini-2.0-flash: Fast, multimodal, good for OCR
  // - gemini-2.0-flash-lite: Ultra-efficient, lower latency
  // - gemini-1.5-flash may be deprecated, try 2.0 versions first
  const MODELS_TO_TRY = [
    "gemini-3-flash-preview",
  ];

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

      // Simple prompt for OCR
      const prompt = "extract all text from image without any comments and explanations";

      let extractedText = "";
      let lastError: any = null;
      const MAX_RETRIES = 3;

      // Try each model with retries
      for (const modelName of MODELS_TO_TRY) {
        console.log(`Trying model: ${modelName}`);

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            extractedText = response.text();

            if (extractedText && extractedText.trim()) {
              console.log(`Success with model: ${modelName} on attempt ${attempt}`);
              break;
            }
          } catch (err: any) {
            lastError = err;
            const errStr = err?.message || err?.toString() || "";
            console.log(`Attempt ${attempt} with ${modelName} failed:`, errStr);

            // If it's a rate limit error, wait before retrying
            if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota") || errStr.includes("rate")) {
              const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
              toast({
                title: `جاري إعادة المحاولة (${attempt}/${MAX_RETRIES})`,
                description: `انتظار ${waitTime / 1000} ثواني...`,
              });
              await delay(waitTime);
            } else if (errStr.includes("404") || errStr.includes("not found") || errStr.includes("NOT_FOUND")) {
              // Model not found, try next model immediately
              console.log(`Model ${modelName} not found, trying next...`);
              break;
            } else {
              // Other error, don't retry
              throw err;
            }
          }
        }

        // If we got text, break the outer loop
        if (extractedText && extractedText.trim()) {
          break;
        }
      }

      if (extractedText && extractedText.trim()) {
        setOcrResult(extractedText);
        setShowOcrPanel(true);
        toast({
          title: "تم استخراج النص بنجاح ✓",
          description: "يمكنك تعديل النص قبل إرساله للترجمة",
        });
      } else if (lastError) {
        throw lastError;
      } else {
        toast({
          title: "لم يتم العثور على نص",
          description: "لم يتم الكشف عن أي نص في الصورة المرفوعة",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("OCR error:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));

      // Better error messages
      let errorMessage = "فشل في استخراج النص من الصورة.";
      const errorStr = error?.message || error?.toString() || "";
      const errorStatus = error?.status || error?.response?.status || "";

      console.log("Error string:", errorStr);
      console.log("Error status:", errorStatus);

      if (errorStr.includes("API_KEY_INVALID") || errorStr.includes("API key not valid") || errorStr.includes("invalid")) {
        errorMessage = "مفتاح API غير صالح. تحقق من المفتاح وحاول مرة أخرى.";
        localStorage.removeItem("gemini_api_key");
        setShowApiKeyInput(true);
        setApiKey("");
      } else if (errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED")) {
        errorMessage = "مفتاح API ليس لديه صلاحية. تأكد من تفعيل Gemini API في Google Cloud Console.";
        localStorage.removeItem("gemini_api_key");
        setShowApiKeyInput(true);
        setApiKey("");
      } else if (errorStr.includes("404") || errorStr.includes("not found") || errorStr.includes("NOT_FOUND")) {
        errorMessage = "جميع النماذج غير متوفرة حالياً. حاول مرة أخرى لاحقاً.";
      } else if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota") || errorStr.includes("rate")) {
        errorMessage = "تم تجاوز حد الاستخدام بعد عدة محاولات. انتظر بضع دقائق وحاول مرة أخرى.";
      } else if (errorStr.includes("network") || errorStr.includes("fetch") || errorStr.includes("Failed to fetch") || errorStr.includes("ENOTFOUND")) {
        errorMessage = "خطأ في الاتصال. تحقق من اتصالك بالإنترنت.";
      } else if (errorStr.includes("SAFETY") || errorStr.includes("blocked")) {
        errorMessage = "تم حظر المحتوى لأسباب تتعلق بالسلامة. جرب صورة أخرى.";
      } else {
        // Show actual error for debugging
        errorMessage = `خطأ: ${errorStr.substring(0, 100)}`;
      }

      toast({
        title: "فشل التعرف الضوئي",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [delay, toast]);

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
    <div className="space-y-6">
      {/* API Key Section - Collapsible */}
      {showApiKeyInput && (
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">إعدادات API</h2>
              <p className="text-xs text-muted-foreground">Configuration API</p>
            </div>
          </div>
          <div className="glass-input rounded-xl p-4 space-y-3 border-2 border-primary/20">
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
        </div>
      )}

      {/* Two-Panel Layout: Image Upload + OCR Result (Always visible like Translation Panel) */}
      <div className="grid lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        {/* Image Upload Panel */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">رفع الصورة</h2>
                <p className="text-xs text-muted-foreground">Télécharger l'image</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className={`p-2.5 rounded-xl transition-all duration-300 ${showApiKeyInput ? "bg-primary/20" : "hover:bg-primary/20"
                  }`}
                aria-label="إعدادات API"
              >
                <Key className={`w-5 h-5 ${showApiKeyInput ? "text-primary" : "text-muted-foreground hover:text-primary"}`} />
              </button>
              {uploadedFile && (
                <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>

          {/* Upload/Preview Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            className={`w-full h-72 glass-input rounded-xl p-4 overflow-hidden flex items-center justify-center transition-all duration-300 ${isDragging ? "border-primary border-2" : ""
              } ${!imagePreview ? "cursor-pointer hover:bg-muted/30" : ""}`}
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
            ) : imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium text-lg">أسقط مستندك هنا</p>
                  <p className="text-muted-foreground">أو انقر للتصفح</p>
                  <p className="text-sm text-muted-foreground mt-2">(JPG, PNG, PDF)</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 btn-primary py-4 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin-slow" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>استخراج النص</span>
                </>
              )}
            </button>

            {uploadedFile && (
              <button
                onClick={clearFile}
                className="p-4 rounded-xl glass-card hover:bg-destructive/20 transition-all duration-300 group"
                aria-label="مسح"
              >
                <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* OCR Result Panel */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg">
                <Edit3 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">نتيجة OCR</h2>
                <p className="text-xs text-muted-foreground">Résultat OCR</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
              {ocrResult.length} حرف
            </span>
          </div>

          <div className="w-full h-72 glass-input rounded-xl p-4 overflow-auto">
            {ocrResult ? (
              <textarea
                value={ocrResult}
                onChange={(e) => setOcrResult(e.target.value)}
                className="w-full h-full bg-transparent text-foreground resize-none focus:outline-none leading-relaxed"
                dir="auto"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  النص المستخرج سيظهر هنا...
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Le texte extrait apparaîtra ici...
                </p>
              </div>
            )}
          </div>

          <button
            onClick={sendToTranslation}
            disabled={!ocrResult.trim()}
            className="w-full btn-primary py-4 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            <Send className="w-5 h-5" />
            <span>إرسال للترجمة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
