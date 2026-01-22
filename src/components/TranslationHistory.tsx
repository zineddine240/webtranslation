import { useState, useEffect, useCallback } from "react";
import { History, Trash2, ChevronDown, ChevronUp, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/hooks/useTranslations";
import { useAuth } from "@/contexts/AuthContext";

interface TranslationHistoryProps {
  refreshTrigger: number;
  onSelectTranslation: (french: string, arabic: string) => void;
}

const TranslationHistory = ({ refreshTrigger, onSelectTranslation }: TranslationHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { translations, deleteTranslation, clearAllTranslations, refetch } = useTranslations();

  useEffect(() => {
    refetch();
  }, [refreshTrigger, refetch]);

  const handleClearHistory = useCallback(async () => {
    const success = await clearAllTranslations();
    if (success) {
      toast({
        title: "تم مسح السجل",
        description: "تم حذف جميع الترجمات السابقة",
      });
    }
  }, [clearAllTranslations, toast]);

  const handleDeleteItem = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTranslation(id);
  }, [deleteTranslation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-DZ", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  if (!user || translations.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
            <History className="w-5 h-5 text-accent" />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              سجل الترجمات
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {translations.length}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">Historique des traductions</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={handleClearHistory}
          className="p-2.5 rounded-xl hover:bg-destructive/20 transition-all duration-300 group"
          aria-label="مسح السجل"
        >
          <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 animate-scale-in max-h-80 overflow-y-auto">
          {translations.slice(0, 10).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectTranslation(item.source_text, item.translated_text)}
              className="glass-input rounded-xl p-4 cursor-pointer hover:bg-primary/10 transition-all duration-300 group border-l-4 border-transparent hover:border-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-foreground truncate">
                      {truncateText(item.source_text)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground arabic-text truncate">
                    {truncateText(item.translated_text)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-1.5 rounded-lg hover:bg-destructive/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
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
