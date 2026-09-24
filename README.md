This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Snakes & Ladders landing

The home page (`/`) is a full-viewport, game-like landing: an isometric 3D Snakes & Ladders
board (three.js) where each scroll tick, key press, swipe, or nav click rolls the die and hops
the barrel token to the next section's square, revealing that section's content in an overlay
panel. Ladders shortcut to Contact; snakes send you back to Projects or About. See
`components/game/` for the board config/path logic (`board-config.ts`), the three.js scene hook
(`use-board-scene.ts`), and the overlay UI (`board-game.tsx` and friends). The board is loaded
client-only (`next/dynamic(..., { ssr: false })`); `components/game/seo-fallback.tsx` renders
the same section content server-side as visually hidden markup for SEO.

Run `pnpm test` to run the unit tests (`vitest`) covering the pure board configuration and
path-planning logic in `components/game/board-config.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
