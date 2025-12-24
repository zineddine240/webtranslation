import { useState, useCallback, useRef } from "react";
import { Upload, Image, FileText, X, Loader2, Key, Sparkles } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onTextExtracted: (text: string) => void;
}

const ImageUploader = ({ onTextExtracted }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
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

    try {
      const genAI = new GoogleGenerativeAI(storedKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

      const prompt = "Extract all the French text from this legal document image. Return only the extracted text, maintaining the original formatting as much as possible. If no text is found, return 'No text detected'.";

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const extractedText = response.text();

      if (extractedText && extractedText !== "No text detected") {
        onTextExtracted(extractedText);
        toast({
          title: "تم استخراج النص بنجاح ✓",
          description: "تم استخراج النص الفرنسي وإضافته لحقل الإدخال",
        });
      } else {
        toast({
          title: "لم يتم العثور على نص",
          description: "لم يتم الكشف عن أي نص في الصورة المرفوعة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "فشل التعرف الضوئي",
        description: "فشل في استخراج النص من الصورة. تحقق من مفتاح API وحاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onTextExtracted, toast]);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

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
    </div>
  );
};

export default ImageUploader;
