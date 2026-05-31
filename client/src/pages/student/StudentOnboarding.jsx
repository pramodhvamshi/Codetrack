// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../auth/AuthContext';
// import { api } from '../../api/client';

// export function StudentOnboarding() {
//   const { token } = useAuth();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     college: '',
//     hostel: '',
//     branch: '',
//     year: '',
//     overallGpa: '',
//     leetcodeUsername: '',
//     codechefUsername: ''
//   });

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);

//   /* ---------- LOAD USER ---------- */
//   useEffect(() => {
//     const load = async () => {
//       if (!token) return;
//       try {
//         const me = await api.getJson('/student/me', token);

//         // Already onboarded → go to dashboard
//         if (me.isOnboarded) {
//           navigate('/student/dashboard', { replace: true });
//           return;
//         }

//         setForm({
//           college: me.college || '',
//           hostel: me.hostel || '',
//           branch: me.branch || '',
//           year: me.year || '',
//           overallGpa: me.overallGpa != null ? String(me.overallGpa) : '',
//           leetcodeUsername: me.leetcodeUsername || '',
//           codechefUsername: me.codechefUsername || ''
//         });
//       } catch (err) {
//         setError('Failed to load profile');
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//   }, [token, navigate]);

//   const handleChange = (field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   };

//   /* ---------- SUBMIT ---------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSaving(true);

//     try {
//       // 1️⃣ Save profile
//       await api.putJson(
//         '/student/me/profile',
//         {
//           ...form,
//           overallGpa: Number(form.overallGpa)
//         },
//         token
//       );

//       // 2️⃣ Re-fetch to verify onboarding status
//       const updatedMe = await api.getJson('/student/me', token);

//       // 3️⃣ Navigate ONLY if onboarded
//       if (updatedMe.isOnboarded) {
//         navigate('/student/dashboard', { replace: true });
//       } else {
//         setError(
//           'Profile saved, but onboarding is incomplete. Please fill all required fields.'
//         );
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to save profile');
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* ---------- UI ---------- */
//   return (
//     <div className="ct-layout">
//       <header className="ct-header">
//         <div className="ct-header-title">CodeTrack · Complete your profile</div>
//       </header>

//       <main className="ct-main">
//         <div className="ct-card" style={{ maxWidth: 640, margin: '3rem auto' }}>
//           <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
//             Mandatory onboarding
//           </h2>

//           <p
//             style={{
//               fontSize: '0.9rem',
//               color: '#9ca3af',
//               marginBottom: '1.5rem'
//             }}
//           >
//             Please provide your academic details and platform usernames.
//             This unlocks your dashboard and leaderboard participation.
//           </p>

//           {loading ? (
//             <div>Loading…</div>
//           ) : (
//             <form onSubmit={handleSubmit}>
//               <div className="ct-grid-2" style={{ marginBottom: '1rem' }}>
//                 <div>
//                   <label className="ct-label">College *</label>
//                   <input
//                     className="ct-input"
//                     value={form.college}
//                     onChange={(e) =>
//                       handleChange('college', e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="ct-label">Hostel *</label>
//                   <input
//                     className="ct-input"
//                     value={form.hostel}
//                     onChange={(e) =>
//                       handleChange('hostel', e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="ct-grid-2" style={{ marginBottom: '1rem' }}>
//                 <div>
//                   <label className="ct-label">Branch *</label>
//                   <input
//                     className="ct-input"
//                     value={form.branch}
//                     onChange={(e) =>
//                       handleChange('branch', e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="ct-label">Year *</label>
//                   <input
//                     className="ct-input"
//                     value={form.year}
//                     onChange={(e) =>
//                       handleChange('year', e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//               </div>

//               <div style={{ marginBottom: '1rem' }}>
//                 <label className="ct-label">Overall GPA *</label>
//                 <input
//                   className="ct-input"
//                   type="number"
//                   step="0.01"
//                   value={form.overallGpa}
//                   onChange={(e) =>
//                     handleChange('overallGpa', e.target.value)
//                   }
//                   required
//                 />
//               </div>

//               <div className="ct-grid-2" style={{ marginBottom: '1.2rem' }}>
//                 <div>
//                   <label className="ct-label">LeetCode username *</label>
//                   <input
//                     className="ct-input"
//                     value={form.leetcodeUsername}
//                     onChange={(e) =>
//                       handleChange('leetcodeUsername', e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="ct-label">CodeChef username *</label>
//                   <input
//                     className="ct-input"
//                     value={form.codechefUsername}
//                     onChange={(e) =>
//                       handleChange('codechefUsername', e.target.value)
//                     }
//                     required
//                   />
//                 </div>
//               </div>

//               {error && (
//                 <div
//                   style={{
//                     color: '#f97373',
//                     fontSize: '0.8rem',
//                     marginBottom: '0.9rem'
//                   }}
//                 >
//                   {error}
//                 </div>
//               )}

//               <button
//                 className="ct-button"
//                 type="submit"
//                 disabled={saving}
//                 style={{ width: '100%' }}
//               >
//                 {saving ? 'Saving…' : 'Save and continue to dashboard'}
//               </button>
//             </form>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
