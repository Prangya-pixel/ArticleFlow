import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { chatService } from '../services/chatService'
import SignOutButton from '../components/common/SignOutButton'

export default function Chat() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUser = JSON.parse(localStorage.getItem('articleflow_user'))

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await chatService.getUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function selectUser(user) {
    try {
      setSelectedUser(user)
      setError('')
      const data = await chatService.getConversation(user._id)
      setMessages(data.messages)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSend(event) {
    event.preventDefault()

    if (!text.trim() || !selectedUser) return

    try {
      const message = await chatService.sendMessage(selectedUser._id, text)
      setMessages((current) => [...current, message])
      setText('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <NavLink className="brand" to={`/${currentUser.role}/home`}>
          <span className="brand-mark">A</span>
          ArticleFlow
        </NavLink>

        <nav className="nav-links" aria-label={`${currentUser.role} navigation`}>
          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to={`/${currentUser.role}/home`}
          >
            Home
          </NavLink>

          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to={`/${currentUser.role}/browse`}
          >
            Browse
          </NavLink>

          {currentUser.role === 'author' && (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to="/author/create"
            >
              Create
            </NavLink>
          )}

          {currentUser.role === 'admin' && (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to="/admin/dashboard"
            >
              Admin
            </NavLink>
          )}

          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to={`/${currentUser.role}/profile`}
          >
            Profile
          </NavLink>

          <NavLink
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            to="/chat"
          >
            Chat
          </NavLink>
        </nav>

        <div className="user-actions">
          <span className="role-pill">{currentUser.role}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="page-content">
        <div className="chat-page">
          <div className="chat-header">
            <div>
              <span className="eyebrow">PRIVATE MESSAGES</span>
              <h1>Personal Chat</h1>
              <p>Connect privately with other ArticleFlow users.</p>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="chat-container">
            <aside className="chat-users">
              <h2>Users</h2>

              {loading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p>No other users available.</p>
              ) : (
                users.map((user) => (
                  <button
                    key={user._id}
                    className={selectedUser?._id === user._id ? 'chat-user active' : 'chat-user'}
                    onClick={() => selectUser(user)}
                  >
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <small>{user.role}</small>
                  </button>
                ))
              )}
            </aside>

            <section className="chat-window">
              {!selectedUser ? (
                <div className="chat-empty">
                  <h2>Select a user</h2>
                  <p>Choose someone from the list to start a private conversation.</p>
                </div>
              ) : (
                <>
                  <div className="chat-user-header">
                    <strong>{selectedUser.name}</strong>
                    <span>{selectedUser.email}</span>
                  </div>

                  <div className="messages">
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <p>No messages yet. Start the conversation.</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMine =
                          message.sender._id === currentUser.id ||
                          message.sender._id === currentUser._id

                        return (
                          <div
                            key={message._id}
                            className={isMine ? 'message mine' : 'message'}
                          >
                            <span>{message.text}</span>
                            <small>
                              {new Date(message.createdAt).toLocaleString()}
                            </small>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <form className="message-form" onSubmit={handleSend}>
                    <input
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Type a message..."
                      maxLength={2000}
                    />
                    <button type="submit">Send</button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}