# 🦁 LionLokal Restaurant Grader

**LionLokal Restaurant Grader** is a web app that helps restaurant owners and marketers audit their restaurant websites for SEO, content quality, usability, and technical health. It provides actionable insights and a clear score breakdown, making it easy to identify areas for improvement. Optionally, it can generate AI-powered marketing tips using Google Gemini (limited to 20 requests/day on free tier).

![LionLokal Grader](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react) ![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js) ![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat&logo=express) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)

---

## ✨ Features

- **🔍 Restaurant Search:** Find restaurants using OpenStreetMap Nominatim API and auto-detect their website if available.
- **✍️ Manual Website Entry:** Enter a restaurant website URL manually if not found in search.
- **📊 Automated Website Audit:** Grades websites on SEO, content, usability, and technical criteria (out of 100).
- **📈 Score Breakdown:** Visual breakdown of scores for each category with color-coded results.
- **📋 Issue List:** Detailed list of detected issues, warnings, and suggestions categorized by type.
- **🤖 AI Insights (Gemini):** Get marketing tips and improvement ideas powered by Google Gemini AI (limited to 20 requests/day on free tier).
- **⚡ Fast & Responsive UI:** Built with React 19, Vite, and Tailwind CSS for a modern user experience.
- **🐳 Docker Support:** Easily run the app locally or deploy with Docker Compose.
- **📱 Mobile Friendly:** Responsive design optimized for desktop and mobile devices.

---

## 🏗️ Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **Axios** for API calls

### Backend

- **Node.js 20** with Express.js
- **Cheerio** for HTML parsing
- **Google Generative AI SDK** for Gemini integration
- **Axios** for fetching websites
- **dotenv** for environment configuration

### Infrastructure

- **Docker & Docker Compose** for containerization
- **Nginx** for serving production frontend

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (v20 recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) & Docker Compose (optional, for containerized setup)

### Clone the Repository

```bash
git clone https://github.com/yourusername/lionlokal-restaurant-grader.git
cd lionlokal-restaurant-grader
```

### Environment Variables

Create a `.env` file in the **root directory**:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
```

> **Note:** The `GEMINI_API_KEY` is **optional**. Without it, the app will still work but AI insights will be disabled.

---

## 🖥️ Running Locally (Manual Setup)

### 1. Start the Backend

```bash
cd server
npm install
node index.js
```

The backend will start on **http://localhost:4000**.

### 2. Start the Frontend

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

The frontend will start on **http://localhost:5173** (or the port shown in your terminal).

---

## 🐳 Running with Docker Compose

From the **project root**:

```bash
docker-compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:4000](http://localhost:4000)

To rebuild from scratch (no cache):

```bash
docker-compose build --no-cache
docker-compose up
```

To stop:

```bash
docker-compose down
```

---

## 📂 Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles (Tailwind)
│   ├── Dockerfile         # Frontend Docker build
│   ├── nginx.conf         # Nginx configuration for production
│   ├── vite.config.ts     # Vite configuration
│   └── package.json
│
├── server/                # Express backend
│   ├── index.js           # Main server file with grading logic
│   ├── Dockerfile         # Backend Docker build
│   └── package.json
│
├── docker-compose.yml     # Docker Compose orchestration
├── .env                   # Environment variables
└── README.md
```

---

## 🔍 How It Works

### 1. Restaurant Search

- Uses **OpenStreetMap Nominatim API** to search for restaurants
- Displays name, address, city, and country
- Auto-detects website from OpenStreetMap data

### 2. Website Audit

The backend fetches and analyzes the restaurant website using these categories:

#### 📊 Grading Categories (100 points total)

| Category      | Points | Checks                                                                                |
| ------------- | ------ | ------------------------------------------------------------------------------------- |
| **SEO**       | 30     | Title tag, meta description, H1 tags, canonical URLs, Open Graph tags                 |
| **Content**   | 25     | Menu availability, business hours, address, phone number, images with alt text        |
| **Usability** | 25     | Online ordering, reservation system, social media links, clickable phone, Google Maps |
| **Technical** | 20     | HTTPS, mobile viewport, favicon, structured data (Schema.org), load time              |

#### 🎯 Score Ranges

- **80-100:** Great 🟢
- **50-79:** Fair 🟡
- **0-49:** Poor 🔴

### 3. AI Insights (Optional)

If `GEMINI_API_KEY` is configured, the app generates:

- **Summary:** 2-sentence overview of the website's online presence
- **Top Priority:** The most important issue to fix
- **Quick Wins:** 3 easy improvements
- **Pro Tip:** Marketing advice from successful restaurants
- **Estimated Impact:** Projected increase in online visibility

> **Limitation:** Google Gemini free tier allows only **20 requests per day**. After that, AI insights will not be available until the next day.

---

## 🧪 Testing

### Test the Backend

```bash
# Check if server is running
curl http://localhost:4000/test-ai

# Test website grading
curl -X POST http://localhost:4000/grade \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example-restaurant.com"}'
```

### Test the Frontend

Open [http://localhost:5173](http://localhost:5173) (dev) or [http://localhost:3000](http://localhost:3000) (Docker) and search for a restaurant.

---

## ⚠️ Known Limitations

- **Gemini API Quota:** Free tier = 20 requests/day (AI insights disabled after quota)
- **OpenStreetMap Rate Limits:** Public Nominatim API is rate-limited (use responsibly)
- **HTTPS Sites Only:** Some HTTP-only sites may not load due to security restrictions
- **PDF Menus:** Penalized in scoring (not SEO-friendly or mobile-friendly)

---

## 🛠️ Development

### Frontend Development

```bash
cd client
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd server
npm run dev          # Start with auto-reload (using --watch)
npm start            # Start production server
```

---

## 🔐 Environment Variables Reference

| Variable         | Description                           | Required | Default                 |
| ---------------- | ------------------------------------- | -------- | ----------------------- |
| `GEMINI_API_KEY` | Google Gemini API key for AI insights | No       | -                       |
| `PORT`           | Backend server port                   | No       | `4000`                  |
| `VITE_API_URL`   | Frontend API URL (Docker only)        | No       | `http://localhost:4000` |

---

Create a `.env` file in the **root directory** (copy from `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
```

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Credits & Acknowledgments

- [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) for restaurant search data
- [Google Gemini AI](https://ai.google.dev/) for AI-powered insights
- [React](https://react.dev/) for the frontend framework
- [Vite](https://vitejs.dev/) for lightning-fast builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Cheerio](https://cheerio.js.org/) for HTML parsing

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ for restaurant owners who want better online presence**
