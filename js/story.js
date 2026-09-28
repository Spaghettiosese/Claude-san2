'use strict';
// ---------------------------------------------------------------------------
// Story data: characters, items, documents, memories, chapters, endings.
// Scene scripts live in scenes.js.
// ---------------------------------------------------------------------------
const Story = {
  names: {
    lan: 'Su Lan', ming: 'Su Ming', lu: 'Lu Zhiyuan', han: 'Han Tie', fang: 'Fang Yu', qin: 'Auntie Qin', mori: 'Mori Takeshi',
    chiang: 'Chiang Kai-shek', mao: 'Mao Zedong', zhou: 'Zhou Enlai', wang: 'Wang Jingwei', dai: 'Dai Li', kageyama: 'Major Kageyama',
    bai: 'Madame Bai', xu: 'Old Xu', courier: 'Wounded Courier', soldier: 'Soldier', guard: 'Guard', agent: '76 Agent', inspector: 'Kempeitai Inspector',
    aide: 'Madame Chiang\'s Aide', cook: 'Old Cook', farmer: 'Old Farmer', granny: 'Granny Liu', prisoner: 'Prisoner', clerk: 'Juntong Clerk', colhu: 'Colonel Hu',
    boatman: 'Boatman', mp: 'Military Police', officer: 'Officer', ccpguard: 'Sentry', radio: 'Radio',
  },
  portraitAlias: {
    soldier: 'jp_soldier', guard: 'kmt', mp: 'kmt', agent: 'agent', courier: 'civ', aide: 'civ_f', cook: 'civ', farmer: 'civ', granny: 'qin',
    prisoner: 'prisoner', clerk: 'civ', colhu: 'kmt', inspector: 'jp_soldier', boatman: 'civ', officer: 'jp_soldier', ccpguard: 'ccp_guard', radio: 'civ',
  },

  items: {
    jade_half: { name: 'Half of a Jade Pendant', desc: 'Mother\'s pale green pendant, broken cleanly in two the winter she died. You wear one half. Ming wears the other. "So we can always find each other," she said.' },
    ming_film: { name: 'Ming\'s Film Canister', desc: 'A roll of 35mm film in Ming\'s handwriting: 金陵 · Dec. 1937. He never let you see what was on it.' },
    juntong_file: { name: 'Juntong File #3317: Su Ming', desc: 'Stolen from Dai Li\'s archive. It calls Ming a traitor — and recommends his "elimination".' },
    blank_pass: { name: 'Blank Travel Pass', desc: 'A Military Affairs Commission travel pass, unsigned.' },
    chiang_pass: { name: 'The Generalissimo\'s Pass', desc: 'A travel pass signed in Chiang Kai-shek\'s own brush: "Grant passage. — 蔣中正". Soldiers of the Nationalist army will salute it.' },
    forged_pass: { name: 'Lu\'s Forged Pass', desc: 'Lu Zhiyuan\'s forgery of a Commission pass. Good enough for a tired sentry. Probably.' },
    zhou_letter: { name: 'Zhou Enlai\'s Letter', desc: 'A letter of introduction from Zhou Enlai at the Eighth Route Army liaison office in Chongqing, addressed to Yan\'an.' },
    mao_letter: { name: 'Mao Zedong\'s Letter', desc: 'A few lines in Mao Zedong\'s sprawling calligraphy asking the Party underground in occupied cities to help "Comrade Su Lan and her brother".' },
    study_key: { name: 'Study Key', desc: 'The key to the private wing at Yunxiu Lodge, lifted from Colonel Hu.' },
    cell_key: { name: 'Cell Key', desc: 'A heavy iron key to the cells.' },
    medicine: { name: 'Sulfa Powder & Bandages', desc: 'Precious sulfanilamide powder and clean bandages. It could save a life.' },
    mori_papers: { name: 'Kempeitai Transit Papers', desc: 'Travel orders stamped by the Kempeitai for "Army Nurse Sato Haruko". Mori stole them in Shijiazhuang.' },
    guard_key: { name: 'Guard Car Key', desc: 'Key to the guard car at the front of the train.' },
    floorplan_76: { name: 'Floor Plan of No. 76', desc: 'Madame Bai\'s sketch of 76 Jessfield Road: the drain under the east wall, the cell block, and the records safe — "combination: the Director\'s lucky number, 1022".' },
    cell_keys_76: { name: 'Jailer\'s Keys (76)', desc: 'The ring of keys to the cells of No. 76.' },
    transfer_order: { name: 'Transfer Order', desc: 'The order that sent Ming from 76 to the Kempeitai in Nanjing.' },
    negatives: { name: 'Ming\'s Nanjing Negatives', desc: 'Strips of negatives Ming hid under the floor. December 1937. Proof of what was done to Nanjing. Kageyama will kill for them.' },
    press_pass: { name: 'Fang Yu\'s Press Credentials', desc: 'Press credentials for the treaty ceremony, issued to Fang Yu\'s paper. With them you can walk the Government Hall openly.' },
    wang_pass: { name: 'Wang Jingwei\'s Safe-Conduct', desc: 'A note in Wang Jingwei\'s elegant hand, sealed with his personal seal: "The bearer is under my protection."' },
    han_compass: { name: 'Han\'s Brass Compass', desc: 'Han Tie\'s battered compass. "Bring it back to me," he said.' },
    lu_lighter: { name: 'Lu\'s Silver Lighter', desc: 'An engraved Ronson lighter. Lu pressed it into your hand: "So you owe me something."' },
  },

  docs: {
    ming_notebook: { title: 'Ming\'s Notebook', flag: 'learnedJapanese', text: 'Scraps in Ming\'s small, quick hand:\n\nJapanese — say it right, Lan-er, it might save your life:\n  "Tomodachi desu" — I am a friend.\n  "Sumimasen" — excuse me.\n  "Wakarimashita" — I understand.\n\nIf anything happens, go to Chongqing. Auntie Qin, the teahouse at Shibati.\n\nAnd if you ever need what I keep safe, remember the year Father planted the plum tree.\n\nDon\'t come to the studio. Promise me.' },
    juntong_memo: { title: 'Memo: "S.M." Photographs', style: 'typed', flag: 'knowsXinhua', text: 'MILITARY STATISTICS BUREAU — INTERNAL\n\nRe: photographs credited "S.M." in the Communist XINHUA DAILY, Chongqing edition, April 1940. Subjects: Yan\'an schools, Eighth Route Army. Source believed to be the photographer SU MING (see file 3317).\n\nThe Eighth Route Army liaison office at Hongyan Village refuses comment. Recommend surveillance of Zhou Enlai\'s visitors.' },
    juntong_file: { title: 'File #3317 — SU MING', style: 'typed', text: 'SUBJECT: SU MING, b. 1916, Nanjing. Photographer. Former student, University of Nanking.\n\n1937: Remained in Nanjing after its fall. Suspected of photographing Japanese atrocities.\n12/1939: Detained by Kempeitai, Nanjing. Released after 9 days.\n03/1940: Observed at inauguration of Wang Jingwei\'s "Reorganized National Government", photographing for the puppet Propaganda Ministry.\n\nASSESSMENT: Collaborator (hanjian).\nRECOMMENDATION: Elimination at first opportunity.\n\n[stamp] APPROVED — D.L.' },
    secretary_note: { title: 'Secretary\'s Note', text: 'Remember: the new safe in the study. The Generalissimo chose the combination himself — the year the Qing fell, of course. He never lets us forget it.\n\nMadame\'s American guests at nine. Tea for the Time correspondent. No photographs of the bomb shelter.' },
    sun_testament: { title: 'Dr. Sun Yat-sen\'s Testament (framed)', text: '"For forty years I have devoted myself to the cause of the people\'s revolution, with but one end in view: to raise China to a position of freedom and equality among the nations...\n\nThe work of the Revolution is not yet done. Let all our comrades follow my writings... and strive on earnestly for its consummation."\n\n— Sun Yat-sen, 1925' },
    archive_log: { title: 'Archive Cave Log', text: 'Photographic archive, Yangjialing.\n\nReceived March 1940 from comrade S.M.: 2 rolls, Nanjing Dec. 1937 (copy prints only — originals held by S.M.). 1 roll, Yan\'an schools.\n\nVisitors this month: Xu Fuliang (supply officer, transferred from Xi\'an) — 3 times, "inventory".\n\nNote: S.M. insists the originals must never leave his hands. He said the man who wants them is a Japanese major.' },
    xu_note: { title: 'Old Xu\'s Coded Note', text: 'To Section Chief Gu, Jessfield Road:\n\nThe photographer\'s sister has come to Yan\'an asking questions. She is clever and does not frighten. Recommend we let her find her way east. She will lead us to the originals — the ones Major Kageyama wants.\n\nThe brother remains at 76. Do not let the Kempeitai take him before we have the negatives.\n\n— X.' },
    bai_note: { title: 'Note in the Dressing Room', text: 'Remind Ah-Mei: the little safe upstairs uses the same number as always — my debut at the Paramount, the thirteenth of May. Don\'t tell Gu. Don\'t tell ANYONE.' },
    bai_ledger: { title: 'Madame Bai\'s Ledger', style: 'typed', flag: 'hasLedger', text: 'Payments received, No. 76 (Section Chief Gu):\n  Mar — 500 yuan (names: Liu, Zhang — Juntong, French Concession)\n  May — 800 yuan (the printing shop on Avenue Joffre)\n  Aug — 1,200 yuan (the photographer\'s contacts)\n\nIn another hand, underlined twice: "I did this to keep my sister out of the cells. God forgive me."' },
    ming_letter: { title: 'Letter Behind the Brick', text: 'Lan-er,\n\nIf you are reading this, you are braver than I ever was and far more stubborn, and I am in a great deal of trouble for having taught you to be.\n\nI am not what they say I am. I cannot write more.\n\nThey want the pictures from December 1937. They will never have them. Remember the plum tree.\n\nGo home to Chongqing. Please.\n\n— Your brother, who is sorry about the kite.' },
    li_memo: { title: 'Memo from the Director', style: 'typed', text: 'FROM: Li Shiqun\nTO: all section chiefs\n\nThe Japanese Kempeitai (Maj. Kageyama) demands custody of prisoner SU. Refuse politely. We will not be treated as their errand boys — Director Ding already complains that Tokyo trusts us less than a dog.\n\nIf Kageyama insists, transfer the prisoner to Nanjing — but NOT before we have the negatives.\n\nBurn after reading.' },
    transfer_order: { title: 'Transfer Order', style: 'typed', text: 'PRISONER: SU MING\nFROM: Jessfield Road (76)\nTO: Kempeitai Nanjing Branch, by order of Maj. KAGEYAMA Ren.\n\nRemarks: Prisoner cooperative. Assigned as official photographer for the ceremony of 30 November (signing of the Basic Treaty; Ambassador ABE Nobuyuki attending).\nAfter the ceremony: prisoner to be "dealt with" at the Major\'s discretion.' },
    wang_poem: { title: 'Poem in Wang Jingwei\'s Hand', text: 'Written on fine paper, framed on the wall — a poem the young Wang Zhaoming wrote in a Qing prison in 1910, awaiting execution for trying to assassinate the Prince Regent:\n\n慷慨歌燕市，從容作楚囚。\n引刀成一快，不負少年頭。\n\n"I sang with passion in the market of Yan;\nnow I am a calm prisoner of Chu.\nLet me take the blade in one swift stroke —\nand not fail this young head of mine."\n\nBeneath it, in a shakier, older hand: 「今日之我…」 — "The man I am today..."' },
    kageyama_report: { title: 'Report to Tokyo (draft)', style: 'typed', text: 'To: Kempeitai Command, via the Ume Kikan (Col. Kagesa)\nCopy: War Ministry (Gen. Tojo)\n\nThe negatives of the so-called "Nanjing incident" remain unrecovered. Foreign newspapers must not obtain them. The prisoner SU refuses to disclose their location.\n\nWang\'s ministers ask for his release. The ceremony of 30 November must proceed without embarrassment; afterward, the prisoner is of no further use.\n\n— Maj. Kageyama Ren' },
  },

  photos: {
    p0: { title: 'The Studio, 1936', art: 'home', figures: ['ming', 'lan'], text: 'Ming set the timer and ran back to stand beside you. The shutter clicked before he got there. The photograph shows his elbow, his laughing face — and you, fourteen, scolding him.' },
    p1: { title: 'The Kite, 1931', art: 'chongqing_fog', figures: ['lan', 'ming'], text: 'The red swallow kite snagged in the city wall\'s willow. Ming climbed for it and tore it in half. He apologised for a whole year.' },
    p2: { title: 'Mother\'s Garden', art: 'huangshan', figures: ['lan'], text: 'Mother\'s chrysanthemums, the autumn before she fell ill. She split her jade pendant the winter after: "One for each of you. So you can always find each other."' },
    p3: { title: 'The Road North', art: 'loess_night', figures: ['ming'], text: 'Ming at nineteen, with his first camera, pointing it at the sky. "One day," he said, "I will photograph the whole of China."' },
    p4: { title: 'New Year\'s Dumplings', art: 'cave', figures: ['lan', 'ming'], text: 'Flour on both your faces. Father pretended to be angry about the mess. It was the last New Year all four of you were together.' },
    p5: { title: 'Graduation Day, 1937', art: 'nanjing_night', figures: ['ming'], text: 'Ming in his graduation gown at the University of Nanking, June 1937. One month later, the war began at the Marco Polo Bridge.' },
    p6: { title: 'The Shanghai Train, 1935', art: 'train', figures: ['lan', 'ming'], text: 'Your first trip to Shanghai. Ming bought you a caramel from a vendor on the platform and pretended the train was a dragon.' },
    p7: { title: 'The Bund at Night', art: 'shanghai', figures: ['ming'], text: 'Ming\'s photograph of the Bund\'s lights reflected in the river. On the back: "Some day, Lan-er, we\'ll dance here."' },
    p8: { title: 'Lantern Festival', art: 'nanjing_snow', figures: ['lan', 'ming'], text: 'The Qinhuai river full of paper lanterns. You made a wish. Ming made you tell him. You never did.' },
    p9: { title: 'The Plum Tree', art: 'garden', figures: ['lan'], text: 'Father\'s plum tree in blossom, late winter. "The plum flowers in the snow," he used to say, "because it is too stubborn not to."' },
    p10: { title: 'Snowball War, 1936', art: 'nanjing_snow', figures: ['lan', 'ming'], text: 'You won. Ming claims otherwise to this day.' },
    p11: { title: 'December 1937', art: 'nanjing_raid', figures: ['ming'], text: 'The only photograph of Ming from that winter: thin, grey-faced, a camera hidden in his coat. He never talked about those weeks. Now you understand why.' },
    p12: { title: 'Two Halves', art: 'river_dawn', figures: ['lan', 'ming'], text: 'Taken by Mother, the day she gave you the pendant. Two children, two halves of jade, one promise.' },
  },

  people: [
    { id: 'lan', name: 'Su Lan 苏岚', role: 'Protagonist, 18', bio: 'Born in Nanjing in 1922. She survived the fall of the city in 1937 with her brother, hiding in the Ginling College refuge. Stubborn, quick, and far braver than she believes.' },
    { id: 'ming', name: 'Su Ming 苏明', role: 'Her brother, photographer, 24', aff: 'ming', bio: 'A photographer who stayed in Nanjing in 1937 and documented what he saw. Missing since December 1939. Called a traitor by Chongqing, a comrade by Yan\'an, and a prize by the Kempeitai.' },
    { id: 'lu', name: 'Lu Zhiyuan 陆志远', role: 'Juntong agent', aff: 'lu', cond: 'aff:lu>=0&flag:metLu', bio: 'An agent of Dai Li\'s Military Statistics Bureau (Juntong). Charming, cynical, and far more idealistic than he lets anyone see.' },
    { id: 'han', name: 'Han Tie 韩铁', role: 'Eighth Route Army scout', aff: 'han', cond: 'flag:metHan', bio: 'A scout from a Hebei village burned in 1938. Earnest, stubborn and kind. He believes in the Communist cause the way other men believe in the sunrise.' },
    { id: 'fang', name: 'Fang Yu 方雨', role: 'Journalist, Shanghai', aff: 'fang', cond: 'flag:metFang', bio: 'A reporter for a resistance newspaper in Shanghai\'s International Settlement — the "Solitary Island". Fearless with a pen, less so with a gun.' },
    { id: 'qin', name: 'Auntie Qin', role: 'Teahouse owner, Chongqing', cond: 'flag:metQin', bio: 'Your late mother\'s oldest friend. She runs a teahouse on the Shibati steps and knows everyone\'s business.' },
    { id: 'mori', name: 'Mori Takeshi 森武', role: 'Japanese deserter', aff: 'mori', cond: 'flag:metMori', bio: 'A private from Nagano who deserted after what he saw in China and joined the Japanese anti-war movement in Yan\'an. He travelled east with Ming.' },
    { id: 'chiang', name: 'Chiang Kai-shek 蔣介石', role: 'Generalissimo, Republic of China (historical)', cond: 'flag:metChiang', bio: 'Leader of the Nationalist government, which moved its wartime capital to Chongqing after Nanjing fell in 1937. Rigid, proud and tireless, he refused every Japanese demand to surrender. In 1945 he negotiated with Mao in Chongqing; civil war followed, and in 1949 he retreated to Taiwan.' },
    { id: 'mao', name: 'Mao Zedong 毛泽东', role: 'Chairman, Chinese Communist Party (historical)', cond: 'flag:metMao', bio: 'Leader of the Communists at Yan\'an, where he lived in a cave dwelling at Yangjialing and wrote much of his political theory. The Communists and Nationalists were nominally allied in a "United Front" against Japan, while blockading and distrusting one another. In 1949 he proclaimed the People\'s Republic.' },
    { id: 'zhou', name: 'Zhou Enlai 周恩来', role: 'CCP representative in Chongqing (historical)', cond: 'flag:metZhou', bio: 'The Communists\' chief negotiator with the Nationalists, based at the Eighth Route Army office at Hongyan (Red Crag) village in Chongqing. Famously urbane; later Premier of the People\'s Republic.' },
    { id: 'wang', name: 'Wang Jingwei 汪精衛', role: 'Head of the Reorganized National Government (historical)', cond: 'flag:metWang', bio: 'Once Sun Yat-sen\'s favoured disciple and a revolutionary hero who tried to assassinate the Qing Prince Regent in 1910. In 1938 he broke with Chiang, and in March 1940 he became head of a Japanese-sponsored government in Nanjing. He died in Nagoya in 1944, remembered by most Chinese as the archetypal hanjian — traitor.' },
    { id: 'dai', name: 'Dai Li 戴笠', role: 'Chief of the Juntong (historical)', cond: 'flag:metDai', bio: 'Head of the Nationalist secret service, the Military Statistics Bureau, and Chiang\'s feared spymaster. His agents fought the Japanese and the Wang regime with assassinations and sabotage — and hunted Communists. He died in a plane crash in 1946.' },
    { id: 'kageyama', name: 'Major Kageyama Ren', role: 'Kempeitai, Nanjing (fictional)', cond: 'flag:metKageyama', bio: 'A Kempeitai officer attached to the Japanese handlers of the Wang regime. Patient, precise, and utterly without mercy. He wants Ming\'s negatives destroyed before the world can see them.' },
    { id: 'bai', name: 'Madame Bai', role: 'Singer, Shanghai (fictional)', cond: 'flag:metBai', bio: 'A celebrated nightclub singer and the mistress of a No. 76 section chief. Everyone buys her secrets; nobody knows what she buys with the money.' },
    { id: 'xu', name: 'Old Xu', role: 'Spy (fictional)', cond: 'flag:metXu', bio: 'A friendly supply officer in Yan\'an. Actually an agent of the Wang regime\'s secret police.' },
  ],

  achievements: {
    first_steps: { name: 'Ashes of Jinling', desc: 'Escape occupied Nanjing.' },
    ghost: { name: 'Ghost', desc: 'Finish a chapter without raising an alert.' },
    pacifist_ghost: { name: 'Lantern in the Fog', desc: 'Finish a chapter unseen, without harming anyone.' },
    light_fingers: { name: 'Light Fingers', desc: 'Pick someone\'s pocket.' },
    the_film: { name: 'The Witness', desc: 'Show Ming\'s film to someone who can act on it.' },
    poet: { name: 'The Young Head', desc: 'Recite Wang Jingwei\'s poem back to him.' },
    fang_saved: { name: 'Stop the Presses', desc: 'Rescue Fang Yu from No. 76.' },
    mercy: { name: 'Mercy', desc: 'Spare both Madame Bai and Old Xu.' },
    kageyama: { name: 'Shadow Eclipsed', desc: 'Defeat Major Kageyama.', secret: true },
    romance_lu: { name: 'Blue Smoke', desc: 'Fall for Lu Zhiyuan.', secret: true },
    romance_han: { name: 'Iron and Jade', desc: 'Fall for Han Tie.', secret: true },
    all_photos: { name: 'Every Memory', desc: 'Find all 13 photographs.' },
    clean_hands: { name: 'Clean Hands', desc: 'Finish the story without killing anyone.' },
    persistent: { name: 'Fall Seven Times', desc: 'Die 25 times. Stand up 26.' },
    ending_jade: { name: 'Two Halves of Jade', desc: 'Reach the best ending.', secret: true },
    ending_blue: { name: 'Blue Sky, White Sun', desc: 'Go upriver to Chongqing.', secret: true },
    ending_red: { name: 'The Long Road North', desc: 'Go north to Yan\'an.', secret: true },
    ending_mole: { name: 'The Man Who Stayed', desc: 'Let Ming stay behind.', secret: true },
    ending_ashes: { name: 'Ashes on the Yangtze', desc: 'Lose Ming.', secret: true },
    ending_bargain: { name: 'The Collaborator\'s Price', desc: 'Pay Kageyama\'s price.', secret: true },
  },

  endingList: [
    { id: 'jade', name: 'Two Halves of Jade', hint: 'Ming alive, the negatives sent to the world with Fang Yu.', lock: 'Needs: the negatives, Fang Yu rescued, and Ming alive.' },
    { id: 'blue', name: 'Blue Sky, White Sun', hint: 'Upriver to Chongqing, under the Generalissimo\'s pass.', lock: 'Needs: the Generalissimo\'s pass or Lu\'s trust.' },
    { id: 'red', name: 'The Long Road North', hint: 'North to Yan\'an with Han Tie.', lock: 'Needs: Mao\'s letter and Han\'s trust.' },
    { id: 'mole', name: 'The Man Who Stayed', hint: 'Ming chose to remain in Nanjing as a spy.', lock: 'Let Ming make his own choice.' },
    { id: 'ashes', name: 'Ashes on the Yangtze', hint: 'Ming did not survive the last night.', lock: 'A tragedy. Some wounds need medicine.' },
    { id: 'bargain', name: 'The Collaborator\'s Price', hint: 'You traded the truth for your brother\'s life.', lock: 'Offer Kageyama what he wants.' },
  ],

  flagHints: {
    learnedJapanese: 'Requires: words from Ming\'s notebook', xuSpared: 'Requires: having shown mercy to Old Xu', hasLedger: 'Requires: Madame Bai\'s ledger',
    fang_rescued: 'Requires: Fang Yu\'s freedom', luStoodDown: 'Requires: Lu\'s trust', negativesReturned: 'Requires: the stolen prints',
  },

  deathQuotes: [
    { q: 'The country is broken; the mountains and rivers remain.', a: 'Du Fu, 757' },
    { q: 'Of the thirty-six stratagems, running away is the best.', a: 'Chinese proverb' },
    { q: 'Let your plans be dark and impenetrable as night.', a: 'Sun Tzu, The Art of War' },
    { q: 'Be extremely subtle, even to the point of formlessness.', a: 'Sun Tzu, The Art of War' },
    { q: 'Fall seven times, stand up eight.', a: 'Japanese proverb' },
    { q: 'A journey of a thousand li begins beneath one\'s feet.', a: 'Laozi' },
    { q: 'It does not matter how slowly you go, so long as you do not stop.', a: 'attributed to Confucius' },
    { q: 'The plum blossom is fragrant because it has come through bitter cold.', a: 'Chinese saying' },
    { q: 'A single spark can start a prairie fire.', a: 'Mao Zedong, 1930' },
    { q: 'The palest ink is better than the sharpest memory.', a: 'Chinese proverb' },
    { q: 'When the tree falls, the monkeys scatter.', a: 'Chinese proverb' },
    { q: 'Even the tallest tower begins from the ground.', a: 'Laozi' },
  ],
  tips: [
    'Crouch [C] to move silently. Running is heard through walls.',
    'Guards see much less in darkness. Cut the power at a fuse box — but someone will come to fix it.',
    'Throw a stone [Q] to lure a guard away from his post.',
    'Prone [Z] in tall grass makes you invisible, even to searchlights.',
    'Bodies left in the light will be found. Drag them [E] into shadows or hiding spots.',
    'Hold [Space] while hidden to hold your breath when a soldier checks your hiding spot.',
    'If a soldier runs for the alarm bell, stop him before he reaches it — or cut the bell\'s wire beforehand.',
    'A guard who saw you hide will check that exact spot.',
    'You can ambush a guard walking past your hiding spot [F]/[V].',
    'Dogs smell you even when you hide. Firecrackers [T] send them running.',
    'Drop onto an unaware guard from above while holding [F] or [V].',
    'Gunfire alerts everyone in earshot. A rifle is a last resort.',
    'Snow keeps your footprints. Patrols will follow them.',
    'Some choices are locked unless you carry the right item or know the right thing. Explore.',
    'Officers and Kempeitai look closer at disguises. Keep your distance.',
  ],
  deathText: {
    shot: 'A single shot, and the long road ends here.',
    dog: 'The dog was faster.',
    fall: 'The ground came up too fast.',
    fire: 'The flames took you.',
    found: 'They found your hiding place.',
    tunnel: 'You didn\'t duck in time.',
    script: 'That was a mistake you cannot take back.',
    chiang: 'The Generalissimo\'s guards do not forgive insolence.',
    kageyama: 'Kageyama was quicker.',
  },

  radio: [
    '📻 "...This is XGOY, the Voice of China, broadcasting from Chongqing. The capital endures another night of bombing..."',
    '📻 "...General Zhang Zizhong has fallen in battle at Nanguadian. The nation mourns a hero..."',
    '📻 "...France has signed an armistice with Germany at Compiègne..."',
    '📻 "...Britain agrees to close the Burma Road for three months at Tokyo\'s demand..."',
    '📻 "...Prince Konoe forms a new cabinet in Tokyo, with General Tojo Hideki as Army Minister..."',
    '📻 "...Tokyo speaks of a New Order in Greater East Asia..."',
    '📻 (a woman singing "The Wandering Songstress" — 天涯歌女 — through heavy static)',
  ],

  // ------------------------------------------------------------------ chapters
  chapters: [
    { kicker: 'Prologue', name: 'Ashes of Jinling', place: 'Nanjing — December 1939', intro: 'pro_intro', outro: 'pro_outro', level: 'prologue', lanLook: 'lan_winter', art: 'nanjing_night', summary: 'Two years after the fall of Nanjing, the Kempeitai are hunting your brother.' },
    { kicker: 'Chapter One', name: 'The Fog Capital', place: 'Chongqing — June 1940', intro: 'ch1_intro', outro: 'ch1_outro', level: 'ch1', lanLook: 'lan', art: 'chongqing_raid', summary: 'Six months without a word from Ming. Now a whisper: Dai Li\'s secret police have a file on him.' },
    { kicker: 'Chapter Two', name: 'A Reception at Huangshan', place: 'Chongqing — July 1940', intro: 'ch2_intro', outro: 'ch2_outro', level: 'ch2', lanLook: 'lan_servant', art: 'huangshan', summary: 'To cross into occupied China you need a pass only the Generalissimo can sign.' },
    { kicker: 'Chapter Three', name: 'The Blockade Line', place: 'Shaanxi — August 1940', intro: 'ch3_intro', outro: 'ch3_outro', level: 'ch3', lanLook: 'lan', art: 'loess_night', summary: 'Ming\'s photographs came out of Yan\'an. Between you and Yan\'an: the Nationalist blockade.' },
    { kicker: 'Chapter Four', name: 'Red Caves', place: 'Yan\'an — August 1940', intro: 'ch4_intro', outro: 'ch4_outro', level: 'ch4', lanLook: 'lan', art: 'yanan', summary: 'In Yan\'an, Mao Zedong remembers your brother. That night, someone makes you look like a spy.' },
    { kicker: 'Chapter Five', name: 'The Hundred Regiments', place: 'Zhengtai Railway, Shanxi — 20 August 1940', intro: 'ch5_intro', outro: 'ch5_outro', level: 'ch5', lanLook: 'lan', art: 'railway', summary: 'The Eighth Route Army strikes every railway in North China. Somewhere in a blockhouse, the Japanese deserter who travelled with Ming waits to be shot.' },
    { kicker: 'Chapter Six', name: 'The Iron Rooster', place: 'The Tianjin–Pukou Railway — September 1940', intro: 'ch6_intro', outro: 'ch6_outro', level: 'ch6', lanLook: 'lan', art: 'train', summary: 'A stolen identity, a night train, and Han Tie in Kempeitai hands.' },
    { kicker: 'Chapter Seven', name: 'The Solitary Island', place: 'Shanghai — October 1940', intro: 'ch7_intro', outro: 'ch7_outro', level: 'ch7', lanLook: 'lan_qipao', art: 'ballroom', summary: 'Shanghai\'s foreign concessions: an island of jazz surrounded by occupation. A singer here knows where 76 keeps its prisoners.' },
    { kicker: 'Chapter Eight', name: '76 Jessfield Road', place: 'Shanghai — October 1940', intro: 'ch8_intro', outro: 'ch8_outro', level: 'ch8', lanLook: 'lan', art: 'no76', summary: 'The most feared address in China. If the bells ring, nobody leaves.' },
    { kicker: 'Chapter Nine', name: 'Return to Jinling', place: 'Nanjing — November 1940', intro: 'ch9_intro', outro: 'ch9_outro', level: 'ch9', lanLook: 'lan_winter', art: 'nanjing_snow', summary: 'Home, under snow and a puppet flag. Ming hid something beneath the floor.' },
    { kicker: 'Chapter Ten', name: 'The Puppet\'s Palace', place: 'Nanjing — 30 November 1940', intro: 'ch10_intro', outro: 'ch10_outro', level: 'ch10', lanLook: 'lan_winter', art: 'palace', summary: 'Today Japan formally recognizes Wang Jingwei\'s government. Ming was supposed to photograph it.' },
    { kicker: 'Chapter Eleven', name: 'The House of Shadows', place: 'Kempeitai Headquarters, Nanjing — December 1940', intro: 'ch11_intro', outro: 'ch11_outro', level: 'ch11', lanLook: 'lan_winter', art: 'prison', summary: 'Major Kageyama has Ming. By morning he will have no further use for him.' },
    { kicker: 'Chapter Twelve', name: 'The River of Farewell', place: 'Xiaguan Docks, Nanjing — December 1940', intro: 'ch12_intro', outro: null, level: 'ch12', lanLook: 'lan_winter', art: 'river_night', last: true, summary: 'One boat. One night. One river between you and freedom.' },
  ],

  defaultStateFor(i, G) {
    G.flags.learnedJapanese = true; G.flags.metQin = true;
    if (i >= 2) { G.give('juntong_file', 1, true); G.flags.metLu = true; G.flags.metDai = true; G.aff.lu = 1; }
    if (i >= 3) { G.give('forged_pass', 1, true); G.give('zhou_letter', 1, true); G.flags.metZhou = true; G.flags.metChiang = true; G.flags.metHan = true; }
    if (i >= 5) { G.give('mao_letter', 1, true); G.flags.metMao = true; G.aff.han = 2; G.flags.metXu = true; }
    if (i >= 6) { G.give('mori_papers', 1, true); G.flags.metMori = true; }
    if (i >= 8) { G.give('floorplan_76', 1, true); G.flags.metFang = true; G.flags.metBai = true; }
    if (i >= 10) { G.give('negatives', 1, true); }
    if (i >= 11) { G.flags.metWang = true; G.flags.wangMet = true; }
    if (i >= 12) { G.flags.mingFreed = true; G.flags.metKageyama = true; G.flags.kageyamaAlive = true; }
  },

  computeEnding(G) {
    const f = G.flags;
    if (f.mingDead) return 'ashes';
    if (f.bargain) return 'bargain';
    return f.finalChoice || 'mole';
  },

  credits: [
    { t: 'HALF OF JADE', h: true },
    { t: '半玉 · A Sister\'s War, 1939–1940', s: true },
    { t: 'A stealth adventure in twelve chapters and a prologue.' },
    { t: 'Design, writing, code, pixel art, portraits and music', h: true },
    { t: 'Built entirely in code — every sprite, portrait, painting and note of music is generated procedurally in the browser.' },
    { t: 'A note on history', h: true },
    { t: 'Su Lan, Su Ming, Lu Zhiyuan, Han Tie, Fang Yu, Mori Takeshi, Madame Bai, Old Xu and Major Kageyama are fictional. Chiang Kai-shek, Mao Zedong, Zhou Enlai, Wang Jingwei and Dai Li were real, and their words here are imagined — though drawn from what they wrote, said and did.' },
    { t: 'Nanjing fell to the Imperial Japanese Army on 13 December 1937. In the weeks that followed, Japanese troops massacred civilians and prisoners and committed mass rape; the dead numbered in the tens or hundreds of thousands. Foreigners such as John Rabe and Minnie Vautrin of Ginling College sheltered refugees in the Nanjing Safety Zone. Photographs smuggled out by Chinese and foreign witnesses became evidence at the postwar tribunals.' },
    { t: 'From 1938 to 1943 Japan bombed Chongqing, the wartime capital, more than two hundred times. On 20 August 1940 the Eighth Route Army under Peng Dehuai launched the Hundred Regiments Offensive against railways across North China. In March 1940 Wang Jingwei formed the "Reorganized National Government" in Nanjing; on 30 November 1940 Japan formally recognised it in a treaty signed with envoy Abe Nobuyuki.' },
    { t: 'The No. 76 headquarters on Jessfield Road in Shanghai, run by Ding Mocun and Li Shiqun, was notorious for torture and murder. Dai Li\'s Juntong waged a long war of assassination against it.' },
    { t: 'Japan surrendered on 15 August 1945. Fourteen million or more Chinese people are estimated to have died in the war.' },
    { t: 'In memory of all of them.', s: true },
    { t: 'Thank you for playing.', h: true },
  ],
};
Story.photoCount = Object.keys(Story.photos).length;
