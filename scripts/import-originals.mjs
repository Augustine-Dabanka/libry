import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---- 1 · Salt and Sky (literary fiction) -----------------------------------
const salt = `Chapter One — The Return

The bus let Mara off at the top of the hill because the road down to Kittiwake no longer trusted its own surface, and she stood a moment with her one suitcase while the driver pulled away, taking the last of the engine-warmth with him. Below her the village lay the way it always had — a scatter of slate roofs, a harbour like a cupped hand, and beyond it the grey working sea that had fed and drowned her family in roughly equal measure for two hundred years. She had sworn, at nineteen, never to come back. She was forty-one now, and her grandmother was three weeks dead, and here she was.

The house on Cobble Row still smelled of Nan — of woodsmoke and lanolin and the particular brine that got into everything within a hundred yards of the water. Mara set her case down in the hall and did not turn on the lights. She stood in the dark and listened to the house tick and settle, and she waited to feel something, and what she felt, in the end, was tired.

There was a note on the kitchen table in the solicitor's careful hand. And there was a key she didn't recognise, heavy and old, with a paper tag tied to it by a length of tarred twine. The tag said, in Nan's slanting capitals: FOR THE BOAT. FINISH HER.

Mara turned the key over and over. She had not known there was a boat.

Chapter Two — The Boat Shed

The shed stood at the far end of the harbour where the good moorings gave way to the ones nobody wanted, and its doors were held shut by a padlock that the heavy key opened on the second try, grudgingly, with a shriek of rust. Inside, in the cold blue light that came through the gaps in the planking, sat the boat.

She was perhaps eighteen feet, clinker-built, her ribs bare in places and her planking laid only halfway up one side, so that she looked less like a boat than like the idea of one — a thing caught in the act of becoming. Wood shavings lay on the floor in drifts, dry now, months old. A plane rested on the workbench exactly where a hand had set it down and never come back for it.

Mara had not known her grandmother could build a boat. There was, she was learning, a great deal she had not known. She ran her palm along the smooth curve of the hull and felt the tool-marks in it, the small human patience of them, and something moved in her chest that she did not have a name for and did not want one.

"You'll be the granddaughter, then."

The man in the doorway was old and square and weathered to the colour of the boat itself. He did not offer his hand. "Your Nan and I built the frames together," he said. "I'm Ross. I'll teach you the rest, if you've the sense to learn it."

Chapter Three — Steam and Stubbornness

The planks had to be steamed before they would bend, and steaming them meant an old length of drainpipe, a paraffin burner, and a great deal of swearing. For the first week Mara ruined more wood than she saved. She cracked a plank clean through trying to force it, and Ross said nothing, only handed her another and watched, and she understood that the silence was the lesson.

"You're fighting her," he said at last, on the Thursday. "The wood knows the shape it wants to take. Your job's not to bend it to your will. Your job's to ask it nicely and be patient while it makes up its mind." He looked at her sideways. "Your Nan was terrible at this part too. First year. After that she was better at it than me."

Mara's hands blistered and then hardened. She learned the smell of the steam that meant ready and the smell that meant a minute more. In the evenings she sat in Nan's kitchen with liniment on her palms and found, to her surprise, that she slept.

Chapter Four — What the Village Remembered

They came to the shed the way the tide came in — slowly, and then as if they had always been there. Old Enid brought a flask of tea and stories Mara had never heard: how Nan had gone out in the worst of the '68 storm to bring back the Sullivan boy, how she'd stared down the harbour board when they tried to close the lifeboat station. A younger woman, Cat, who ran the shop now, brought her small son, who liked to sort the copper nails by size.

Mara had left this place remembering only its smallness, the way it had known everything about her before she knew it herself. She had forgotten that the same closeness that had felt like a fist could also feel like a pair of hands, holding you up. She had spent twenty years being no one in particular in cities that did not care whether she lived or died. It was disorienting to be, once more, so thoroughly known.

Chapter Five — The Squall

They were three weeks from finished when the wind came round to the north-east and Ross did not turn up at the shed. Mara found him at his cottage, grey-faced, one arm useless. "Just tired," he said, which was a lie so bad that neither of them bothered with it, and she drove him the forty minutes to the hospital in Nan's ancient car with the heater that only worked downhill.

Not a heart attack, the doctor said. This time. But close, and a warning, and no more steaming planks in a freezing shed for a man his age. Ross took the news the way he took everything, with a nod and a long look at the middle distance. "You'll have to finish her yourself," he told Mara. "You know enough now."

"I don't," she said.

"You do," he said. "You've known enough for a week. You've just been keeping me company." And he smiled, which she had not seen him do before, and it undid her entirely.

Chapter Six — Launch

She finished the boat on a still morning in the first week of spring. She had done the last of it alone — the gunwales, the thwarts, the single coat of paint the colour of the sky before dawn — and when she stood back from her there was nothing left to do but the one thing she had been afraid of all along, which was to find out whether the boat, and Mara, would float.

Half the village came down to the slip. Ross sat in a folding chair with a blanket over his knees and directed everyone loudly and uselessly. They ran her down the greased ways and she took the water like she'd been born to it, sitting up sweet and level, not a drop coming in.

Mara rowed her out past the harbour mouth into the grey working sea, alone, the way her grandmother must have imagined she would. And there, with the village at her back and the whole cold morning ahead, she finally felt the thing she had come home three weeks ago expecting to feel and had not — the grief and the love of it, arriving together, indistinguishable, filling her up like water finding its level. She let it come. She shipped the oars, and drifted, and wept, and was not, for the first time in twenty years, in any hurry to be anywhere else at all.

She named the boat Nan. There had never been any question.`;

