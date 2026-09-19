# NYC Emergency Department Dashboard — UI/UX Enhancement Script

## Role

You are a senior frontend UI/UX engineer and data-visualization designer.

You are improving an existing, working React dashboard built with Vite and Recharts.

The dashboard analyzes the NYC Open Data dataset:

Emergency Department Visits and Admissions for Influenza-like Illness and/or Pneumonia.

The application already works.

Your job is NOT to rebuild the application or change its data-analysis logic.

Your job is to improve the visual design, usability, responsiveness, accessibility, and clarity of the existing interface while preserving all working functionality.


# Primary Rule

Inspect the existing project before making changes.

Do not replace working components simply because you would implement them differently.

Do not modify the NYC Open Data query logic, latest-extraction logic, calculations, filtering behavior, rolling-average calculations, or data transformations unless there is a demonstrated bug.

Treat the current application as the functional baseline.


# Existing Functionality That Must Remain

The dashboard currently includes:

- Live NYC Open Data API integration
- Latest `extract_date` filtering to prevent duplicate historical snapshots
- All NYC aggregation
- MODZCTA geographic filtering
- Daily ILI/pneumonia visit trend
- Peak daily visit calculation
- ILI/pneumonia share of total ED visits
- ILI/pneumonia admission rate
- 7-day rolling rate visualization
- Dynamic descriptive insights
- Loading state
- Error state
- Retry behavior
- API timeout handling
- Responsive behavior

Do not remove any of these features.


# Design Goal

Make the dashboard feel like a polished public-health data exploration tool.

The interface should feel:

- clean
- modern
- professional
- calm
- data-focused
- trustworthy
- easy to scan

The charts and information should remain the main focus.

Avoid excessive decoration, gradients, animations, glass effects, oversized controls, unnecessary icons, and dashboard clutter.


# 1. Improve Page Hierarchy

Review the current header.

Keep the main title prominent, but make sure it does not dominate the entire viewport on smaller screens.

Create a clear hierarchy between:

1. Dataset/project identity
2. Main title
3. Short description
4. Geography controls
5. Primary visualization
6. Supporting statistics
7. Rate visualization
8. Key observations
9. Source/methodology information

Spacing should visually separate these sections without making the page excessively long.


# 2. Improve Geography Controls

The geography selector is one of the dashboard's primary interactions.

Improve its presentation.

Clearly label it:

"Geography"

The selector should make the difference between:

- All NYC
- Individual MODZCTA

obvious.

Keep the text showing how many MODZCTAs are available.

Improve:

- spacing
- focus state
- hover state
- keyboard accessibility
- mobile sizing

Do not change how the filter works.


# 3. Improve the Primary Trend Chart

The "Visits over time" chart is the dashboard's main visualization.

Give it the strongest visual emphasis.

Improve:

- axis readability
- date formatting
- tooltip design
- chart padding
- grid-line subtlety
- responsive sizing
- line visibility
- peak-value presentation

Do not exaggerate differences through misleading axis choices.

The tooltip should clearly show:

Date
ILI/pneumonia visits

Avoid unnecessary information.


# 4. Improve Metric Cards

The dashboard contains statistics such as:

- Share of all ED visits
- Admission rate
- Peak daily total
- Highest 7-day ILI/pneumonia share
- Recent 30-day visit average

Create a consistent visual system for these metrics.

Each metric should have:

Small descriptive label
Large value
Short explanation/context

Values should be visually prominent without competing with the charts.

Cards should use consistent:

- padding
- border radius
- typography
- spacing
- border treatment


# 5. Improve the 7-Day Rate Visualization

The rolling-average chart should be easier to understand immediately.

Clearly distinguish:

- 7-day ILI/pneumonia share of ED visits
- 7-day admission rate among ILI/pneumonia visits

Improve the legend so users do not have to decipher similar line styles.

Consider direct labels or a clearer legend if appropriate.

Keep the existing 7-day rolling calculations unchanged.

Explain briefly why a 7-day average is used:

"Rolling 7-day rates reduce day-to-day volatility, especially in smaller MODZCTAs."


# 6. Improve "What Stands Out?"

Keep this section descriptive rather than causal.

It should help users quickly understand notable values from their current selection.

Improve the cards so they are easy to scan.

Examples:

Highest daily visit count
42
March 26, 2020

Highest 7-day ILI/pneumonia share
49.7%
7-day period ending April 6, 2020

Recent 30-day visit average
11.2
56.7% higher than the preceding 30 days

