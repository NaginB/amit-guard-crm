import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginAsync, fetchCurrentUser } from "../features/auth/authSlice";
import type { AppDispatch, RootState } from "../app/store";
import {
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import CompanyTitle from "../components/common/CompanyTitle";

// ─── Brand Colours ────────────────────────────────────────────────────────────
const BLUE = "#152c56";

interface LoginFormData {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({ mode: "onChange" });

  useEffect(() => {
    if (isAuthenticated) navigate("/guards");
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await dispatch(loginAsync(data));
      if (loginAsync.fulfilled.match(result)) {
        await dispatch(fetchCurrentUser());
        setShowSuccess(true);
        setTimeout(() => navigate("/guards"), 1000);
      } else {
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="layout-wrapper">

      {/* Left Side: Premium Image Panel */}
      <div className="image-panel">
        <div className="image-content">
          <div className="brand-logo">
            <div className="brand-icon-box">
              <img src="/logo.png" alt="Eagle Eyes Security Service" />
            </div>
            <CompanyTitle />
          </div>

          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            © {new Date().getFullYear()} Eagle Eye Security Service. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side: Clean Form Panel */}
      <div className="form-panel">
        <div className="form-container">

          <div className="mobile-logo">
            <CompanyTitle />
          </div>

          {showSuccess ? (
            <div className="success-wrapper">
              <div className="success-icon-container">
                <CheckCircle size={40} />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: BLUE, marginBottom: 8 }}>
                Welcome back!
              </h2>
              <p style={{ color: '#64748b', fontSize: 16 }}>
                Securely logging you into your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="header-text">
                <h2>Sign In</h2>
                <p>Enter your details to access your account.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* Email Input */}
                <div className="input-group">
                  <label className="input-label" htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <Mail
                      className="input-icon"
                      size={20}
                      style={{ color: focusedInput === 'email' ? BLUE : '#94a3b8' }}
                    />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className={`input-field ${errors.email ? 'has-error' : ''}`}
                      onFocus={() => setFocusedInput('email')}
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address",
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <span className="error-message">
                      <AlertCircle size={14} /> {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label className="input-label" htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <Lock
                      className="input-icon"
                      size={20}
                      style={{ color: focusedInput === 'password' ? BLUE : '#94a3b8' }}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`input-field ${errors.password ? 'has-error' : ''}`}
                      onFocus={() => setFocusedInput('password')}
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-message">
                      <AlertCircle size={14} /> {errors.password.message}
                    </span>
                  )}
                </div>

                {/* <button type="button" className="forgot-password">
                  Forgot Password?
                </button> */}

                {/* Global API Error */}
                {error && (
                  <div className="api-error-banner" style={{ marginTop: 24 }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