// ---- 2 · Relay (science fiction) -------------------------------------------
const relay = `Chapter One — Station Kestrel

For eleven years Idris Vale had been the only human being within four light-hours in any direction, and he had made his peace with it the way you make peace with a sound you can no longer hear. Station Kestrel was a relay — a lonely tin drum bolted to the dark at the edge of the Vane system, catching the compressed whispers of a hundred worlds and flinging them onward toward home. Nothing happened here. That was the point of him. He was the man who made sure nothing happened, and when something did, he fixed it, and then nothing happened again.

He woke, that shift, to a light that should not have been lit.

It was on the deep-array panel — the great dish that listened outward, away from the settled worlds, into the black where there was nothing to hear. In eleven years it had caught cosmic noise, the hiss of dead stars, once a burst from a collapsing giant that had made him whoop alone in the dark like a child. It had never, not once, caught anything that carried structure.

It was carrying structure now.

Chapter Two — The Pattern

Idris did not sleep for two days. He told himself it was a malfunction, a leak from the inner array bleeding across the channels, and he ran every diagnostic the station carried and found nothing wrong. The signal was real. It was faint, and it was slow, and it was coming from a patch of empty sky where the charts showed no star, no station, no reason for a signal to be.

And it was a pattern. Not language — nothing so generous. But not noise, either. It rose and fell in a way that noise did not, in intervals that returned, that answered themselves, that had the terrible tidy quality of intention. He fed it to the station's small mind and asked it, is this something. The station thought about it for six hours and said: probability of non-natural origin, 0.91.

Idris sat with that number for a long time. Ninety-one percent. He had come out here to be where nothing happened. He understood, watching the light pulse on the panel, that the nothing was over, and that whatever came next, he would face it the way he had faced everything for eleven years, which was alone.

Chapter Three — Protocol

There was a protocol. Of course there was a protocol; there was a protocol for everything, twelve hundred pages of it, and somewhere in the middle was a single grey paragraph headed CONTACT, ANOMALOUS, POTENTIAL NON-HUMAN. It said, in the flat language of people who had written it certain it would never be read: seal all outbound channels. Record. Do not respond. Await relief.

Await relief. Relief was four light-hours away and would take, once summoned, the better part of a standard year to arrive. The protocol was asking him to sit in the dark beside the most important thing that had ever happened to his species and do nothing about it for a year.

He drafted the alert to home. His finger hovered over the send. And he found, to his own surprise, that he did not press it — not yet, not quite — because a question had risen in him that the twelve hundred pages had not anticipated, which was: what does it want? The pattern was not shouting. It was not a beacon. It was quiet, and patient, and it repeated, and repeated, the way a person knocks softly on a door they are not sure anyone is behind. It was, he realised, not announcing. It was asking.

Chapter Four — Answer

He broke protocol on the ninth day.

He did it carefully, which he told himself made it better and knew did not. He did not open the outbound channels to home — he was frightened, but he was not a fool. He built a small transmitter from the deep array's own hardware, tuned it to the frequency of the pattern, and he sent back, into that patch of empty sky, the simplest structured thing he could think of: the first eight prime numbers, spaced in the same slow intervals as the signal itself. Here is a pattern that means someone is listening. Here is a mind, saying: I hear you.

Then he waited. The reply, if it came, would take eleven hours to cross the gulf and eleven to come back. He did not sleep. He sat in front of the panel and ate nothing and watched the dark, and at the twenty-second hour, almost to the minute, the deep array lit.

It sent back the primes. All eight. And then a ninth, that he had not sent, correct, offered — the way you finish a sentence for someone to show them you are truly listening too.

Idris put his face in his hands and made a sound he had not made in eleven years.

Chapter Five — The Long Conversation

They built a language the way two people build a fire in the wind, with cupped hands and great care, feeding it slowly. Numbers first. Then the relationships between numbers. Then, laboriously, over weeks, the beginnings of things numbers could describe — quantity, position, the passage of time, the fact of two things being near or far. It was the slowest conversation in the history of either species, and Idris had never in his life been happier.

He learned things. He learned that they — it, he could never be sure — were not near; the signal was old, had been travelling a long time, and whatever had sent it might no longer exist in the form that sent it. He learned that they, too, were alone; that the pattern he had caught was not a broadcast to the galaxy but a single thin thread cast out, again and again, over what he slowly understood to be an unbearable span of time, by something that had wanted, simply, to know if anyone was there.

He learned that the ninth prime had not been a test. It had been a kindness.

Chapter Six — Relief

Relief came in the eleventh month, as the protocol had promised — a fast cutter and a crew of six and a woman named Okonkwo with a soft voice and very hard eyes, who had read his logs on the way in and knew everything he had done and everything he had failed to do.

"You broke protocol," she said, not unkindly, in the cramped warmth of the station he had lived in alone for eleven years and was now, suddenly, crowded.

"I did," said Idris.

"You made unauthorised contact with a non-human intelligence."

"I answered someone who was knocking," he said. "For a very long time. In the dark. I know what that's like."

Okonkwo looked at him for a while. Then she looked at the deep-array panel, where the light still pulsed, patient, faithful, waiting for the next thing he would say. "Show me," she said, and something in her voice had changed, and Idris understood that she had come out here to end this and was not going to, and that the nothing was over now not just for him but for everyone, forever.

He pulled a second chair up to the panel. "It likes primes," he said. "Start with primes. And be patient. It's come such a long way, and it's waited such a long time, and all it ever wanted — " his voice caught, and he let it — "all it ever wanted was to not be the only one."`;

