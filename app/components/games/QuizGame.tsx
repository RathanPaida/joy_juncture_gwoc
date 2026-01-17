"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Timer, Trophy, Coins, Lock, Gamepad2,
  RefreshCw, ChevronRight, CheckCircle, XCircle, Award
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import "./quiz-game.css";

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

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  points: number;
}

const QUIZ_GAME_ID = "quiz";
const QUIZ_GAME_NAME = "Quiz Master";
const QUESTIONS_PER_QUIZ = 15;
const TIME_PER_QUESTION = 45;
const BASE_COINS = 5;

export default function QuizGame() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(true);
  const [nextPlayTime, setNextPlayTime] = useState("");
  const [gameMessage, setGameMessage] = useState("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizType, setQuizType] = useState<'mixed' | 'science' | 'history' | 'geography'>('mixed');
  const [streak, setStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Sample quiz questions database
  const quizQuestions: Record<string, QuizQuestion[]> = {
    mixed: [
      {
        id: 1,
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 2,
        explanation: "Jupiter is the largest planet in our solar system with a diameter of about 139,820 km.",
        category: "Astronomy",
        points: 10
      },
      {
        id: 2,
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswer: 1,
        explanation: "William Shakespeare wrote the famous tragedy 'Romeo and Juliet' in the late 16th century.",
        category: "Literature",
        points: 10
      },
      {
        id: 3,
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correctAnswer: 2,
        explanation: "Au is the chemical symbol for gold, derived from its Latin name 'aurum'.",
        category: "Chemistry",
        points: 15
      },
      {
        id: 4,
        question: "Which country is known as the Land of the Rising Sun?",
        options: ["China", "South Korea", "Japan", "Thailand"],
        correctAnswer: 2,
        explanation: "Japan is known as the Land of the Rising Sun because it lies to the east of the Asian mainland.",
        category: "Geography",
        points: 10
      },
      {
        id: 5,
        question: "What is the smallest bone in the human body?",
        options: ["Femur", "Stapes", "Radius", "Patella"],
        correctAnswer: 1,
        explanation: "The stapes bone in the middle ear is the smallest bone in the human body.",
        category: "Biology",
        points: 15
      },
      {
        id: 6,
        question: "Who discovered penicillin?",
        options: ["Marie Curie", "Alexander Fleming", "Louis Pasteur", "Albert Einstein"],
        correctAnswer: 1,
        explanation: "Alexander Fleming discovered penicillin in 1928, revolutionizing medicine.",
        category: "History",
        points: 15
      },
      {
        id: 7,
        question: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correctAnswer: 2,
        explanation: "Canberra is the capital city of Australia, chosen as a compromise between Sydney and Melbourne.",
        category: "Geography",
        points: 10
      },
      {
        id: 8,
        question: "Which element is most abundant in the Earth's atmosphere?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
        correctAnswer: 2,
        explanation: "Nitrogen makes up about 78% of the Earth's atmosphere.",
        category: "Chemistry",
        points: 10
      }
    ],
    science: [
      {
        id: 9,
        question: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"],
        correctAnswer: 2,
        explanation: "Mitochondria are known as the powerhouse of the cell because they produce ATP, the cell's energy currency.",
        category: "Biology",
        points: 10
      },
      {
        id: 10,
        question: "What force keeps planets in orbit around the sun?",
        options: ["Electromagnetism", "Gravity", "Strong Nuclear Force", "Centrifugal Force"],
        correctAnswer: 1,
        explanation: "Gravity is the force that keeps planets in orbit around the sun.",
        category: "Physics",
        points: 15
      }
    ],
    history: [
      {
        id: 11,
        question: "In which year did the Titanic sink?",
        options: ["1910", "1912", "1914", "1916"],
        correctAnswer: 1,
        explanation: "The RMS Titanic sank on April 15, 1912, after hitting an iceberg.",
        category: "History",
        points: 10
      }
    ],
    geography: [
      {
        id: 12,
        question: "What is the longest river in the world?",
        options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
        correctAnswer: 1,
        explanation: "The Nile River is the longest river in the world at approximately 6,650 km.",
        category: "Geography",
        points: 15
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
            const playedToday = hasPlayedToday(data.user, QUIZ_GAME_ID);
            setCanPlay(!playedToday);

            if (playedToday) {
              setNextPlayTime(getNextPlayTime(data.user, QUIZ_GAME_ID));
              setGameMessage("🚫 You have already played Quiz today!");
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

  // Initialize quiz
  const initializeQuiz = useCallback(() => {
    if (!canPlay) return;

    // Get questions for selected quiz type
    const typeQuestions = quizQuestions[quizType] || quizQuestions['mixed'];

    // Select random questions
    const shuffled = [...typeQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_PER_QUIZ);

    setQuestions(shuffled);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimeLeft(TIME_PER_QUESTION);
    setGameStarted(false);
    setGameCompleted(false);
    setAnswered(false);
    setEarnedCoins(0);
    setShowExplanation(false);
    setStreak(0);
    setCorrectAnswers(0);
    setGameMessage("");
  }, [canPlay, quizType]);

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
    setShowExplanation(true);
    setStreak(0);

    setTimeout(() => {
      setShowExplanation(false);
      nextQuestion();
    }, 4000);
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (answered || !canPlay) return;

    if (!gameStarted) setGameStarted(true);

    setSelectedAnswer(answerIndex);
    setAnswered(true);
    setShowExplanation(true);

    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);

      // Calculate points with streak bonus
      const streakBonus = Math.min(newStreak * 2, 10); // Max 10 bonus points
      const questionPoints = questions[currentQuestion].points + streakBonus;

      setScore(prev => prev + questionPoints);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setShowExplanation(false);
      nextQuestion();
    }, 4000);
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(TIME_PER_QUESTION);
      setAnswered(false);
    } else {
      finishQuiz();
    }
  };

  // Calculate coins
  const calculateCoins = (): number => {
    const accuracy = (correctAnswers / questions.length) * 100;
    const averagePoints = score / questions.length;

    let coins = BASE_COINS;

    // Accuracy bonus
    if (accuracy >= 90) coins *= 2.5;
    else if (accuracy >= 80) coins *= 2;
    else if (accuracy >= 70) coins *= 1.7;
    else if (accuracy >= 60) coins *= 1.4;
    else if (accuracy >= 50) coins *= 1.2;

    // Points bonus
    coins += Math.floor(averagePoints * 2);

    // Streak bonus
    const maxStreakBonus = Math.min(streak * 5, 50);
    coins += maxStreakBonus;

    return Math.floor(coins);
  };

  // Finish quiz
  const finishQuiz = async () => {
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
          gameId: QUIZ_GAME_ID,
          gameName: QUIZ_GAME_NAME,
          score: score,
          pointsEarned: coins
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state immediately
        const newGameRecord = {
          gameId: QUIZ_GAME_ID,
          gameName: QUIZ_GAME_NAME,
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
          setNextPlayTime(getNextPlayTime(updatedUser, QUIZ_GAME_ID));
        }

        setCanPlay(false);
        setGameMessage(`🏆 Quiz Master! You earned ${coins} coins!`);
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  // Start quiz
  const startQuiz = () => {
    if (questions.length === 0) {
      initializeQuiz();
    }
    setGameStarted(true);
  };

  // Skip question
  const skipQuestion = () => {
    if (answered || !canPlay) return;

    setAnswered(true);
    setShowExplanation(true);
    setStreak(0);

    setTimeout(() => {
      setShowExplanation(false);
      nextQuestion();
    }, 3000);
  };

  if (authLoading || loading) {
    return (
      <div className="quiz-loading-screen">
        <div className="quiz-loading-message">Loading quiz...</div>
      </div>
    );
  }

  if (!canPlay && !gameStarted) {
    return (
      <div className="quiz-game-container">
        <header className="quiz-game-header">
          <h1 className="quiz-game-title">
            <BookOpen className="quiz-title-icon" />
            Quiz Master
          </h1>
          <p className="quiz-welcome-message">
            Welcome, <span className="quiz-username">{user?.name}</span>!
          </p>
        </header>

        <div className="quiz-already-played">
          <Lock className="quiz-lock-icon" />
          <h2>Quiz Already Played Today</h2>
          <p>{gameMessage || "🚫 You have already played Quiz today!"}</p>
          <div className="quiz-next-play">
            Next available in: <span className="quiz-next-play-time">{nextPlayTime}</span>
          </div>
          <button
            onClick={() => router.push("/zone")}
            className="quiz-button quiz-button-primary"
          >
            <Gamepad2 className="quiz-button-icon" />
            Return to Game Zone
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-game-container">
        <header className="quiz-game-header">
          <div className="quiz-header-content">
            <div>
              <h1 className="quiz-game-title">
                <BookOpen className="quiz-title-icon" />
                Quiz Master
              </h1>
              <p className="quiz-welcome-message">
                Welcome, <span className="quiz-username">{user?.name}</span>!
              </p>
            </div>
            <div className="quiz-user-coins">
              <Coins className="quiz-coins-icon" />
              <span className="quiz-coins-value">{user?.userPoints || 0}</span>
            </div>
          </div>
        </header>

        <div className="quiz-setup">
          <div className="quiz-setup-card">
            <h2>Select Quiz Type</h2>
            <div className="quiz-type-selector">
              <button
                onClick={() => setQuizType('mixed')}
                className={`quiz-type-button ${quizType === 'mixed' ? 'quiz-type-selected' : ''}`}
              >
                🌟 Mixed Quiz
                <span className="quiz-type-description">Questions from all categories</span>
              </button>

              <button
                onClick={() => setQuizType('science')}
                className={`quiz-type-button ${quizType === 'science' ? 'quiz-type-selected' : ''}`}
              >
                🔬 Science Quiz
                <span className="quiz-type-description">Physics, Chemistry, Biology</span>
              </button>

              <button
                onClick={() => setQuizType('history')}
                className={`quiz-type-button ${quizType === 'history' ? 'quiz-type-selected' : ''}`}
              >
                📜 History Quiz
                <span className="quiz-type-description">Historical events and figures</span>
              </button>

              <button
                onClick={() => setQuizType('geography')}
                className={`quiz-type-button ${quizType === 'geography' ? 'quiz-type-selected' : ''}`}
              >
                🗺️ Geography Quiz
                <span className="quiz-type-description">Countries, capitals, landmarks</span>
              </button>
            </div>

            <div className="quiz-game-info">
              <h3>Quiz Rules</h3>
              <ul className="quiz-rules-list">
                <li>{QUESTIONS_PER_QUIZ} questions per quiz</li>
                <li>{TIME_PER_QUESTION} seconds per question</li>
                <li>Answer correctly to build streaks for bonus points</li>
                <li>Base reward: {BASE_COINS} coins</li>
                <li>Higher streaks = more coins!</li>
              </ul>
            </div>

            <button
              onClick={startQuiz}
              className="quiz-button quiz-button-primary"
            >
              Start Quiz Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-game-container">
      <header className="quiz-game-header">
        <div className="quiz-header-content">
          <div>
            <h1 className="quiz-game-title">
              <BookOpen className="quiz-title-icon" />
              Quiz Master
            </h1>
            <p className="quiz-welcome-message">
              Welcome, <span className="quiz-username">{user?.name}</span>!
            </p>
          </div>
          <div className="quiz-user-coins">
            <Coins className="quiz-coins-icon" />
            <span className="quiz-coins-value">{user?.userPoints || 0}</span>
          </div>
        </div>
      </header>

      <div className="quiz-stats-container">
        <div className="quiz-stat-card">
          <div className="quiz-stat-label">Question</div>
          <div className="quiz-stat-value">{currentQuestion + 1}/{questions.length}</div>
        </div>

        <div className="quiz-stat-card">
          <Timer className="quiz-stat-icon" />
          <div className="quiz-stat-label">Time Left</div>
          <div className="quiz-stat-value">{timeLeft}s</div>
        </div>

        <div className="quiz-stat-card">
          <Trophy className="quiz-stat-icon" />
          <div className="quiz-stat-label">Score</div>
          <div className="quiz-stat-value">{score}</div>
        </div>

        <div className="quiz-stat-card">
          <Award className="quiz-stat-icon" />
          <div className="quiz-stat-label">Streak</div>
          <div className="quiz-stat-value">{streak}🔥</div>
        </div>
      </div>

      <div className="quiz-question-container">
        <div className="quiz-question-card">
          <div className="quiz-question-header">
            <span className="quiz-category-badge">
              {questions[currentQuestion]?.category}
            </span>
            <span className="quiz-points-badge">
              {questions[currentQuestion]?.points} points
            </span>
          </div>

          <h2 className="quiz-question-text">
            {questions[currentQuestion]?.question}
          </h2>

          <div className="quiz-options-grid">
            {questions[currentQuestion]?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === questions[currentQuestion].correctAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered}
                  className={`quiz-option-button ${isSelected ? 'quiz-option-selected' : ''
                    } ${answered && isCorrect ? 'quiz-option-correct' : ''
                    } ${answered && isSelected && !isCorrect ? 'quiz-option-wrong' : ''
                    }`}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="quiz-option-text">{option}</span>

                  {answered && (
                    <span className="quiz-option-status">
                      {isCorrect ? (
                        <CheckCircle className="quiz-status-icon quiz-status-correct" />
                      ) : isSelected ? (
                        <XCircle className="quiz-status-icon quiz-status-wrong" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="quiz-explanation">
              <h4 className="quiz-explanation-title">
                {selectedAnswer === questions[currentQuestion]?.correctAnswer
                  ? "✅ Correct!"
                  : "❌ Incorrect!"}
              </h4>
              <p className="quiz-explanation-text">
                {questions[currentQuestion]?.explanation}
              </p>
              {selectedAnswer === questions[currentQuestion]?.correctAnswer && (
                <div className="quiz-streak-bonus">
                  +{questions[currentQuestion]?.points} points
                  {streak > 1 && ` + ${Math.min(streak * 2, 10)} streak bonus!`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="quiz-controls">
        <button
          onClick={skipQuestion}
          disabled={answered}
          className="quiz-button quiz-button-skip"
        >
          Skip Question
        </button>

        <button
          onClick={initializeQuiz}
          className="quiz-button quiz-button-restart"
        >
          <RefreshCw className="quiz-button-icon" />
          Restart Quiz
        </button>
      </div>

      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {gameMessage && (
        <div className="quiz-message">
          <div className="quiz-message-card success">
            {gameMessage}
          </div>
        </div>
      )}

      {gameCompleted && (
        <div className="quiz-game-over">
          <div className="quiz-game-over-card">
            <h3>🏆 Quiz Master Complete!</h3>

            <div className="quiz-results">
              <div className="quiz-result-item">
                <span>Final Score:</span>
                <span className="quiz-result-value">{score}</span>
              </div>
              <div className="quiz-result-item">
                <span>Correct Answers:</span>
                <span className="quiz-result-value">
                  {correctAnswers}/{questions.length}
                </span>
              </div>
              <div className="quiz-result-item">
                <span>Accuracy:</span>
                <span className="quiz-result-value">
                  {Math.floor((correctAnswers / questions.length) * 100)}%
                </span>
              </div>
              <div className="quiz-result-item">
                <span>Highest Streak:</span>
                <span className="quiz-result-value">{streak}🔥</span>
              </div>
              <div className="quiz-result-item">
                <span>Coins Earned:</span>
                <span className="quiz-result-value coins">+{earnedCoins}</span>
              </div>
            </div>

            <div className="quiz-achievements">
              {correctAnswers === questions.length && (
                <div className="quiz-achievement gold">
                  🏅 Perfect Score!
                </div>
              )}
              {streak >= 5 && (
                <div className="quiz-achievement silver">
                  🔥 Hot Streak!
                </div>
              )}
            </div>

            <div className="quiz-total-coins">
              Total coins: <span>{user?.userPoints || 0}</span>
            </div>

            <div className="quiz-game-over-message">
              <p>{gameMessage}</p>
              <p className="quiz-next-play-hint">
                Next play available: {nextPlayTime}
              </p>
            </div>

            <button
              onClick={() => router.push("/zone")}
              className="quiz-button quiz-button-primary"
            >
              Return to Game Zone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}