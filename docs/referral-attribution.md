# Client referral attribution

Use a stable UTM link on each client-owned creator-credit banner. The portfolio records one `portfolio_referral` event with only the validated client slug; the tracker does not forward arbitrary URL values.

## Client link format

```text
https://<portfolio-domain>/?utm_source=acme-studio&utm_medium=referral&utm_campaign=credit-banner
```

Replace `acme-studio` with a stable lowercase slug containing only letters, numbers, and single hyphens (maximum 64 characters). Keep `utm_medium=referral` and `utm_campaign=credit-banner` unchanged. Do not put names, email addresses, or other personal data in the source value. Existing query parameters and URL fragments may be retained, for example:

```text
https://<portfolio-domain>/contact?brief=1&utm_source=acme-studio&utm_medium=referral&utm_campaign=credit-banner#contact
```

## Enable after confirming the Vercel plan

The tracker is off unless `NEXT_PUBLIC_ENABLE_REFERRAL_ATTRIBUTION` is exactly `true` at build time.

1. Confirm the Vercel team has a Pro or Enterprise plan and that Web Analytics is enabled for the project. Custom events are available on those plans; Pro permits up to two custom properties per event. Web Analytics usage is event-based and may incur usage charges. [Custom events](https://vercel.com/docs/analytics/custom-events) · [limits and pricing](https://vercel.com/docs/analytics/limits-and-pricing)
2. In the Vercel project settings, add `NEXT_PUBLIC_ENABLE_REFERRAL_ATTRIBUTION=true` to the Production environment.
3. Redeploy Production so the public build-time flag takes effect.
4. Open the example link above in a fresh browser page. In the Vercel project, go to **Analytics → Events** and confirm `portfolio_referral` appears with the `client` property set to `acme-studio`.
5. Remove the flag or set it to `false` and redeploy to stop sending this custom event.

Native UTM-parameter reporting is listed for Web Analytics Plus and Enterprise, not standard Pro. This implementation therefore uses a custom event on Pro rather than relying on native UTM reports. [Using Web Analytics](https://vercel.com/docs/analytics/using-web-analytics)

## Data boundary

Only the validated `utm_source` slug is attached as `{ client: "<slug>" }`. The tracker requires exactly one each of `utm_source`, `utm_medium`, and `utm_campaign`, with the latter two set to the fixed values above. It ignores all other query parameters and never rewrites the URL.
