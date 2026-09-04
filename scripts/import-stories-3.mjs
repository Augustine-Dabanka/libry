import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---- Story 9: One Small Seed ----------------------------------------------
const seed = `Chapter One — The Find

Sable found it in the gutter of the ninety-first floor, where the wind piled the city's forgotten things: a single seed, brown and teardrop-shaped, no bigger than her smallest fingernail. Nobody her age had seen one loose like this — seeds were in the sealed vaults, kept safe against a someday that never came, and the city grew nothing at all, only glass and grey and recycled air. But Gran Ivo had shown her pictures. A seed. A whole tree folded up small enough to lose in a gutter. A promise you could hold in your palm.

Every choice she made from here would be about this seed, and she knew it, standing on the ninety-first floor with the grey wind pulling at her coat.

▸ Sable hides it away safe, and tells no one.
▸ Or she takes it straight to Gran Ivo, who remembers gardens.

Chapter Two — The Man Who Remembers Gardens

Gran Ivo grew three scraggly tomato plants in salvaged buckets under stolen light in a stairwell — illegal and half-alive and the only growing things for a hundred floors. When Sable opened her palm, he went very still. "That's not a vault seed. Vault seeds are coated, numbered, dead-until-permitted. This one's wild. Fell off something, blew in, survived. It means the city didn't grow this and the city can't control it. This is either the most hopeful thing I've seen in thirty years or the most dangerous, and in this city those have always been the same thing." Planting meant soil — and there was no clean soil in the towers, only poisoned dust. He knew where real soil might still be. Down. Far down, below the permitted levels.

▸ Sable resolves to plant it, wherever the soil is.
▸ Or she keeps it safe a while longer — one wild seed, irreplaceable.

Chapter Three — The Warden's Rule

The Warden sent for her. He was not cruel, which was the confusing thing. "We had gardens once. Then the blight came, thirty years back, and it came through the growing things — jumped plant to plant until half the city was choking, and we had to burn every green thing to the roots to stop it. So we sealed the seeds. We permitted nothing. Not out of hate. Out of grief. One wild seed, uncoated, is exactly how it starts again. Give it to me. I'll keep it safe in the vault. That's not cruelty. That's the only kindness a burned city has left." He might even be right. That was the terrible part.

▸ Sable gives the seed to the Warden's vault.
▸ Or she keeps it and refuses — a sealed seed is just a slower death.

Chapter Four — The Boy Who's Never Seen Green

The lower levels heard of the seed, and that is how Sable met Wick — younger than her, and sick, the lower-level sickness that comes from a life breathed entirely through vents. He had never once seen a growing thing. "They say you have a real one. Can I just see it? I've never seen the start of anything alive." She showed him, and watched one small brown seed become, in his hollow face, the single most valuable object in the grey city — not for what it was but for what it promised.

▸ Sable gives Wick the seed — the hope matters most in the hands that need it most.
▸ Or she keeps it, and promises him the harvest — the first green leaf, when it grows.

Chapter Five — The Long Way Down

A seed given and a seed kept both come to the same need: ground to grow in. And the only ground left alive was down — below the permitted levels, below the Warden's writ, the original earth the city was built on top of, maybe still alive in the dark. The stairs went down forever, and the air changed as she descended, until at the very bottom it smelled of something she had no word for: earth. Real, dark, living earth. But she was not alone. The Warden had come too — not with guards, just himself, tired and afraid — and stood between her and the soil.

▸ Sable pushes past the Warden and reaches the living soil.
▸ Or she stops, and hears him out first.

Chapter Six — What the Warden Buried

The Warden knelt in the living dirt, and the mask of the office came off. "I planted the last legal tree in this city, thirty-one years ago. And I watched the blight take it — green to grey to gone in a week — and I gave the order to burn it, my own tree. I sealed the seeds because I could not survive watching another green thing die. I didn't stop the gardens because I stopped believing in them. I stopped them because I believed in them too much to bear losing one again. And now here's a wild one, in the last living soil, and I followed it down here because part of me needs to know if it will grow. Even though it terrifies me. Because it terrifies me." He was not the wall. He was a gardener who had buried his own hope so deep he'd forgotten it was only sleeping.

▸ Sable plants the seed now, together with him.
▸ Or she asks the Warden to plant it himself — gives the beginning back to the one who was forced to end them.

Chapter Seven — The Planting

The seed went into the living ground — and then came the last decision. A planted seed is a secret you can't keep; it will sprout, or it won't, and if it sprouts, the city will know wild green is growing in the deep, ungoverned and uncoated, exactly the door the Warden burned everything to close.

▸ Sable tells the whole city — lets hope and terror both run wild, and trusts the city to choose green with its eyes open.
▸ Or she keeps it secret until it's strong — grows a tree in the dark before the frightened can vote to burn a sprout.

Chapter Eight — What Grew

THE CITY CHOOSES GREEN. Sable climbed back up and told everyone: there was a wild seed growing in the living ground beneath their feet, and the Warden himself had knelt in the dirt and planted it, and the city could burn it in fear the way it had burned everything for thirty years — or choose green with its eyes open. And the grey city, which everyone thought was only afraid, turned out to be mostly just tired of being afraid. They chose the seed. They took turns going down to tend it. The Warden unsealed the vault, carefully, watched, and the numbered dead seeds woke one by one beside the wild one. It was not safe. Green never is. But Wick lived to press his hand against the bark of the first wild tree the city had grown in thirty years. One small seed. It was always, it turned out, enough.

THE SEED IN THE DEEP. Sable told no one, and grew the seed in the dark — she and Gran Ivo and the Warden, an unlikely three, going down the long stairs in secret to tend a green thing rising where nothing had grown in thirty years. A sprout announced is a sprout the frightened can burn, so they let it grow until it was no longer a sprout but a tree, rooted and impossible to unmake. It is still down there, growing, secret, patient. Someday it will be too big to hide, and the city will have to reckon with a living tree in its foundations whether it's ready or not — and Sable has decided a city presented with a tree will choose more bravely than a city warned of a seed.

THE GIFT. Sable gave the seed away, and did not plant it herself, and that turned out to be its own kind of planting. If she gave it to Wick, he kept it in a twist of cloth against his heart, and it did not grow — a seed in a pocket never does — but he did, a little, because a person with one wild hope breathes differently than a person with none. If she gave it to the vault, the Warden could not stop turning the case to look at the one wild seed among his coated ones, and it was that looking, years later, that made an old frightened man decide it was time to try the deep ground again. The seed never grew. But it was the reason, eventually, that something did. Giving a hope away is sometimes exactly how you plant it.`;