Do NOT automatically describe increases as outbreaks, waves, COVID effects, policy effects, or other causal events.

The dataset alone does not establish those explanations.


# 7. Add a Small Methodology / "About This Data" Area

Add a compact expandable section near the bottom of the page.

Possible heading:

"About this data"

Explain briefly:

- Data source: NYC Open Data / NYC Department of Health and Mental Hygiene
- Data period: March 2020–December 2022
- Geography: MODZCTA
- Dashboard uses the latest extraction snapshot
- Why the latest extraction is used
- Rates use the same selected geography
- The lower chart uses 7-day rolling averages

Keep this concise.

Do not turn the page into a methodology report.


# 8. Improve Loading State

Do not show an empty chart while data loads.

Use a lightweight skeleton/loading state that approximately matches the eventual layout.

Show a message such as:

"Loading NYC Open Data…"

Avoid distracting loading animations.


# 9. Improve Error State

If the NYC Open Data request fails, present the error inside the dashboard layout.

Include:

"Unable to load NYC Open Data."

Provide a:

"Try again"

button.

Keep technical API details out of the primary message unless they are useful for debugging.

Do not silently substitute hardcoded data.


# 10. Empty Data State

If a filter returns no usable records, do not render a broken or empty chart.

Display:

"No data is available for this selection."

Allow the user to choose another geography.


# 11. Responsive Design

Test at approximately:

1440px
1024px
768px
430px
375px

Desktop:

- charts can use wide layouts
- metric cards can appear in rows

Tablet:

- preserve chart readability
- reduce unnecessary horizontal spacing

Mobile:

- stack cards vertically
- make the geography selector easy to tap
- reduce title size
- keep chart labels readable
- avoid horizontal page scrolling
- make charts use the available width

The user should never need to zoom out to understand the dashboard.


# 12. Accessibility

Improve accessibility without changing the visual identity.

Check:

- semantic heading hierarchy
- form labels
- keyboard navigation
- visible focus indicators
- sufficient contrast
- button states
- meaningful chart descriptions
- screen-reader text where appropriate

Do not rely solely on color to distinguish the two rate series.


# 13. Typography

Use a restrained typography system.

Create clear levels for:

Page title
Section heading
Chart title
Metric value
Body text
Supporting text
Metadata

Avoid too many font sizes or weights.

Keep numerical values easy to scan.


# 14. Spacing and Layout

Create a consistent spacing system.

Avoid arbitrary margins throughout individual components.

Use reusable spacing values for:

- page sections
- cards
- headings
- controls
- chart containers

Keep the content width comfortable on large monitors instead of stretching the dashboard across the entire screen.


# 15. Interaction Polish

Use subtle transitions only where they improve understanding.

Examples:

- button hover/focus
- selector focus
- card hover only if the card is interactive

Do not animate chart data excessively when changing MODZCTAs.

The interface should feel responsive rather than flashy.


# 16. Preserve Data Integrity

UI improvements must never alter the meaning of the data.

Verify after the redesign that:

- All NYC still produces the same values
- MODZCTA selections still produce the same values
- peak calculations remain identical
- summary rates remain identical
- 7-day rolling calculations remain identical
- latest extraction remains identical

Visual redesign must not change analytical results.


# 17. Code Quality

Do not place the entire redesign into one giant component.

Reuse components where appropriate.

Potential reusable components include:

- MetricCard
- ChartCard
- SectionHeader
- LoadingState
- ErrorState
- InsightCard

Avoid unnecessary abstraction.

Keep the code understandable for another developer reviewing the project.


# 18. Final QA

Before declaring the UI enhancement complete, test:

- All NYC
- several MODZCTAs
- geography switching
- both charts
- tooltips
- metric calculations
- loading state
- API failure state
- retry
- empty data
- desktop
- tablet
- mobile
- keyboard navigation

Check the browser console for warnings or errors.


# Definition of Done

The enhancement is complete when:

1. Existing analytical functionality still works.
2. No data calculations have changed unexpectedly.
3. The dashboard is easier to understand at first glance.
4. Charts remain the primary focus.
5. Geography filtering is obvious and easy to use.
6. Desktop and mobile layouts are both usable.
7. Loading, error, and empty states are polished.
8. Accessibility has improved.
9. The interface feels cohesive rather than like separate components placed on a page.
10. No visual element exists only for decoration.

Do not add additional charts or features unless they solve a specific usability or comprehension problem.

When finished, summarize:
- what UI changes were made
- which files were changed
- why each major change improves usability
- confirmation that the underlying calculations/data logic were preserved