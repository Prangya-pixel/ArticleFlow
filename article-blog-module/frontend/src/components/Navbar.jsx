import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUsers } from "../services/articleAPI";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // --------------------------------------------------
  // Load users from MongoDB
  // --------------------------------------------------
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);

        const data = await getUsers();

        setUsers(data);

        // Previously selected user
        const savedUser =
          localStorage.getItem("currentUser");

        let selectedUser = null;

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);

            selectedUser = data.find(
              (user) =>
                user._id === parsedUser._id ||
                user.email === parsedUser.email
            );
          } catch (error) {
            console.error(
              "Invalid saved user:",
              error
            );
          }
        }

        // Default to Priya
        if (!selectedUser) {
          selectedUser =
            data.find(
              (user) =>
                user.email ===
                "priya@example.com"
            ) ||
            data.find(
              (user) =>
                user.role === "author"
            ) ||
            data[0];
        }

        if (selectedUser) {
          setCurrentUser(selectedUser);

          localStorage.setItem(
            "currentUser",
            JSON.stringify(selectedUser)
          );
        }
      } catch (error) {
        console.error(
          "Failed to load users:",
          error
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // --------------------------------------------------
  // Listen for changes from other components
  // --------------------------------------------------
  useEffect(() => {
    const handleUserChanged = () => {
      const savedUser =
        localStorage.getItem("currentUser");

      if (!savedUser) {
        return;
      }

      try {
        setCurrentUser(
          JSON.parse(savedUser)
        );
      } catch (error) {
        console.error(
          "Failed to update current user:",
          error
        );
      }
    };

    window.addEventListener(
      "userChanged",
      handleUserChanged
    );

    return () => {
      window.removeEventListener(
        "userChanged",
        handleUserChanged
      );
    };
  }, []);

  // --------------------------------------------------
  // Change selected user
  // --------------------------------------------------
  const handleUserChange = (event) => {
    const selectedUser = users.find(
      (user) =>
        user._id === event.target.value
    );

    if (!selectedUser) {
      return;
    }

    setCurrentUser(selectedUser);

    localStorage.setItem(
      "currentUser",
      JSON.stringify(selectedUser)
    );

    window.dispatchEvent(
      new Event("userChanged")
    );
  };

  // --------------------------------------------------
  // Avatar initials
  // --------------------------------------------------
  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (
    loadingUsers ||
    !currentUser
  ) {
    return (
      <nav className="top-nav">

        <div className="brand">
          <div className="brand-icon">
            ▣
          </div>

          <span>Lumen</span>
        </div>

      </nav>
    );
  }

  return (
    <nav className="top-nav">

      {/* Logo */}
      <div className="brand">

        <div className="brand-icon">
          ▣
        </div>

        <span>Lumen</span>

      </div>

      {/* Navigation */}
      <div className="nav-links">

        <Link
          to="/"
          className={
            location.pathname === "/"
              ? "active-nav"
              : ""
          }
        >
          <span className="nav-icon">
            ⌂
          </span>

          Home
        </Link>

        <Link
          to="/browse"
          className={
            location.pathname === "/browse"
              ? "active-nav"
              : ""
          }
        >
          <span className="nav-icon">
            ⌕
          </span>

          Browse
        </Link>

        {/* Write only for authors */}
        {currentUser.role === "author" && (
          <Link
            to="/write"
            className={
              location.pathname === "/write"
                ? "active-nav"
                : ""
            }
          >
            <span className="nav-icon">
              ✎
            </span>

            Write
          </Link>
        )}

        <Link
          to="/profile"
          className={
            location.pathname === "/profile"
              ? "active-nav"
              : ""
          }
        >
          <span className="nav-icon">
            ♙
          </span>

          Profile
        </Link>

      </div>

      {/* Right side */}
      <div className="nav-right">

        {/* User / Role Switcher */}
        <select
          value={currentUser._id}
          onChange={handleUserChange}
          aria-label="Select demo user"
        >
          {users.map((user) => (
            <option
              key={user._id}
              value={user._id}
            >
              {user.name} ({user.role})
            </option>
          ))}
        </select>

        {/* Notification */}
        <button
          className="notification-button"
          title="Notifications"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="avatar">
          {getInitials(
            currentUser.name
          )}
        </div>

      </div>

    </nav>
  );
}

export default Navbar;