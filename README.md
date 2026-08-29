# ArticleFlow

ArticleFlow is a content publishing and interactive quiz platform where authors can create and publish articles with quizzes, while administrators verify and manage submitted content before publication.

## Features

### User Management
- User registration and login
- Authentication and authorization
- User profiles
- Role-based access

### Article/Blog Management
- Create articles
- Edit and delete articles
- Submit articles for verification
- Publish approved articles

### Quiz Management
- Add quizzes to articles
- Create questions and multiple-choice options
- Define correct answers
- Allow readers to attempt quizzes

### Admin Verification
- Review submitted articles and quizzes
- Approve content
- Reject content
- Request changes from authors

### Content Management
- Manage approved articles
- Manage quizzes
- Categories and tags
- Publication status management

### Search & Browse
- Browse published articles
- Search articles
- Filter by categories and tags
- Access associated quizzes

### Quiz Attempts & Results
- Attempt quizzes
- Calculate scores
- Display quiz results

### Notifications
- Notify authors about approval/rejection
- Notify authors when changes are requested
- Provide important content updates

## User Roles

| Role | Responsibilities |
|------|------------------|
| Reader | Browse articles and attempt quizzes |
| Author | Create and manage articles and quizzes |
| Admin | Verify, approve, reject, and manage content |

## Application Workflow

1. Author creates an article.
2. Author adds an optional quiz.
3. Article and quiz are submitted for verification.
4. Admin reviews the submitted content.
5. Admin approves, rejects, or requests changes.
6. Approved content becomes available to readers.
7. Readers can browse articles and attempt quizzes.
8. Quiz results are displayed after submission.
9. Authors receive notifications about content status.

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas

### Authentication
- JWT

## Project Structure


ArticleFlow/
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── src/
│   └── package.json
│
└── README.md

## Getting started

1. Copy `.env.example` to `.env` and add your MongoDB Atlas connection string and a long JWT secret.
2. Run `npm run dev` from `backend/` to start the API.
3. Run `npm run dev` from `frontend/` to start the web app.

The frontend sends authentication requests to `/api/auth`. Vite proxies these
requests to `http://localhost:5000` during local development. For a deployed
frontend and backend on different domains, set `VITE_API_URL` in `frontend/.env`.

### Authentication API

- `POST /api/auth/register` — register a reader or author
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — retrieve the authenticated user with a Bearer token
