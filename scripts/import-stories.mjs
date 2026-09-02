import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---- Story 1 ---------------------------------------------------------------
const gatekeeper = `Chapter One — The Winding

The Hinge stood where the last lamp of the village gave up and the first dark of the moor began — a low gate of iron and river-stone no taller than Wren herself, set into nothing, fastened to nowhere, holding back everything. At dusk it was hers to wind.

She fitted the key — cold as a held breath, longer than her forearm — into the old lock and turned it the seven turns. With each turn the moor exhaled. Dreams came up out of the dark like moths off water: a silver hound for the baker who missed his dog, a staircase of warm bread, a boat for a boy who had never seen the sea. Wren counted them the way another child might count sheep — to be sure none were wolves.

"You count too carefully," said a voice from the black side. Two eyes, low and amber. "One of these nights you'll count yourself to sleep, little keeper, and then where will we all be?"

"Ash." She did not look at the fox. "Dreams only. Nothing else crosses. You know the rule."

"I know the rule. I also know the wind's changed. Something's leaning on the far door tonight, and it isn't a dream. You could light the high lamp yourself and see. Or you could let me go and look — I've eyes for the dark you don't."

▸ Wren lights the high lamp herself, keeping the watch alone.
▸ Or she sends Ash into the dark to look, and owes the fox a small favour.

Chapter Two — The Note

At the gate's foot, held down by a smooth white stone, lay a folded note. Wren knew the hand. Bram — the miller's youngest, who was not supposed to know the Hinge existed. All summer the notes had come. This one was folded tighter, the creases pressed hard, the way a child folds a thing they are afraid to say aloud.

She could read it, and feel the small human warmth of it here at the cold edge of everything. Or she could do what a keeper did with things that were not dreams: give it to the dark, unread, and keep the line between the worlds clean.

▸ Wren unfolds the note and reads it, letting the village in just once.
▸ Or she burns it unread, keeping the boundary whole.

Chapter Three — What Leans on the Door

By the second hour of full dark, the far side of the gate had stopped being empty. There was no shape to it — or too many shapes, none holding still. Where it pressed hardest, it began, gently, to resemble. A curve of shoulder she almost knew. For one lurching moment the darkness wore the exact tilt of Mattren's head, back when Mattren still had a head and not a voice in a post.

"Don't," said the gatepost, in Mattren's dry voice. "That's the Hollow, girl. The Long Dark that's older than the gate. It wants to be let in — by you, on purpose, with love. That's the only lock it can't pick. So it'll wear every face you're missing until you open the door yourself."

From the black, Ash's amber eyes. "The old post's right, for once. But there's more to know, keeper, and I know it. Whose warning would you rather carry into the dark?"

▸ Wren trusts Mattren's rule — hold the line, name nothing, open to no one.
▸ Or she trusts Ash's deeper knowing of the dark.

Chapter Four — The Crack

The Hollow spoke, at last, in a voice she had been aching to hear her whole small life — a mother's voice, though Wren had never had a mother. "You've been so careful for so long. Open the door, only a crack. Only to see me. You've earned a look."

And oh, she wanted to. That was the terrible thing no one warned you about being a keeper — not the cold, not the counting, but the wanting. Her hand found the bars.

"A crack is how it learns your face," warned the post. "A crack is how you learn its," murmured the fox.

▸ Wren opens the gate a thumb's width and looks.
▸ Or she holds it shut and turns away.

Chapter Five — The Price of a Feather

Ash came fully into the lamplight: threadbare, ancient, one ear notched by something with teeth. Not a trickster grown fat on mischief. A survivor. "The Hollow can't be pushed back by holding," Ash said, the play gone from its voice. "Only outlasted. Give me one barb of your key — one feather. I'll light a second fire behind the Hollow's back, and it'll be pinned between two lights and starve till morning."

"And if you're lying, I've handed the dark a piece of the only key there is."

"Then you've learned the last thing Mattren never did — whether you're a keeper who trusts, or only one who locks."

▸ Wren breaks off a feather of the key and gives it to Ash.
▸ Or she keeps the key whole, and faces the dark with one fire.

Chapter Six — Bram at the Gate

Then, worst of all, Bram came. Barefoot, white-faced, he had followed his own bad dream up the hill and found the true one. Behind him, the Hollow's mist was reaching past the last lamp toward the sleeping houses. It had found another way — through a boy who'd left the door of himself open by climbing up here at all.

"It's in my head," Bram whispered. "The nice voice. It says if I open the gate for you, you can come down. It says you're lonely too." His hand was on the latch — the human latch, the one the keeper could never touch from within.

▸ Wren crosses to the warm side to save Bram, leaving her post for one breath.
▸ Or she stays, and talks him back through the bars, keeper to the last.

Chapter Seven — The Empty Hand

However she reached him, Bram's hand came off the latch — and the Hollow gave up the borrowed faces and simply loomed: the honest shape of everything that has ever been missing, a grief the size of the moor. And it made its true offer.

"I am not your enemy. I am only the dark that hasn't been let in. Every keeper before you locked me out, and so I grew. Let me through — not with fear, with welcome — and I will not devour your village. I will become its night. A gate that only ever keeps out will one day break. Better a gate that learns, at last, to open."

Dawn was an hour off. She had the great key in one fist, and her other hand — empty, open, offered.

▸ Wren raises the key and holds the line until dawn.
▸ Or she lowers the key and offers the open hand.

Chapter Eight — Morning

THE KEPT WATCH. Wren raised the key and did not lower it. She held the line the way Mattren had, all the way back to the first cold hand that ever turned the seven turns: not by winning, but by not stopping. And dawn came. It always comes, to those who hold. The Hollow sighed back down into the deep dark, uneaten. Bram found her still at her post. "You stayed." "I always stay," said the Little Gatekeeper — and let the boy sit with her until full morning. That, she decided, was allowed.

THE OPEN GATE. Wren lowered the key and opened her hand. Not in fear. In welcome — the one lock the Hollow could never pick, turned at last from the inside. "Come in, then. But on our terms. Be the night, not the ending." The Hollow came through, and did not devour; it became, simply, evening — the good dark that makes a lit window mean something. The gate still stands. Wren still winds it at dusk. But now she reads the notes, and answers them, and Bram climbs the hill on clear nights to sit with the fox and the keeper while dreams cross like moths off water.

THE BROKEN HINGE. Having given a feather of the key to a threadbare fox on nothing but faith, Wren lowered her hand — and far out in the dark, Ash's second fire caught. Pinned between her open hand and the fox's stolen flame, the Hollow could only be held. The strain broke the Hinge; the iron gate split its stone and fell, and did not matter, because a gate is only needed where two worlds refuse to touch. "What are you now," Bram asked, "if there's no gate to keep?" "A neighbour," said Wren — and the three of them walked down the quiet hill into the first morning of a world that had finally been let in.`;

