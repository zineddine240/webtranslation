
import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileText, X, Loader2, Sparkles, Send, Edit3, SlidersHorizontal, RotateCcw } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onTextExtracted: (text: string) => void;
}

const ImageUploader = ({ onTextExtracted }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // API Key state removed
  const [ocrResult, setOcrResult] = useState("");
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  const [contrast, setContrast] = useState(1.0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!imagePreview) return;
    e.stopPropagation();
    e.preventDefault();

    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom - e.deltaY * 0.001, 1), 5);
      return newZoom;
    });
  }, [imagePreview]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDraggingImage(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingImage && zoom > 1) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDraggingImage, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingImage(false);
  }, []);

  const handleResetZoom = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Apply contrast to image using Canvas API with manual pixel manipulation
  const applyContrastToImage = useCallback((imageData: string, contrastValue: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for pixel manipulation
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;

        // Apply contrast formula: newValue = (value - 128) * contrast + 128
        const factor = (259 * (contrastValue * 255 - 128)) / (255 * (259 - contrastValue * 255 + 128));

        for (let i = 0; i < data.length; i += 4) {
          // Red
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
          // Green
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
          // Blue
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
          // Alpha stays the same
        }

        // Put the modified data back
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = reject;
      img.src = imageData;
    });
  }, []);

  // Update preview when contrast changes
  useEffect(() => {
    if (originalImageData && contrast !== 1.0) {
      applyContrastToImage(originalImageData, contrast)
        .then(adjustedImage => setImagePreview(adjustedImage))
        .catch(err => console.error('Failed to apply contrast:', err));
    } else if (originalImageData && contrast === 1.0) {
      setImagePreview(originalImageData);
    }
  }, [contrast, originalImageData, applyContrastToImage]);

  // Reset contrast to default
  const resetContrast = useCallback(() => {
    setContrast(1.0);
  }, []);



  // Load image for preview only (no OCR)
  const loadImage = useCallback((file: File) => {
    setUploadedFile(file);
    setOcrResult("");
    setShowOcrPanel(false);

    // Create image preview and store original
    const previewReader = new FileReader();
    previewReader.onload = () => {
      const dataUrl = previewReader.result as string;
      setOriginalImageData(dataUrl);
      setImagePreview(dataUrl);
      setContrast(1.0); // Reset contrast for new image
    };
    previewReader.readAsDataURL(file);
  }, []);


  // Run OCR on the current image using local Python backend
  const runOCR = useCallback(async () => {
    if (!uploadedFile) {
      toast({
        title: "لا توجد صورة",
        description: "الرجاء رفع صورة أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setOcrResult("");

    const formData = new FormData();
    formData.append("image", uploadedFile);
    formData.append("language", "French");

    try {
      console.log("Sending to OCR server...");
      const apiUrl = import.meta.env.VITE_API_URL || "https://ocr-service-1-gu1c.onrender.com";
      const response = await fetch(`${apiUrl}/scan`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        console.log("Success!");
        setOcrResult(data.text);
        setShowOcrPanel(true);
        toast({
          title: "تم استخراج النص بنجاح ✓",
          description: "يمكنك تعديل النص قبل إرساله للترجمة",
        });
      } else {
        throw new Error(data.error || "Unknown server error");
      }

    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "فشل الاتصال",
        description: "تعذر الاتصال بالخادم المحلي (Python). تأكد من تشغilesه.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, toast]);

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
      loadImage(file);
    } else {
      toast({
        title: "ملف غير صالح",
        description: "الرجاء رفع صورة (JPG, PNG) أو ملف PDF",
        variant: "destructive",
      });
    }
  }, [loadImage, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  }, [loadImage]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setImagePreview(null);
    setOriginalImageData(null);
    setOcrResult("");
    setShowOcrPanel(false);
    setContrast(1.0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
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

              {
                uploadedFile && (
                  <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </span>
                )
              }
            </div >
          </div >

          {/* Upload/Preview Area */}
          < div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
            className={`w-full h-96 glass-input rounded-xl p-4 overflow-hidden flex items-center justify-center transition-all duration-300 relative ${isDragging ? "border-primary border-2" : ""
              } ${!imagePreview ? "cursor-pointer hover:bg-muted/30" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {
              isProcessing ? (
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
                <div
                  className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/5 rounded-lg border border-border/50"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imageRef}
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain transition-transform duration-75 ease-linear"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      cursor: zoom > 1 ? (isDraggingImage ? "grabbing" : "grab") : "default",
                      imageRendering: "auto"
                    }}
                    draggable={false}
                  />

                  {zoom > 1 && (
                    <button
                      onClick={handleResetZoom}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md hover:bg-black/70 transition-colors text-xs backdrop-blur-sm z-10"
                    >
                      Reset Zoom
                    </button>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white rounded text-xs backdrop-blur-sm pointer-events-none">
                    {Math.round(zoom * 100)}%
                  </div>
                </div>
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
              )
            }
          </div >

          {/* Contrast Slider - Only visible when image is uploaded */}
          {
            imagePreview && !isProcessing && (
              <div className="glass-input rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">التباين / Contraste</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-mono">
                      {Math.round(contrast * 100)}%
                    </span>
                    {contrast !== 1.0 && (
                      <button
                        onClick={resetContrast}
                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                        aria-label="إعادة تعيين التباين"
                        title="Reset to 100%"
                      >
                        <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((contrast - 0.5) / 1.5) * 100}%, hsl(var(--muted)) ${((contrast - 0.5) / 1.5) * 100}%, hsl(var(--muted)) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            )
          }

          <div className="flex items-center gap-3">
            {/* Upload button - always visible */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={`${uploadedFile ? 'p-4' : 'flex-1 py-4 px-6'} btn-secondary rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="رفع صورة"
            >
              <Upload className="w-5 h-5" />
              {!uploadedFile && <span>رفع صورة</span>}
            </button>

            {/* OCR button - only visible when image is uploaded */}
            {uploadedFile && (
              <button
                onClick={runOCR}
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
            )}

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
        </div >

        {/* OCR Result Panel */}
        < div className="glass-card rounded-2xl p-6 space-y-4" >
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

          <div className="w-full h-96 glass-input rounded-xl p-4 overflow-auto">
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
        </div >
      </div >
    </div >
  );
};

export default ImageUploader;