// ---- 3 · The Tuesday Loaf (romance) ----------------------------------------
const baker = `Chapter One — Tuesday

The first loaf appeared on a Tuesday, on the step of the flat above the launderette, wrapped in brown paper and still faintly warm, and Sam nearly trod on it on his way out to a job he no longer had the heart for. There was no note. He assumed a mistake — a delivery to the wrong door — and he left it on the kitchen counter and forgot it, and that evening, hungry and low, he tore off a piece, and it was the best bread he had ever eaten in his life.

The second loaf came the next Tuesday. And the one after that.

Sam had moved to the town four months earlier for reasons that had since dissolved, leaving him stranded in a place where he knew no one and a flat that smelled of other people's washing. His wife had been the one who made friends; she had also, it turned out, been the one who made the marriage, and when she left she took both with her. He had come here to start again and had instead simply stopped. The loaves were the only thing that happened to him. He began, without admitting it to himself, to look forward to Tuesdays.

Chapter Two — The Bakery on Fore Street

It took him five Tuesdays to work up the nerve to find out where the bread came from, and when he did it was almost embarrassingly easy — the same distinctive slash across the crust was in the window of the little bakery on Fore Street, the one he passed every day with his eyes down. He stood outside it for ten minutes pretending to read the menu.

The woman behind the counter had flour to her elbows and a way of looking at you as though she already knew the end of your sentence. "You're the flat above the launderette," she said, before he'd said anything at all.

"How did you — "

"You've got the look," she said. "Everyone who moves to this town has it for the first year. Like you've been set down somewhere and you're waiting for someone to come and collect you." She wiped her hands on her apron. "I'm Nadia. And yes. The bread's from me. You looked like you needed feeding and you're too proud to be fed, so I didn't leave a note. Sit down. You look like you don't sit down enough."

Chapter Three — Regulars

He became a regular the way water becomes ice — imperceptibly, and then all at once. He learned the rhythm of the bakery: the early rush of commuters, the mid-morning lull when Nadia made the good coffee she didn't sell, the pensioners who came at eleven and stayed till noon. He learned that Nadia had run the place alone for six years since her mother died, that she opened at five every morning and was tireder than she let on, that the town had a hundred small kindnesses in it that he had been too closed to notice.

He started helping. Small things at first — carrying the flour sacks she pretended she could still lift, fixing the wonky shelf, sitting with old Bill when his memory frightened him. He had been an engineer, in his other life, before he stopped; his hands remembered how to be useful even when the rest of him had forgotten. Nadia watched him find his way back to himself over a stack of proving loaves and said nothing, only made the coffee a little stronger, and left, on Tuesdays, one loaf still on his step, because some kindnesses you keep up even after they've done their work.

Chapter Four — What She Didn't Say

There was a thing Nadia did not talk about, and Sam, who was learning to notice things again, noticed it. A photograph in the back room, turned to the wall. A day in early autumn when she was quiet and short and made the bread badly, the only day all year the bread was less than perfect. He did not ask. He had learned, at least, that much — that you do not pull at the thread of someone's grief, you only stay near enough that they can hand it to you if they choose.

She chose, on the anniversary, at the end of a long day, with the shutters down and the ovens cooling and the whole town gone quiet. Her mother, and the bakery, and the promise she'd made and the life she'd given up to keep it. "I don't regret it," she said, in a way that meant she had, some days, badly. "But I forget, sometimes, that I'm allowed to want things too. That the shop can be something I do and not just the whole of what I am." She looked at him. "You've reminded me of that. I don't know if you meant to."

Chapter Five — The Wobble

It nearly went wrong the way these things do — through cowardice, through a good thing feeling too fragile to risk. Sam's old firm called; there was a contract in the city, real money, the life he'd been trying to restart handed back to him gift-wrapped. He said yes before he'd thought, because yes was the answer the old Sam would have given, and he came to the bakery to tell Nadia and found he could not, and so he said nothing, and she felt the nothing, and the warmth went out of the room like heat out of a cooling oven.

For two Tuesdays there was no loaf on his step. He had not understood, until the absence of it, how much he had come to measure his life in that small weekly proof that someone had thought of him. He stood in his flat that second bereft Tuesday and understood, finally and completely, what a fool he was being, and about which of the two lives on offer he actually wanted.

Chapter Six — Tuesday, Again

He did not take the contract. He went to the bakery at five in the morning, before it opened, in the cold blue dark, and he knocked on the shutter until Nadia lifted it, flour to her elbows, wary.

"I've been an idiot," he said. "I'm good at it. Twenty years of practice." She didn't smile, not yet, so he kept going. "I don't want the city. I had the city. It was a life that happened to me while I was somewhere else. This — " he gestured at the ovens, the shelves, her, the whole warm floury world of it — "this is the first thing in two years I've actually chosen. I'd like to keep choosing it. If you'll have a slow learner about the place."

Nadia looked at him for a long moment, the way she did, as though she already knew the end of the sentence. Then she stood back and held the door. "You can start," she said, "by learning to make the bread. I'm not leaving you a loaf on that step for the rest of my life. A woman's got to sleep in sometimes."

He started that morning. He was terrible at it. He got better. And every Tuesday after — for the rest of a life that turned out, against all his expectations, to be a good one — there was warm bread in that flat above the launderette, and neither of them, by then, could have told you who had made it.`;

