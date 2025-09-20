// WebGL 3D Sushi Discovery Engine
// Procedural sushi generation with realistic physics

(function() {
  const $ = (sel) => document.querySelector(sel);
  
  // WebGL Scene Setup
  let scene, camera, renderer, world;
  let sushiMesh, sushiBody;
  let plateGeometry, plateMaterial, plateMesh, plateBody;
  let currentSushi = null;
  let isAnimating = false;
  
  // Sushi Procedural Data
  const sushiTypes = {
    nigiri_salmon: {
      emoji: '🍣',
      colors: {
        fish: 0xff6b6b,
        rice: 0xf8f8f8,
        accent: 0xff8e8e
      },
      shape: 'oblong',
      size: { width: 1.2, height: 0.6, depth: 0.8 },
      texture: 'smooth_fish'
    },
    nigiri_tuna: {
      emoji: '🍣',
      colors: {
        fish: 0xff3838,
        rice: 0xf8f8f8,
        accent: 0xc44569
      },
      shape: 'oblong',
      size: { width: 1.2, height: 0.6, depth: 0.8 },
      texture: 'marbled_fish'
    },
    maki_roll: {
      emoji: '🍱',
      colors: {
        nori: 0x1a4d3a,
        rice: 0xf8f8f8,
        filling: 0xff6b6b
      },
      shape: 'cylinder',
      size: { radius: 0.8, height: 1.0 },
      texture: 'nori_wrap'
    },
    temaki_hand_roll: {
      emoji: '🍱',
      colors: {
        nori: 0x0f2d1f,
        rice: 0xf8f8f8,
        filling: 0xffa726
      },
      shape: 'cone',
      size: { radius: 0.6, height: 1.4 },
      texture: 'crispy_nori'
    },
    sashimi: {
      emoji: '🍟',
      colors: {
        fish: 0xff4757,
        garnish: 0x2ed573
      },
      shape: 'slice',
      size: { width: 1.5, height: 0.3, depth: 1.0 },
      texture: 'fresh_cut'
    },
    chirashi: {
      emoji: '🍱',
      colors: {
        rice: 0xf8f8f8,
        fish1: 0xff6b6b,
        fish2: 0xff3838,
        fish3: 0xffa726,
        vegetables: 0x2ed573
      },
      shape: 'bowl',
      size: { radius: 1.0, height: 0.8 },
      texture: 'mixed_bowl'
    }
  };
  
  // Role to Sushi Type Mapping
  const roleToSushiType = {
    'Engineer': 'nigiri_salmon',
    'Developer': 'nigiri_salmon', 
    'Software': 'nigiri_salmon',
    'Data': 'maki_roll',
    'Scientist': 'maki_roll',
    'Manager': 'nigiri_tuna',
    'Director': 'nigiri_tuna',
    'Designer': 'temaki_hand_roll',
    'Product': 'chirashi',
    'Sales': 'sashimi',
    'default': 'nigiri_salmon'
  };
  
  function getSushiTypeForRole(roleTitle) {
    const role = roleTitle.toLowerCase();
    for (const [key, sushiType] of Object.entries(roleToSushiType)) {
      if (key !== 'default' && role.includes(key.toLowerCase())) {
        return sushiType;
      }
    }
    return roleToSushiType.default;
  }
  
  // Gamification & Engagement System
  let gameStats = {
    totalSwiped: 0,
    acceptedStreak: 0,
    maxStreak: 0,
    rejectedInRow: 0,
    perfectMatches: 0, // 9+ fit score accepts
    sushiMaster: false,
    achievements: [],
    lastAction: null,
    sessionStart: Date.now()
  };
  
  const achievements = {
    first_taste: {
      name: "First Taste",
      description: "Grabbed your first sushi! 🍣",
      trigger: (stats) => stats.totalSwiped === 1,
      reward: "Unlocked sushi animations!"
    },
    streak_3: {
      name: "Getting Warmed Up",
      description: "3 accepts in a row! 🔥",
      trigger: (stats) => stats.acceptedStreak >= 3,
      reward: "Streak multiplier: 1.2x"
    },
    streak_5: {
      name: "On Fire!",
      description: "5 accepts in a row! 🔥🔥",
      trigger: (stats) => stats.acceptedStreak >= 5,
      reward: "Streak multiplier: 1.5x + Fireworks!"
    },
    streak_10: {
      name: "Sushi Master",
      description: "10 accepts in a row! 🏆",
      trigger: (stats) => stats.acceptedStreak >= 10,
      reward: "Gold sushi plate + Master title!"
    },
    perfectionist: {
      name: "Perfectionist",
      description: "5 perfect matches (9+ fit)! ✨",
      trigger: (stats) => stats.perfectMatches >= 5,
      reward: "Crystal sushi effects!"
    },
    speed_demon: {
      name: "Speed Demon",
      description: "20 swipes in 2 minutes! ⚡",
      trigger: (stats) => stats.totalSwiped >= 20 && (Date.now() - stats.sessionStart) < 120000,
      reward: "Sonic boom animations!"
    },
    picky_eater: {
      name: "Picky Eater",
      description: "Rejected 10 in a row... 🤔",
      trigger: (stats) => stats.rejectedInRow >= 10,
      reward: "Unlocked quality filter!"
    }
  };
  
  function checkAchievements() {
    for (const [key, achievement] of Object.entries(achievements)) {
      if (!gameStats.achievements.includes(key) && achievement.trigger(gameStats)) {
        gameStats.achievements.push(key);
        triggerAchievement(achievement);
      }
    }
  }
  
  function triggerAchievement(achievement) {
    // Epic achievement animation
    showAchievementBanner(achievement);
    createFireworks();
    playAchievementSound();
    
    // Save to analytics
    swipeAnalytics.achievements = swipeAnalytics.achievements || [];
    swipeAnalytics.achievements.push({
      name: achievement.name,
      timestamp: Date.now(),
      stats: {...gameStats}
    });
  }
  
  function updateStreaks(isAccept, fitScore) {
    gameStats.totalSwiped++;
    
    if (isAccept) {
      gameStats.acceptedStreak++;
      gameStats.rejectedInRow = 0;
      gameStats.maxStreak = Math.max(gameStats.maxStreak, gameStats.acceptedStreak);
      
      if (fitScore >= 9.0) {
        gameStats.perfectMatches++;
      }
      
      // Streak celebrations
      if (gameStats.acceptedStreak % 3 === 0) {
        createStreakExplosion(gameStats.acceptedStreak);
      }
    } else {
      gameStats.acceptedStreak = 0;
      gameStats.rejectedInRow++;
    }
    
    gameStats.lastAction = isAccept ? 'accept' : 'reject';
    checkAchievements();
    updateStreakDisplay();
  }
  
  function createStreakExplosion(streakCount) {
    if (!scene) return;
    
    const colors = {
      3: 0x00ff00,   // Green
      5: 0xff6600,   // Orange  
      7: 0xff0066,   // Pink
      10: 0xffd700,  // Gold
      15: 0x9966ff   // Purple
    };
    
    const color = colors[Math.min(streakCount, 15)] || 0xffffff;
    
    // WebGL particle explosion
    const particleCount = streakCount * 5;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2;
      positions[i + 1] = (Math.random() - 0.5) * 2;
      positions[i + 2] = (Math.random() - 0.5) * 2;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color, size: 0.1 });
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    
    // Animate explosion
    gsap.to(particleSystem.rotation, {
      duration: 2,
      x: Math.PI * 2,
      y: Math.PI * 2
    });
    
    gsap.to(particleSystem.scale, {
      duration: 2,
      x: 3,
      y: 3,
      z: 3,
      ease: "power2.out"
    });
    
    gsap.to(particleMaterial, {
      duration: 2,
      opacity: 0,
      onComplete: () => scene.remove(particleSystem)
    });
  }
  
  function createFireworks() {
    if (!scene) return;
    
    const fireworksCount = 5;
    const colors = [0xff0066, 0x00ff66, 0x6600ff, 0xffff00, 0xff6600];
    
    for (let i = 0; i < fireworksCount; i++) {
      setTimeout(() => {
        const color = colors[i % colors.length];
        createSingleFirework(color, 
          (Math.random() - 0.5) * 4, 
          Math.random() * 2 + 1, 
          (Math.random() - 0.5) * 4
        );
      }, i * 200);
    }
  }
  
  function createSingleFirework(color, x, y, z) {
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3
      });
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const fireworkMaterial = new THREE.PointsMaterial({ 
      color, 
      size: 0.05,
      transparent: true,
      opacity: 1
    });
    const firework = new THREE.Points(particles, fireworkMaterial);
    scene.add(firework);
    
    // Animate firework explosion
    const animateFirework = () => {
      const positions = firework.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i].x;
        positions[i3 + 1] += velocities[i].y;
        positions[i3 + 2] += velocities[i].z;
        
        velocities[i].y -= 0.01; // gravity
      }
      
      firework.geometry.attributes.position.needsUpdate = true;
    };
    
    gsap.ticker.add(animateFirework);
    
    gsap.to(fireworkMaterial, {
      duration: 3,
      opacity: 0,
      onComplete: () => {
        gsap.ticker.remove(animateFirework);
        scene.remove(firework);
      }
    });
  }
  
  function showAchievementBanner(achievement) {
    const banner = document.createElement('div');
    banner.className = 'achievement-banner';
    banner.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-content">
        <div class="achievement-title">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
        <div class="achievement-reward">${achievement.reward}</div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Animate banner entrance
    gsap.fromTo(banner, 
      { y: -100, opacity: 0, scale: 0.8 },
      { y: 20, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
    );
    
    // Auto-remove after display
    setTimeout(() => {
      gsap.to(banner, {
        y: -100,
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        onComplete: () => banner.remove()
      });
    }, 4000);
  }
  
  function updateStreakDisplay() {
    // Update the UI with current streak info
    const streakInfo = document.getElementById('streak-info') || createStreakDisplay();
    
    let streakText = '';
    if (gameStats.acceptedStreak > 0) {
      streakText = `🔥 ${gameStats.acceptedStreak} streak!`;
      if (gameStats.acceptedStreak >= 5) {
        streakText += ' (ON FIRE!)';
      }
    }
    
    streakInfo.innerHTML = `
      <div class="streak-counter">${streakText}</div>
      <div class="stats-mini">
        Total: ${gameStats.totalSwiped} | 
        Best: ${gameStats.maxStreak} | 
        Achievements: ${gameStats.achievements.length}
      </div>
    `;
  }
  
  function createStreakDisplay() {
    const streakDisplay = document.createElement('div');
    streakDisplay.id = 'streak-info';
    streakDisplay.className = 'streak-display';
    
    const conveyor = document.getElementById('sushi-conveyor');
    conveyor.parentNode.insertBefore(streakDisplay, conveyor);
    
    return streakDisplay;
  }
  
  function playAchievementSound() {
    // Create achievement sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Achievement fanfare melody
      const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (octave)
      
      notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'triangle';
        
        const startTime = audioContext.currentTime + (index * 0.15);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.2);
        
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {
      // Fallback: no sound if Web Audio not available
      console.log('Achievement earned! (Sound not available)');
    }
  }
  
  // Omakase Cultural Experience System
  let omakaseState = {
    hasEnteredBefore: false,
    chefMood: 'welcoming', // welcoming, pleased, impressed, masterful
    respectLevel: 100, // 0-100, affects chef interactions
    sessionStarted: false,
    lastChefMessage: null,
    totalTipped: 0,
    perfectStreak: 0
  };
  
  const japanesePhrases = {
    // Greetings & Welcome
    entrance: {
      first_time: {
        japanese: "Hajimemashite!",
        english: "Nice to meet you!",
        context: "Welcome to our omakase experience"
      },
      returning: {
        japanese: "Okaeri nasai!", 
        english: "Welcome back!",
        context: "The chef remembers you"
      },
      regular: {
        japanese: "Irasshaimase!",
        english: "Welcome!",
        context: "Traditional restaurant greeting"
      }
    },
    
    // Quality & Taste Reactions
    excellent_choice: {
      japanese: "Oishii desu ne!",
      english: "It's delicious!",
      context: "Chef approves of your excellent taste"
    },
    perfect_match: {
      japanese: "Kanpeki desu!",
      english: "Perfect!",
      context: "You chose a 9+ fit score role"
    },
    good_taste: {
      japanese: "Ii desu ne!",
      english: "That's good!", 
      context: "Solid choice, chef nods approvingly"
    },
    
    // Appreciation & Thanks
    gratitude: {
      japanese: "Arigatou gozaimasu!",
      english: "Thank you very much!",
      context: "Chef is grateful for your discerning palate"
    },
    deep_bow: {
      japanese: "Domo arigatou gozaimashita!",
      english: "Thank you so very much!",
      context: "Highest form of gratitude"
    },
    casual_thanks: {
      japanese: "Domo domo!",
      english: "Thanks!",
      context: "Friendly, warm appreciation"
    },
    
    // Encouragement & Guidance
    try_this: {
      japanese: "Kore wo tabete mite kudasai!",
      english: "Please try this!",
      context: "Chef recommends a special piece"
    },
    take_time: {
      japanese: "Yukkuri dozo!",
      english: "Please take your time!",
      context: "No rush, savor the experience"
    },
    trust_chef: {
      japanese: "Omakase shimasu!",
      english: "I leave it up to you!",
      context: "Ultimate trust in the chef's selection"
    },
    
    // Disappointment (when rejecting good fits)
    mild_concern: {
      japanese: "Sou desu ka...",
      english: "Is that so...",
      context: "Chef is puzzled by your choice"
    },
    understanding: {
      japanese: "Wakarimashita.",
      english: "I understand.",
      context: "Chef respects your preference"
    },
    
    // Celebration & Mastery
    impressed: {
      japanese: "Sugoi desu!",
      english: "Amazing!",
      context: "Chef is truly impressed"
    },
    master_level: {
      japanese: "Anata wa shokunin desu!",
      english: "You are a craftsperson!",
      context: "Highest compliment - you understand quality"
    },
    
    // Beer & Sake Etiquette
    offer_drink: {
      japanese: "Bīru wa ikaga desu ka?",
      english: "How about a beer?",
      context: "Chef offers a drink to enhance the experience"
    },
    kanpai: {
      japanese: "Kanpai!",
      english: "Cheers!",
      context: "Celebrating good choices together"
    }
  };
  
  function getChefGreeting() {
    if (!omakaseState.hasEnteredBefore) {
      omakaseState.hasEnteredBefore = true;
      localStorage.setItem('omakase_visited', 'true');
      return japanesePhrases.entrance.first_time;
    } else if (gameStats.maxStreak > 5) {
      return japanesePhrases.entrance.returning;
    } else {
      return japanesePhrases.entrance.regular;
    }
  }
  
  function getChefReaction(isAccept, fitScore, company) {
    let reaction = null;
    
    if (isAccept) {
      if (fitScore >= 9.0) {
        omakaseState.perfectStreak++;
        if (omakaseState.perfectStreak >= 3) {
          reaction = japanesePhrases.impressed;
          omakaseState.chefMood = 'impressed';
        } else {
          reaction = japanesePhrases.perfect_match;
        }
      } else if (fitScore >= 8.0) {
        reaction = japanesePhrases.excellent_choice;
        omakaseState.chefMood = 'pleased';
      } else if (fitScore >= 7.0) {
        reaction = japanesePhrases.good_taste;
      } else {
        // Lower fit but still accepted - chef is puzzled
        reaction = japanesePhrases.mild_concern;
        omakaseState.respectLevel = Math.max(50, omakaseState.respectLevel - 10);
      }
      
      // Special reactions for streak milestones
      if (gameStats.acceptedStreak === 5) {
        reaction = japanesePhrases.gratitude;
      } else if (gameStats.acceptedStreak >= 10) {
        reaction = japanesePhrases.master_level;
        omakaseState.chefMood = 'masterful';
      }
    } else {
      // Rejected
      omakaseState.perfectStreak = 0;
      if (fitScore >= 8.5) {
        // Rejecting high quality - chef is concerned
        reaction = japanesePhrases.mild_concern;
        omakaseState.respectLevel = Math.max(30, omakaseState.respectLevel - 15);
      } else {
        reaction = japanesePhrases.understanding;
      }
    }
    
    return reaction;
  }
  
  function offerBeer() {
    if (gameStats.acceptedStreak >= 3 && Math.random() < 0.3) {
      return japanesePhrases.offer_drink;
    }
    return null;
  }
  
  function showChefMessage(phrase, isSpecial = false) {
    if (!phrase) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `chef-message ${isSpecial ? 'special' : ''}`;
    messageEl.innerHTML = `
      <div class="chef-avatar">👨‍🍳</div>
      <div class="chef-bubble">
        <div class="japanese-text">${phrase.japanese}</div>
        <div class="english-text">${phrase.english}</div>
        <div class="context-text">${phrase.context}</div>
      </div>
    `;
    
    document.body.appendChild(messageEl);
    
    // Animate entrance
    gsap.fromTo(messageEl, 
      { x: -300, opacity: 0 },
      { x: 20, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    );
    
    // Auto-remove after display
    setTimeout(() => {
      gsap.to(messageEl, {
        x: -300,
        opacity: 0,
        duration: 0.4,
        onComplete: () => messageEl.remove()
      });
    }, 4000);
    
    omakaseState.lastChefMessage = Date.now();
  }
  
  function initializeOmakase() {
    // Check if user has visited before
    omakaseState.hasEnteredBefore = localStorage.getItem('omakase_visited') === 'true';
    
    // Show greeting after short delay
    setTimeout(() => {
      const greeting = getChefGreeting();
      showChefMessage(greeting, true);
    }, 1500);
    
    // Add omakase class to body for styling
    document.body.classList.add('omakase-mode');
    
    // Update based on chef mood
    updateOmakaseAmbiance();
  }
  
  function updateOmakaseAmbiance() {
    const body = document.body;
    
    // Remove existing mood classes
    body.classList.remove('chef-welcoming', 'chef-pleased', 'chef-impressed', 'chef-masterful');
    
    // Add current mood class
    body.classList.add(`chef-${omakaseState.chefMood}`);
    
    // Update respect level indicator
    const respectIndicator = document.getElementById('respect-level') || createRespectIndicator();
    respectIndicator.style.width = `${omakaseState.respectLevel}%`;
    
    if (omakaseState.respectLevel > 80) {
      respectIndicator.className = 'respect-bar excellent';
    } else if (omakaseState.respectLevel > 60) {
      respectIndicator.className = 'respect-bar good';
    } else {
      respectIndicator.className = 'respect-bar needs-improvement';
    }
  }
  
  function createRespectIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'omakase-respect';
    indicator.innerHTML = `
      <div class="respect-label">Chef's Respect: <span id="respect-percentage">${omakaseState.respectLevel}%</span></div>
      <div class="respect-bar-container">
        <div class="respect-bar" id="respect-level"></div>
      </div>
    `;
    
    const streakDisplay = document.querySelector('.streak-display');
    if (streakDisplay) {
      streakDisplay.appendChild(indicator);
    }
    
    return document.getElementById('respect-level');
  }
  
  // Food Poisoning Bias Detection System
  let healthSystem = {
    toxicPatterns: [],
    sicknessSeverity: 0, // 0-100, higher = more sick from bad patterns
    immunityLevel: 100, // 0-100, higher = better at avoiding bad fits
    lastPoisoning: null,
    recoveryTime: 0,
    warningsSent: 0
  };
  
  // Happy Panda Mochi Rewards Bank
  let pandaBank = {
    mochiCount: 0,
    totalEarned: 0,
    pandaMood: 'sleepy', // sleepy, happy, excited, ecstatic
    specialMochi: [],
    bankLevel: 1, // Unlocks better mochi types
    lastReward: null
  };
  
  // Bozu Prize System (Buddhist monk wisdom)
  let bozuSystem = {
    wisdomPoints: 0,
    enlightenmentLevel: 1, // 1-10
    teachingsUnlocked: [],
    meditationStreak: 0,
    karmaBalance: 50, // 0-100, neutral at 50
    lastTeaching: null
  };
  
  const toxicCompanyPatterns = {
    'toxic_culture': {
      indicators: ['unlimited PTO', 'work hard play hard', 'fast-paced environment', 'wear many hats'],
      symptoms: '🤢 Burned out from toxic culture',
      prevention: 'Look for companies with clear work-life balance policies'
    },
    'red_flag_leadership': {
      indicators: ['disruptive', 'move fast break things', 'hustle culture', 'rockstar ninja'],
      symptoms: '😵 Dizzy from chaotic leadership',
      prevention: 'Research leadership team and company values thoroughly'
    },
    'unsustainable_growth': {
      indicators: ['hockey stick growth', 'blitz scaling', 'rapid expansion'],
      symptoms: '😷 Nauseous from unstable environment', 
      prevention: 'Check company financials and growth sustainability'
    },
    'poor_compensation': {
      indicators: ['competitive salary', 'equity upside', 'below market rate'],
      symptoms: '😱 Weak from financial stress',
      prevention: 'Always negotiate and know your worth'
    }
  };
  
  const mochiTypes = {
    basic: { emoji: '🍡', name: 'Basic Mochi', value: 1 },
    strawberry: { emoji: '🍓', name: 'Strawberry Mochi', value: 2 },
    green_tea: { emoji: '🍵', name: 'Green Tea Mochi', value: 3 },
    sakura: { emoji: '🌸', name: 'Sakura Mochi', value: 5 },
    golden: { emoji: '🥠', name: 'Golden Mochi', value: 10 },
    rainbow: { emoji: '🌈', name: 'Rainbow Mochi', value: 20 }
  };
  
  const bozuTeachings = {
    patience: {
      title: "The Way of Patience",
      japanese: "Gaman no kokoro",
      wisdom: "Good opportunities come to those who wait mindfully. Rushing leads to poor choices.",
      unlock: 5 // wisdom points needed
    },
    mindfulness: {
      title: "Mindful Selection",
      japanese: "Nenrikina sentaku", 
      wisdom: "Each choice reflects your inner values. Choose with awareness, not desperation.",
      unlock: 10
    },
    detachment: {
      title: "Freedom from Attachment",
      japanese: "Mujaku no kokoro",
      wisdom: "Do not cling to any single opportunity. Openness creates space for better possibilities.",
      unlock: 20
    },
    balance: {
      title: "The Middle Path",
      japanese: "Chūdō no michi",
      wisdom: "Neither too eager nor too picky. Find the balanced way in career choices.",
      unlock: 30
    },
    wisdom: {
      title: "True Wisdom",
      japanese: "Makoto no chie",
      wisdom: "You have learned to see beyond surface attractions to true value. Trust your intuition.",
      unlock: 50
    }
  };
  
  function detectToxicPatterns(jobData) {
    const description = `${jobData.company} ${jobData.roleTitle} ${jobData.tags.join(' ')}`.toLowerCase();
    const detectedPatterns = [];
    
    for (const [patternType, pattern] of Object.entries(toxicCompanyPatterns)) {
      const matches = pattern.indicators.filter(indicator => 
        description.includes(indicator.toLowerCase())
      );
      
      if (matches.length > 0) {
        detectedPatterns.push({ type: patternType, matches, ...pattern });
      }
    }
    
    return detectedPatterns;
  }
  
  function checkFoodPoisoning(jobData, wasAccepted) {
    if (!wasAccepted) return; // Only check accepted jobs
    
    const toxicPatterns = detectToxicPatterns(jobData);
    
    if (toxicPatterns.length > 0) {
      healthSystem.toxicPatterns.push({
        company: jobData.company,
        patterns: toxicPatterns,
        timestamp: Date.now()
      });
      
      // Increase sickness if repeatedly choosing toxic patterns
      const recentToxicChoices = healthSystem.toxicPatterns.filter(
        p => Date.now() - p.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      
      if (recentToxicChoices.length >= 3) {
        triggerFoodPoisoning(toxicPatterns);
      } else if (recentToxicChoices.length === 2) {
        showPoisoningWarning(toxicPatterns);
      }
    } else {
      // Good choice! Improve immunity
      healthSystem.immunityLevel = Math.min(100, healthSystem.immunityLevel + 5);
    }
  }
  
  function triggerFoodPoisoning(patterns) {
    healthSystem.sicknessSeverity = Math.min(100, healthSystem.sicknessSeverity + 30);
    healthSystem.lastPoisoning = Date.now();
    healthSystem.recoveryTime = 5 * 60 * 1000; // 5 minutes recovery
    
    showFoodPoisoningAlert(patterns);
    
    // Offer Bozu teaching to help recover
    setTimeout(() => {
      const teaching = getRelevantBozuTeaching();
      if (teaching) showBozuWisdom(teaching);
    }, 2000);
  }
  
  function showPoisoningWarning(patterns) {
    const warning = document.createElement('div');
    warning.className = 'food-poisoning-warning';
    warning.innerHTML = `
      <div class="warning-icon">🤢</div>
      <div class="warning-content">
        <div class="warning-title">Stomach Feeling Queasy...</div>
        <div class="warning-desc">You've been choosing some questionable sushi. Be careful!</div>
        <div class="pattern-warnings">
          ${patterns.map(p => `<div class="pattern-warning">⚠️ ${p.prevention}</div>`).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    gsap.fromTo(warning,
      { y: -100, opacity: 0 },
      { y: 20, opacity: 1, duration: 0.6 }
    );
    
    setTimeout(() => {
      gsap.to(warning, {
        y: -100, opacity: 0, duration: 0.4,
        onComplete: () => warning.remove()
      });
    }, 6000);
  }
  
  function showFoodPoisoningAlert(patterns) {
    const alert = document.createElement('div');
    alert.className = 'food-poisoning-alert';
    alert.innerHTML = `
      <div class="poisoning-icon">🤮</div>
      <div class="poisoning-content">
        <div class="poisoning-title">FOOD POISONING!</div>
        <div class="poisoning-desc">You've been choosing too many toxic companies!</div>
        <div class="symptoms">
          ${patterns.map(p => `<div class="symptom">${p.symptoms}</div>`).join('')}
        </div>
        <div class="recovery-advice">Take time to reflect on your pattern recognition...</div>
      </div>
    `;
    
    document.body.appendChild(alert);
    
    gsap.fromTo(alert,
      { scale: 0, rotation: -10 },
      { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }
    );
    
    setTimeout(() => {
      gsap.to(alert, {
        scale: 0, rotation: 10, duration: 0.5,
        onComplete: () => alert.remove()
      });
    }, 8000);
  }
  
  function earnMochi(fitScore, isStreak = false) {
    let mochiType = 'basic';
    let amount = 1;
    
    // Determine mochi type based on quality
    if (fitScore >= 9.5) {
      mochiType = 'rainbow';
      amount = 2;
    } else if (fitScore >= 9.0) {
      mochiType = 'golden';
    } else if (fitScore >= 8.5) {
      mochiType = 'sakura';
    } else if (fitScore >= 8.0) {
      mochiType = 'green_tea';
    } else if (fitScore >= 7.5) {
      mochiType = 'strawberry';
    }
    
    // Bonus for streaks
    if (isStreak && gameStats.acceptedStreak >= 5) {
      amount += Math.floor(gameStats.acceptedStreak / 5);
    }
    
    const mochi = mochiTypes[mochiType];
    pandaBank.mochiCount += amount * mochi.value;
    pandaBank.totalEarned += amount * mochi.value;
    pandaBank.lastReward = { type: mochiType, amount, timestamp: Date.now() };
    
    // Update panda mood
    if (pandaBank.mochiCount > 100) pandaBank.pandaMood = 'ecstatic';
    else if (pandaBank.mochiCount > 50) pandaBank.pandaMood = 'excited';
    else if (pandaBank.mochiCount > 20) pandaBank.pandaMood = 'happy';
    
    showMochiReward(mochi, amount);
    updatePandaBank();
  }
  
  function showMochiReward(mochi, amount) {
    const reward = document.createElement('div');
    reward.className = 'mochi-reward';
    reward.innerHTML = `
      <div class="panda-celebration">🐼</div>
      <div class="mochi-content">
        <div class="mochi-emoji">${mochi.emoji.repeat(amount)}</div>
        <div class="mochi-name">+${amount} ${mochi.name}!</div>
        <div class="mochi-value">Worth ${amount * mochi.value} Mochi Points</div>
      </div>
    `;
    
    document.body.appendChild(reward);
    
    gsap.fromTo(reward,
      { y: 100, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "bounce.out" }
    );
    
    setTimeout(() => {
      gsap.to(reward, {
        y: -50, opacity: 0, duration: 0.5,
        onComplete: () => reward.remove()
      });
    }, 3000);
  }
  
  function getRelevantBozuTeaching() {
    const availableTeachings = Object.entries(bozuTeachings)
      .filter(([key, teaching]) => 
        teaching.unlock <= bozuSystem.wisdomPoints && 
        !bozuSystem.teachingsUnlocked.includes(key)
      );
    
    if (availableTeachings.length > 0) {
      const [key, teaching] = availableTeachings[0];
      bozuSystem.teachingsUnlocked.push(key);
      return { key, ...teaching };
    }
    
    return null;
  }
  
  function showBozuWisdom(teaching) {
    const wisdom = document.createElement('div');
    wisdom.className = 'bozu-wisdom';
    wisdom.innerHTML = `
      <div class="bozu-avatar">🧘‍♂️</div>
      <div class="wisdom-scroll">
        <div class="teaching-title">${teaching.title}</div>
        <div class="japanese-title">${teaching.japanese}</div>
        <div class="wisdom-text">${teaching.wisdom}</div>
        <div class="wisdom-points">+5 Wisdom Points</div>
      </div>
    `;
    
    document.body.appendChild(wisdom);
    
    gsap.fromTo(wisdom,
      { y: -200, opacity: 0, rotationX: -90 },
      { y: 0, opacity: 1, rotationX: 0, duration: 1, ease: "power2.out" }
    );
    
    bozuSystem.wisdomPoints += 5;
    
    setTimeout(() => {
      gsap.to(wisdom, {
        y: -200, opacity: 0, rotationX: -90, duration: 0.8,
        onComplete: () => wisdom.remove()
      });
    }, 8000);
  }
  
  function updatePandaBank() {
    const bankDisplay = document.getElementById('panda-bank') || createPandaBank();
    const pandaEmojis = {
      sleepy: '😴🐼',
      happy: '😊🐼', 
      excited: '🤩🐼',
      ecstatic: '🥳🐼'
    };
    
    bankDisplay.innerHTML = `
      <div class="panda-status">${pandaEmojis[pandaBank.pandaMood]} ${pandaBank.mochiCount} Mochi</div>
      <div class="bank-level">Bank Level ${pandaBank.bankLevel}</div>
    `;
  }
  
  function createPandaBank() {
    const bank = document.createElement('div');
    bank.id = 'panda-bank';
    bank.className = 'panda-bank';
    
    const streakDisplay = document.querySelector('.streak-display');
    if (streakDisplay) {
      streakDisplay.appendChild(bank);
    }
    
    return bank;
  }
  
  // Exotic Sushi Adventures - Career Exploration System
  let adventureSystem = {
    comfortZone: [], // Roles you keep choosing
    adventurousChoices: [], // Times you tried something new
    palateProfile: {}, // Hidden preferences detected by AI
    lastSuggestion: null,
    adventureLevel: 1, // 1-10, unlocks more exotic suggestions
    timidityScore: 0 // 0-100, higher = more stuck in comfort zone
  };
  
  const exoticSushiTypes = {
    // Safe comfort zone sushi
    california_roll: { adventure: 1, description: "Safe and familiar" },
    salmon_nigiri: { adventure: 2, description: "Classic choice" },
    
    // Mildly adventurous
    unagi_eel: { adventure: 4, description: "Sweet and savory surprise" },
    yellowtail: { adventure: 5, description: "Buttery and rich" },
    
    // Getting bold
    mackerel: { adventure: 6, description: "Strong fishy flavor" },
    sea_urchin: { adventure: 8, description: "Creamy ocean essence" },
    
    // Very exotic
    fermented_squid: { adventure: 9, description: "Intense umami experience" },
    fugu_blowfish: { adventure: 10, description: "Ultimate trust in the chef" }
  };
  
  const careerAdventureMapping = {
    // Comfort zone roles
    'Software Engineer': {
      adventureLevel: 2,
      sushiType: 'salmon_nigiri',
      exoticSuggestions: [
        {
          title: 'DevRel Engineer',
          sushiType: 'unagi_eel',
          reasoning: 'You love tech but show social patterns - try blending code with community',
          bridgeSkills: ['Technical writing', 'Public speaking', 'Community building'],
          adventureLevel: 5
        },
        {
          title: 'Game Engine Architect', 
          sushiType: 'sea_urchin',
          reasoning: 'Your optimization patterns suggest you\'d love performance-critical creative work',
          bridgeSkills: ['Graphics programming', 'Math/physics', 'Creative collaboration'],
          adventureLevel: 7
        },
        {
          title: 'Quantum Computing Researcher',
          sushiType: 'fugu_blowfish', 
          reasoning: 'Your abstract thinking + precision = perfect for cutting-edge computation',
          bridgeSkills: ['Linear algebra', 'Quantum mechanics', 'Research methodology'],
          adventureLevel: 10
        }
      ]
    },
    
    'Product Manager': {
      adventureLevel: 3,
      sushiType: 'california_roll',
      exoticSuggestions: [
        {
          title: 'Behavioral Economist',
          sushiType: 'yellowtail',
          reasoning: 'Your user psychology insights + data love = decision science mastery', 
          bridgeSkills: ['Statistics', 'Psychology research', 'Experimental design'],
          adventureLevel: 6
        },
        {
          title: 'AI Ethics Researcher',
          sushiType: 'mackerel',
          reasoning: 'Your product thinking + moral compass = shaping AI\'s future responsibly',
          bridgeSkills: ['Philosophy', 'AI/ML basics', 'Policy analysis'],
          adventureLevel: 8
        }
      ]
    },
    
    'Designer': {
      adventureLevel: 4,
      sushiType: 'unagi_eel',
      exoticSuggestions: [
        {
          title: 'Biomimicry Researcher',
          sushiType: 'sea_urchin',
          reasoning: 'Your aesthetic sense + nature patterns = revolutionary sustainable design',
          bridgeSkills: ['Biology', 'Materials science', 'Systems thinking'],
          adventureLevel: 8
        },
        {
          title: 'Sensory Experience Designer',
          sushiType: 'fermented_squid',
          reasoning: 'Your visual skills + empathy = designing for all human senses',
          bridgeSkills: ['Psychology', 'Neuroscience', 'Accessibility'],
          adventureLevel: 9
        }
      ]
    }
  };
  
  function detectComfortZonePatterns() {
    const recentChoices = swipeAnalytics.accepted.slice(-10);
    const roleTitles = recentChoices.map(choice => choice.roleTitle.toLowerCase());
    
    // Find repeated role types
    const roleTypes = {};
    roleTitles.forEach(title => {
      const type = extractRoleType(title);
      roleTypes[type] = (roleTypes[type] || 0) + 1;
    });
    
    // Update comfort zone
    adventureSystem.comfortZone = Object.entries(roleTypes)
      .filter(([type, count]) => count >= 3)
      .map(([type]) => type);
    
    // Calculate timidity score
    const diversity = Object.keys(roleTypes).length;
    const totalChoices = recentChoices.length;
    adventureSystem.timidityScore = Math.max(0, 100 - (diversity / totalChoices * 100));
    
    return adventureSystem.timidityScore > 60; // Stuck in comfort zone?
  }
  
  function extractRoleType(roleTitle) {
    const commonTypes = {
      'engineer': 'Software Engineer',
      'developer': 'Software Engineer', 
      'programmer': 'Software Engineer',
      'product': 'Product Manager',
      'manager': 'Product Manager',
      'designer': 'Designer',
      'ux': 'Designer',
      'ui': 'Designer',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'data': 'Data Scientist',
      'analyst': 'Data Scientist'
    };
    
    for (const [keyword, type] of Object.entries(commonTypes)) {
      if (roleTitle.includes(keyword)) {
        return type;
      }
    }
    
    return 'Other';
  }
  
  function suggestExoticAdventure() {
    if (!detectComfortZonePatterns()) return null;
    
    const primaryComfortZone = adventureSystem.comfortZone[0];
    const adventureMapping = careerAdventureMapping[primaryComfortZone];
    
    if (!adventureMapping) return null;
    
    // Find an appropriate adventure level based on user's current comfort
    const userAdventureLevel = Math.min(adventureSystem.adventureLevel + 2, 10);
    const suggestions = adventureMapping.exoticSuggestions
      .filter(suggestion => suggestion.adventureLevel <= userAdventureLevel)
      .sort((a, b) => Math.abs(a.adventureLevel - userAdventureLevel) - Math.abs(b.adventureLevel - userAdventureLevel));
    
    return suggestions[0] || null;
  }
  
  function showChefAdventureRecommendation(suggestion) {
    if (!suggestion) return;
    
    const recommendation = document.createElement('div');
    recommendation.className = 'chef-adventure-recommendation';
    recommendation.innerHTML = `
      <div class="chef-avatar-excited">👨‍🍳✨</div>
      <div class="adventure-bubble">
        <div class="adventure-header">
          <div class="japanese-phrase">Bouken wo shite mimasen ka?</div>
          <div class="english-phrase">"How about an adventure?"</div>
        </div>
        
        <div class="exotic-sushi-display">
          <div class="sushi-name">${getSushiEmoji(suggestion.sushiType)} ${suggestion.title}</div>
          <div class="sushi-description">"${exoticSushiTypes[suggestion.sushiType]?.description}"</div>
        </div>
        
        <div class="chef-reasoning">
          <strong>Chef's Insight:</strong> ${suggestion.reasoning}
        </div>
        
        <div class="bridge-skills">
          <strong>Skills to develop:</strong>
          <div class="skill-tags">
            ${suggestion.bridgeSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
        
        <div class="adventure-actions">
          <button class="adventure-btn try-it" onclick="tryExoticAdventure('${suggestion.title}')">🍣 I'll try it!</button>
          <button class="adventure-btn maybe-later" onclick="dismissAdventure()">🤔 Maybe later</button>
          <button class="adventure-btn too-exotic" onclick="tooExotic()">😰 Too exotic!</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(recommendation);
    
    gsap.fromTo(recommendation,
      { x: -400, opacity: 0, scale: 0.8 },
      { x: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" }
    );
    
    adventureSystem.lastSuggestion = suggestion;
  }
  
  function getSushiEmoji(sushiType) {
    const emojiMap = {
      'california_roll': '🍣',
      'salmon_nigiri': '🍣', 
      'unagi_eel': '🍣',
      'yellowtail': '🍟',
      'mackerel': '🐟',
      'sea_urchin': '🔮',
      'fermented_squid': '🦑',
      'fugu_blowfish': '🐡'
    };
    return emojiMap[sushiType] || '🍣';
  }
  
  window.tryExoticAdventure = function(adventureTitle) {
    adventureSystem.adventurousChoices.push({
      title: adventureTitle,
      timestamp: Date.now(),
      accepted: true
    });
    
    adventureSystem.adventureLevel = Math.min(10, adventureSystem.adventureLevel + 1);
    adventureSystem.timidityScore = Math.max(0, adventureSystem.timidityScore - 20);
    
    showChefMessage(japanesePhrases.impressed, true);
    
    // Remove the recommendation
    const recommendation = document.querySelector('.chef-adventure-recommendation');
    if (recommendation) {
      gsap.to(recommendation, {
        x: -400, opacity: 0, duration: 0.5,
        onComplete: () => recommendation.remove()
      });
    }
    
    // Show adventure achievement
    setTimeout(() => {
      showAdventureAchievement(adventureTitle);
    }, 1000);
  };
  
  window.dismissAdventure = function() {
    adventureSystem.timidityScore = Math.min(100, adventureSystem.timidityScore + 5);
    
    showChefMessage(japanesePhrases.understanding);
    
    const recommendation = document.querySelector('.chef-adventure-recommendation');
    if (recommendation) {
      gsap.to(recommendation, {
        x: -400, opacity: 0, duration: 0.4,
        onComplete: () => recommendation.remove()
      });
    }
  };
  
  window.tooExotic = function() {
    adventureSystem.timidityScore = Math.min(100, adventureSystem.timidityScore + 10);
    
    showChefMessage(japanesePhrases.take_time);
    
    const recommendation = document.querySelector('.chef-adventure-recommendation');
    if (recommendation) {
      gsap.to(recommendation, {
        x: -400, opacity: 0, scale: 0.8, duration: 0.4,
        onComplete: () => recommendation.remove()
      });
    }
  };
  
  function showAdventureAchievement(adventureTitle) {
    const achievement = document.createElement('div');
    achievement.className = 'adventure-achievement';
    achievement.innerHTML = `
      <div class="achievement-glow">
        <div class="achievement-icon">🌏</div>
        <div class="achievement-content">
          <div class="achievement-title">Adventurous Palate!</div>
          <div class="achievement-desc">You tried ${adventureTitle}!</div>
          <div class="achievement-reward">Adventure Level +1 | Timidity -20</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(achievement);
    
    gsap.fromTo(achievement,
      { y: -200, opacity: 0, rotationY: -90 },
      { y: 0, opacity: 1, rotationY: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" }
    );
    
    setTimeout(() => {
      gsap.to(achievement, {
        y: -200, opacity: 0, rotationY: 90, duration: 0.8,
        onComplete: () => achievement.remove()
      });
    }, 4000);
  }
  
  // Check for adventure opportunities every few swipes
  function checkForAdventureOpportunity() {
    if (gameStats.totalSwiped % 7 === 0 && gameStats.totalSwiped > 10) {
      const suggestion = suggestExoticAdventure();
      if (suggestion) {
        setTimeout(() => {
          showChefAdventureRecommendation(suggestion);
        }, 2000);
      }
    }
  }
  
  // PWA Service Worker Registration
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('🍣 Sushi Discovery PWA: Service Worker registered successfully:', registration.scope);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available, show update prompt
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('🍣 Sushi Discovery PWA: Service Worker registration failed:', error);
        });
    }
  }
  
  function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🍣</div>
        <div class="update-text">
          <div class="update-title">New Sushi Available!</div>
          <div class="update-desc">Update the app for the latest omakase experience</div>
        </div>
        <button class="update-btn" onclick="updateApp()">Update Now</button>
        <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
    
    gsap.fromTo(updateBanner,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 }
    );
  }
  
  window.updateApp = function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };
  
  // Mobile Touch Controls
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  
  function addMobileTouchControls() {
    // Prevent default touch behaviors
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    }, { passive: true });
  }
  
  function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;
    
    // Only register swipe if it's far enough
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return;
    }
    
    // Horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swipe right - accept job
        swipeRight();
        showMobileSwipeFeedback('right');
      } else {
        // Swipe left - reject job
        swipeLeft();
        showMobileSwipeFeedback('left');
      }
    }
    // Vertical swipes
    else {
      if (deltaY < 0) {
        // Swipe up - next sushi
        nextSushi();
        showMobileSwipeFeedback('up');
      } else {
        // Swipe down - previous sushi (if implemented)
        showMobileSwipeFeedback('down');
      }
    }
  }
  
  function showMobileSwipeFeedback(direction) {
    const feedback = document.createElement('div');
    feedback.className = 'mobile-swipe-feedback';
    
    const feedbackConfig = {
      right: { emoji: '✅', text: 'Added!', color: '#00ff00' },
      left: { emoji: '❌', text: 'Passed!', color: '#ff0000' },
      up: { emoji: '🔄', text: 'Next!', color: '#00ffff' },
      down: { emoji: '📋', text: 'Menu!', color: '#ffff00' }
    };
    
    const config = feedbackConfig[direction];
    feedback.innerHTML = `
      <div class="feedback-emoji">${config.emoji}</div>
      <div class="feedback-text">${config.text}</div>
    `;
    feedback.style.color = config.color;
    
    document.body.appendChild(feedback);
    
    gsap.fromTo(feedback,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3 }
    );
    
    setTimeout(() => {
      gsap.to(feedback, {
        scale: 0, opacity: 0, duration: 0.3,
        onComplete: () => feedback.remove()
      });
    }, 1500);
  }
  
  // Mobile Vibration Feedback
  function vibrateDevice(pattern = [100]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
  
  // Add vibration to key interactions
  const originalSwipeRight = swipeRight;
  const originalSwipeLeft = swipeLeft;
  
  swipeRight = function() {
    vibrateDevice([50, 50, 100]); // Success pattern
    originalSwipeRight();
  };
  
  swipeLeft = function() {
    vibrateDevice([200]); // Single rejection buzz
    originalSwipeLeft();
  };
  
  // Install Prompt for PWA
  let deferredInstallPrompt = null;
  
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      showInstallButton();
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('🍣 Sushi Discovery PWA: App installed successfully!');
      hideInstallButton();
      showToast('🍣 Sushi Discovery installed! Welcome to the omakase experience!', 'success');
    });
  }
  
  function showInstallButton() {
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.className = 'install-pwa-btn';
    installButton.innerHTML = `
      <i class="fas fa-download"></i>
      <span>Install Sushi App</span>
    `;
    
    installButton.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('🍣 Sushi Discovery PWA: User accepted install prompt');
        }
        
        deferredInstallPrompt = null;
        hideInstallButton();
      }
    });
    
    document.body.appendChild(installButton);
    
    setTimeout(() => {
      gsap.fromTo(installButton,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 }
      );
    }, 3000); // Show after 3 seconds
  }
  
  function hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      gsap.to(installButton, {
        y: 100, opacity: 0, duration: 0.3,
        onComplete: () => installButton.remove()
      });
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="toast-icon ${type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'}"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  const DISCO_KEY = 'disco:jobSearchData';

  function getJobs() {
    try {
      let raw = localStorage.getItem(DISCO_KEY);
      if (!raw) {
        // Offer import from main app on first load
        const mainRaw = localStorage.getItem('jobSearchData');
        if (mainRaw) {
          const doImport = window.confirm('Import existing data from main app into Discovery?');
          if (doImport) {
            localStorage.setItem(DISCO_KEY, mainRaw);
            raw = mainRaw;
          }
        }
      }
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function saveJobs(jobs) {
    try { localStorage.setItem(DISCO_KEY, JSON.stringify(jobs)); } catch (e) {}
  }

  function fitClass(score) {
    if (score >= 9.0) return 'excellent';
    if (score >= 8.0) return 'good';
    if (score >= 7.0) return 'fair';
    return 'poor';
  }

  // Sushi Discovery State
  let currentRecos = [];
  let currentIndex = 0;
  let swipeAnalytics = { accepted: [], rejected: [] };
  
  // Role-to-Sushi Mapping
  const roleToSushi = {
    // Tech & Engineering
    'Engineer': '🍣', 'Developer': '🍣', 'Software': '🍣', 'Frontend': '🍣', 'Backend': '🍣',
    'Full Stack': '🍣', 'DevOps': '🍣', 'Data': '🍱', 'Scientist': '🍱', 'Analyst': '🍱',
    'Machine Learning': '🍱', 'AI': '🍱', 'Cloud': '🍣', 'Security': '🦪', 'Cyber': '🦪',
    
    // Management & Leadership  
    'Manager': '🍤', 'Director': '🍤', 'VP': '🍤', 'Head': '🍤', 'Lead': '🍤',
    'Principal': '🍤', 'Senior': '🍤', 'Chief': '🦞', 'CTO': '🦞', 'CEO': '🦞',
    
    // Product & Design
    'Product': '🍙', 'Designer': '🍘', 'UX': '🍘', 'UI': '🍘', 'Creative': '🍘',
    'Brand': '🍘', 'Marketing': '🍜', 'Growth': '🍜', 'Content': '🍜',
    
    // Business & Operations
    'Sales': '🥟', 'Account': '🥟', 'Business': '🥟', 'Operations': '🍲',
    'Finance': '🥠', 'Accounting': '🥠', 'Legal': '🥠', 'HR': '🍡', 'People': '🍡',
    
    // Consulting & Strategy
    'Consultant': '🍢', 'Strategy': '🍢', 'Advisory': '🍢', 'Research': '🧆',
    
    // Default
    'default': '🍣'
  };
  
  function getSushiForRole(roleTitle) {
    const role = roleTitle.toLowerCase();
    for (const [key, emoji] of Object.entries(roleToSushi)) {
      if (key !== 'default' && role.includes(key.toLowerCase())) {
        return emoji;
      }
    }
    return roleToSushi.default;
  }

  function generateWhyInsights(reco, isAccepted) {
    const jobs = getJobs();
    const insights = window.DiscoveryCore.analyzeLearningSignals(jobs);
    
    if (isAccepted) {
      // Why YES - positive patterns
      const patterns = [];
      if (reco.expectedFit >= 8.5) patterns.push(`🎯 Excellent fit score (${reco.expectedFit.toFixed(1)}/10)`);
      if (reco.salary && reco.salary.includes('$')) patterns.push(`💰 Salary range matches your targets`);
      if (reco.tags.some(tag => ['Remote', 'Hybrid', 'Flexible'].includes(tag))) patterns.push(`🏠 Work style aligns with preferences`);
      if (insights.topSegments.some(s => s.name.toLowerCase().includes(reco.sector.toLowerCase()))) patterns.push(`📊 Strong sector match based on history`);
      patterns.push(`✨ ${reco.company} shows growth potential in ${reco.sector}`);
      return patterns.slice(0, 3);
    } else {
      // Why NO - anti-patterns and concerns
      const concerns = [];
      if (reco.expectedFit < 7.0) concerns.push(`⚠️ Lower fit score (${reco.expectedFit.toFixed(1)}/10) - may not align`);
      if (!reco.tags.some(tag => ['Remote', 'Hybrid'].includes(tag))) concerns.push(`🏢 On-site requirement doesn't match preferences`);
      if (reco.sector === 'Finance' && insights.rejectionReasons.some(r => r.reason.includes('culture'))) concerns.push(`🏛️ Sector historically shows culture misalignment`);
      concerns.push(`🤔 Role requirements may not match your core strengths`);
      concerns.push(`📍 Location or company stage might not be ideal`);
      return concerns.slice(0, 3);
    }
  }
  
  // Mise en Place System - Daily Preparation Rituals
  let miseEnPlace = {
    dailyPrep: {
      profileUpdated: false,    // LinkedIn/resume current
      researchCompleted: 0,    // Companies researched today
      networkingTouches: 0,    // People contacted today
      skillsPracticed: false,  // Coding/portfolio work
      marketIntel: false,      // Industry trends checked
      toolsSharpened: false    // Applications/templates updated
    },
    preparationScore: 0,       // 0-100, daily prep completion
    consistencyStreak: 0,      // Days of good preparation
    luckSurfaceArea: 1.0,     // Multiplier for opportunities (0.5-2.0)
    ritualReminders: [],
    lastPrepDate: null
  };
  
  // Knife Skills System - Application Precision & Efficiency
  let knifeSkills = {
    precision: {
      targetingAccuracy: 0.5,    // How well jobs match criteria
      customizationLevel: 0.3,   // Cover letter personalization
      timingMastery: 0.4,        // Applying at optimal times
      followUpSharpness: 0.2     // Post-application engagement
    },
    speed: {
      applicationVelocity: 1.0,  // Apps per hour when focused
      researchEfficiency: 1.0,   // Minutes per company research
      decisionSpeed: 1.0,        // Seconds to evaluate opportunity
      batchProcessing: 1.0       // Multiple apps efficiency
    },
    technique: {
      cutClean: 0,              // No wasted motions
      consistency: 0,           // Same quality every time
      adaptability: 0,          // Adjust to different situations
      presentation: 0           // Professional polish
    },
    overallSkillLevel: 'NOVICE', // NOVICE -> APPRENTICE -> CHEF -> MASTER
    experiencePoints: 0,
    masteryUnlocked: []
  };
  
  // Sushi Chef Strategy System
  let chefStrategy = {
    offerTarget: 2, // Target number of offers needed
    deadline: 30, // Days until deadline
    callbackRatio: 0.15, // Expected callback rate (15%)
    offerRatio: 0.3, // Offer rate from callbacks (30%)
    currentOffers: 0,
    applicationsNeeded: 0,
    weeklyTarget: 0,
    dailyTarget: 0,
    todaysApplications: 0,
    competitionThreshold: 0.7, // Above this = too competitive
    fitThreshold: 7.5, // Below this = not worth applying
    timeToValueThreshold: 14 // Days for first interview
  };
  
  // Conveyor Belt System with Chef Pacing
  let conveyorBelt = {
    activeJob: null,
    queue: [],
    missedCount: 0,
    wastedTime: 0, // Track shiny objects rejected
    isProcessing: false,
    currentPlate: null,
    decisionTimer: null,
    beltSpeed: 8000, // Base speed, will be dynamic
    decisionWindow: 2000 // Decision time in ms
  };
  
  // Initialize strategy calculations
  function calculateChefStrategy() {
    const offersStillNeeded = Math.max(0, chefStrategy.offerTarget - chefStrategy.currentOffers);
    const callbacksNeeded = Math.ceil(offersStillNeeded / chefStrategy.offerRatio);
    chefStrategy.applicationsNeeded = Math.ceil(callbacksNeeded / chefStrategy.callbackRatio);
    
    const daysLeft = chefStrategy.deadline;
    chefStrategy.weeklyTarget = Math.ceil(chefStrategy.applicationsNeeded / (daysLeft / 7));
    chefStrategy.dailyTarget = Math.ceil(chefStrategy.applicationsNeeded / daysLeft);
    
    // Adjust belt speed based on urgency
    const urgencyFactor = Math.max(0.3, Math.min(2.0, chefStrategy.dailyTarget / 3));
    conveyorBelt.beltSpeed = Math.max(4000, Math.floor(8000 / urgencyFactor));
    conveyorBelt.decisionWindow = Math.max(1000, Math.floor(2000 / urgencyFactor));
    
    console.log(`🍣 Chef Strategy: Need ${chefStrategy.applicationsNeeded} applications for ${chefStrategy.offerTarget} offers`);
    console.log(`⚡ Belt speed: ${conveyorBelt.beltSpeed}ms, Decision window: ${conveyorBelt.decisionWindow}ms`);
  }
  
  // Job Analysis Functions
  function analyzeJobStrategically(reco) {
    const analysis = {
      fitScore: reco.expectedFit,
      competitionLevel: calculateCompetitionLevel(reco),
      timeToValue: calculateTimeToValue(reco),
      strategicValue: 0,
      category: '',
      chefRecommendation: '',
      wasteRisk: 0
    };
    
    // Calculate strategic value
    const fitWeight = 0.4;
    const competitionWeight = 0.3;
    const timeWeight = 0.3;
    
    const competitionScore = 1 - analysis.competitionLevel; // Lower competition = higher score
    const timeScore = Math.max(0, 1 - (analysis.timeToValue / 30)); // Faster = higher score
    
    analysis.strategicValue = (
      (analysis.fitScore / 10) * fitWeight +
      competitionScore * competitionWeight +
      timeScore * timeWeight
    );
    
    // Categorize the job
    if (analysis.fitScore >= 9 && analysis.competitionLevel <= 0.5) {
      analysis.category = 'golden_sushi';
      analysis.chefRecommendation = 'Grab immediately! Perfect fit, low competition.';
    } else if (analysis.fitScore >= 8.5 && analysis.competitionLevel <= 0.7) {
      analysis.category = 'quality_choice';
      analysis.chefRecommendation = 'Excellent choice - apply today!';
    } else if (analysis.fitScore >= 8 && analysis.competitionLevel > 0.8) {
      analysis.category = 'competitive_stretch';
      analysis.chefRecommendation = 'High competition - consider if you have unique edge.';
      analysis.wasteRisk = 0.6;
    } else if (analysis.fitScore >= 8.5 && analysis.timeToValue > 21) {
      analysis.category = 'slow_cooker';
      analysis.chefRecommendation = 'Good fit but slow process - apply if timeline allows.';
      analysis.wasteRisk = 0.4;
    } else if (analysis.fitScore < chefStrategy.fitThreshold) {
      analysis.category = 'poor_fit';
      analysis.chefRecommendation = 'Below fit threshold - likely waste of time.';
      analysis.wasteRisk = 0.8;
    } else if (analysis.competitionLevel > chefStrategy.competitionThreshold) {
      analysis.category = 'overcrowded';
      analysis.chefRecommendation = 'Too competitive - focus on better opportunities.';
      analysis.wasteRisk = 0.7;
    } else {
      analysis.category = 'mediocre';
      analysis.chefRecommendation = 'Mediocre choice - consider only if behind on targets.';
      analysis.wasteRisk = 0.5;
    }
    
    return analysis;
  }
  
  function calculateCompetitionLevel(reco) {
    let competition = 0.5; // Base competition level
    
    // Company factors
    if (['Google', 'Apple', 'Microsoft', 'Meta', 'Amazon'].includes(reco.company)) {
      competition += 0.3; // Big tech = high competition
    }
    
    if (['Netflix', 'Uber', 'Airbnb', 'Stripe'].includes(reco.company)) {
      competition += 0.2; // Popular companies
    }
    
    // Role factors
    if (reco.roleTitle.toLowerCase().includes('senior')) {
      competition += 0.1;
    }
    
    if (reco.roleTitle.toLowerCase().includes('principal') || reco.roleTitle.toLowerCase().includes('staff')) {
      competition += 0.2;
    }
    
    if (reco.roleTitle.toLowerCase().includes('lead') || reco.roleTitle.toLowerCase().includes('manager')) {
      competition += 0.15;
    }
    
    // Location factors
    if (reco.location === 'San Francisco' || reco.location === 'New York' || reco.location === 'Seattle') {
      competition += 0.1;
    }
    
    // Salary factors (higher salary = more competition)
    if (reco.salary && reco.salary.includes('$')) {
      const salaryMatch = reco.salary.match(/\$(\d+)k/);
      if (salaryMatch) {
        const salary = parseInt(salaryMatch[1]);
        if (salary > 200) competition += 0.2;
        else if (salary > 150) competition += 0.1;
      }
    }
    
    return Math.min(1.0, Math.max(0.1, competition));
  }
  
  function calculateTimeToValue(reco) {
    let timeToValue = 14; // Base 2 weeks
    
    // Company size factors
    if (['Google', 'Apple', 'Microsoft', 'Meta', 'Amazon'].includes(reco.company)) {
      timeToValue += 14; // Big tech = slower process
    }
    
    if (reco.company.includes('Bank') || reco.sector === 'Finance') {
      timeToValue += 10; // Financial = compliance delays
    }
    
    if (reco.sector === 'Government' || reco.sector === 'Defense') {
      timeToValue += 21; // Government = very slow
    }
    
    // Role level factors
    if (reco.roleTitle.toLowerCase().includes('principal') || reco.roleTitle.toLowerCase().includes('staff')) {
      timeToValue += 7; // Senior roles = more interviews
    }
    
    if (reco.roleTitle.toLowerCase().includes('director') || reco.roleTitle.toLowerCase().includes('vp')) {
      timeToValue += 14; // Executive = very long process
    }
    
    // Startup factor (faster)
    if (reco.tags.includes('Startup') || reco.tags.includes('Series A') || reco.tags.includes('Series B')) {
      timeToValue = Math.max(7, timeToValue - 7);
    }
    
    return Math.max(3, timeToValue); // Minimum 3 days
  }
  
  // Chef Advice System
  function showChefAdvice(analysis, reco) {
    const chefMessage = document.createElement('div');
    chefMessage.className = 'chef-strategic-advice';
    
    let urgencyClass = '';
    let adviceIcon = '🍣';
    
    if (analysis.category === 'golden_sushi') {
      urgencyClass = 'urgent-recommend';
      adviceIcon = '🌟';
    } else if (analysis.wasteRisk > 0.6) {
      urgencyClass = 'warning';
      adviceIcon = '⚠️';
    } else if (analysis.category === 'quality_choice') {
      urgencyClass = 'recommend';
      adviceIcon = '✅';
    }
    
    chefMessage.innerHTML = `
      <div class="chef-advice-content ${urgencyClass}">
        <div class="chef-icon">👨‍🍳</div>
        <div class="advice-bubble">
          <div class="advice-header">
            <span class="advice-icon">${adviceIcon}</span>
            <span class="advice-category">${analysis.category.toUpperCase()}</span>
          </div>
          <div class="chef-recommendation">${analysis.chefRecommendation}</div>
          <div class="strategic-breakdown">
            <div class="metric">Fit: ${analysis.fitScore.toFixed(1)}/10</div>
            <div class="metric">Competition: ${(analysis.competitionLevel * 100).toFixed(0)}%</div>
            <div class="metric">Time to Interview: ${analysis.timeToValue}d</div>
          </div>
          <div class="strategy-context">
            Target: ${chefStrategy.dailyTarget - chefStrategy.todaysApplications} more today
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(chefMessage);
    
    // Animate in
    gsap.fromTo(chefMessage,
      { x: -400, opacity: 0, scale: 0.8 },
      { x: 20, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
    );
    
    // Auto-remove
    setTimeout(() => {
      gsap.to(chefMessage, {
        x: -400,
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        onComplete: () => chefMessage.remove()
      });
    }, conveyorBelt.decisionWindow - 200); // Remove just before decision window closes
  }
  
  // Mise en Place Functions - Daily Preparation Management
  function checkDailyPreparation() {
    const today = new Date().toDateString();
    
    if (miseEnPlace.lastPrepDate !== today) {
      // Reset daily prep for new day
      miseEnPlace.dailyPrep = {
        profileUpdated: false,
        researchCompleted: 0,
        networkingTouches: 0,
        skillsPracticed: false,
        marketIntel: false,
        toolsSharpened: false
      };
      miseEnPlace.lastPrepDate = today;
    }
    
    calculatePreparationScore();
    updateLuckSurfaceArea();
  }
  
  function calculatePreparationScore() {
    const prep = miseEnPlace.dailyPrep;
    let score = 0;
    
    // Core preparation items (80% of score)
    if (prep.profileUpdated) score += 20;
    if (prep.researchCompleted >= 3) score += 20;
    else score += (prep.researchCompleted / 3) * 20;
    if (prep.networkingTouches >= 2) score += 15;
    else score += (prep.networkingTouches / 2) * 15;
    if (prep.skillsPracticed) score += 15;
    if (prep.marketIntel) score += 10;
    
    // Bonus for completeness (20% of score)
    const completedItems = [
      prep.profileUpdated,
      prep.researchCompleted >= 3,
      prep.networkingTouches >= 2,
      prep.skillsPracticed,
      prep.marketIntel,
      prep.toolsSharpened
    ].filter(Boolean).length;
    
    if (completedItems === 6) score += 20; // Perfect preparation bonus
    
    miseEnPlace.preparationScore = Math.min(100, Math.round(score));
    
    // Update consistency streak
    if (score >= 70) {
      miseEnPlace.consistencyStreak++;
    } else if (score < 50) {
      miseEnPlace.consistencyStreak = Math.max(0, miseEnPlace.consistencyStreak - 1);
    }
  }
  
  function updateLuckSurfaceArea() {
    // Preparation score influences opportunity multiplier
    const baseMultiplier = 0.5; // Unprepared minimum
    const prepMultiplier = (miseEnPlace.preparationScore / 100) * 1.0;
    const streakBonus = Math.min(0.5, miseEnPlace.consistencyStreak * 0.02);
    
    miseEnPlace.luckSurfaceArea = Math.min(2.0, baseMultiplier + prepMultiplier + streakBonus);
    
    // Adjust chef strategy based on preparation
    chefStrategy.dailyTarget = Math.round(
      chefStrategy.dailyTarget * miseEnPlace.luckSurfaceArea
    );
  }
  
  function completePreparationItem(item) {
    switch(item) {
      case 'profile':
        miseEnPlace.dailyPrep.profileUpdated = true;
        showChefAdviceMessage(`📋 Profile updated! Your presentation is sharp today.`);
        break;
      case 'research':
        miseEnPlace.dailyPrep.researchCompleted++;
        showChefAdviceMessage(`🔍 Company research +1. Knowledge is your secret ingredient.`);
        break;
      case 'network':
        miseEnPlace.dailyPrep.networkingTouches++;
        showChefAdviceMessage(`🤝 Network touch +1. Relationships unlock hidden opportunities.`);
        break;
      case 'skills':
        miseEnPlace.dailyPrep.skillsPracticed = true;
        showChefAdviceMessage(`⚡ Skills practiced! Your craft improves daily.`);
        break;
      case 'intel':
        miseEnPlace.dailyPrep.marketIntel = true;
        showChefAdviceMessage(`📊 Market intel gathered. Stay ahead of trends.`);
        break;
      case 'tools':
        miseEnPlace.dailyPrep.toolsSharpened = true;
        showChefAdviceMessage(`🔧 Tools sharpened! Efficiency unlocked.`);
        break;
    }
    
    calculatePreparationScore();
    updateLuckSurfaceArea();
    updatePreparationDisplay();
  }
  
  function showChefAdviceMessage(message) {
    const adviceElement = document.createElement('div');
    adviceElement.className = 'chef-quick-advice';
    adviceElement.innerHTML = `
      <div class="chef-bubble">
        <span class="chef-emoji">👨‍🍳</span>
        <span class="advice-text">${message}</span>
      </div>
    `;
    
    document.body.appendChild(adviceElement);
    
    // Animate in
    gsap.fromTo(adviceElement,
      { y: -50, opacity: 0 },
      { y: 10, opacity: 1, duration: 0.3 }
    );
    
    // Auto-remove
    setTimeout(() => {
      gsap.to(adviceElement, {
        y: -50,
        opacity: 0,
        duration: 0.3,
        onComplete: () => adviceElement.remove()
      });
    }, 2500);
  }
  
  function updatePreparationDisplay() {
    const prepDisplay = document.getElementById('preparation-status');
    if (!prepDisplay) return;
    
    const prep = miseEnPlace.dailyPrep;
    const score = miseEnPlace.preparationScore;
    const streak = miseEnPlace.consistencyStreak;
    
    prepDisplay.innerHTML = `
      <div class="prep-header">
        <span class="prep-title">📋 Mise en Place</span>
        <span class="prep-score ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs-work'}">${score}/100</span>
      </div>
      <div class="prep-items">
        <div class="prep-item ${prep.profileUpdated ? 'completed' : ''}">
          <span class="prep-icon">📝</span> Profile Updated
        </div>
        <div class="prep-item ${prep.researchCompleted >= 3 ? 'completed' : ''}">
          <span class="prep-icon">🔍</span> Research (${prep.researchCompleted}/3)
        </div>
        <div class="prep-item ${prep.networkingTouches >= 2 ? 'completed' : ''}">
          <span class="prep-icon">🤝</span> Network (${prep.networkingTouches}/2)
        </div>
        <div class="prep-item ${prep.skillsPracticed ? 'completed' : ''}">
          <span class="prep-icon">⚡</span> Skills Practice
        </div>
        <div class="prep-item ${prep.marketIntel ? 'completed' : ''}">
          <span class="prep-icon">📊</span> Market Intel
        </div>
        <div class="prep-item ${prep.toolsSharpened ? 'completed' : ''}">
          <span class="prep-icon">🔧</span> Tools Sharpened
        </div>
      </div>
      <div class="prep-stats">
        <div class="luck-surface">🍀 Luck Surface: ${miseEnPlace.luckSurfaceArea.toFixed(1)}x</div>
        <div class="streak">🔥 Streak: ${streak} days</div>
      </div>
    `;
  }
  
  // Knife Skills Functions - Application Precision & Efficiency
  function recordApplicationTechnique(reco, action, timeSpent, wasCustomized) {
    const startTime = Date.now();
    
    // Record precision metrics
    knifeSkills.precision.targetingAccuracy = updateMetric(
      knifeSkills.precision.targetingAccuracy,
      reco.expectedFit >= 8.0 ? 1.0 : (reco.expectedFit / 10),
      0.1
    );
    
    if (action === 'accept' && wasCustomized) {
      knifeSkills.precision.customizationLevel = updateMetric(
        knifeSkills.precision.customizationLevel,
        1.0,
        0.05
      );
    }
    
    // Record speed metrics  
    const decisionSpeed = (conveyorBelt.decisionWindow - timeSpent) / conveyorBelt.decisionWindow;
    knifeSkills.speed.decisionSpeed = updateMetric(
      knifeSkills.speed.decisionSpeed,
      Math.max(0.1, decisionSpeed),
      0.05
    );
    
    // Update experience points
    knifeSkills.experiencePoints += action === 'accept' ? 10 : 2;
    
    evaluateSkillLevel();
    updateKnifeSkillsDisplay();
  }
  
  function updateMetric(currentValue, newValue, learningRate) {
    // Exponential moving average for smooth skill progression
    return currentValue * (1 - learningRate) + newValue * learningRate;
  }
  
  function evaluateSkillLevel() {
    const skills = knifeSkills;
    
    // Calculate overall technique score
    const precisionAvg = Object.values(skills.precision).reduce((a, b) => a + b, 0) / Object.keys(skills.precision).length;
    const speedAvg = Object.values(skills.speed).reduce((a, b) => a + b, 0) / Object.keys(skills.speed).length;
    const techniqueAvg = Object.values(skills.technique).reduce((a, b) => a + b, 0) / Object.keys(skills.technique).length;
    
    const overallScore = (precisionAvg + speedAvg + techniqueAvg) / 3;
    const xpFactor = Math.min(1.0, skills.experiencePoints / 1000); // XP caps at 1000
    const finalScore = (overallScore * 0.7) + (xpFactor * 0.3);
    
    // Determine skill level
    let newLevel = 'NOVICE';
    if (finalScore >= 0.8 && skills.experiencePoints >= 800) {
      newLevel = 'MASTER';
    } else if (finalScore >= 0.65 && skills.experiencePoints >= 400) {
      newLevel = 'CHEF';
    } else if (finalScore >= 0.45 && skills.experiencePoints >= 150) {
      newLevel = 'APPRENTICE';
    }
    
    // Check for level up
    if (newLevel !== skills.overallSkillLevel) {
      const oldLevel = skills.overallSkillLevel;
      skills.overallSkillLevel = newLevel;
      celebrateSkillLevelUp(oldLevel, newLevel);
    }
    
    // Unlock mastery achievements
    unlockMasteryAchievements(skills);
  }
  
  function unlockMasteryAchievements(skills) {
    const achievements = [];
    
    if (skills.precision.targetingAccuracy >= 0.8 && !skills.masteryUnlocked.includes('sniper')) {
      achievements.push('sniper');
      skills.masteryUnlocked.push('sniper');
    }
    
    if (skills.speed.decisionSpeed >= 0.85 && !skills.masteryUnlocked.includes('lightning')) {
      achievements.push('lightning');
      skills.masteryUnlocked.push('lightning');
    }
    
    if (skills.precision.customizationLevel >= 0.7 && !skills.masteryUnlocked.includes('artisan')) {
      achievements.push('artisan');
      skills.masteryUnlocked.push('artisan');
    }
    
    achievements.forEach(achievement => {
      showMasteryUnlock(achievement);
    });
  }
  
  function celebrateSkillLevelUp(oldLevel, newLevel) {
    const celebration = document.createElement('div');
    celebration.className = 'skill-level-up';
    celebration.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-header">🔪 SKILL LEVEL UP! 🔪</div>
        <div class="level-progression">
          <span class="old-level">${oldLevel}</span>
          <span class="arrow">→</span>
          <span class="new-level">${newLevel}</span>
        </div>
        <div class="level-description">${getLevelDescription(newLevel)}</div>
      </div>
    `;
    
    document.body.appendChild(celebration);
    
    // Animate celebration
    gsap.fromTo(celebration,
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    );
    
    // Auto-remove after celebration
    setTimeout(() => {
      gsap.to(celebration, {
        scale: 0.5,
        opacity: 0,
        y: -100,
        duration: 0.5,
        onComplete: () => celebration.remove()
      });
    }, 3500);
  }
  
  function getLevelDescription(level) {
    const descriptions = {
      'NOVICE': 'Learning the basics of strategic job hunting',
      'APPRENTICE': 'Building precision and speed in applications',
      'CHEF': 'Master of strategic timing and targeting',
      'MASTER': 'Elite job hunter with maximum efficiency'
    };
    return descriptions[level] || '';
  }
  
  function showMasteryUnlock(achievement) {
    const achievements = {
      'sniper': { icon: '🎯', title: 'Sniper', desc: 'Deadly accurate targeting' },
      'lightning': { icon: '⚡', title: 'Lightning', desc: 'Incredibly fast decisions' },
      'artisan': { icon: '🎨', title: 'Artisan', desc: 'Master of customization' }
    };
    
    const unlock = achievements[achievement];
    if (!unlock) return;
    
    const masteryElement = document.createElement('div');
    masteryElement.className = 'mastery-unlock';
    masteryElement.innerHTML = `
      <div class="mastery-content">
        <div class="mastery-icon">${unlock.icon}</div>
        <div class="mastery-title">${unlock.title} MASTERY UNLOCKED!</div>
        <div class="mastery-desc">${unlock.desc}</div>
      </div>
    `;
    
    document.body.appendChild(masteryElement);
    
    // Animate unlock
    gsap.fromTo(masteryElement,
      { x: 300, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
    
    setTimeout(() => {
      gsap.to(masteryElement, {
        x: 300,
        opacity: 0,
        duration: 0.4,
        onComplete: () => masteryElement.remove()
      });
    }, 3000);
  }
  
  function updateKnifeSkillsDisplay() {
    const skillsDisplay = document.getElementById('knife-skills-status');
    if (!skillsDisplay) return;
    
    const skills = knifeSkills;
    const precisionAvg = Object.values(skills.precision).reduce((a, b) => a + b, 0) / Object.keys(skills.precision).length;
    const speedAvg = Object.values(skills.speed).reduce((a, b) => a + b, 0) / Object.keys(skills.speed).length;
    
    skillsDisplay.innerHTML = `
      <div class="skills-header">
        <span class="skills-title">🔪 Knife Skills</span>
        <span class="skill-level ${skills.overallSkillLevel.toLowerCase()}">${skills.overallSkillLevel}</span>
      </div>
      <div class="skills-metrics">
        <div class="skill-metric">
          <span class="metric-name">Precision</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${precisionAvg * 100}%"></div>
          </div>
          <span class="metric-value">${(precisionAvg * 100).toFixed(0)}%</span>
        </div>
        <div class="skill-metric">
          <span class="metric-name">Speed</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${speedAvg * 100}%"></div>
          </div>
          <span class="metric-value">${(speedAvg * 100).toFixed(0)}%</span>
        </div>
        <div class="skill-metric">
          <span class="metric-name">Experience</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${Math.min(100, (skills.experiencePoints / 1000) * 100)}%"></div>
          </div>
          <span class="metric-value">${skills.experiencePoints} XP</span>
        </div>
      </div>
      <div class="mastery-badges">
        ${skills.masteryUnlocked.map(mastery => `<span class="mastery-badge ${mastery}">${getMasteryIcon(mastery)}</span>`).join('')}
      </div>
    `;
  }
  
  function getMasteryIcon(mastery) {
    const icons = {
      'sniper': '🎯',
      'lightning': '⚡',
      'artisan': '🎨'
    };
    return icons[mastery] || '🏅';
  }
  
  function createSushiPlate(reco, index) {
    const sushiEmoji = getSushiForRole(reco.roleTitle);
    const analysis = analyzeJobStrategically(reco);
    
    const plate = document.createElement('div');
    plate.className = `sushi-plate entering ${analysis.category}`;
    plate.dataset.jobId = reco.id;
    plate.dataset.index = index;
    plate.dataset.strategicValue = analysis.strategicValue;
    plate.dataset.wasteRisk = analysis.wasteRisk;
    
    // Visual indicators based on strategic analysis
    let plateStyle = '';
    let glowEffect = '';
    
    if (analysis.category === 'golden_sushi') {
      plateStyle = 'border: 3px solid #ffd700; box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);';
      glowEffect = 'golden-glow';
    } else if (analysis.category === 'quality_choice') {
      plateStyle = 'border: 2px solid #00ff41; box-shadow: 0 0 15px rgba(0, 255, 65, 0.4);';
      glowEffect = 'green-glow';
    } else if (analysis.wasteRisk > 0.6) {
      plateStyle = 'border: 2px solid #ff4141; box-shadow: 0 0 15px rgba(255, 65, 65, 0.4);';
      glowEffect = 'warning-glow';
    }
    
    plate.innerHTML = `
      <div class="sushi-piece" style="${plateStyle}">
        <div class="sushi-emoji">${sushiEmoji}</div>
        <div class="sushi-label-top">${reco.roleTitle}</div>
        <div class="sushi-label-bottom">${reco.company}</div>
        <div class="strategic-indicators ${glowEffect}">
          <div class="competition-indicator">Competition: ${Math.round(analysis.competitionLevel * 100)}%</div>
          <div class="time-indicator">Time: ${analysis.timeToValue}d</div>
          <div class="strategic-value">Strategic: ${(analysis.strategicValue * 100).toFixed(0)}%</div>
        </div>
      </div>
    `;
    
    // Store analysis for later use
    plate._analysis = analysis;
    
    return plate;
  }
  
  function addSushiToBelt(reco) {
    if (conveyorBelt.isProcessing) {
      conveyorBelt.queue.push(reco);
      return;
    }
    
    conveyorBelt.isProcessing = true;
    const beltContainer = $('#conveyor-belt');
    const plate = createSushiPlate(reco, currentRecos.findIndex(r => r.id === reco.id));
    
    beltContainer.appendChild(plate);
    conveyorBelt.currentPlate = plate;
    conveyorBelt.activeJob = reco;
    
    // Update job info panel immediately
    updateJobInfoPanel(reco);
    
    // Start the movement sequence (timing based on belt speed)
    const decisionPhaseDelay = Math.floor(conveyorBelt.beltSpeed * 0.4);
    setTimeout(() => {
      startDecisionPhase(plate, reco);
    }, decisionPhaseDelay);
    
    // Auto-miss if no action taken
    setTimeout(() => {
      if (conveyorBelt.currentPlate === plate && !plate.classList.contains('accepted') && !plate.classList.contains('rejected')) {
        missOpportunity(plate, reco);
      }
    }, conveyorBelt.beltSpeed);
  }
  
  function startDecisionPhase(plate, reco) {
    if (!plate || plate.classList.contains('accepted') || plate.classList.contains('rejected')) return;
    
    plate.classList.add('in-decision-zone');
    
    // Track decision timing for knife skills
    conveyorBelt.decisionStartTime = Date.now();
    
    // Start countdown timer
    const timeIndicator = $('#time-indicator');
    timeIndicator.classList.add('countdown');
    
    // Enable interaction
    plate.style.pointerEvents = 'auto';
    
    // Set up click handlers for mobile
    plate.addEventListener('click', () => {
      if (!plate.classList.contains('accepted') && !plate.classList.contains('rejected')) {
        acceptSushi(plate, reco);
      }
    });
    
    // Show chef recommendation
    const analysis = plate._analysis;
    if (analysis) {
      showChefAdvice(analysis, reco);
    }
    
    // Decision window timeout (dynamic based on strategy)
    conveyorBelt.decisionTimer = setTimeout(() => {
      if (conveyorBelt.currentPlate === plate) {
        endDecisionPhase();
      }
    }, conveyorBelt.decisionWindow);
  }
  
  function endDecisionPhase() {
    const timeIndicator = $('#time-indicator');
    timeIndicator.classList.remove('countdown');
    
    if (conveyorBelt.currentPlate) {
      conveyorBelt.currentPlate.classList.remove('in-decision-zone');
    }
  }
  
  function acceptSushi(plate, reco) {
    if (!plate || plate.classList.contains('accepted') || plate.classList.contains('rejected')) return;
    
    clearTimeout(conveyorBelt.decisionTimer);
    endDecisionPhase();
    
    plate.classList.add('accepted');
    
    // Record knife skills for precision and timing
    const timeSpent = conveyorBelt.decisionWindow - (conveyorBelt.decisionTimer ? 
      conveyorBelt.decisionWindow - (Date.now() - conveyorBelt.decisionStartTime) : 0);
    recordApplicationTechnique(reco, 'accept', timeSpent, true); // Assume customized for accepts
    
    // Add to job list
    addRecoToJobs(reco);
    
    // Strategic feedback based on decision quality
    const analysis = plate._analysis;
    let feedbackMessage = '';
    let feedbackType = 'success';
    
    if (analysis.category === 'golden_sushi') {
      feedbackMessage = `🌟 EXCELLENT CHOICE! ${reco.company} - Perfect strategic fit!\nLow competition, high fit, great timing!`;
      chefStrategy.todaysApplications++;
    } else if (analysis.category === 'quality_choice') {
      feedbackMessage = `✅ SMART GRAB! ${reco.company} - Strong strategic value!\nFit: ${analysis.fitScore.toFixed(1)} | Competition: ${(analysis.competitionLevel * 100).toFixed(0)}%`;
      chefStrategy.todaysApplications++;
    } else if (analysis.wasteRisk > 0.6) {
      feedbackMessage = `⚠️ RISKY CHOICE! ${reco.company} may waste time...\n${analysis.chefRecommendation}`;
      feedbackType = 'warning';
      chefStrategy.todaysApplications++;
    } else {
      feedbackMessage = `✅ Applied to ${reco.company}\nStrategic Value: ${(analysis.strategicValue * 100).toFixed(0)}%`;
      chefStrategy.todaysApplications++;
    }
    
    showToast(feedbackMessage, feedbackType);
    
    // Analytics with strategic data
    const insights = generateWhyInsights(reco, true);
    swipeAnalytics.accepted.push({ 
      ...reco, 
      insights, 
      strategicAnalysis: analysis,
      timestamp: Date.now() 
    });
    updateGameStats(true, reco.expectedFit);
    
    // Clean up after animation
    setTimeout(() => {
      plate.remove();
      processNextSushi();
    }, 800);
    
    // Trigger achievements
    checkAchievements();
  }
  
  function rejectSushi(plate, reco) {
    if (!plate || plate.classList.contains('accepted') || plate.classList.contains('rejected')) return;
    
    clearTimeout(conveyorBelt.decisionTimer);
    endDecisionPhase();
    
    plate.classList.add('rejected');
    
    // Record knife skills for decision speed
    const timeSpent = conveyorBelt.decisionWindow - (conveyorBelt.decisionTimer ? 
      conveyorBelt.decisionWindow - (Date.now() - conveyorBelt.decisionStartTime) : 0);
    recordApplicationTechnique(reco, 'reject', timeSpent, false);
    
    // Show rejection feedback
    const concerns = generateWhyInsights(reco, false);
    showToast(`❌ Passed on ${reco.company}\n${concerns.join('\n')}`, 'error');
    
    // Analytics
    swipeAnalytics.rejected.push({ ...reco, concerns, timestamp: Date.now() });
    updateGameStats(false, reco.expectedFit);
    
    // Clean up after animation
    setTimeout(() => {
      plate.remove();
      processNextSushi();
    }, 600);
  }
  
  function missOpportunity(plate, reco) {
    if (!plate || plate.classList.contains('accepted') || plate.classList.contains('rejected')) return;
    
    clearTimeout(conveyorBelt.decisionTimer);
    endDecisionPhase();
    
    plate.classList.add('missed');
    
    // Update missed count
    conveyorBelt.missedCount++;
    const pileCount = $('#pile-count');
    const missedPile = $('#missed-pile');
    
    pileCount.textContent = conveyorBelt.missedCount;
    missedPile.classList.add('updated');
    
    setTimeout(() => {
      missedPile.classList.remove('updated');
    }, 300);
    
    // Show missed feedback
    showToast(`⏰ Missed opportunity at ${reco.company} - Window closed!`, 'warning');
    
    // Analytics (as neither accept nor reject)
    swipeAnalytics.missed = swipeAnalytics.missed || [];
    swipeAnalytics.missed.push({ ...reco, timestamp: Date.now() });
    
    // Clean up after animation
    setTimeout(() => {
      plate.remove();
      processNextSushi();
    }, 1000);
  }
  
  function processNextSushi() {
    conveyorBelt.isProcessing = false;
    conveyorBelt.currentPlate = null;
    conveyorBelt.activeJob = null;
    
    // Process queued items
    if (conveyorBelt.queue.length > 0) {
      const nextReco = conveyorBelt.queue.shift();
      setTimeout(() => {
        addSushiToBelt(nextReco);
      }, 1500); // Delay between sushi
    } else {
      // Load next job
      setTimeout(() => {
        nextSushi();
      }, 2000);
    }
  }
  
  function updateJobInfoPanel(reco) {
    // Update Atari-style job info panel
    $('#card-company').textContent = reco.company.toUpperCase();
    $('#card-role').textContent = reco.roleTitle.toUpperCase();
    $('#salary-value').textContent = reco.salary || '$--';
    $('#fit-score-value').textContent = reco.expectedFit.toFixed(1);
    $('#sector-value').textContent = reco.sector.toUpperCase();
    $('#location-value').textContent = (reco.location || 'REMOTE').toUpperCase();
    
    // Update fit score styling
    const fitScoreEl = $('#fit-score-value');
    fitScoreEl.className = `stat-value fit-score ${fitClass(reco.expectedFit)}`;
    
    // Generate a random vibe
    const vibes = ['😍', '🤩', '😎', '😄', '😊', '🥳', '🥰', '😉'];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    $('#vibe-value').textContent = randomVibe;
    
    // Update tags
    const tagsContainer = $('#card-tags');
    tagsContainer.innerHTML = reco.tags.slice(0, 4).map(tag => 
      `<div class="retro-tag">${tag.toUpperCase()}</div>`
    ).join('');
  }
  
  function updateGameStats(isAccept, fitScore) {
    gameStats.totalSwiped++;
    
    if (isAccept) {
      gameStats.acceptedStreak++;
      gameStats.rejectedInRow = 0;
      gameStats.maxStreak = Math.max(gameStats.maxStreak, gameStats.acceptedStreak);
      
      if (fitScore >= 9.0) {
        gameStats.perfectMatches++;
      }
    } else {
      gameStats.acceptedStreak = 0;
      gameStats.rejectedInRow++;
    }
    
    gameStats.lastAction = isAccept ? 'accept' : 'reject';
  }
  
  function nextSushi() {
    if (currentRecos.length === 0) return;
    currentIndex = (currentIndex + 1) % currentRecos.length;
    const nextReco = currentRecos[currentIndex];
    addSushiToBelt(nextReco);
  }
  
  // Belt control functions
  let beltPaused = false;
  let beltSpeed = 'normal';
  let focusedPlate = 0;
  
  function toggleBeltPause() {
    beltPaused = !beltPaused;
    console.log(`Belt ${beltPaused ? 'paused' : 'resumed'}`);
    // Could add visual indicators here
  }
  
  function changeBeltSpeed() {
    const speeds = ['slow', 'normal', 'fast'];
    const currentSpeedIndex = speeds.indexOf(beltSpeed);
    beltSpeed = speeds[(currentSpeedIndex + 1) % speeds.length];
    console.log(`Belt speed changed to: ${beltSpeed}`);
    // Could add visual indicators here
  }
  
  function updateFocusedPlate() {
    console.log(`Focused plate: ${focusedPlate}`);
    // Could add visual focus indicators here
    if (focusedPlate !== currentIndex) {
      currentIndex = focusedPlate;
      displayCurrentSushi();
    }
  }


  function swipeRight() {
    if (conveyorBelt.currentPlate && conveyorBelt.activeJob) {
      acceptSushi(conveyorBelt.currentPlate, conveyorBelt.activeJob);
    }
  }

  function swipeLeft() {
    if (conveyorBelt.currentPlate && conveyorBelt.activeJob) {
      rejectSushi(conveyorBelt.currentPlate, conveyorBelt.activeJob);
    }
  }

  function addRecoToJobs(reco) {
    const jobs = getJobs();
    const newJob = {
      id: `${reco.id}-${Date.now()}`,
      company: reco.company,
      roleTitle: reco.roleTitle,
      location: reco.location,
      status: 'not-started',
      vibe: '😍',
      fitScore: parseFloat(reco.expectedFit.toFixed(1)),
      salary: reco.salary,
      tags: ['Remote', ...reco.tags].slice(0,5),
      appliedDate: null,
      notes: `${reco.company} (${reco.sector}) discovered via sushi belt 🍣`,
      research: { companyIntel: `${reco.company} in ${reco.sector}.`, keyPeople: ["CEO","CTO","Head of Product"], recentNews: "", competitiveAdvantage: "", challenges: "" },
      iceBreakers: [],
      objections: [],
      fitAnalysis: 'Discovered and swiped right on conveyor belt',
      activityLog: [],
      dateAdded: new Date().toISOString().split('T')[0]
    };
    const all = [newJob, ...jobs];
    saveJobs(all);
  }


  // Generate fallback recommendations when no data exists
  function generateFallbackRecommendations() {
    console.log('🌾 Creating demo recommendations for first-time users');
    const fallbackJobs = [
      {
        id: 'demo-1',
        company: 'TechCorp',
        roleTitle: 'Senior Software Engineer',
        location: 'San Francisco',
        sector: 'Technology',
        salary: '$120k - $160k',
        expectedFit: 8.5,
        tags: ['Remote', 'React', 'Node.js', 'Startup']
      },
      {
        id: 'demo-2', 
        company: 'DataFlow Inc',
        roleTitle: 'Product Manager',
        location: 'New York',
        sector: 'Data Analytics',
        salary: '$110k - $140k',
        expectedFit: 7.8,
        tags: ['Hybrid', 'B2B', 'SaaS', 'Growth Stage']
      },
      {
        id: 'demo-3',
        company: 'CloudNative',
        roleTitle: 'DevOps Engineer', 
        location: 'Seattle',
        sector: 'Cloud Services',
        salary: '$130k - $170k',
        expectedFit: 9.1,
        tags: ['Remote', 'AWS', 'Kubernetes', 'Series B']
      },
      {
        id: 'demo-4',
        company: 'GreenTech Solutions',
        roleTitle: 'Frontend Developer',
        location: 'Austin',
        sector: 'CleanTech',
        salary: '$95k - $125k',
        expectedFit: 7.2,
        tags: ['Hybrid', 'Vue.js', 'TypeScript', 'Mission-Driven']
      },
      {
        id: 'demo-5',
        company: 'FinanceBot',
        roleTitle: 'Full Stack Engineer',
        location: 'Remote',
        sector: 'FinTech',
        salary: '$140k - $180k',
        expectedFit: 8.9,
        tags: ['Remote', 'Python', 'React', 'Series A']
      }
    ];
    
    return fallbackJobs;
  }
  
  function render() {
    console.log('🍣 Discovery render() called');
    
    // Check if DiscoveryCore is loaded
    if (!window.DiscoveryCore) {
      console.error('❌ DiscoveryCore not loaded!');
      return;
    }
    
    const jobs = getJobs();
    console.log('📊 Jobs loaded:', jobs.length);
    
    const insights = window.DiscoveryCore.analyzeLearningSignals(jobs);
    console.log('💡 Insights generated:', insights);
    
    // Update learning signals
    const signals = $('#signals');
    if (signals) {
      signals.innerHTML = `
        <div class="segment-stats">
          ${insights.topSegments.map(s => `
            <div class="segment-stat"><span class="segment-name">${s.name} (${s.count})</span><span class="segment-score">${s.score.toFixed(2)}</span></div>
          `).join('') || '<div class="empty">No signals yet. Add activities in the main app.</div>'}
        </div>`;
    }
    
    // Update belt analytics
    const beltAnalytics = $('#belt-analytics');
    if (beltAnalytics) {
      beltAnalytics.innerHTML = `
        <div class="segment-stats">
          <div class="segment-stat"><span class="segment-name">Accepted (→)</span><span class="segment-score">${swipeAnalytics.accepted.length}</span></div>
          <div class="segment-stat"><span class="segment-name">Rejected (←)</span><span class="segment-score">${swipeAnalytics.rejected.length}</span></div>
        </div>`;
    }

    const recos = window.DiscoveryCore.generateRecommendations(jobs, insights, Date.now() % 97);
    console.log('🍣 Recommendations generated:', recos.length, recos);
    
    // Set up recommendations for conveyor belt
    currentRecos = recos;
    currentIndex = 0;
    
    if (recos.length > 0 && !conveyorBelt.isProcessing) {
      console.log('🌾 Starting conveyor belt with first recommendation:', recos[0]);
      addSushiToBelt(recos[0]);
    } else {
      console.warn('⚠️ No recommendations to start belt with. Recos length:', recos.length, 'Belt processing:', conveyorBelt.isProcessing);
      // Try to generate some fallback recommendations
      if (recos.length === 0) {
        console.log('🌾 Generating fallback recommendations...');
        const fallbackRecos = generateFallbackRecommendations();
        currentRecos = fallbackRecos;
        if (fallbackRecos.length > 0) {
          addSushiToBelt(fallbackRecos[0]);
        }
      }
    }
    
    // Hidden legacy table for compatibility
    const recosEl = $('#recos');
    recosEl.innerHTML = recos.map((r,i) => `
      <div data-reco-id="${i}">${r.company} - ${r.roleTitle}</div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const refresh = document.getElementById('refresh-btn');
    if (refresh) refresh.addEventListener('click', render);
    
    // Belt control event listeners
    const pauseBtn = $('#pause-btn');
    const speedBtn = $('#speed-btn');
    const refreshBelt = $('#refresh-belt');
    
    if (pauseBtn) pauseBtn.addEventListener('click', toggleBeltPause);
    if (speedBtn) speedBtn.addEventListener('click', changeBeltSpeed);
    if (refreshBelt) refreshBelt.addEventListener('click', render);
    
    // Keyboard controls - arrow keys for swiping
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          swipeRight();
          showToast('🍣 Swiped right! Added to your job list', 'success');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          swipeLeft();
          showToast('🚫 Swiped left! Passed on this opportunity', 'error');
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusedPlate = Math.max(0, focusedPlate - 1);
          updateFocusedPlate();
          break;
        case 'ArrowDown':
          e.preventDefault();
          focusedPlate = Math.min(currentRecos.length - 1, focusedPlate + 1);
          updateFocusedPlate();
          break;
        case ' ': // Spacebar to pause/resume
          e.preventDefault();
          toggleBeltPause();
          break;
      }
    });
    
    // Initialize Chef Strategy System
    calculateChefStrategy();
    
    // Initialize Mise en Place and Knife Skills systems
    checkDailyPreparation();
    updatePreparationDisplay();
    updateKnifeSkillsDisplay();
    
    render();
    
    // PWA and Mobile Features initialization
    registerServiceWorker();
    addMobileTouchControls();
    setupInstallPrompt();
    
    // Action button handlers
    const acceptBtn = document.getElementById('accept-btn');
    const rejectBtn = document.getElementById('reject-btn');
    
    if (acceptBtn) {
      acceptBtn.addEventListener('click', swipeRight);
    }
    
    if (rejectBtn) {
      rejectBtn.addEventListener('click', swipeLeft);
    }
    
    // Make Mise en Place functions globally available
    window.completePreparationItem = completePreparationItem;
    window.checkDailyPreparation = checkDailyPreparation;
  });
})();
