import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Translation {
  id: string;
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  created_at: string;
}

export function useTranslations() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTranslations = useCallback(async () => {
    if (!user) {
      setTranslations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTranslations(data || []);
    } catch (error) {
      console.error("Error fetching translations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  const saveTranslation = async (sourceText: string, translatedText: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("translations")
        .insert({
          user_id: user.id,
          source_text: sourceText,
          translated_text: translatedText,
          source_language: "fr",
          target_language: "ar",
        })
        .select()
        .single();

      if (error) throw error;

      setTranslations((prev) => [data, ...prev].slice(0, 20));
      return data;
    } catch (error) {
      console.error("Error saving translation:", error);
      return null;
    }
  };

  const deleteTranslation = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("translations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setTranslations((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting translation:", error);
      return false;
    }
  };

  const clearAllTranslations = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("translations")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setTranslations([]);
      return true;
    } catch (error) {
      console.error("Error clearing translations:", error);
      return false;
    }
  };

  return {
    translations,
    loading,
    saveTranslation,
    deleteTranslation,
    clearAllTranslations,
    refetch: fetchTranslations,
  };
}