// ---- Story 10: Pariahner ---------------------------------------------------
const pariah = `Chapter One — The Chosen

Old Mareh died on a Tuesday, and by Wednesday the town needed a new Pariahner, because a town like Coldwater cannot go even a week without somewhere to put the things it can't hold. The lot fell, and the mayor read the name, and the town turned its collective back — not in hatred, but in the practiced, total not-seeing that was the whole of the role. From this day Nor would live in Mareh's house at the wall's far side. No one would greet them in daylight, or touch them, or love them where the sun could see. And in the dark, one by one, the whole town would come to Nor's door and hand over the truths that were rotting them from inside. To be the most needed and least acknowledged person in Coldwater. To hold everyone, and belong to no one.

▸ Nor crosses the wall and takes up the role.
▸ Or Nor refuses to cross — no lot should unmake a person's whole belonging.

Chapter Two — The First Confession

The first one came the very first midnight — the miller's wife, cloaked, who confessed a cruelty to her own sister she had carried for eleven years. She did not want forgiveness; the Pariahner is not a priest. She wanted only to set it down — to hand her rotting truth to someone outside the web of the town, and walk home a pound lighter. Nor held out their hands, and felt the weight arrive, real, settling in like a swallowed stone. This was the whole of the work: to be the place a town's poison could go and not spread.

▸ Nor receives the secret with mercy, holding her shame gently.
▸ Or with the resentment of the newly-exiled — let the town feel the cost.

Chapter Three — Del, in Daylight

The hardest one was Del — Nor's oldest friend, inseparable since they were small, now inside the wall while Nor was outside it. They passed on the street and Del looked straight through them, because a single acknowledged glance would break the fragile machinery of the role. And then Del came in the dark, like everyone came, with a confession of their own: that the not-seeing was killing them, that pretending their oldest friend was invisible was its own unbearable weight.

▸ Nor holds Del's secret kindly, and makes even the shunning painless.
▸ Or Nor lets Del feel the cost — you don't get to shun someone all day and be comforted all night.

Chapter Four — What Mareh Left

Mareh's house was full — every wall, tied bundles of the town's confessions reaching to the rafters, with a note on top: for whoever holds them next. And Nor learned the thing the town had never told them. "We are not a place to put the shame," Mareh had written. "We are the only one who can see what the shame is doing." By holding them all, one person could see the pattern the town refused to — the same cruelties repeated generation to generation, Coldwater slowly poisoning itself in the same ways over and over. "That is either the town's mercy or its greatest cowardice, and I have spent forty years unable to decide which."

▸ Nor decides the role is a sacred, necessary keeping.
▸ Or a cruelty dressed as tradition — a scapegoat invented so no one else has to be honest.

Chapter Five — The Secret That Should Not Be Kept

A man came in the dark and confessed a living wrong — not an old rotting guilt but a present crime, a harm he was doing still to another person in the town who did not know. He set it down expecting the role's iron rule: the Pariahner holds, and does not tell, ever. And Nor sat with this stone that was not a stone but a knife still cutting. The rule was clear. And the rule was wrong, here — to hold a secret still hurting someone was not mercy but complicity in silence.

▸ Nor keeps the seal, even now — the role holds everything or it holds nothing.
▸ Or Nor breaks it to protect the victim — some seals should not survive.

Chapter Six — The Blame

The harvest failed that autumn — blight in the low fields — and Coldwater, frightened, did the oldest thing a frightened town does: it looked for a vessel to pour the fear into. They came to the wall in daylight, seeing Nor for the first time, but only to blame. The mayor spoke the old words: that the Pariahner holds not only the town's secrets but, when needed, its misfortune; that a scapegoat is not only for shame but for blame. Take this too, their faces said. Take the blame for the blight, so we don't have to sit in the terror of a thing that is no one's fault.

▸ Nor absorbs the blame — be the vessel completely, spare the town even its own fear.
▸ Or Nor refuses to be the vessel — I will hold your shame, but I will not hold your lie.

Chapter Seven — What to Do with the Weight

It brought Nor to the wall one last time, with the whole of it — Mareh's forty years and Nor's own, the tied bundles, the held stones, the secrets and griefs of every soul in Coldwater — and one final choice.

Nor could carry it in silence forever — take up the sacred vigil, be the unseen keeper, let Coldwater live clean and cowardly and cared-for. Nor could give it back — return to each soul the stone they set down, unmake the scapegoat, let the town fracture and face itself. Or Nor could bring it into the open — not hurl the secrets back as weapons but speak the pattern Mareh saw, gently, and offer Coldwater the one thing a scapegoat exists to prevent: the chance to carry its own weight, together, in the light.

▸ Nor carries it in silence, forever — the lonely sacred keeping.
▸ Or Nor brings it into the open, and ends the need for a Pariahner.

Chapter Eight — The Wall

THE SPOKEN TOWN. Nor stood at the wall and did not throw the secrets like stones. Nor spoke them — carefully, without names where names would only wound, but wholly: the pattern the town had never let itself see. And because Nor had held every one of those secrets with mercy first, it was the mercy the town heard — not an accusation but an offering, from the one person who had earned the right to tell it by carrying all of it. Coldwater, given for the first time the chance to hold its own weight in the light, together, discovered it was stronger than the tradition had ever let it be. They took the wall down stone by stone. There was no next Pariahner. Del was the first across the unmade wall, in daylight, to take Nor's hand where the whole town could see.

THE FAITHFUL PARIAHNER. Nor took up Mareh's vigil, and carried the weight in silence, and did not tell. They decided — clear-eyed — that Coldwater was not ready to hold its own truths, and that the mercy of a keeper who bears the unbearable so others can live is a real mercy even when it is also a cowardice. So Nor stayed at the wall. Held the stones. Loved the town in the total, unseen, sacred way that only a Pariahner can — entirely, and for nothing, and alone. It is a lonely ending, chosen awake. But on the hardest nights Del still comes in the dark, just to sit, and holds the hand the daylight forbids — and Nor understands that even a Pariahner is not, in the end, entirely without love.

THE GIVEN BACK. Nor stood at the wall and gave it all back — not gently. Each soul got their own secret returned in daylight, and the town that had spent generations pouring its poison into an exile suddenly had to hold all of it at once, itself. It fractured. Old cruelties came to light and cost what they deserved; buried griefs surfaced and had to be grieved in the open. It was harder and more honest and far less kind than it might have been. But there is no more Pariahner. No one is unseen anymore, because a town forced to hold its own truths has no use for someone to be alone on its behalf. It is not a warm ending. It is a true one. Nor decided the town was owed the truth more than it was owed the mercy.`;

