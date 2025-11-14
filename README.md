# 🎴 Teen Patti - 3-Player Multiplayer Card Game

A modern, real-time multiplayer Teen Patti (Indian Poker) game with beautiful 3D graphics, built with Next.js, Socket.IO, and React Three Fiber.

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Progress](https://img.shields.io/badge/progress-85%25-yellow)

---

## ✨ Features

### 🎮 Core Gameplay
- **3-Player Teen Patti** - Traditional Indian poker game
- **Real-time Multiplayer** - Socket.IO powered instant gameplay
- **Blind & Seen Modes** - Classic betting strategies
- **Complete Actions** - Call, Raise, Fold, Show
- **Hand Rankings** - All standard Teen Patti hands

### 🎨 3D Graphics
- **Realistic Card Table** - Professional 3D environment
- **Card Animations** - Deal, flip, and move animations
- **Natural Avatars** - Human-like player models
- **Turn Indicators** - Clear visual feedback
- **Status Badges** - Blind/Seen indicators

### 🔐 Authentication
- **Google Sign-in** - OAuth 2.0 integration
- **Facebook Sign-in** - Social login
- **Guest Mode** - Play without account
- **Profile System** - Track your progress

### 💾 Database
- **SQLite** - Fast, embedded database
- **Persistent Stats** - All data saved
- **Game History** - Track your games
- **Leaderboard** - Global rankings

### 📊 Stats & Analytics
- **Player Profile** - Detailed statistics
- **Win/Loss Tracking** - Complete history
- **Leaderboard** - Top players
- **Game History** - Last 20 games

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd three-player-game

# Install dependencies
npm install

# Start development server
npm run dev:unified
```

### First Time Setup

1. **Create Environment File** (`.env.local`)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Optional: OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

2. **Generate Secret**
```bash
openssl rand -base64 32
```

3. **Start Server**
```bash
npm run dev:unified
```

4. **Open Browser**
```
http://localhost:3000
```

---

## 📖 Documentation

- **[Project Status](PROJECT_STATUS.md)** - Complete feature list, roadmap
- **[Authentication Setup](QUICK_START_AUTH.md)** - OAuth configuration
- **[Profile System](PROFILE_INTEGRATION.md)** - Profile features
- **[Leaderboard](LEADERBOARD_SYSTEM.md)** - Rankings system
- **[Game History](GAME_HISTORY.md)** - History tracking
- **[Database Schema](database/schema.sql)** - Database structure

---

## 🎮 How to Play

### Starting a Game

1. **Enter Your Name** on the home page
2. **Create New Game** or **Join Existing** with game ID
3. **Wait for 3 Players** to join
4. **Click Ready** when ready to start
5. **Game Starts Automatically** after 2 seconds

### During Game

- **Blind Mode**: Cards face down, lower bet cost
- **See Cards**: View your cards, higher bet cost
- **Actions**:
  - **Call**: Match current bet
  - **Raise**: Increase the bet
  - **Fold**: Exit the round
  - **Show**: Reveal cards (when 2 players left)

### Winning

- **Best Hand Wins** (or last player standing)
- **Collect Pot** - All bets go to winner
- **Stats Updated** - Your profile reflects the result

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **React Three Fiber** - 3D graphics
- **Drei** - 3D helpers
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentication

### Backend
- **Node.js** - Runtime
- **Express.js** - API framework
- **Socket.IO** - Real-time communication
- **better-sqlite3** - Database
- **SQLite** - Data storage

### Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

---

## 📂 Project Structure

```
three-player-game/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── player/               # Player stats
│   │   ├── leaderboard/          # Rankings
│   │   └── games/                # Game history
│   ├── game/[gameId]/            # Game room
│   ├── profile/                  # User profile
│   ├── leaderboard/              # Leaderboard page
│   ├── games/history/            # Game history
│   └── auth/signin/              # Login page
├── components/                   # React components
│   ├── game/                     # Game components
│   │   └── RoundTable3D.tsx      # 3D game view
│   ├── auth/                     # Auth components
│   └── ui/                       # UI components
├── database/                     # Database files
│   ├── schema.sql                # Database schema
│   ├── db.js                     # Database functions
│   └── teenpatti.db              # SQLite database
├── lib/                          # Utilities
│   ├── socket.ts                 # Socket client
│   └── sounds.ts                 # Sound system
├── public/                       # Static files
├── unified-server.js             # Combined server
└── README.md                     # This file
```

---

## 🎯 Current Status

### ✅ Implemented (85%)
- ✅ Core game mechanics
- ✅ 3D graphics & animations
- ✅ Real-time multiplayer
- ✅ Authentication (Google/Facebook)
- ✅ Database integration
- ✅ Profile system
- ✅ Leaderboard
- ✅ Game history
- ✅ Responsive design

### 🚧 In Progress
- 🔨 Mobile optimization
- 🔨 Error handling improvements
- 🔨 Performance tuning

### ❌ Planned Features
- ❌ Sound effects
- ❌ Chat system
- ❌ Achievements
- ❌ Friends system
- ❌ Tournaments
- ❌ Side show
- ❌ Admin panel

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for complete details.

---

## 🧪 Testing

### Manual Testing
```bash
# Start server
npm run dev:unified

# Open 3 browser tabs
# Create game in tab 1
# Join with tabs 2 & 3
# Play a complete game
```

### With Ngrok (External Testing)
```bash
# Start ngrok
ngrok http 3000

# Update .env.local
NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.app

# Share ngrok URL with friends
```

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Stop all node processes
# Windows:
taskkill /F /IM node.exe

# Mac/Linux:
killall node

# Clean build
rm -rf .next
npm run dev:unified
```

### Database Issues
```bash
# Delete database
rm database/*.db*

# Server will recreate on restart
npm run dev:unified
```

### Connection Timeout
1. Check firewall settings
2. Verify port 3000 is available
3. Check ngrok is running (if using)
4. Clear browser cache

### OAuth Not Working
1. Check `.env.local` exists
2. Verify OAuth credentials
3. Check redirect URIs match
4. Restart server after env changes

See documentation files for detailed troubleshooting.

---

## 📝 Scripts

```bash
# Development
npm run dev:unified        # Start unified server (recommended)
npm run dev                # Start Next.js only
npm run server             # Start Socket.IO server only

# Production
npm run build              # Build for production
npm run start              # Start production server

# Utilities
npm run lint               # Run ESLint
```

---

## 🔧 Configuration

### Environment Variables
- `NEXTAUTH_URL` - App URL (required)
- `NEXTAUTH_SECRET` - Auth secret (required)
- `GOOGLE_CLIENT_ID` - Google OAuth (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)
- `FACEBOOK_CLIENT_ID` - Facebook OAuth (optional)
- `FACEBOOK_CLIENT_SECRET` - Facebook OAuth (optional)
- `NODE_ENV` - Environment (development/production)

### Database
- Location: `database/teenpatti.db`
- Type: SQLite
- Mode: WAL (Write-Ahead Logging)
- Auto-created on first run

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for feature ideas.

---

## 📜 License

This project is private and proprietary.

---

## 🙏 Acknowledgments

- **Teen Patti** - Traditional Indian card game
- **Next.js** - Amazing React framework
- **Socket.IO** - Real-time magic
- **Three.js** - 3D graphics power
- **NextAuth.js** - Auth made easy

---

## 📞 Support

For issues or questions:
1. Check [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. Review documentation files
3. Check troubleshooting section
4. Test in clean environment

---

## 🎉 Quick Links

- **Play Game**: http://localhost:3000
- **Login**: http://localhost:3000/auth/signin
- **Profile**: http://localhost:3000/profile
- **Leaderboard**: http://localhost:3000/leaderboard
- **History**: http://localhost:3000/games/history

---

## 📊 Stats

- **Lines of Code**: ~15,000+
- **Components**: 50+
- **API Endpoints**: 10+
- **Database Tables**: 5
- **3D Models**: Custom built
- **Supported Players**: 3 per game
- **Concurrent Games**: Unlimited

---

## 🚀 Roadmap

### Short Term (1-2 weeks)
- [ ] Add sound effects
- [ ] Implement chat
- [ ] Mobile optimization
- [ ] Tutorial system

### Medium Term (1 month)
- [ ] Achievements
- [ ] Friends system
- [ ] Tournaments
- [ ] Advanced stats

### Long Term (3+ months)
- [ ] Native mobile apps
- [ ] Admin panel
- [ ] Monetization
- [ ] Game variants

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed roadmap.

---

**Built with ❤️ for Teen Patti enthusiasts**

*"May your cards be ever in your favor!"* 🎴✨

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: Active Development
