# Street Hut admin setup

The site has a hidden admin page at `/#admin`. An approved Google account signs in there and edits prices,
sold-out items, opening hours and the notice banner. Changes are saved to Vercel Blob and appear for customers
within about a minute. Customers never see any admin controls.

## Files

- `index.html`, `img/`: the website
- `shop-data.json`: the starting copy of prices, sold-out items, hours and notice (used until the first save)
- `api/`: the server functions (sign-in check, save, read)
- `package.json`: installs `@vercel/blob`
- `.env.example`: the settings you add in Vercel

## 1. Google Cloud sign-in key

1. Go to https://console.cloud.google.com and sign in with the Gmail account that will own this (the business Gmail is best).
2. Top bar, project picker, New project. Name it "Street Hut" and create it.
3. Open APIs & Services, then OAuth consent screen (it may be called Google Auth Platform). Choose Get started.
   - App name: Street Hut Admin. User support email: your Gmail.
   - Audience: External. Contact email: your Gmail. Finish and create.
4. Audience page: either add every admin Gmail under Test users, or press Publish app. Only basic sign-in is used,
   so no Google review is needed.
5. Open Clients (or Credentials, Create credentials), then Create OAuth client ID.
   - Application type: Web application. Name: Street Hut website.
   - Authorized JavaScript origins: add every address the site is served from, for example
     `https://streethutsl.vercel.app`, `https://streethut.vercel.app`, and later `https://streethut.lk` and `https://www.streethut.lk`.
   - Authorized redirect URIs: leave empty.
   - Create. Copy the Client ID (it ends in `.apps.googleusercontent.com`). You do not need the client secret.
6. New origins can take a few minutes to start working.

## 2. Vercel Blob store

1. Vercel dashboard, open the Street Hut project, then the Storage tab.
2. Create Database (or Create Store), choose Blob, name it `street-hut`, choose the nearest region, and create it.
   Private or Public both work with this site.
3. Connect it to the project for all environments.
4. In the project, Settings, Environment Variables, you should now see `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`.
   That is correct. Newer Blob stores sign in automatically, so there is no `BLOB_READ_WRITE_TOKEN` to add.
5. Optional: add `BLOB_ACCESS` = `public` only if your store is Public. If you do not add it, the site tries Private first
   and then Public by itself.

## 3. Environment variables

Project, Settings, Environment Variables. Add for all environments:

- `GOOGLE_CLIENT_ID` = the Client ID from step 1
- `ADMIN_EMAILS` = `umarnazlin@gmail.com` (separate more with commas, no need for spaces)

To add or remove an admin later, change `ADMIN_EMAILS` and redeploy.

## 4. Deploy

Replace the files in your project with this package (keep the `img` folder), then deploy.
Using GitHub: commit and push. Using the Vercel CLI: run `vercel --prod`.
Environment variables only take effect on a new deploy.

## 5. Test

1. Open `https://YOUR-SITE/#admin` and press Sign in with Google.
2. Pick an approved account. You land on the Menu page in edit mode.
3. Type a price, tick Sold out on another item, press Save changes.
4. Wait about a minute, then open the site in a private window. The price and the sold-out tag should show.

## Troubleshooting

- "Admin sign-in is not set up yet": `GOOGLE_CLIENT_ID` is missing or the project was not redeployed after adding it.
- Google says "Error 400: origin_mismatch" or the button does not appear: the site address is missing from Authorized JavaScript origins.
- "This Google account is not on the admin list": check the email in `ADMIN_EMAILS` and redeploy.
- "Could not save: Storage error ...": the Blob store is not connected to this project. See step 2, and send the full message to Claude.
- Sign-in lasts about an hour. After that, Save asks you to sign in again.

## Menu prices

`shop-data.json` holds the prices read from the printed menu card. Items without a price there show no price on the site,
and the cart then says the total is confirmed on WhatsApp. Add them through `/#admin`.

Once anyone presses Save changes in the admin, the saved copy in Vercel Blob takes over completely, and later changes to
`shop-data.json` are ignored. If you saved in the admin before this update, your saved prices stay and the new
prices in `shop-data.json` will not appear. Re-enter them in the admin, or ask Claude to help.