// ---- Story 11: The Lighthouse Keeper's Cats -------------------------------
const cats = `Chapter One — The Rock

The supply boat left Bri on the rock with her sea-bag and a warning not to get attached. There were cats in every window — one grey, two tabby, a black, a torn-eared orange, more — a whole warm population watching her come. The lighthouse threw its beam out over the dark water, steady, faithful. Sten met her at the door, old, stooped, forty years of weather in his face. "Mind the cats. Always mind the cats; that's most of the job, though the Service won't tell you so. You've kept a light before?" "No," said Bri. "I've kept nothing. That's rather why I came." "Nobody comes to a rock like this who isn't running from a drowning of their own," Sten said gently, and did not ask.

▸ Bri accepts the post there and then.
▸ Or she hesitates on the threshold, guard up.

Chapter Two — What the Cats Are

That first night, by the fire, ringed with sleeping cats, Sten told her. "The light saves the ones it reaches in time. But the light doesn't reach them all. Some nights the sea's faster than the lamp. And the ones it can't save in time — the drowned — some of them come ashore. Here. As these. One arrives on the rock the morning after every wreck the light couldn't stop. One cat, for one soul, cold and half-here and not ready. And the keeper's real work is to take them in. Keep them warm. Keep them companioned. Until each one, in its own time, is ready to walk down to the water and go on to wherever the drowned finally rest." Thirteen cats. Thirteen drowned sailors, kept warm until ready to finish dying.

▸ Bri believes him.
▸ Or she doubts it — they're only cats, and a lonely old man tells himself stories.

Chapter Three — Learning to Keep

Bri learned the double rhythm of the rock: the light and the cats, the living and the drowned. Wind the lamp at dusk; feed the thirteen at dawn. Keep the beam steady for the boats out there; keep the fire steady for the souls in here. And she learned the cats — the orange tom, a fisherman forty years drowned who simply liked it here; the two tabbies who had come the same night and would cross together. Each cat a person. Each person a grief the sea had made and the keeper now kept warm. It was tender work, and it asked a tender heart — the one she'd brought to the rock precisely to stop using.

▸ Bri tends the cats with open love, giving them the heart she came to hide.
▸ Or she tends them with her heart guarded — do the work, but don't love thirteen things the sea already took.

Chapter Four — The Fourteenth

Three weeks in, the sea was faster than the lamp. Bri worked the light all night through a screaming storm and saw the little boat too late — saw the beam find it a heartbeat after the rocks did, and there was nothing the light could do but shine on what it couldn't save. "You'll do that too," Sten said. "The weeping. It doesn't stop. It's not supposed to." And in the morning, on the rocks, cold and soaked and half-here, was a fourteenth cat, looking up at her with the particular lostness of the newly drowned.

▸ Bri gathers the new soul in, from its first cold morning.
▸ Or she freezes at the top of the steps — it's too much, too like the thing she came to escape.

Chapter Five — The Keeper's Real Work

Sten fell ill — the rock takes its keepers in the end — and taught her the last of it. "Keeping them warm isn't the whole work. The hard part is knowing when each is ready, and helping it go. They come here to rest, not to stay. There's a morning for each of them, and on that morning your job is not to hold them — your job is to carry them down, and let them go. The worst keepers keep the cats past their time. Fill the tower with souls that are ready to rest and can't, because the keeper needs them more than they need keeping. That's not love. That's a cage with a warm fire in it. When it's their morning, you let them go." He was asking her for the one thing she'd come to the rock to avoid: to let the sea take what it's owed, with her own two hands.

▸ Bri accepts the duty of letting go.
▸ Or she refuses it — she'll keep them all warm forever if she can.

Chapter Six — The Small Grey Cat

Sten crossed himself, in the end — Bri woke to find him gone and a new stooped old tom by the cold hearth, in no hurry, watching the flames. And that was when she finally looked at the small grey cat she'd been avoiding since the first night. It had arrived two years ago, on a specific autumn night, from a specific wreck, off a specific stretch of coast. Bri knew that wreck. Bri had a twin sister who had gone down in it — the drowning she had come to the end of the world to run from. The small grey cat looked up at her. And it knew her. Not the way a cat knows a person. The way a sister knows a sister. She had been sleeping thirty feet from her the whole time.

▸ Bri gathers her sister up and resolves to never let her go.
▸ Or she begins, however it hurts, to consider letting go.

Chapter Seven — Her Sister's Morning

The morning came, as Sten promised every soul's morning comes. Bri woke and knew it: the small grey cat sitting by the door, looking toward the sea, calm and whole and ready in a way it had never been in two years. Her sister was ready to cross. Bri could feel her readiness like a warmth going quiet — a thing that had finished what it came to finish and only needed the door opened and one keeper willing to let the sea, at last, have her.

▸ Bri carries her sister down and lets her go.
▸ Or she keeps the door shut and holds her — not yet, not her, not the other half of herself.

Chapter Eight — The Sea at Dawn

THE CROSSING. Bri opened the door and carried her sister down to the water — the hardest walk of her life and the only one that mattered. At the line where the water met the stone she set her down, and her sister looked back once, the whole of her, and then stepped into the sea and did not sink but dissolved, into light, into the pale dawn water, going on at last to wherever the drowned rest. Bri knelt in the surf and wept, and was, underneath the weeping, for the first time in two years, unclenched. She keeps the light now, and the cats, and she is a true keeper — which she understands, finally, to mean not someone who holds the drowned but someone brave enough to warm them and then let them go. It breaks her every time. That is the work, and it is the truest love she has ever done.

THE FULL HOUSE. Bri barred the door and scooped the small grey cat back to the fire, and did not let her sister cross — and after, could not bring herself to release any of them. So the tower filled: every soul the light can't save, warm and fed and held well past their morning, ready to rest and unable to, because their keeper needs them more than they need keeping. It is exactly the cage-with-a-fire Sten warned her against, and Bri knows it, and cannot stop, because at the center is one small grey cat by the hearth, and letting even one soul cross feels like agreeing her sister must cross too. A lonely faithfulness, and a selfish one, and a human one. She keeps the key on a string around her neck, and does not turn it, and does not throw it into the sea. Not yet. Maybe not ever. But she keeps it.

THE KEEPER. Bri became a true keeper of the light and the cats — and made, for herself, one honest exception. She learned to carry each soul down when it was ready, releasing the drowned to their rest. But her sister she keeps — not forever, not past all reason, but not yet. On the morning the small grey cat sat ready by the door, Bri pressed her forehead to its head and said: "Not today. I know you're ready. I'm not. Give me a while longer. When I can, I'll carry you down myself, I promise you." And her sister settled back by the fire to wait a little more, because the drowned are patient, and love is patient. It is not the cleanest ending — but there is a difference between a cage and a long goodbye. She keeps the light. She frees the drowned. And by the fire, a small grey cat waits for the morning her sister is finally brave enough to give her.`;

