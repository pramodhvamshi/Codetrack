// import { useEffect, useState } from 'react';
// import { useAuth } from '../../auth/AuthContext';
// import { api } from '../../api/client';
// import { AppShell } from '../../components/AppShell';
// import styles from '../../styles/Dashboard.module.css';

// export function CoordinatorDashboard() {
//   const { token } = useAuth();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       if (!token) return;
//       try {
//         const res = await api.getJson('/coordinator/dashboard', token);
//         setData(res);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [token]);

//   if (loading || !data) {
//     return (
//       <AppShell active="coord-dashboard">
//         <div className="ct-card">Loading dashboard…</div>
//       </AppShell>
//     );
//   }

//   const ps = data.platformStats || {};

//   return (
//     <AppShell active="coord-dashboard">
//       <div>
//         <h1 className={styles.title}>Dashboard</h1>
//         <p className={styles.subtitle}>Coding performance overview</p>

//         <section className={styles.platformSection}>
//           <h2 className={styles.sectionTitle}>Platform-wise performance</h2>
//           <div className={styles.platformCards}>
//             <div
//               className={styles.platformCard}
//               style={{ '--accent': 'var(--accent-orange)' }}
//             >
//               <div className={styles.platformIcon}>LC</div>
//               <h3>LeetCode</h3>
//               <p className={styles.platformStat}>
//                 {ps.leetcode?.totalProblems || 0} problems solved
//               </p>
//               <p className={styles.platformStat}>
//                 Avg rating: {ps.leetcode?.avgRating || 0}
//               </p>
//             </div>
//             <div
//               className={styles.platformCard}
//               style={{ '--accent': 'var(--accent-red)' }}
//             >
//               <div className={styles.platformIcon}>CC</div>
//               <h3>CodeChef</h3>
//               <p className={styles.platformStat}>
//                 {ps.codechef?.totalProblems || 0} problems solved
//               </p>
//               <p className={styles.platformStat}>
//                 Avg rating: {ps.codechef?.avgRating || 0}
//               </p>
//             </div>
//             <div
//               className={styles.platformCard}
//               style={{ '--accent': 'var(--accent-green)' }}
//             >
//               <div className={styles.platformIcon}>HR</div>
//               <h3>HackerRank</h3>
//               <p className={styles.platformStat}>
//                 {ps.hackerrank?.totalBadges || 0} badges earned
//               </p>
//             </div>
//           </div>
//         </section>
//       </div>
//     </AppShell>
//   );
// }
