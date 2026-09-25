'use strict';
// ---------------------------------------------------------------------------
// Scene scripts: every cutscene, conversation, interactive moment & ending.
// See script.js for the command reference.
// ---------------------------------------------------------------------------
Story.fn = {
  openGate(W, id) { for (const d of W.objects) if (d.type === 'door' && d.id === id) { d.gate = false; d.setOpen(W, true); } },
  passify(W, ids) { for (const e of W.enemies) if (ids.includes(e.id)) { e.passive = true; e.sus = 0; e.icon = null; e.state = e.stationary ? 'post' : 'patrol'; } },
  follower(W, npcId, spec) {
    const n = W.npcs.find((q) => q.id === npcId);
    const x = n ? n.x : W.player.x, y = n ? n.y : W.player.y;
    if (n) n.removed = true;
    W.followers.push(new Follower(x, y, Object.assign({ id: npcId }, spec)));
  },
  remove(W, id) { if (!W) return; const n = W.npcs.find((q) => q.id === id); if (n) n.removed = true; },
  flee(W, id, toCol, then) {
    const n = W && W.npcs.find((q) => q.id === id);
    if (!n) return;
    n.state = 'scripted'; n.target = toCol * TILE + 8; n.runScript = true;
    n.thenPos = then ? { x: then.x * TILE + 8, y: (then.y + 1) * TILE } : null;
  },
};

const S = Story.scenes = {};

// ===========================================================================
// PROLOGUE
// ===========================================================================
S.pro_intro = [
  { music: 'silence' }, { bg: 'chongqing_raid' }, { siren: true }, { amb: 'fire' }, { sfx: 'plane' },
  `Chongqing, June 1940. The sirens again.`,
  ['lan_think:sad', `Every time the bombers come, I dream of the same night. The snow. The water gate. Ming's hand letting go of mine.`],
  { sfx: 'bomb_far' }, { shake: 0.5 },
  ['lan_think:determined', `Six months. Not one letter. Everyone tells me to stop waiting.`],
  ['lan_think:sad', `But I promised him. So I remember it — all of it — one more time.`],
  { siren: false }, { fade: 'out', t: 1.5 }, { amb: 'wind' }, { bg: 'nanjing_night' }, { music: 'sad' }, { fade: 'in', t: 1.5 },
  { title: 'Ashes of Jinling', kicker: 'Prologue', sub: 'One year earlier', place: 'Nanjing — December 1939', note: `Nanjing fell to the Imperial Japanese Army in December 1937; in the weeks of massacre that followed, tens of thousands of civilians and prisoners were killed. Two years later the city lives under occupation, and the Japanese military police — the Kempeitai — hunt anyone who might tell the world what happened.` },
  `Nanjing — the old capital, the city the poets called Jinling. Snow on the rooftops. Curfew at dusk.`,
  ['lan:worried', `Ming? ...Ming, it's past curfew. Where are you?`],
  `The house is dark. Ming's coat is gone from its hook. On the table lies his notebook — left open, as if on purpose.`,
];

S.pro_start = [
  ['lan_think:worried', `He's been so strange since they let him go in the spring... Nine days with the Kempeitai, and he never said a word about it.`],
  { sfx: 'shout' },
  `Outside: boots on gravel. A shouted order in Japanese. Doors being kicked in down the lane.`,
  ['lan_think:surprised', `Soldiers — they're searching the lane! If Ming comes home now...`],
  ['lan_think:determined', `His notebook. He always writes where he's going.`],
  { obj: `Read Ming's notebook on the table, then slip out to the Tongji water gate.` },
];

S.pro_studio = [
  `Light spills from Ming's photo studio ahead. Shadows move behind its paper windows. Glass breaks.`,
  ['lan_think:angry', `They're tearing his studio apart. They're looking for something.`],
  ['lan_think:determined', `His darkroom is upstairs. If anything of his is left, it's there. ...Or I go straight to the water gate, like he told me to.`],
  { obj: `Reach the water gate. (Optional: recover Ming's film from the darkroom upstairs.)` },
];

S.pro_film = [
  `Behind a loose panel in the darkroom: a single film canister wrapped in oilcloth. Ming's handwriting on the label — 金陵 · Dec. 1937.`,
  ['lan_think:sad', `December 1937. The winter we hid at Ginling College with Miss Vautrin and the other girls, when he kept slipping out with his camera and coming back grey and silent.`],
  ['lan_think:determined', `This is what they want. They won't have it.`],
];

S.pro_outro = [
  { bg: 'nanjing_night' }, { music: 'sad' }, { amb: 'wind' },
  `The Tongji water gate. Ice on the moat. A sampan rocks in the dark, an old boatman crouched at its stern.`,
  ['ming:worried', `Lan-er! I told you not to come through the lanes—`],
  ['lan:angry', `You told me NOTHING! You vanish for nine days in the spring, you come back with bruises you won't explain, and tonight the Kempeitai are tearing up our street!`],
  ['ming:sad', `I know. I know. I'm sorry.`],
  { if: 'item:ming_film', then: 'film' }, { go: 'nofilm' },
  { label: 'film' },
  ['lan:determined', `I went to the studio. I found this.`],
  ['ming:surprised', `You— Lan, do you know what's on that roll?`],
  ['lan:sad', `December 1937.`],
  ['ming:sad', `Keep it hidden. Keep it safe. If anything happens to me, it has to reach someone who will show it to the world. Promise me.`],
  ['lan:determined', `I promise.`],
  { set: { promisedFilm: true } }, { aff: { ming: 1 } }, { go: 'cont' },
  { label: 'nofilm' },
  ['ming:sad', `They want something I have. Something from the winter of '37. I can't let them have it — not even to save myself.`],
  { label: 'cont' },
  `Torchlight along the city wall. Voices. A dog.`,
  ['ming:determined', `The boatman will take you upriver to Wuhu, and from there west. Go to Chongqing. Find Auntie Qin at her teahouse on the Shibati steps.`],
  { choice: [
    { t: `"Come with me. Please."`, go: 'please', aff: { ming: 1 } },
    { t: `"I'm not leaving without you."`, go: 'stubborn' },
    { t: `"Tell me the truth first. Who are you working for?"`, go: 'truth' },
  ], timer: 14, timeout: 0 },
  { label: 'please' },
  ['ming:sad', `If I get in that boat, they'll search every boat on the river. Alone, you're just a girl going to visit her aunt.`], { go: 'jade' },
  { label: 'stubborn' },
  ['ming:smirk', `You've been saying that since you were four. You said it about the kite, too.`],
  ['lan:cry', `This isn't a kite, Ming!`], { go: 'jade' },
  { label: 'truth' },
  ['ming:worried', `...For China. That's all I can say, and it's true. One day I'll tell you the rest — on the Bund, with music. I promise.`], { set: { askedTruth: true } }, { go: 'jade' },
  { label: 'jade' },
  `He pulls a cord from beneath his scarf. On it hangs a half-moon of pale green jade — the other half of yours.`,
  ['ming:tender', `Mother's jade. You have your half, I have mine. As long as we both keep them, we'll find each other. That's what she said. Remember?`],
  ['lan:cry', `I remember.`],
  { sfx: 'bark' }, `A dog barks, very close. A flashlight beam swings across the ice.`,
  ['ming:determined', `Go! I'll lead them away.`],
  { choice: [{ t: `Get into the boat.`, go: 'boat' }, { t: `Grab his hand.`, go: 'grab' }], timer: 6, timeout: 0 },
  { label: 'grab' },
  `You catch his sleeve. For one heartbeat he holds your hand — then he pushes you down into the sampan, and the boatman poles out into the black water.`, { go: 'away' },
  { label: 'boat' },
  `You step down into the sampan. The boatman pushes off without a word.`,
  { label: 'away' },
  ['ming:happy', `Within the month! Chongqing! Save me a seat at Auntie Qin's!`],
  `He runs along the wall — deliberately loud — toward the torches. The beams swing after him.`,
  { sfx: 'gun' }, { flash: true }, { shake: 0.4 }, { wait: 0.6 }, { sfx: 'gun' },
  ['lan:cry', `MING!`],
  `The boatman's hand closes over your mouth. The water gate slides past. Nanjing disappears into the snow.`,
  { fade: 'out', t: 2 }, { ach: 'first_steps' }, { wait: 0.8 },
  `Ming did not come within the month.`,
  `Nor the month after that.`,
];

// ===========================================================================
// CHAPTER ONE — Chongqing
// ===========================================================================
S.ch1_intro = [
  { bg: 'teahouse' }, { music: 'calm' }, { amb: 'city' },
  { title: 'The Fog Capital', kicker: 'Chapter One', place: 'Chongqing — June 1940', note: `After Nanjing fell, Chiang Kai-shek's government retreated up the Yangtze to Chongqing, a mountain city wrapped in fog. From 1938 Japanese bombers struck it again and again; in the summer of 1940 the raids came almost daily.` },
  `Auntie Qin's teahouse on the Shibati steps. Steam, gossip, the clack of mahjong tiles — and underneath it all, the listening quiet of a city waiting for sirens.`,
  { set: { metQin: true, mingLead: 'Nanjing, December 1939 (the water gate)' } },
  ['qin:worried', `You didn't sleep again, child. Your eyes are like two bruised plums.`],
  ['lan:sad', `I dreamed about the water gate.`],
  ['qin:sad', `Six months, Lan. The river boats bring letters from Nanjing every week. If he could write...`],
  ['lan:determined', `He'd write. So he can't. That's not the same as dead.`],
  `At the corner table, two men in the grey tunics of government clerks have been drinking since noon. One leans toward the other.`,
  ['clerk:smirk', `...a photographer from Nanjing. Su-something. Dai Li's people have a whole file on him — working for Wang Jingwei's puppets now, taking pretty pictures of traitors.`],
  ['clerk:neutral', `The Boss wants him dead. The file's up at Luojiawan, in the archive, top floor—`],
  `Your teacup is shaking. Auntie Qin lays her hand over yours.`,
  ['qin:worried', `Don't. Whatever you're thinking — don't. Luojiawan is the Juntong. Dai Li's secret police. People go in there and don't come out.`],
  { choice: [
    { t: `"Ming is not a traitor."`, go: 'a' },
    { t: `"Then I'll make sure I come out."`, go: 'b' },
    { t: `(Say nothing. Listen for more.)`, go: 'c' },
  ] },
  { label: 'a' }, ['lan:angry', `Ming is not a traitor. He would rather die.`], ['qin:sad', `I know it, child. But Dai Li doesn't care what I know.`], { go: 'siren' },
  { label: 'b' }, ['lan:determined', `Then I'll make sure I come out.`], ['qin:worried', `You are your mother's daughter. Heaven help us all.`], { go: 'siren' },
  { label: 'c' }, ['clerk:laugh', `...and when the sirens go, everybody runs for the tunnels — guards and all. Skeleton watch. You could walk right in, hah!`], ['lan_think:determined', `During a raid. The building half empty.`], { set: { heardRaid: true } }, { go: 'siren' },
  { label: 'siren' },
  { siren: true }, { bg: 'chongqing_raid' }, { music: 'tense' }, { sfx: 'plane' },
  `And then — as if the sky had been listening — the sirens begin to wail across the river.`,
  ['qin:worried', `To the tunnels! Lan — LAN! Where are you going?!`],
  ['lan_think:determined', `Luojiawan. While the bombs fall.`],
  { siren: false },
];

S.ch1_courier = [
  `A young man in a torn grey tunic lies against the rubble, a Juntong badge on his chest, blood soaking through his side.`,
  ['courier:pain', `Miss... you shouldn't... be out... the raid...`],
  ['lan:worried', `Don't move. I'll get help—`],
  ['courier:pain', `No time... The archive... Luojiawan... the files must be moved before... the fires...`],
  { choice: [
    { t: `"I'll move them for you. How do I get in?"`, go: 'help' },
    { t: `"Hold on. Keep talking to me. What's your name?"`, go: 'stay' },
  ] },
  { label: 'stay' },
  ['courier:pain', `...Xiao Liang... Tell my mother... in Yibin...`],
  ['lan:sad', `I'll tell her. I promise.`], { set: { courierName: true } },
  { label: 'help' },
  ['courier:pain', `Archive... top floor... the lock... four numbers... the night... the war began...`],
  ['courier:closed', `...seven... seven...`],
  `His head sinks against the stones. Overhead, the drone of the bombers fades east.`,
  ['lan_think:sad', `The night the war began. The Marco Polo Bridge. The seventh of July, 1937.`],
  { obj: `Break into the Juntong archive on the top floor. The lock: "the night the war began".` },
];

S.ch1_file = [
  { letter: { title: 'File #3317 — SU MING', style: 'typed', text: Story.docs.juntong_file.text } },
  { doc: 'juntong_file' },
  ['lan_think:angry', `"Collaborator." "Elimination." Approved by Dai Li himself.`],
  ['lan_think:sad', `Photographing for the puppet government... Ming, what have you done? What have they MADE you do?`],
  ['lan_think:determined', `Detained December 1939, nine days — that's after the water gate. And alive in March. He was alive in March.`],
  { set: { mingLead: 'Nanjing, March 1940 (Juntong file)' } },
  { obj: `Get out with the file. The archive window opens onto a drainpipe.` },
];