// ---- 4 · The Emberwright (fantasy) -----------------------------------------
const ember = `Chapter One — The Forge of Memory

In the city of Coilhaven they did not bury their dead, nor burn them, nor speak their names into the dark and let them go. They forged them. Every memory a person could bear to part with was taken to the Emberwrights, who worked it in fire and cooling until it hardened into metal — a coin, a nail, a length of bright wire — and these were kept, and traded, and worn, so that nothing anyone had ever felt was truly lost, only made solid, and passed from hand to hand.

Wren had been apprenticed to the forge since she was nine, and at seventeen she could already do what most journeymen could not: she could take a raw memory, still hot and slippery with feeling, and hold it in her mind without flinching while the fire drew it out of her hands into the shape it wanted to be. It was a gift, her master said. It was also, though he did not say this, a danger, because an Emberwright who cannot flinch is an Emberwright who will one day hold a memory she should have dropped.

That day came in the autumn of her seventeenth year, and it came wrapped in grey silk, and it was forbidden, and she held it anyway.

Chapter Two — The Grey Commission

The client came at the hour the forge closed, when the good custom had gone home and only the desperate remained. She was veiled and richly dressed and she would not give a name, and she laid on the anvil a memory unlike any Wren had handled — not offered up willingly, warm from a living mind, but cold, stolen, wrapped tight in grey silk that hummed faintly when Wren's fingers neared it.

"Forge it," the woman said. "Into a key. And tell no one you have seen it."

It was against every law of the guild. Memories given freely were the whole of their craft; a memory taken, worked against its owner's will, was the oldest and worst of their forbidden things, and the penalty for it was to have your own memories drawn out one by one until there was nothing of you left to punish. Wren knew all this. And she was seventeen, and poor, and the woman's coin was heavy, and the memory on the anvil hummed to her in a voice she almost recognised.

She sent the woman away. And then, alone, against every particle of her better judgement, she unwrapped the grey silk to see what she had been asked to forge.

Chapter Three — Whose Memory

It was hers.

Not a memory of hers — a memory that was hers, one that had been taken out of her own head so long ago and so cleanly that she had never known the hole was there. She knew it the instant she touched it, the way you know your own reflection. It was a memory of a woman's face, and a garden, and a name being spoken over her — her true name, the one before the forge, the one no orphan of the guild was ever told — and the woman's face in the memory was the face beneath the grey veil, older now, come back after fifteen years to buy her own crime forged into a key.

Wren sat on the cold floor of the forge with her stolen childhood humming in her hands and understood three things in quick and terrible succession: that she had a mother; that her mother had sold this memory, and Wren with it, to the guild; and that she had now come back not to reclaim her daughter but to unlock some door, and needed this last piece of the past made into a tool to do it.

Chapter Four — The Locksmith's Truth

She did not forge the key. She went, instead, to the one person in Coilhaven who might tell her the truth: old Saba, the guild's memory-keeper, who had catalogued every forging for sixty years and forgotten none of them, because a memory-keeper is the one person forbidden to sell what they feel.

Saba did not pretend not to know. "Your mother was a lord's daughter," she said, "and you were a secret she could not afford, and the memory of you was worth more, sold, than you were, kept. That is the whole ugly sum of it, child. But there is more, and worse, and you had better sit." The door your mother means to open with that key, Saba told her, was the Deep Vault — the place beneath the forge where the guild kept the memories too dangerous to trade, the ones that could unmake a person, or a city. Wren's stolen name was the last of the three keys that opened it. Her mother had spent fifteen years and a fortune gathering the other two.

"Why?" Wren whispered.

"Because," said Saba, "there is a memory in that vault that your mother wants unmade. And I think, if you are brave and very foolish, you already know whose it is."

Chapter Five — The Deep Vault

She went down into the dark beneath the forge with the grey-silk memory unforged in her fist, and she found her mother already there, at the great triple-locked door, two keys turned and the third lock waiting.

"You didn't forge it," her mother said. Not angry. Tired. "I should have known. You were always too much like — " and she stopped, and could not say the name, and Wren understood at last what her mother wanted unmade. Not a stranger's memory. Her own. The memory of the daughter she had sold. She had spent fifteen years and everything she had, not to reclaim Wren, but to erase the guilt of having lost her — to open the vault and unmake her own remembering, so that she might, finally, feel nothing about the thing she had done.

"You could have just come and found me," Wren said, and her voice broke on it. "I was an hour's walk away. My whole life."

"I know," said her mother. And that, in the end, was the worst thing either of them said.

Chapter Six — What She Forged

Wren had the last key in her hand, unforged, and a choice that was really two choices wearing each other's clothes. She could forge it and open the vault and let her mother unmake her guilt, and be, herself, forgotten completely, a hole in a stranger's head. Or she could keep it, and keep the memory whole, and force her mother to carry for the rest of her life the thing she had done.

She did neither.

She took the grey-silk memory — her own stolen name, her own small forgotten face in a garden — and she forged it, there, on the cold floor of the vault, with no fire but the one she carried in her own unflinching hands. But she did not forge it into a key. She forged it into a coin, and she pressed the coin, still warm, into her mother's palm, and closed the woman's fingers over it.

"You don't get to unmake it," Wren said. "But you don't have to carry it alone in the dark, either. This is me. This is what you lost. Keep it. Look at it. That's the whole of what I've got to give you, and it's more than you gave me." And she turned and climbed back up toward the light of the forge, an orphan still, a stranger to her own name — but the one who had chosen, at last, what to do with the fire. Behind her, in the dark, her mother wept over a warm coin, and did not, this time, try to melt it down.`;

