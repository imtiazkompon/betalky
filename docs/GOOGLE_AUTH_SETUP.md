# Google sign-in setup (Supabase)

The app code is already wired: the **Continue with Google** button calls
`supabase.auth.signInWithOAuth({ provider: 'google' })`, and Google sends the user back through
`/api/auth/callback`, which creates the session and redirects to the dashboard (or the page they
originally asked for).

What remains is configuration in two dashboards. Replace `<PROJECT_REF>` with your Supabase
project ref (the subdomain of `NEXT_PUBLIC_SUPABASE_URL`).

---

## 1. Google Cloud Console — create the OAuth client

1. Open <https://console.cloud.google.com/> and create (or pick) a project, e.g. **beTalky**.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding / Audience):
   - User type: **External**
   - App name: `beTalky`, support email, developer contact email
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (the defaults)
   - Audience: while in **Testing**, add your own Google address under *Test users*.
     Click **Publish app** when you're ready for anyone to sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `beTalky web`
   - **Authorized JavaScript origins**
     - `http://localhost:3000`
     - `https://your-production-domain.com`
   - **Authorized redirect URIs** (this is Supabase's callback, *not* the app's):
     - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
4. Create → copy the **Client ID** and **Client secret**.

## 2. Supabase — enable the Google provider

1. Supabase dashboard → **Authentication → Sign In / Providers → Google**.
2. Toggle **Enable Sign in with Google**.
3. Paste the **Client ID** and **Client secret** from step 1 → **Save**.

## 3. Supabase — allow the app's callback URL

**Authentication → URL Configuration**

- **Site URL**: your production URL (or `http://localhost:3000` while developing)
- **Redirect URLs** — add:
  - `http://localhost:3000/api/auth/callback`
  - `https://your-production-domain.com/api/auth/callback`

Without these, Supabase falls back to the Site URL and the session never reaches the app.
(The same entries are used by email-confirmation and password-reset links.)

## 4. (Recommended) Update the profile trigger

Run [`supabase/google_oauth.sql`](../supabase/google_oauth.sql) in **SQL Editor** so Google
users get their name and photo copied into `public.profiles`.

## 5. Test

1. `npm run dev` → open <http://localhost:3000/login>
2. Click **Continue with Google** → pick an account → you land on `/dashboard`
3. Check **Authentication → Users** in Supabase: the user shows provider `google`.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| App says "Google sign-in isn't available yet" | Provider not enabled / not saved in step 2 |
| Google: `redirect_uri_mismatch` | The redirect URI in step 1.3 must be exactly `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |
| Google: "Access blocked: app not verified / not a test user" | Add yourself as a Test user, or publish the consent screen |
| After Google you land on the Site URL instead of `/dashboard` | Add `/api/auth/callback` URLs in step 3 |
| Same email used for email sign-up and Google | Supabase links both identities to one user automatically once the email is verified |
