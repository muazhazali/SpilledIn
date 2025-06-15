# SpilledIn

**SpilledIn** is an anonymous, company-specific confession platform where users can share confessions, interact via votes, and rise through toxicity tiers based on engagement. Features a public monthly **"Toxic Wrapped"** recap celebrating the most viral posts and users.

## 🎯 Overview

SpilledIn provides a safe, structured environment for anonymous expression within company communities. Users are ranked through an innovative "toxicity" system based on engagement, with transparency and entertainment via monthly community recaps.

## ✨ Key Features

- **🎭 Anonymous Confessions** - Share thoughts anonymously with optional image uploads
- **🗳️ Voting System** - Upvote/downvote to influence community toxicity scores  
- **🏆 Toxicity Tiers** - 10-tier ranking system from "Whisperer" to "Drama Deity"
- **🏢 Company Segmentation** - Join via company-specific invite codes
- **🔍 Search & Discovery** - Find confessions by content or username
- **📊 Monthly Toxic Wrapped** - Public monthly recaps of top users and posts
- **⚡ Real-time Updates** - Live voting and confession updates

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS, shadcn/ui components
- **State**: React Context + Custom Hooks
- **Package Manager**: pnpm

### Backend & Services
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with middleware protection
- **Storage**: Supabase Storage for image uploads
- **Real-time**: Supabase real-time subscriptions
- **Functions**: Supabase Edge Functions

### Key Dependencies
- **UI Components**: Radix UI primitives, Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with animations
- **Charts**: Recharts for analytics
- **Notifications**: Sonner for toast messages

## 🚀 Quick Start

### Demo Mode (No Setup Required)
Try the app instantly with demo credentials:
- **Email**: `demo@spilledin.com`
- **Password**: `demo123`
- **Invite Codes**: `TECH2024`, `STARTUP123`, `DEMO2024`

### Local Development

1. **Prerequisites**
   ```bash
   # Ensure you have Node.js 18+ and pnpm installed
   node --version  # Should be 18+
   pnpm --version
   ```

2. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/SpilledIn.git
   cd SpilledIn/frontend
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Database Setup**
   - Create a Supabase project
   - Run the SQL scripts in `/frontend/scripts/`
   - Configure storage bucket for images

5. **Start Development**
   ```bash
   pnpm dev
   # Open http://localhost:3000
   ```

## 📁 Project Structure

```
SpilledIn/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & Supabase client
│   ├── scripts/            # Database setup scripts
│   └── middleware.ts       # Auth route protection
├── backend/                 # Backend services (minimal)
└── scripts/                # Deployment scripts
```

## 🔐 Authentication & Security

- **Anonymous by Design**: No real identities exposed
- **Company Segmentation**: Users grouped by invite codes
- **Route Protection**: Middleware-based auth guards
- **Secure Storage**: Supabase RLS policies
- **Input Validation**: Zod schemas for all forms

## 🎮 User Experience

### Toxicity System
Users earn toxicity scores based on community engagement:
- **Score**: Total Upvotes - Total Downvotes
- **Tiers**: 10 levels with visual indicators
- **Recognition**: Monthly awards and highlights

### Content Management
- **Immutable Posts**: Users can delete but not edit
- **Image Support**: Optional image uploads with validation
- **Search**: Full-text search across confessions
- **Sorting**: By popularity or recency

## 🚀 Deployment

### Docker Deployment
```bash
cd frontend
docker build -t spilledin-frontend .
docker run --env-file .env.production -p 3000:3000 spilledin-frontend
```

### VPS Deployment
- Full Docker + Nginx + SSL setup
- Automated deployment scripts
- Production environment configuration
- See `frontend/DEPLOYMENT.md` for detailed instructions

## 📊 Analytics & Monitoring

- **User Engagement**: Voting patterns and activity
- **Content Performance**: Top confessions and trends  
- **Company Insights**: Segmented analytics
- **Monthly Reports**: Automated Toxic Wrapped generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Frontend Documentation**: `/frontend/README.md`
- **Deployment Guide**: `/frontend/DEPLOYMENT.md`
- **Project Requirements**: `/frontend/PRD.md`

---

**Built with ❤️ for anonymous expression and community engagement**