S.ch1_outro = [
  { bg: 'chongqing_raid' }, { music: 'tense' }, { amb: 'fire' },
  `You drop the last few feet from the drainpipe into a courtyard full of smoke — and straight into the round black eye of a pistol.`,
  { set: { metLu: true } },
  ['lu:smirk', `Now, what does a nice girl want with the Juntong's dirty laundry, in the middle of an air raid?`],
  `He is perhaps thirty, in a rain-dark trench coat, hat tipped back, as relaxed as a man waiting for a tram.`,
  { choice: [
    { t: `Tell the truth: "My brother's name is in this file."`, go: 'truth', aff: { lu: 1 } },
    { t: `Lie: "I'm a nurse. I got lost in the raid."`, go: 'lie' },
    { t: `Show Ming's film: "My brother photographed Nanjing in '37. Does a traitor do that?"`, need: 'item:ming_film', go: 'film', aff: { lu: 2 } },
    { t: `Run.`, go: 'run' },
  ], timer: 12, timeout: 3, prompt: 'The pistol does not waver.' },
  { label: 'lie' },
  ['lu:laugh', `A nurse. In the archive. Through the top-floor window. With a Juntong file under her arm.`],
  ['lu:smirk', `I like you already. Try again.`],
  ['lan:worried', `...My brother. Su Ming. His name is in this file.`], { go: 'truth2' },
  { label: 'run' },
  { timing: { speed: 3.4, at: 0.5, size: 0.16 }, win: 'runok', fail: 'runbad', text: 'Dash for the gap in the wall!' },
  { label: 'runok' },
  `You bolt through the smoke. A shot cracks into the wall above your head — high. Deliberately high.`,
  ['lu:smirk', `Su Lan! You're Su Ming's sister, aren't you? Come back and let's talk about keeping him alive.`],
  `You stop. Slowly, you turn around.`, { aff: { lu: 1 } }, { go: 'truth2' },
  { label: 'runbad' },
  `You bolt — and he simply hooks your ankle with one polished shoe. You land on your back in the ash, the file clutched to your chest.`,
  ['lu:neutral', `Please don't do that again. I hate shooting people I haven't been introduced to. Now: who are you?`], { go: 'truth2' },
  { label: 'film' },
  `You hold out the canister. His eyes go to the label: 金陵 · Dec. 1937. For a moment, the smirk disappears entirely.`,
  ['lu:sad', `...I was in Nanjing that December. Until the last boat.`],
  ['lu:neutral', `Put it away. Never show it to anyone you wouldn't trust with your life.`], { set: { luSawFilm: true } }, { ach: 'the_film' }, { go: 'truth2' },
  { label: 'truth' },
  ['lan:determined', `My brother's name is in this file. Su Ming. Dai Li wants him dead.`],
  { label: 'truth2' },
  ['lu:neutral', `Su Ming, the photographer. Yes, I know that file. I wrote half of it.`],
  ['lan:angry', `Then you know it's a lie!`],
  ['lu:smirk', `I know that files are full of things people need to believe. That isn't the same thing.`],
  `He holsters the pistol and holds out a gloved hand to help you up.`,
  ['lu:neutral', `Lu Zhiyuan. I'm afraid the Boss would like a word with you.`],
  { fade: 'out', t: 1 }, { bg: 'office' }, { music: 'stealth' }, { amb: 'indoor' }, { fade: 'in', t: 1 },
  `A cellar office beneath Luojiawan. One lamp. Behind the desk sits a heavy-jawed man in a plain uniform, reading your stolen file as if it were a restaurant menu.`,
  { set: { metDai: true } },
  ['dai:stern', `Miss Su. You broke into my archive during an air raid, walked past my guards, and read a file stamped with my own initials.`],
  ['dai:stern', `Give me one reason I should not simply have you shot.`],
  { choice: [
    { t: `"Because you don't know if Ming is really a traitor. I can find out."`, go: 'd1' },
    { t: `"Because my brother is worth more to you alive."`, go: 'd2' },
    { t: `"Shoot me, then. I'm not afraid of you."`, go: 'd3' },
  ], timer: 12, timeout: 2 },
  { label: 'd1' }, ['dai:neutral', `...Perhaps. Uncertainty is expensive. It is usually cheaper to remove it.`], ['lu:neutral', `She walked through our building like smoke, Boss. Imagine what she could do in Nanjing.`], { go: 'dai' },
  { label: 'd2' }, ['dai:smirk', `Everyone is worth more alive, until they are not. But you are not wrong.`], { go: 'dai' },
  { label: 'd3' }, ['dai:stern', `Everyone is afraid of me, Miss Su. The brave ones simply hide it better. I appreciate the effort.`], { go: 'dai' },
  { label: 'dai' },
  ['dai:neutral', `Very well. If your brother serves the puppets, you will lead us to him and he will die. If he does not... we shall see.`],
  ['dai:stern', `To travel into occupied territory you need a pass. The Generalissimo signs them himself these days — he trusts no one. There is a reception at Huangshan next week.`],
  ['dai:neutral', `Lu will get you in. What you do there is your own affair. If you are caught, I have never heard of you.`],
  { fade: 'out', t: 1 }, { bg: 'chongqing_fog' }, { music: 'calm' }, { fade: 'in', t: 1 },
  ['lu:smirk', `Congratulations. You're the first person in months to leave that office with the same number of fingers you went in with.`],
  ['lan:neutral', `Why are you helping me?`],
  { choice: [
    { t: `"...Thank you, Lu Zhiyuan."`, go: 'l1', aff: { lu: 1 } },
    { t: `"You're only helping because Dai Li told you to."`, go: 'l2' },
  ] },
  { label: 'l1' }, ['lu:tender', `Don't thank me yet. Thank me if you're still alive in a month.`], { go: 'lend' },
  { label: 'l2' }, ['lu:smirk', `Of course. I'm a terrible man. Remember that — it'll save you disappointment later.`], { go: 'lend' },
  { label: 'lend' },
];

// ===========================================================================
// CHAPTER TWO — Huangshan
// ===========================================================================
S.ch2_intro = [
  { bg: 'huangshan' }, { music: 'calm' }, { amb: 'wind' },
  { title: 'A Reception at Huangshan', kicker: 'Chapter Two', place: 'Chongqing — July 1940', note: `Across the Yangtze from Chongqing, in the pine-covered Huangshan hills, Chiang Kai-shek and Soong Mei-ling kept a residence where they received generals, diplomats and foreign correspondents — between air raids.` },
  `Lu drives you up the hill road in a borrowed staff car, headlights hooded against the bombers.`,
  ['lu:neutral', `The servants' agency owes me a favour. You're "Xiao Lan", new kitchen girl. Carry trays, keep your head down, don't speak unless spoken to.`],
  ['lan:neutral', `And the pass?`],
  ['lu:smirk', `Blank passes live in a safe in the Generalissimo's study, in the private wing upstairs. The key is on Colonel Hu — fat, loud, drunk by nine. The MPs don't bother with the ground floor. Upstairs is another matter.`],
  ['lu:neutral', `If you're caught, you're a silly girl who got lost looking for the lavatory. Cry a lot.`],
  { choice: [
    { t: `"And if that doesn't work?"`, go: 'a' },
    { t: `"You've done this before."`, go: 'b', aff: { lu: 1 } },
    { t: `"Why don't you do it yourself?"`, go: 'c' },
  ] },
  { label: 'a' }, ['lu:sad', `Then I'll come and get you. Probably.`], { go: 'end' },
  { label: 'b' }, ['lu:smirk', `Once or twice. Usually in nicer dresses.`], ['lan:smirk', `Yours or theirs?`], ['lu:laugh', `Ha! I'm keeping you.`], { go: 'end' },
  { label: 'c' }, ['lu:neutral', `Because every MP in that house knows my face, and none of them know yours. That's your gift, Su Lan. Nobody ever looks at the girl with the tray.`], { go: 'end' },
  { label: 'end' },
  `The car stops beneath the pines. Lanterns glow along the terrace; somewhere inside, a gramophone plays a foxtrot.`,
];

S.ch2_hu = [
  `Colonel Hu doesn't notice a thing — he is too busy telling three bored diplomats how he personally held the line at Taierzhuang.`,
  { obj: `You have the study key. Slip up to the gallery and east into the private wing.` },
];

S.ch2_aide = [
  ['aide:neutral', `You there — new girl? Take a tray to the terrace. Madame is entertaining the American correspondents and she wants the good tea.`],
  { choice: [
    { t: `"Yes, miss. ...Is the Generalissimo here tonight?"`, go: 'a' },
    { t: `"Of course, miss." (Leave quietly.)`, go: 'b' },
  ] },
  { label: 'a' },
  ['aide:smirk', `Where else would he be? Ten minutes with the foreigners, then he retires to his study to read Zeng Guofan and write in his diary. Every night, like a clock.`],
  ['aide:neutral', `He checks his little safe before bed, too. As if anyone would dare.`],
  ['lan_think:neutral', `Not much time, then.`], { set: { knowsTen: true } },
  { label: 'b' },
];

S.ch2_cook = [
  ['cook:neutral', `Eh? Another new girl. Lu's cousin, are you? Hah, everybody's Lu's cousin.`],
  ['cook:sad', `Thirty years I've cooked for generals. Beijing, Nanjing, now this mountain. Every time we move, the kitchen gets smaller and the bombs get bigger.`],
  { choice: [
    { t: `"Is there another way to deal with the private wing guards?"`, go: 'a' },
    { t: `"Were you in Nanjing, uncle? In '37?"`, go: 'b' },
  ] },
  { label: 'a' },
  ['cook:smirk', `Clever girl. There's a fuse box at the end of the east corridor upstairs. When the lights go out, the MPs run around like headless chickens looking for the electrician. That's me, by the way. I'm the electrician.`],
  ['cook:neutral', `Don't tell anyone I told you.`], { go: 'end' },
  { label: 'b' },
  ['cook:sad', `I left with the government in November. My brother stayed to guard his shop.`],
  ['cook:sad', `I don't talk about it, girl. Go on, now.`], { go: 'end' },
  { label: 'end' },
];

S.ch2_chiang = [
  { bg: 'study' }, { music: 'tense' },
  `The safe door swings open. Inside, beneath a sheaf of telegrams, lie blank passes, each bearing the seal of the Military Affairs Commission.`,
  `Behind you, the study door opens.`,
  { set: { metChiang: true } },
  ['chiang:stern', `...Who are you? What are you doing in my study?`],
  `The Generalissimo himself. Shaved head, clipped moustache, a plain uniform buttoned to the throat. Smaller than in the newsreels — and far more frightening.`,
  ['chiang:angry', `A kitchen girl does not open my safe. Guards—`],
  { choice: [
    { t: `"Wait! Please — I'm from Nanjing."`, go: 'nanjing' },
    { t: `(Throw yourself on your knees.)`, go: 'kneel' },
    { t: `"You abandoned Nanjing to die!"`, go: 'accuse' },
  ], timer: 7, timeout: 0 },
  { label: 'kneel' },
  ['chiang:stern', `Get up. A citizen of the Republic does not kneel. That was the old way — the Qing way.`], ['chiang:neutral', `Speak.`], { go: 'nanjing2' },
  { label: 'accuse' },
  ['lan:angry', `You left Nanjing in 1937, and the Japanese came, and— and you were making speeches in Wuhan!`],
  ['chiang:angry', `You think I do not know what happened in Nanjing?! I know it better than any man alive!`],
  ['chiang:stern', `The city could not be held. Our best divisions died at Shanghai so that the world would see China fight. We are a poor country fighting a rich one.`],
  ['chiang:sad', `We trade space for time. Every day we survive is a victory. ...Do you understand me, girl?`],
  { set: { accusedChiang: true } },
  { choice: [
    { t: `"...I understand. I'm sorry."`, go: 'nanjing2' },
    { t: `"No. I don't."`, go: 'defiant' },
  ] },
  { label: 'defiant' },
  ['chiang:stern', `Then you will understand in a cell.`],
  ['lan:angry', `My brother stayed in Nanjing and photographed everything! Every body in the river! And your Dai Li calls him a traitor!`],
  ['chiang:surprised', `...Photographed?`], { go: 'photos' },
  { label: 'nanjing' },
  ['lan:worried', `I'm from Nanjing, Generalissimo. My name is Su Lan. My brother is missing in the occupied city. I need a pass to find him.`],
  { label: 'nanjing2' },
  ['chiang:neutral', `Nanjing...`],
  `He looks past you at the portrait of Sun Yat-sen above the desk.`,
  ['chiang:sad', `Dr. Sun lies in his mausoleum on Purple Mountain, under the eyes of Japanese sentries. And Wang Zhaoming — his favourite disciple — sits in Nanjing and calls himself the government of the Republic.`],
  ['chiang:stern', `Why should I trust you? That city is full of Wang's spies. The Communists send theirs too. The Japanese are a disease of the skin; the Communists, a disease of the heart. And traitors are everywhere.`],
  { label: 'photos' },
  { choice: [
    { t: `Show him Ming's film: "My brother photographed what they did in Nanjing."`, need: 'item:ming_film', go: 'film' },
    { t: `Quote Dr. Sun: "The work of the Revolution is not yet done..."`, need: 'doc:sun_testament', go: 'sun' },
    { t: `Show him Dai Li's file: "Your own spymaster wants my brother killed."`, need: 'item:juntong_file', go: 'file' },
    { t: `"I'm just a sister looking for her brother."`, go: 'plain' },
  ] },
  { label: 'film' },
  `You hold out the canister. His eyes fix on the characters: 金陵 · Dec. 1937.`,
  ['chiang:sad', `...Foreigners smuggled out photographs and film. Rabe's reports. The missionaries. The world looked, and then looked away.`],
  ['chiang:determined', `If your brother holds the originals, they must survive this war. When it ends, there will be a judgment.`],
  { ach: 'the_film' }, { set: { chiangSawFilm: true } }, { go: 'sign' },
  { label: 'sun' },
  ['lan:determined', `"The work of the Revolution is not yet done. Let all our comrades strive on earnestly for its consummation."`],
  `For a long moment the Generalissimo says nothing. Then, very quietly:`,
  ['chiang:sad', `He dictated that on his deathbed in Peking. I was not there. Wang Zhaoming wrote it down for him.`],
  ['chiang:neutral', `A strange world, that a traitor's handwriting should hang in every schoolroom in China.`], { go: 'sign' },
  { label: 'file' },
  ['chiang:stern', `Dai Li.`],
  `He reads the file. His jaw tightens at the word "Elimination".`,
  ['chiang:neutral', `Dai Li is loyal. He is also... thorough. If your brother is innocent, he will need more than luck.`], { set: { chiangSawFile: true } }, { go: 'sign' },
  { label: 'plain' },
  ['chiang:neutral', `Everyone in China is looking for someone, girl. Four years of war. My own son was in Russia for twelve years.`],
  ['chiang:stern', `No. I cannot sign passes for every sister in Sichuan. The guards will see you out.`],
  { set: { chiangRefused: true } }, { go: 'refused' },
  { label: 'sign' },
  `He takes up a brush, wets it, and writes on one of the blank passes in firm, square characters. Then the seal.`,
  ['chiang:stern', `"Grant passage." My name will carry you to the edge of our lines. Beyond that, nothing I own can help you.`],
  ['chiang:neutral', `Find your brother. And if he is a traitor after all — do your duty.`],
  { take: 'blank_pass' }, { give: 'chiang_pass' },
  ['lan:determined', `He isn't. Thank you, Generalissimo.`],
  `Below, the gramophone begins another foxtrot. Madame Chiang's laughter drifts up from the terrace.`,
  { set: { ch2done: true } }, { complete: true },
  { label: 'refused' },
  `Two military policemen march you down the servants' stairs and out into the rain. The blank pass is still tucked inside your sleeve. Nobody thought to search the kitchen girl.`,
  ['lan_think:smirk', `Lu will know what to do with it.`],
  { set: { ch2done: true } }, { complete: true },
];

