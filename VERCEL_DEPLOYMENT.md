# Deploying the MBM API to Vercel

## Vercel project settings

1. Import the Git repository containing this backend.
2. Set **Root Directory** to `MBM` if the backend is in a monorepo. If this repository itself is the backend, keep the repository root.
3. Leave the build command and output directory at their defaults. Vercel detects the Express app in `src/server.ts`.
4. Add the environment variables below for both Preview and Production deployments.

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. Allow Vercel to reach the Atlas cluster in Atlas Network Access. |
| `JWT_SECRET` | A long, random signing secret. |
| `CORS_ORIGINS` | Exact frontend origins, comma separated, for example `https://your-app.vercel.app,https://www.example.com`. |
| `UPLOAD_STORAGE` | Set to `gridfs` on persistent Node hosts. Vercel automatically uses GridFS. |
| `ADMIN_EMAIL` | Admin login email, if admin login is used. |
| `ADMIN_PASSWORD` | Admin login password, if admin login is used. |

Do not commit `.env`; set production secrets in Vercel's project settings.

## Verify the deployment

After deploying, open `/` and `/api/health` on the deployment URL. Then set the frontend's API base URL to that URL and redeploy the frontend. Check Vercel Function logs if an API request fails.

## Important: file uploads

Uploaded files use MongoDB GridFS when `UPLOAD_STORAGE=gridfs` or when running on Vercel. This keeps the existing multipart endpoints and `/uploads/...` URLs while sharing files across local and live instances that use the same MongoDB database. Set `UPLOAD_STORAGE=gridfs` in local `.env` when local development should read and write the same files as the live deployment. Otherwise local uploads remain in the backend's `uploads/` directory.

For existing uploads, `npm run migrate:uploads` provides a read-only preview of files referenced by MongoDB that exist locally but are not in GridFS. Files already missing from the local upload directory must be restored from their original source.

Video uploads are staged temporarily for compression and then saved to GridFS. Vercel's request and execution limits still apply to large uploads; the existing 100 MB video and 500 MB manuscript limits may exceed what a function can accept in one request. For those sizes, use a persistent Node host or migrate the frontend to direct object-storage uploads.

## Local commands

From this directory, `npm run dev` starts the local TypeScript server and `npm run build` compiles it. Local data routes require `MONGODB_URI`; `/api/health` remains available without MongoDB.
