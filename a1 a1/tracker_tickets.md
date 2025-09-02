# A1K v13.7 — Tracker Tickets

## T1 — Center-Line Enemy Clamp
**Given** a combat scene with enemies and the team on the right side  
**When** enemies path toward the team  
**Then** no enemy crosses the center X plane; boss lunges stop at the plane.

## T2 — Game-Over & Stage Gating
**Given** one or two teammates are KO'd  
**When** at least one teammate remains alive  
**Then** the run continues and the next stage won't start until rewards resolve and at least one ally stands.  
**And** **When** all three are KO'd  
**Then** show retry/continue UI and do not auto-start.

## T3 — Projectiles v2: Unique Basic
**Given** Unique is active (ground or air)  
**When** firing basic shots  
**Then** up to 2–3 shots exist concurrently, projectiles are ~35% larger, lightly home, knock back 3–5 non-boss targets, and apply -10% ATK for 5s.

## T4 — A1 Melee-Only Basic + Waves
**Given** A1 performs the basic combo  
**When** swinging  
**Then** each swing opens a 1.0s reflect window (2–6 bullets), and swings 4–5 emit the mid sword-wave (70, pierce, falloff table).

## T5 — Missy Combo + Dizzy
**Given** Missy fights mobs (non-boss)  
**When** pistol hits land  
**Then** the target receives Dizzy for 5s and targets other mobs; bosses are immune.

## T6 — Missy S2: Wall
**Given** Missy casts S2  
**When** the wall spawns  
**Then** enemies attack the wall, cannot pass until HP=0 or TTL ends (≤10s), and a Wall HP bar is visible.

## T7 — Ally AI Behavior Pack
**Given** a 90s sandbox with mixed threats  
**When** play unfolds  
**Then** each non-leader exhibits ≥6 behaviors among orbit, dodge, retreat, reflect, hide, aggressive burst, flight (Missy), auto-use items, or open gifts; Rage is never auto-fired.

## T8 — Damage Overrides Flag
**Given** `enable_v13_7_damage_overrides = false`  
**Then** DPS parity with v13.5/13.6 is maintained.  
**Given** the flag is **true**  
**Then** A1/Missy/Unique basics and +30% skill multiplier apply; logs confirm.

## T9 — UI Debuffs & Toasts
**Given** Unique hits an enemy with basic  
**Then** an ATK-down icon displays for 5s.  
**Given** Missy pistol hits a mob  
**Then** a Dizzy icon displays for 5s.  
**Given** AI uses items or opens gifts  
**Then** show toasts: “Missy opened a Gift Box”, “Unique used HP Kit”.
