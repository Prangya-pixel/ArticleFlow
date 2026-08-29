import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ArticleEditor from "./pages/ArticleEditor";
import MyArticles from "./pages/MyArticles";
import Profile from "./pages/Profile";
import ArticleView from "./pages/ArticleView";
import Quiz from "./pages/Quiz";
import QuizManagement from "./pages/QuizManagement";

function Home() {
  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h1>Home</h1>
      <p>Welcome to Lumen.</p>
    </div>
  );
}

function Browse() {
  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h1>Browse</h1>
      <p>Browse articles here.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/browse" element={<Browse />} />

        <Route path="/write" element={<ArticleEditor />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/my-articles" element={<MyArticles />} />

        <Route
          path="/articles/:id"
          element={<ArticleView />}
        />

        <Route
          path="/articles/:id/quiz"
          element={<Quiz />}
        />

        {/* Quiz Management - Manya */}
        <Route
          path="/quiz-management"
          element={<QuizManagement />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;