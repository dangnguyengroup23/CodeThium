import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    // Validation
    if (isLogin) {
      if (!trimmedUsername && !trimmedEmail) return setError('Please provide a username or email');
      if (!trimmedPassword) return setError('Please provide a password');
    } else {
      if (!trimmedUsername || !trimmedEmail || !trimmedPassword) return setError('Please fill all required fields');
      if (trimmedPassword !== trimmedConfirm) return setError('Passwords do not match');
    }

    try {
      if (isLogin) {
        const response = await fetch('http://localhost:4000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: trimmedUsername, email: trimmedEmail, password: trimmedPassword }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        onLogin(data.user || { email: trimmedEmail || trimmedUsername });
        navigate('/chatbot');
      } else {
        const registerResponse = await fetch('http://localhost:4000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: trimmedUsername, email: trimmedEmail, password: trimmedPassword }),
        });

        const registerData = await registerResponse.json();
        if (!registerResponse.ok) throw new Error(registerData.error || 'Registration failed');

        // Auto-login after register
        const loginResponse = await fetch('http://localhost:4000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.error || 'Auto-login failed');
        onLogin(loginData.user || { email: trimmedEmail });
        navigate('/chatbot');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSocialLogin = (provider) => {
    setError(`Social login with ${provider} is not implemented yet`);
  };

  const handleInputChange = (value) => {
    if (value.includes('@')) {
      setEmail(value);
      setUsername('');
    } else {
      setUsername(value);
      setEmail('');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.formContent}>
          <h2 className={styles.title}>{isLogin ? 'Codethium AI: Code On!' : 'Join Codethium AI'}</h2>
          <p className={styles.subtitle}>{isLogin ? 'Unleash your AI coding assistant' : 'Start your coding journey'}</p>

          <form onSubmit={handleSubmit} className={styles.formWrapper}>
            {isLogin ? (
              <>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={username || email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={styles.input}
                    placeholder="Enter username or email"
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.primaryButton}>
              {isLogin ? 'Launch AI' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.toggleMethod}>
            {isLogin ? (
              <div className={styles.toggleAuth}>
                New here? <button onClick={() => setIsLogin(false)}>Sign Up</button>
              </div>
            ) : (
              <>Have an account? <button onClick={() => setIsLogin(true)}>Login</button></>
            )}
          </div>

          <div className={styles.divider}>{isLogin ? 'Or code with' : 'Or join with'}</div>

          <div className={styles.socialLoginButtons}>
            {['Google', 'Apple', 'Microsoft'].map((provider) => (
              <button
                key={provider}
                className={styles.socialButton}
                onClick={() => handleSocialLogin(provider)}
              >
                <img src={`/icons/${provider.toLowerCase()}.svg`} alt={`${provider} icon`} />
              </button>
            ))}
          </div>

          <div className={styles.footer}>
            <p>Built for coders</p>
            <div className={styles.footerLinks}>
              <a href="https://github.com/dangnguyengroup23" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://discord.gg/codethium" target="_blank" rel="noopener noreferrer">Discord</a>
              <a href="https://www.linkedin.com/in/huong-dang-a19115303/" target="_blank" rel="noopener noreferrer">Linkedin</a>
            </div>
            <p className={styles.footerCredit}>Authorized by Huong Dang</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;