S.ch2_outro = [
  { bg: 'chongqing_fog' }, { music: 'calm' }, { amb: 'city' },
  { if: 'item:chiang_pass', then: 'signed' }, { go: 'forged' },
  { label: 'signed' },
  ['lu:surprised', `He SIGNED it? Himself? ...Su Lan, I have been trying to get five minutes with that man for three years.`],
  ['lan:smirk', `You should try being a kitchen girl.`], { aff: { lu: 1 } }, { go: 'next' },
  { label: 'forged' },
  ['lu:smirk', `A blank pass and a seal impression? Give me one night. I once forged a letter from the Pope.`],
  { take: 'blank_pass' }, { give: 'forged_pass' }, { go: 'next' },
  { label: 'next' },
  ['lu:neutral', `So. Occupied territory. Where do you start — Nanjing?`],
  { if: 'flag:knowsXinhua', then: 'xinhua' }, { go: 'nox' },
  { label: 'xinhua' },
  ['lan:determined', `Yan'an. There was a memo in your archive: photographs credited "S.M." printed in the Communist paper in April. Pictures of Yan'an. That's Ming.`], { go: 'reds' },
  { label: 'nox' },
  ['lan:neutral', `Auntie Qin says the Communist paper printed photographs from Yan'an this spring, signed "S.M." Ming signs his pictures like that.`],
  { label: 'reds' },
  ['lu:stern', `The Reds. Of course.`],
  ['lu:neutral', `Listen to me. The Communists are not your friends. They're nobody's friends but the Communists'. Our "United Front" is a truce between two men who each want the other dead once the Japanese are gone.`],
  { choice: [
    { t: `"I'll take help from anyone who wants to help Ming."`, go: 'a' },
    { t: `"Are you jealous, Lu Zhiyuan?"`, go: 'b', aff: { lu: 1 } },
  ] },
  { label: 'a' }, ['lu:sad', `...Then be careful whose help it is.`], { go: 'z' },
  { label: 'b' }, ['lu:laugh', `Terribly. Now go, before I say something sincere.`], { give: 'lu_lighter' }, ['lu:tender', `Here. Silver Ronson. So that you owe me something, and have to come back.`], { go: 'z' },
  { label: 'z' },
  { fade: 'out', t: 1 }, { bg: 'hongyan' }, { music: 'calm' }, { amb: 'rain' }, { fade: 'in', t: 1 },
  `Hongyan — Red Crag Village. A plain house among the orange trees on the edge of the city, where the Eighth Route Army keeps its liaison office under the permanent gaze of Dai Li's men.`,
  `You are shown up to a bare room with a desk. The man who rises to meet you has heavy black eyebrows and a warm, tired smile.`,
  { set: { metZhou: true } },
  ['zhou:happy', `Miss Su. Please, sit. You have come about the photographs.`],
  ['lan:surprised', `You know who I am?`],
  ['zhou:smirk', `Half of Chongqing is paid to watch this door. The other half is paid to watch them. One learns things.`],
  ['zhou:neutral', `Your brother came to Yan'an in March with a young Japanese who had joined our anti-war league. He photographed our schools, our soldiers — even the Chairman, who complained about it for a week.`],
  ['zhou:sad', `In April he went east again, into the occupied areas. We have heard nothing since.`],
  { choice: [
    { t: `"Why would he go back? The Kempeitai were hunting him."`, go: 'a' },
    { t: `"Dai Li's file says he works for Wang Jingwei."`, go: 'b' },
  ] },
  { label: 'a' }, ['zhou:neutral', `He said there was something in Nanjing he had to protect. He would not say what. A careful man, your brother.`], { go: 'c' },
  { label: 'b' }, ['zhou:smirk', `Dai Li's files say that I eat babies. Files are weapons, Miss Su. The question is always who is holding them.`], { go: 'c' },
  { label: 'c' },
  ['zhou:neutral', `Go to Yan'an. Ask the Chairman — your brother spent many evenings in his cave arguing about photography and Lu Xun. I will write you a letter.`],
  { give: 'zhou_letter' },
  ['zhou:neutral', `The road north crosses the Nationalist blockade. I will send a guide. He is young, but he knows the way.`],
  `A young man steps in from the corridor, rain dripping from his grey cap. Broad shoulders, a scar across one cheek, an Eighth Route Army armband.`,
  { set: { metHan: true } },
  ['han:neutral', `Han Tie. Scout. I'll get you to Yan'an, comrade.`],
  ['lan:neutral', `I'm not a comrade.`],
  ['han:smirk', `Everyone's a comrade by the time they cross the blockade. You'll see.`],
];

// ===========================================================================
// CHAPTER THREE — The blockade
// ===========================================================================
S.ch3_intro = [
  { bg: 'loess_night' }, { music: 'calm' }, { amb: 'wind' },
  { title: 'The Blockade Line', kicker: 'Chapter Three', place: 'Shaanxi — August 1940', note: `Though Nationalists and Communists were formally allied against Japan in a "United Front", from 1939 Chiang's general Hu Zongnan ringed the Communist Shaan-Gan-Ning Border Region with blockhouses and checkpoints. Goods, medicine and people crossed only in secret.` },
  `Two weeks north by truck, mule cart and foot. The green mountains of Sichuan give way to the yellow earth of the loess plateau — endless terraces, gullies cut deep as canyons, and a sky wider than any you have ever seen.`,
  ['han:neutral', `Tonight we cross. Hu Zongnan's line. Blockhouses every li, searchlights, dogs. They're looking for salt smugglers — and people like me.`],
  ['lan:worried', `And people like me?`],
  ['han:smirk', `People like you they've never seen. You'll confuse them.`],
  { choice: [
    { t: `"Why did you join the Eighth Route Army?"`, go: 'a', aff: { han: 1 } },
    { t: `"Do you always smile this much before something dangerous?"`, go: 'b', aff: { han: 1 } },
    { t: `"Let's just get this done."`, go: 'c' },
  ] },
  { label: 'a' },
  ['han:sad', `The Japanese came to my village in Hebei in '38. Burned it. I was out in the fields. When I came back there was nothing left — not my mother, not the house, not the ox.`],
  ['han:determined', `The Eighth Route came through a week later. First soldiers I ever saw who paid for their food. So.`], { go: 'end' },
  { label: 'b' },
  ['han:laugh', `My mother said I smiled through my own birth. Drove the midwife mad.`], ['lan:smirk', `I believe it.`], { go: 'end' },
  { label: 'c' }, ['han:neutral', `Right. Stay low, watch the lights. Do what I do — no, wait. I'll do what you do. You're better at this than you look.`], { go: 'end' },
  { label: 'end' },
];

S.ch3_checkpoint = [
  ['han:worried', `Checkpoint ahead. Two sentries at the gate and a machine gun behind. If they search us and find my armband...`],
  { choice: [
    { t: `Show the Generalissimo's pass.`, need: 'item:chiang_pass', go: 'pass' },
    { t: `Try Lu's forged pass.`, need: 'item:forged_pass', go: 'forged' },
    { t: `Take the gully below the road.`, go: 'gully' },
  ] },
  { label: 'pass' },
  `You walk up to the gate in the lamplight. The sergeant squints at the paper, then at the signature, and goes very pale.`,
  ['guard:surprised', `The— the Generalissimo's own hand! Open the gate! Open it, you turtle's egg!`],
  { call: (G, W) => { Story.fn.openGate(W, 'gate'); Story.fn.passify(W, ['gate1', 'gate2']); } },
  ['han:surprised', `...Who ARE you?`],
  ['lan:smirk', `A kitchen girl. Keep walking.`], { aff: { han: 1 } }, { set: { usedChiangPass: true } },
  { obj: `Through the gate. Keep heading north.` }, { end: true },
  { label: 'forged' },
  `The sergeant holds Lu's forgery up to the lamp. Squints. Holds it closer. Beside you, Han has gone very still.`,
  { timing: { speed: 3, at: 0.5, size: 0.18 }, win: 'fok', fail: 'fbad', text: 'Keep your face calm...' },
  { label: 'fok' },
  ['guard:neutral', `...Hmph. Military Affairs Commission. Fine. Go on — and don't let me see you coming back.`],
  { call: (G, W) => { Story.fn.openGate(W, 'gate'); Story.fn.passify(W, ['gate1', 'gate2']); } },
  ['han:smirk', `Your Nationalist friend does good work.`], { obj: `Through the gate. Keep heading north.` }, { end: true },
  { label: 'fbad' },
  ['guard:stern', `...This seal is wrong. Wait here. Corporal! Ring the post—`],
  `While he turns to shout, Han tugs your sleeve, and you both melt back into the dark before anyone looks round.`,
  ['han:worried', `The gully. Now.`],
  { label: 'gully' },
  ['han:neutral', `There's a ladder down into the gully just back there. It runs under the road, right past their line. Searchlight at the far end — we'll have to crawl.`],
  { obj: `Take the gully beneath the road. Stay out of the searchlight.` },
];

S.ch3_outro = [
  { bg: 'yanan' }, { music: 'yanan' }, { amb: 'wind' },
  `Dawn over the loess. Behind you, the blockade; ahead, terraced hills and, impossibly far off, a slender pagoda standing on a ridge above a river.`,
  ['han:happy', `There. Baota Hill. Yan'an.`],
  `He sits down in the dust, laughing with relief, and after a moment you sit down beside him.`,
  { choice: [
    { t: `"You were very brave back there."`, go: 'a', aff: { han: 1 } },
    { t: `"Tell me about Yan'an."`, go: 'b' },
    { t: `(Rest your head on his shoulder.)`, go: 'c', aff: { han: 2 } },
  ] },
  { label: 'a' }, ['han:shy', `Me? You crawled past a searchlight like a lizard. I just followed.`], { go: 'end' },
  { label: 'b' }, ['han:happy', `Millet, mostly. Caves. Singing. Everybody learning to read — soldiers, grandmothers, everybody. Nobody's rich, so nobody can buy you.`], ['han:neutral', `It's not paradise. There are meetings. So many meetings. But it's ours.`], { go: 'end' },
  { label: 'c' }, `Han goes rigid as a fence post. Then, very carefully, as if you were made of eggshell, he relaxes.`, ['han:shy', `...You'll get dust in your hair.`], ['lan:smirk', `It's already full of dust.`], { go: 'end' },
  { label: 'end' },
];

// ===========================================================================
// CHAPTER FOUR — Yan'an
// ===========================================================================
S.ch4_intro = [
  { bg: 'yanan' }, { music: 'yanan' },
  { title: 'Red Caves', kicker: 'Chapter Four', place: 'Yan\'an — August 1940', note: `From 1937 to 1947 the small city of Yan'an in northern Shaanxi was the Chinese Communist Party's capital. Mao Zedong lived and worked in cave dwellings dug into the loess hills; at Yangjialing he wrote essays that would shape China for decades.` },
  `Yangjialing. A row of cave dwellings cut into the hillside, their arched fronts latticed with wood and white paper. Chickens in the yard. A sentry who barely looks up.`,
  { fade: 'out', t: 0.8 }, { bg: 'cave' }, { fade: 'in', t: 0.8 },
  `Inside it is cool and dim, and there are books everywhere — on the desk, on the kang, on the floor. A tall, heavy-set man in a patched grey uniform is writing by an oil lamp. He does not look up until he has finished his sentence.`,
  { set: { metMao: true } },
  ['mao:happy', `So. You are Su Ming's little sister. He talked about you. He said you were cleverer than him, and much more stubborn.`],
  ['lan:surprised', `He... talked about me?`],
  ['mao:smirk', `Constantly. It was very tiresome. Sit, sit. Have you eaten? We have millet. We always have millet.`],
  { choice: [
    { t: `Give him Zhou Enlai's letter.`, need: 'item:zhou_letter', go: 'zhou' },
    { t: `"Where is my brother, Chairman?"`, go: 'where' },
  ] },
  { label: 'zhou' },
  `He reads it quickly, then again slowly, and folds it into his pocket.`,
  ['mao:neutral', `Enlai trusts you. Enlai trusts very few people — he has spent too long in Chongqing. Very well. I will tell you everything I know.`], { set: { maoTrust: true } },
  { label: 'where' },
  ['mao:neutral', `Your brother came in March with a Japanese boy — Mori, one of the prisoners who joined our anti-war league. He photographed our schools, the Lu Xun Academy, soldiers spinning cotton.`],
  ['mao:laugh', `And me. He made me stand still in front of this cave for twenty minutes. I have never stood still for twenty minutes in my life.`],
  ['mao:neutral', `In April he left with Mori, east through Shanxi. He said he had to "protect something in Nanjing". They were captured near Yangquan. Mori is in a Japanese blockhouse on the railway. Your brother — we do not know.`],
  { set: { mingLead: 'Captured near Yangquan, Shanxi (Mao)' } },
  { choice: [
    { t: `"Why do you trust a Japanese soldier?"`, go: 'jp' },
    { t: `Show him Ming's film.`, need: 'item:ming_film', go: 'film' },
    { t: `"What do you think of Wang Jingwei?"`, go: 'wang' },
    { t: `"What do you think of Chiang Kai-shek?"`, need: 'flag:metChiang', go: 'chiang', lockText: 'Requires: having met the Generalissimo' },
  ] },
  { label: 'jp' },
  ['mao:neutral', `The Japanese people are not our enemy. The militarists in Tokyo are — Konoe with his "New Order", Tojo with his army. Many Japanese soldiers are peasants in uniform, as far from home as our boys.`],
  ['mao:smirk', `Besides, a Japanese who has seen what his army does in China, and says so out loud, is worth a regiment.`], { go: 'after' },
  { label: 'film' },
  `He holds the canister up to the lamp and reads the label. His face darkens.`,
  ['mao:stern', `Nanjing. Your brother told me what he saw there. The world should see it too. Keep this safe, little sister. One day there will be a reckoning.`], { ach: 'the_film' }, { go: 'after' },
  { label: 'wang' },
  ['mao:stern', `Wang Jingwei was a revolutionary once. A poet. He tried to blow up the Prince Regent. Now he calls surrender "peace" and sits in Nanjing under the Japanese flag.`],
  ['mao:neutral', `History is a very patient judge.`], { go: 'after' },
  { label: 'chiang' },
  ['mao:smirk', `You met him? Hah! Then you know more than half my Politburo.`],
  ['mao:neutral', `Chiang fights the Japanese with one hand and blockades us with the other. Some day he and I will have to sit at a table together. Neither of us will enjoy it.`], { go: 'after' },
  { label: 'after' },
  ['mao:neutral', `Stay a few days. Eat. Sleep. Han Tie will take you east when the time is right — soon there will be a great deal of noise on the railways.`],
  { fade: 'out', t: 1.2 }, { bg: 'loess_night' }, { music: 'tense' }, { fade: 'in', t: 1 },
  `That night a shout wakes the whole valley. Torches on the terraces. Someone has broken into the photographic archive cave — the prints your brother left here are gone.`,
  `A sentry swears he saw a young woman running from the archive.`,
  ['ccpguard:angry', `The Chongqing girl! The Nationalist spy — find her!`],
  ['lan_think:worried', `They think it's me.`],
  `Then you see him: a figure slipping down the terraces toward the river, a satchel clutched to his chest. Old Xu — the friendly supply officer who brought you millet this afternoon.`,
  { set: { metXu: true } },
  ['lan_think:determined', `If he gets away, I'm the spy. And Ming's pictures are gone.`],
];

