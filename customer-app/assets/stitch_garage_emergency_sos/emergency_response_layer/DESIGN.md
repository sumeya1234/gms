---
name: Emergency Response Layer
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e4beba'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ab8986'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3ad'
  primary: '#ffb3ad'
  on-primary: '#68000a'
  primary-container: '#ff5451'
  on-primary-container: '#5c0008'
  inverse-primary: '#b91a24'
  secondary: '#ffb690'
  on-secondary: '#552100'
  secondary-container: '#ec6a06'
  on-secondary-container: '#4a1c00'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#4d8eff'
  on-tertiary-container: '#00285d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930013'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  status-number:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  touch-target-min: 56px
  stack-gap-lg: 32px
  stack-gap-md: 16px
  stack-gap-sm: 8px
---

## Brand & Style

The design system is engineered for high-stress, critical environments within garage management. It focuses on immediate visual hierarchy and the psychological reassurance that assistance is active. 

The aesthetic is a fusion of **Glassmorphism** and **Tactile Modernism**. It utilizes deep translucent layers to maintain context of the underlying garage operations while surfacing urgent SOS controls with 3D depth and physical metaphors. The interface must feel "heavy" and "mechanical" yet digitally sophisticated—evoking a sense of high-end automotive engineering and rapid response.

**Key Visual Pillars:**
- **Urgency:** Immediate recognition of danger through high-chroma signals.
- **Assurance:** Soft pulses and progress indicators that communicate "Rescue is Coming."
- **Precision:** Sharp typography paired with large, unmistakable touch targets.

## Colors

The palette is anchored in a triple-black environment to maximize the luminance of the emergency signals.

- **Emergency Red (#EF4444):** Used exclusively for SOS triggers, critical stop actions, and active danger alerts.
- **Cautionary Orange (#F97316):** Used for non-life-threatening mechanical failures or high-priority warnings.
- **Deep Charcoal Backgrounds:** A tiered system of `#0A0A0A` for the base, `#171717` for elevated containers, and `#262626` for interactive glass surfaces.
- **Signal Blue (#3B82F6):** Reserved for "Rescue Tracking" and professional status updates to provide a calm contrast to the heat of the red/orange alerts.

## Typography

This design system uses **Outfit** across all levels to ensure a modern, geometric, and authoritative tone. 

- **Display & Headlines:** Use ExtraBold (800) and Bold (700) weights to create an unmistakable hierarchy. In emergency states, headlines should use tighter letter spacing to feel more urgent.
- **Body Text:** Maintained at Medium (400) weight for legibility against dark, blurred backgrounds.
- **Labels:** Uppercase tracking is applied to small labels to differentiate metadata from actionable commands.
- **Mobile Optimization:** On mobile, display sizes are capped at 28px to ensure critical status messages do not wrap awkwardly during a crisis.

## Layout & Spacing

The layout utilizes a **fluid grid** with high-density margins to keep information centered and focus-locked. 

- **Safe Zones:** A generous 24px margin is enforced on all mobile screens to prevent accidental triggers near screen edges.
- **Touch Targets:** Emergency buttons must never be smaller than 56px in height/width.
- **The "Focus Stack":** Elements are arranged in a vertical stack with a 32px gap between the primary action (SOS Button) and supporting information (Location, Status).
- **Responsive Behavior:** On desktop/tablet, the SOS interface appears as a centered modal "overlay" with a 40% backdrop blur, maintaining the garage dashboard's context in the background.

## Elevation & Depth

Hierarchy is established through a combination of **Glassmorphism** and **Dynamic Shadows**.

- **Level 0 (Base):** Pure `#0A0A0A` black.
- **Level 1 (Surface):** `#171717` with a 1px inner border of 10% white to define edges.
- **Level 2 (Glass Layers):** Surfaces use a background-blur of 20px and an opacity of 70%. These layers host supporting information like "Estimated Arrival."
- **Level 3 (SOS Trigger):** This element uses a physical 3D effect. It features a heavy drop shadow (20% opacity red) and a subtle top-down gradient to simulate a physical, pressable button.
- **Active State:** When pressed, the elevation should visually invert (inset shadow) to provide immediate tactile feedback.

## Shapes

The design system uses **Rounded (0.5rem)** as the base geometry to balance the "industrial" nature of a garage with the "premium" nature of the service.

- **Standard Elements:** 0.5rem (8px) radius.
- **Main SOS Button:** Always a perfect circle (rounded-full) to stand out as a unique, non-standard UI element.
- **Status Chips:** Pill-shaped (rounded-full) to differentiate them from interactive cards.
- **Glass Containers:** 1rem (16px) radius to feel softer and more modern.

## Components

### SOS Trigger Button
The primary component. It must be a large red circle with a "squishy" 3D depth. It features a continuous outer pulse animation (SOS Red at 20% opacity) when the emergency is active.

### Status Chips
High-contrast pills used for "Responders En Route" or "Garage Secured." Use the secondary color (Orange) for pending states and Signal Blue for active response states.

### Emergency Cards
Glassmorphic containers with a 1px stroke. They house critical data like "Mechanic Name," "Current Location," and "ETA." Text inside should be high-contrast white.

### Input Fields
Used for "Nature of Emergency" quick-notes. These should be dark-filled with a subtle red border glow when focused.

### Action Lists
Lists of emergency contacts or nearby garages. Each item should have a chevron to indicate drill-down and a minimum height of 64px for easy tapping under pressure.

### Progress Indicator
A vertical or horizontal timeline showing the stages: Request Received → Dispatching → Rescue En Route → On Site. Completed stages use a vibrant green, while active stages pulse in Signal Blue.