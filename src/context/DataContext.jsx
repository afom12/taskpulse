import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

/**
 * One place that keeps live (real-time) copies of tasks, users and
 * notifications. Every page reads from here, so we open each Firestore
 * listener only once instead of once per page.
 */
export function DataProvider({ children }) {
  const { profile, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Admins see every task; users only their own. (Rules enforce the same.)
    const q = isAdmin
      ? collection(db, "tasks")
      : query(collection(db, "tasks"), where("assigneeId", "==", profile.id));
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setReady(true);
    }, (err) => { console.error(err); setReady(true); });
  }, [profile?.id, isAdmin]);

  useEffect(() => {
    if (!profile) return;
    return onSnapshot(collection(db, "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, "notifications"), where("userId", "==", profile.id));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // sort client-side → no composite index needed
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now()));
      setNotifications(list);
    });
  }, [profile?.id]);

  const value = useMemo(() => {
    const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
    return {
      tasks, users, usersById, notifications, ready,
      admins: users.filter((u) => u.role === "admin"),
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  }, [tasks, users, notifications, ready]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