S.ch4_run1 = [{ call: (G, W) => { Story.fn.flee(W, 'xu', 38, { x: 72, y: 13 }); const n = W.npcs.find((q) => q.id === 'xu'); if (n) W.bark(n, 'Can\'t catch old Xu!'); } }, { obj: `Old Xu is climbing to the middle terrace. Follow him — the ladder by the cliff.` }];
S.ch4_run2 = [{ call: (G, W) => { Story.fn.flee(W, 'xu', 97, { x: 128, y: 7 }); } }, { obj: `He's heading for the top terrace!` }];
S.ch4_run3 = [{ call: (G, W) => { Story.fn.flee(W, 'xu', 152); } }, { obj: `Baota pagoda. Corner him there.` }];

S.ch4_granny = [
  ['granny:worried', `Aiya — the Chongqing girl! They're turning the valley over looking for you. Quick, sit by the stove. Nobody looks twice at a girl warming her hands.`],
  { choice: [
    { t: `"I'm not a spy, Granny. It was Old Xu."`, go: 'a' },
    { t: `"Did you see which way he went?"`, go: 'b' },
  ] },
  { label: 'a' }, ['granny:neutral', `Xu? The supply man with the soft hands? Hmph. I never trusted a man with soft hands in Yan'an. Everyone here has blisters.`],
  { label: 'b' }, ['granny:neutral', `Up the terraces, toward Baota. Take these — my grandson's firecrackers from New Year. If the sentries get close, make a noise somewhere else.`],
  { call: (G) => { G.state.firecrackers += 2; G.toast('Firecrackers +2  [T] to throw', 3); } },
];

S.ch4_pagoda = [
  { music: 'tense' },
  `At the foot of the pagoda, Old Xu is fumbling with a rope, trying to lower the satchel over the wall to someone waiting in the dark below.`,
  ['xu:surprised', `You! ...Little Miss Chongqing. You're faster than you look.`],
  ['lan:angry', `Give me the photographs.`],
  ['xu:smirk', `These? Prints. Copies. Worthless, really — your brother kept the negatives. But my employers will pay for anything with his name on it.`],
  ['lan:determined', `Your employers.`],
  ['xu:smirk', `Jessfield Road, Number 76, Shanghai. Chairman Wang's most loyal servants. Your brother's there right now, you know. Alive. Mostly.`],
  { set: { mingLead: 'No. 76, Jessfield Road, Shanghai (Old Xu)' } },
  { choice: [
    { t: `Lunge for the satchel!`, go: 'grab' },
    { t: `"Take me to him. I'll pay whatever they're paying you."`, go: 'deal' },
  ], timer: 7, timeout: 0 },
  { label: 'deal' },
  ['xu:laugh', `Ha! With what — millet? No, no. You'll come east on your own, little miss. I'm counting on it.`],
  { label: 'grab' },
  { qte: { key: 'KeyE', label: 'E', count: 9, time: 3.5 }, win: 'won', fail: 'lost', text: 'Wrestle the satchel from him!' },
  { label: 'won' },
  `You tear the satchel out of his hands. Prints spill across the stones — Ming's pictures of Yan'an, of schoolchildren, of Mao squinting into the sun. And a folded note.`,
  { set: { negativesReturned: true } }, { aff: { han: 1 } },
  ['xu:angry', `Damn you—!`], { go: 'escape' },
  { label: 'lost' },
  `He shoves you back against the wall and the satchel goes over the edge. But a folded note tumbles from his coat onto the stones.`,
  { label: 'escape' },
  `Xu vaults the wall and vanishes down the far slope. Torches come bobbing up the path — and at their head, Han Tie.`,
  { letter: { title: 'Old Xu\'s Coded Note', text: Story.docs.xu_note.text } },
  { doc: 'xu_note' },
  ['han:worried', `Lan! Are you hurt? — Put those rifles down, you fools, she's not the spy!`],
  ['lan:determined', `Old Xu. He works for Number 76 in Shanghai. And Ming — they have Ming.`],
  { complete: true },
];

S.ch4_outro = [
  { bg: 'cave' }, { music: 'yanan' },
  ['mao:stern', `Xu Fuliang. Transferred from Xi'an with excellent papers. Kang Sheng's people will be very embarrassed. They will make up for it by suspecting everyone else twice as hard.`],
  ['mao:neutral', `You did well, little sister. Better than my whole Social Affairs Department.`],
  ['mao:neutral', `Shanghai, then. We have friends there — printers, dockworkers, a journalist or two. Show them this.`],
  { give: 'mao_letter' },
  ['mao:smirk', `My calligraphy is terrible. They will know it is real.`],
  ['han:determined', `Chairman — Mori's in a blockhouse on the Zhengtai railway. He was with Su Ming when they were caught. If anyone knows what happened, he does.`],
  ['mao:neutral', `And the railways are about to become a very noisy place. Commander Peng has plans. Go with her, Han Tie.`],
  ['han:happy', `Yes, Chairman!`],
];

// ===========================================================================
// CHAPTER FIVE — The Hundred Regiments
// ===========================================================================
S.ch5_intro = [
  { bg: 'railway' }, { music: 'tense' }, { amb: 'wind' },
  { title: 'The Hundred Regiments', kicker: 'Chapter Five', place: 'Zhengtai Railway, Shanxi — 20 August 1940', note: `On the night of 20 August 1940 the Eighth Route Army under Peng Dehuai launched the Hundred Regiments Offensive — over a hundred regiments striking Japanese railways, bridges and blockhouses across North China at once. The Zhengtai line through the Taihang Mountains was a primary target.` },
  `A ruined village on a hillside above the railway. Below, the steel lines gleam under the moon, and the Japanese blockhouses squat beside them like toads.`,
  ['han:neutral', `At midnight every regiment hits the line at once. My company takes the Niangziguan tunnel. The blockhouse where they're holding Mori is two li east.`],
  ['lan:worried', `You're not coming with me.`],
  ['han:sad', `I have orders. ...I'm sorry.`],
  ['han:neutral', `Listen. In the chaos, half the garrison will run toward the fighting. The rest will be jumpy. They shoot to kill. Tonight, so can you — take what you need from them. But every shot brings the others.`],
  { choice: [
    { t: `"Come back alive, Han Tie."`, go: 'a', aff: { han: 1 } },
    { t: `"I'll get Mori. You get your tunnel."`, go: 'b' },
    { t: `(Kiss his cheek.)`, go: 'c', aff: { han: 2 }, need: 'aff:han>=2', lockText: 'Requires: a closer bond with Han' },
  ] },
  { label: 'a' }, ['han:determined', `I always come back. It's my only talent.`], { go: 'gift' },
  { label: 'b' }, ['han:smirk', `Race you.`], { go: 'gift' },
  { label: 'c' }, `His ears turn scarlet in the moonlight.`, ['han:shy', `...That's — I — right. Right. Tunnel.`], { go: 'gift' },
  { label: 'gift' },
  ['han:neutral', `Here. My compass. So you can find your way back to me.`],
  { give: 'han_compass' },
  `He grins, turns, and is gone into the dark with his men. Minutes later, far down the valley, the first explosion lights the mountains orange.`,
  { sfx: 'explosion' }, { flash: true }, { shake: 0.4 },
];

S.ch5_mori = [
  `Behind the bars, a thin young man in a torn Japanese uniform sits with his wrists bound, staring at the wall. He flinches when the lock turns.`,
  { set: { metMori: true } },
  ['mori:worried', `...Dare? Who—? You're not a soldier.`],
  { choice: [
    { t: `In Japanese: "Tomodachi desu. Su Ming no imōto desu." (I'm a friend. Su Ming's sister.)`, need: 'flag:learnedJapanese', go: 'jp', aff: { mori: 2 } },
    { t: `Show him the jade half.`, need: 'item:jade_half', go: 'jade', aff: { mori: 1 } },
    { t: `"Get up. We're leaving."`, go: 'plain' },
  ] },
  { label: 'jp' },
  ['mori:surprised', `...Su-san's sister. He said you would come. He said, "My sister is the most stubborn person in China. If anyone comes, it will be her."`], { go: 'story' },
  { label: 'jade' },
  `You hold up the half-moon of jade. His eyes fill with tears.`,
  ['mori:sad', `He had the other half. He showed it to me every night in the cell in Shijiazhuang. "So we can always find each other."`], { go: 'story' },
  { label: 'plain' },
  ['mori:worried', `Why would you help me? I am Japanese. I am the enemy.`],
  ['lan:neutral', `You were with my brother. Su Ming. That makes you something else.`], { go: 'story' },
  { label: 'story' },
  ['mori:sad', `We were caught near Yangquan in May. Kempeitai. They knew his name — they had been looking for him since Nanjing.`],
  ['mori:worried', `A major came for him. Kageyama. Very quiet. Very polite. He asked Su-san about photographs from December 1937 — negatives. Su-san said nothing. Not one word. So Kageyama sent him to Shanghai, to Wang Jingwei's secret police at 76, to be "persuaded".`],
  ['lan:angry', `And you?`],
  ['mori:sad', `I am a deserter. They were going to shoot me at dawn, when the colonel returned.`],
  { set: { mingLead: 'Sent to No. 76, Shanghai, on Major Kageyama\'s order' } },
  ['mori:determined', `Before they caught us, I stole these in Shijiazhuang — Kempeitai travel papers. "Army nurse Sato Haruko." Su-san and I thought someone might use them. Maybe you.`],
  { give: 'mori_papers' },
  ['lan:determined', `Can you walk?`],
  ['mori:determined', `For Su-san's sister, I can run.`],
  { call: (G, W) => Story.fn.follower(W, 'mori', { pal: 'mori', name: 'Mori' }) },
  { set: { moriFreed: true } },
  { obj: `Get Mori out of the blockhouse and escape east into the fields. [R] tells him to wait or follow.` },
];

S.ch5_outro = [
  { bg: 'railway' }, { music: 'heroic' },
  `Dawn. The railway burns for miles in both directions: blown bridges, twisted rails, blockhouses gutted and smoking.`,
  { if: 'aff:han>=3', then: 'close' }, { go: 'far' },
  { label: 'close' },
  `Han Tie finds you at the rendezvous in a dry riverbed, his face black with smoke, one arm in a sling — alive.`,
  ['han:happy', `Told you. Only talent.`], ['lan:cry', `You idiot. You absolute idiot.`], { aff: { han: 1 } }, { go: 'plan' },
  { label: 'far' },
  `Han Tie finds you at the rendezvous in a dry riverbed, singed and grinning.`, ['han:happy', `The tunnel's down! Niangziguan's down!`],
  { label: 'plan' },
  ['mori:neutral', `The papers say "Nurse Sato" travels by rail to Shanghai on the Jinpu line. In a Red Cross uniform, you could ride through the whole occupied north.`],
  ['han:determined', `Then I'll come as her porter. Nobody looks at porters either.`],
  ['mori:sad', `I will stay here, with the Eighth Route Army. I can talk to the Japanese boys in the blockhouses — tell them they can surrender. That is my war now.`],
  { choice: [
    { t: `"Thank you, Mori-san. For staying with Ming."`, go: 'a', aff: { mori: 1 } },
    { t: `"Arigatō, Mori-san."`, need: 'flag:learnedJapanese', go: 'b', aff: { mori: 2 } },
  ] },
  { label: 'a' }, ['mori:sad', `He stayed with me. Tell him... tell him I am still spinning cotton badly.`], { go: 'end' },
  { label: 'b' }, ['mori:cry', `...Dō itashimashite, Lan-san. Tell Su-san I am still spinning cotton badly.`], { go: 'end' },
  { label: 'end' },
];

// ===========================================================================
// CHAPTER SIX — The Iron Rooster
// ===========================================================================
S.ch6_intro = [
  { bg: 'train' }, { music: 'tense' }, { amb: 'train' },
  { title: 'The Iron Rooster', kicker: 'Chapter Six', place: 'The Tianjin–Pukou Railway — September 1940', note: `Japan's army controlled the great railways of occupied China, running armoured trains and garrisons along them. Chinese passengers travelled with papers, bribes and fear; the Kempeitai boarded at every major station.` },
  `The night express south, crammed with soldiers, refugees, merchants and chickens. You sit very straight in a starched white uniform with a red cross on the armband: "Army Nurse Sato Haruko".`,
  `At Dezhou the Kempeitai boarded. In the baggage car they found a porter whose hands were too hard and whose accent was too northern.`,
  ['lan_think:worried', `They took Han to the guard car at the front of the train. First class between us — Japanese officers.`],
  ['lan_think:determined', `Walk like a nurse. Think like a nurse. I am Sato Haruko, and I am afraid of no one.`],
];

S.ch6_old = [
  ['farmer:sad', `Nurse? ...Ah, you're Chinese. I can tell. Don't worry, girl, I won't say anything.`],
  ['farmer:sad', `I'm from Henan. In '38 the Nationalists broke the Yellow River dikes at Huayuankou to stop the Japanese. It stopped them, for a while. It drowned my whole county.`],
  ['farmer:neutral', `Chiang floods us, the Japanese burn us, the bandits rob us, the landlords take the rest. I'm going south to find my son. He's in the puppet army now — for the rice.`],
  { choice: [
    { t: `"I'm looking for my brother too."`, go: 'a' },
    { t: `"...I'm sorry, uncle."`, go: 'b' },
  ] },
  { label: 'a' }, ['farmer:happy', `Then we're two fools on the same train. Good luck to you, girl.`], { go: 'end' },
  { label: 'b' }, ['farmer:neutral', `Sorry doesn't cost anything. That's why it's all anyone gives.`], { go: 'end' },
  { label: 'end' },
];