// ---- Story 12: A Letter to Myself -----------------------------------------
const letter = `Chapter One — The Returns Office

Elle found the Returns Office on the worst night of her thirty-fourth year, the way people always find it — not looking, and looking for nothing else. She had been walking in the rain, turning over the familiar litany: the music she'd stopped making at twenty; the city she'd meant to live in; the version of herself that seventeen-year-old Elle had promised so fiercely to become, and that thirty-four-year-old Elle had quietly failed to be. And there was a narrow gold-lit window and a brass plate that said only RETURNS. "We keep the letters that were never quite sent," said Mr. Oke, the old keeper. "But now and then someone comes in on a night like yours, and I can offer them one letter. Delivered backward. To one moment of your own past — a single hour of your choosing, to receive one letter from the you that you became." She wasn't laughing. There was a blank sheet on the counter and one hour of her whole past she would give anything to reach.

▸ Elle takes the offer seriously.
▸ Or she holds back, wary — she wants it too badly to trust it.

Chapter Two — The Price of a Sent Letter

"There is a cost," Mr. Oke said. "This isn't advice. It's a change. A letter delivered to your past reaches a self who will act on it — and if she acts differently than you did, the path forks there, and everything downstream may be unmade. The regrets, yes. But the rest of it too. Everyone you've met since. Everything good that grew out of the wrong turns. You cannot rewrite only the parts you'd like back." Elle thought of the music she'd give anything to have kept. And then, unbidden, of everything that had happened because she stopped — the person she'd met, the— She stopped that thought before it finished. She wasn't ready.

▸ Elle decides the chance to fix it is worth the risk.
▸ Or she hesitates — the cost is enormous, and she has to reckon with what "everything" contains.

Chapter Three — Which Hour

"Which hour would you send it to?" She knew the answer before he finished asking. She was seventeen, with a letter in her hand — an acceptance, a place at a conservatory in the city she'd dreamed of, the whole map of the life she was supposed to have — and she had, in that hour, said no. Turned it down. Stayed. Taken the safe local path that led, eventually, here: to a low night in the rain at thirty-four. That hour. The no. But there was another, smaller hour her mind kept flinching toward: a warning she could send instead, to prevent not a regret but a harm.

▸ Elle chooses the hour of the no — the conservatory she turned down.
▸ Or a smaller hour — a warning to prevent a single wound.

Chapter Four — What the Wrong Turn Grew

Elle went home to think, and finally finished the thought she'd been stopping. The safe path — the no, the staying — had led, three turns later, to a person, and to a small bedroom down the hall where a six-year-old named Juno was asleep in the moonlight. Her daughter. Who existed, entirely and only, because seventeen-year-old Elle had said no to the life she was supposed to want. Redraw that hour, take the yes, and Juno would simply not be — erased not by death but by never-having-happened, which is somehow worse. The regret and the daughter were the same choice.

▸ Elle steels herself — the letter, even now.
▸ Or she lets it change everything — a daughter is not a wrong turn to be corrected.

Chapter Five — What to Write

Elle sat at the kitchen table at 3 a.m. with the blank sheet, and had to decide what a letter to your past self even says. She could instruct — tell seventeen-year-old Elle exactly what to do: say yes, go, keep the music. A letter that steers. Or she could comfort — write not a command but a hand on the shoulder: whatever you choose, you'll be okay; it won't look like you planned, and you will survive all of it and love your life in ways you can't imagine from there. Juno's drawing was pinned to the wall — a stick-figure Elle at a piano, MUMMY PLAYING in six-year-old capitals, though Elle never played, a life Elle hadn't lived rendered in crayon by a child who loved her.

▸ Elle writes to instruct her past self — steer the choice.
▸ Or she writes to comfort her past self — hold, don't steer.

Chapter Six — What Mr. Oke Knew

Elle brought the folded letter back at dawn, and Mr. Oke told her the thing he told everyone. "In forty years, do you know how many actually sent the letter — chose to unmake their lives for a different one? Almost none. Because somewhere between the counter and the coming back, nearly all of them work out the true thing: that they never really wanted to change the past. They wanted to forgive it. And writing an honest letter to the self you've been so angry at — really writing it — does the forgiving all by itself. The sending was never the point. The writing was the point." He set her folded letter on the counter. "But the offer's real. If you want to send it, I'll deliver it. Only know what you're choosing."

▸ Elle believes him — the writing was the point.
▸ Or she insists on the real change — she came for a rewrite, not a therapy session.

Chapter Seven — The Letter

It came to the counter: the letter, the chute, the choice made real. She could send it — drop it in the chute, rewrite the no into a yes, wake tomorrow the musician in the city she'd dreamed of, and lose the ordinary sweet life and the six-year-old in it. She could keep it unsent — leave it in the wall, walk out into her unchanged life, and let the writing be the whole of the medicine. Or she could send a letter that changes nothing — not the instructing one but the comforting one, back to seventeen-year-old Elle: say no if you need to; stay; it leads somewhere you can't see and her name is Juno and you will not believe how much. A letter that reaches the past, and rewrites nothing but the fear.

▸ Elle sends the instructing letter, and rewrites her life.
▸ Or she keeps it unsent, or sends only comfort — changing the past not at all.

Chapter Eight — Dawn at the Returns Office

THE UNSENT LETTER. Elle slid the letter into an empty pigeonhole with all the others that were never quite sent, and walked out into the grey dawn of her own unchanged life. The writing was the point. Somewhere in the 3 a.m. draft she had, without noticing the moment, forgiven the furious hopeful girl she'd spent seventeen years being angry at — and a forgiven past is a past you can finally set down. She went home. Juno was drawing another MUMMY PLAYING — and that morning, for the first time in seventeen years, Elle sat at the closed piano and opened it and picked out, badly, rustily, gloriously, the first thing her hands remembered. Not the life she'd been supposed to have. A few notes of it, folded into the life she actually had. It turned out it had always been enough.

THE SENT LETTER. Elle dropped the letter into the chute, and the world forked at an hour seventeen years gone. She woke in a city she'd dreamed of, the musician she was supposed to be, the great regret undone. And it was a good life. But there is a room in that life she cannot walk past without stopping — a room that should be a child's, in a life where there is no child, because there is a six-year-old named Juno who now has never been. She does not fully remember Juno — the sent letter took the memory with the life — but she aches in the daughter's shape, a grief with no object. Sometimes she draws a stick-figure at a piano and doesn't know why it makes her weep. Sent is sent. She got the life she wanted, and will spend it missing a person she chose to never have, and never quite know it. Be careful what hour you send your letter to.

THE COMFORT. Elle sent the letter — but not the one that steers. It reached seventeen-year-old Elle in the hour of the no, and did not tell her what to choose. It only held her: whatever you decide, you'll be okay; the safe path is not the failure you're afraid of; one day there is a small person in it whose name is Juno and you will not believe how much. And seventeen-year-old Elle read it, and wept, and made — freely now, unafraid now — the very same choice she'd always made. Nothing downstream unmade. Juno still in her moonlit room. But the girl made the choice without the fear that had haunted the woman for seventeen years — and so the woman woke in the exact same life, carrying it, at last, without the ache. You can reach into your own past and take away not the choice but the fear around it, and that is its own kind of rewrite — the only kind that doesn't cost you everything. Elle went home and opened the piano, and played. Juno drew her playing. It was enough. It was, in the end, the whole point.`;

