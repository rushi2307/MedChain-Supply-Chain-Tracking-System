import '../Interface.css'
import { useEffect, useState } from 'react'
import backgroundVideo from './assets/Blue-Red medicine video.mp4'

function Interface({ onSelectRole, onSignup }) {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  return (
    <div className="interface-page">
      <video
        className="background-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className="video-overlay" />

      <div className="interface-content">
        <header>
          <h2>MedChain</h2>
          <nav>
            <a href="#home">Home</a>
            <a href="#about">About us</a>
            <a href="#contact">Contact us</a>
          </nav>
        </header>

        <main className="main-container">
        <div className="box">
          <h2>Login</h2>
          <button className="login-option" onClick={() => onSelectRole('Manufacturer')}>
            Login as Manufacturer
          </button>
          <button className="login-option" onClick={() => onSelectRole('Distributor')}>
            Login as Distributor
          </button>
          <button className="login-option" onClick={() => onSelectRole('Retailer')}>
            Login as Vendor
          </button>
        </div>

        <div className="box">
          <h2>Sign Up</h2>
          <button className="signup-option" onClick={onSignup}>
            Add a New User
          </button>
        </div>
        </main>

        <footer className="footer">
          <p className="date-time">
            MedChain | {dateTime.toLocaleDateString()} | {dateTime.toLocaleTimeString()}
          </p>
          <p>&copy; 2026 MedChain. All rights reserved.</p>
        </footer>
      </div>
    </div>

  )
}

export default Interface
