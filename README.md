[![Python](https://img.shields.io/badge/Python-%233776AB.svg?style=flat-square&logo=python&logoColor=white)]()
[![React](https://img.shields.io/badge/React-%2320232a.svg?style=flat-square&logo=react&logoColor=%2361DAFB)]()
[![Node.js](https://img.shields.io/badge/Node.js-%23339933.svg?style=flat-square&logo=node.js&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# CodeThium AI: Code On! 

  <img width="600" height="auto" alt="lgo" src="https://github.com/user-attachments/assets/08b63c6d-29ea-45a3-85f9-577decc420f0" />



## Description 📝

CodeThium is a **web-based AI coding assistant** powered by a **Transformer decoder-only model** trained from scratch . It is trained on the **MBPP dataset** and a **custom dataset (~1000 code examples)** due to Colab GPU limits. The project demonstrates **end-to-end ML deployment**: model training → backend API → frontend web interface.

1.  [Features](#features-%EF%B8%8F)
2.  [Tech Stack](#tech-stack-%EF%B8%8F)
3.  [Installation](#installation-%EF%B8%8F)
4.  [Usage](#usage-%EF%B8%8F)
5.  [How to use](#how-to-use-%EF%B8%8F)
6.  [Project Structure](#project-structure-%EF%B8%8F)
7.  [API Reference](#api-reference-%EF%B8%8F)
8.  [Contributing](#contributing-%EF%B8%8F)
9.  [License](#license-%EF%B8%8F)
10. [Important Links](#important-links-%EF%B8%8F)
11. [Footer](#footer-%EF%B8%8F)

## Features ✨

*   **AI-Powered Chatbot:** Interact with an AI assistant to generate code snippets and receive coding assistance. 🤖
*   **User Authentication:** Secure user registration and login using bcrypt and JWT. 🔒
*   **Chat History:** Save and manage chat history with titles and message previews. 💬
*   **Password Management:** Users can change their passwords securely. 🔑
*   **Real-time Code Generation:** Backend API using FastAPI and a PyTorch model to generate code. 🐍
*   **Interactive UI:** Built using React with features like message loading indicators, auto-resize input, and settings modal. 🎨

## Tech Stack 💻

*   **Frontend:** React, JavaScript, CSS, HTML, Next.js, Bootstrap ⚛️
*   **Backend:** Node.js, Express, JavaScript, FastAPI ⚙️
*   **Database:** PostgreSQL 🐘
*   **AI Model:** Python, PyTorch, Transformer 🧠
*   **Other:** dotenv, cors, cookie-parser 🛠️

## Installation 🛠️

To run CodeThium AI, follow these steps:

### 1. Clone the repository ⬇️

```bash
git clone https://github.com/dangnguyengroup23/CodeThium
cd CodeThium
```

### 2. Install frontend dependencies 📦

```bash
cd codethium-ai-web
npm install
```

### 3. Install backend dependencies ⚙️

```bash
cd server
npm install
```

### 4. Configure PostgreSQL database 🐘

*   Ensure PostgreSQL is installed and running.
*   Create a database named `codethium`.
*   Update the database connection details in the `server/.env` file:

    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_NAME=codethium
    JWT_SECRET=your_jwt_secret
    ```

### 5. Configure Environment Variables ⚙️

*   Create a `.env` file in the `server` directory.
*   Add the necessary environment variables:

    ```
    PORT=4000
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    JWT_SECRET=your_jwt_secret
    ```

### 6. Install Python dependencies for the AI model 🐍

```bash
pip install -r requirements.txt
```

## Usage 🚀

### 1. Start the backend server ⚙️

```bash
cd codethium-ai-web/server
npm start server
```

This will start the Node.js server with nodemon, which automatically restarts the server on file changes.

### 2. Start the frontend application ⚛️

```bash
cd codethium-ai-web
npm start
```

This command will start the React application in development mode.

### 3. Run the AI model (FastAPI) 🐍

```bash
cd codethium-model
python decoder_only_model.py
```

This will start the FastAPI server, which serves the AI model.

### 4. Access the application 🌐

Open your browser and navigate to `http://localhost:3000` to access the CodeThium AI application. You can then log in or sign up to start using the AI coding assistant.

## How to use 💡

1.  **Sign Up/Log In**: Start by creating an account or logging in with your existing credentials. You can also use social login options like Google, Apple, or Microsoft (will update). 🔑
2.  **Start a New Chat**: Click on the "New Chat" button to start a new conversation with the AI assistant. 💬
3.  **Interact with the AI**: Type your coding-related questions or prompts in the input area and send them to the AI. 🤖
4.  **Receive Code Suggestions**: The AI will process your input and generate code snippets or suggestions to assist you with your coding tasks. 💡
5.  **Manage Chat History**: Your previous chats are saved in the chat history sidebar. You can revisit them anytime to review or continue the conversation. 📚
6.  **Change Password**: Go to Settings and click change password button. 🔑

**Example Use Cases**

*   Code generation from natural language descriptions.
*   Debugging and error identification.
*   Learning new programming languages and techniques.

## Project Structure 📁

```
CodeThium/
├── codethium-ai-web/          # React frontend
│   ├── public/                # Public assets
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── ChatbotPage.js # Chatbot interface
│   │   │   ├── LoginPage.js   # Login page
│   │   ├── App.js             # Main application component
│   │   ├── index.js           # Entry point
│   ├── package.json           # Frontend dependencies
│   ├── README.md
├── server/                  # Node.js/Express backend
│   ├── index.js           # Server entry point
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
├── codethium-model/           # Python AI model
│   ├── decoder_only_model.py  # FastAPI application
│   ├── model_components.py    # Model components and training utilities
│   ├── train_model.py       # Model training script
│   ├── fullspm.model          # SentencePiece model
│   ├── vocab.pth              # Vocabulary
```

## API Reference 📚

The backend server exposes the following API endpoints:

*   `POST /api/register`: Registers a new user. 📝
*   `POST /api/login`: Logs in an existing user. 🔑
*   `GET /api/me`: Retrieves the current user's information. 👤
*   `POST /api/logout`: Logs out the current user. 🚪
*   `POST /api/change-password`: Changes the current user's password. 🔄
*   `POST /api/chats`: Saves a new chat. 💬
*   `GET /api/chats`: Retrieves all chats for the current user. 💬
*   `PUT /api/chats/:id`: Updates an existing chat. ✏️
*   `DELETE /api/chats/:id`: Deletes a chat. 🗑️
*   `POST /chat`: Generates AI chat reply. 💬


## License ⚖️

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

## Important Links 🔗

*   **GitHub Repository:** [https://github.com/dangnguyengroup23/CodeThium](https://github.com/dangnguyengroup23/CodeThium)
*   **Author's LinkedIn:** [https://www.linkedin.com/in/huong-dang-a19115303/](https://www.linkedin.com/in/huong-dang-a19115303/)
*   **Discord:** [https://discord.gg/codethium](https://discord.gg/codethium)

## Footer 👣

CodeThium AI - [https://github.com/dangnguyengroup23/CodeThium](https://github.com/dangnguyengroup23/CodeThium) by Huong Dang. ✨

