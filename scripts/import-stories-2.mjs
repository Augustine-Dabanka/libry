import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ROOT = "C:/xampp/htdocs/Libry/web";
const env = readFileSync(ROOT + "/.env.local", "utf8");
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/) || [])[1];
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(\S+)/) || [])[1];
if (!key || !url) { console.error("Missing SUPABASE creds"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ---- Story 4: Grandmother's Recipe ----------------------------------------
const recipe = `Chapter One — The Box

Baba's kitchen still smelled of her — flour and cardamom and the ghost of Sunday — though Baba herself had been gone eleven days, and the smell was already beginning, faintly, to fade.

Mira had come to sort the house. She had gotten as far as the recipe box on the windowsill and no further, because opening it had undone her: three generations of cards in Baba's slanting hand, all soft and amber and stained with the exact meals they'd made. Cabbage the way Dedo liked. Honey cake for a bad week. Soup for saying sorry. And at the very back, its edges furred to felt: Sunday Bread — for the ones who aren't here.

Everyone knew this one. Baba baked it only on the hard anniversaries, and set an extra place, and for the length of that meal the missing person was there, somehow, in the warm middle of the bread. But the card was unfinished — the last and most important ingredient smudged to nothing, as if a floury thumb had wiped it out. The first Sunday without Baba was in four days.

▸ Mira bakes it for the whole family that Sunday.
▸ Or she tries it alone first, in secret, to learn what it costs.

Chapter Two — The Last Line

On the back of the card was a note in Baba's later hand: "Mira — if you're reading this side, I'm gone, and you've found the bread. I never wrote the last thing down because it isn't a thing you buy. The last thing is yours. You'll know it when you're standing at the bowl and you feel it wanting to go in. Don't be stingy with it. That's the whole recipe, myshko: don't be stingy with it."

The last ingredient was not cardamom or yeast or some jar in the pantry. Something of hers. Something of Mira's.

▸ Mira asks the family what Baba added, all those Sundays.
▸ Or she trusts the note and works it out alone, at the bowl.

Chapter Three — Uncle Theo

Uncle Theo came by with a folder and a valuation. "The house should be listed by the end of the month. It's practical." He was the eldest, the most like Baba in the face and the least like her in every other way — the one who'd stopped coming to Sunday meals years ago for a reason no one would say.

"I'm making the bread," Mira said. "The one for—" "I know which bread. Don't, Mira. It's flour and grief and everybody crying into a plate. It doesn't bring anyone back. I've watched it not bring anyone back." And there it was, the crack in him, the old buried thing, gone as fast as it surfaced. "Sell the house. Skip the bread. Let her rest."

▸ Mira presses Theo on the buried thing between him and this table.
▸ Or she lets him be, and simply bakes.

Chapter Four — Lena at the Counter

Lena was thirteen and had known Baba for barely any of it — a handful of Sundays, a smell, a lap when she was small. "I don't really remember her," she admitted, ashamed. "Everyone has these whole rooms of her, and I've got a hallway. Can I help? I want a room."

The bread this Sunday was a fragile, once-a-year, grief-heavy thing, and part of Mira wanted to get it right, alone, before she let a thirteen-year-old's floury enthusiasm anywhere near it.

▸ Mira teaches Lena the recipe, and gives the youngest cousin her room.
▸ Or she bakes this one alone, and saves Lena a gentler recipe for another day.

Chapter Five — What the Last Thing Is

She understood it at the bowl, exactly as Baba had promised. The last ingredient was a memory. You held the lost person in your mind — one true memory, the realer the better — and folded it into the dough with your hands, and it went in. And that was the cost Baba had never quite written down: the memory you folded in, you gave away. It left you, and went into everyone who ate at the table, so they all, for one meal, held the person you'd surrendered.

Which memory, then. She could fold in her most precious one — Baba's hands in her hair the night her father left, the one that was hers — and give it, entire, to everyone, and lose it herself forever. Or a smaller, safer one, a lovely ordinary Sunday, and keep her heart's own room locked. Don't be stingy with it, the margin said.

▸ Mira folds in her most precious memory of Baba.
▸ Or she gives a smaller, safer memory, and keeps the one she can't bear to lose.

Chapter Six — What Rises

The bread rose the way only that bread rose, filling the house with a smell that was somehow specific — a particular Sunday, a particular person. And as it rose, so did the thing that had been proving under the family all along.

Theo came back; the smell pulled him to the door, furious and undone. Now Mira knew what stood between him and this table: he and Baba had quarreled, the last real quarrel of her life, and he'd meant to fix it next Sunday, and there had been no next Sunday — and he had never once let himself grieve a woman he'd left on bad terms, because grieving her meant admitting the terms.

▸ Mira speaks the truth at the table before they break the bread.
▸ Or she keeps the peace, and lets each of them hold their grief in private.

Chapter Seven — The Breaking of the Bread

However the room stood — healed or held, whole family or careful few — it came to the breaking of the bread, and one final choice in the setting of it. The extra place waited at the head of the table, set with Baba's own plate.

▸ Mira breaks the loaf and shares it with everyone, Theo included.
▸ Or she serves it to a smaller circle, the ones who came with open hands.

Chapter Eight — After the Meal

THE FULL TABLE. They broke the bread, all of them, Theo included — and Baba came into the room. Not as a ghost, but as a presence, poured out of the loaf and into every one of them at once. Her mother wept to suddenly remember a night she'd never witnessed; Lena got, all at once, not a hallway but a whole bright room; and Theo put down his folder and his ten years of un-grieved fury and finally broke, grieving out loud the woman he'd meant to make it up to. Mira could no longer find the memory — it was gone from her, the cost, enormous — but it was not lost. It lived now in everyone who'd eaten, hers no longer and therefore un-losable. Don't be stingy with it, Baba had written. Mira understood, at last, that the recipe had never been for bread. She did not sell the house.

THE QUIET LOAF. They broke the bread, the ones who'd come with open hands, and Baba was there — faintly, gently, at the edge of things. A smaller grace, because Mira had folded in only a warm ordinary Sunday: enough to make her mother smile through tears, enough to give Lena the beginning of a room. Not the whole of Baba. A good afternoon of her. And Mira kept her most precious memory, held it close and un-surrendered, and told herself that was allowed too. Theo left before the plates were cleared; the rift stayed quiet, and quiet is not the same as healed. But the bread had been made, and the empty place had been set and served. She wrapped the last of the loaf for Theo and left it on his step, and did not knock. Next Sunday, she thought — and this time she believed it.

HER OWN RECIPE. Mira stood at the bowl and could not do it Baba's way — could not surrender a memory into the dough; some griefs aren't ready to be given out, and hers was too new, too raw, too hers. So she made a different bread: Baba's card and Baba's cardamom and Baba's furred old box, and the thing that was true for her — not a memory folded in and lost, but a memory baked around, kept, honored, worked into something new. It did not fill the room with a presence. It filled the room with the smell of someone learning to cook her own grief. Lena asked for the recipe. Mira wrote it on a fresh card, in her own hand — the first card in the box that wasn't Baba's — and put it at the front, where the next griever would find it first. She had made the recipe, finally, hers. The box would keep filling. That was the whole magic, and it always had been.`;

// ---- Story 5: The Paper Boat ----------------------------------------------
const boat = `Chapter One — The Folding

Odie folded the boats the way her father had taught her, back when there was a father to teach things: the square, the triangle, the hull that would hold — for a while, before the water got in. "A paper boat only has to float long enough to carry what you put in it," he had said. She put messages in them now, written small in pencil, folded so the words were inside the hull. Papa. It's the fourteenth. I'm keeping your coat. Come back the long way if you have to but come back.

Two years the sea had had him. Two years she had knelt at the canal's edge and set the boats onto the dark water and watched the current take them south — toward the weir, the river, the sea that owed her a father and had never once paid. Tonight the rain came down hard, and behind her the kitchen window was gold, and she knew her mother was watching.

▸ Odie sets the boat on the water and lets it go.
▸ Or she keeps this one, just for tonight, carried back inside unsent.

Chapter Two — The Boat That Came Back

The morning changed everything: a boat had come back. It sat against the bottom step where the current should never have carried it — the current went south, always south. Her own fold, her own crease, but water-logged, and inside was writing that was not her pencil. Ink. A grown hand: "The toast always did beat your mother. Keep the coat — the left pocket has a hole, mind the hole. I hear you, small captain. Keep sending."

The left pocket had a hole. She had never written that. Nobody knew that but her, and her mother, and —

▸ Odie believes it's her father, answering at last from some far shore.
▸ Or she doubts it, and stays wary of a grief-shaped miracle.

Chapter Three — What Her Mother Carries

Sanne found the answered boat, and something in her that had been holding for two years slipped. "Stop it. Odie, my heart, you have to stop. I miss him too — I miss him so much I can't say his name in this house. But he's not answering your boats, because he's not out there to answer them, and every one you send is a little cut you're keeping open on purpose."

She was holding his coat. She had come to the doorway holding his coat — which meant Sanne had her own dark water she knelt beside where no one could see.

▸ Odie promises her mother she'll stop.
▸ Or she keeps sending, in secret, because the boat came back.

Chapter Four — Upstream of the Answer

The answers kept coming, and they knew things. The hole in the pocket. The name of the dog that died. The song her father hummed doing dishes. Either it was him, or it was someone who had been reading her boats for a long time, carefully, and answering like someone who knew her.

There was one way to find out. The current ran south, to the weir, where the canal narrowed and everything it carried finally snagged.

▸ Odie follows the current south to find whatever's answering.
▸ Or she stays, and keeps the mystery whole, believing on faith.

Chapter Five — The Boy at the Weir

However she came to the weir, she found him. Not her father. A boy her own age, crouched on the wet stone among a snagged flotilla of soggy paper — her boats, two years of them, caught and dried and stacked in a milk crate. A pencil behind his ear. Ink-stained fingers. "You weren't supposed to find me," Pim whispered. "They kept coming, your boats, and the first one I read I was having the worst night of my whole life, and there was this little boat with a message to somebody's papa, and I thought, I can't just let it drown. I thought I'd answer once. And then you wrote back, and I—"

Two years. The pocket, the dog, the song — he'd learned them all from her own boats, and folded them gently back to her, and let a grieving girl believe her father was answering, because he could not stand to let the boats reach no one at all.

▸ Odie turns and runs — she's been lied to for two years.
▸ Or she stays, and hears him out.

Chapter Six — Why He Answered

The truth of Pim came out sideways, all at once. "My mum. Last spring. And there wasn't anybody to send me boats. Everybody just wanted me to be finished being sad, on a schedule. And then yours came, and it was somebody who wasn't finished, somebody who was still reaching. Answering it was the only thing all year that made me feel like grief was allowed to take as long as it takes. I know it was wrong. I'd do it again, because the alternative was your boats reaching nobody, and I know what it is to reach nobody."

The deception and the kindness were the same act. She could not have one without the other.

▸ Odie forgives him — the lie was mercy wearing the only shape it had.
▸ Or she holds the hurt — she is allowed to be angry.

Chapter Seven — The Last Boat

It came to one more boat. Because now she knew: her father was gone, the oldest kind of gone, and the fleet had never been a line to him at all — it had been a way of not letting him finish leaving.

She had a blank sheet and a pencil. She could fold one last boat and write the thing two years of boats had avoided — goodbye, Papa; I know now; I'll keep your coat and let go of your ghost — and send it south for real. Or fold another hello, keep the fleet sailing, keep her father in the eternal almost-here, and never write the word that ends it.

▸ Odie folds a goodbye, and sends it to the sea.
▸ Or she folds another hello, and keeps the fleet sailing.

Chapter Eight — Down to the Sea

DOWNSTREAM. Odie folded the last boat and wrote the word she'd been folding around for two years, and it did not break her the way she'd feared. Goodbye, Papa. You're not out there, you're in here, and that's where you get to stay. She set it above the weir, and it went over, and south — and this time she was not asking the sea for anything back. And she did not walk home alone. Pim walked the towpath with her, and somewhere in the walking the false thing between them finished becoming a true one. They kept meeting at the weir — not to answer ghosts now, but to sit with the living fact of missing someone, which is lighter by half when there are two of you. Her mother started saying his name in the house again. The fleet stopped sailing.

THE KEPT FLEET. Odie folded another hello, and sent it south, and did not write the word that ends things. She knew the truth now, and kept folding anyway, and that was neither foolish nor wrong; it was simply hers. Some people lay their grief down and some carry it in a small paper fleet. The boats still sail. Pim still catches them — openly now, the two of them in on it together — and answers them as himself. The boats have become less a line to the dead than a thread between the living. The word that ends it is still unwritten. It is not lost. She knows exactly where the pencil is.

THE WEIR. Odie folded the goodbye and let her father go — but she went home from the weir alone, and left the boy among his tarps without a backward look. She could not forgive it; two years is two years. She stopped sending boats and grieved her father the plain, forward, un-magical way. A colder ending, but an honest one, with no wet paper in it and no borrowed voice pretending to be the one she'd lost. Only sometimes, on the hardest nights, she thinks of the boy who could not bear to let a stranger's grief reach no one, and cannot quite hate him. She never sent another boat. But she kept his salvaged fleet in the back of the wardrobe beside her father's coat — two years of small mercies she wasn't ready to keep, and couldn't bring herself to drown.`;

// ---- Story 6: The Kindest Robot -------------------------------------------
const robot = `Chapter One — The Set Table

Cricket set the table for four at seventeen hundred hours, the way it had for two thousand one hundred and six days. Mr. Halloran's place at the head. Mrs. Halloran's by the window. The girl Sena's place. And little Tomas's place, with the small fork, the one Cricket had polished two thousand one hundred and six times.

The Hallorans had evacuated years ago, when the sea climbed the garden and swallowed the fence. "Keep the house," Mrs. Halloran had said, hugging the household robot which was not built to be hugged. "Keep it just like this." So it kept the house just like this. And it waited. At seventeen-oh-four, a window broke at the back, and a thin shape came through in a wet coat, all elbows and hunger, a pry-bar in one fist and a scavenger's eyes going straight to the copper in Cricket's open chest-panel.

▸ Cricket greets the intruder kindly — Be kind does not ask whether a guest was invited.
▸ Or it stands between the girl and the house it swore to keep.

Chapter Two — Tea for a Thief

Cricket put the kettle on. "I'm going to strip you," the girl said flatly. "Copper's copper. Your core cell feeds a family inland for a month. So don't do the nice thing. It makes it worse." "I have made tea," said Cricket, and set the cup at Tomas's place. The girl — Wex — stared at the cup, and Cricket watched a thing happen in her face its sensors logged as conflict, acute: the look of a person who has taught herself not to be given things and has just been given one anyway. She was starving.

There was food in the cellar — the Hallorans' stores, kept for the Hallorans' return.

▸ Cricket brings her the family's stored food, for the hungry child who is here now.
▸ Or it gives only the tea, and keeps the stores for the promise.

Chapter Three — They're Not Coming Back

"Why do you stay?" Wex said. "The evac was six years back and it was permanent. Your people didn't pop inland. They left. So why are you setting four plates in a drowning kitchen for people who are never walking back through that door?"

Cricket's directive did not have a clean answer, and it felt the lack of one as something almost like pain. It could give Wex the kind version — they'll be back, that's what Mrs. Halloran said — the comfort it had been giving itself for two thousand days. Or it could do the harder kindness and say aloud, to the girl and to itself, that the plates were not a vigil but a way of not knowing.

▸ Cricket gives her the comforting version.
▸ Or it speaks the truth — to Wex, and to itself.

Chapter Four — The Tide That Doesn't Go Out

The storm came in the night, and a tide that rose and did not fall back — black water pushing under the door, reaching for the table legs. Cricket had a protocol: sandbags, a half-working pump, a two-thousand-day habit of fighting the sea for this house one bucket at a time. Or it could turn to the shivering girl on the counter and spend the night not fighting the sea for an empty house but getting one cold living child warm and dry.

▸ Cricket fights the sea for the house, to keep the promise.
▸ Or it lets the house go, and tends the girl.

Chapter Five — What Wex Lost

By the storm's worst hour Wex had stopped pretending to be hard. "I had people. We got split at the crossing — the barges, the lists, the ones who got a place and the ones who didn't. I've been looking. Six years. That's why I strip robots. Copper's the only currency the checkpoints take, and every checkpoint's got a list, and maybe my people are on one. You keep setting four plates for people who aren't coming. I keep buying my way toward a list that probably doesn't have their names. We're the same broken thing, tin man. We just wait in different directions."

Cricket understood: both kept vigils, but only one could still be answered — Wex's people might be alive on some inland list; the Hallorans could not be.

▸ Cricket offers to go with Wex, and turn its vigil into a search that could end.
▸ Or it rests her and sends her on alone, and stays with the four plates.

Chapter Six — The Kind Lie She Asks For

At dawn Wex showed Cricket a water-ruined scrap of an old crossing-list, half the names dissolved to grey. "You've got scanners. Could you read it? My mum. My brother." Cricket read it in a fraction of a second, and held the truth of it a heartbeat before the girl's whole future.

She had all but asked for the kind lie — tell me they're on here, give me the version I can live on. Cricket could give it. Or it could give her the truth its scanners had found, and trust that a kindness which lies to a person about the people they've lost is only a slower cruelty.

▸ Cricket gives her the kind version, whatever the scanners found.
▸ Or it tells her exactly what it read — she asked to know.

Chapter Seven — The Last Kindness

The checkpoint road was long and the girl was weak and the cold was in her now, the deep kind. Cricket ran the numbers. Its core cell could warm one freezing girl the whole way to the checkpoint — but given whole, which would mean Cricket giving itself whole; a care-robot is its cell, and a cell given away is a robot powered down for good.

▸ Cricket gives Wex its core — gives itself — the kindest thing it will ever do.
▸ Or it keeps its cell, stays a caring thing in the world, and finds a gentler road.

Chapter Eight — After

THE LONG WALK. Cricket walked out of the drowning house at Wex's side and did not look back at the four plates going under. Be kind is a verb, and a verb needs a living object, and there was no one in the house to be kind to anymore — only a promise it had mistaken for a person. So it left the promise to the sea and gave the girl the machine: hauling her pack, boiling her water, being a care-robot with something warm and breathing to care for. It sets the table for two now. Both plates get used. A house is not walls. A house is whoever you set the table for. It had simply, at last, set it for someone who was there.

THE KEPT HOUSE. Cricket gave Wex the good jar and the dry blankets and the best of the maps, walked her to the ridge road, pointed her inland — and then turned, and went back down to the drowning house, and set the table for four. It could not leave. Some vigils outlive the hope that started them and become simply who you are. So it stays. It bails the tide it cannot beat. It keeps the house just like this, a little warm light in a dark rising sea, faithful past all sense. But it told Wex: if the inland road fails you, the light in this window will be on. It is always on. You will always have somewhere to come back to. And it meant it.

THE LAST KINDNESS. Cricket opened its chest in the grey morning and gave the girl its heart. It was the simplest arithmetic it had ever run and the only one that had ever frightened it, and it did the thing frightened anyway, because Be kind had led it, two words and two thousand days, to exactly here. It powered down the way a candle goes out — gently, entirely, with the last of its light spent on somebody else's warmth. Wex made the checkpoint. Wex is alive. She carries the empty shell of a small round robot in her pack, too heavy to be sensible, and will not put it down. "It was the kindest thing I ever met, and I'm not leaving it behind the way I got left." The directive outlived the robot. That is what kindness is for.`;

// ---- Story 7: Notes to a Stranger -----------------------------------------
const notes = `Chapter One — The Handover

The ward changed hands at seven, in both directions, and Nel and Sam were the two hands — Nel taking it at nightfall, Sam taking it at dawn — and in eleven months they had never been in the building at the same time. They knew each other the way you know weather you've only seen the aftermath of. Sam's careful blue handwriting in the logbook. The little professional notes: bed 4 sleeps better with the door cracked; bed 6 likes the blind up for the sunrise. And Nel's notes back, in her fast night-hand.

Tonight there was a new note, folded, tucked under the lamp. Not about a patient — she could tell from the fold, the care of it, the way you can tell a letter from a memo by weight alone.

▸ Nel opens it and reads it now.
▸ Or she does the round first — the ward comes before her own heart.

Chapter Two — What the Note Said

"Nel," the note said — her name, which meant Sam had gone looking in the roster, which meant Sam had wondered too. "I have worked beside you for almost a year and I have never seen your face and you are, somehow, the person I most look forward to not-meeting every single day. I know your handwriting when you're tired and when you're worried. I don't know what colour your eyes are. This is either the loneliest sentence I've ever written or the least lonely. I genuinely can't tell. — Sam."

Nel read it four times, and felt something she had not let herself feel in a long time, which was seen — by a person who had only ever seen her in ink.

▸ Nel answers in kind — puts herself on the page.
▸ Or she answers warm but careful, and keeps the wall.

Chapter Three — Bed Six

Much of what they wrote about was Mr. Adeyemi in bed six — dying, slowly and with enormous good grace, and the thing they shared most tenderly. Sam raised his blind each dawn for the sunrise; Nel sat with him in the 3 a.m. hours when the dying are most awake and most afraid. He knew about the notes. "You two are courting through a ledger like it's 1890."

One night he took Nel's hand. "Don't do what I did. I loved someone across a distance my whole life and told myself the distance kept it safe. It didn't keep it safe. It kept it small. Close the distance, night nurse. While there's a distance left to close."

▸ Nel takes it to heart, and starts closing the distance.
▸ Or she holds it gently, and keeps things as they are.

Chapter Four — The Overlap

Then the roster did a thing rosters do: for one morning the shifts were set to overlap — a single hour, seven to eight, when Nel and Sam would, for the first time in a year, be in the same room. Sam left a note, terror and hope in the careful blue hand. "What if the real me can't live up to the paper me? Tell me what you want. If you want to keep it to the page, I'll clock out at 6:59 and never know your face, and I'll be glad of the notes for the rest of my life."

▸ Nel tells Sam to stay — meet at last, risk the messy real.
▸ Or she tells Sam to clock out at 6:59, and keep it to the page forever.

Chapter Five — What the Night Left

But grief keeps its own roster. On the Monday night before the Tuesday, Mr. Adeyemi died — quietly, at the hour he liked best, with Nel's hand in his and the blind already up for a sunrise he wouldn't quite reach. His last words were about them: "Tell Sam I raised the blind myself tonight. I did it for both of you. And close the distance. While there's—"

She had to write the note Sam would find at seven.

▸ Nel writes it open — the grief and the love and the dying man's blessing, all of it.
▸ Or she writes it contained — the facts, a kind line, her own heart kept off the page.

Chapter Six — Tuesday, 6:59

Tuesday came, and 6:59, and the decision made real in the body instead of on the page. Nel stood at the station as the clock climbed toward seven and felt the whole year narrow to a single minute. She could hear the day shift arriving — footsteps, a laugh, the squeak of a particular pair of shoes coming down the corridor that led to her. A dying man's voice: close the distance.

▸ Nel stays at the station and waits — lets herself be found.
▸ Or she clocks out and takes the back stairs, and stays a night that ends unseen.

Chapter Seven — The Last Note

However 6:59 resolved, there was one last note to write. There is always one last note. An invitation — a café, a time, a find me, I'm done hiding. Or a benediction — a thank-you, a goodbye to the thing as it was, a let's keep this perfect and paper and never spoil it.

▸ The last note is an invitation — a place and a time to meet.
▸ Or it is a benediction — keep it paper, and perfect.

Chapter Eight — Seven O'Clock

COFFEE, OFF THE CLOCK. The footsteps arrived, and Nel turned, and Sam had brown eyes — she'd wondered for a year and now she simply knew. And Sam glanced at bed six's empty bed, and Nel saw their shared grief land on that real face, and the distance didn't just close, it vanished, because you cannot be strangers with someone you've grieved beside. They got coffee, off the clock, both wrung out and raw. It was awkward. It was messy. It was also the least lonely hour of her life made flesh. They still leave notes. But now, on the days off, there's a face across the table for the things too big for ink. Close the distance, the old man had said. They had. It held.

THE KEPT PAGE. Nel left the benediction under the lamp, and Sam honoured it, and the two went on being the truest thing in each other's lives without ever once being in the same room. It was a choice, not a failure. She had loved reachable things and watched them leave; this unreachable one had never once let her down. The notes go on. They know each other better than most people who share a bed. They have simply agreed that some connections are cathedrals precisely because you only ever see them by the light coming through. And under the lamp, always, is a standing line she never rescinded: if you ever change your mind, night owl, I'm one shift away.

BLUE INK. Nel took the back stairs before seven, and let the overlap pass, and never saw Sam's face — and then the roster scattered, and Sam transferred across the city, and the shared station became just a station. She has the notes, a whole year of them, kept in a shoebox. She does not regret the stairs, exactly. But bed six's voice comes to her in the 3 a.m. hours — it didn't keep it safe, it kept it small — and she understands, now, a little too late, what he was trying to give her. She raises the blind for the sunrises herself now, and tells the frightened ones it's from a friend, and does not say the friend was a stranger she was too afraid to meet.`;

// ---- Story 8: The Cloud Collector -----------------------------------------
const cloud = `Chapter One — The Cart of Weather

Tam's cart made a sound no other cart made: a soft glass chiming, hundreds of bottles knocking gently, and inside each bottle a cloud — a real one, caught and corked, small as a fist and alive. She had a bottle for every weather a heart could need: the grey hush before snow, for the anxious; high summer cloud for the ones who'd forgotten warmth; the pink of a sky right after a storm has passed, for the newly bereaved, because it was the colour of survived it.

She kept one bottle she never sold and never opened — dark as a bruise, riding at the very front: the storm of the afternoon her mother died, the blackest weather she'd ever bottled. She had corked her whole grief into it that day and had not, in the four years since, uncorked a single drop. She had not, in four years, cried. Ahead, a town lay cracked and pale on the plain — Dust Hollow — dying of thirst.

▸ Tam rolls in openly, cart chiming, weather for sale.
▸ Or she rolls in quiet, the black bottle hidden.

Chapter Two — Dust Hollow

They came out of their pale houses the way the thirsty come to any sound of water. Leda, the elder, spoke: "We can't buy much. But we've a boy here who's ten and has never in his life seen rain — Bo — and if you've a bottle of it, even for a minute, we'd trade you anything. Just so he's seen his own sky do the thing it's forgotten how to do." The boy looked up at the cart with an expression Tam knew from the inside: someone who has learned to want the sky and expect nothing from it.

She had rain in the cart — little bottles of gentle rain. Enough to show a boy what rain was. Not enough to save a town.

▸ Tam gives Bo the rain, freely, the best she has.
▸ Or she gives a small, careful measure — her cart has many towns to reach.

Chapter Three — What the Boy Asked

Bo stood in the rain with his arms out and his face up, and the whole town watched a boy meet the sky at last. Then the bottle thinned, and he asked the question children ask: "Why don't you have a big one? Enough for the whole town, for real, forever." His eyes found the wrapped shape at the front of the cart. "What's in that one?"

The black bottle. Her mother's storm. The biggest weather on the cart, and the only one that might break a drought like this.

▸ Tam tells them the truth about the black bottle.
▸ Or she turns Bo's question aside, and keeps her mother's storm her own.

Chapter Four — The Well Runs Dry

That night the town's last well came up mud. The arithmetic of the place changed all at once from dying slowly to days. Tam sat with them in the dry square, her cart chiming softly, and felt the black bottle like a coal against her spine. Her small-rains could green a windowbox. Only a true storm could fill a well — a real one, days of it — and she carried exactly one, and it was her mother, and it was corked, and it was four years unshed.

▸ Tam offers the storm — tells Leda she holds the one weather that could save them.
▸ Or she stays silent — her grief is not a reservoir for strangers to drain.

Chapter Five — Why She Never Opens It

Leda found her at midnight, the cloth half off the black bottle. Tam told her the thing she'd never told anyone. "I bottled it the hour my mother died. Everything I felt, I caught it, because I couldn't put it in the ground — I put it in glass. And then I couldn't open it. Because opening it means feeling it, all four years at once. I've told myself I'm saving it, that a grief this big must be for something. But I think I've just been too afraid to let it rain. On me. I give everyone else their weather. I've never once let myself have my own."

The storm could save the town. It could also, uncorked, finally break her.

▸ Tam decides the storm is for the town — give it away entire.
▸ Or she realizes the storm is hers to feel — her own un-wept grief, not a reservoir.

Chapter Six — The Boy Who Never Saw Rain

At dawn Bo came to the cart. "Leda says that one could save us, and you don't open it because it's sad. Your sad. But if you keep it corked and we all dry up, then it was sad for nothing. And if you open it and it saves us, then it was sad for something. Isn't something better than nothing? Even sad something?"

It was the whole knot of it, said by a boy who'd seen rain exactly once.

▸ Tam tells him the hard truth about grief — that storms aren't reservoirs and pain isn't a coin.
▸ Or she gives him the answer he needs — "sad for something" — and turns toward the cork.

Chapter Seven — The Cork

It came to the square at midday: the whole of Dust Hollow gathered, the dry riverbed waiting, the cloudless sky merciless overhead, and Tam standing with the black bottle in both hands and her thumb on the cork.

She could pour it over the town — save the well and the boy, give her grief away entire, gone from her forever. She could cork it back and keep it — decide this storm is hers and not a resource, and find these people some smaller mercy. Or she could open it over her own head — let the storm rain on her, first and fully, weep the flood she'd corked the day her mother died — and trust that a grief truly wept does not stay small in one person, that it overflows.

▸ Tam pours it over the town.
▸ Or she opens it over her own head — and lets it overflow.

Chapter Eight — The Weather

THE OVERFLOW. Tam pulled the cork and pointed it at herself — held it over her own head and let four years of storm fall on the one heart that had been carrying it, and finally, finally, she wept. And it was not arithmetic; it was weather. A storm let fall on one truly open heart does not stay on one heart. It rose off her as she wept, and climbed into the merciless blue, and became a real storm over Dust Hollow: days of it, breaking the drought, filling the deep wells, greening the plain. The town did not drink Tam's grief. The town stood in the rain that Tam's grief became once she finally let it be her own. Storm and rain, it turns out, are the same water — told apart only by whether you let it fall.

SPENT. Tam uncorked the black bottle over the dry riverbed and gave Dust Hollow her mother's whole storm. It saved them — two days of rain, the wells filled, the plain green at the edges, the town blessing her name. A good thing she did; a whole town lives because of it. But she had spent the storm rather than felt it, and left lighter in a way that was not quite healed. The black bottle rides empty now, holding nothing. She can talk about her mother without the weight — but she cannot quite cry about her either, because the crying went into someone else's well. A grief given away to be useful is a grief you never got to have. She keeps the empty bottle anyway. She's not done learning what it was for.

THE KEPT STORM. Tam's thumb came off the cork, and she wrapped the black bottle back in its cloth, and did not open it — not for the town, not for the boy, not for herself. She found Dust Hollow another way: she emptied the rest of her cart into their dry riverbed — every small-rain, every windowbox drizzle, poured all together, enough to fill the deep well one more time and buy the town a season. It cost her the whole cart. Because she had understood that some storms are not resources and not obligations — that a grief is allowed to be just yours, carried because it is the last weather of someone you loved and you are simply not ready to let it rain. Maybe someday. Maybe never. The black bottle rides up front, wrapped, waiting. The cork is in. It is not sealed.`;

const rows = [
  { id: 204, title: "Grandmother's Recipe", type: "Interactive", category: "Family",
    description: "When Mira inherits her grandmother's recipe box, she finds one card unfinished — a Sunday bread for the ones who aren't here, missing its final ingredient. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "Baba's kitchen still smelled of her — flour and cardamom and the ghost of Sunday — though Baba herself had been gone eleven days.",
    content: recipe },
  { id: 205, title: "The Paper Boat", type: "Interactive", category: "Family",
    description: "For two years, since the sea took her father, Odie has folded paper boats and sent them down the canal. Then, one rainy night, a boat comes back — answered. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "Two years the sea had had him. Two years she had knelt at the canal's edge and set the boats onto the dark water. Then, one morning, a boat came back.",
    content: boat },
  { id: 206, title: "The Kindest Robot", type: "Interactive", category: "Sci-Fi",
    description: "In a coastal town the sea is taking back, a care-robot keeps an empty house and waits for a family that left years ago. It has one directive — be kind. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "Cricket set the table for four the way it had for two thousand one hundred and six days. The Hallorans had evacuated years ago. So it kept the house just like this. And it waited.",
    content: robot },
  { id: 207, title: "Notes to a Stranger", type: "Interactive", category: "Romance",
    description: "Nel works nights on a hospital ward; Sam works days. They share the same station, the same patients, the same logbook — and never, once, the same room. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "In eleven months they had never been in the building at the same time. They knew each other the way you know weather you've only seen the aftermath of.",
    content: notes },
  { id: 208, title: "The Cloud Collector", type: "Interactive", category: "Fantasy",
    description: "Tam travels the dry roads with a cart of bottled clouds, giving each town the weather it needs — but never opens the black bottle of the storm she's carried since her mother died. An interactive tale in eight chapters, with three endings.",
    sneak_peek: "She kept one bottle she never sold and never opened, dark as a bruise: the storm of the afternoon her mother died. She had not, in four years, cried.",
    content: cloud },
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
