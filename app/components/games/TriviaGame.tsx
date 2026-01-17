"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain, Timer, Trophy, Coins, Lock, Gamepad2,
  RefreshCw, HelpCircle, ChevronRight, Check, X
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./trivia-game.css";

interface User {
  _id: string;
  name: string;
  userPoints: number;
  gamesPlayed?: Array<{
    gameId: string;
    gameName: string;
    playedAt: Date;
    score?: number;
    pointsEarned: number;
    completed: boolean;
  }>;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const TRIVIA_GAME_ID = "trivia";
const TRIVIA_GAME_NAME = "Trivia Challenge";
const COINS_REWARD = 5;
const QUESTIONS_PER_GAME = 10;
const TIME_PER_QUESTION = 30;
const BASE_COINS = 40;

export default function TriviaGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [categories, setCategories] = useState<string[]>([
    'General Knowledge', 'Science', 'History', 'Sports',
    'Entertainment', 'Geography', 'Technology'
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('General Knowledge');

  // Sample questions database
  const sampleQuestions: Record<string, Question[]> = {
    'General Knowledge': [
      {
        id: 1,
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        category: "General Knowledge",
        difficulty: "easy"
      },
      {
        id: 2,
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1,
        category: "General Knowledge",
        difficulty: "easy"
      },
      {
        id: 3,
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctAnswer: 2,
        category: "General Knowledge",
        difficulty: "medium"
      },
      {
        id: 4,
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: 3,
        category: "General Knowledge",
        difficulty: "medium"
      },
      {
        id: 5,
        question: "Which element has the chemical symbol 'Au'?",
        options: ["Silver", "Gold", "Argon", "Aluminum"],
        correctAnswer: 1,
        category: "General Knowledge",
        difficulty: "hard"
      }
    ],
    'Science': [
      {
        id: 6,
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "NaCl", "O2"],
        correctAnswer: 0,
        category: "Science",
        difficulty: "easy"
      },
      {
        id: 7,
        question: "What is the speed of light?",
        options: ["299,792 km/s", "150,000 km/s", "1,000,000 km/s", "500,000 km/s"],
        correctAnswer: 0,
        category: "Science",
        difficulty: "hard"
      }
    ],
    'History': [
      {
        id: 8,
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2,
        category: "History",
        difficulty: "medium"
      }
    ],
    'Sports': [
      {
        id: 9,
        question: "Which country won the FIFA World Cup in 2018?",
        options: ["Germany", "Brazil", "France", "Argentina"],
        correctAnswer: 2,
        category: "Sports",
        difficulty: "medium"
      }
    ],
    'Entertainment': [
      {
        id: 10,
        question: "Who directed the movie 'Inception'?",
        options: ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Quentin Tarantino"],
        correctAnswer: 1,
        category: "Entertainment",
        difficulty: "medium"
      }
    ]
  };

  // Check if user has already played a game TODAY (using UTC)
  const hasPlayedToday = (user: User | null, gameId: string): boolean => {
    if (!user || !user.gamesPlayed) return false;

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Check ALL records for this game, not just the first one found
    return user.gamesPlayed.some((game) => {
      if (game.gameId !== gameId) return false;

      const playedDate = new Date(game.playedAt);
      const playedUTC = new Date(Date.UTC(
        playedDate.getUTCFullYear(),
        playedDate.getUTCMonth(),
        playedDate.getUTCDate()
      ));

      return playedUTC.getTime() === todayUTC.getTime();
    });
  };

  const getNextPlayTime = (user: User | null, gameId: string): string => {
    if (!user || !user.gamesPlayed) return "Play Now";

    // Find the LATEST play record for this game
    const gameRecords = user.gamesPlayed
      .filter((game) => game.gameId === gameId)
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

    if (gameRecords.length === 0) return "Play Now";

    const lastPlayed = gameRecords[0];
    const playedDate = new Date(lastPlayed.playedAt);
    const playedUTC = new Date(Date.UTC(
      playedDate.getUTCFullYear(),
      playedDate.getUTCMonth(),
      playedDate.getUTCDate()
    ));

    const todayUTC = new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    ));

    // If played today (or in future??), calculate time until tomorrow
    if (playedUTC.getTime() >= todayUTC.getTime()) {
      const tomorrowUTC = new Date(playedUTC);
      tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

      const nowUTC = new Date();
      const diff = tomorrowUTC.getTime() - nowUTC.getTime();

      if (diff <= 0) return "Play Now";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }

