'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const symbols = [
  { img: 'red.png', weight: 60 },
  { img: 'green.png', weight: 30 },
  { img: 'purple.png', weight: 10 },
];

const SPIN_COST = 10000;
const WIN_REWARD = 50000;

const REEL_COUNT = 6;
const ROWS = 5;

export default function Home() {
  const [reels, setReels] = useState(
    Array.from({ length: REEL_COUNT }, () => Array(ROWS).fill(0))
  );
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(90000);
  const [highlight, setHighlight] = useState(false);
  const [shake, setShake] = useState(false);

  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const pickSymbol = () => {
    const total = symbols.reduce((a, s) => a + s.weight, 0);
    let rnd = Math.random() * total;

    for (let i = 0; i < symbols.length; i++) {
      rnd -= symbols[i].weight;
      if (rnd <= 0) return i;
    }
    return 0;
  };

  // LOAD BALANCE + AUDIO
  useEffect(() => {
    const saved = localStorage.getItem('slot_balance');
    if (saved) setBalance(parseInt(saved));

    spinAudioRef.current = new Audio('/spin.mp3');
    winAudioRef.current = new Audio('/win.mp3');
  }, []);

  useEffect(() => {
    localStorage.setItem('slot_balance', balance.toString());
  }, [balance]);

  // ANIMASI SALDO
  // Use an explicit start value so the animation begins from the correct balance
  const animateBalanceIncrease = (startValue: number, amount: number) => {
    let current = startValue;
    const end = startValue + amount;
    // ensure at least step of 1 to make visible increments
    const step = Math.max(1, Math.floor((end - startValue) / 25));
    let count = 0;

    const anim = setInterval(() => {
      count++;
      current += step;
      setBalance(Math.min(end, Math.floor(current)));

      if (count >= 25) {
        setBalance(end);
        clearInterval(anim);
      }
    }, 40);
  };

  // ================================
  //          SPIN LOGIC 30%
  // ================================
  const spin = async () => {
    if (spinning || balance < SPIN_COST) return;

  setSpinning(true);
  setHighlight(false);
  setShake(false);
  setMessage('');

  // deduct cost immediately and capture new balance for animations
  const newBalance = balance - SPIN_COST;
  setBalance(newBalance);

  spinAudioRef.current?.play();

    const temp = [...reels];

    // REEL PHYSICS
    for (let i = 0; i < REEL_COUNT; i++) {
      await new Promise(res => setTimeout(res, 150));

      const sp = setInterval(() => {
        temp[i] = Array.from({ length: ROWS }, () => pickSymbol());
        setReels([...temp]);
      }, 80);

      await new Promise(res =>
        setTimeout(() => {
          clearInterval(sp);
          res(0);
        }, 600 + i * 180)
      );
    }

    
    const isWin = Math.random() < 0.05; // 5% CHANCE TO WIN

    let finalReels;

    if (isWin) {
      // ALL SYMBOLS SAME
      const sym = pickSymbol();
      finalReels = Array.from({ length: REEL_COUNT }, () =>
        Array(ROWS).fill(sym)
      );
    } else {
      // RANDOM = LOSE
      finalReels = Array.from({ length: REEL_COUNT }, () =>
        Array.from({ length: ROWS }, () => pickSymbol())
      );
    }

    setReels(finalReels);
    setSpinning(false);

    // =====================
    //     RESULT EFFECTS
    // =====================
    if (isWin) {
      winAudioRef.current?.play();
      // animate from the balance after paying the spin cost
      animateBalanceIncrease(newBalance, WIN_REWARD);
      setMessage("🎉 YOU WIN!");
      setHighlight(true);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.7 }
      });
    } else {
      setMessage("Coba lagi!");
      setShake(true);
    }
  };

  return (
    <div className={`container ${shake ? 'shake' : ''}`}>
      <h1 className="title">SLOT HALAL 🎰</h1>
      <div className="balance">💰 Saldo: Rp {balance.toLocaleString()}</div>

      <div className={`slot-grid ${highlight ? 'highlight' : ''}`}>
        {reels.map((col, i) => (
          <div className="column" key={i}>
            {col.map((sym, j) => (
              <div className="slot-symbol reel-stop" key={j}>
                <img src={`/icons/${symbols[sym].img}`} alt="" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        className="spin-btn"
        onClick={spin}
        disabled={spinning || balance < SPIN_COST}
      >
        {spinning ? 'Spinning...' : `SPIN (Rp ${SPIN_COST.toLocaleString()})`}
      </button>

      <p className="message">{message}</p>
    </div>
  );
}
