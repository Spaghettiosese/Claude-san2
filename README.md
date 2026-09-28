# 半玉 · Half of Jade — A Sister's War, 1939–1940

A story-driven 2D stealth side-scroller set in China during the Second Sino-Japanese War.
Pixel-art levels, pixel-art character portraits, dialogue-heavy cutscenes, branching choices and
six endings — all in plain HTML5 Canvas + JavaScript, with **no dependencies and no asset files**:
every sprite, portrait, painting, sound effect and piece of music is generated in code.

> Nanjing, December 1939. The Kempeitai are hunting Su Ming, a photographer who saw too much in
> the winter of 1937. He puts his little sister Lan on a boat at the water gate and runs back
> into the snow. Six months later, in the bombed wartime capital of Chongqing, Lan stops waiting.

## Running the game

Open `index.html` in any modern desktop browser. That's it — no build step.

If your browser restricts local files, serve the folder instead:

```bash
npx http-server .   # then open http://localhost:8080
```

Progress is saved automatically at the start of every chapter (browser `localStorage`).

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or `←` / `→` | Move |
| `Shift` | Run (loud) · fast-forward dialogue |
| `W` / `Space` | Jump · climb ladders · stand up |
| `C` or `S` | Crouch (quiet, low profile, hides behind crates) |
| `Z` | Prone (silent crawl, hide in tall grass, slip under barbed wire) |
| `E` | Interact · hide · talk · pick up · drag/stash bodies · pickpocket |
| `F` | Lethal takedown from behind · fire a drawn weapon |
| `V` | Non-lethal knockout |
| `Q` | Throw a stone (distraction) |
| `T` | Throw firecrackers (big distraction, scares dogs) |
| `G` | Draw / holster a firearm |
| `R` | Order your companion to wait / follow |
| `Space` (while hidden) | Hold your breath when a guard searches your hiding spot |
| `Tab` / `J` | Journal |
| `Esc` / `P` | Pause |
| `1`–`4`, mouse | Pick dialogue choices |
| `F1` | Controls overlay |

A standard gamepad also works: **A** jump/confirm · **B** crouch · **X** interact · **Y** kill · **LB** knockout · **RB** throw · **LT** run · **RT** prone · **L3** weapon · **R3** firecracker · **Back** journal · **Start** pause.

**One shot kills Lan.** Shadows hide you, noise travels through walls, and every gunshot brings
the whole garrison.

## The story — a prologue and twelve chapters

| # | Chapter | Where & when | What happens |
| --- | --- | --- | --- |
| P | Ashes of Jinling | Nanjing, Dec 1939 | A cold open in 1940 Chongqing flashes back to the night Ming disappeared. Tutorial through snowy lanes, rooftops and Ming's photo studio. |
| 1 | The Fog Capital | Chongqing, Jun 1940 | Break into Dai Li's Juntong archive during a Japanese air raid. Meet agent Lu Zhiyuan — and Dai Li himself. |
| 2 | A Reception at Huangshan | Chongqing, Jul 1940 | Disguised as a kitchen girl, pickpocket a colonel and crack the Generalissimo's safe — then face **Chiang Kai-shek**. |
| 3 | The Blockade Line | Shaanxi, Aug 1940 | Cross the Nationalist blockade with Eighth Route Army scout Han Tie: searchlights, dogs, wire, a checkpoint. |
| 4 | Red Caves | Yan'an, Aug 1940 | Meet **Zhou Enlai**'s contacts and **Mao Zedong** in his cave; chase a spy through Yan'an at night while framed for his crime. |
| 5 | The Hundred Regiments | Zhengtai Railway, 20 Aug 1940 | During Peng Dehuai's great offensive, free the Japanese deserter who travelled with Ming. First chapter where you may kill — and go loud. |
| 6 | The Iron Rooster | Tianjin–Pukou Railway, Sep 1940 | Posing as a Red Cross nurse on a night train: Kempeitai inspections, first class, and tunnels on the roof. |
| 7 | The Solitary Island | Shanghai, Oct 1940 | A Shanghai ballroom in a silk qipao. A singer who sells secrets to No. 76. Kill, spare, knock out, or blackmail. |
| 8 | 76 Jessfield Road | Shanghai, Oct 1940 | The Wang regime's torture house. If the bell rings, nobody leaves. Optional rescue of journalist Fang Yu. |
| 9 | Return to Jinling | Nanjing, Nov 1940 | Snowbound home: footprints betray you. Ming's hidden negatives of December 1937. A reckoning with a traitor. |
| 10 | The Puppet's Palace | Nanjing, 30 Nov 1940 | The treaty ceremony recognising **Wang Jingwei**'s regime. An assassin in the attic. A poet-collaborator in the snow. |
| 11 | The House of Shadows | Kempeitai HQ, Dec 1940 | Break Ming out and get him — wounded — past Major Kageyama. |
| 12 | The River of Farewell | Xiaguan Docks, Dec 1940 | One boat, one night. The ending you earned. |

