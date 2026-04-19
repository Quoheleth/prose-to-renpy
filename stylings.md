# plane | crash — Styling Reference

## Overview

Color distinguishes speakers. Fonts, when not used to showcase divinity, distinguish ways of thought.

- Keltham's POV is always blue, but he often speaks Taldane — blue Crimson Pro for speech, blue Raleway for thought
- When Carissa speaks Baseline, her dialogue is red Raleway; her thoughts are red Crimson Pro
- Gods and divinities (Asmodeus and below in the table) have a faint outline/text shadow glow effect
- Background color: #ddd8d0

## Sample Dialogue (canonical input/output reference)

**Source text:**

She casts Tongues. "Say that again?" she says, in Baseline.

"Keltham. Dath ilan. I died in a plane crash and woke up here. What's the correlation between the strange gesture you just did, and your ability to communicate with me when you could not do so previously?"

(This sentence takes less than half as many syllables to say in Baseline as in Taldane.)

"- I cast Tongues, because it's a translation spell and you were speaking an unfamiliar language. You *died* and woke up here? This isn't an afterlife."

**Ren'Py output:**

```renpy
carissa "She casts Tongues. {font=raleway}\"Say that again?\"{/font} she says, in Baseline."

keltham "\"Keltham. Dath ilan. I died in a plane crash and woke up here. What's the correlation between the strange gesture you just did, and your ability to communicate with me when you could not do so previously?\""

dnarrator "(This sentence takes less than half as many syllables to say in Baseline as in Taldane.)"

carissa "\"- I cast Tongues, because it's a translation spell and you were speaking an unfamiliar language. You {i}died{/i} and woke up here? This isn't an afterlife.\""
```

---

## Character Style Table

| Ren'Py Label | Name | Font | Color | Weight |
|---|---|---|---|---|
| gnarrator | Golarion narrator/default | Crimson Pro | #2d2d2d | Regular |
| dnarrator | dath ilan narrator | Raleway | #2d2d2d | Regular |
| keltham | Keltham | Raleway | #2a4a7a | Regular |
| carissa | Carissa | Crimson Pro | #651e1e | Regular |
| pilar | Pilar | Crimson Pro | #940e57 | Regular |
| snack_service | Snack Service | Bubblegum Sans | #b5006a | Regular |
| asmodia | Asmodia | Crimson Pro | #390900 | Regular |
| ione | Ione | Crimson Pro | #34044d | Regular |
| peranza | Peranza | Crimson Pro | #542d3a | Regular |
| meritxell | Meritxell | Crimson Pro | #6b1a2a | Regular |
| yaisa | Yaisa | Crimson Pro | #7a4a3a | Regular |
| pl_girls | Other PL girls | Crimson Pro | #8b4a4a | Regular |
| cheliax | Cheliax general | Crimson Pro | #8b4a4a | Medium |
| abrogail | Abrogail | Crimson Pro | #8b1a1a | Medium |
| aspexia | Aspexia | Crimson Pro | #b60000 | Medium |
| maillol | Maillol | Crimson Pro | #6b3030 | Medium |
| subirachs | Subirachs | Crimson Pro | #7a3535 | Medium |
| abarco | Abarco | Crimson Pro | #5a2020 | Medium |
| gorthoklek | Gorthoklek | Cinzel | #4a1a1a | Regular |
| devils | Other devils | Cinzel | #8b4a4a | Regular |
| khemet | Khemet | Playfair  | #b0861f | Medium |
| fe_anar | Fe-Anar | Playfair | #8a6a20 | Medium |
| merenre | Merenre | Playfair | #9a7a30 | Medium |
| osirian | Osirian general | Playfair | #2d2d2d | Medium |
| nefreti | Nefreti | Philosopher | #4a2a6a | Regular |
| derrina | Derrina | Nanum Myeongjo | #2d2d2d | Bold |
| temos | Temos | Playfair | #2d2d2d | Medium |
| asmodeus | Asmodeus | Cinzel Decorative | #c01a1a | Regular + divine glow |
| abadar | Abadar | Playfair Display | #b0861f | Medium + divine glow |
| otolmens | Otolmens | Roboto Mono | #0a0a0a | Regular |
| cayden | Cayden Cailean | Boogaloo | #783f04 | Regular + divine glow |
| milani | Milani | Special Elite | #590808 | Regular + divine glow |
| nethys | Nethys | Philosopher | #6b389f | Regular + divine glow |
| irori | Irori | Nanum Myeongjo | #4a91b3 | Bold + divine glow |
| iomedae | Iomedae | Spectral | #666666 | Medium + divine glow |
| zon_kuthon | Zon-Kuthon | Almendra | #1a3a2a | Regular + divine glow |
| erecura | Erecura | Caudex | #3c7461 | Regular + divine glow |
| dispater | Dispater | Cinzel | #b60000 | Regular + divine glow |
| gods | Other gods | Inknut Antiqua | #2d2d2d (varies) | Regular + divine glow |

---

## Design Principles

- **Saturation** = divine vs mortal status (higher saturation = more divine)
- **Hue** = faction/individual identity
- **Divine glow** = two outline layers at reduced opacity, applied to all god/divine characters
- **SC variants** dropped across the board
- **Chelish cast tiers**: Asmodeus (max saturation) → Aspexia/Abrogail (brightest mortals) → Cheliax management (Crimson Pro Medium) → PL girls (Crimson Pro Regular)

## Font Sources

All fonts available on Google Fonts:
Raleway, Crimson Pro, Cinzel Decorative, Cinzel, Playfair Display, Nanum Myeongjo,
Bubblegum Sans, Philosopher, Special Elite, Spectral, Almendra, Caudex,
Inknut Antiqua, Roboto Mono, Boogaloo

## Open Questions
- Other gods color varies by character — assign as needed when they appear
