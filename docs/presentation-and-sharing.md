# Reading presentation and sharing

The public interface does not advertise its language-model implementation. The privacy page still names OpenRouter and the providers and describes the automatic transfer of derived characteristics. Raw birth inputs remain local. Technical operator documentation remains explicit about the actual architecture.

## Dates and progress

The report starts with the **whole Korean civil month** as its overview. `monthWindow` computes the final date, including leap years. Each opportunity, caution and action then selects exactly one computed solar-term interval and displays that exact interval, with an exclusive end. The monthly PNG carries the same interval as the opportunity it exports. These dates are interpretation scope, never promised event dates. Annual interpretation uses the engine's exact spring-term instants from the named year to the next spring term, with an exclusive end. Personality, love, work and money habits are explicitly marked as general tendencies. Age-cycle ranges remain the calculated age ranges; calendar dates are not invented.

`POST /api/analyze` negotiates `application/x-ndjson`. Legacy JSON clients remain supported. The response streams only:

1. `accepted` after input, origin, challenge and atomic budget/concurrency checks.
2. `retrying` if the configured primary genuinely fails and the one allowed fallback begins.
3. `verified` only after provider identity and reading content/evidence validation succeeds.
4. A validated `result`, or an explicit `error`.

No partial model prose or reasoning is streamed. The stream owns the D1 lease until cleanup. The client consumes the stream through its natural end after the final event, allowing the server to finish lease cleanup before showing completion. Client disconnect cancels the provider, retains the reserved budget and releases the concurrency lease.

The progress bar starts at 0 and updates every 100 ms with CSS interpolation. It is explicitly labelled **예상 진행률**: a monotone elapsed-time estimate using a 24-second exponential time constant, capped below 95% while waiting. Preparation is capped at 12%, validation may show 98%, and only a fully received, validated response can show 100%. Actual server status is displayed separately. Retry never resets the estimate. Reduced-motion disables decorative animation. No fake work stages or artificial completion delay are added.

## Concrete reasons and direct headlines

Every monthly point references a positive natal ten-god count and a specific solar-term interval. `reading-evidence.ts` supplies deterministic counts, exact interval timestamps and conventional definitions. The UI prints these facts, the day-master basis and the model's explanatory connection separately. The server supplies the same catalogue to the model, then checks that the named natal relation and monthly relation each belong to the facts cited in that point. Generic reasons and clearly invented relations are rejected. The catalogue's counts exclude the day master and use branch main stems; they are not seasonal strength weights or proof of future events.

The headline identifies one concrete behavior, such as paying other people's share before agreeing a split. Direct prohibitions are allowed; fabricated disasters, medical outcomes and fear-based claims are not. Keyword checks do not prove the meaning of every sentence, so bounded live content review remains necessary.

Compatibility entry points, the result flow and compatibility card selection were removed. Six personal card types remain. Legacy library helpers remain in source for existing downstream callers; they are not exposed in the app.

## Pre-made illustrations

Six originals were generated with the built-in image generation tool and visually reviewed, then encoded as WebP for delivery. The six assets total approximately 1.3 MB, and only the selected scene loads for a result. Originals are retained in the generation workspace; final site assets are in `public/illustrations/`.

Shared prompt: Production 3:2 landscape editorial illustration for a warm Korean saju self-reflection app. Flat pastel gouache with subtle paper texture, dark forest-green contours, cream/sage/peach/lilac/sky palette. Original rounded garden creatures: sage sprout, lilac star and peach flame. Adult-friendly stationery mood, simple mobile-readable central narrative. No words, logo, watermark or UI.

| File | Scene prompt |
| --- | --- |
| career.webp | Sprout presenting a portfolio at a round desk to a star friend; peach sealed envelope; invitation to show work. |
| money.webp | Sprout thoughtfully sorting coins into three ceramic saving pots; purse and notebook; steady saving, not sudden riches. |
| connection.webp | Sprout and star sharing tea and a letter at a cafe; a helpful introduction and conversation. |
| love.webp | Sprout and peach flame walking with one lavender umbrella along a flower-lined path. |
| learning.webp | Sprout reading under a peach lamp, a floating lilac star and a sky-blue pencil; a useful new insight. |
| new-start.webp | Sprout with a lilac bag crossing an open peach doorway toward a sunlit path; a new beginning. |

The deterministic illustration selector matches the actual opportunity headline. It does not accept remote asset URLs from the model and does not use birth identifiers. Unknown topics use the new-start scene. Landing copy is clearly labelled as an illustrative excerpt of a checked synthetic October 2026 result, not the visitor's personal result.

The existing OG image was edited with the built-in tool only to remove its two middle dots, then normalized to its declared 1200×630 delivery dimensions. Prompt: preserve composition and typography; replace the top middle-dot separator with spacing, and the bottom separator with a comma.

## Saved images and Photos

Six personal card layouts include the monthly result. The prominent result bar provides **사진 저장**, **공유하기**, and card customization. PNG sizes remain 1080×1350 and 1080×1920. Previews and downloads reuse the same Blob. The monthly export includes the actual period, opportunity, matching illustration, reason and action.

Native sharing passes a PNG File with only a generic title. Cancellation is not reported as a saved photo. Web browsers cannot silently insert images into the Photos library. The save dialog therefore gives a native share button, long-press guidance and an explicit PNG download alternative. The OS decides available save destinations. Default exports omit names, birth dates, birth times, gender and evidence IDs.

## Verification

Vitest covers streamed milestones, network chunk boundaries, premature EOF, errors, aborts, D1 lease lifetime, fallback limits, exact monthly/annual ranges, generated punctuation cleanup, artwork selection, share-file payloads and privacy. Browser verification includes 320px/390px layouts, desktop, contrast/accessibility, actual PNG downloads and preview/download byte equality. A simulated native share verifies File handoff and user activation; this does not certify saving on a physical iPhone or Android Photos app.
