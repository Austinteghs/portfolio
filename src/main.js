import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==========================================================================
// Custom Cursor Logic
// ==========================================================================
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

if (cursorDot && cursorOutline && window.innerWidth > 768) {
  window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Slight delay for the outline to create a trailing effect
    cursorOutline.animate(
      {
        left: `${posX}px`,
        top: `${posY}px`
      },
      { duration: 500, fill: 'forwards' }
    );
  });

  // Add hover effect to interactive elements
  const interactives = document.querySelectorAll('a, .btn');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
    });
  });
}

// ==========================================================================
// Mobile Nav Toggle
// ==========================================================================
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ==========================================================================
// Terminal Typing Effect
// ==========================================================================
const words = ['Data Engineer', 'Analytics Engineer', 'Pipeline Builder', 'Data Modeler'];
let i = 0;
let timer;
let isDeleting = false;
let currentWord = '';
let letterIndex = 0;
const typeSpeed = 100;
const deleteSpeed = 50;
const delayBetweenWords = 2000;

function typeEffect() {
  const targetElement = document.getElementById('typed-text');
  if (!targetElement) return;

  const currentString = words[i];

  if (isDeleting) {
    currentWord = currentString.substring(0, letterIndex - 1);
    letterIndex--;
  } else {
    currentWord = currentString.substring(0, letterIndex + 1);
    letterIndex++;
  }

  targetElement.innerHTML = currentWord;

  let speed = isDeleting ? deleteSpeed : typeSpeed;

  if (!isDeleting && currentWord === currentString) {
    speed = delayBetweenWords;
    isDeleting = true;
  } else if (isDeleting && currentWord === '') {
    isDeleting = false;
    i = (i + 1) % words.length;
    speed = 500;
  }

  timer = setTimeout(typeEffect, speed);
}

// Start typing effect
setTimeout(typeEffect, 1500);

// ==========================================================================
// GSAP Animations
// ==========================================================================

// Navbar fade in
gsap.to('.gsap-fade-in', {
  autoAlpha: 1,
  duration: 1,
  delay: 0.2
});

// Hero animations
gsap.fromTo('.gsap-fade-up', 
  { y: 30, autoAlpha: 0 },
  {
    y: 0,
    autoAlpha: 1,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
  }
);

// Scroll Trigger Animations for generic sections
const scrollElements = document.querySelectorAll('.gsap-scroll-trigger');

scrollElements.forEach(el => {
  gsap.fromTo(el,
    { y: 50, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    }
  );
});
