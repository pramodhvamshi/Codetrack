# MEDHA CODE TRACK

### v1.0 Beta

**Track Coding Progress. Measure Growth. Enable Success.**

MEDHA CODE TRACK is a centralized coding analytics and student performance platform built exclusively for **Medha Charitable Trust**.

The platform enables students to track their coding journey across multiple competitive programming platforms while providing curriculum coordinators with powerful analytics, performance insights, placement-readiness indicators, and engagement tracking.

---

# Overview

MEDHA CODE TRACK helps students stay consistent in their coding journey while giving coordinators real-time visibility into coding performance, learning consistency, and placement preparedness.

The system automatically synchronizes coding statistics from multiple platforms and transforms them into meaningful analytics, rankings, activity reports, and professional coding portfolios.

---

# Key Objectives

### For Students

* Track coding progress across platforms in one place
* Visualize daily coding activity through heatmaps
* Monitor coding streaks and consistency
* View monthly and all-time leaderboard rankings
* Generate professional ATS-friendly resumes
* Maintain a verified coding portfolio
* Showcase achievements, certifications, projects, and hackathons

### For Coordinators

* Monitor student engagement and coding activity
* Identify active and inactive students
* Track placement readiness
* View branch-wise and year-wise analytics
* Export filtered student reports
* Analyze cohort performance trends
* Access detailed student coding profiles

---

# Platform Integrations

MEDHA CODE TRACK automatically synchronizes data from:

### LeetCode

* Problems Solved
* Contest Ratings
* Contest Participation
* Submission Activity
* Daily Coding Activity

### GeeksForGeeks

* Problems Solved
* Coding Activity
* Practice Statistics

### CodeChef

* Problems Solved
* Contest Participation
* Ratings
* Ranking Statistics

### GitHub

* Repository Count
* Followers
* Following
* Stars
* Contributions
* Active Contribution Days

---

# Major Features

## Coding Heatmap

GitHub-style coding heatmap displaying coding activity over the last 12 months.

Features:

* Daily activity visualization
* Activity drill-down
* LeetCode solved problem history
* Contribution tracking
* Consistency monitoring

---

## Live Leaderboards

### Global Leaderboard

Ranks students based on overall coding performance.

Supports filters:

* College
* Branch
* Hostel
* Year

### Monthly Leaderboard

Ranks students based on:

```txt
Monthly Score =
LeetCode Solved This Month +
GeeksForGeeks Solved This Month
```

Displays:

* Rank
* Student Name
* Branch
* LeetCode Solved
* GFG Solved
* Monthly Score

---

## Coding Score Engine

A unified performance score combining:

* Problems solved
* Platform ratings
* Contest participation
* Coding consistency
* Activity engagement

Used for:

* Leaderboards
* Placement readiness
* Coordinator analytics

---

## Student Dashboard

Students can:

* View coding statistics
* Track coding streaks
* Analyze activity history
* Monitor coding score
* View coding heatmaps
* Track platform performance
* Compare monthly growth

---

## Coordinator Dashboard

Coordinators can:

### Monitor

* Total Students
* Active Students
* Inactive Students
* Placement Ready Students
* Needs Improvement Students
* At-Risk Students

### Analytics

* Branch-wise performance
* Year-wise performance
* Coding score averages
* Platform-wise solved counts
* Monthly performance trends

### Reports

Export:

* CSV Reports
* Excel Reports (.xlsx)

With support for:

* Search
* Branch Filters
* Year Filters

---

## Public Student Profiles

Each student receives a shareable coding profile including:

* Academic Information
* Coding Statistics
* Platform Profiles
* GitHub Analytics
* Coding Heatmap
* Achievements
* Certifications
* Projects
* Coding Resume

---

## Resume Builder

Generate professional ATS-friendly resumes directly from coding profile data.

Supported Templates:

### Single Column Resume

* ATS Optimized
* Placement Ready
* Corporate Style

### Double Column Resume

