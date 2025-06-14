## 📄 Project Requirement Document (PRD)

### **Project Title:** SpilledIn – Anonymous Confession Platform

---

### 1. **Overview**

**SpilledIn** is an anonymous, company-specific confession platform where users can share confessions, interact via votes, and rise through toxicity tiers based on engagement. A public monthly **“Toxic Wrapped”** recap celebrates the most viral posts and users.

---

### 2. **Objectives**

* Encourage anonymous expression within a safe, structured environment.
* Measure user impact and influence through an innovative "toxicity" system.
* Segment users by company for contextual relevance.
* Provide transparency and entertainment via the monthly "Toxic Wrapped" feature.

---

### 3. **Core Features**

#### 3.1 User Registration & Access

* Registration via **reusable, company-specific invite link**.
* On registration, users are assigned a **random, anonymous username**.
* Users **must be logged in** (via Supabase Auth) to access the platform.
* Each user is linked internally to a company for segmentation.

---

#### 3.2 Confession Posting

* Authenticated users can submit:

  * **Text-based confessions (max 1000 characters)**
  * **Optional image upload** (stored in Supabase Storage)
* Posts include:

  * Timestamp (datetime uploaded)
  * Assigned anonymous username
  * Upvote and downvote counters
* Posts are **immutable**:

  * Users can **delete** their posts
  * Users **cannot edit** them

---

#### 3.3 Browsing & Searching

* Confessions feed:

  * **Sort by Most Popular** (based on net vote score)
  * **Sort by Latest** (descending by date)
* **Search bar**:

  * Search by keywords in confession content
  * Search by anonymous usernames

---

#### 3.4 Toxicity System

* **Toxicity Score = Total Upvotes - Total Downvotes** across all of a user's posts.
* Users are assigned one of **10 toxicity tiers**, e.g.:

  * Tier 1: Whisperer
  * Tier 5: Neutral
  * Tier 10: Drama Deity 👑
* Visual indicators:

  * Colored borders, labels, or emblems for each tier
  * Tiers are publicly displayed on confessions and user profiles

---

#### 3.5 User Profiles

Each profile includes:

* Random anonymous username
* Current toxicity score and tier
* Total upvotes and downvotes
* Any **awards** received (e.g., “Most Viral Post – May”)
* List of all confessions posted by the user (chronological or by popularity)

---

#### 3.6 Toxic Wrapped (Monthly Recap)

* A **public-facing** recap page updated monthly.
* Highlights:

  * Most toxic users of the month
  * Most upvoted (toxic) posts
  * Tier rankings, user streaks, and community stats
* Designed like Spotify Wrapped or Reddit Recaps for fun and engagement.

---

#### 3.7 Company Segmentation

* Users are grouped by company, based on their registration link.
* Each confession is internally linked to the user’s company (not visible to others).
* Used for future filtering, analytics, or admin segmentation.

---

#### 3.8 Admin Controls

* Admin portal includes:

  * View/delete any confession
  * View users grouped by company
  * Analytics dashboard (user growth, voting trends, etc.)
  * Manage “Toxic Wrapped” highlights (optional curation override)

---

### 4. **Non-Functional Requirements**

* **Fast** page loads and search
* **Anonymous** by design (no real identity shown)
* **Scalable** to support many companies and thousands of users
* **Secure** storage of confessions and image uploads using Supabase

---

### 5. **Technology Stack**

| Component     | Tech Stack          |
| ------------- | ------------------- |
| Frontend      | React / Next.js     |
| Backend/API   | Supabase Functions  |
| Auth          | Supabase Auth       |
| Database      | Supabase PostgreSQL |
| File Storage  | Supabase Storage    |
| Image Hosting | Supabase Storage    |
| Search & Sort | Supabase SQL / RPC  |

---

### 6. **Stretch Features (Optional)**

* Post **categories or tags** (e.g. #WorkDrama, #CrushConfession)
* Comment section for confessions (anonymous as well)
* Gamified badges for confession streaks or milestones
* Toggle between global feed and company-only feed
* Optional dark mode and UI personalization

---

Would you like me to now:

* Draw database schema for Supabase (tables, columns, foreign keys)?
* Sketch mockups for pages like Home, Profile, and Toxic Wrapped?
* Draft user stories or sprint breakdown for MVP development?

Let’s move forward when you're ready.