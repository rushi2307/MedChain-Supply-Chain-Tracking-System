import '../Interface.css'
import { useEffect, useState } from 'react'
import backgroundVideo from './assets/Blue-Red medicine video.mp4'

function Interface({ onSelectRole, onSignup }) {
  const [dateTime, setDateTime] = useState(new Date())
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (showAbout) {
    return (
      <div className="about-page">
        <header className="topbar">
          <h2>MedChain</h2>
          <button className="back-btn" onClick={() => setShowAbout(false)}>
            Back to Home
          </button>
        </header>

        <main className="about-content">
          <h1>About Our Developers</h1>
          <p>
            MedChain was created by a team focused on making medicine tracking
            secure, transparent, and reliable for every stakeholder.
          </p>

          <div className="developer-grid">
            <div className="developer-card">
              <h3>Hrushikesh kamble</h3>

              <p>Frontend Developer</p>
              <p>Designs the user experience and landing pages.</p>
            </div>

            <div className="developer-card">
              <h3>Inaya Khan</h3>
              <p>Backend Developer</p>
              <p>Builds APIs and some backend functionality.</p>
            </div>

            <div className="developer-card">
              <h3>Siddhesh Kulkarni</h3>
              <p>Blockchain & Security</p>
              <p>Handles smart contract logic and supply-chain security.</p>
            </div>
          </div>
        </main>
      </div>

    )
  }

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
            <a href="#Home">Home</a>
            <a href="#about" onClick={(e) => {
              e.preventDefault()
              setShowAbout(true)
            }}>
              About us
            </a>
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
              Login as Retailer
            </button>
            <button className="login-option" onClick={() => onSelectRole('Consumer')}>
              Login as Consumer
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