    return "Play Now";
  };

  // Authentication and user data
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/login");
      return;
    }

    const initUser = async () => {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            const playedToday = hasPlayedToday(data.user, TRIVIA_GAME_ID);
            setCanPlay(!playedToday);

            if (playedToday) {
              setNextPlayTime(getNextPlayTime(data.user, TRIVIA_GAME_ID));
              setGameMessage("🚫 You have already played Trivia today!");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, [authUser, authLoading, router]);

  // Initialize game
  const initializeGame = useCallback(() => {
    if (!canPlay) return;

    // Get questions for selected category
    const categoryQuestions = sampleQuestions[selectedCategory] || sampleQuestions['General Knowledge'];

    // Select random questions
    const shuffled = [...categoryQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_PER_GAME);

    setQuestions(shuffled);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimeLeft(TIME_PER_QUESTION);
    setGameStarted(false);
    setGameCompleted(false);
    setAnswered(false);
    setEarnedCoins(0);
    setGameMessage("");
  }, [canPlay, selectedCategory]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameStarted && timeLeft > 0 && !answered && !gameCompleted) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !answered && !gameCompleted) {
      handleTimeUp();
    }

    return () => clearInterval(interval);
  }, [gameStarted, timeLeft, answered, gameCompleted]);

  // Handle time up
  const handleTimeUp = () => {
    setAnswered(true);
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (answered || !canPlay) return;

    if (!gameStarted) setGameStarted(true);

    setSelectedAnswer(answerIndex);
    setAnswered(true);

    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(prev => {
        const newScore = prev + (questions[currentQuestion].difficulty === 'easy' ? 10 :
          questions[currentQuestion].difficulty === 'medium' ? 20 : 30);
        return newScore;
      });
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(TIME_PER_QUESTION);
      setAnswered(false);
    } else {
      finishGame();
    }
  };

  // Calculate coins
  const calculateCoins = (): number => {
    const accuracy = (score / (questions.length * 30)) * 100; // Max 30 per question for hard
    let coins = BASE_COINS;

    if (accuracy >= 80) coins *= 2;
    else if (accuracy >= 60) coins *= 1.5;
    else if (accuracy >= 40) coins *= 1.2;

    return Math.floor(coins);
  };

  // Finish game
  const finishGame = async () => {
    setGameCompleted(true);
    const coins = calculateCoins();
    setEarnedCoins(coins);

    if (!user) return;

    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch("/api/user/markGamePlayed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          gameId: TRIVIA_GAME_ID,
          gameName: TRIVIA_GAME_NAME,
          score: score,
          pointsEarned: coins
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state immediately
        const newGameRecord = {
          gameId: TRIVIA_GAME_ID,
          gameName: TRIVIA_GAME_NAME,
          playedAt: new Date(),
          score: score,
          pointsEarned: coins,
          completed: true
        };

        const updatedUser = user ? {
          ...user,
          userPoints: data.totalPoints || user.userPoints,
          gamesPlayed: [...(user.gamesPlayed || []), newGameRecord]
        } : null;

        if (updatedUser) {
          setUser(updatedUser);
          setNextPlayTime(getNextPlayTime(updatedUser, TRIVIA_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(`🎉 Game Complete! You earned ${coins} coins!`);
      }
    } catch (error) {
      console.error("Error saving game:", error);
    }
  };

  // Start game
  const startGame = () => {
    if (questions.length === 0) {
      initializeGame();
    }
    setGameStarted(true);
  };

  if (authLoading || loading) {
    return (
      <div className="trivia-loading-screen">
        <div className="trivia-loading-message">Loading game...</div>
      </div>
    );
  }

  if (!canPlay && !gameStarted) {
    return (
      <div className="trivia-game-container">
        <header className="trivia-game-header">
          <h1 className="trivia-game-title">
            <Brain className="trivia-title-icon" />
            Trivia Challenge
          </h1>
          <p className="trivia-welcome-message">
            Welcome, <span className="trivia-username">{user?.name}</span>!
          </p>
        </header>

        <div className="trivia-already-played">
          <Lock className="trivia-lock-icon" />
          <h2>Game Already Played Today</h2>
          <p>{gameMessage || "🚫 You have already played Trivia today!"}</p>
          <div className="trivia-next-play">
            Next available in: <span className="trivia-next-play-time">{nextPlayTime}</span>
          </div>
          <button
            onClick={() => router.push("/zone")}
            className="trivia-button trivia-button-primary"
          >
            <Gamepad2 className="trivia-button-icon" />
            Return to Game Zone
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="trivia-game-container">
        <header className="trivia-game-header">
          <div className="trivia-header-content">
            <div>
              <h1 className="trivia-game-title">
                <Brain className="trivia-title-icon" />
                Trivia Challenge
              </h1>
              <p className="trivia-welcome-message">
                Welcome, <span className="trivia-username">{user?.name}</span>!
              </p>
            </div>
            <div className="trivia-user-coins">
              <Coins className="trivia-coins-icon" />
              <span className="trivia-coins-value">{user?.userPoints || 0}</span>
            </div>
          </div>
        </header>

        <div className="trivia-setup">
          <div className="trivia-setup-card">
            <h2>Select Category</h2>
            <div className="trivia-categories">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`trivia-category-button ${selectedCategory === category ? 'trivia-category-selected' : ''
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="trivia-game-info">
              <h3>Game Rules</h3>
              <ul className="trivia-rules-list">
                <li>{QUESTIONS_PER_GAME} questions per game</li>
                <li>{TIME_PER_QUESTION} seconds per question</li>
                <li>Points: Easy (10), Medium (20), Hard (30)</li>
                <li>Base reward: {BASE_COINS} coins</li>
              </ul>
            </div>

            <button
              onClick={startGame}
              className="trivia-button trivia-button-primary"
            >
              Start Trivia Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trivia-game-container">
      <header className="trivia-game-header">
        <div className="trivia-header-content">
          <div>
            <h1 className="trivia-game-title">
              <Brain className="trivia-title-icon" />
              Trivia Challenge
            </h1>
            <p className="trivia-welcome-message">
              Welcome, <span className="trivia-username">{user?.name}</span>!
            </p>
          </div>
          <div className="trivia-user-coins">
            <Coins className="trivia-coins-icon" />
            <span className="trivia-coins-value">{user?.userPoints || 0}</span>
          </div>
        </div>
      </header>

      <div className="trivia-stats-container">
        <div className="trivia-stat-card">
          <div className="trivia-stat-label">Question</div>
          <div className="trivia-stat-value">{currentQuestion + 1}/{questions.length}</div>
        </div>

        <div className="trivia-stat-card">
          <Timer className="trivia-stat-icon" />
          <div className="trivia-stat-label">Time Left</div>
          <div className="trivia-stat-value">{timeLeft}s</div>
        </div>

        <div className="trivia-stat-card">
          <Trophy className="trivia-stat-icon" />
          <div className="trivia-stat-label">Score</div>
          <div className="trivia-stat-value">{score}</div>
        </div>

        <div className="trivia-stat-card">
          <div className="trivia-stat-label">Category</div>
          <div className="trivia-stat-value">{selectedCategory}</div>
        </div>
      </div>

      <div className="trivia-question-container">
        <div className="trivia-question-card">
          <div className="trivia-question-header">
            <span className="trivia-difficulty-badge trivia-difficulty-{questions[currentQuestion]?.difficulty}">
              {questions[currentQuestion]?.difficulty}
            </span>
            <span className="trivia-category-badge">
              {questions[currentQuestion]?.category}
            </span>
          </div>

          <h2 className="trivia-question-text">
            {questions[currentQuestion]?.question}
          </h2>

          <div className="trivia-options-grid">
            {questions[currentQuestion]?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === questions[currentQuestion].correctAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered}
                  className={`trivia-option-button ${isSelected ? 'trivia-option-selected' : ''
                    } ${answered && isCorrect ? 'trivia-option-correct' : ''
                    } ${answered && isSelected && !isCorrect ? 'trivia-option-wrong' : ''
                    }`}
                >
                  <span className="trivia-option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="trivia-option-text">{option}</span>

                  {answered && (
                    <span className="trivia-option-status">
                      {isCorrect ? (
                        <Check className="trivia-status-icon trivia-status-correct" />
                      ) : isSelected ? (
                        <X className="trivia-status-icon trivia-status-wrong" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="trivia-progress-bar">
        <div
          className="trivia-progress-fill"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="trivia-controls">
        <button
          onClick={initializeGame}
          className="trivia-button trivia-button-restart"
        >
          <RefreshCw className="trivia-button-icon" />
          Restart Game
        </button>
      </div>

      {gameMessage && (
        <div className="trivia-message">
          <div className="trivia-message-card success">
            {gameMessage}
          </div>
        </div>
      )}

      {gameCompleted && (
        <div className="trivia-game-over">
          <div className="trivia-game-over-card">
            <h3>🎉 Trivia Challenge Complete!</h3>

            <div className="trivia-results">
              <div className="trivia-result-item">
                <span>Final Score:</span>
                <span className="trivia-result-value">{score}</span>
              </div>
              <div className="trivia-result-item">
                <span>Correct Answers:</span>
                <span className="trivia-result-value">
                  {Math.floor(score / 20)}/{questions.length}
                </span>
              </div>
              <div className="trivia-result-item">
                <span>Accuracy:</span>
                <span className="trivia-result-value">
                  {Math.floor((score / (questions.length * 30)) * 100)}%
                </span>
              </div>
              <div className="trivia-result-item">
                <span>Coins Earned:</span>
                <span className="trivia-result-value coins">+{earnedCoins}</span>
              </div>
            </div>

            <div className="trivia-total-coins">
              Total coins: <span>{user?.userPoints || 0}</span>
            </div>

            <div className="trivia-game-over-message">
              <p>{gameMessage}</p>
              <p className="trivia-next-play-hint">
                Next play available: {nextPlayTime}
              </p>
            </div>

            <button
              onClick={() => router.push("/zone")}
              className="trivia-button trivia-button-primary"
            >
              Return to Game Zone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}