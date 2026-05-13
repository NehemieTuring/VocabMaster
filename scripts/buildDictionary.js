/**
 * Script amélioré — Construit un dictionnaire EN→FR propre.
 * Utilise l'API LibreTranslate (open source, meilleure qualité).
 * Fallback sur MyMemory avec nettoyage automatique.
 * 
 * USAGE: node scripts/buildDictionary.js
 */
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'dictionary_full.json');

// Nettoyage d'une traduction brute
function cleanTranslation(word, raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim().toLowerCase();
  // Rejeter si identique au mot source
  if (t === word.toLowerCase()) return null;
  // Rejeter si contient des caractères bizarre ou trop long
  if (t.length > 40) return null;
  if (/[{}[\]<>]/.test(t)) return null;
  // Prendre seulement la première traduction si multiples
  if (t.includes('/')) t = t.split('/')[0].trim();
  if (t.includes(',')) t = t.split(',')[0].trim();
  // Supprimer articles inutiles en début
  t = t.replace(/^(le |la |l'|les |un |une |du |des |d')/i, '').trim();
  if (t.length < 1) return null;
  return t;
}

async function translateWord(word) {
  // Essai 1: LibreTranslate (instances publiques)
  const ltInstances = [
    'https://libretranslate.de',
    'https://translate.argosopentech.com',
  ];
  for (const base of ltInstances) {
    try {
      const res = await fetch(`${base}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: word, source: 'en', target: 'fr' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) return cleanTranslation(word, data.translatedText);
      }
    } catch (e) { /* next */ }
  }

  // Essai 2: MyMemory
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|fr`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return cleanTranslation(word, data.responseData.translatedText);
    }
  } catch (e) { /* ignore */ }

  return null;
}

// Liste de ~2000 mots anglais courants
const WORDS = [
  // Verbs
  "accept","achieve","act","add","admire","admit","advise","afford","agree","allow",
  "announce","apologize","appear","apply","appreciate","approach","approve","arrange",
  "arrive","ask","attack","attempt","avoid","bake","beat","become","begin","behave",
  "believe","belong","bite","blow","boil","borrow","break","breathe","bring","build",
  "burn","buy","calculate","call","cancel","care","carry","catch","celebrate","change",
  "chase","check","choose","claim","clean","climb","close","collect","come","communicate",
  "compare","compete","complain","complete","concentrate","confirm","connect","consider",
  "contain","continue","control","convince","cook","copy","correct","count","cover","crash",
  "create","cross","cry","cut","dance","dare","decide","deliver","demand","deny","depend",
  "describe","deserve","destroy","develop","die","dig","discover","discuss","divide","do",
  "doubt","drag","draw","dream","dress","drink","drive","drop","dry","earn","eat","educate",
  "embrace","encourage","enjoy","enter","escape","examine","exchange","excite","exercise",
  "exist","expect","experience","explain","explore","express","face","fail","fall","feed",
  "feel","fight","fill","find","finish","fix","fly","fold","follow","forbid","force",
  "forget","forgive","freeze","frighten","gather","get","give","go","grab","greet","grow",
  "guess","handle","hang","happen","hate","have","hear","help","hide","hit","hold","hope",
  "hug","hunt","hurry","hurt","imagine","impress","improve","include","increase","inform",
  "insist","install","intend","introduce","invent","invest","invite","involve","join","judge",
  "jump","keep","kick","kill","kiss","knock","know","lack","laugh","lay","lead","learn",
  "leave","lend","let","lie","lift","like","listen","live","look","lose","love","make",
  "manage","mark","matter","mean","measure","meet","mention","mind","miss","mix","move",
  "must","need","notice","obtain","occur","offer","open","order","organize","owe","own",
  "paint","park","pass","pay","perform","permit","pick","plan","play","point","pour",
  "practice","pray","prefer","prepare","present","pretend","prevent","produce","promise",
  "propose","protect","prove","provide","pull","punish","push","put","quit","raise","reach",
  "read","realize","receive","recognize","recommend","record","reduce","refuse","regret",
  "relate","relax","release","remain","remember","remind","remove","rent","repair","repeat",
  "replace","report","represent","request","require","rescue","respond","rest","retire",
  "return","reveal","ride","ring","rise","risk","rob","roll","run","rush","save","say",
  "scare","search","see","seem","sell","send","separate","serve","set","settle","shake",
  "shape","share","shine","shoot","shop","shout","show","shut","sign","sing","sit","sleep",
  "slip","smell","smile","solve","speak","spend","stand","start","stay","steal","stop",
  "stretch","study","succeed","suffer","suggest","supply","support","suppose","surprise",
  "survive","swim","take","talk","taste","teach","tear","tell","tend","test","thank","think",
  "throw","tie","touch","train","translate","travel","treat","trust","try","turn",
  "understand","unite","use","visit","vote","wait","wake","walk","want","warn","wash",
  "waste","watch","wear","weigh","win","wish","wonder","work","worry","write","yell",

  // Nouns - People
  "man","woman","child","boy","girl","baby","person","friend","enemy","neighbor","stranger",
  "king","queen","prince","princess","hero","soldier","police","doctor","nurse","teacher",
  "student","professor","lawyer","judge","artist","writer","singer","actor","dancer","player",
  "worker","farmer","driver","pilot","captain","president","scientist","engineer","manager",

  // Nouns - Family
  "family","mother","father","brother","sister","son","daughter","husband","wife","uncle",
  "aunt","cousin","grandfather","grandmother","parents",

  // Nouns - Body
  "body","head","face","eye","ear","nose","mouth","lip","tooth","tongue","neck","shoulder",
  "arm","elbow","hand","finger","chest","stomach","leg","knee","foot","toe","skin","bone",
  "blood","brain","heart","muscle",

  // Nouns - Nature
  "world","earth","land","ground","rock","stone","mountain","hill","valley","island","forest",
  "desert","field","garden","river","lake","ocean","sea","beach","wave","ice","snow","rain",
  "storm","wind","air","sky","cloud","sun","moon","star","fire","smoke","light","shadow",
  "tree","flower","grass","leaf","seed","plant","animal","dog","cat","bird","fish","horse",
  "cow","pig","sheep","rabbit","mouse","wolf","fox","bear","lion","tiger","elephant","monkey",
  "snake","insect","butterfly","bee","ant","spider",

  // Nouns - Food
  "food","meal","breakfast","lunch","dinner","bread","butter","cheese","milk","egg","meat",
  "chicken","rice","pasta","soup","salad","sauce","salt","pepper","sugar","honey","cake",
  "chocolate","candy","fruit","apple","banana","orange","grape","strawberry","lemon",
  "tomato","potato","onion","garlic","carrot","corn","bean","lettuce","mushroom","cucumber",
  "coffee","tea","juice","beer","wine","water",

  // Nouns - House
  "house","home","building","apartment","room","floor","wall","door","window","stairs",
  "roof","kitchen","bathroom","bedroom","garden","furniture","table","chair","desk","bed",
  "mirror","lamp","clock","oven",

  // Nouns - Clothing
  "clothes","shirt","sweater","jacket","coat","dress","skirt","pants","shoes","boot",
  "hat","scarf","glove","belt","tie","pocket","bag","wallet",

  // Nouns - Transport
  "car","bus","train","airplane","bicycle","truck","taxi","boat","ship","wheel","road",
  "street","bridge","station","airport","ticket","map","speed","traffic",

  // Nouns - City
  "city","town","village","country","park","market","store","shop","bank","hospital",
  "school","university","library","museum","theater","church","castle","restaurant","hotel",

  // Nouns - Work
  "work","job","business","company","office","meeting","salary","money","price","project",
  "plan","goal","success","experience","skill",

  // Nouns - Education
  "education","class","lesson","subject","science","history","literature","computer",
  "program","internet","data","research","exam","test","homework","book","knowledge",

  // Nouns - Communication
  "language","word","letter","sentence","text","page","story","news","phone","speech",
  "question","answer","opinion","idea","thought","truth","lie","secret","joke","promise",
  "advice","warning","meaning",

  // Nouns - Arts
  "art","music","song","dance","painting","film","movie","show","concert","instrument",
  "piano","guitar","sound","voice","color","shape","style","design","beauty","culture",
  "tradition","party","wedding","birthday","holiday","vacation","trip","game","sport",

  // Nouns - Emotions
  "love","hate","happiness","sadness","joy","anger","fear","surprise","hope","pride",
  "shame","courage","patience","kindness","freedom","justice","peace","war","truth",

  // Nouns - Time
  "time","day","night","morning","afternoon","evening","week","month","year","hour",
  "minute","second","moment","today","tomorrow","yesterday","season","spring","summer",
  "autumn","winter","century","past","present","future",

  // Adjectives
  "able","afraid","alone","angry","available","bad","beautiful","big","black","blue",
  "boring","brave","bright","broken","brown","busy","calm","careful","cheap","clean",
  "clear","clever","close","cold","comfortable","common","complete","confident","cool",
  "correct","crazy","creative","cruel","curious","cute","dangerous","dark","dead","dear",
  "deep","different","difficult","dirty","double","dry","eager","early","easy","electric",
  "elegant","empty","entire","equal","evil","exact","excellent","excited","expensive",
  "extreme","fair","faithful","familiar","famous","fantastic","far","fast","fat","final",
  "flat","foreign","formal","free","fresh","friendly","full","funny","future","general",
  "gentle","glad","global","golden","good","grand","grateful","great","green","grey",
  "guilty","handsome","happy","hard","healthy","heavy","helpful","high","holy","honest",
  "horrible","hot","huge","human","humble","hungry","ideal","ill","important","impossible",
  "impressive","incredible","independent","individual","innocent","intelligent","intense",
  "interesting","internal","invisible","jealous","joint","kind","large","last","late",
  "lazy","legal","likely","limited","little","live","local","lonely","long","loose",
  "loud","lovely","low","lucky","mad","magic","main","major","male","married","massive",
  "medical","mental","middle","military","minimum","minor","mobile","modern","moral",
  "mysterious","naked","narrow","national","natural","necessary","negative","nervous",
  "new","next","nice","normal","obvious","odd","official","old","open","opposite",
  "ordinary","original","painful","pale","particular","patient","perfect","permanent",
  "personal","physical","plain","pleasant","polite","poor","popular","positive","possible",
  "powerful","precious","pregnant","present","pretty","previous","private","professional",
  "proper","proud","public","pure","purple","quick","quiet","rare","raw","real","recent",
  "red","regular","related","reliable","religious","responsible","rich","right","romantic",
  "rough","round","royal","rude","rural","sacred","sad","safe","secret","secure","senior",
  "sensitive","serious","severe","shallow","sharp","short","shy","sick","significant",
  "silent","silly","similar","simple","single","slim","slow","small","smart","smooth",
  "social","soft","solid","sorry","special","stable","standard","steady","still","straight",
  "strange","strict","strong","stupid","successful","sudden","sufficient","suitable","super",
  "sure","surprised","sweet","tall","temporary","tender","terrible","thick","thin","tight",
  "tiny","tired","top","total","tough","traditional","true","typical","ugly","unable",
  "uncomfortable","unhappy","unique","unusual","upper","upset","urban","urgent","useful",
  "usual","valuable","violent","visible","visual","vital","warm","weak","wealthy","weird",
  "welcome","western","wet","whole","wide","wild","willing","wise","wonderful","wooden",
  "wrong","yellow","young",

  // Numbers
  "zero","one","two","three","four","five","six","seven","eight","nine","ten",
  "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen",
  "nineteen","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety",
  "hundred","thousand","million","billion","first","second","third",

  // Adverbs
  "about","above","across","actually","after","again","ago","ahead","almost","alone",
  "along","already","also","always","anyway","anywhere","around","away","back","badly",
  "barely","basically","before","behind","below","besides","between","beyond","briefly",
  "carefully","certainly","clearly","closely","completely","constantly","currently",
  "daily","deeply","definitely","directly","easily","effectively","elsewhere","enough",
  "entirely","especially","essentially","even","eventually","ever","everywhere","exactly",
  "extremely","fairly","finally","forever","fortunately","frequently","fully","generally",
  "gently","gradually","greatly","hardly","heavily","here","highly","honestly","hopefully",
  "however","immediately","indeed","inside","instead","just","largely","lately","later",
  "least","less","likely","literally","mainly","maybe","merely","moreover","mostly",
  "much","naturally","nearly","necessarily","never","nevertheless","next","normally",
  "obviously","occasionally","often","once","only","otherwise","outside","overall",
  "partly","perhaps","personally","physically","please","possibly","potentially",
  "previously","probably","properly","purely","quickly","quietly","quite","randomly",
  "rarely","rather","readily","really","recently","regularly","relatively","roughly",
  "sadly","seriously","significantly","silently","similarly","simply","slightly","slowly",
  "smoothly","so","softly","somehow","sometimes","somewhere","soon","specifically",
  "still","strongly","successfully","suddenly","surely","terribly","then","there",
  "therefore","thoroughly","though","through","thus","today","together","tomorrow",
  "tonight","too","totally","toward","truly","twice","typically","ultimately","unfortunately",
  "usually","very","virtually","well","widely","yesterday","yet",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('🔨 Construction du dictionnaire EN→FR');
  console.log(`📝 ${WORDS.length} mots à traiter\n`);

  let dict = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    dict = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    console.log(`📂 Existant: ${Object.keys(dict).length} mots\n`);
  }

  const remaining = WORDS.filter(w => !dict[w.toLowerCase()]);
  console.log(`🔄 ${remaining.length} mots restants\n`);

  let count = 0;
  for (const word of remaining) {
    const translation = await translateWord(word);
    if (translation) {
      dict[word.toLowerCase()] = translation;
      count++;
    }
    if (count % 25 === 0 && count > 0) {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dict, null, 2), 'utf-8');
      console.log(`  💾 [${count}] Sauvegardé (${Object.keys(dict).length} total)`);
    }
    await sleep(600);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dict, null, 2), 'utf-8');
  console.log(`\n✅ Terminé ! ${Object.keys(dict).length} mots dans ${OUTPUT_PATH}`);
}

main().catch(console.error);