Historical figures who appear on screen: Chiang Kai-shek, Mao Zedong, Zhou Enlai, Wang Jingwei,
Dai Li. Mentioned in dialogue, documents and radio: Emperor Hirohito, Prince Konoe Fumimaro,
Tojo Hideki, Abe Nobuyuki, Kagesa Sadaaki, Soong Mei-ling, Peng Dehuai, Hu Zongnan, Kang Sheng,
Li Shiqun, Ding Mocun, Sun Yat-sen, John Rabe, Minnie Vautrin, Zhang Zizhong and others.
Every chapter opens with a short historical note.

### Endings

Six endings plus a secret epilogue, decided by what you carry, what you know, whom you saved and
whom you trusted: **Two Halves of Jade**, **Blue Sky, White Sun**, **The Long Road North**,
**The Man Who Stayed**, **Ashes on the Yangtze**, **The Collaborator's Price** — and, if you find
all 13 memories, **August 1945**.

## Features

**Story & presentation**
1. Prologue + 12 chapters across 13 hand-built levels, from Nanjing to Yan'an to Shanghai and back.
2. Cold open in 1940 Chongqing that flashes back to 1939 Nanjing (sepia-filtered).
3. On-screen conversations with five historical leaders; dozens more referenced.
4. Character portraits (26 characters × 15 expressions) in the [Moonkai Pixel Studio](https://github.com/Spaghettiosese/moonkai/tree/claude/peaceful-brown-jylvxx/pixel) style: 128×160 outlined, cel-shaded pixel busts with dithered backgrounds and pixel frames. **Settings → Portraits** switches back to the original painted look.
5. 25+ painted cutscene backdrops with animated snow, rain, embers and fireworks.
6. Chapter title cards with typed place/date and historical notes.
7. Typewriter dialogue with voice blips, name plates, speaker highlighting and fast-forward.
8. Branching dialogue with **locked choices** that show exactly what they need — an item, a document you read, knowledge, or someone's trust.
9. Timed choices that decide for you if you hesitate.
10. Interactive cutscenes: button-mash struggles, timing strikes and hold-your-nerve moments.
11. Two romance routes — Lu Zhiyuan (Juntong spy) and Han Tie (Eighth Route Army scout) — built from affinity across chapters.
12. Consequences carried across the whole game (Ming's film, a spared spy, a rescued journalist, medicine, a bargain…).
13. Six endings plus a secret epilogue, and an endings gallery.
14. 16 readable documents and letters: lore, clues and safe combinations.
15. 13 hidden memory photographs with sepia flashbacks of the siblings' childhood.
16. Journal with objectives, inventory, documents, memories, people (with historical bios and bond hearts) and a record of your choices.
17. Period radio broadcasts (the fall of France, the Burma Road closure, Konoe's cabinet…).
18. Soldiers' idle chatter about home, the war and Tokyo politics.
19. Readable posters, a plum tree, a gravestone, a letter behind a brick.

**Stealth**
20. Vision cones ray-cast against walls and cover.
21. Light and shadow: darkness shortens how far guards can see; a light-gem meter shows your exposure.
22. Standing, crouching and prone stances; crouching behind crates breaks line of sight.
23. Tall grass hides you completely when you're low.
24. Surface-based noise: gravel crunches, old floorboards creak, carpets muffle, water splashes, snow crunches.
25. Noise propagates through walls with attenuation; visible noise rings and a noise meter.
26. Suspicion meter (?) that escalates into investigation, look-around, search and full alert (!).
27. Guards shout to alert neighbours and call their last known position.
28. Hiding spots: wardrobes, curtains, haystacks and barrel stacks.
29. Hold-your-breath minigame when a guard searches your hiding spot.
30. Guards who **saw** you hide will search that exact spot.
31. Ambush a guard walking past your hiding spot and drag him inside.
32. Takedowns from behind: lethal (`F`) or non-lethal (`V`).
33. Death-from-above takedowns when dropping onto a guard.
34. Bodies are discovered by patrols and searchlights; drag and stash them in hiding spots, shadows or grass.
35. Alarm bells: an alerted guard sprints to ring one — stop him first, or cut the bell wire in advance.
36. Missions where a raised alarm, or being seen at all, means failure.
37. Reinforcements pour in after an alarm; guards stay wary.
38. Sweeping searchlight towers.
39. Guard dogs that smell you even when you're hidden — and bolt from firecrackers.
40. Stones and firecrackers to lure guards off their posts.
41. Fuse boxes plunge areas into darkness — and send a guard to fix them.
42. Doors, keys, combination locks, safes, gates and levers.
43. Disguises (kitchen girl, Red Cross nurse, qipao, press credentials) with restricted zones, sharp-eyed officers, and cover you can blow.
44. Pickpocket keys from guests and guards from behind.
45. Search bodies for keys and documents.
46. Companions (Han, Mori, Fang Yu, Ming) who follow your exact path and mirror your stance; order them to wait; if they're seen, you're seen.
47. A wounded brother who moves slowly unless you treat him with medicine found earlier.
48. Footprints in snow that patrols notice and follow.
49. Moving-train roof sections where tunnels arrive with a whistle — duck or die.
50. Chapters against allied soldiers (Nationalist and Communist) where you may only knock out — and they arrest rather than shoot.
51. Firearms you can take from the enemy: limited ammo, one-shot kills both ways, and every shot alerts everyone in earshot.
52. Guards climb ladders, open doors and search multiple floors.
53. Civilians who witness violence scream and flee.
54. One-shot death, with a death screen of proverbs, poems and tips.
55. Checkpoints that faithfully restore world state (bodies, doors, keys, companions).
56. Environmental hazards: fire, falls, barbed wire.
57. Set pieces: air raids with blackouts over Chongqing, the Hundred Regiments' explosions.

**Systems & polish**
58. Chapter ranks (from *Ghost of Jinling* to *Tiger of the Yangtze*) and detailed stats.
59. 20 achievements.
60. Story / Normal / Hard difficulty, plus toggles for vision cones, noise rings, hints, text speed, volumes, film grain and fullscreen.
61. Procedural adaptive music in Chinese pentatonic modes (erhu, guzheng, suona, music box) and a Shanghai jazz band — it switches with the alert state.
62. Fully synthesized sound effects and ambient soundscapes (wind, rain, fire, river, train).
63. Weather: rain with lightning, snow, drifting embers, fog.
64. Painted parallax backdrops per region, with scrolling scenery on the train.
65. Dynamic lighting: darkness overlay, lamp glows, lanterns, flickering candles, film grain and vignette.
66. Autosave, continue, chapter select, and an endings & achievements gallery.
67. Mouse support in menus, dialogue and keypads.
68. Gamepad support (standard mapping).
69. Infinite-health cheat (Settings → Cheat: infinite health).
70. Undetectable cheat (Settings → Cheat: undetectable).

## Code layout

| File | Purpose |
| --- | --- |
| `js/util.js` | Constants, math, input, save storage |
| `js/audio.js` | Synthesized SFX, ambience and adaptive music |
| `js/sprites.js` | Procedural pixel-art character sprites |
| `js/portraits.js` | Portraits: vector painter + Pixel Studio pixel-art pass |
| `js/art.js` | Painted cutscene backdrops |
| `js/level.js` | Tile maps, collision, lighting, line of sight, parallax |
| `js/entities.js` | Player, enemy AI, civilians, companions |
| `js/objects.js` | Doors, hiding spots, lights, alarms, pickups, searchlights, projectiles, FX |
| `js/world.js` | A playable level: stealth rules, takedowns, checkpoints, rendering |
| `js/script.js` | Cutscene / dialogue runner |
| `js/story.js`, `js/scenes.js` | Story data and every scene script |
| `js/levels.js` | The 13 level layouts (built with a small map-builder DSL) |
| `js/ui.js`, `js/main.js` | HUD, menus, journal and the game loop |

## A note on history

Su Lan, Su Ming, Lu Zhiyuan, Han Tie, Fang Yu, Mori Takeshi, Madame Bai, Old Xu and Major
Kageyama are fictional. The historical figures' lines are imagined, drawn from what they wrote,
said and did. The game touches on the Nanjing Massacre of 1937 and the violence of the occupation
without depicting them graphically. It is dedicated to the memory of those who lived through them.
