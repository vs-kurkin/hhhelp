# hhhelp

Telegram bot and helper service for HeadHunter (hh.ru) automation and assistance.

## Features

- **Vacancy Analysis**: Analyzes vacancies using AI (Gemini).
- **Telegram Integration**: Bot interface for easy interaction.
- **Monitoring**: Health checks and metrics.
- **Vault Integration**: Secure configuration management.

└───src\
    ├───config.ts
    ├───index.ts
    ├───api\
    │   └───server.ts
    ├───bot\
    │   ├───StateManager.ts
    │   ├───types.ts
    │   ├───handlers\
    │   │   ├───ApplicationHandlers.ts
    │   │   ├───SystemHandlers.ts
    │   │   └───VacancyHandlers.ts
    │   ├───keyboards\
    │   ├───middlewares\
    │   │   ├───AuthMiddleware.ts
    │   │   └───UserSaverMiddleware.ts
    │   └───utils\
    │       ├───ErrorHandler.ts
    │       └───StatusMessageHelper.ts
    ├───db\
    │   ├───connection.ts
    │   ├───index.ts
    │   ├───redis.ts
    │   └───models\
    │       ├───User.ts
    │       └───Vacancy.ts
    ├───middleware\
    │   ├───index.ts
    │   ├───metricsMiddleware.ts
    │   └───telegramAuth.ts
    ├───services\
    │   ├───AnalysisService.ts
    │   ├───DocumentService.ts
    │   ├───GeminiService.ts
    │   ├───HhAuthService.ts
    │   ├───HhService.ts
    │   ├───StorageService.ts
    │   ├───TelegramService.ts
    │   ├───VacancyClassifier.ts
    │   └───monitor\
    │       ├───AlertService.ts
    │       ├───LogBufferTransport.ts
    │       └───MetricsService.ts
    ├───templates\
    │   └───TelegramTemplates.ts
    └───utils\
        └───vault.ts

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vs-kurkin/hhhelp.git
    cd hhhelp
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in the required values.
    ```bash
    cp .env.example .env
    ```

4.  **Run Development Mode:**
    ```bash
    npm run dev
    ```

5.  **Build:**
    ```bash
    npm run build
    ```

## License

ISC