// ---- 5 · The Glasswright's Alibi (mystery) ---------------------------------
const glass = `Chapter One — The Locked Studio

The glassblower Aurelio Vane was found dead in his studio on the morning of the winter fair, and the studio was locked from the inside, and the only window was forty feet up and painted shut, and in his hand was a single perfect glass sphere, unbroken, that should by every law of physics have shattered when he fell. Inspector Halloran had been a policewoman for twenty-six years, and she had never seen anything she liked less.

"Suicide," said the constable, hopefully.

"Men who mean to die," said Halloran, "do not first make the most beautiful thing of their lives and then hold onto it. Look at his face. He was surprised." She crouched by the body, careful of the drifts of glass dust that lay over everything like frost. "And a man alone in a locked room does not get surprised. Someone was here. I want to know how they left."

The sphere in the dead man's hand caught the low winter light and threw it back, and for a moment the whole cold studio was full of small moving suns, and Halloran had the uncomfortable sense that the answer was already in the room, in plain sight, wearing the shape of something ordinary.

Chapter Two — The Apprentice, the Rival, the Widow

There were three people who might have wanted Aurelio Vane dead, and by noon Halloran had spoken to all of them.

The apprentice, Tomas, had loved the old man and hated him in the exhausting way of the very talented serving the merely famous; he had, he admitted, argued with Vane the night before about a commission, and he had no alibi, and he wept, which meant nothing either way. The rival, Serpe, ran the only other glasshouse in the city and had lost the winter-fair commission to Vane by a single vote; he had an alibi, a dinner with the guild, and he offered it too quickly. And the widow, Lucia, twenty years younger than her husband and calm as still water, had been at the theatre, seen by three hundred people, and stood to inherit everything.

Three suspects, three motives, and a locked room that none of them could have left. Halloran went home that night and did not sleep, and turned the glass sphere over and over in her mind — the one thing in the case that did not fit, the beautiful impossible thing that should have broken and had not.

Chapter Three — The Impossible Sphere

It was the sphere that broke it open, in the end, because Halloran did the thing she always did with an impossible object, which was to stop asking who and start asking how, and then to ask a glassmaker.

She took it — carefully, in a box lined with wool — to a retired master across the river, a woman whose hands shook now but whose eye did not. The master turned it in the light for a long time. "This is not blown glass," she said at last. "It looks it. But no lung on earth makes a sphere this perfect, this heavy, this — cold." She weighed it in her palm. "This was cast. In a mould. Slowly, over days, and then polished to look hand-blown. Whoever made this wanted it mistaken for something it was not." She looked up at Halloran. "Your dead man was a blower, yes? The greatest in the city? Then your dead man did not make this thing. And if he did not make it, someone put it in his hand."

Chapter Four — The Painted Window

The window was the second lie. Halloran had accepted, as everyone had, that it was painted shut — she had seen the thick old paint sealing the frame, forty feet up, obviously undisturbed for years. But a lie that everyone accepts is the safest kind, and she had built a career on distrusting safe things, and so she sent a man up on a ladder to look, truly look, at the paint.

It was undisturbed. But behind it, the constable reported, the catch was broken — sheared clean through, recently, the metal bright at the break. The window could not be opened from inside because the catch was broken. But a window with a broken catch, forty feet up, painted to look sealed, could be opened from outside by someone who had broken the catch in advance and knew the paint would sell the illusion. The killer had not left the locked room. The killer had never been inside it. The killer had reached in.

Chapter Five — The Long Rod

She understood it all at once, the way you understand a joke, a half-second before the pieces finish arriving. A glasshouse is full of long iron rods — punties, blowpipes, ten and twelve feet of them. From the roof of the neighbouring building — Serpe's building, the rival's glasshouse, which shared a wall — a person with a long rod and a steady hand could reach through a window with a broken catch and painted frame, in the dark, and do a great deal, if what they meant to do was simple enough.

They had not stabbed him. The wound, the coroner had said, was a blow to the temple, consistent with a fall. They had frightened him. They had reached a cold cast-glass sphere through the window on the end of a rod and set it, gleaming, impossible, on his workbench in the dead of night — a thing he knew he had not made, appearing in his locked studio — and Aurelio Vane, sixty-eight and alone and proud of a talent he had begun to fear was leaving him, had risen in the dark to touch the impossible thing, and startled, and stepped back, and fallen, and struck his head. Not murder by a hand. Murder by a fright, delivered on the end of a pole, through a window everyone knew was sealed.

Chapter Six — The Guild Vote

It was Serpe, of course — the rival, who shared the wall, whose alibi had come too fast. But Halloran had learned long ago that knowing is not the same as proving, and a murder committed by a beautiful object and an open window leaves very little a magistrate can hold.

So she did not go to the magistrate. She went to the guild.

She laid it all out for them in their cold hall — the cast sphere, the broken catch, the shared wall, the rod — and she let them arrive at it themselves, these men and women who had spent their lives learning exactly what a lung could make and what it could not, and who understood, as no jury ever would, the precise and terrible insult of killing the greatest blower in the city with a lump of cast glass polished to mock his craft. They understood that part better than they understood the death itself.

Serpe was expelled from the guild that same night — stripped of his glasshouse, his mark, his right to touch a pipe again, which for a man like him was a sentence longer than any prison. And Halloran walked home along the frozen river with the impossible sphere in her coat pocket, turning it over in her cold fingers, thinking that the thing about a perfect object is that it is always, always, hiding the shape of the hand that made it — and that her whole job, in the end, was simply to be the one who would not stop looking until she found it.`;