* Professional Portfolio Style
* Modern Layout
* Recruiter Friendly

Features:

* Live Preview
* PDF Export
* One-click Template Switching

---

## Activity Tracking

Automatically records:

### LeetCode

* Solved Problems
* Submission Activity

### GeeksForGeeks

* Solved Problems
* Practice Activity

### CodeChef

* Solved Problem Increases
* Contest Participation

Used for:

* Heatmaps
* Monthly Rankings
* Activity Timelines
* Streak Calculations

---

## Placement Readiness Analytics

Students are automatically classified into:

### Placement Ready

Students meeting coding score thresholds.

### Needs Improvement

Students requiring additional practice.

### At Risk

Students with low engagement or inactivity.

---

# Role-Based Access Control

## Student

Can:

* Register
* Login
* Edit Profile
* Sync Platforms
* Generate Resume
* View Leaderboards
* View Public Profiles

Cannot:

* Access Coordinator Features
* Access Admin Features

---

## Coordinator

Created only by Admin.

Can:

* Access Coordinator Dashboard
* View Student Analytics
* Export Reports
* View Student Profiles
* View Default Student Resumes

Cannot:

* Create Coordinators
* Access Admin Controls

---

## Admin

Full platform control.

Can:

* Create Coordinators
* Manage Students
* Disable Accounts
* View Bug Reports
* Access All Dashboards
* Impersonate Users
* Audit Platform Activity

---

# Bug Reporting System

Users can submit bug reports directly from the platform.

Includes:

* Title
* Description
* Category
* Severity
* Screenshot Upload

Admins can:

* View Reports
* Track Status
* Mark Resolved
* Manage Issues

---

# Technology Stack

## Frontend

* React.js
* React Router
* Context API
* CSS Modules
* XLSX Export

## Backend

* Node.js
* Express.js
* JWT Authentication
* Multer
* REST APIs

## Database

* MongoDB
* Mongoose

## External Integrations

* LeetCode
* GeeksForGeeks
* CodeChef
* GitHub

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd medha-code-track
```

---

## Backend Setup

```bash
cd server
npm install
```

Create `.env`

```env
PORT=5000

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_secret

JWT_REFRESH_SECRET=your_refresh_secret

CLIENT_URL=http://localhost:5173
```

Run backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd client
npm install
```

Run frontend:

```bash
npm run dev
```

---

# Default Admin Account

```txt
Email:


Role:
Admin
```

Admin credentials are seeded automatically during application startup.

---

# Future Roadmap

### Smart Alerts

Receive alerts when students become inactive.

### AI Insights

Personalized recommendations for:

* Problem Selection
* Topic Improvement
* Coding Consistency

### Advanced Placement Analytics

Predictive placement readiness models.

### Smart Student Reports

Automated monthly coding performance reports.

---

# Developed For

**Medha Charitable Trust**

Empowering students through data-driven learning, coding excellence, and placement readiness.

---

© 2025 MEDHA CODE TRACK · Built for Medha Charitable Trust · v1.0 Beta
---

# Author

## Developed & Managed By

### Pramodh Vamshi Balla

Founder & Lead Developer of MEDHA CODE TRACK

Responsibilities:

- Full Stack Development
- System Architecture Design
- Database Design & Management
- Analytics Engine Development
- Leaderboard & Scoring System
- Resume Builder Development
- Student Performance Tracking
- Coordinator Analytics Dashboard
- Platform Integrations (LeetCode, GeeksForGeeks, CodeChef, GitHub)
- Deployment & Maintenance

### Contact

- Email: pramodhvamshi@gmail.com
- GitHub: https://github.com/pramodhvamshi
- LinkedIn: https://linkedin.com/in/pramodh-vamshi-balla

> MEDHA CODE TRACK was conceptualized, designed, developed, and is actively maintained by Pramodh Vamshi Balla to support Medha Charitable Trust students in tracking coding progress, improving consistency, and enhancing placement readiness through data-driven analytics.

---