// ---- Story 2 ---------------------------------------------------------------
const moon = `Chapter One — The Dead Letter Office

Every letter the world gave up on came, eventually, to Ilse. The wrong addresses, the vanished streets, the names that had outlived the people who wore them — the post service swept them up the coast road to Gullstone Cliff, and it was Ilse's work to try, one last time, to find where each lost word belonged. Mostly she failed. Mostly she filed them. She read every one. A letter unread is worse than a letter unsent.

That first cold night of the spring tide, the envelope on the top of the sack was heavier than paper had any right to be, faintly warm, faintly glowing. The postmark was not a place. It was a small, perfect circle, silver-grey, cratered. The Moon, it said. And below, in a hand like frost forming on glass: To the one who waves back.

Kell the crow looked at the thing with one disapproving eye. "Rule of the office. You don't open what's not addressed to you." But nothing in all her pigeonholes had ever been addressed to Ilse either.

▸ Ilse breaks the seal and reads it.
▸ Or she files it, unopened, under undeliverable.

Chapter Two — Your M.

Whether she opened it that night or the next — for a second letter came, and a third — the words were always the same shape of longing. "You waved at me every night when you were small. From the same window, in the same town, with the same whole heart. Do you know how rare that is — to be waved at, faithfully, by someone who expects nothing back? And then, one night, the window was dark. I have been writing to that window ever since. Please. Wave back. Your M."

Whoever had waved at the Moon as a child had done so a very long time ago; the oldest returned letters in her pigeonholes were a hundred years faded. That window was almost certainly dark for the oldest reason windows go dark.

▸ Ilse answers the Moon herself — just waves back, comfort over accuracy.
▸ Or she searches for the real addressee, to deliver the letters truly.

Chapter Three — What the Moon Doesn't Know

The next letter came faster, and it was afraid. "Something is wrong. I feel a tide coming — the great spring tide, when the sea rises to meet me and, for one night in a hundred years, your cliff and my face are near enough to touch. It comes in nine nights. Tell me the truth, whoever holds this pen for me now — is my one who waves back still there? I would rather know than hope alone."

Ilse had the truth, or nearly. She could tell the Moon plainly that the window had been dark a hundred years. It would be true. It would also, perhaps, break a thing that had held itself together across a century of nights.

▸ Ilse tells the Moon the truth.
▸ Or she keeps the comfort intact, and races to make a kind promise real.

Chapter Four — The Oldest Window

Kell found the window. "Same town. Same street the postmarks fade from. There's one house left standing from a hundred years back — the almshouse. And in it, the oldest woman anyone remembers. Marta. Ninety-nine come the spring tide. They say she sits at the glass every night, waiting on something she won't name."

Ilse's heart went very still. The one who waves back. Not gone. Not dead. Only old — the one ending she hadn't dared to hope for.

▸ Ilse goes to Marta now, letters in hand.
▸ Or she writes to the Moon first, to prepare the ancient heart for age.

Chapter Five — Marta

Marta was small the way old people become small — folded down toward the earth. But when the moonlight crossed the sill, one hand lifted, an inch, in the ghost of a gesture worn smooth by ninety years. She was waving. Even now.

"It writes to me," she whispered. "It has always written to me. I could never read the letters — they burned my hands, too bright, so I sent them away, up the coast, to the place where lost words go. But I never stopped waving. You don't stop. It's the only one that ever stayed." She had sent them. All those letters in Ilse's oldest pigeonholes were Marta's own returned mail — a century of a correspondence she'd been too small, then too frightened, then too old to answer.

▸ Ilse reads the Moon's letters aloud to Marta at last.
▸ Or she lets the frail woman sleep, and carries the truth alone.

Chapter Six — The Great Tide

On the ninth night the sea forgot its limits. It rose up the cliff face until the black water lapped the very lip of the office door, and the Moon leaned down out of the sky until it filled half the world — so near that Ilse could see it was not cold at all but faintly, achingly warm, like a face pressed to the far side of a frosted pane. "I am here. Where is the one who waves back?"

She could have brought Marta — bundled the old woman up the cliff road so the child who waved and the Moon that waited could finally meet, whatever it cost. Or she could stand at the edge in Marta's place, and let the Moon's long story end looking at Ilse instead.

▸ Ilse brings Marta to the cliff's edge.
▸ Or she stands at the edge in Marta's place.

Chapter Seven — What to Give the Moon

However she came to the edge, Ilse stood at the end of the century with the Moon's whole attention on her, and one last thing to decide: what to give it. The whole truth — that the one who waves back is ninety-nine and near the end, and never stopped waving, not once. Or a kindness shaped like a story — that the waving simply goes on, that Ilse herself will take it up, so the Moon is never again unanswered.

The tide would not hold much longer. She raised her hand. The Moon leaned close enough to touch.

▸ Ilse gives the Moon the whole truth.
▸ Or she gives it a kindness, and takes up the wave herself.

Chapter Eight — After the Tide

THE TRUE TIDE. Ilse wheeled Marta to the very lip of the flooded cliff, and the old woman lifted her worn-smooth hand into the moonlight one final time — the whole of it, a hundred years of it, spent at once. And the Moon saw her — the way only something that has watched you your entire life can — and the light that fell on her face was recognition. There you are. "I never stopped," Marta whispered. "I know," said the Moon. "I felt every one." Marta went, gently, a few nights after — but she went answered. She went having been met.

THE KIND WAVE. Ilse raised her hand at the cliff's edge and did not correct the Moon's hope. "I'm here" — and it was not quite a lie, because by now it was almost true. Somewhere in these nine nights she had become the one who waves. Marta slept on, spared the flood of it, and slipped away in her own good time. Ilse writes to the Moon now, every clear night. The keeper of lost words has, at last, letters of her own — signed, and answered, and never again unread. She waves. The Moon waves back.

THE RETURNED LETTER. Ilse filed the warm envelope under undeliverable, and kept the rule. The great tide came and went; the Moon waited the whole long night for a hand that never rose, and drew slowly back up into its sky, and did not write again. And yet she never filed it deep. It stays on the top of the stack, faintly glowing, where her hand falls on it a dozen times a day. On the coldest nights she takes it down and holds it, unopened, and thinks: next tide. There is always, in a hundred years, a next tide.`;