const CONTENT = { salt, relay, baker, ember, glass };
const rows = [
  { id: 401, title: "Salt and Sky", author: "Libry Originals", category: "Fiction", price: 4.99, rating: 4.7, k: "salt",
    desc: "A woman returns to her late grandmother's fishing village to finish a half-built boat — and finds her way back to a life, and a grief, she had left behind. A quiet novel about repair, in six chapters." },
  { id: 402, title: "Relay", author: "Libry Originals", category: "Sci-Fi", price: 5.99, rating: 4.8, k: "relay",
    desc: "For eleven years Idris has run a deep-space relay where nothing ever happens. Then the array that listens outward — into the empty dark — catches something that answers back. A first-contact story in six chapters." },
  { id: 403, title: "The Tuesday Loaf", author: "Libry Originals", category: "Romance", price: 3.99, rating: 4.6, k: "baker",
    desc: "Every Tuesday a warm loaf appears, unasked, on a lonely man's step. A tender, slow-rising romance about being fed when you're too proud to be fed. Six chapters." },
  { id: 404, title: "The Emberwright", author: "Libry Originals", category: "Fantasy", price: 5.99, rating: 4.8, k: "ember",
    desc: "In a city where memories are forged into metal, an apprentice is asked to forge a stolen memory into a key — and discovers whose memory it is. A fantasy of grief and choice, in six chapters." },
  { id: 405, title: "The Glasswright's Alibi", author: "Libry Originals", category: "Mystery", price: 4.99, rating: 4.7, k: "glass",
    desc: "A master glassblower is found dead in a studio locked from the inside, an impossible unbroken sphere in his hand. Inspector Halloran distrusts beautiful things. A locked-room mystery in six chapters." },
].map((r) => {
  const content = CONTENT[r.k];
  const sneak = (content.split("\n").slice(2).find((l) => l.trim().length > 60) || "").slice(0, 200).trim() + "…";
  return {
    id: r.id, title: r.title, author: r.author, price: r.price, type: "Fiction", category: r.category,
    is_free: false, description: r.desc, sneak_peek: sneak, content, pages: 6,
    status: "Ongoing", language: "English", rating: r.rating, reviews: 0,
    created_by: "Libry Originals", age_rating: "Everyday",
  };
});

let ok = 0;
for (const row of rows) {
  let payload = { ...row, is_published: true };
  let { error } = await supabase.from("books").upsert(payload, { onConflict: "id" });
  if (error && /is_published|age_rating|sneak_peek|pages|category/i.test(error.message)) {
    const { is_published, age_rating, sneak_peek, ...lean } = payload;
    ({ error } = await supabase.from("books").upsert(lean, { onConflict: "id" }));
  }
  if (error) { console.error(`  ✗ ${row.title}: ${error.message}`); continue; }
  console.log(`  ✓ ${row.title} — ${(row.content.length / 1000).toFixed(1)}k chars · $${row.price} · ${row.category}`);
  ok++;
}
console.log(`\nImported ${ok}/${rows.length} paid Libry Originals (ids 401–405).`);
process.exit(ok === rows.length ? 0 : 1);
