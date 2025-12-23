import { useState, useEffect, useCallback } from "react";
import { History, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  french: string;
  arabic: string;
  timestamp: number;
}

interface TranslationHistoryProps {
  refreshTrigger: number;
  onSelectTranslation: (french: string, arabic: string) => void;
}

const TranslationHistory = ({ refreshTrigger, onSelectTranslation }: TranslationHistoryProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("translation_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, [refreshTrigger]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem("translation_history");
    setHistory([]);
    toast({
      title: "History Cleared",
      description: "All translation history has been removed.",
    });
  }, [toast]);

  const deleteItem = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    localStorage.setItem("translation_history", JSON.stringify(newHistory));
    setHistory(newHistory);
  }, [history]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Recent Translations</h2>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={clearHistory}
          className="p-2 rounded-lg hover:bg-destructive/20 transition-all duration-300 group"
          aria-label="Clear history"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2 animate-scale-in">
          {history.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectTranslation(item.french, item.arabic)}
              className="glass-input rounded-xl p-4 cursor-pointer hover:bg-accent/10 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {truncateText(item.french)}
                  </p>
                  <p className="text-sm text-muted-foreground arabic-text truncate mt-1">
                    {truncateText(item.arabic)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.timestamp)}
                  </span>
                  <button
                    onClick={(e) => deleteItem(item.id, e)}
                    className="p-1 rounded-lg hover:bg-destructive/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranslationHistory;