// ---- Story 3 ---------------------------------------------------------------
const firstlight = `Chapter One — The Long Grey

Ember had never seen the sun. No one under forty had. For as long as the valley could remember, the sky had hung at the same soft grey — a permanent hour-before-dawn that never tipped over into morning. They called it the Long Grey, and they had learned to live inside it, and to forget, mostly, that the word colour had ever meant anything but a story old people told.

It was Ember's work, apprenticed to old Wick, to light the lamps — not for brightness, but for the small gold comfort of a flame in a world that had none of its own. She was lighting the last lamp on Miller's Row when she saw it, caught in a single bead of dew: a spark. Not lamplight — this was fierce. A colour like a struck match multiplied a thousand times, and when it touched the edge of her sight the whole world seemed, for half a breath, to remember itself. A single seed of true dawn.

Her hand closed around it before she'd decided to. The first true light in the valley in forty years. "Ember?" came Wick's voice, blind eyes turned toward her. "You've gone quiet. What have you found?"

▸ Ember hides the spark and says nothing.
▸ Or she shows Wick at once.

Chapter Two — Why the Grey Was Lit

Wick knew the spark for what it was the instant its warmth reached his ruined eyes. "So it's thinned at last. The grey. Listen to me, girl. The grey isn't a curse that happened to us. It's a lamp — the biggest one I ever lit, the whole sky of it — and I lit it on purpose, the night the light went out, to keep something asleep. There was a morning here once, and in the morning there was a thing that woke and walked and took. When I put out the true dawn and hung the grey in its place, the thing went back to sleep. That spark isn't a gift. It's the crack in the door."

It was a terrible story, told with a lamplighter's certainty. But the grey had every reason to make its keepers afraid of morning. A cage tells you the outside is full of wolves.

▸ Ember believes Wick's warning.
▸ Or she doubts it — a story that keeps you in the dark deserves a hard look.

Chapter Three — Rue, Who Fears the Light

Rue found her on the hill. Rue had been born in the grey; to her, the colourless sky was simply the world, and the stories of morning were frightening, because everyone who spoke of colour spoke of it the way you speak of the dead. "Whatever you're holding, put it out. It makes me want things. It makes me remember things I never even had. That's how it starts, isn't it? First a little colour, then you can't live in the grey anymore, and then you're one of the old ones, crying at a sky that won't come back."

▸ Ember shares the spark with Rue, trusting the truth of light.
▸ Or she closes her hand and spares her friend the ache.

Chapter Four — Beyond the Wall

The spark had been growing. She carried it to the valley's edge, to the grey wall everyone said was the end of the world, and held it against the mist. And the grey turned to glass. Beyond the wall was not nothing. Beyond the wall was the world — green and gold and impossibly blue, rolling away to a horizon under a sky that had a sun in it, low and warm and rising. The valley was a single grey room the size of a life, and outside it the morning had been going on, all this time, without them. The lamps didn't keep a monster asleep. They kept the valley from knowing there was anywhere else to go.

▸ Ember steps through the thinned wall into the morning.
▸ Or she stays, and carries the truth home for her people to choose.

Chapter Five — What Wick Buried

Wick was waiting for her, as if he'd known. And in the spark's growing light, the grey behind him thinned too — and showed her what he had hidden at her back the whole time. The lower valley. Drowned. A whole quarter of the town under a flat grey flood that never moved, roofs and steeples breaking the surface.

"The morning it woke was the morning the river came. Half the valley in one dawn. I couldn't let them live in a world where they had to see it, every morning, forever. So I put the morning out. In the grey, the flood is just mist. You can walk past your drowned street a thousand times and never have to know it's there. I didn't lie to keep you afraid. I lied to keep you from a grief the size of the sky."

▸ Ember keeps Wick's secret, and lets the grey be mercy.
▸ Or she insists on the truth — a grief unseen is a grief unhealed.

Chapter Six — The Sleeper Stirs

The spark had grown too bright to hide. As its light strengthened, the grey flood woke — the still mist-water beginning to shimmer, to remember it was a reflection; and rising off it came the Sleeper at last, not a monster but a grief made visible: every lost face, forty years of un-mourned loss trying to be seen at once. The valley would feel it any moment. She had the spark in her hands, brighter than a heart.

▸ Ember faces the Sleeper with the light, letting the grief become morning.
▸ Or she smothers the spark, and lets the grief sleep another generation.

Chapter Seven — The Choosing of the Dawn

The spark was a small sun now, and Ember stood on the ridge above the whole sleeping grey valley, and the light in her hands was ready to become a sky. She could free it — open her hands and let the true dawn rise entire, flood the valley all at once, wake every grief and colour together, no going back. She could share it — carry the light down slow, door to door, and offer each soul the morning by choice. Or she could keep it — hold a single warm morning for herself and Rue and Wick, and let the great grey stay drawn.

▸ Ember frees the full dawn for all at once.
▸ Or she shares it, door to door — a dawn at the speed of consent.

Chapter Eight — Morning

FULL MORNING. Ember opened her hands. The dawn did not creep; it broke — poured down the ridge and into every grey street at once. Colour slammed back into the world, and the drowned quarter woke fully into the light, unhideable now, seen. The Sleeper rose entire — and did not devour, because a grief that is finally, fully witnessed cannot devour; it can only, at last, be grieved. The whole valley wept for the drowned they had walked past blind for a lifetime, and when the weeping was spent, the morning was still there. You can survive seeing what you lost, if you see it in the light, together.

THE SHARED DAWN. Ember carried the little sun down and knocked on doors, giving the morning the way you should give any holy thing: by asking first. To those ready she opened her hands; to those who weren't, she left the grey drawn gently and said, when you're ready — morning always keeps. The dawn spread at the speed of consent, and the drowned quarter surfaced a roof at a time, mourned by those strong enough. Even Rue, in the end, opened her window. "It still aches." "It's supposed to," said Ember, and they watched the sun come up over a valley that had decided to let it.

THE KEPT SPARK. Ember closed her hands around the little sun, and the great grey stayed. She could not loose a flood of unasked-for grief over a whole sleeping valley. So she built the spark a lantern of dark glass, and there it burns still: one small private morning, held for the few who know. But she never sealed the lantern. On the quietest grey mornings she holds it to the window and lets its light thin the mist just enough to see the shape of the drowned roofs, and remember they're there — and know the morning is only ever a hand's-opening away. A kept spark is still a spark. The door is closed. It is not locked.`;

