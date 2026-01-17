export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import Product from "@/models/Product";

const products = [
  {
    name: "Dead Man's Deck",
    slug: "dead-mans-deck",
    shortDescription:
      "Zombie survival card game combining strategy, memory, and chilling zombie theme.",
    story:
      "Meet Dead Man's Deck, the card game that combines strategy, memory, and a chilling zombie theme to keep you on your toes! With every flip of the card, you're one step closer to survival… or succumbing to the undead. But here's the twist: Want to turn up the party? Dead Man's Deck easily transforms into a zombie-themed drinking game. A thrilling strategy game that doubles as a party drinking game with optional Challenge Cards. Perfect for both intense game nights and lighthearted gatherings.",

    keyFeatures: [
      "Dual Gameplay Mode: Play as a strategic card game or turn it into a zombie-themed drinking game",
      "Memory & Strategy: Remember your card positions while planning your moves",
      "Phase & Power Cards: Game-changing cards that can flip the game in seconds",
      "Challenge Cards: Optional cards to add extra spice and chaos",
      "Quick Setup: Deal 4 cards, remember 2, and start playing",
      "Flexible Player Count: Works great with 2-8 players",
      "Fast-Paced Rounds: 15-20 minute games keep the energy high",
      "Thematic Design: Immersive zombie artwork and theme",
    ],

    howToPlay: {
      setup:
        "Seat 2–8 players, shuffle the main deck and deal 4 cards face-down to each player. Everyone secretly looks at any two of their cards and remembers both value and position. Place the remaining deck in the center as a draw pile.",
      gameplay:
        "On your turn, draw 1 card from the draw or discard pile. Decide whether to keep it by swapping it with one of your face-down cards, or discard it if it is worse. Timing is key—beat your opponents to discard Phase and Power Cards or risk being stuck with them!",
      winning:
        "Either discard all your cards first or declare 'NO MORE A ZOMBIE!' and reveal your hand to claim the win. But watch out—if you're wrong, double penalties await. Lower scores are better.",
    },

    whatYouGet: [
      "80 Premium Quality Cards with zombie-themed artwork",
      "Phase Cards for strategic gameplay twists",
      "Power Cards that change the game dynamics",
      "Optional Challenge Cards for party mode",
      "Detailed Instruction Manual",
      "Compact storage box for portability",
    ],

    faqs: [
      {
        question: "Can I use Dead Man's Deck as a drinking game?",
        answer:
          "Absolutely! Throw in the Challenge Cards, grab your drink of choice, and prepare for a night of zombie-fueled fun. But you can also play it totally sober—your call!",
      },
      {
        question: "How long does a typical game last?",
        answer: "On average, 15-20 minutes. Fast-paced and intense!",
      },
      {
        question: "How many players can play?",
        answer:
          "The game is perfect for 2-8 players. Whether it's you and your buddy or a whole crew, there's plenty of undead drama for everyone!",
      },
    ],

    meta: {
      players: "2–8",
      duration: "15–20 mins",
      age: "14+",
      difficulty: "Easy",
      moods: ["party", "chaotic", "strategy", "drinking-game"],
      badges: [
        "first-time-friendly",
        "party-favorite",
        "best-for-groups",
        "dual-gameplay",
      ],
    },

    price: { amount: 599, currency: "INR" },
    points: { purchase: 50 },
    stock: { available: true, quantity: 100 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1/joy-juncture/dead-mans-deck/thumbnail.jpg",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1/joy-juncture/dead-mans-deck/image-1.jpg",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1/joy-juncture/dead-mans-deck/image-2.jpg",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1/joy-juncture/dead-mans-deck/image-3.jpg",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_REAL_VIDEO_ID",
        provider: "youtube",
      },
    },

    category: ["card-game", "party", "drinking-game"],
    relatedSlugs: ["mehfil", "tamasha", "buzzed"],
  },

  {
    name: "Mehfil",
    slug: "mehfil",
    shortDescription:
      "Turn any gathering into a full-blown musical night with singing challenges!",
    story:
      "Mehfil by Joy Juncture is a super fun, super simple singing challenge card game where your voice (good or bad!) becomes the star of the evening. Mehfil never stops. Perfect for family nights, house parties, weddings, picnics, long drives, office breaks, hostel hangouts, or that one cousin who refuses to stop singing. Bring musical entertainment to any social occasion with four exciting categories - Word Play, Situationship, Jodi Jukebox, and Mic Drop - each offering unique Bollywood music challenges.",

    keyFeatures: [
      "Four Exciting Categories: Word Play, Situationship, Jodi Jukebox, and Mic Drop",
      "Bollywood Music Challenges: Test your knowledge of Hindi film songs",
      "No Musical Talent Required: Sing, hum, or just have fun trying",
      "Unlimited Players: Works with 1 to 99+ people",
      "Portable Design: Take it anywhere - parties, road trips, family gatherings",
      "Quick to Learn: No complicated rules, just draw and sing",
      "All Occasions: Perfect for weddings, picnics, long drives, office breaks",
      "Family-Friendly: Suitable for ages 13 and up",
    ],

    howToPlay: {
      setup:
        "Open the Mehfil card deck and gather your friends and family. Choose a music player or streaming service to play Bollywood songs. Shuffle the challenge cards and place them in the center. Each player gets ready to challenge themselves!",
      gameplay:
        "Players take turns drawing cards from four exciting categories - Word Play, Situationship, Jodi Jukebox, and Mic Drop. Each card presents a unique Bollywood music challenge. Complete the challenge by singing, humming, or performing. The group decides if you nailed it!",
      winning:
        "There's no real winning in Mehfil - it's all about fun and laughter! Everyone leaves as a winner with great memories!",
    },

    whatYouGet: [
      "100+ Bollywood Challenge Cards across 4 categories",
      "Word Play Cards - Song word challenges",
      "Situationship Cards - Scenario-based singing",
      "Jodi Jukebox Cards - Duet and pairing challenges",
      "Mic Drop Cards - Performance challenges",
      "Detailed Instruction Manual with category explanations",
      "Portable card box for easy carrying",
    ],

    faqs: [
      {
        question: "Do I need to be a good singer?",
        answer:
          "Not at all! Mehfil is about fun, not perfection. Whether you can sing like a pro or just hum along, everyone has a blast!",
      },
      {
        question: "How many people can play?",
        answer:
          "From 1 to 99+! It's perfect for any group size—intimate gatherings or massive parties.",
      },
    ],

    meta: {
      players: "1–99+",
      duration: "30–60 mins",
      age: "13+",
      difficulty: "Easy",
      moods: ["party", "musical", "laughter", "family-friendly", "icebreaker"],
      badges: [
        "party-essential",
        "musical-game",
        "portable-design",
        "family-gathering",
        "all-occasions",
      ],
    },

    price: { amount: 499, currency: "INR" },
    points: { purchase: 40 },
    stock: { available: true, quantity: 100 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1767795261/mehfil_yadwyq.png",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767807833/WhatsApp_Image_2025-10-07_at_15.54.52_x5sv0g.jpg",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795352/mehfil2_b22rva.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767807731/WhatsApp_Image_2025-10-07_at_15.54.51_k1dvd2.jpg",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_MEHFIL_VIDEO",
        provider: "youtube",
      },
    },

    category: ["party-game", "musical", "singing-game"],
    relatedSlugs: ["dead-mans-deck", "tamasha", "buzzed"],
  },

  {
    name: "Tamasha",
    slug: "tamasha",
    shortDescription:
      "Blends filmy drama, acting talent, iconic dance steps and competitive bidding into one laugh-out-loud party game.",
    story:
      "Tamasha blends filmy drama, acting talent, iconic dance steps and competitive bidding into one laugh-out-loud party game. Perfect for families, friends, and anyone who loves Bollywood. Experience the magic of Bollywood through gameplay that celebrates Indian cinema's most iconic moments, characters, and dance moves. Whether you're a casual fan or a true Bollywood enthusiast, Tamasha brings the excitement of Hindi cinema to your game night! A guaranteed hit for birthdays, Diwali gifting, family game night hampers, sangeet nights, bachelorettes, and every bollywood lover in your life.",

    keyFeatures: [
      "Bollywood-Themed Gameplay: Celebrate Hindi cinema's iconic moments",
      "Acting & Performance Challenges: Recreate famous scenes and dialogues",
      "Iconic Dance Steps: Perform memorable Bollywood dance moves",
      "Competitive Bidding System: Bid to take on challenges",
      "Character Challenges: Embody famous Bollywood characters",
      "Perfect Gift: Ideal for Diwali, birthdays, sangeet nights",
      "Unlimited Players: Great for large gatherings",
      "Easy to Learn: Jump right into the filmy fun",
    ],

    howToPlay: {
      setup:
        "Gather your friends and family who love Bollywood. Shuffle the Tamasha card deck and place it in the center. Each player receives bidding tokens. Designate who goes first.",
      gameplay:
        "Players take turns drawing cards featuring Bollywood scenes, iconic dialogues, dance steps, or famous characters. Players bid using their tokens to complete the challenge - act out the scene, perform the dance step, or recreate the dialogue. The player with the highest bid must complete the challenge. If successful, they earn points!",
      winning:
        "The player with the most points at the end wins the game! Victory comes from successfully completing Bollywood challenges and outbidding your opponents. The real win is the laughter and memories created together!",
    },

    whatYouGet: [
      "120+ Bollywood Challenge Cards",
      "Scene Cards - Famous movie moments to act out",
      "Dialogue Cards - Iconic lines to deliver",
      "Dance Cards - Memorable choreography to perform",
      "Character Cards - Famous personalities to embody",
      "Bidding Tokens for competitive gameplay",
      "Detailed Instruction Manual",
      "Score tracking guide",
      "Portable storage box",
    ],

    faqs: [
      {
        question: "Do I need to know Bollywood well?",
        answer:
          "Not necessarily! While Bollywood fans will love it, even casual viewers can enjoy the fun challenges and learn along the way.",
      },
      {
        question: "Is it suitable for family gatherings?",
        answer:
          "Absolutely! Tamasha is perfect for family game nights, Diwali celebrations, and any Bollywood-loving crowd.",
      },
    ],

    meta: {
      players: "1–99+",
      duration: "30–60 mins",
      age: "13+",
      difficulty: "Easy",
      moods: ["party", "bollywood", "acting", "laughter", "competitive"],
      badges: [
        "party-essential",
        "bollywood-game",
        "portable-design",
        "perfect-gift",
        "all-occasions",
      ],
    },

    price: { amount: 499, currency: "INR" },
    points: { purchase: 40 },
    stock: { available: true, quantity: 100 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1767795594/IMG_2447_nxujxs.png",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795453/IMG_2448_ueduha.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767796035/IMG_2450_ddgraf.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795334/IMG_2449_1_j4kqua.png",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_TAMASHA_VIDEO",
        provider: "youtube",
      },
    },

    category: ["party-game", "bollywood", "acting-game"],
    relatedSlugs: ["mehfil", "dead-mans-deck", "buzzed"],
  },
  {
    name: "Buzzed",
    slug: "buzzed",
    shortDescription:
      "Keep the party buzzing with Buzzed, the ultimate drinking card game by Joy Juncture!",
    story:
      "Keep the party buzzing with Buzzed, the ultimate drinking card game by Joy Juncture! Whether it's a house party, a pre-game warmup, a post-game chill session, or a full-blown club night, Buzzed brings people together with effortless fun. Designed for adults, by adults, this card game works for every kind of party person - early birds, night owls, social butterflies, silent observers, front-benchers, and full-time back-bench comedians. With quirky, chaotic, senseless, and wildly funny prompts, Buzzed guarantees non-stop laughter, unforgettable memories, and stories you'll discuss the next morning (if you remember them!). Just shuffle → sip → survive!!",

    keyFeatures: [
      "Super Easy to Play: No complicated rules, just shuffle and start",
      "Quirky & Chaotic Prompts: Wildly funny challenges for every vibe",
      "Perfect for All Settings: House parties, pre-games, club nights",
      "Inclusive Multiplayer: Works with any group size",
      "Pocket-Friendly: Affordable fun for everyone at ₹299",
      "Made in India: Designed by Indians for Indian parties",
      "Adult Humor: Designed for 18+ crowd with spicy content",
      "Portable Design: Take it anywhere the party goes",
    ],

    howToPlay: {
      setup:
        "No setup needed! Just open the Buzzed deck, shuffle the cards, and gather your crew. Make sure everyone has their favorite drink within reach. Super easy to get started!",
      gameplay:
        "Players take turns drawing cards from the deck. Each card has quirky, chaotic, senseless, and wildly funny prompts that work for any group size and every vibe. Read the prompt and follow along - no complicated rules to memorize, just pure fun and laughter!",
      winning:
        "There's no winning in Buzzed - it's all about the party, the memories, and the hilarious moments! The real victory is non-stop laughter, unforgettable memories, and the stories you'll discuss the next morning (if you remember them!). Just shuffle → sip → survive!!",
    },

    whatYouGet: [
      "180 Drinking Game Cards with wild prompts",
      "Quirky Challenges for every party personality",
      "Chaotic Tasks that guarantee laughter",
      "Funny Dares for the bold",
      "Group Activities for bonding",
      "Simple Instruction Card (barely needed!)",
      "Compact portable box",
      "Premium quality cards that survive spills",
    ],

    faqs: [
      {
        question: "Is Buzzed only for drinking?",
        answer:
          "While it's designed as a drinking game, you can totally play it with non-alcoholic drinks or even skip drinking entirely. The prompts are hilarious on their own!",
      },
      {
        question: "How many people can play?",
        answer:
          "Buzzed works for 2 to 99+ players! Whether it's a small hangout or a massive party, everyone gets in on the fun.",
      },
      {
        question: "Is it suitable for all parties?",
        answer:
          "Buzzed is designed for adults 18+ with mature humor. Perfect for house parties, college hangouts, bachelor/bachelorette parties, and adult game nights.",
      },
      {
        question: "How long does a game last?",
        answer:
          "As long as you want! Games typically run 30-90 minutes, but you can keep going as long as the party's alive.",
      },
      {
        question: "Can we play with mocktails?",
        answer:
          "Absolutely! Swap in mocktails, juices, or even water. The fun comes from the prompts and the company, not necessarily the alcohol.",
      },
    ],

    meta: {
      players: "2–99+",
      duration: "30–90 mins",
      age: "18+",
      difficulty: "Very Easy",
      moods: [
        "party",
        "drinking",
        "chaos",
        "laughter",
        "adult-humor",
        "social",
      ],
      badges: [
        "super-easy-to-play",
        "perfect-for-all-settings",
        "inclusive-multiplayer",
        "made-in-india",
        "pocket-friendly",
      ],
    },

    price: { amount: 299, currency: "INR" },
    points: { purchase: 30 },
    stock: { available: true, quantity: 100 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1767795360/buzz1_svuvso.jpg",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795360/buzz1_svuvso.jpg",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795364/buzz2_u0kiw7.jpg",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1/joy-juncture/buzzed/image-3.jpg",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_BUZZED_VIDEO",
        provider: "youtube",
      },
    },

    category: ["drinking-game", "party-game", "adult-game"],
    relatedSlugs: ["dead-mans-deck", "mehfil", "tamasha"],
  },
  {
    name: "The Bloody Inheritance",
    slug: "the-bloody-inheritance",
    shortDescription:
      "A hands-on murder mystery case file where you become the detective in a gripping crime thriller experience.",
    story:
      "Step inside a story that feels straight out of a crime thriller!! The Bloody Inheritance is a hands-on murder mystery case file where you become the detective. Created by JJ's game designers, this experience is packed with realistic evidence, gripping storytelling, and the kind of twists that keep you thinking long after the game ends!! This isn't your usual 'solve-the-puzzle' game. It feels like opening a real cold case... armed with files, photos, reports, letters, clues, and odd fragments of someone's life. Every piece leads you closer to the truth… if you read between the lines! A totally fresh kind of game night experience that sharpens deduction, teamwork, and smart decision-making.",

    keyFeatures: [
      "Immersive Detective Experience: Feels like you're inside a real crime thriller movie",
      "Realistic Evidence: Work through handwritten notes, photographs, reports, letters, and physical clues",
      "Gripping Storytelling: Twists and turns that keep you thinking long after the game ends",
      "Cold Case Format: Open a case file and piece together fragments of someone's life",
      "Sharpens Critical Skills: Enhances deduction, teamwork, and smart decision-making",
      "Low Prep, High Engagement: Easy to set up but deeply immersive gameplay",
      "Perfect for Any Occasion: House parties, game nights, team-building, detective-themed events",
      "1-5 Players: Best played in small teams for intense collaboration",
    ],

    howToPlay: {
      setup:
        "Gather your detective team of 3-5 players. Open The Bloody Inheritance case file and lay out all the evidence on a table. You'll have access to handwritten notes, photographs, reports, puzzles, objects, printed documents, and more. Review everything carefully - nothing is random, every clue matters!",
      gameplay:
        "Work through the evidence systematically. Study the clues carefully. Connect the dots between different pieces of information. Read between the lines to uncover hidden meanings. Piece together what truly happened based on the evidence. Discuss theories with your team and collaborate to solve the mystery. The fastest team to reach the correct conclusion wins bragging rights and eternal detective glory!",
      winning:
        "The team that correctly identifies the truth behind The Bloody Inheritance in the shortest time wins! Success comes from careful analysis, smart decision-making, and working together as a detective team. But the real victory is the immersive experience and the stories you'll tell about cracking the case!",
    },

    whatYouGet: [
      "Complete Case File with realistic packaging",
      "Handwritten Notes and Letters",
      "Crime Scene Photographs",
      "Police Reports and Documents",
      "Physical Evidence and Objects",
      "Witness Statements",
      "Puzzles and Encoded Clues",
      "Detective Notebook for tracking progress",
      "Detailed Solution Guide (sealed)",
      "Replayable with different groups",
    ],

    faqs: [
      {
        question: "How long does it take to solve?",
        answer:
          "Most teams take 60-120 minutes depending on their detective skills. Some finish faster, while others take their time savoring every clue!",
      },
      {
        question: "Can I play solo?",
        answer:
          "Yes! While designed for 3-5 players, you can definitely play solo. However, discussing theories with teammates makes it more fun and immersive.",
      },
      {
        question: "Is it replayable?",
        answer:
          "Once you solve it, you know the answer. However, it's great to play with different friend groups! Each team approaches the mystery differently.",
      },
      {
        question: "How difficult is it?",
        answer:
          "It's rated 'Hard' difficulty. You'll need to pay attention to details, connect subtle clues, and think critically. Perfect for mystery lovers who want a challenge!",
      },
      {
        question: "Do I need any additional materials?",
        answer:
          "Nope! Everything you need is in the case file. Just grab a pen/paper for notes and you're ready to start investigating.",
      },
      {
        question: "Is it suitable for team building?",
        answer:
          "Absolutely! The Bloody Inheritance is perfect for corporate team-building. It promotes collaboration, communication, and critical thinking in a fun, engaging way.",
      },
    ],

    meta: {
      players: "1–5",
      duration: "60–120 mins",
      age: "14+",
      difficulty: "Hard",
      moods: [
        "mystery",
        "detective",
        "thriller",
        "strategic",
        "collaborative",
        "immersive",
      ],
      badges: [
        "murder-mystery",
        "case-file",
        "realistic-evidence",
        "team-building",
        "party-game",
        "low-prep-high-engagement",
      ],
    },

    price: { amount: 999, currency: "INR" },
    points: { purchase: 80 },
    stock: { available: true, quantity: 50 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1767794693/bloody_pfuiii.png",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767794693/bloody_pfuiii.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767794697/bloody2_rwe1h6.jpg",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1/joy-juncture/the-bloody-inheritance/image-3.jpg",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_BLOODY_INHERITANCE_VIDEO",
        provider: "youtube",
      },
    },

    category: ["mystery-game", "detective-game", "case-file"],
    relatedSlugs: ["judge-me-and-guess", "tamasha", "dead-mans-deck"],
  },
  {
    name: "Judge Me & Guess",
    slug: "judge-me-and-guess",
    shortDescription:
      "A social experience card game that turns strangers into friends and replaces awkward silence with curious guesses and bold judgments.",
    story:
      "Judge Me & Guess isn't just a card game... it's a social experience made for every community, every group, and every table. From cafés and clubs to office teams, friend circles, student groups, and Sunday brunch communities… this game adapts to your vibe and your rules. Whether you're meeting a stranger, sitting with your date, or catching up with friends, this game replaces awkward silence with curious guesses, bold judgments, and surprisingly accurate truths!! Every card comes with a signature eye illustration (because someone is always judging 👀) and is divided into 3 levels... from light and warm-up to bold & deeper questions as the game progresses. Bring it to your café table, team lunch, weekend group, or family dinner — and let the conversations begin.",

    keyFeatures: [
      "Social Experience Design: Turns awkward silence into genuine conversations",
      "3 Judgment Levels: Progress from light warm-up to bold, deeper questions",
      "Signature Eye Illustration: Every card features the iconic 'someone is judging' design",
      "No Fixed Rules: Customize how you play - points, punishments, or pure storytelling",
      "Community-Friendly: Perfect for cafés, clubs, office teams, and friend circles",
      "Portable & Elegant: 52 high-quality cards with premium finish",
      "Display Stand Included: Stylish stand for café and tabletop play",
      "Conversation Starter: Breaks the ice and builds real connections",
    ],

    howToPlay: {
      setup:
        "Gather your group at a table. Each player has access to the 52 high-quality cards with 3 judgment levels. Have everyone get their phones ready to secretly note down answers. Place the stylish display stand in the center if playing in a café or community space.",
      gameplay:
        "Draw a card and read your 'Judge Me & Guess' prompt aloud. Secretly note down the real answer on your phone. Everyone at the table judges you based on what they see and assume. They write down their guesses. Whoever guesses closest or gets it correct wins the card. The game progresses from light warm-up questions to bold and deeper questions as you play!",
      winning:
        "Collect the most cards to win! Play it soft, play it spicy, play it your own way - the game works for every group dynamic. You can customize how you play: points, punishments, storytelling, anything goes. The real win is the genuine laughter, real conversations, and connections made around the table!",
    },

    whatYouGet: [
      "52 High-Quality Cards with signature eye illustrations",
      "3 Judgment Levels (Light, Medium, Bold)",
      "Premium Card Finish for durability",
      "Elegant Display Stand for tabletop play",
      "Compact Storage Box for portability",
      "Instruction Card with gameplay variations",
      "Community Guide with café setup tips",
      "Conversation prompts across all difficulty levels",
    ],

    faqs: [
      {
        question: "What are the 3 judgment levels?",
        answer:
          "The game starts with light, warm-up questions (Level 1), progresses to moderate personal questions (Level 2), and culminates in bold, deeper questions (Level 3). You control the pace!",
      },
      {
        question: "Can I play this with strangers?",
        answer:
          "Absolutely! Judge Me & Guess is designed to turn strangers into friends. Start with Level 1 questions to break the ice, then progress naturally.",
      },
      {
        question: "Is it only for couples or dates?",
        answer:
          "Not at all! While great for dates, it works perfectly for friend groups, office teams, family dinners, café meetups, and any social gathering.",
      },
      {
        question: "How many people can play?",
        answer:
          "Ideal for 2-8+ players. Works best in intimate groups where everyone can participate in the guessing and judging.",
      },
      {
        question: "Do I need to follow specific rules?",
        answer:
          "Nope! Judge Me & Guess has no fixed rules. Play it your way - add points, create punishments, or just enjoy the conversations. It adapts to your vibe.",
      },
      {
        question: "Can I use it in public spaces like cafés?",
        answer:
          "Yes! The game includes a stylish display stand perfect for café tables. It's designed to be community-friendly and adds to the ambiance.",
      },
    ],

    meta: {
      players: "2–8+",
      duration: "30–90 mins",
      age: "14+",
      difficulty: "Very Easy",
      moods: [
        "social",
        "conversation",
        "judgment",
        "laughter",
        "connection",
        "icebreaker",
      ],
      badges: [
        "conversation-starter",
        "community-builder",
        "no-rules",
        "customizable",
        "perfect-for-groups",
        "tabletop-display",
      ],
    },

    price: { amount: 999, currency: "INR" },
    points: { purchase: 80 },
    stock: { available: true, quantity: 100 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1767794808/judge_kmoq4n.png",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767794808/judge_kmoq4n.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767794824/judge2_vhdxpz.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1/joy-juncture/judge-me-and-guess/image-3.jpg",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_JUDGE_ME_VIDEO",
        provider: "youtube",
      },
    },

    category: ["party-game", "conversation-game", "social-game"],
    relatedSlugs: ["mehfil", "tamasha", "dead-mans-deck", "buzzed"],
  },
  {
    name: "One More Round",
    slug: "one-more-round",
    shortDescription:
      "A 150-piece jigsaw puzzle for adults that celebrates game night, laughter, and the art of chilling out with friends.",
    story:
      "One More Round – A 150-Piece Jigsaw Puzzle for Adults That Feels Like Game Night in a Box. Looking for a jigsaw puzzle that's more than just a pretty picture? One More Round is your official invite to game night with friends, beers, and a bit of playful chaos. This 150-piece puzzle drops you right into a buzzing table full of laughter, clinking glasses, and half-played card games. It's the kind of scene you wish you were part of... now you can piece it together, one moment at a time. Designed for puzzle lovers who appreciate fun, storytelling, and strong visual detail, this hand-illustrated adult puzzle celebrates the art of chilling out. From spilled drinks to cheeky expressions, every detail adds to the story and the challenge.",

    keyFeatures: [
      "Engaging Design: Vibrant scene featuring a lively game night with friends, beers, and card games",
      "Perfect Size: 150-piece puzzle that measures approximately 30 x 21 cm when completed",
      "Quality Components: Sturdy puzzle pieces with precise cuts ensuring a satisfying fit",
      "Entertainment Value: Celebrate happy hour in puzzle form with infectious laughter and fun details",
      "Gift Worthy: Excellent choice for puzzle enthusiasts, party hosts, or social gathering lovers",
      "Designed with Love in India: Crafted by Joy Juncture using eco-friendly ink and recycled board",
      "Hidden Surprises: Original artwork with rich details - can you find the odd drink out?",
      "Hand-Illustrated: Unique artistic style celebrating the joy of chilling out with friends",
    ],

    howToPlay: {
      setup:
        "Open the One More Round puzzle box and lay out all 150 pieces on a flat surface. Identify the border/edge pieces first and assemble the frame. Organize remaining pieces by color, pattern, or visual themes to make assembly easier. Find a comfortable space with good lighting for your puzzle session.",
      gameplay:
        "Sort through the pieces and begin assembling the puzzle, starting with the border and working inward. Look for distinctive features like specific colors, patterns, objects, and character expressions to identify where pieces belong. Work systematically, connecting pieces that share similar visual elements. The hand-illustrated details will guide you - from spilled drinks to cheeky expressions, every element tells part of the story!",
      winning:
        "Complete the full 150-piece puzzle to reveal the vibrant scene of game night, happy hour, and infectious laughter! Frame it, display it, or gift it to another puzzle enthusiast. Can you find all the hidden surprises and the odd drink out?",
    },

    whatYouGet: [
      "150 Premium Puzzle Pieces with precise cuts",
      "Hand-Illustrated Artwork (30 x 21 cm when complete)",
      "Eco-Friendly Ink and Recycled Board",
      "Sturdy Storage Box with vibrant cover art",
      "Hidden Surprises throughout the puzzle",
      "Original Joy Juncture Design",
      "Reference Image on box for guidance",
      "Perfect for framing after completion",
    ],

    faqs: [
      {
        question: "How long does it take to complete?",
        answer:
          "Most people complete it in 2-4 hours, depending on puzzle experience. It's the perfect length for a relaxed evening or a fun weekend activity!",
      },
      {
        question: "Is 150 pieces too easy for adults?",
        answer:
          "Not at all! The hand-illustrated details and vibrant colors create a satisfying challenge. It's engaging without being frustrating - perfect for casual puzzling.",
      },
      {
        question: "Can I frame it after completion?",
        answer:
          "Absolutely! The 30 x 21 cm size fits standard frames perfectly. Many customers frame it as fun wall art for game rooms or living spaces.",
      },
      {
        question: "Is it made with eco-friendly materials?",
        answer:
          "Yes! One More Round uses eco-friendly ink and recycled board. Quality puzzling with a conscience!",
      },
      {
        question: "What are the hidden surprises?",
        answer:
          "The artwork is packed with fun details - from spilled drinks to cheeky expressions. There's even an odd drink hidden in the scene. Can you spot it?",
      },
      {
        question: "Is it suitable as a gift?",
        answer:
          "Perfect gift for puzzle lovers, game night enthusiasts, or anyone who appreciates unique, fun artwork. Great for birthdays, housewarming, or just because!",
      },
    ],

    meta: {
      players: "1–4",
      duration: "2–4 hours",
      age: "14+",
      difficulty: "Medium",
      moods: [
        "relaxing",
        "social",
        "artistic",
        "storytelling",
        "casual",
        "mindful",
      ],
      badges: [
        "hand-illustrated",
        "eco-friendly",
        "made-in-india",
        "gift-worthy",
        "hidden-surprises",
        "adult-puzzle",
      ],
    },

    price: { amount: 499, currency: "INR" },
    points: { purchase: 40 },
    stock: { available: true, quantity: 100 },

    media: {
      thumbnail:
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_800,h_600,c_fill,f_auto,q_auto/v1767795889/onemore3_tvdwfj.png",
      images: [
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795091/onemore1_cjteqd.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767809187/IMG_1738_2_2_wkoye4.png",
        "https://res.cloudinary.com/dwvb2cgmq/image/upload/w_1200,h_900,c_fill,f_auto,q_auto/v1767795889/onemore3_tvdwfj.png",
      ],
      video: {
        url: "https://www.youtube.com/embed/YOUR_ONE_MORE_ROUND_VIDEO",
        provider: "youtube",
      },
    },

    category: ["puzzle", "jigsaw-puzzle", "adult-game"],
    relatedSlugs: [
      "judge-me-and-guess",
      "buzzed",
      "mehfil",
      "the-bloody-inheritance",
    ],
  },
];

export async function GET() {
  try {
    await connectDb();
    console.log("✅ Connected to MongoDB");

    await Product.deleteMany({});
    console.log("🗑️ Cleared existing products");

    const result = await Product.insertMany(products);
    console.log(`✅ Inserted ${result.length} products!`);

    return NextResponse.json({
      ok: true,
      message: `${result.length} products seeded successfully!`,
      count: result.length,
    });
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 },
    );
  }
}
