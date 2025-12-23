import { useState, useCallback, useRef } from "react";
import { Upload, Image, FileText, X, Loader2, Key } from "lucide-react";
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
        title: "API Key Saved",
        description: "Your Gemini API key has been saved securely.",
      });
    }
  }, [apiKey, toast]);

  const processImage = useCallback(async (file: File) => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (!storedKey) {
      setShowApiKeyInput(true);
      toast({
        title: "API Key Required",
        description: "Please enter your Google Gemini API key to use OCR.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const genAI = new GoogleGenerativeAI(storedKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Convert file to base64
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
          title: "Text Extracted",
          description: "French text has been extracted and added to the input field.",
        });
      } else {
        toast({
          title: "No Text Found",
          description: "Could not detect any text in the uploaded image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "OCR Failed",
        description: "Failed to extract text from the image. Please check your API key and try again.",
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
        title: "Invalid File",
        description: "Please upload an image (JPG, PNG) or PDF file.",
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Document OCR</h2>
        </div>
        <button
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="p-2 rounded-lg hover:bg-accent/20 transition-all duration-300"
          aria-label="API Key Settings"
        >
          <Key className="w-4 h-4 text-muted-foreground hover:text-accent" />
        </button>
      </div>

      {showApiKeyInput && (
        <div className="glass-input rounded-xl p-4 space-y-3 animate-scale-in">
          <p className="text-sm text-muted-foreground">
            Enter your Google Gemini API key to enable OCR text extraction.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Gemini API key..."
              className="flex-1 bg-muted/50 rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={saveApiKey}
              className="btn-gradient px-4 py-2 rounded-lg text-sm"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Google AI Studio
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
          isDragging ? "dragging" : ""
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-accent animate-spin-slow" />
            <p className="text-muted-foreground">Extracting text...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image className="w-8 h-8 text-accent" />
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
              className="p-2 rounded-lg hover:bg-destructive/20 transition-all duration-300"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Drop your document here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse (JPG, PNG, PDF)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
