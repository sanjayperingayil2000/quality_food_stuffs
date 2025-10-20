## [Devias Kit - React](https://material-kit-react.devias.io/)

![license](https://img.shields.io/badge/license-MIT-blue.svg)

[![Devias Kit - React](https://github.com/devias-io/material-kit-react/blob/main/public/assets/thumbnail.png)](https://material-kit-react.devias.io/)

> Free React Admin Dashboard made with [MUI's](https://mui.com) components, [React](https://reactjs.org) and of course [Next.js](https://github.com/vercel/next.js) to boost your app development process!

## Pages 

- [Dashboard](https://material-kit-react.devias.io)
- [Customers](https://material-kit-react.devias.io/dashboard/customers)
- [Integrations](https://material-kit-react.devias.io/dashboard/integrations)
- [Settings](https://material-kit-react.devias.io/dashboard/settings)
- [Account](https://material-kit-react.devias.io/dashboard/account)
- [Sign In](https://material-kit-react.devias.io/auth/sign-in)
- [Sign Up](https://material-kit-react.devias.io/auth/sign-up)
- [Reset Password](https://material-kit-react.devias.io/auth/reset-password)

## Free Figma Community File

- [Duplicate File](https://www.figma.com/file/b3L1Np4RYiicZAOMopHNkm/Devias-Dashboard-Design-Library-Kit)

## Upgrade to PRO Version

We also have a pro version of this product which bundles even more pages and components if you want
to save more time and design efforts :)

| Free Version (this one)  | [Devias Kit Pro](https://mui.com/store/items/devias-kit-pro/)                |
| ------------------------ | :--------------------------------------------------------------------------- |
| **8** Pages              | **80+** Pages                                                                |
| ✔ Custom Authentication  | ✔ Authentication with **Amplify**, **Auth0**, **Firebase** and **Supabase**  |
| -                        | ✔ Vite Version                                                               |
| -                        | ✔ Dark Mode Support                                                          |
| -                        | ✔ Complete Users Flows                                                       |
| -                        | ✔ Premium Technical Support                                                  |

## Quick start

- Clone the repo: `git clone https://github.com/devias-io/material-kit-react.git`
- Make sure your Node.js and npm versions are up to date
- Install dependencies: `npm install` or `yarn`
- Start the server: `npm run dev` or `yarn dev`
- Open browser: `http://localhost:3000`

## Backend API (Next.js App Router)

This project includes a modular backend under `src/app/api/*` powered by MongoDB (Mongoose), JWT auth, role-based access, Nodemailer (SMTP), and history/audit logging.

### Environment variables

Copy `.env.example` to `.env.local` and set values:
- `MONGO_URL`
- `NEXT_PUBLIC_API_BASE=/api`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN=15m`, `REFRESH_TOKEN_EXPIRES_IN=2h`, `RESET_PASSWORD_TOKEN_EXPIRES_IN=1h`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`
- `CORS_ORIGIN` (use `*` in dev; lock to your domain in prod)
- `APP_URL`, `RESET_PASSWORD_URL`
- `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD`, `SEED_SUPER_ADMIN_NAME`

### Seeding

Run: `node ./src/utils/seed.ts ./seed_data.json`

Seeds default super admin (if env set) and upserts `settings` and `calculations` from the JSON file.

### API Endpoints

- Auth: `POST /api/auth?action=signup|login|refresh|logout|forgot-password|reset-password`
- Users: `GET /api/users`, `POST /api/users`
- Users by id: `GET /api/users/:id`, `PATCH /api/users/:id`, `DELETE /api/users/:id`
- Settings: `GET /api/settings`, `POST /api/settings`, `PATCH /api/settings/:key`
- Calculations: `GET /api/calculations`, `POST /api/calculations`
- Calculation by id: `GET /api/calculations/:id`, `PATCH /api/calculations/:id`, `DELETE /api/calculations/:id`
- History: `GET /api/history`

Protected routes require `Authorization: Bearer <accessToken>`.

### Sample requests

Signup:

```
POST /api/auth?action=signup
{ "name": "Manager One", "email": "manager1@example.com", "password": "Passw0rd!", "roles": ["manager"] }
```

Login:

```
POST /api/auth?action=login
{ "email": "manager1@example.com", "password": "Passw0rd!" }
```

Refresh:

```
POST /api/auth?action=refresh
{ "refreshToken": "<refresh>" }
```

Create calculation from frontend context:

```
POST /api/calculations
Authorization: Bearer <access>
{ "contextName": "dailyTrip", "inputs": { "trips": [] }, "results": {}, "metadata": { "tags": ["today"] } }
```

### Production

- Set `CORS_ORIGIN` to your domain
- Rotate JWT secrets regularly
- Use SMTP app passwords
- Prefer HTTPS with Secure/HttpOnly cookies if moving tokens to cookies

## File Structure

Within the download you'll find the following directories and files:

```
┌── .editorconfig
├── .eslintrc.js
├── .gitignore
├── CHANGELOG.md
├── LICENSE.md
├── next-env.d.ts
├── next.config.js
├── package.json
├── README.md
├── tsconfig.json
├── public
└── src
	├── components
	├── contexts
	├── hooks
	├── lib
	├── styles
	├── types
	└── app
		├── layout.tsx
		├── page.tsx
		├── auth
		└── dashboard
```

## Resources

- More freebies like this one: https://devias.io

## Reporting Issues:

- [Github Issues Page](https://github.com/devias-io/material-kit-react/issues)

## License

- Licensed under [MIT](https://github.com/devias-io/material-kit-react/blob/main/LICENSE.md)

## Contact Us

- Email Us: support@deviasio.zendesk.com
