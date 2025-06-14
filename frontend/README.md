# SpilledIn Frontend - Supabase Integration

This is the frontend application for SpilledIn, an anonymous confession platform built with Next.js 15 and integrated with Supabase for backend services.

## 🚀 Features

- **Anonymous Confessions**: Users can post confessions anonymously with optional image uploads
- **Voting System**: Upvote/downvote confessions to influence toxicity scores
- **Toxicity Tiers**: Users are ranked in 10 different toxicity tiers based on their engagement
- **Company Segmentation**: Users join via company-specific invite codes
- **Search & Filtering**: Search confessions by content or username
- **Monthly Toxic Wrapped**: Public monthly recaps of top users and confessions
- **Real-time Updates**: Live updates for votes and new confessions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Functions)
- **State Management**: React Context + Custom Hooks
- **Authentication**: Supabase Auth with middleware protection

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **Supabase Project** with the database schema set up (see `/scripts/README.md`)

## 🔧 Environment Setup

1. **Create Environment File**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Supabase Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   Get these values from your Supabase project dashboard:
   - Go to Settings → API
   - Copy the Project URL and anon/public key
   - Copy the service_role key (keep this secret!)

## 📦 Installation

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Development Server**:
   ```bash
   pnpm dev
   ```

3. **Open Application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

Before using the application, you need to set up the Supabase database:

1. **Run Database Setup Script**:
   - Copy the contents of `/scripts/supabase-setup.sql`
   - Paste and run in your Supabase SQL Editor

2. **Load Sample Data** (Optional):
   - Copy the contents of `/scripts/seed-data.sql`
   - Run in Supabase SQL Editor for testing data

3. **Verify Setup**:
   - Check that all tables are created in the Table Editor
   - Verify the `confession-images` storage bucket exists
   - Test with sample invite code: `TECH2024`

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx       # Authentication context & hooks
│   └── useConfessions.ts # Confession management hooks
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client & utility functions
│   ├── auth.ts           # Authentication helpers
│   └── utils.ts          # General utilities
├── scripts/              # Database setup scripts
│   ├── supabase-setup.sql
│   ├── seed-data.sql
│   └── README.md
└── middleware.ts         # Next.js middleware for auth routing
```

## 🔐 Authentication Flow

The application uses Supabase Auth with the following flow:

1. **Registration**:
   - User provides email, password, and company invite code
   - System validates invite code against `companies` table
   - Creates auth user and user profile with anonymous username

2. **Login**:
   - Standard email/password authentication
   - Automatic profile fetching and context updates

3. **Route Protection**:
   - Middleware protects authenticated routes
   - Automatic redirects based on auth state

## 🎣 Custom Hooks

### `useAuth()`
Provides authentication state and methods:
```typescript
const { user, profile, loading, signIn, signUp, signOut } = useAuth()
```

### `useConfessions(sortBy, limit)`
Manages confession data and operations:
```typescript
const { 
  confessions, 
  loading, 
  addConfession, 
  vote, 
  removeConfession,
  loadMore 
} = useConfessions('popular', 20)
```

### `useConfessionSearch()`
Handles confession search functionality:
```typescript
const { results, loading, search, clear } = useConfessionSearch()
```

## 🔧 Supabase Integration

### Database Functions Used:
- `generate_anonymous_username()` - Creates unique usernames
- `search_confessions()` - Advanced search with filters
- `get_monthly_stats()` - Monthly Toxic Wrapped data
- `update_user_toxicity_score()` - Recalculates user scores

### Real-time Features:
- Vote updates trigger automatic score recalculation
- New confessions appear in real-time feeds
- User toxicity scores update automatically

### Storage Integration:
- Image uploads to `confession-images` bucket
- Automatic public URL generation
- File type validation and size limits

## 🎨 UI Components

Built with shadcn/ui components:
- **Forms**: Login, signup, confession creation
- **Cards**: Confession display with voting
- **Dialogs**: Modals for actions and confirmations
- **Navigation**: Protected route navigation
- **Toasts**: Success/error notifications

## 🧪 Testing

### Sample Data:
Use the seed script to create test data:
- 15 sample users across 5 companies
- 15 sample confessions with various vote scores
- Sample awards for Toxic Wrapped testing

### Test Accounts:
After running seed data, you can test with:
- Invite Code: `TECH2024`
- Create new accounts or use existing sample data

## 🚀 Deployment

### Vercel Deployment:
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production:
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
```

## 🔍 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**:
   - Ensure `.env.local` is in the root directory
   - Restart development server after changes
   - Check variable names match exactly

2. **Supabase Connection Errors**:
   - Verify project URL and keys are correct
   - Check if database schema is properly set up
   - Ensure RLS policies are configured

3. **Authentication Issues**:
   - Clear browser cookies and localStorage
   - Check if user profile was created properly
   - Verify company invite codes exist

4. **Image Upload Failures**:
   - Check storage bucket permissions
   - Verify file size and type restrictions
   - Ensure storage policies allow uploads

### Debug Mode:
Enable debug logging by adding to `.env.local`:
```env
NODE_ENV=development
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Confessing! 🤫** 