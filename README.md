# HHHelp Bot

**HHHelp** is a smart Telegram bot designed to automate the job search process on HeadHunter (hh.ru) and empower candidates with AI-driven insights. It monitors vacancies, analyzes compatibility using Gemini AI, and generates tailored cover letters.

## 🚀 Features

### 🔍 Vacancy Monitoring
*   **Automated Search**: Periodically fetches vacancies based on configurable criteria (keywords, salary, region).
*   **Deduplication**: Tracks seen vacancies to notify you only about new opportunities.
*   **Smart Filtering**: (In progress) Filter vacancies by tech stack or keywords.

### 🧠 AI Assistance (Gemini)
*   **Resume Audit**: Upload your resume (PDF/TXT) for a comprehensive strength/weakness analysis by an "AI Career Coach".
*   **Match Analysis**: Instantly checks how well your resume fits a specific vacancy.
*   **Cover Letter Generation**: Generates professional, customized cover letters in seconds for any vacancy.

### 🛠 Technical Highlights
*   **Robust Backend**: Built with TypeScript and Node.js.
*   **Data Integrity**: Strict runtime validation of external APIs using **Zod**.
*   **Resilience**: Configurable timeouts and error handling strategies.
*   **Observability**: Integrated Prometheus metrics for monitoring vacancies and API health.
*   **Security**: Configuration managed via Vault (optional) or `.env`, with strict PII controls.

## 📦 Installation & Setup

### Prerequisites
*   Node.js v18+
*   MongoDB
*   Redis
*   Docker (optional, for containerized deployment)

### 1. Clone & Install
```bash
git clone https://github.com/vs-kurkin/hhhelp.git
cd hhhelp
pnpm install
```

### 2. Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```ini
# Telegram
TELEGRAM_BOT_TOKEN_HH=your_bot_token
TELEGRAM_CHAT_ID_HH=your_chat_id

# HeadHunter
HH_SEARCH_TEXT="(Frontend OR React) AND (Senior OR Lead)"
HH_MIN_SALARY=250000
HH_CONTACT_EMAIL=your_email@example.com

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Locally
```bash
# Development mode (watch)
npm run dev

# Production build
npm run build
npm start
```

### 4. Run Tests
```bash
npm test
```

## 🏗 Project Structure

```
src/
├── api/             # Express server (Health checks, Metrics)
├── bot/             # Telegram bot logic (GrammY)
│   ├── handlers/    # Command & Event handlers
│   └── keyboards/   # UI components
├── db/              # Database models (Mongoose)
├── errors/          # Custom error classes
├── services/        # Core business logic
│   ├── GeminiService.ts  # AI integration
│   ├── HhService.ts      # HeadHunter API client
│   └── prompts/          # AI System Prompts
├── config.ts        # Typed configuration management
└── index.ts         # Entry point
```

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/amazing-feature`.
3.  Commit your changes: `git commit -m 'feat: add amazing feature'`.
4.  Push to the branch: `git push origin feature/amazing-feature`.
5.  Open a Pull Request.

## 📄 License
ISC