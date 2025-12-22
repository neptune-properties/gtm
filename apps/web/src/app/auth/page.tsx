'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const supabase = supabaseBrowser();

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) throw error;

      router.push("/");
    } catch (err: any) {
      setMsg(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Login Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px 38px 20px 38px',
        width: '100%',
        maxWidth: '480px',
        minHeight: '520px'
      }}>
        {/* Welcome Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px', paddingTop: '20px' }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: '400',
            color: '#1A1A1A',
            margin: '0 0 8px 0',
            letterSpacing: '0px',
            fontFamily: 'Bebas Neue, sans-serif',
            lineHeight: '100%'
          }}>
            WELCOME
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Log in to access your lead pipeline
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2c5f5f';
                e.target.style.borderWidth = '2px';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2c5f5f';
                  e.target.style.borderWidth = '2px';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '6px'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer'
            }}>
              <div style={{ position: 'relative', marginRight: '8px' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ 
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    margin: 0,
                    appearance: 'none',
                    border: '2px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: rememberMe ? '#2c5f5f' : 'white'
                  }}
                />
              </div>
              Remember me
            </label>
            <a
              href="#"
              style={{
                fontSize: '14px',
                color: '#2c5f5f',
                textDecoration: 'none'
              }}
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset functionality coming soon!');
              }}
            >
              Forgot password?
            </a>
          </div>

          {/* Error Message */}
          {msg && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {msg}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: (loading || !email || !password) ? '#d1d5db' : '#2c5f5f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
              marginBottom: '24px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading && email && password) {
                e.currentTarget.style.backgroundColor = '#234848';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email && password) {
                e.currentTarget.style.backgroundColor = '#2c5f5f';
              }
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Social Login Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            <span style={{
              padding: '0 12px',
              fontSize: '14px',
              color: '#9ca3af'
            }}>
              Or continue with
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          </div>

          {/* Social Login Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <button
              type="button"
              disabled
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: '#6b7280',
                cursor: 'not-allowed',
                opacity: 0.5
              }}
            >
              Google
            </button>
            <button
              type="button"
              disabled
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: '#6b7280',
                cursor: 'not-allowed',
                opacity: 0.5
              }}
            >
              Microsoft
            </button>
            <button
              type="button"
              disabled
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: '#6b7280',
                cursor: 'not-allowed',
                opacity: 0.5
              }}
            >
              Apple
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: '16px',
        fontSize: '13px',
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: '480px'
      }}>
        By continuing, you agree to Neptune's Terms and Privacy Policy.
      </p>
    </div>
  );
}