S.ch6_inspect = [
  `A Kempeitai sergeant blocks the aisle and holds out a gloved hand.`,
  ['inspector:stern', `Shōmeisho. Papers.`],
  { choice: [
    { t: `Show Mori's transit papers, and answer in Japanese.`, need: 'item:mori_papers&flag:learnedJapanese', go: 'jp', lockText: 'Requires: the papers and Ming\'s Japanese' },
    { t: `Show Mori's transit papers.`, need: 'item:mori_papers', go: 'papers' },
    { t: `Step back out and climb onto the roof.`, go: 'roof' },
  ] },
  { label: 'jp' },
  ['lan:neutral', `Hai. Sato Haruko desu. ...Sumimasen — medical supplies for the Nanjing army hospital.`],
  ['inspector:neutral', `...Wakarimashita. Go on, Nurse.`], { call: (G, W) => Story.fn.passify(W, ['inspector']) }, { end: true },
  { label: 'papers' },
  `He reads the papers for a long time. Too long. Then he stamps them and hands them back.`,
  ['inspector:neutral', `Nurse Sato. Your Japanese is... provincial. Go.`], { call: (G, W) => Story.fn.passify(W, ['inspector']) }, { end: true },
  { label: 'roof' },
  ['lan_think:worried', `Not now. The ladder between the cars goes up to the roof. Mind the tunnels.`],
  { obj: `Get past the inspection — over the roof if you must — and reach the guard car.` },
];

S.ch6_han = [
  `Han sits tied to a post between the mail sacks, his face bruised, one eye swollen shut. When he sees you, he grins — and winces.`,
  ['han:pain', `Nurse. I think I need a nurse.`],
  ['lan:cry', `What did they do to you?`],
  ['han:smirk', `Asked a lot of questions I didn't know the answers to. Very frustrating for everyone.`],
  { choice: [
    { t: `(Untie him and hold him.)`, go: 'a', aff: { han: 2 } },
    { t: `"Can you walk? We need to move."`, go: 'b', aff: { han: 1 } },
  ] },
  { label: 'a' }, `For a moment he holds on to you as if the train were falling off a cliff.`, ['han:tender', `...You came.`], ['lan:tender', `Of course I came.`], { go: 'end' },
  { label: 'b' }, ['han:determined', `Walk, run, jump off a moving train — whatever you need.`], { go: 'end' },
  { label: 'end' },
  { complete: true },
];

S.ch6_outro = [
  { bg: 'train_roof' }, { music: 'ending' }, { amb: 'wind' },
  `You ride out the rest of the night on the roof of the mail car, hidden by the dark and the roar of the wind. The stars over the North China plain are enormous.`,
  ['han:neutral', `At Pukou I have to leave you. My orders are to go back north. Your city is right across the river.`],
  ['lan:sad', `Nanjing.`],
  ['han:neutral', `And then Shanghai, and 76, and your brother. ...I hate this. I hate not being there.`],
  { choice: [
    { t: `(Kiss him.)`, need: 'aff:han>=4&!romance:lu', lockText: 'Requires: a deep bond with Han — and a free heart', go: 'kiss' },
    { t: `(Take his hand.)`, go: 'hand', aff: { han: 1 } },
    { t: `"We'll see each other again. Comrade."`, go: 'friend' },
  ] },
  { label: 'kiss' },
  `You kiss him. He tastes of coal smoke. The train screams into a tunnel and the whole world goes black and loud and warm.`,
  ['han:shy', `...I— I'm going to have to write a self-criticism about this.`],
  ['lan:laugh', `Make it a long one.`],
  { romance: 'han' }, { ach: 'romance_han' }, { aff: { han: 2 } },
  ['han:tender', `When this is over, come north. To the loess, where the sky is big. I'll teach you to spin cotton badly.`], { go: 'end' },
  { label: 'hand' },
  `You find his hand in the dark. He holds on and says nothing, and doesn't need to.`, { go: 'end' },
  { label: 'friend' },
  ['han:happy', `See? Told you. Everyone's a comrade by the end.`], { go: 'end' },
  { label: 'end' },
  { fade: 'out', t: 1.2 }, { bg: 'nanjing_snow' }, { music: 'sad' }, { fade: 'in', t: 1 },
  `At dawn the ferry carries you across the Yangtze from Pukou. On the far bank rise the grey walls of Nanjing, and over them the flag of the Reorganized National Government — the Republic's flag, with a yellow pennant tied above it.`,
  ['lan_think:sad', `Home. Not yet. Ming isn't here. Not yet.`],
  `You board the Shanghai train without looking back.`,
];

// ===========================================================================
// CHAPTER SEVEN — The Solitary Island
// ===========================================================================
S.ch7_intro = [
  { bg: 'shanghai' }, { music: 'jazz' }, { amb: 'city' },
  { title: 'The Solitary Island', kicker: 'Chapter Seven', place: 'Shanghai — October 1940', note: `After 1937 Japan occupied Chinese Shanghai but not its International Settlement and French Concession. For four years these foreign enclaves — the "Solitary Island" — were a refuge, a black market and a battlefield of spies, where Chongqing's agents and Wang Jingwei's secret police murdered one another in the streets.` },
  `Shanghai. Neon on wet pavement, jazz from every doorway, rickshaws and Packards and White Russian beggars — and under all of it, fear.`,
  `Mao's letter takes you to a printing shop on Avenue Joffre, and from the printing shop to a small, bright-eyed woman in a beret with ink on her fingers.`,
  { set: { metFang: true } },
  ['fang:happy', `Fang Yu, "China Evening Post" — whatever's left of it. The Chairman's handwriting really is terrible, isn't it?`],
  ['fang:neutral', `Your brother. Yes. 76 took him in August. Jessfield Road — Ding Mocun and Li Shiqun's slaughterhouse. Nobody who goes in there comes out the same.`],
  ['fang:determined', `But there's a woman who knows where 76 keeps its prisoners. Madame Bai, the singer at the Paramount — mistress of one of their section chiefs.`],
  ['fang:smirk', `Tonight she sings. And tonight, you're going dancing. I've got a dress that'll make you forget how to walk.`],
];

S.ch7_lu = [
  `Under the Paramount's glittering awning, a familiar man in a familiar trench coat is lighting a cigarette.`,
  ['lu:smirk', `Of all the dance halls on the Solitary Island... Hello, kitchen girl.`],
  { if: 'item:lu_lighter', then: 'lighter' }, { go: 'nolighter' },
  { label: 'lighter' }, ['lan:smirk', `I brought your lighter back.`], ['lu:laugh', `Keep it. I need you to have a reason to come back, remember?`], { aff: { lu: 1 } },
  { label: 'nolighter' },
  ['lu:neutral', `I'll be brief. Madame Bai sold six of our people to 76 this year. Two were tortured to death. My orders are to see that she sings her last song tonight.`],
  ['lu:stern', `You're going up to her box anyway. I'm asking you to do it for me. For them.`],
  { choice: [
    { t: `"I'll do what I have to."`, go: 'a', aff: { lu: 1 }, set: { agreedLu: true } },
    { t: `"I'm not an assassin, Lu."`, go: 'b' },
    { t: `"Why her? Why not the men who pay her?"`, go: 'c', aff: { lu: 1 } },
  ] },
  { label: 'a' }, ['lu:sad', `...I almost wish you'd said no.`], { go: 'end' },
  { label: 'b' }, ['lu:neutral', `No. You're not. I'm sorry I asked.`], { go: 'end' },
  { label: 'c' }, ['lu:sad', `Because she's the one I can reach. That's the ugly truth of this war — we kill whoever we can reach.`], { go: 'end' },
  { label: 'end' },
  ['lu:neutral', `The private boxes are upstairs. The 76 men in dark suits are the danger — they study faces. Dance, smile, don't hurry.`],
];

S.ch7_fang = [
  ['fang:smirk', `Look at you. Nobody's going to recognise the girl from the loess.`],
  ['fang:neutral', `Bai's in the last box upstairs, stage right. There's a ladder to the gallery by the entrance. The 76 men watch the stairs — but they also watch the dancers' legs, so...`],
  ['fang:determined', `If you come out of this with anything on 76 — floor plans, names — I'll print it. The whole Settlement will read it by breakfast.`],
  { choice: [
    { t: `"Isn't that dangerous for you?"`, go: 'a', aff: { fang: 1 } },
    { t: `"Deal."`, go: 'b' },
  ] },
  { label: 'a' }, ['fang:laugh', `Terribly. Last year someone left a severed head outside a newspaper office with a note pinned to it. We still published.`], { go: 'b' },
  { label: 'b' },
  ['fang:neutral', `One more thing: Bai keeps a ledger in the office safe backstage. Get into it and she'll talk. Everyone's afraid of their own handwriting.`],
];

S.ch7_bai = [
  { music: 'sad' },
  `The private box is heavy with perfume and cigarette smoke. Madame Bai sits alone, watching the dancers below, a glass of champagne going flat in her hand. She doesn't turn around.`,
  { set: { metBai: true } },
  ['bai:neutral', `You dance like a girl who learned yesterday. Sit down before somebody notices. ...You're Su Ming's sister.`],
  ['lan:surprised', `How do you—`],
  ['bai:sad', `You have his eyes. I saw him at 76. Gu likes to take me on his "inspections". He likes me to see what happens to people who disappoint him.`],
  ['bai:neutral', `So. Chongqing sent you to kill me, or Yan'an sent you to buy me. Which?`],
  { choice: [
    { t: `Show her the ledger: "Every payment. Every name."`, need: 'flag:hasLedger', go: 'ledger' },
    { t: `"They took my brother. You know what 76 does to people."`, go: 'appeal' },
    { t: `(Lu's orders.) Kill her.`, go: 'kill' },
    { t: `Knock her out and search her purse.`, go: 'ko' },
  ] },
  { label: 'ledger' },
  ['bai:surprised', `...You opened my safe.`],
  ['bai:sad', `Then you read the last line. My sister was in their cells for a month. I bought her out one name at a time.`],
  ['bai:neutral', `Here. Gu's floor plan of Jessfield Road — the drain under the east wall, the cells, the records safe. You never got this from me.`],
  { give: 'floorplan_76' }, { set: { baiSpared: true, baiDone: true } }, { aff: { fang: 1 } }, { go: 'after' },
  { label: 'appeal' },
  ['bai:sad', `I know exactly what they do. That's why I do what I do.`],
  `She watches the dancers for a long time.`,
  ['bai:neutral', `...Your brother never said a word, you know. Not one. Gu was furious. I liked him for it.`],
  { give: 'floorplan_76' }, { set: { baiSpared: true, baiDone: true } },
  ['bai:neutral', `Go. Before I become sensible again.`], { go: 'after' },
  { label: 'kill' },
  `You step behind her chair. She sees your reflection in the champagne glass, and does not move.`,
  ['bai:sad', `...Chongqing, then. Make it quick, little sister. I'm so tired.`],
  { choice: [{ t: `Do it.`, go: 'dokill' }, { t: `...I can't.`, go: 'appeal' }] },
  { label: 'dokill' },
  `It is quick. Afterwards you sit beside her for a moment, like two friends watching the band. Then you take the folded floor plan from her purse and walk out.`,
  { give: 'floorplan_76' }, { set: { baiKilled: true, baiDone: true } }, { aff: { lu: 2, fang: -1 } }, { call: (G) => { G.state.kills++; } }, { go: 'after' },
  { label: 'ko' },
  `One quick, hard pressure beneath the ear, the way Lu showed you in the car. She slumps against the velvet. In her purse: a folded floor plan of Number 76.`,
  { give: 'floorplan_76' }, { set: { baiKO: true, baiDone: true } }, { call: (G) => { G.state.kos++; } }, { go: 'after' },
  { label: 'after' },
  { call: (G, W) => Story.fn.remove(W, 'bai') },
  { obj: `Get out through the back — past backstage to the kitchen door.` },
];

S.ch7_outro = [
  { bg: 'shanghai' }, { music: 'jazz' },
  `A rooftop above the Bund, near midnight. The river is full of lights — foreign gunboats, Japanese destroyers, sampans. Below, the band at the Paramount is still playing.`,
  ['lu:neutral', `Bai...?`],
  { if: 'flag:baiKilled', then: 'killed' }, { go: 'spared' },
  { label: 'killed' }, ['lan:sad', `It's done.`], ['lu:sad', `...I'm sorry I asked it of you. I'll carry it. Not you.`], { go: 'next' },
  { label: 'spared' }, ['lan:determined', `She's alive. She gave me what I needed.`], ['lu:neutral', `Dai Li won't like that.`], ['lan:smirk', `Dai Li has never heard of me.`], ['lu:laugh', `Ha! No. He hasn't.`], { go: 'next' },
  { label: 'next' },
  ['lu:neutral', `76 is a slaughterhouse, Su Lan. I can't go in with you. They know my face.`],
  { choice: [
    { t: `(Kiss him.)`, need: 'aff:lu>=4&!romance:han', lockText: 'Requires: a deep bond with Lu — and a free heart', go: 'kiss' },
    { t: `"Why do you do this work, Lu?"`, go: 'why', aff: { lu: 1 } },
    { t: `"Goodnight, Lu Zhiyuan."`, go: 'bye' },
  ] },
  { label: 'kiss' },
  `You kiss him, there above the Bund, while the gunboats' searchlights sweep the low clouds. He holds very still, like a man afraid of breaking something.`,
  ['lu:tender', `...That's a terrible idea. People like me don't get to keep things.`],
  ['lan:tender', `Then don't keep me. Just come back.`],
  { romance: 'lu' }, { ach: 'romance_lu' }, { aff: { lu: 2 } }, { go: 'end' },
  { label: 'why' },
  ['lu:sad', `My father was a schoolteacher in Hangzhou. He taught me that China was a poem written by four thousand years of stubborn people.`],
  ['lu:neutral', `In 1937 the Japanese shot him for refusing to bow to a sentry. So now I'm not a poem. I'm a pistol. Somebody has to be.`], { go: 'end' },
  { label: 'bye' }, ['lu:smirk', `Goodnight, kitchen girl.`], { go: 'end' },
  { label: 'end' },
  { fade: 'out', t: 1 }, { music: 'tense' },
  `The next morning, Fang Yu does not come to the printing shop.`,
  `Her typesetter says 76 raided the newspaper at dawn. They took everyone.`,
];

