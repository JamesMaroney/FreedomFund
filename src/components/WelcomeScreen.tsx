import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <motion.div
      className="screen welcome-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
    >
      {/* Ambient glow orbs — match the home screen aesthetic */}
      <div className="welcome-orb welcome-orb--gold" aria-hidden />
      <div className="welcome-orb welcome-orb--green" aria-hidden />

      <div className="welcome-inner">

        {/* Hero */}
        <div className="welcome-hero">
          <img className="welcome-icon" src="icon-192.png" alt="Freedom Fund" />
          <h1 className="welcome-title">Freedom Fund</h1>
          <p className="welcome-tagline">
            Save a little today.<br />
            <em>Build big freedom</em> tomorrow.
          </p>
        </div>

        {/* How it works */}
        <div className="welcome-steps">
          <div className="welcome-step">
            <span className="welcome-step__icon" aria-hidden>1</span>
            <div className="welcome-step__text">
              <strong>Skip a purchase</strong>
              <span>Resist an impulse. That money is now yours.</span>
            </div>
          </div>
          <div className="welcome-step">
            <span className="welcome-step__icon" aria-hidden>2</span>
            <div className="welcome-step__text">
              <strong>Pay yourself instead</strong>
              <span>Log the amount. Watch your fund grow with every skip.</span>
            </div>
          </div>
          <div className="welcome-step">
            <span className="welcome-step__icon" aria-hidden>3</span>
            <div className="welcome-step__text">
              <strong>Watch it compound</strong>
              <span>See how skipping a $15 burger grows to $114 over 30 years.</span>
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <p className="welcome-privacy">
          🔒 No account, no server, no bank access — your data never leaves your device.
        </p>

        {/* CTA */}
        <button
          className="welcome-cta"
          onClick={onGetStarted}
        >
          Get started
        </button>

        <p className="welcome-inspired">
          Inspired by{' '}
          <a
            href="https://grantsabatier.com/books/financial-freedom-book/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <em>Financial Freedom</em> by Grant Sabatier
          </a>
        </p>

      </div>
    </motion.div>
  );
}
