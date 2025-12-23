import { Scale, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }, [isDark]);

  return (
    <header className="glass-card px-6 py-4 mb-8 rounded-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-foreground" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-xl opacity-30 blur-lg -z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">LegTrans</h1>
            <p className="text-sm text-muted-foreground">Professional French-Arabic Legal Translation</p>
          </div>
        </div>

        <button
          onClick={() => setIsDark(!isDark)}
          className="p-3 rounded-xl glass-card hover:bg-accent/20 transition-all duration-300 group"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
