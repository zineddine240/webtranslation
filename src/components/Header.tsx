import { Scale, Moon, Sun, LogOut, User, Star, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isDark, setIsDark] = useState(true);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
  }, [isDark]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="glass-card px-6 py-4 mb-8 rounded-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl crescent-glow">
              <Scale className="w-7 h-7 text-foreground" />
            </div>
            <Star className="absolute -top-1 -right-1 w-4 h-4 text-secondary fill-secondary animate-pulse-soft" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display gradient-text flex items-center gap-2">
              LegTrans DZ
              <span className="text-lg">🇩🇿</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              الترجمة القانونية الفرنسية-العربية
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 rounded-xl glass-card hover:bg-primary/20 transition-all duration-300 group"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </button>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 pr-4 rounded-xl glass-card hover:bg-primary/10 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-foreground">
                      {profile?.display_name || "مستخدم"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.profession || "مترجم رسمي"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card border-border">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.display_name || "مستخدم"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="cursor-pointer hover:bg-primary/10">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer hover:bg-destructive/10 text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
