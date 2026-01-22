import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (!isLogin) {
      try {
        nameSchema.parse(displayName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.displayName = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "فشل تسجيل الدخول",
              description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "مرحباً بك! 🇩🇿",
            description: "تم تسجيل الدخول بنجاح",
          });
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "البريد مسجل مسبقاً",
              description: "هذا البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ في التسجيل",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "مرحباً بك في الجزائر! 🇩🇿",
            description: "تم إنشاء حسابك بنجاح",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen algerian-pattern flex items-center justify-center px-4 py-8">
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl crescent-glow">
                <Scale className="w-10 h-10 text-foreground" />
              </div>
              <Star className="absolute -top-2 -right-2 w-6 h-6 text-secondary fill-secondary animate-pulse-soft" />
            </div>
          </div>
          <h1 className="text-4xl font-bold font-display gradient-text mb-2">LegTrans DZ</h1>
          <p className="text-muted-foreground">
            منصة الترجمة القانونية الجزائرية
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            French-Arabic Legal Translation Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-8 animate-slide-up">
          {/* Toggle buttons */}
          <div className="flex bg-muted/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${isLogin
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${!isLogin
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field for signup */}
            {!isLogin && (
              <div className="space-y-2 animate-scale-in">
                <label className="text-sm font-medium text-foreground">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="أدخل اسمك"
                    className="w-full glass-input rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
                    dir="rtl"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full glass-input rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input rounded-xl py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? "دخول" : "إنشاء حساب"}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "سجل الآن" : "سجل دخول"}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <span className="text-secondary">★</span>
            <span className="text-sm">منصة جزائرية 100%</span>
            <span className="text-primary">☪</span>
            <span className="text-sm">للمحترفين القانونيين</span>
            <span className="text-secondary">★</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