const rows = [
  {
    id: 201, title: "The Little Gatekeeper", author: "Libry Originals",
    price: 0, type: "Interactive", category: "Fantasy", is_free: true,
    description: "Every dusk, a small keeper winds open the gate between the waking village and the country of night — and decides what may cross. An interactive tale of thresholds, in eight chapters, with three endings.",
    sneak_peek: "The Hinge stood where the last lamp of the village gave up and the first dark of the moor began — a low gate of iron and river-stone, holding back everything.",
    content: gatekeeper, pages: 8, status: "Ongoing", language: "English",
    rating: 0, reviews: 0, created_by: "Libry Originals", age_rating: "Everyday",
  },
  {
    id: 202, title: "Letter from the Moon", author: "Libry Originals",
    price: 0, type: "Interactive", category: "Fantasy", is_free: true,
    description: "In a cliff-top office where undeliverable letters go to be forgotten, a keeper receives an envelope postmarked from the Moon. An interactive tale of correspondence across an impossible distance, in eight chapters, with three endings.",
    sneak_peek: "Every letter the world gave up on came, eventually, to Ilse. That cold night of the spring tide, the envelope on top of the sack was faintly warm, faintly glowing.",
    content: moon, pages: 8, status: "Ongoing", language: "English",
    rating: 0, reviews: 0, created_by: "Libry Originals", age_rating: "Everyday",
  },
  {
    id: 203, title: "First Light", author: "Libry Originals",
    price: 0, type: "Interactive", category: "Fantasy", is_free: true,
    description: "In a valley locked for a generation under an endless grey half-light, a lamplighter's apprentice catches a single spark of true dawn. An interactive tale of an ending dark and a chosen dawn, in eight chapters, with three endings.",
    sneak_peek: "Ember had never seen the sun. No one under forty had. Then, caught in a single bead of dew, she saw a spark — fierce, and warm, and the colour of a morning the valley had forgotten.",
    content: firstlight, pages: 8, status: "Ongoing", language: "English",
    rating: 0, reviews: 0, created_by: "Libry Originals", age_rating: "Everyday",
  },
];

// Try with is_published (post-0008); fall back without it.
let payload = rows.map((r) => ({ ...r, is_published: true }));
let { data, error } = await supabase.from("books").upsert(payload, { onConflict: "id" }).select("id");
if (error && /is_published/.test(error.message)) {
  payload = rows;
  ({ data, error } = await supabase.from("books").upsert(payload, { onConflict: "id" }).select("id"));
}
if (error) { console.error("IMPORT ERROR:", error.message, error.details || ""); process.exit(1); }
console.log("Imported/updated", data.length, "interactive stories:", data.map((d) => d.id).join(", "));
