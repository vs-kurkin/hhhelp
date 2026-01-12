# hhhelp

Telegram bot and helper service for HeadHunter (hh.ru) automation and assistance.

## Features

- **Vacancy Analysis**: Analyzes vacancies using AI (Gemini).
- **Telegram Integration**: Bot interface for easy interaction.
- **Monitoring**: Health checks and metrics.
- **Vault Integration**: Secure configuration management.

## Project Structure

- `src/`: Main application source code.
- `packages/`: Shared internal packages (`@vk-public/*`).
- `data/`: Local data storage.

## Setup

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