const rows = [
  { id: 209, title: "One Small Seed", type: "Interactive", category: "Sci-Fi",
    description: "In a city of glass and concrete where nothing grows, a child finds a single wild seed — the last one, maybe — and must decide what a seed is for. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "Sable found it in the gutter of the ninety-first floor: a single seed, brown and teardrop-shaped. A whole tree folded up small enough to lose in a gutter. A promise you could hold in your palm.",
    content: seed },
  { id: 210, title: "Pariahner", type: "Interactive", category: "Fantasy",
    description: "In the town of Coldwater, one person is chosen to be the Pariahner — cast outside the community, and given every truth too heavy for the town to keep. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "From this day Nor would live at the wall's far side. No one would greet them in daylight. And in the dark, one by one, the whole town would come to hand over the truths that were rotting them from inside.",
    content: pariah },
  { id: 211, title: "The Lighthouse Keeper's Cats", type: "Interactive", category: "Fantasy",
    description: "Bri comes to a lighthouse to relieve its old keeper, and finds the tower full of cats — one for every sailor the light couldn't save in time. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "There were cats in every window. For the drowned come ashore as cats, and the keeper's true work is to keep each one warm until it's ready to walk into the sea and rest.",
    content: cats },
  { id: 212, title: "A Letter to Myself", type: "Interactive", category: "Romance",
    description: "On the worst night of her thirty-fourth year, Elle is offered an impossible thing: to send a single letter to one moment of her own past. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "One letter, delivered backward, to one moment of your own past. But change what you were, the keeper warns, and you may lose what you've become — the good with the bad.",
    content: letter },
].map((r) => ({
  ...r, author: "Libry Originals", price: 0, is_free: true, pages: 8,
  status: "Ongoing", language: "English", rating: 0, reviews: 0,
  created_by: "Libry Originals", age_rating: "Everyday",
}));

let payload = rows.map((r) => ({ ...r, is_published: true }));
let { data, error } = await supabase.from("books").upsert(payload, { onConflict: "id" }).select("id");
if (error && /is_published/.test(error.message)) {
  payload = rows;
  ({ data, error } = await supabase.from("books").upsert(payload, { onConflict: "id" }).select("id"));
}
if (error) { console.error("IMPORT ERROR:", error.message, error.details || ""); process.exit(1); }
console.log("Imported/updated", data.length, "stories:", data.map((d) => d.id).join(", "));
