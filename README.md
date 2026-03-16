# InterviewPrep AI

InterviewPrep AI is a modern, feature-rich SaaS platform designed to help software engineers prepare for technical interviews using generative AI. By uploading your resume and specifying your target role, you can experience a tailored, challenging, and realistic mock interview.

## 🚀 Features

* **Smart Question Generation:** Uses LLaMA 3.3 70B via Groq to generate relevant interview questions based on your specific job role, job description, and chosen difficulty level (Junior, Mid, Senior).
* **Context-Aware:** Upload your PDF resume, and the platform will extract your experience to tailor questions specifically to your background.
* **Timed Practice Mode:** Simulate the pressure of a real interview with a built-in countdown timer for each question.
* **Hint System:** Stuck on a question? Get a quick, non-revealing AI hint to gently nudge you in the right direction.
* **Follow-up Questions:** After answering, the AI interviewer will challenge you with a specific follow-up question based on your initial response, just like a real interview.
* **Comprehensive Evaluation:** Receive a detailed score out of 10 for every answer, complete with feedback on what was good, what was missing, the key takeaway, and an ideal model answer.
* **Progress Tracking:** Monitor your performance across multiple sessions with an interactive dashboard and historical progress charts.
* **Profile Management:** Set your target role, target company, and professional bio to further customize your experience.
* **Modern SaaS UI:** Enjoy a clean, professional, and visually stunning dark-mode interface built with React.

## 🛠️ Technology Stack

* **Frontend:** React, React Router, Vite, Axios, Recharts, Vanilla CSS
* **Backend:** Node.js, Express, MongoDB, Mongoose
* **AI Integration:** LangChain, Groq API (LLaMA 3)
* **Authentication:** JWT (JSON Web Tokens), bcryptjs
* **File Handling:** Multer, pdf-parse (v1.1.1)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
* Node.js (v18 or higher)
* npm or yarn
* MongoDB (Local instance or MongoDB Atlas)
* A [Groq API Key](https://console.groq.com/keys)

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Neo200411/AI-interview.git
   cd AI-interview
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GROQ_API_KEY=your_groq_api_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   Open a new terminal window/tab:
   ```bash
   cd client
   npm install
   ```
   Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5001
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Access the App:**
   Open your browser and navigate to `http://localhost:5173`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Neo200411/AI-interview/issues).

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