// ===========================================================================
// CHAPTER EIGHT — No. 76
// ===========================================================================
S.ch8_intro = [
  { bg: 'no76' }, { music: 'tense' }, { amb: 'rain' },
  { title: '76 Jessfield Road', kicker: 'Chapter Eight', place: 'Shanghai — October 1940', note: `No. 76 Jessfield Road, just outside the International Settlement, was the headquarters of the Wang regime's secret police, founded with Japanese backing by Ding Mocun and Li Shiqun. Its cells held Nationalist and Communist agents, journalists, and anyone else it chose.` },
  `Rain on the roofs of Jessfield Road. A grey villa behind a high wall topped with wire; a searchlight at the corner; dogs.`,
  ['lan_think:determined', `Bai's drain runs under the east wall. Cells on the ground floor. The records safe on the second: ten-twenty-two.`],
  ['lan_think:determined', `Ming was here. And now Fang is too.`],
  { if: 'flag:baiKilled', then: 'k' }, { go: 'nk' },
  { label: 'k' }, ['lan_think:sad', `Madame Bai's perfume is still on the paper.`],
  { label: 'nk' },
];

S.ch8_prisoner = [
  `A man lies on the floor of the cell, too beaten to sit up. His spectacles have no lenses.`,
  ['prisoner:pain', `...Water... no. No, you're not a guard. Who...?`],
  ['lan:worried', `I'm looking for Su Ming. The photographer.`],
  ['prisoner:pain', `Su... yes. He was in the next cell, August and September. They... worked on him. He never talked. We tapped messages through the wall at night.`],
  ['prisoner:sad', `A Japanese major came for him at the end of September. Took him to Nanjing. He tapped one last message: "Tell my sister — the brick." ...Are you the sister?`],
  ['lan:cry', `...Yes.`],
  ['prisoner:neutral', `Then look under his bunk. The loose brick. And get out before the night shift comes down.`],
  { obj: `Search Ming's old cell for the loose brick. Then find the records safe (second floor).` },
];

S.ch8_fang = [
  `Fang Yu is sitting on the floor of the cell with her back to the wall, beret gone, lip split. When she sees you she laughs — a cracked, astonished laugh.`,
  ['fang:surprised', `You. Of course it's you.`],
  ['lan:determined', `Can you walk?`],
  ['fang:determined', `I can run, I can write, and I can bite. Get me out of here.`],
  { call: (G, W) => Story.fn.follower(W, 'fang', { pal: 'fang', name: 'Fang Yu' }) },
  { set: { fang_rescued: true } }, { ach: 'fang_saved' }, { aff: { fang: 2 } },
  { obj: `Get Fang Yu out alive. [R] tells her to wait or follow.` },
];

S.ch8_outro = [
  { bg: 'shanghai' }, { music: 'sad' }, { amb: 'rain' },
  { letter: { title: 'Transfer Order', style: 'typed', text: Story.docs.transfer_order.text } },
  ['lan_think:sad', `The ceremony of 30 November. And afterwards — "dealt with".`],
  { set: { mingLead: 'Kempeitai, Nanjing — photographer for the 30 November ceremony' } },
  { if: 'flag:fang_rescued', then: 'fang' }, { go: 'nofang' },
  { label: 'fang' },
  ['fang:determined', `The treaty signing. Japan recognising Wang's government — with Ambassador Abe Nobuyuki himself. Every paper in the occupied zone is sending a photographer.`],
  ['fang:smirk', `Including mine. The Post's credentials were approved before they arrested us. They won't know your face.`],
  { give: 'press_pass' },
  ['fang:neutral', `Get your brother. And if he has what I think he has... bring it to me. The world should see.`], { go: 'end' },
  { label: 'nofang' },
  ['lan_think:sad', `Fang... I'm sorry. I couldn't reach you.`], { set: { fangLost: true } },
  { label: 'end' },
  ['lan_think:determined', `Nanjing. After a year, I'm going home.`],
];

// ===========================================================================
// CHAPTER NINE — Return to Jinling
// ===========================================================================
S.ch9_intro = [
  { bg: 'nanjing_snow' }, { music: 'sad' }, { amb: 'wind' },
  { title: 'Return to Jinling', kicker: 'Chapter Nine', place: 'Nanjing — November 1940', note: `In March 1940 Wang Jingwei's "Reorganized National Government" was inaugurated in Nanjing, claiming to be the true Republic of China. Real power remained with the Japanese army; the city was patrolled by Japanese troops, the Kempeitai and Wang's own police.` },
  `Snow came early this year. Nanjing lies beneath it like a body under a sheet.`,
  ['lan_think:sad', `A year ago I left through the water gate. I promised myself I'd come back with him.`],
  ['lan_think:determined', `"Remember the plum tree." Home, then — under curfew, through the snow.`],
];

S.ch9_home = [
  { music: 'memory' },
  `The door hangs from one hinge. Snow has drifted across the floor where your bed used to be. Someone has taken everything worth stealing, and most things that weren't.`,
  ['lan_think:sad', `Mother's chair. Father's books. The table where Ming taught me to develop pictures, and I spilled the fixer, and he pretended not to mind.`],
  { choice: [
    { t: `(Sit for a moment in the cold.)`, go: 'a', aff: { ming: 1 } },
    { t: `(Keep moving.)`, go: 'b' },
  ] },
  { label: 'a' }, `You sit on the floor in the snow-light, knees drawn up, the way you used to wait for him to come home. The old house creaks around you, as if it remembers too.`,
  { label: 'b' },
  ['lan_think:determined', `The loose floorboard by the back wall. And a lock with four numbers. "The year Father planted the plum tree."`],
  { obj: `Open Ming's cache beneath the floor. The plum tree in the courtyard may help.` },
  { music: 'sad' },
];

S.ch9_cache = [
  `Beneath the floorboard: a tin box wrapped in oilcloth. Inside, strips of negatives in paper sleeves, each dated in Ming's hand. December 13, 1937. December 14. December 15...`,
  `You hold a strip up to the grey window light. Tiny and reversed, the images are still unmistakable. The river. The walls. The bodies. Soldiers, laughing.`,
  { bg: 'nanjing_raid' },
  ['lan_think:cry', `This is what he carried. For three years. Alone.`],
  { letter: { title: 'Note in the tin box', text: `Lan-er — if you found this, forgive me for not telling you. These are the originals. They took everything else from Nanjing; they will not take this.\n\nKageyama knows they exist. He was here in '37 — a lieutenant then. He is in some of these pictures.\n\nIf I can't, get them out. To the foreign press, to anyone who will look. Let the world see.\n\n— M.` } },
  { bg: null },
  { set: { hasNegatives: true } },
  ['lan_think:determined', `Kageyama is in the pictures. That's why he'll never stop.`],
  { obj: `Leave the old quarter. Someone is waiting at the ruined temple ahead...` },
];

S.ch9_xu = [
  { music: 'tense' },
  `Lanterns in a ruined temple courtyard. Beneath them, stamping his feet against the cold, stands a familiar soft-handed man.`,
  ['xu:smirk', `Little Miss Chongqing! I knew you'd come home. Everyone comes home to Nanjing, eventually.`],
  ['xu:neutral', `You found them, didn't you? The negatives. Give them to me and I'll tell you where they're keeping your brother tonight. Gu pays me, Kageyama gets his pictures, you get your brother. Everybody wins.`],
  { choice: [
    { t: `Show him his own note: "You were going to let me lead you to them."`, need: 'doc:xu_note', go: 'note' },
    { t: `Kill him. He sold Ming.`, go: 'kill' },
    { t: `Let him go.`, go: 'mercy' },
    { t: `Knock him out and tie him up.`, go: 'ko' },
  ] },
  { label: 'note' },
  ['xu:surprised', `...Ah. My own handwriting. Careless of me.`],
  ['lan:angry', `Kageyama. Where is he keeping Ming?`],
  ['xu:worried', `...Kempeitai headquarters — the old courthouse. The top-floor cells. After the ceremony tomorrow he... won't need him any more.`],
  ['xu:sad', `I never wanted him hurt, you know. I only wanted money. Everyone in this city only wants to live.`],
  { set: { xuInterrogated: true } },
  { choice: [{ t: `Kill him.`, go: 'kill' }, { t: `Let him go.`, go: 'mercy' }, { t: `Knock him out.`, go: 'ko' }] },
  { label: 'kill' },
  `He sees it in your face before you move. He doesn't run.`,
  `Afterwards the snow keeps falling on the temple steps as if nothing had happened.`,
  { set: { xuKilled: true } }, { call: (G, W) => { G.state.kills++; Story.fn.remove(W, 'xu'); } }, { go: 'end' },
  { label: 'mercy' },
  ['lan:neutral', `Go. Leave Nanjing. If I see you again, I won't be this kind.`],
  ['xu:surprised', `...You're letting me go?`],
  ['xu:neutral', `...Then I owe you, Su Lan. Old Xu pays his debts. You'll see.`],
  { set: { xuSpared: true } }, { call: (G, W) => Story.fn.flee(W, 'xu', 175) }, { go: 'end' },
  { label: 'ko' },
  `One blow, and he folds into the snow. You bind his hands with his own scarf and leave him against the temple wall, where the morning patrol will find him and ask him some very awkward questions.`,
  { set: { xuKO: true } }, { call: (G, W) => { G.state.kos++; Story.fn.remove(W, 'xu'); } }, { go: 'end' },
  { label: 'end' },
  { if: 'flag:xuSpared&flag:baiSpared', then: 'merc' }, { go: 'fin' },
  { label: 'merc' }, { ach: 'mercy' },
  { label: 'fin' },
  { complete: true },
];

S.ch9_outro = [
  { bg: 'nanjing_snow' }, { music: 'sad' }, { amb: 'wind' },
  `A newspaper tumbles along the empty street. You catch it: tomorrow, 30 November 1940, at the Government Hall, the Sino-Japanese Basic Treaty will be signed. Ambassador Abe Nobuyuki. Chairman Wang Jingwei. "A new dawn for East Asia."`,
  ['lan_think:determined', `Ming is supposed to photograph it. And then be "dealt with".`],
  { if: 'item:press_pass', then: 'press' }, { go: 'np' },
  { label: 'press' }, ['lan_think:neutral', `Fang's press credentials. I can walk in the front door.`], { go: 'e' },
  { label: 'np' }, ['lan_think:neutral', `No credentials. I'll get in the way I've got into everything else — through the shadows.`],
  { label: 'e' },
];

// ===========================================================================
// CHAPTER TEN — The Puppet's Palace
// ===========================================================================
S.ch10_intro = [
  { bg: 'palace' }, { music: 'tense' }, { amb: 'wind' },
  { title: 'The Puppet\'s Palace', kicker: 'Chapter Ten', place: 'Nanjing — 30 November 1940', note: `On 30 November 1940 Japan formally recognised Wang Jingwei's regime by signing the Sino-Japanese Basic Treaty in Nanjing, with former Prime Minister Abe Nobuyuki as envoy. In return, Wang's government accepted Japanese troops on Chinese soil. In Chongqing, Chiang Kai-shek put a price on Wang's head.` },
  `Flags everywhere: the Rising Sun, and the Republic's flag with its humiliating yellow pennant. Newsreel cameras. Men in morning coats and dress uniforms. Snow on the steps of the Government Hall.`,
  ['lan_think:determined', `Ming should be here, with the photographers. Find him. Get him out before the ceremony ends.`],
];

S.ch10_fang = [
  ['fang:worried', `Lan! He's not here. I asked every photographer in the pool — a Kempeitai car took "the Nanjing photographer" away last night. Kageyama's orders.`],
  ['fang:neutral', `And there's a man from Chongqing in the building. I saw him go up the servants' stairs. Trench coat. Far too handsome for his own good.`],
  ['lan:surprised', `Lu.`],
  ['fang:determined', `Whatever he's doing up there, it's going to be loud.`],
  { obj: `Find out what Lu is doing in the east attic upstairs.` },
];

S.ch10_lu = [
  { music: 'tense' },
  `The attic above the east hall. Dust, pigeons, and a round window overlooking the courtyard where, in a few minutes, Wang Jingwei will step out to greet the Japanese ambassador.`,
  `Lu Zhiyuan kneels at the window with a rifle.`,
  ['lu:surprised', `Su Lan. ...Of course. Of course you're here.`],
  ['lan:worried', `Lu — what are you doing?`],
  ['lu:neutral', `My job. The Boss wants Wang dead on the day he sells China. It would make a lovely newsreel.`],
  ['lu:sad', `And you should know the rest. Your brother — Su Ming has worked for us since 1938. That file you stole was bait for the Japanese. He's been our man inside Wang's Propaganda Ministry. He got me the ceremony plans.`],
  ['lan:surprised', `...Ming is Juntong?`],
  ['lu:neutral', `He's the bravest man I know. And if Wang dies today, the Kempeitai will know exactly who gave us those plans. They'll kill him within the hour.`],
  { choice: [
    { t: `"If you shoot, Ming dies. Please — stand down."`, go: 'plead' },
    { t: `"Then shoot. Ming would want you to."`, go: 'shoot' },
    { t: `Knock the rifle away.`, go: 'grab' },
  ], timer: 10, timeout: 0 },
  { label: 'plead' },
  { if: 'aff:lu>=3|romance:lu', then: 'stand' },
  ['lu:stern', `Orders are orders, Su Lan.`], { go: 'grab' },
  { label: 'stand' },
  `He looks at you for a long moment. Then he lifts his cheek from the stock.`,
  ['lu:sad', `...I told you people like me don't get to keep things. I'm going to be court-martialled for you.`],
  { set: { luStoodDown: true } }, { aff: { lu: 1 } }, { go: 'after' },
  { label: 'grab' },
  { timing: { speed: 3.6, at: 0.5, size: 0.15 }, win: 'grabok', fail: 'grabbad', text: 'Knock the rifle aside!' },
  { label: 'grabok' },
  `You slam into him just as he squeezes the trigger. The shot goes into the sky; pigeons explode off the roof. Below, nobody even looks up — the brass band drowns everything.`,
  ['lu:angry', `Damn it, Su Lan!`], ['lu:sad', `...Damn it. You're right. You're right.`], { set: { luStoodDown: true } }, { go: 'after' },
  { label: 'grabbad' },
  `Too late. The rifle cracks. In the courtyard, a Japanese aide beside Wang spins and falls; Wang himself is bundled inside by his guards, untouched. Whistles. Screaming.`,
  ['lu:stern', `Missed. Go. GO!`], { set: { assassinationTried: true } }, { go: 'after' },
  { label: 'shoot' },
  `Lu breathes out slowly and fires. At the last instant Wang turns to shake an official's hand; the bullet takes the Japanese aide behind him. Wang is hustled inside, untouched. The courtyard erupts.`,
  ['lu:stern', `...Missed. The old fox has the devil's own luck. Get out, Su Lan!`], { set: { assassinationTried: true } }, { go: 'after' },
  { label: 'after' },
  ['lu:neutral', `If you get Ming out — Xiaguan, the river docks. There'll be a boat. I'll see to it.`],
  { call: (G, W) => Story.fn.remove(W, 'lu') },
  { if: 'flag:assassinationTried', then: 'alarm' }, { go: 'fin' },
  { label: 'alarm' }, { call: (G, W) => { for (const e of W.enemies) if (e.alive) e.wary = true; } }, { obj: `The whole building is roused. Get down to the winter garden — someone out there knows where Ming is.` }, { end: true },
  { label: 'fin' },
  { obj: `Go down to the winter garden. Someone is standing alone out there.` },
];

S.ch10_wang = [
  { music: 'sad' }, { bg: 'garden' },
  `The winter garden behind the Government Hall. Plum trees in early blossom, red against the snow. A slight, handsome man in a dark overcoat stands alone among them, hands clasped behind his back, looking at nothing.`,
  { set: { metWang: true } },
  ['wang:sad', `You are not one of my secretaries. ...Nor, I think, one of Chongqing's assassins. They are rarely so young, and never so sad.`],
  ['wang:neutral', `Wang Zhaoming. Jingwei, if you prefer. The man the newspapers call a traitor. Sit with me a moment. Everyone else wants something.`],
  { choice: [
    { t: `"Where is my brother? Su Ming, the photographer."`, go: 'ming' },
    { t: `"You are a traitor."`, go: 'traitor' },
    { t: `Recite his poem: "Let me take the blade in one swift stroke..."`, need: 'doc:wang_poem', go: 'poem' },
    { t: `Show him the negatives from December 1937.`, need: 'item:negatives', go: 'neg' },
  ] },
  { label: 'traitor' },
  ['wang:sad', `Yes. That is what they will write.`],
  ['wang:neutral', `Chiang trades space for time and lets the countryside burn. I thought — I still think — that someone must speak to the Japanese, so that fewer Chinese die. Someone must be willing to be hated.`],
  ['wang:sad', `Perhaps I was wrong. History will decide. It is very rarely kind to men like me.`], { go: 'ming' },
  { label: 'poem' },
  ['lan:determined', `"I sang with passion in the market of Yan; now I am a calm prisoner of Chu. Let me take the blade in one swift stroke — and not fail this young head of mine."`],
  `He closes his eyes.`,
  ['wang:sad', `I was twenty-six. I had a bomb under a bridge and a head full of glory. They sentenced me to death, and I was not afraid.`],
  ['wang:cry', `I am fifty-seven now. I am afraid all the time.`],
  { ach: 'poet' }, { set: { wangMoved: true } }, { go: 'gift' },
  { label: 'neg' },
  `You unfold a strip of negatives and hold it against the white sky. He leans closer. After a moment, he goes very pale.`,
  ['wang:sad', `...I know what happened here in December 1937. Of course I know. Every one of my ministers knows. We do not say it aloud.`],
  ['wang:stern', `Put them away. If Kageyama learns you carry those, nothing on earth will save you.`], { set: { wangMoved: true } }, { go: 'gift' },
  { label: 'gift' },
  `He takes a small notebook from his coat, writes a few lines in a flowing, beautiful hand, and presses his personal seal to the page.`,
  ['wang:neutral', `A safe-conduct. It means less than it should in this city — the Japanese do not ask my permission for anything. But some of the soldiers at the Kempeitai are Chinese, from my army. It may make them hesitate.`],
  { give: 'wang_pass' },
  { label: 'ming' },
  ['wang:neutral', `The photographer? Kageyama took him last night to the Kempeitai headquarters — the old courthouse. My people asked for his release. The Major did not reply.`],
  ['wang:sad', `Go quickly. Kageyama does not keep prisoners once he has finished with them.`],
  { set: { wangMet: true, mingLead: 'Kempeitai HQ, Nanjing (the old courthouse)' } },
  `A secretary calls from the doorway: "Chairman — Ambassador Abe is waiting." Wang straightens his coat, arranges his face into a smile, and walks back toward the cameras.`,
  { call: (G, W) => Story.fn.remove(W, 'wang') }, { bg: null },
  { obj: `Leave through the garden gate. The Kempeitai headquarters — tonight.` },
];

S.ch10_outro = [
  { bg: 'nanjing_snow' }, { music: 'tense' }, { amb: 'wind' },
  `Night falls on treaty day. Fireworks over the Government Hall, drunken toasts, a newsreel crew filming the lanterns.`,
  ['lan_think:determined', `The Kempeitai headquarters. Tonight, or never.`],
  { if: 'flag:luStoodDown', then: 'lu' }, { go: 'x' },
  { label: 'lu' }, ['lan_think:neutral', `Lu said there'd be a boat at Xiaguan. I have to believe him.`], { go: 'y' },
  { label: 'x' }, ['lan_think:neutral', `Lu said there'd be a boat at Xiaguan — if they haven't caught him.`],
  { label: 'y' },
];

// ===========================================================================
// CHAPTER ELEVEN — The House of Shadows
// ===========================================================================
S.ch11_intro = [
  { bg: 'prison' }, { music: 'tense' }, { amb: 'wind' },
  { title: 'The House of Shadows', kicker: 'Chapter Eleven', place: 'Kempeitai Headquarters, Nanjing — December 1940', note: `The Kempeitai, Japan's military police, ran the occupied cities through informers, arrests and torture. Their prisoners — resisters, suspects, and people simply in the wrong place — often vanished without record.` },
  `The old courthouse on a dark street. Barbed wire, a floodlit yard, a flag hanging limp in the snow. Somewhere inside, your brother.`,
  { set: { metKageyama: true } },
  ['lan_think:determined', `Top-floor cells. The duty officer carries the key.`],
];

S.ch11_ming = [
  { music: 'memory' },
  `He is sitting against the cell wall with his eyes closed. Thinner. Bruised. His glasses cracked across one lens. For a moment you think he is dead.`,
  ['lan:cry', `...Ming?`],
  `His eyes open.`,
  { set: { mingLook: 'ming_prison' } },
  ['ming:surprised', `...Lan-er?`],
  ['ming:cry', `No. No, no, no — you idiot, you stubborn little idiot — what are you DOING here?`],
  ['lan:cry', `You said within the month. You're very late.`],
  `He laughs, and it turns into something else, and you hold on to each other in the dark of the cell like two children in a storm.`,
  { aff: { ming: 2 } },
  { choice: [
    { t: `Treat his wounds with the sulfa powder.`, need: 'item:medicine', go: 'heal' },
    { t: `"Can you walk?"`, go: 'walk' },
  ] },
  { label: 'heal' },
  `You clean the worst of the cuts and pack them with sulfa powder and fresh bandages. He hisses through his teeth, then breathes easier.`,
  { take: 'medicine' }, { set: { mingHealed: true } }, { aff: { ming: 1 } },
  ['ming:tender', `Where did my little sister learn to be a nurse?`], ['lan:smirk', `On a train. Long story.`], { go: 'talk' },
  { label: 'walk' },
  ['ming:pain', `Slowly. Very slowly. They were... thorough.`],
  { label: 'talk' },
  { if: 'flag:luStoodDown|flag:assassinationTried', then: 'knows' }, { go: 'tell' },
  { label: 'knows' },
  ['lan:neutral', `Lu told me. About you. The Juntong.`],
  ['ming:sad', `Lu talks too much. ...I wanted to tell you at the water gate. I couldn't.`], { go: 'neg' },
  { label: 'tell' },
  ['ming:sad', `Lan-er, you should know something. That file you stole is a lie. I work for Chongqing. I have since '38 — inside Wang's ministry.`],
  ['lan:surprised', `You're a spy.`], ['ming:smirk', `A very tired one.`],
  { label: 'neg' },
  ['ming:worried', `The negatives — did you find the plum tree?`],
  { if: 'item:negatives', then: 'has' }, { go: 'hasnot' },
  { label: 'has' }, ['lan:determined', `They're here. Next to my heart.`], ['ming:tender', `...Then it was worth it.`], { go: 'go' },
  { label: 'hasnot' }, ['lan:sad', `...No. I couldn't get to them.`], ['ming:sad', `Then they're still safe under the floor. Kageyama will never find them. That's something.`],
  { label: 'go' },
  ['ming:determined', `Kageyama comes back at dawn. Let's not be here.`],
  { call: (G, W) => Story.fn.follower(W, 'ming', { pal: 'ming_prison', name: 'Ming', slow: G.flags.mingHealed ? 1 : 0.62 }) },
  { set: { mingFreed: true } },
  { obj: `Get Ming out through the compound's back gate. He's slow — protect him. [R] wait/follow.` },
];

S.ch11_gate = [
  { music: 'tense' },
  `The back gate stands open onto the snowy street. Too easy. Then a car's headlights snap on, blinding, and a figure steps into their glare.`,
  ['kageyama:smirk', `Miss Su Lan. At last. You have your brother's eyes — and his terrible habit of going where he is not wanted.`],
  `Major Kageyama Ren. Neat moustache, round spectacles, a sword at his hip and a pistol already in his hand. Two soldiers flank the car.`,
  ['kageyama:neutral', `I was a lieutenant in this city in December 1937. Your brother photographed my men. He photographed me. Tokyo would find those pictures... embarrassing, now that we are building a New Order with our Chinese friends.`],
  ['kageyama:stern', `Give me the negatives, and I will let you both walk to the river. You have my word as an officer.`],
  { choice: [
    { t: `Show Wang Jingwei's safe-conduct to his soldiers.`, need: 'item:wang_pass', go: 'wang' },
    { t: `Offer him the negatives for Ming's life.`, need: 'item:negatives', go: 'bargain' },
    { t: `Signal Old Xu.`, need: 'flag:xuSpared', go: 'xu' },
    { t: `Attack him.`, go: 'attack' },
  ], timer: 15, timeout: 3 },
  { label: 'wang' },
  `You hold up the page so the headlights catch the red seal. One of the soldiers — a Chinese conscript in the puppet army's uniform — freezes.`,
  ['soldier:worried', `That's... that's Chairman Wang's own seal, Major—`],
  ['kageyama:angry', `Wang's seal is worth less than the paper it's on! Shoot them!`],
  `The conscript hesitates a heartbeat too long — and his rifle drifts, just slightly, toward the Major.`, { go: 'attack' },
  { label: 'xu' },
  `You raise your hand. Somewhere in the dark a fuse box sparks, and every light in the compound dies at once. In the blackness a familiar voice hisses: "This way, Miss Chongqing! Old Xu pays his debts!"`,
  ['kageyama:angry', `—Light! Get me light!`],
  `You and Ming stumble through a side door that Xu is holding open. Behind you, Kageyama is shouting at the dark.`,
  { set: { kageyamaAlive: true, gateDone: true } }, { go: 'end' },
  { label: 'bargain' },
  ['ming:angry', `Lan — no! Don't you dare!`],
  `You take the tin box from inside your coat. Kageyama smiles for the first time.`,
  { choice: [{ t: `Give him the negatives.`, go: 'give' }, { t: `...No. Never.`, go: 'attack' }] },
  { label: 'give' },
  `He opens the box, holds a strip up to the headlights, and nods. A soldier pours petrol over the tin. A match flares.`,
  `December 1937 burns in the snow, in a small bonfire at your feet.`,
  { take: 'negatives' }, { set: { bargain: true, kageyamaAlive: true, gateDone: true } }, { aff: { ming: -3 } },
  ['kageyama:neutral', `A sensible girl. Go, then. My word is good — for tonight.`],
  ['ming:cry', `...Three years. Three years I kept them.`], { go: 'end' },
  { label: 'attack' },
  { timing: { speed: 3.8, at: 0.5, size: 0.14, limit: 5 }, win: 'win', fail: 'lose', text: 'Close the distance before he fires!' },
  { label: 'win' },
  `You're inside his reach before the pistol comes up. His shot goes into the snow; your knife does not miss.`,
  `Major Kageyama Ren sits down slowly against the car, looking faintly surprised, as though someone had broken a rule of etiquette. Then he is still.`,
  { set: { kageyamaDead: true, gateDone: true } }, { ach: 'kageyama' }, { call: (G) => { G.state.kills++; } },
  `His soldiers throw down their rifles and run.`, { go: 'end' },
  { label: 'lose' },
  { die: 'kageyama' },
  { label: 'end' },
  { obj: `Out through the gate. Go!` },
];

S.ch11_outro = [
  { bg: 'river_night' }, { music: 'sad' }, { amb: 'river' },
  `You run through the sleeping city with your brother's arm across your shoulders, through alleys you knew as a child, toward the river.`,
  ['ming:pain', `Lan-er... when we were small, and you got lost at the Lantern Festival... I found you by the river. Remember?`],
  ['lan:sad', `I remember. You bought me a sugar rabbit.`],
  ['ming:smirk', `And you ate the ears first. Monster.`],
  `Ahead lie the warehouses of Xiaguan, the black water — and somewhere on it, a boat.`,
];

// ===========================================================================
// CHAPTER TWELVE — The River of Farewell
// ===========================================================================
S.ch12_intro = [
  { bg: 'river_night' }, { music: 'tense' }, { amb: 'river' },
  { title: 'The River of Farewell', kicker: 'Chapter Twelve', place: 'Xiaguan Docks, Nanjing — December 1940', note: `Xiaguan, Nanjing's riverfront, was where tens of thousands tried to flee across the Yangtze in December 1937 — and where many of them died. Three years later the docks were patrolled day and night.` },
  `The last night. The docks of Xiaguan, where three years ago the river ran red.`,
  ['ming:neutral', `Patrols every few minutes. A searchlight on the quay. The boat should be at the end of the long pier.`],
  ['lan:determined', `Then that's where we're going. Together this time.`],
];

S.ch12_final = [
  { music: 'sad' }, { bg: 'river_dawn' },
  `The end of the pier. A junk rocks on the black water, its patched sail furled, a single lantern at the stern. Dawn is greying the sky over the far bank.`,
  { if: 'romance:lu', then: 'lu' }, { if: 'romance:han', then: 'han' }, { if: 'flag:luStoodDown', then: 'lu' }, { go: 'boatman' },
  { label: 'lu' },
  `A man in a trench coat stands at the tiller, collar up, cigarette glowing.`,
  ['lu:smirk', `Took you long enough. I was starting to think you'd found a better boat.`], { set: { boatBy: 'lu' } }, { go: 'ambush' },
  { label: 'han' },
  `A broad-shouldered man in a grey padded coat jumps down from the deck onto the pier, grinning like a fool.`,
  ['han:happy', `Told you. Only talent.`], ['lan:cry', `Han! How—`], ['han:smirk', `The Chairman's letter. The dockworkers' underground does whatever that handwriting tells them.`], { set: { boatBy: 'han' } }, { go: 'ambush' },
  { label: 'boatman' },
  `An old boatman nods from the stern. He asks no questions. Nobody on this river asks questions any more.`, { set: { boatBy: 'boatman' } },
  { label: 'ambush' },
  { if: 'flag:kageyamaAlive&!flag:bargain', then: 'shot' }, { go: 'choose' },
  { label: 'shot' },
  `A car door slams on the quay behind you. Boots on the planks. A voice, calm and polite:`,
  ['kageyama:angry', `Su Ming! You will not leave this city with those pictures in your head!`],
  { timing: { speed: 4, at: 0.5, size: 0.14, limit: 5 }, win: 'saved', fail: 'hit', text: 'Push Ming out of the line of fire!' },
  { label: 'saved' },
  `You throw yourself against Ming and you both go down on the planks. The bullet splinters the rail where his head had been.`,
  { if: 'flag:boatBy=lu', then: 'lushoots' }, { if: 'flag:boatBy=han', then: 'hanshoots' }, { go: 'poleman' },
  { label: 'lushoots' }, `A second shot, from the boat. Kageyama drops his pistol and falls to his knees on the quay. Lu lowers his gun.`, ['lu:stern', `That was for Nanjing.`], { set: { kageyamaDead: true } }, { go: 'choose' },
  { label: 'hanshoots' }, `Han fires from the deck. Kageyama spins and falls, and the soldiers behind him scatter into the dark.`, ['han:stern', `For my village.`], { set: { kageyamaDead: true } }, { go: 'choose' },
  { label: 'poleman' }, `Kageyama's pistol jams in the cold. He curses, fumbling — and the old boatman swings his pole and knocks him off the quay into the freezing Yangtze.`, { set: { kageyamaDead: true } }, { go: 'choose' },
  { label: 'hit' },
  `The shot. Ming jerks and falls against you.`,
  { if: 'flag:mingHealed', then: 'survive' }, { go: 'dies' },
  { label: 'survive' },
  `Blood on his shoulder — but the bandages from the cell hold, and he is breathing, swearing, alive.`,
  ['ming:pain', `...Still here. Still annoying you.`],
  `From the boat someone fires back. Kageyama falls to his knees on the icy planks and does not get up.`, { set: { kageyamaDead: true } }, { go: 'choose' },
  { label: 'dies' },
  `You drag him into the boat. The junk swings out into the current. On the quay, Kageyama holsters his pistol and watches you go, and does not bother to fire again.`,
  ['ming:pain', `Lan-er... the jade...`],
  `He presses his half of the pendant into your palm. You fit the two halves together. They still match.`,
  ['ming:tender', `See? ...We found each other.`],
  ['lan:cry', `Ming. Ming, stay awake. Please — we're on the river, we're going home—`],
  ['ming:closed', `...Sugar rabbit... ears first...`],
  { set: { mingDead: true } }, { complete: true },
  { label: 'choose' },
  { music: 'ending' },
  ['ming:neutral', `Lan-er. Before we go — where are we going?`],
  { choice: [
    { t: `Send the negatives into the world with Fang Yu. Then go home together.`, need: 'item:negatives&flag:fang_rescued', go: 'jade', lockText: 'Requires: the negatives & Fang Yu\'s freedom' },
    { t: `Upriver to Chongqing — the Generalissimo's pass will carry us.`, need: 'item:chiang_pass|aff:lu>=4', go: 'blue', lockText: 'Requires: Chiang\'s pass or Lu\'s trust' },
    { t: `North to Yan'an, with Han.`, need: 'item:mao_letter&aff:han>=4', go: 'red', lockText: 'Requires: Mao\'s letter and Han\'s trust' },
    { t: `"You want to stay, don't you, Ming?"`, go: 'mole' },
  ], prompt: 'Where does the river take you?' },
  { label: 'jade' }, { set: { finalChoice: 'jade' } }, { complete: true },
  { label: 'blue' }, { set: { finalChoice: 'blue' } }, { complete: true },
  { label: 'red' }, { set: { finalChoice: 'red' } }, { complete: true },
  { label: 'mole' },
  ['ming:sad', `...Someone has to stay inside, Lan-er. Wang's ministry trusts me. Chongqing needs eyes in Nanjing. If I leave now, three years of lies were for nothing.`],
  { choice: [{ t: `"Then stay. And come home when it's over."`, go: 'molego' }, { t: `"No. I didn't cross China to leave you here."`, go: 'choose2' }] },
  { label: 'choose2' }, ['ming:sad', `...Then choose for us, Lan-er. I'll follow.`],
  { choice: [
    { t: `Send the negatives into the world with Fang Yu. Then go home together.`, need: 'item:negatives&flag:fang_rescued', go: 'jade', lockText: 'Requires: the negatives & Fang Yu\'s freedom' },
    { t: `Upriver to Chongqing.`, need: 'item:chiang_pass|aff:lu>=4', go: 'blue', lockText: 'Requires: Chiang\'s pass or Lu\'s trust' },
    { t: `North to Yan'an, with Han.`, need: 'item:mao_letter&aff:han>=4', go: 'red', lockText: 'Requires: Mao\'s letter and Han\'s trust' },
    { t: `(You have no other road.) Let him stay.`, go: 'molego' },
  ] },
  { label: 'molego' }, { set: { finalChoice: 'mole' } }, { complete: true },
];

// ===========================================================================
// ENDINGS
// ===========================================================================
S.ending_jade = [
  { bg: 'river_dawn' }, { music: 'ending' }, { amb: 'river' },
  { title: 'Two Halves of Jade', kicker: 'Ending', dur: 4.5 },
  `The junk slides out into the Yangtze as the sun comes up over Purple Mountain. Ming sits in the stern wrapped in a blanket, and you sit beside him, and for a long time neither of you says anything at all.`,
  `In Wuhu, a printer from the underground takes a tin box from your hands and does not ask what is inside. Six weeks later, in Hong Kong, Fang Yu lays prints from Ming's negatives on the desks of the foreign correspondents.`,
  `They run in newspapers from London to San Francisco under a two-letter byline: "S.M., Nanjing".`,
  { if: 'romance:han', then: 'han' }, { if: 'romance:lu', then: 'lu' }, { go: 'solo' },
  { label: 'han' }, `In the spring a letter reaches you in Chongqing, in a clumsy, earnest hand: "The loess is green. The sky is still big. I have written four self-criticisms about you. Come north when you can. — Han Tie." You keep it under your pillow.`, { go: 'end' },
  { label: 'lu' }, `Lu Zhiyuan walks into Auntie Qin's teahouse one foggy morning in March, thinner, with a new scar and no explanation. He orders two cups of tea and slides one across the table. "Something to come back for," he says.`, { go: 'end' },
  { label: 'solo' }, `You go back to Auntie Qin's teahouse and help carry trays down to the tunnels whenever the sirens sound. Ming teaches you to use his new camera.`,
  { label: 'end' },
  `On the first clear night of spring you and Ming climb to the top of the Shibati steps. He takes his half of the jade from his collar; you take yours. They still fit.`,
  ['ming:tender', `See? We found each other.`],
  ['lan:happy', `You're very late, you know.`],
  `The war will last four and a half more years. But the pictures are out in the world now, where no one can ever burn them.`,
  { fade: 'out', t: 2 },
];

S.ending_blue = [
  { bg: 'chongqing_fog' }, { music: 'ending' }, { amb: 'city' },
  { title: 'Blue Sky, White Sun', kicker: 'Ending', dur: 4.5 },
  `Upriver, through the Three Gorges, with the Generalissimo's name on a folded paper in your pocket and your brother asleep against your shoulder.`,
  `In Chongqing, Dai Li receives Su Ming in the same cellar office where he once threatened to have you shot. He pins a medal on him. Then he asks when Ming will be ready to go back to Nanjing.`,
  ['ming:sad', `...Never, sir.`],
  `Dai Li smiles the way a closed door smiles. You never learn what that costs your brother. He never tells you.`,
  { if: 'item:negatives', then: 'neg' }, { go: 'x' },
  { label: 'neg' }, `The negatives go into a government vault. In 1947, at the Nanjing War Crimes Tribunal, a set of prints marked "S.M." is entered into evidence. Ming sits in the gallery and does not look away.`,
  { label: 'x' },
  { if: 'romance:lu', then: 'lu' }, { go: 'y' },
  { label: 'lu' }, `Lu Zhiyuan is court-martialled for disobeying orders at the Government Hall. He is sentenced to "reflect upon his conduct" in a Chongqing office, stamping papers. He says it is the happiest punishment of his life, because the office is two streets from your teahouse.`,
  { label: 'y' },
  `The bombs keep falling on the fog city until 1943. You carry trays down to the tunnels and carry the wounded out, and every night your brother comes home.`,
  { fade: 'out', t: 2 },
];

S.ending_red = [
  { bg: 'yanan' }, { music: 'yanan' },
  { title: 'The Long Road North', kicker: 'Ending', dur: 4.5 },
  `North, then — through the Taihang Mountains with the dockworkers' underground, across the blockade line by moonlight, back to the yellow earth and the enormous sky.`,
  `Han Tie meets you at the Yan River ford. He doesn't say anything. He just picks you up off your feet and spins you around until you both fall into the water.`,
  `Ming becomes a photographer for the Eighth Route Army. He photographs soldiers, schoolteachers, peasants learning to read. He makes the Chairman stand still again, for thirty minutes this time.`,
  ['mao:laugh', `Your brother is more dangerous than the Japanese air force.`],
  { if: 'item:negatives', then: 'neg' }, { go: 'x' },
  { label: 'neg' }, `The Nanjing negatives leave Yan'an in the luggage of a foreign journalist bound for Hong Kong. The world sees them.`,
  { label: 'x' },
  `In the evenings you spin cotton with Han, badly, and he tells you it is the finest thread in the Border Region. It is a lie. You let him tell it.`,
  `The war will go on for years, and after it, another war. But tonight the loess is gold, the sky is big, and everyone you love is here.`,
  { fade: 'out', t: 2 },
];

S.ending_mole = [
  { bg: 'river_night' }, { music: 'sad' }, { amb: 'river' },
  { title: 'The Man Who Stayed', kicker: 'Ending', dur: 4.5 },
  `He stands on the pier as the boat pulls away, hands in his pockets, collar up against the snow — the way he stood at the water gate a year ago. This time he is smiling.`,
  ['ming:tender', `Chongqing! Save me a seat at Auntie Qin's!`],
  `Su Ming goes back to the Propaganda Ministry of the Reorganized National Government. He takes official photographs of Wang Jingwei and his ministers. He sends copies of their secrets to Chongqing, hidden in tins of tea.`,
  `Every few months a parcel reaches the teahouse on the Shibati steps with no return address. Inside, always, a photograph: the plum tree in blossom, the Qinhuai river full of lanterns, a sugar rabbit with its ears bitten off.`,
  `Wang Jingwei dies in a hospital in Nagoya in November 1944. Japan surrenders in August 1945.`,
  `In September a thin man in cracked spectacles climbs the Shibati steps, sits down at the corner table, and orders two cups of tea.`,
  ['ming:happy', `Sorry. I'm very late.`],
  { fade: 'out', t: 2 },
];

S.ending_ashes = [
  { bg: 'river_dawn' }, { music: 'sad' }, { amb: 'river' },
  { title: 'Ashes on the Yangtze', kicker: 'Ending', dur: 4.5 },
  `You bury your brother on the far bank of the Yangtze, where the ground is soft, beneath a wild plum tree that has not yet flowered.`,
  `The boatman digs. You cannot. Afterwards he stands beside you with his hat in his hands, and says the only thing anyone can say.`,
  ['boatman:sad', `The river takes everyone in the end, girl. But not today. Not you.`],
  `You wear both halves of the jade now, on one cord. They knock together when you walk, like someone keeping you company.`,
  { if: 'item:negatives', then: 'neg' }, { go: 'x' },
  { label: 'neg' }, `The negatives reach Hong Kong in the spring. The newspapers print them under the name he chose: "S.M., Nanjing." Whatever else they took, they did not take that.`,
  { label: 'x' },
  `In the spring the plum tree flowers. You are there to see it.`,
  { fade: 'out', t: 2 },
];

S.ending_bargain = [
  { bg: 'river_dawn' }, { music: 'sad' }, { amb: 'river' },
  { title: 'The Collaborator\'s Price', kicker: 'Ending', dur: 4.5 },
  `Kageyama keeps his word. The boat leaves Xiaguan unmolested. You are both alive.`,
  `Ming does not speak to you for three days. On the fourth, somewhere in the Three Gorges, he says only:`,
  ['ming:sad', `I know why you did it. I will never forgive you. Both of those things are true.`],
  `Major Kageyama is promoted in the spring. There is no photograph of him in December 1937 anywhere in the world.`,
  `In 1946, when the war crimes tribunals convene in Nanjing, they have other witnesses and other evidence. But not Ming's.`,
  `One morning in Chongqing you wake to find him gone north, without a goodbye. On your pillow lies his half of the jade.`,
  `You keep it. You wait. Maybe some things can still be found again.`,
  { fade: 'out', t: 2 },
];

S.epilogue_secret = [
  { bg: 'epilogue' }, { music: 'heroic' },
  { title: 'August 1945', kicker: 'Epilogue', sub: 'Every memory found', dur: 5 },
  `On 15 August 1945 the Emperor's voice crackles over the radio, telling his people to "endure the unendurable". Japan has surrendered.`,
  `Chongqing goes mad. Firecrackers, gongs, people weeping and dancing on the Shibati steps, strangers embracing strangers. Auntie Qin gives away every cup of tea in the house.`,
  `Two weeks later, on 28 August, an American plane lands at Chongqing's airfield, and Mao Zedong steps down to negotiate with Chiang Kai-shek. The two men who once each asked you the same question — "why should I trust you?" — shake hands for the cameras.`,
  `In the crowd of photographers pressing forward, a thin man in mended spectacles lifts his camera.`,
  ['ming:smirk', `Hold still, Chairman. Just for a moment.`],
  `It will not last. Peace never does. Within a year there will be another war.`,
  `But tonight, on the top of the steps, two halves of a jade pendant fit together in the light of the fireworks.`,
  { memory: 'p12' },
];
